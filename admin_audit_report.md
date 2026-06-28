# Admin Portal Audit & Testing Report

## Verified Modules
- **Consolidated Zone & POI Management**: Verified successfully (Leaflet map pin drop coordinate tracking, manual entry camera synchronization, dynamic GPS location centering, 16:9 aspect ratio UI display, cover image dual-option switching, and POI reset QR workflows).
- **Vendor Accounts Portal**: Verified successfully (creating active vendor profile accounts with immediate status approval bypass).
- **Wallets & Top-up Hub**: Verified credit/debit wallet ledger, top-up requests approval, and bank QR uploading widgets.
- **Geofencing & Notification Feed**: Verified map pan/fly-to transitions over selected stalls, and dynamic notifications bell updates.

---

## Logged Anomalies & Resolution Audit

### Entry 1: Wallet Transaction Insertion Failure
- **Component Location / Route Path**: `POST /api/admin/wallets/{id}/credit` and `POST /api/admin/wallets/{id}/debit` (Finance Controller Adjust action).
- **Observed Symptom / Console Log Error Trace String**:
  ```
  Microsoft.EntityFrameworkCore.DbUpdateException: An error occurred while saving the entity changes. See the inner exception for details.
  ---> MySqlConnector.MySqlException (0x80004005): Unknown column 'CreatedByUserId' in 'field list'
  ```
- **Root Cause Analysis**: EF Core mapped the `CreatedByUserId` and `Metadata` properties on `WalletTransaction` to identical default column names, but the underlying MySQL table `wallet_transactions` defines them as `created_by_user_id` and `metadata` respectively.
- **Applied Fix / Self-Healing**: Added explicit column name mappings (`.HasColumnName("created_by_user_id")` and `.HasColumnName("metadata")`) inside [AppDbContext.cs](file:///c:/Users/UNITY/Desktop/VietTourAudio-project-ready-database-integration/server/VietTourAudio.Api/Data/AppDbContext.cs). Recompiled and restarted the API server successfully.

### Entry 2: Top-up Request Approval Failure
- **Component Location / Route Path**: `POST /api/admin/topup/requests/{id}/approve` (AdminTopUpController Approve action).
- **Observed Symptom / Console Log Error Trace String**:
  ```
  MySqlConnector.MySqlException (0x80004005): Unknown column 'CreatedByUserId' in 'field list'
  at VietTourAudio.Api.Controllers.AdminTopUpController.Approve(UInt64 id)
  ```
- **Root Cause Analysis**: Same database mapping constraint on `WalletTransaction`'s `CreatedByUserId` property during top-up ledger validation insertions.
- **Applied Fix / Self-Healing**: Resolved automatically after applying the snake_case column mapping fixes inside `AppDbContext.cs`. Verified clean database updates upon compilation.

---

## Post-Fix API Verification Results

All endpoints re-tested via direct HTTP assertions after the patch was applied and the server was restarted.

| Endpoint | Method | Result | Details |
|---|---|---|---|
| `/api/admin/auth/login` | POST | ✅ 200 OK | JWT token issued successfully |
| `/api/admin/zones` | GET | ✅ 200 OK | 4 zones loaded |
| `/api/admin/vendors` | GET | ✅ 200 OK | 9 vendors loaded |
| `/api/admin/wallets` | GET | ✅ 200 OK | 9 vendor wallets loaded |
| `/api/admin/wallets/9/credit` | POST | ✅ 200 OK | +100,000 VND applied, tx ID #24, balance 1,100,000 |
| `/api/admin/wallets/9/debit` | POST | ✅ 200 OK | -50,000 VND applied, tx ID #25, balance 1,050,000 |
| `/api/admin/topup/requests?status=PENDING` | GET | ✅ 200 OK | 1 pending request found (ID #5, vendor #7) |
| `/api/admin/topup/requests/5/approve` | POST | ✅ 200 OK | Status → APPROVED, balance updated to 115,000 |
| `/api/admin/wallets/bank-qr` | GET | ✅ 200 OK | Returns `/uploads/bank_qr.png` |
| `/api/admin/geofences/all-data` | GET | ✅ 200 OK | 9 stalls with GPS coordinates loaded |
| `/api/admin/notifications` | GET | ✅ 200 OK | Real-time notification feed operational |

---

### Entry 3: MonthlyBillingWorker Crashes Host on Graceful Shutdown
- **Component Location**: [`MonthlyBillingWorker.cs`](file:///c:/Users/UNITY/Desktop/VietTourAudio-project-ready-database-integration/server/VietTourAudio.Api/Services/MonthlyBillingWorker.cs) — Background hosted service.
- **Observed Symptom**:
  ```
  crit: Microsoft.Extensions.Hosting.Internal.Host[10]
        The HostOptions.BackgroundServiceExceptionBehavior is configured to StopHost.
        A BackgroundService has thrown an unhandled exception, and the IHost instance is stopping.
  System.Threading.Tasks.TaskCanceledException: A task was canceled.
     at MonthlyBillingWorker.ExecuteAsync(CancellationToken stoppingToken) line 27
  ```
- **Root Cause Analysis**: The `await Task.Delay(TimeSpan.FromDays(1), stoppingToken)` was not wrapped in a try/catch. On graceful host shutdown, the cancellation token fires, causing `Task.Delay` to throw `OperationCanceledException`. This propagated through the `BackgroundService`, which the host treated as a fatal crash and called `StopHost` — preventing clean server restarts.
- **Applied Fix / Self-Healing**: Wrapped `Task.Delay` in its own `try/catch (OperationCanceledException)` block. Added a matching `catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)` guard to the inner work loop so graceful shutdowns always `break` cleanly without error logging. Recompiled and server now starts and stops correctly.

---

## Clean Completion Summary

| Metric | Value |
|---|---|
| Admin modules crawled & verified | 4 (Zones/POIs, Vendors, Wallets/Finance, Geofences) |
| Total API endpoints tested | 11 |
| Critical bugs discovered | 3 |
| Files auto-patched | 2 (`AppDbContext.cs`, `MonthlyBillingWorker.cs`) |
| Backend build status | ✅ Build succeeded — 0 Warning(s), 0 Error(s) |
| Frontend build status | ✅ Build succeeded — compiled in 6.13s |
| Backend server status | ✅ Running on port 45200 |


