# VietTourAudio - COMPREHENSIVE TEST PLAN

**Version:** 1.0  
**Created:** 2026-06-23  
**Target:** End-to-End Validation of All Major Features

---

## TEST EXECUTION SUMMARY

| Category | Total Tests | Pass | Fail | Status |
|----------|------------|------|------|--------|
| Infrastructure | 5 | 0 | 0 | ⏳ READY |
| Authentication | 8 | 0 | 0 | ⏳ READY |
| Admin Portal | 15 | 0 | 0 | ⏳ READY |
| Vendor Portal | 10 | 0 | 0 | ⏳ READY |
| Visitor/Mobile | 12 | 0 | 0 | ⏳ READY |
| Database | 6 | 0 | 0 | ⏳ READY |
| API Endpoints | 20 | 0 | 0 | ⏳ READY |
| Error Handling | 8 | 0 | 0 | ⏳ READY |
| **TOTAL** | **84** | **0** | **0** | ⏳ READY |

---

## 1. INFRASTRUCTURE TESTS

### INF-001: MySQL Connection
**Objective:** Verify MySQL is accessible and database exists  
**Steps:**
1. Open terminal/MySQL workbench
2. Connect to `localhost:3306` with user `root`, no password
3. Run: `SHOW DATABASES;`
4. Look for `viettuoraudio` database

**Expected Result:** ✅ Database `viettuoraudio` visible in list  
**Pass/Fail:** ___  
**Notes:** ___

---

### INF-002: Database Tables Exist
**Objective:** Verify all 26 tables created  
**Steps:**
1. Connect to `viettuoraudio` database
2. Run: `SHOW TABLES;`
3. Count tables and verify all expected names present

**Expected Result:** ✅ 26 tables listed, including:
- users, vendors, pois, tours (NEW), tour_pois (NEW), favorites (NEW), qr_codes, etc.

**Pass/Fail:** ___  
**Notes:** ___

---

### INF-003: Seed Data Imported
**Objective:** Verify demo data loaded correctly  
**Steps:**
1. Query each table:
   - `SELECT COUNT(*) FROM users;` → Should be 1
   - `SELECT COUNT(*) FROM vendors;` → Should be ≥ 1
   - `SELECT COUNT(*) FROM vendor_portal_users;` → Should be 1
   - `SELECT COUNT(*) FROM pois;` → Should be ≥ 1
   - `SELECT COUNT(*) FROM qr_codes;` → Should be ≥ 1

**Expected Result:** ✅ All counts match expected values

**Pass/Fail:** ___  
**Notes:** ___

---

### INF-004: Admin User Credentials Work
**Objective:** Verify seeded admin account is accessible  
**Steps:**
1. Query: `SELECT id, email, pass_hash, role FROM users WHERE email = 'admin@viettouraudio.vn';`
2. Verify: 
   - id: 1
   - email: admin@viettouraudio.vn
   - pass_hash: bcrypt hash (not plaintext)
   - role: ADMIN

**Expected Result:** ✅ Admin user found with bcrypt hash

**Pass/Fail:** ___  
**Notes:** ___

---

### INF-005: Vendor User Credentials Work
**Objective:** Verify seeded vendor account is accessible  
**Steps:**
1. Query: `SELECT id, email, full_name, vendor_id, status FROM vendor_portal_users WHERE email = 'an@heritagefoods.vn';`
2. Verify: 
   - email: an@heritagefoods.vn
   - vendor_id: 1 (or existing vendor)
   - status: ACTIVE
3. Query parent vendor: `SELECT status FROM vendors WHERE id = <vendor_id>;` → should be APPROVED

**Expected Result:** ✅ Vendor user found with status ACTIVE and parent vendor APPROVED

**Pass/Fail:** ___  
**Notes:** ___

---

## 2. AUTHENTICATION TESTS

### AUTH-001: Admin Login - Valid Credentials
**Objective:** Admin can login with correct email/password  
**Endpoint:** `POST /api/admin/auth/login`  
**Request Body:**
```json
{
  "email": "admin@viettouraudio.vn",
  "password": "Admin123"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "1",
      "email": "admin@viettouraudio.vn",
      "role": "ADMIN",
      "displayName": "Admin User",
      "status": "ACTIVE"
    }
  }
}
```

