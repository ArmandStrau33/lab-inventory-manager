# Lab Inventory Management - Microsoft Automation Setup

## Overview
This system combines Firebase hosting/functions with Microsoft 365 automation (SharePoint, Power Automate, Excel, Outlook) to manage lab requests from intake to scheduling.

## Architecture Components

### 1. Firebase Components (Deployed)
- **Frontend**: React app hosted at https://lab-manager1.web.app
- **Backend**: Firebase Functions with HTTP API endpoints
- **Database**: Firestore for audit logs and request history

### 2. Microsoft 365 Components (To Configure)
- **SharePoint Lists**: LabRequests, Inventory, Labs, AuditLog
- **Excel Online**: LabRequestsLog workbook
- **Power Automate**: Flows for automation
- **Outlook**: Calendar integration for lab bookings
- **Power Apps**: Form for lab request intake (optional)

## Setup Instructions

### Step 1: SharePoint Lists Setup

Create these lists in your SharePoint site:

#### LabRequests List
```
Columns:
- Title (Single line of text) - Experiment title
- TeacherName (Single line of text)
- TeacherEmail (Single line of text)
- Materials (Multiple lines of text)
- PreferredDate (Date and time)
- PreferredLab (Choice: Lab A, Lab B, Lab C, etc.)
- Status (Choice: NEW, INVENTORY_OK, INVENTORY_MISSING, AWAITING_APPROVAL, APPROVED, REJECTED, SCHEDULED, NOTIFIED, CLOSED)
- BookingId (Single line of text)
- ApprovalReason (Multiple lines of text)
```

#### Inventory List
```
Columns:
- Title = Material (Single line of text)
- Material (Single line of text) - Make this unique/indexed
- Quantity (Number)
- MinQty (Number)
```

#### Labs List
```
Columns:
- Title = LabName (Single line of text)
- LabName (Single line of text)
- CalendarAddress (Single line of text) - e.g., lab-a@school.za
- Capacity (Number, optional)
```

#### AuditLog List
```
Columns:
- Title = Event (Single line of text)
- RelatedRequestId (Lookup to LabRequests)
- Event (Single line of text)
- Payload (Multiple lines of text)
- EventTime (Date and time)
```

### Step 2: Excel Online Setup

1. Create an Excel file named "LabRequestsLog.xlsx" in your SharePoint site
2. Create a table named "LabRequestsLog" with these columns:
   ```
   ID | Teacher | Email | Title | Materials | PreferredDate | PreferredLab | Status | Step | Missing | BookingId | Start | Lab | URL | Reason | Created | Updated
   ```

### Step 3: Azure App Registration

1. Go to Azure Portal > App registrations
2. Create new registration:
   - Name: "Lab Inventory Manager"
   - Supported account types: Single tenant
   - Redirect URI: Not needed for this setup

3. Grant API permissions:
   ```
   Microsoft Graph:
   - Sites.ReadWrite.All
   - Files.ReadWrite.All
   - Calendars.ReadWrite
   - Mail.Send
   - User.Read.All
   
   SharePoint:
   - Sites.FullControl.All
   ```

4. Create client secret and note down:
   - Application (client) ID
   - Directory (tenant) ID
   - Client secret value

### Step 4: Environment Variables

Set these in your Firebase Functions environment:

```bash
firebase functions:config:set \
  sharepoint.site_url="https://your-tenant.sharepoint.com/sites/your-site" \
  sharepoint.tenant_id="your-tenant-id" \
  sharepoint.client_id="your-client-id" \
  sharepoint.client_secret="your-client-secret" \
  excel.drive_id="your-drive-id" \
  excel.file_id="your-excel-file-id"
  
Note: After setting environment variables, follow the repository `ROADMAP.md` for ordered deployment steps and tips for obtaining the required Azure App credentials.
```

### Deployment note: MSAL and Node runtime

The repository includes an MSAL helper (`functions/platform/msal_helper.js`) that uses `@azure/msal-node` to obtain Microsoft Graph tokens.

- To enable MSAL in cloud functions, install the package in the `functions` folder:

```powershell
cd functions
npm install @azure/msal-node axios
```

- Caution: Firebase Cloud Functions often run on Gen‑1 (Node 18). Changing `functions/package.json` to target Node 20 may cause the Firebase CLI to attempt Gen‑2 features and fail if your project is still gen‑1, showing an error like:

