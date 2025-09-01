const axios = require('axios');

// Small helper: escape single quotes for OData filters and trim values
function sanitizeODataValue(v){
  if(v === null || v === undefined) return '';
  return String(v).replace(/'/g, "''").trim();
}

// Lightweight retry wrapper for axios requests. Retries on network errors and 5xx / 429 with backoff.
async function axiosWithRetry(config, attempts = 3, baseDelayMs = 300) {
  let lastErr;
  for(let i=0;i<attempts;i++){
    try{
      return await axios(config);
    }catch(err){
      lastErr = err;
      const status = err && err.response && err.response.status;
      // Retry on 5xx or 429 or network errors (no response)
      if(i < attempts - 1 && (!status || status >= 500 || status === 429)){
        const delay = baseDelayMs * Math.pow(2, i) + Math.floor(Math.random()*100);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

// Simple retry wrapper for axios requests (basic exponential backoff)
async function retryRequest(fn, attempts = 3, baseDelay = 200) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const delay = baseDelay * Math.pow(2, i);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

function sanitizeForOData(value) {
  if (value == null) return '';
  // Basic sanitization: escape single quotes by doubling them
  return String(value).replace(/'/g, "''");
}

class SharePointAdapter {
  // siteUrl: full SharePoint site URL
  // accessTokenProvider: optional function that returns a Promise resolving to a token string
  constructor(siteUrl, accessTokenProvider) {
    this.siteUrl = siteUrl;
    this.accessTokenProvider = accessTokenProvider; // async function () => token
    this.baseUrl = `${siteUrl}/_api/web/lists`;
  }

  async getListItems(listName, filter = '', select = '', orderBy = '') {
    try {
      if(!listName) throw new Error('listName is required')
      let url = `${this.baseUrl}/getbytitle('${listName}')/items`;
      const params = [];
      if (filter) params.push(`$filter=${filter}`);
      if (select) params.push(`$select=${select}`);
      if (orderBy) params.push(`$orderby=${orderBy}`);
      
      if (params.length > 0) {
        url += '?' + params.join('&');
      }

  const token = this.accessTokenProvider ? await this.accessTokenProvider() : null;
  // NOTE: accessTokenProvider may return null in dev; functions should gracefully handle this.
      const response = await axiosWithRetry({
        method: 'get',
        url,
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined,
          'Accept': 'application/json;odata=verbose',
          'Content-Type': 'application/json;odata=verbose'
        }
      });

      return response.data && response.data.d && response.data.d.results ? response.data.d.results : [];
    } catch (error) {
      console.error('Error getting SharePoint list items:', error && (error.message || error));
      throw error;
    }
  }

  async createListItem(listName, itemData) {
    try {
      const url = `${this.baseUrl}/getbytitle('${listName}')/items`;
      
  const token = this.accessTokenProvider ? await this.accessTokenProvider() : null;
  if(!token) console.debug('createListItem: no access token available, ensure msal_helper is configured')
      const response = await axiosWithRetry({
        method: 'post',
        url,
        data: itemData,
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined,
          'Accept': 'application/json;odata=verbose',
          'Content-Type': 'application/json;odata=verbose',
          'X-RequestDigest': await this.getRequestDigest()
        }
      });

      return response.data && response.data.d ? response.data.d : null;
    } catch (error) {
      console.error('Error creating SharePoint list item:', error && (error.message || error));
      throw error;
    }
  }

  async updateListItem(listName, itemId, itemData) {
    try {
      if(!itemId) throw new Error('itemId required for update')
      const url = `${this.baseUrl}/getbytitle('${listName}')/items(${itemId})`;
      
  const token = this.accessTokenProvider ? await this.accessTokenProvider() : null;
  if(!token) console.debug('updateListItem: no access token available, ensure msal_helper is configured')
      await axiosWithRetry({
        method: 'post',
        url,
        data: itemData,
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined,
          'Accept': 'application/json;odata=verbose',
          'Content-Type': 'application/json;odata=verbose',
          'X-RequestDigest': await this.getRequestDigest(),
          'X-HTTP-Method': 'MERGE',
          'IF-MATCH': '*'
        }
      });

      return true;
    } catch (error) {
      console.error('Error updating SharePoint list item:', error && (error.message || error));
      throw error;
    }
  }

  async getRequestDigest() {
    try {
      // Note: REST contextinfo requires proper auth; prefer Graph API for modern apps.
  const token = this.accessTokenProvider ? await this.accessTokenProvider() : null;
  if(!token) console.debug('getRequestDigest: no access token available; contextinfo may fail')
      const response = await axiosWithRetry({
        method: 'post',
        url: `${this.siteUrl}/_api/contextinfo`,
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined,
          'Accept': 'application/json;odata=verbose',
          'Content-Type': 'application/json;odata=verbose'
        }
      });

      return response.data && response.data.d && response.data.d.GetContextWebInformation ? response.data.d.GetContextWebInformation.FormDigestValue : null;
    } catch (error) {
      console.error('Error getting request digest:', error);
      throw error;
    }
  }

  // Lab-specific methods
  async getInventoryItems() {
    // returns Inventory items with Material, Quantity, MinQty
  return await this.getListItems('Inventory', '', 'Material,Quantity,MinQty');
  }

  async checkMaterialStock(materials) {
    const missingItems = [];
    
  for (const material of materials) {
      const sanitized = sanitizeODataValue(material);
      const items = await this.getListItems('Inventory', `Material eq '${sanitized}'`);
      if (!items || items.length === 0) {
        missingItems.push(material.trim());
        continue;
      }
      const qty = Number(items[0].Quantity || 0);
      const min = Number(items[0].MinQty || 0);
      if (isNaN(qty) || isNaN(min) || qty <= min) {
        missingItems.push(material.trim());
      }
    }

    return {
      material_enough: missingItems.length === 0,
      missing_items: missingItems
    };
  }

  async createLabRequest(requestData) {
    const itemData = {
      __metadata: { type: 'SP.Data.LabRequestsListItem' },
      Title: requestData.experiment_title,
      TeacherName: requestData.teacher_name,
      TeacherEmail: requestData.teacher_email,
      Materials: requestData.materials.join(', '),
      PreferredDate: requestData.preferred_date,
      PreferredLab: requestData.preferred_lab,
      Status: 'NEW'
    };

    return await this.createListItem('LabRequests', itemData);
  }

  async updateLabRequestStatus(itemId, status, extraData = {}) {
    const updateData = {
      __metadata: { type: 'SP.Data.LabRequestsListItem' },
      Status: status,
      ...extraData
    };

    return await this.updateListItem('LabRequests', itemId, updateData);
  }

  async logAuditEvent(requestId, event, payload) {
    const itemData = {
      __metadata: { type: 'SP.Data.AuditLogListItem' },
      RelatedRequestIdId: requestId,
      Event: event,
      Payload: JSON.stringify(payload || {}),
      EventTime: new Date().toISOString()
    };

    return await this.createListItem('AuditLog', itemData);
  }

  async getLabCalendarAddress(labName) {
    const labs = await this.getListItems('Labs', `LabName eq '${labName}'`, 'CalendarAddress');
    return labs.length > 0 ? labs[0].CalendarAddress : null;
  }
}

module.exports = SharePointAdapter;

// NEXT ACTIONS / TODOs for `functions/platform/sharepoint_adapter.js`:
// - Replace simple retry wrapper with a tested library (axios-retry or p-retry) and add jitter.
// - Add typed responses and defensive parsing for SharePoint list payloads.
// - Add rate-limit handling (429) and proper retry-after header respect.
// - Add unit tests for `sanitizeForOData` and for list/query helpers.
// - Consider caching small, frequently-read lists (labs, inventory snapshot) in memory with TTL.