**How to Test:**
```powershell
# Using PowerShell
$body = @{ email = "admin@viettouraudio.vn"; password = "Admin123" } | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:5001/api/admin/auth/login" -Method POST -Body $body -ContentType "application/json" | ConvertFrom-Json
```

**Pass/Fail:** ___  
**Token Received:** Yes / No  
**Notes:** ___

---

### AUTH-002: Admin Login - Invalid Password
**Objective:** Wrong password rejects login  
**Request Body:**
```json
{
  "email": "admin@viettouraudio.vn",
  "password": "WrongPassword123"
}
```

**Expected Response (401):**
```json
{
  "success": false,
  "error": "AUTH_INVALID_CREDENTIALS"
}
```

**Pass/Fail:** ___  
**Notes:** ___

---

### AUTH-003: Admin Login - Invalid Email
**Objective:** Non-existent email rejects login  
**Request Body:**
```json
{
  "email": "nonexistent@example.com",
  "password": "Admin123"
}
```

**Expected Response (401):** AUTH_INVALID_CREDENTIALS

**Pass/Fail:** ___  
**Notes:** ___

---

### AUTH-004: Vendor Login - Valid Credentials
**Objective:** Vendor can login with correct email/password  
**Endpoint:** `POST /api/vendor/auth/login`  
**Request Body:**
```json
{
  "email": "an@heritagefoods.vn",
  "password": "Vendor123"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "role": "VENDOR",
      "vendorId": "1",
      "vendorName": "Hội An Heritage Foods"
    }
  }
}
```

**Pass/Fail:** ___  
**Notes:** ___

---

### AUTH-005: Token Stored in LocalStorage
**Objective:** After login, token persists in browser storage  
**Steps:**
1. Open browser DevTools (F12)
2. Navigate to http://localhost:5173/admin/login
3. Enter admin credentials and login
4. Open Console and run: `localStorage.getItem('vta-admin-auth')`
5. Verify JWT token present

**Expected Result:** ✅ Token visible in localStorage with key `vta-admin-auth`

**Pass/Fail:** ___  
**Notes:** ___

---

### AUTH-006: Vendor Token Separated from Admin
**Objective:** Vendor and admin tokens don't collide  
**Steps:**
1. Login as admin → token stored in `vta-admin-auth`
2. In same browser, logout and login as vendor
3. Check localStorage keys: `vta-admin-auth` should still have admin token
4. And `vta-vendor-auth` should have new vendor token

**Expected Result:** ✅ Both tokens coexist with different keys

**Pass/Fail:** ___  
**Notes:** ___

---

### AUTH-007: Token Sent in Authorization Header
**Objective:** Axios interceptor adds Bearer token to requests  
**Steps:**
1. Login as admin
2. Open DevTools → Network tab
3. Navigate to admin dashboard
4. Look at XHR requests → Check "Request Headers"
5. Verify: `Authorization: Bearer <token>`

**Expected Result:** ✅ All requests have Authorization header with token

**Pass/Fail:** ___  
**Notes:** ___

---

### AUTH-008: 401 Clears Token and Redirects
**Objective:** When API returns 401, user redirected to login  
**Steps:**
1. Login as admin successfully
2. Open DevTools → Console
3. Manually clear localStorage: `localStorage.removeItem('vta-admin-auth')`
4. Refresh page: F5
5. Verify redirected to `/admin/login`
6. Verify error message shown

**Expected Result:** ✅ Redirected to login and error displayed

**Pass/Fail:** ___  
**Notes:** ___

---

## 3. ADMIN PORTAL TESTS

### ADMIN-001: Admin Dashboard Loads
**Objective:** After login, dashboard page renders  
**Steps:**
1. Navigate to http://localhost:5173/admin/login
2. Login with admin credentials
3. Verify redirect to http://localhost:5173/admin
4. Page should show dashboard with:
   - Menu on left (Users, Vendors, POIs, etc.)
   - Main content area with metrics/cards
   - No "undefined" or console errors

