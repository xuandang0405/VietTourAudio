# SYSTEM STATUS CHECK

**Date:** 2026-06-23  
**Status:** Initial Check  
**Target:** Verify all systems ready for integration testing

---

## 1. DATABASE

### Schema Verification
- [ ] Database exists: `viettuoraudio`
- [ ] All 24 tables created
- [ ] Foreign key relationships intact
- [ ] Indexes present
- [ ] UTF-8 charset correct

### Migration Status
- [ ] schema.sql runs without errors
- [ ] seed.sql runs without errors
- [ ] Seed data imported correctly
- [ ] No duplicate unique constraint violations
- [ ] Demo accounts present (admin, vendor, moderator)

### Critical Tables Existence
- [ ] users table ✓
- [ ] vendors table ✓
- [ ] vendor_portal_users table ✓
- [ ] stalls table (implied)
- [ ] pois table ✓
- [ ] poi_contents table ✓
- [ ] qr_codes table ✓
- [ ] tour table ❌ **MISSING - NEEDS TO BE ADDED**
- [ ] tour_pois table (junction) ❌ **MISSING - NEEDS TO BE ADDED**
- [ ] favorites table ❌ **MISSING - NEEDS TO BE ADDED**
- [ ] play_history table ✓
- [ ] visit_events table ✓
- [ ] qr_scan_events table ✓
- [ ] analytics_daily_stall table ✓
- [ ] payments table ✓

---

## 2. BACKEND SERVICES

### Visitor API (.NET, Port 5000)

#### Build Status
- [ ] `dotnet build` passes without errors
- [ ] All dependencies resolved
- [ ] No compilation warnings

#### Startup Status
- [x] dotnet run fails? No
- [ ] Listens on http://localhost:5000
- [ ] Health endpoint responds: GET /health
- [ ] Swagger available: GET /swagger

#### Controller Endpoints Exist
- [ ] AuthController (likely for visitor/guest auth)
- [ ] AdminController
- [ ] AnalyticsController
- [ ] MediaController
- [ ] PaymentController
- [ ] PoiContentController
- [ ] PoiController
- [ ] QrCodeController
- [ ] StallController
- [ ] UserController
- [ ] **Missing:** TourController? Need to check

#### Database Connection
- [ ] App DbContext properly configured
- [ ] MySQL connection string correct
- [ ] Can read from users table
- [ ] Can write to tables

#### CORS Configuration
- [x] Allows localhost:5173 ✓
- [x] Allows localhost:5174 ✓
- [x] Allows 127.0.0.1:5173 ✓
- [x] Allows 127.0.0.1:5174 ✓

---

### Admin API (Node/Express, Port 5001)

#### Build Status
- [ ] `npm run build` passes (tsc compilation)
- [ ] All TypeScript compiles
- [ ] No type errors

#### Startup Status
- [ ] `npm run dev` starts without errors
- [ ] Listens on http://localhost:5001
- [ ] Health endpoint responds: GET /health

#### Route Files Present
- [x] auth.routes.ts ✓
- [x] vendor-auth.routes.ts ✓
- [x] vendor-portal.routes.ts ✓
- [x] vendor.routes.ts ✓
- [x] content.routes.ts ✓
- [x] poi.routes.ts ✓
- [x] subscription.routes.ts ✓
- [x] revenue.routes.ts ✓
- [x] analytics.routes.ts ✓
- [x] geofence.routes.ts ✓
- [x] audit.routes.ts ✓
- [x] user.routes.ts ✓
- [x] wallet.routes.ts ✓
- [x] topup.routes.ts ✓

#### Database Connection
- [ ] Can connect to MySQL
- [ ] Queries work
- [ ] Seed data accessible

#### CORS Configuration
- [ ] Configured for frontend ports

---

## 3. FRONTEND

### Client Build (React/Vite, Port 5173)

#### Build Status
- [x] `npm run build` passes ✓
- [x] No errors ✓
- [x] Production dist created ✓

#### Dev Server Status
- [ ] `npm run dev` starts on port 5173
- [ ] HMR (Hot Module Reload) works
- [ ] No console errors on startup

