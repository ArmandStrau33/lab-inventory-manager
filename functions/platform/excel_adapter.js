const axios = require('axios');

class ExcelAdapter {
  // accessTokenProvider: optional function that returns a Promise resolving to a token string
  constructor(accessTokenProvider) {
    this.accessTokenProvider = accessTokenProvider;
    this.baseUrl = 'https://graph.microsoft.com/v1.0';
  }

  async getWorkbookTable(driveId, itemId, worksheetName, tableName) {
    try {
      const url = `${this.baseUrl}/drives/${driveId}/items/${itemId}/workbook/worksheets/${worksheetName}/tables/${tableName}`;
      
      const token = this.accessTokenProvider ? await this.accessTokenProvider() : null;
      const response = await axios.get(url, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting Excel table:', error && (error.response && error.response.data) || error.message)
      throw error;
    }
  }

  async getTableRows(driveId, itemId, worksheetName, tableName) {
    try {
      const url = `${this.baseUrl}/drives/${driveId}/items/${itemId}/workbook/worksheets/${worksheetName}/tables/${tableName}/rows`;
      
      const token = this.accessTokenProvider ? await this.accessTokenProvider() : null;
      const response = await axios.get(url, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined,
          'Content-Type': 'application/json'
        }
      });

      return response.data.value;
    } catch (error) {
      console.error('Error getting Excel table rows:', error && (error.response && error.response.data) || error.message)
      throw error;
    }
  }

  async addTableRow(driveId, itemId, worksheetName, tableName, values) {
    try {
      const url = `${this.baseUrl}/drives/${driveId}/items/${itemId}/workbook/worksheets/${worksheetName}/tables/${tableName}/rows/add`;
      
      const token = this.accessTokenProvider ? await this.accessTokenProvider() : null;
      const response = await axios.post(url, {
        values: [values]
      }, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error adding Excel table row:', error && (error.response && error.response.data) || error.message)
      throw error;
    }
  }

  async updateTableRow(driveId, itemId, worksheetName, tableName, rowIndex, values) {
    try {
      const url = `${this.baseUrl}/drives/${driveId}/items/${itemId}/workbook/worksheets/${worksheetName}/tables/${tableName}/rows/itemAt(index=${rowIndex})`;
      
      const token = this.accessTokenProvider ? await this.accessTokenProvider() : null;
      const response = await axios.patch(url, {
        values: [values]
      }, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error updating Excel table row:', error && (error.response && error.response.data) || error.message)
      throw error;
    }
  }

  // Lab-specific method to log request to Excel
  async logLabRequest(driveId, itemId, requestData, step, extraData = {}) {
    const values = [
      requestData.id,
      requestData.teacher_name,
      requestData.teacher_email,
      requestData.experiment_title,
      requestData.materials.join(', '),
      requestData.preferred_date || '',
      requestData.preferred_lab || '',
      requestData.status,
      step,
      extraData.missing_items ? extraData.missing_items.join(', ') : '',
      extraData.booking_id || '',
      extraData.start ? new Date(extraData.start).toISOString() : '',
      extraData.lab || '',
      extraData.url || '',
      extraData.reason || '',
      new Date().toISOString(),
      new Date().toISOString()
    ];

  // Note: Ensure driveId and itemId are valid and app has Files.ReadWrite.All scope
  return await this.addTableRow(driveId, itemId, 'LabRequestsLog', 'LabRequestsLog', values);
  }
}

module.exports = ExcelAdapter;
// NEXT ACTIONS:
// - Validate drive/file/table ids at startup and fail fast with clear logs.
// - Implement a batching buffer for writes and a retry/backoff strategy for 429 responses.
// - Add unit tests that mock axios and Graph responses.
// - Integrate with `functions/platform/msal_helper` for token management and refresh.

// ROADMAP: implement validation and an in-memory batching queue in the next PR; follow with a Cloud Tasks-backed retry worker.