**Expected Result:** ✅ Dashboard visible with data

**Pass/Fail:** ___  
**Notes:** ___

---

### ADMIN-002: Admin Cannot Access Vendor Routes
**Objective:** Admin trying to access /vendor routes gets redirected  
**Steps:**
1. Login as admin
2. Manually navigate to: http://localhost:5173/vendor/dashboard
3. Should redirect to: http://localhost:5173/admin or show error

**Expected Result:** ✅ Redirected away from vendor routes

**Pass/Fail:** ___  
**Notes:** ___

---

### ADMIN-003: List POIs Page
**Objective:** Admin can view POI list  
**Steps:**
1. Login as admin
2. Navigate to Admin → POIs (or similar menu item)
3. Page should load with table/list of POIs
4. Each row should show: Name, Stall, Status, Language Count

**Expected Result:** ✅ POI list displays with seed data

**Pass/Fail:** ___  
**Notes:** ___

---

### ADMIN-004: Create POI
**Objective:** Admin can create new POI  
**Steps:**
1. Navigate to POIs page
2. Click "Add POI" or "Create" button
3. Fill form:
   - Name: "Test POI"
   - Stall: Select existing stall
   - Latitude/Longitude: 15.8801, 108.3268
   - Upload image (or skip if optional)
4. Click Save

**Expected Result:** ✅ POI created, appears in list, success message shown

**Pass/Fail:** ___  
**Notes:** ___

---

### ADMIN-005: Edit POI
**Objective:** Admin can edit existing POI  
**Steps:**
1. Navigate to POIs page
2. Click Edit on any POI
3. Change name to "Updated POI Name"
4. Click Save

**Expected Result:** ✅ POI updated, list shows new name, success message shown

**Pass/Fail:** ___  
**Notes:** ___

---

### ADMIN-006: Delete POI
**Objective:** Admin can delete POI (soft delete)  
**Steps:**
1. Navigate to POIs page
2. Click Delete/Archive on any POI
3. Confirm deletion
4. Verify POI removed from list or marked as deleted

**Expected Result:** ✅ POI deleted/archived, no longer visible

**Pass/Fail:** ___  
**Notes:** ___

---

### ADMIN-007: List Vendors
**Objective:** Admin can view vendor list  
**Steps:**
1. Navigate to Admin → Vendors
2. Page should load with vendor list
3. Each row: Business Name, Status (PENDING/APPROVED/REJECTED), Created Date

**Expected Result:** ✅ Vendor list displays, seed vendors visible

**Pass/Fail:** ___  
**Notes:** ___

---

### ADMIN-008: Approve Vendor
**Objective:** Admin can approve pending vendor  
**Steps:**
1. Look for vendor with status "PENDING"
2. Click "Approve" button
3. Verify status changes to "APPROVED"

**Expected Result:** ✅ Vendor approved, status updated

**Pass/Fail:** ___  
**Notes:** ___

---

### ADMIN-009: Reject Vendor
**Objective:** Admin can reject vendor with reason  
**Steps:**
1. Look for vendor with status "PENDING"
2. Click "Reject" button
3. Enter reason: "Documentation incomplete"
4. Click Confirm

**Expected Result:** ✅ Vendor rejected, status shows REJECTED, reason visible

**Pass/Fail:** ___  
**Notes:** ___

---

### ADMIN-010: List Users
**Objective:** Admin can view user list  
**Steps:**
1. Navigate to Admin → Users
2. Page should load with user list showing admin users
3. Each row: Email, Role, Status, Last Login

**Expected Result:** ✅ User list displays

**Pass/Fail:** ___  
**Notes:** ___

---

### ADMIN-011: List Narrations
**Objective:** Admin can view content/narration list  
**Steps:**
1. Navigate to Admin → Content/Narrations
2. Page should load with list of narrations
3. Each row: POI Name, Language, Status (PENDING/APPROVED/REJECTED)

**Expected Result:** ✅ Narration list displays

**Pass/Fail:** ___  
**Notes:** ___

---