#### Page Presence Verification
- [x] AdminLoginPage.jsx ✓
- [x] AdminDashboard.jsx (if exists)
- [x] AdminPois.jsx ✓
- [x] AdminAnalytics.jsx ✓
- [x] AdminAuditLogs.jsx ✓
- [x] AdminCommissions.jsx ✓
- [x] AdminContent.jsx ✓
- [x] AdminGeofences.jsx ✓
- [x] AdminRevenue.jsx ✓
- [x] AdminSubscriptions.jsx ✓
- [x] AdminTopUps.jsx ✓
- [x] AdminUsers.jsx ✓
- [x] AdminVendors.jsx ✓
- [x] AdminVendorAccounts.jsx ✓
- [x] AdminVendorDetail.jsx ✓
- [x] VendorLoginPage.jsx ✓
- [x] VendorDashboard.jsx ✓
- [x] VendorPOIs.jsx ✓
- [x] VendorRevenue.jsx ✓
- [x] Visitor pages (Landing, List, Map, Zone, Settings) ✓

#### Store Configuration
- [ ] authStore.js configured for admin
- [ ] vendorAuthStore.js configured for vendor
- [ ] Token keys properly separated

#### API Client Configuration
- [ ] apiClient.js has axios instance
- [ ] Interceptor adds Bearer token
- [ ] Base URL configured

---

## 4. AUTHENTICATION FLOW

### Admin Login
```
Frontend: POST /api/admin/auth/login
├── Backend: Check email/password in users table
├── Verify role = ADMIN
├── Generate JWT token
└── Return: { token, accessToken, refreshToken, user }

Frontend: Store token in localStorage
Backend: Add Authorization header to all requests
```

**Status:** 🔍 NEEDS TESTING

### Vendor Login
```
Frontend: POST /api/vendor/auth/login
├── Backend: Check email/password in vendor_portal_users table
├── Verify status = ACTIVE
├── Verify parent vendor.status = APPROVED
├── Generate JWT token with vendorId
└── Return: { token, accessToken, refreshToken, user }

Frontend: Store token in vendorAuthStore (separate from admin)
Backend: Add Authorization header
Backend: Filter queries by vendorId
```

**Status:** 🔍 NEEDS TESTING

### Token Refresh
```
When token expires:
├── Interceptor catches 401
├── Send refresh token
├── Get new access token
├── Retry original request
```

**Status:** ❌ NOT IMPLEMENTED - NEEDS TO BE ADDED

### 401 Error Handling
```
When 401 received:
├── Clear token from localStorage
├── Redirect to login page
├── Show error message
```

**Status:** ❌ NOT IMPLEMENTED - NEEDS TO BE ADDED

---

## 5. CRITICAL ISSUES TO FIX

### Database Issues
1. **MISSING TABLES:**
   - [ ] Create `tours` table
   - [ ] Create `tour_pois` junction table
   - [ ] Create `favorites` table (if not exists)

### Backend Issues
1. **API Endpoints:**
   - [ ] Verify all auth endpoints respond correctly
   - [ ] Check 401 responses format
   - [ ] Verify error response format consistency

2. **Database:**
   - [ ] Test MySQL connection pooling
   - [ ] Verify seed data loaded
   - [ ] Test role/status filtering

### Frontend Issues
1. **Token Management:**
   - [ ] Fix 401 interceptor
   - [ ] Add auto-refresh logic
   - [ ] Verify token persistence

2. **Form Handling:**
   - [ ] Add loading state on login form
   - [ ] Add error display
   - [ ] Validate form fields

3. **Navigation:**
   - [ ] Verify route guards work
   - [ ] Verify redirect after login
   - [ ] Verify role separation (admin vs vendor)

---

## 6. VALIDATION CHECKLIST

### Must-Have Before Testing
- [ ] Database setup documented and tested
- [ ] .env files configured correctly
- [ ] Port assignments (5000, 5001, 5173) free
- [ ] All services build successfully
- [ ] Demo accounts in database
- [ ] CORS configured on both APIs

### Testing Prerequisites
- [ ] Backend services can start
- [ ] Frontend can connect to backend
- [ ] Database queries work
- [ ] Error responses are clear
- [ ] Token storage works
- [ ] Interceptors work

---

## 7. NEXT STEPS

### Phase 1: Infrastructure Validation (Today)
1. Setup database from scratch
2. Verify all builds pass
3. Start all services
4. Test endpoints with Postman/curl
5. Verify admin login works
6. Verify vendor login works
7. Check 401 handling

### Phase 2: Fix Critical Issues
1. Add missing tables
2. Fix 401 interceptor
3. Implement auto-refresh
4. Add error handling
5. Add loading states

### Phase 3: Feature Validation
1. Verify all endpoints match API contract
2. Test CRUD operations
3. Test filters/search
4. Test file uploads
5. Test analytics tracking

### Phase 4: End-to-End Testing
1. Complete flow: QR → Tour → Audio → Analytics
2. Mobile/PWA testing
3. Performance testing
4. Error scenario testing

---

**Last Updated:** 2026-06-23  
**Next Review:** After infrastructure validation