```
Error: Cannot set CPU on the functions api because they are GCF gen 1
```

If you encounter that error, choose one of the two approaches:

1. Quick unblock: keep `engines.node` set to "18" in `functions/package.json`, install the MSAL dependency, and deploy — this runs on Gen‑1 and gets automation working quickly.
2. Migration path: migrate to Gen‑2 (Node 20) by following Google Cloud's migration guide, upgrade `firebase-functions`/`firebase-admin` to Gen‑2 compatible versions, and test thoroughly. This is recommended longer-term but requires more work.

Refer to `ROADMAP.md` for the recommended step-by-step approach.

### Quick unblock (Option A) — Fast path to enable Graph calls
If you want to get Microsoft Graph/SharePoint automation working quickly, keep the functions runtime on Node 18 (Gen‑1) and install MSAL in the `functions/` folder, then deploy.

PowerShell commands (copy & run from repo root):

```powershell
cd functions
# ensure package.json engines.node is 18 (edit functions/package.json if needed)
npm install @azure/msal-node axios --legacy-peer-deps
# set Azure AD app config (replace placeholders)
firebase functions:config:set \
  sharepoint.site_url="https://your-tenant.sharepoint.com/sites/your-site" \
  sharepoint.tenant_id="your-tenant-id" \
  sharepoint.client_id="your-client-id" \
  sharepoint.client_secret="your-client-secret" \
  excel.drive_id="your-drive-id" \
  excel.file_id="your-excel-file-id"
# deploy only functions to test
firebase deploy --only functions
```

Notes for Option A:
- Use `--legacy-peer-deps` if npm reports peer dependency conflicts.
- This avoids the Gen‑2 migration work and is useful for short-term automation/testing.

### Gen‑2 migration (Option B) — recommended long-term
If you prefer a long-term, supported runtime, migrate functions to Gen‑2 (Node 20). This requires package upgrades and testing.

High-level steps:
1. Update `functions/package.json` engines to:
```json
"engines": { "node": "20" }
```
2. Upgrade Firebase SDKs to Gen‑2 compatible versions (see Firebase docs): bump `firebase-functions` and `firebase-admin` in `functions/package.json` and run `npm install`.
3. Run lint/tests and fix any runtime incompatibilities. Update any deprecated APIs.
4. Deploy and verify logs; be prepared to rollback to Node 18 if your GCP project is not ready for Gen‑2.

If you'd like, I can prepare a precise migration patch (exact package versions, code edits, and test plan) and run it here.

### Decision checklist (pick one)
- [ ] Option A — Quick unblock: I grant permission to run the PowerShell install and a `firebase deploy --only functions` now.
- [ ] Option B — Start Gen‑2 migration: I want the migration plan and for you to begin the upgrade steps.


### Step 5: Power Automate Flows

Import the provided flow templates:

1. Go to Power Automate (make.powerautomate.com)
2. Import the flows from the `/power-automate/` folder:
   - `FR-Intake-and-Approval.json`
   - `FR-Scheduling-and-Notify.json`

3. Update connection references:
   - SharePoint site URL
   - Office 365 Outlook
   - Excel Online (Business)

### Step 6: Test the System

1. **Manual Test**: Create an item in the LabRequests SharePoint list
2. **Form Test**: Use the deployed React form at https://lab-manager1.web.app
3. **Flow Test**: Verify Power Automate flows trigger correctly

## Power Automate Flow Logic

### FR-Intake-and-Approval
- **Trigger**: When item created in LabRequests
- **Actions**:
  1. Split materials list
  2. Check inventory for each material
  3. If missing materials: Update status, send procurement email
  4. Start approval process (coach + lab tech)
  5. If approved: Call scheduling flow
  6. If rejected: Send rejection email to teacher

### FR-Scheduling-and-Notify
- **Trigger**: Called from approval flow
- **Actions**:
  1. Get lab request details
  2. Find lab calendar address
  3. Check for calendar conflicts
  4. If conflict: Find next available slot
  5. Create calendar event
  6. Update request status
  7. Log to Excel
  8. Send confirmation email to teacher
  9. Log audit event

## Customization Options

### Email Templates
Modify email content in Power Automate flows:
- Procurement request emails
- Approval/rejection notifications
- Booking confirmations