### ADMIN-012: Approve Narration
**Objective:** Admin can approve pending narration  
**Steps:**
1. Find narration with status "PENDING"
2. Click "Approve"
3. Verify status changes to "APPROVED"

**Expected Result:** ✅ Narration approved

**Pass/Fail:** ___  
**Notes:** ___

---

### ADMIN-013: Reject Narration
**Objective:** Admin can reject narration with reason  
**Steps:**
1. Find narration with status "PENDING"
2. Click "Reject"
3. Enter reason: "Audio quality too low"
4. Click Confirm

**Expected Result:** ✅ Narration rejected, reason stored

**Pass/Fail:** ___  
**Notes:** ___

---

### ADMIN-014: View Audit Logs
**Objective:** Admin can view activity/audit logs  
**Steps:**
1. Navigate to Admin → Audit Logs
2. Page should load with list of actions
3. Each row: Timestamp, Action, User, Target

**Expected Result:** ✅ Audit log displays, shows previous admin actions

**Pass/Fail:** ___  
**Notes:** ___

---

### ADMIN-015: Form Validation
**Objective:** Forms validate required fields  
**Steps:**
1. Go to any Create/Edit form (e.g., Create POI)
2. Leave required fields empty
3. Click Submit
4. Verify validation error message

**Expected Result:** ✅ Form shows validation error, doesn't submit

**Pass/Fail:** ___  
**Notes:** ___

---

## 4. VENDOR PORTAL TESTS

### VEN-001: Vendor Login
**Objective:** Vendor can login with credentials  
**Steps:**
1. Navigate to http://localhost:5173/vendor/login
2. Enter: an@heritagefoods.vn / Vendor123
3. Click Login

**Expected Result:** ✅ Redirect to /vendor/dashboard

**Pass/Fail:** ___  
**Notes:** ___

---

### VEN-002: Vendor Cannot Access Admin Routes
**Objective:** Vendor trying to access admin routes gets redirected  
**Steps:**
1. Login as vendor
2. Try to navigate to http://localhost:5173/admin
3. Should redirect to vendor area or show error

**Expected Result:** ✅ Redirected away from admin

**Pass/Fail:** ___  
**Notes:** ___

---

### VEN-003: Vendor Dashboard Shows Own Data
**Objective:** Vendor dashboard shows only their business metrics  
**Steps:**
1. Login as vendor (an@heritagefoods.vn)
2. Dashboard should show:
   - Business name: "Hội An Heritage Foods"
   - Total POIs: (number belonging to this vendor)
   - Total Scans, Audio Plays, Revenue (their data only)

**Expected Result:** ✅ Dashboard shows vendor-specific data

**Pass/Fail:** ___  
**Notes:** ___

---

### VEN-004: Vendor List POIs
**Objective:** Vendor can view their POIs  
**Steps:**
1. Navigate to Vendor → POIs
2. Page should show only POIs belonging to their stalls
3. Each row: POI Name, Stall, Status, Language Count

**Expected Result:** ✅ POI list shows only vendor's POIs

**Pass/Fail:** ___  
**Notes:** ___

---

### VEN-005: Vendor Add Narration
**Objective:** Vendor can submit new narration  
**Steps:**
1. Navigate to Vendor → Content/Add Narration
2. Select POI: Choose from dropdown
3. Select Language: Vietnamese
4. Fill:
   - Title: "Đặc sản địa phương"
   - Script: "Đây là đặc sản địa phương của Hội An..."
   - Upload Audio: (choose .mp3 file or skip)
5. Click Submit

**Expected Result:** ✅ Narration submitted, status shows "PENDING", success message

**Pass/Fail:** ___  
**Notes:** ___

---

### VEN-006: Vendor View Narration Status
**Objective:** Vendor can see if narration approved/rejected  
**Steps:**
1. Navigate to Vendor → My Content
2. List should show narrations with status column
3. Status values: PENDING, APPROVED, REJECTED
4. If REJECTED, reason visible

**Expected Result:** ✅ Narration status and reason displayed

**Pass/Fail:** ___  
**Notes:** ___

---

### VEN-007: Vendor Dashboard Metrics
**Objective:** Dashboard shows correct metrics  
**Steps:**
1. Dashboard should display:
   - Total QR Scans: ≥ 0
   - Total Visitors: ≥ 0
   - Total Audio Plays: ≥ 0
   - Total Revenue: ≥ 0
   - Wallet Balance: current balance

**Expected Result:** ✅ All metrics displayed and updated

**Pass/Fail:** ___  
**Notes:** ___

---

### VEN-008: Vendor Revenue Page
**Objective:** Vendor can view revenue/wallet  
**Steps:**
1. Navigate to Vendor → Revenue/Wallet
2. Page should show:
   - Wallet Balance
   - Total Top-Ups
   - Approved Commissions
   - Pending Commissions
   - Transaction History

**Expected Result:** ✅ Revenue page displays wallet data

**Pass/Fail:** ___  
**Notes:** ___

---

### VEN-009: Vendor Cannot Access Other Vendor Data
**Objective:** Vendor can't access data of other vendors  
**Steps:**
1. Login as vendor (vendorId = 1)
2. Manually modify URL or try API call with different vendorId
3. API should reject or return empty

**Expected Result:** ✅ Other vendor data not accessible

**Pass/Fail:** ___  
**Notes:** ___

---

### VEN-010: Vendor Logout
**Objective:** Vendor can logout  
**Steps:**
1. Click Logout button
2. Verify redirect to /vendor/login
3. Verify token cleared from localStorage

**Expected Result:** ✅ Logged out, token cleared, redirected

**Pass/Fail:** ___  
**Notes:** ___

---

## 5. VISITOR/MOBILE TESTS

### VIS-001: Landing Page Loads
**Objective:** Visitor can access main app  
**Steps:**
1. Navigate to http://localhost:5173
2. Page should load without errors
3. Show list of zones/POIs or instructions

**Expected Result:** ✅ Landing page renders

**Pass/Fail:** ___  
**Notes:** ___

---

### VIS-002: QR Scan Input
**Objective:** Visitor can input or scan QR code  
**Steps:**
1. Navigate to QR scan page
2. Either:
   - Click "Scan QR" (open camera)
   - Or input QR token in text field
3. Test with seed QR token

**Expected Result:** ✅ QR input/scan works

**Pass/Fail:** ___  
**Notes:** ___

---

### VIS-003: Valid QR Opens Tour
**Objective:** Valid QR code opens corresponding tour/POI  
**Steps:**
1. Get QR token from database: `SELECT token FROM qr_codes LIMIT 1;`
2. Input/scan that QR code
3. Should redirect to POI/tour page with data

**Expected Result:** ✅ POI/tour page loads with correct data

**Pass/Fail:** ___  
**Notes:** ___

---

### VIS-004: Invalid QR Shows Error
**Objective:** Invalid QR token shows error  
**Steps:**
1. Input invalid QR: "INVALID-QR-TOKEN-12345"
2. Should show error message

**Expected Result:** ✅ Error message: "QR not found" or similar

**Pass/Fail:** ___  
**Notes:** ___

---

### VIS-005: Expired QR Shows Error
**Objective:** Expired QR code shows error  
**Steps:**
1. Create/find expired QR in database
2. Try to scan it
3. Should show "QR expired"

**Expected Result:** ✅ Error message shown

**Pass/Fail:** ___  
**Notes:** ___

---

### VIS-006: GPS Permission Request
**Objective:** App requests GPS permission  
**Steps:**
1. Open app on mobile device or mobile emulator
2. Allow GPS permission
3. Should show distance to nearest POI

**Expected Result:** ✅ GPS works, distance shown

**Pass/Fail:** ___  
**Notes:** ___

---

### VIS-007: Geofence Trigger Audio
**Objective:** When entering POI radius, audio plays  
**Steps:**
1. Open POI page
2. Simulate entering geofence (or manually trigger)
3. Audio should start playing
4. Audio player shows: Play/Pause/Seek/Speed controls

**Expected Result:** ✅ Audio plays automatically or on demand

**Pass/Fail:** ___  
**Notes:** ___

---