### Business Rules
Adjust in Power Automate or Firebase Functions:
- Inventory thresholds
- Working hours
- Approval workflows
- Calendar conflict resolution

### Additional Features
You can extend with:
- Teams notifications
- Low-stock alerts
- Procurement tracking
- Advanced scheduling algorithms

## Security Considerations

1. **SharePoint Permissions**: Restrict list access to relevant users
2. **Azure App**: Use certificate-based authentication in production
3. **Firebase Rules**: Implement proper Firestore security rules
4. **API Keys**: Store sensitive values in Firebase Functions config

## Monitoring and Maintenance

1. **Power Automate**: Monitor flow run history
2. **Firebase**: Check Functions logs and Firestore usage
3. **SharePoint**: Regular list maintenance and permissions review
4. **Excel**: Periodic data cleanup and archiving

## Support and Troubleshooting

### Common Issues:
1. **Power Automate flow failures**: Check connection references and permissions
2. **Calendar booking conflicts**: Verify lab calendar addresses in Labs list
3. **Email delivery**: Ensure proper SMTP/Exchange permissions
4. **SharePoint access**: Verify site permissions and list access

### Logs and Diagnostics:
- Power Automate: Flow run history
- Firebase: Functions logs in Firebase Console
- SharePoint: Audit logs in SharePoint admin center
- Excel: Version history and activity

## Next Steps

1. Deploy to production SharePoint environment
2. Train users on the system
3. Set up monitoring and alerts
4. Plan for data archiving and cleanup
5. Consider integration with other school systems

## MSAL / Azure AD (required for Graph operations)

To allow the Firebase Functions to call Microsoft Graph securely, install and configure MSAL in the `functions` folder and provide Azure AD app credentials.

1. Install the MSAL library and dependencies inside the functions folder (PowerShell):

```powershell
cd functions
npm install @azure/msal-node axios
```

2. Ensure `functions` has `functions/platform/msal_helper.js` present (the repo includes a lightweight helper).

3. Set the Azure AD app credentials as function config values (example):

```powershell
firebase functions:config:set \
   sharepoint.site_url="https://your-tenant.sharepoint.com/sites/your-site" \
   sharepoint.tenant_id="your-tenant-id" \
   sharepoint.client_id="your-client-id" \
   sharepoint.client_secret="your-client-secret" \
   excel.drive_id="your-drive-id" \
   excel.file_id="your-excel-file-id"
```

4. Deploy functions and monitor logs during the first runs. If token acquisition fails, check that the app has the required application permissions and that the client secret is valid.

Notes:
- For production, consider using certificate-based credentials or Azure Key Vault instead of client secrets.
- If you cannot install `@azure/msal-node`, the functions will fall back to an `ACCESS_TOKEN` env var for quick testing, but this is not recommended for production.

### Post-deploy verification checklist
After deploying functions and installing MSAL, run these quick checks to confirm automation is healthy:

1. Verify function runtime and logs
   - In Firebase Console > Functions, confirm the runtime (Node 18 vs 20) matches `functions/package.json`.
   - Open logs and watch for startup messages from `validateConfig()` or token errors.

2. Test token acquisition
   - Trigger a small test function or curl the `/health` or `/submit` endpoint (if present) and confirm the functions log shows a successful MSAL token fetch (or use `ACCESS_TOKEN` fallback for quick tests).

3. Trigger a sample lab request
   - Use the React form at `https://lab-manager1.web.app` or POST a small JSON payload to the intake endpoint and watch the pipeline steps in logs and Firestore.

4. Check SharePoint / Graph calls
   - Confirm the functions can read the `Labs` and `Inventory` lists and that Excel writes (if enabled) appear in `LabRequestsLog.xlsx`.

5. Verify webhook security
   - If using Power Automate, send a test approval callback and ensure the webhook validates the callback and resumes the pipeline.

6. Confirm email delivery
   - Verify the Graph `sendMail` calls succeed (or outgoing emails appear in the log/transaction table).

7. Verify audit logs and Excel rows
   - Confirm `audit_logs` and `lab_requests_history` collections have entries for the test run.

8. Rollback plan
   - If you see Gen‑2 runtime mismatch or critical errors, rollback by setting `functions/package.json` engines back to "18" and re-deploy.