### VIS-008: Audio Controls Work
**Objective:** Audio player has working controls  
**Steps:**
1. Audio playing
2. Test: Play, Pause, Seek, Replay, Speed

**Expected Result:** ✅ All controls responsive

**Pass/Fail:** ___  
**Notes:** ___

---

### VIS-009: Language Switch
**Objective:** Visitor can switch language (vi/en)  
**Steps:**
1. POI page shows narration in Vietnamese
2. Click language selector → English
3. English narration should load and play

**Expected Result:** ✅ Language switch works, narration changes

**Pass/Fail:** ___  
**Notes:** ___

---

### VIS-010: Add to Favorites
**Objective:** Visitor can add POI to favorites  
**Steps:**
1. POI page should have "Add to Favorite" button
2. Click button
3. Verify: Button changes appearance (e.g., filled/unfilled heart)

**Expected Result:** ✅ Favorite added, button shows favorited state

**Pass/Fail:** ___  
**Notes:** ___

---

### VIS-011: Offline Support
**Objective:** App works offline  
**Steps:**
1. Browse some POIs while online
2. Turn off internet (or use DevTools offline mode)
3. App should still show cached POI data
4. Allow audio replay of previously loaded audio

**Expected Result:** ✅ Basic offline functionality works

**Pass/Fail:** ___  
**Notes:** ___

---

### VIS-012: Service Worker Registers
**Objective:** PWA service worker installed  
**Steps:**
1. Open DevTools → Application tab
2. Check "Service Workers"
3. Should show registered service worker for localhost:5173

**Expected Result:** ✅ Service worker installed and running

**Pass/Fail:** ___  
**Notes:** ___

---

## 6. DATABASE TESTS

### DB-001: Foreign Key Constraints
**Objective:** Database enforces referential integrity  
**Steps:**
1. Try to insert POI with invalid stall_id: `INSERT INTO pois (stall_id, ...) VALUES (99999, ...);`
2. Should fail with foreign key error

**Expected Result:** ✅ Insert rejected

**Pass/Fail:** ___  
**Notes:** ___

---

### DB-002: Unique Constraints
**Objective:** Database enforces unique fields  
**Steps:**
1. Try to insert vendor with duplicate email:
   - First: `INSERT INTO vendors (contact_email, ...) VALUES ('test@example.com', ...);`
   - Second: Try to insert same email again

**Expected Result:** ✅ Second insert rejected as duplicate

**Pass/Fail:** ___  
**Notes:** ___

---

### DB-003: Indexes Performance
**Objective:** Database has proper indexes  
**Steps:**
1. Query: `SELECT * FROM users WHERE email = 'admin@viettouraudio.vn';`
2. Check EXPLAIN plan
3. Should use index on email column

**Expected Result:** ✅ Query uses index, fast execution

**Pass/Fail:** ___  
**Notes:** ___

---

### DB-004: UTF-8 Vietnamese Text
**Objective:** Database stores Vietnamese text correctly  
**Steps:**
1. Query: `SELECT name FROM pois LIMIT 1;` (should have Vietnamese name)
2. Verify Vietnamese characters display correctly (Á, É, Í, Ó, Ú, à, è, etc.)

**Expected Result:** ✅ Vietnamese characters display correctly

**Pass/Fail:** ___  
**Notes:** ___

---

### DB-005: Timestamp Defaults
**Objective:** created_at, updated_at auto-populated  
**Steps:**
1. Insert new POI without specifying timestamps
2. Query the row
3. Verify created_at and updated_at have values

**Expected Result:** ✅ Timestamps auto-set to current time

**Pass/Fail:** ___  
**Notes:** ___

---

### DB-006: Cascade Delete Works
**Objective:** When vendor deleted, child records cascade  
**Steps:**
1. Select vendor_id with POIs: `SELECT DISTINCT vendor_id FROM stalls LIMIT 1;`
2. Delete that vendor: `DELETE FROM vendors WHERE id = <vendor_id>;`
3. Verify all stalls and POIs for that vendor also deleted

**Expected Result:** ✅ Child records deleted via cascade

**Pass/Fail:** ___  
**Notes:** ___

---

## 7. API ENDPOINT TESTS

### API-001: GET /health (.NET API)
**Test URL:** `http://localhost:5000/health`  
**Expected (200):**
```json
{
  "ok": true,
  "database": true
}
```

**Pass/Fail:** ___  
**Notes:** ___

---

### API-002: GET /health (Admin API)
**Test URL:** `http://localhost:5001/health`  
**Expected (200):**
```json
{
  "ok": true
}
```

**Pass/Fail:** ___  
**Notes:** ___

---

### API-003: GET /api/pois (Visitor List)
**Test URL:** `http://localhost:5000/api/pois`  
**Expected (200):** Array of POIs with name, stall_id, lat/lon, status

**Pass/Fail:** ___  
**Notes:** ___

---

### API-004: POST /api/admin/auth/login
**Already tested in AUTH-001**

**Pass/Fail:** ___  

---

### API-005: GET /api/admin/vendors (with auth)
**Headers:** `Authorization: Bearer <admin_token>`  
**Expected (200):** Array of vendors with status, name, etc.

**Pass/Fail:** ___  
**Notes:** ___

---

### API-006: POST /api/admin/pois (Create)
**Headers:** `Authorization: Bearer <admin_token>`  
**Request body:** POI data  
**Expected (201):** Created POI with id

**Pass/Fail:** ___  
**Notes:** ___

---

### API-007: PUT /api/admin/pois/:poiId (Update)
**Headers:** `Authorization: Bearer <admin_token>`  
**Request body:** Updated POI data  
**Expected (200):** Updated POI

**Pass/Fail:** ___  
**Notes:** ___

---

### API-008: DELETE /api/admin/pois/:poiId
**Headers:** `Authorization: Bearer <admin_token>`  
**Expected (200):** Success message or deleted POI

**Pass/Fail:** ___  
**Notes:** ___

---

### API-009: GET /api/admin/qr-codes
**Headers:** `Authorization: Bearer <admin_token>`  
**Expected (200):** Array of QR codes

**Pass/Fail:** ___  
**Notes:** ___

---

### API-010: POST /api/qr-codes/scan (Guest)
**Request body:** `{ "qrToken": "...", "guestId": "..." }`  
**Expected (200):** POI/tour data for QR code

**Pass/Fail:** ___  
**Notes:** ___

---

### API-011: POST /api/media/upload
**Headers:** `Authorization: Bearer <admin_token>`, `Content-Type: multipart/form-data`  
**Form Data:** file (image), type (poi/stall/narration)  
**Expected (200):** Upload successful, URL returned

**Pass/Fail:** ___  
**Notes:** ___

---

### API-012: GET /api/vendor/dashboard (Vendor)
**Headers:** `Authorization: Bearer <vendor_token>`  
**Expected (200):** Vendor dashboard data (metrics, daily stats, etc.)

**Pass/Fail:** ___  
**Notes:** ___

---

### API-013: GET /api/vendor/pois (Vendor)
**Headers:** `Authorization: Bearer <vendor_token>`  
**Expected (200):** Array of POIs belonging to this vendor only

**Pass/Fail:** ___  
**Notes:** ___

---

### API-014: POST /api/vendor/pois/contents (Submit Narration)
**Headers:** `Authorization: Bearer <vendor_token>`  
**Request body:** Narration data  
**Expected (201):** Narration created with status PENDING

**Pass/Fail:** ___  
**Notes:** ___

---

### API-015: GET /api/vendor/revenue (Vendor)
**Headers:** `Authorization: Bearer <vendor_token>`  
**Expected (200):** Vendor wallet and revenue data

**Pass/Fail:** ___  
**Notes:** ___

---

### API-016: POST /api/admin/vendors/:vendorId/approve
**Headers:** `Authorization: Bearer <admin_token>`  
**Expected (200):** Vendor status changed to APPROVED

**Pass/Fail:** ___  
**Notes:** ___

---

### API-017: PATCH /api/admin/vendors/:vendorId/reject
**Headers:** `Authorization: Bearer <admin_token>`  
**Request body:** `{ "reason": "..." }`  
**Expected (200):** Vendor status changed to REJECTED

**Pass/Fail:** ___  
**Notes:** ___

---

### API-018: PATCH /api/admin/pois/:poiId/contents/:contentId/approve
**Headers:** `Authorization: Bearer <admin_token>`  
**Expected (200):** Narration status APPROVED

**Pass/Fail:** ___  
**Notes:** ___

---

### API-019: PATCH /api/admin/pois/:poiId/contents/:contentId/reject
**Headers:** `Authorization: Bearer <admin_token>`  
**Request body:** `{ "reason": "..." }`  
**Expected (200):** Narration status REJECTED

**Pass/Fail:** ___  
**Notes:** ___

---

### API-020: GET /api/admin/analytics/dashboard
**Headers:** `Authorization: Bearer <admin_token>`  
**Query Params:** `?days=7`  
**Expected (200):** Analytics data (total POIs, scans, visitors, etc.)

**Pass/Fail:** ___  
**Notes:** ___

---

## 8. ERROR HANDLING TESTS

### ERR-001: 400 Bad Request
**Objective:** Malformed request returns 400  
**Steps:**
1. Send request without required field
2. Server should return 400 with error message

**Expected Result:** ✅ 400 status, error details

**Pass/Fail:** ___  
**Notes:** ___

---

### ERR-002: 401 Unauthorized - No Token
**Objective:** Protected endpoint without token returns 401  
**Steps:**
1. Call `/api/admin/vendors` without Authorization header
2. Should return 401

**Expected Result:** ✅ 401 status

**Pass/Fail:** ___  
**Notes:** ___

---

### ERR-003: 401 Unauthorized - Invalid Token
**Objective:** Invalid token returns 401  
**Steps:**
1. Call endpoint with invalid token
2. Should return 401

**Expected Result:** ✅ 401 status

**Pass/Fail:** ___  
**Notes:** ___

---

### ERR-004: 403 Forbidden - Wrong Role
**Objective:** User without permission returns 403  
**Steps:**
1. Login as vendor
2. Try to access admin-only endpoint
3. Should return 403 FORBIDDEN

**Expected Result:** ✅ 403 status

**Pass/Fail:** ___  
**Notes:** ___

---

### ERR-005: 404 Not Found
**Objective:** Non-existent resource returns 404  
**Steps:**
1. Request: `GET /api/pois/999999`
2. Should return 404

**Expected Result:** ✅ 404 status

**Pass/Fail:** ___  
**Notes:** ___

---

### ERR-006: 409 Conflict - Duplicate
**Objective:** Duplicate creation returns 409  
**Steps:**
1. Try to create POI with duplicate slug
2. Should return 409

**Expected Result:** ✅ 409 status

**Pass/Fail:** ___  
**Notes:** ___

---

### ERR-007: 500 Server Error
**Objective:** Server error returns 500  
**Steps:**
1. Intentionally cause server error (e.g., database disconnect)
2. Make request
3. Should return 500

**Expected Result:** ✅ 500 status

**Pass/Fail:** ___  
**Notes:** ___

---

### ERR-008: Network Error Handling
**Objective:** Frontend handles network errors gracefully  
**Steps:**
1. Turn off backend services
2. Try to login from frontend
3. Should show error message, not crash

**Expected Result:** ✅ Error displayed, app doesn't crash

**Pass/Fail:** ___  
**Notes:** ___

---

## TEST EXECUTION NOTES

### Tester Information
- **Name:** ___________________
- **Date:** ___________________
- **Environment:** Windows / Local XAMPP
- **Browser:** Chrome / Firefox / Edge

### Summary
- **Total Tests:** 84
- **Passed:** ___
- **Failed:** ___
- **Blocked:** ___
- **Skipped:** ___

### Issues Found
1. _______________
2. _______________
3. _______________

### Recommendations
___________________________________________________________________

### Sign-Off
- **Tester:** _________________ Date: _________
- **Lead:** _________________ Date: _________

---

**Document Version:** 1.0  
**Last Updated:** 2026-06-23  
**Next Review:** After first test run
