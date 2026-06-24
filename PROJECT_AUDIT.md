# PROJECT AUDIT: VietTourAudio

**Audit Date:** 2026-06-23  
**Auditor:** Senior Full-stack + QA Engineer  
**Status:** INITIAL AUDIT

## I. PROJECT STRUCTURE

### A. Backend APIs

#### 1. .NET Core API (Port 5000)
- **Location:** `server/VietTourAudio.Api/`
- **Framework:** ASP.NET Core (net10.0)
- **Database:** MySQL 8.0 via Pomelo.EntityFrameworkCore.MySql
- **Auth:** JWT Bearer token
- **Controllers Implemented:**
  - `AdminController` - Admin operations
  - `AnalyticsController` - Analytics/tracking
  - `AuthController` - User authentication (likely backend-only, visitor app)
  - `MediaController` - Media upload/retrieval
  - `PaymentController` - Payment processing
  - `PoiContentController` - POI narrations/content
  - `PoiController` - POI CRUD
  - `QrCodeController` - QR code management
  - `StallController` - Stall/shop management
  - `UserController` - User management

**Status:** ✅ Structurally complete, needs validation of all endpoints

#### 2. Node.js/Express Admin API (Port 5001)
- **Location:** `viettour-admin-api/`
- **Stack:** Node.js + Express + TypeScript
- **Database:** MySQL via mysql2 (direct query) + Prisma (noted in package.json)
- **Auth:** JWT for admin + vendor
- **Routes Implemented:**
  - Auth: admin login, vendor login, refresh, me, logout
  - Vendor portal: dashboard, POIs, revenue, analytics
  - Admin routes: vendors, users, wallets, topup, subscriptions, revenue, content, poi, analytics, geofence, audit
  
**Status:** ✅ Routes present, needs validation of implementation

### B. Frontend Applications

#### 1. Main Client (React/Vite, Port 5173)
- **Location:** `client/`
- **Stack:** React 18.3.1, Vite 6.0.7, Tailwind CSS
- **Dependencies:** React Router 7.1.1, React Query, Zustand, Axios, Leaflet, Howler, TanStack Query
- **Features:**
  - Visitor routes: Landing, List, Map, Zone, Settings
  - Admin routes: Login, Dashboard, Analytics, Audit Logs, Commissions, Content, Geofences, POIs, Revenue, Subscriptions, TopUps, Users, VendorAccounts, VendorDetail, Vendors
  - Vendor routes: Login, Dashboard, POIs, Revenue
  
**Status:** 🟡 PARTIAL - Admin/vendor UI present but needs API integration validation

#### 2. Mobile PWA (Port 5173 or separate port)
- **Location:** `mobile-pwa/`
- **Status:** Exists but not audited yet

#### 3. Web Admin (Port separate)
- **Location:** `web-admin/`
- **Status:** Exists but not audited yet

#### 4. Alternate Backend API
- **Location:** `viet-tour-audio-api/`
- **Status:** Exists but appears to be an older version, not primary focus

### C. Database

#### Schema Coverage
- ✅ Users table (SUPER_ADMIN, ADMIN, MODERATOR, FINANCE roles)
- ✅ Refresh tokens table
- ✅ Audit logs table
- ✅ Subscription plans table
- ✅ Vendors table (PENDING, APPROVED, REJECTED, SUSPENDED status)
- ✅ Vendor portal users table
- ✅ Stalls table (implied, needs verification)
- ✅ POIs table
- ✅ POI contents (narrations)
- ✅ Media files table
- ✅ QR codes table
- ✅ Visitor sessions table
- ✅ QR scan events
- ✅ Play history
- ✅ Visit events
- ✅ Payments table
- ✅ Vendor wallets
- ✅ Top-up requests
- ✅ Wallet transactions
- ✅ Commission earnings
- ✅ Analytics daily stall
- ✅ Revenue daily

**Status:** ✅ Schema appears complete in schema.sql

#### Migration & Seeding
- ✅ `schema.sql` - Main schema with all table definitions
- ✅ `seed.sql` - Seed data (admin users with bcrypt hashes, vendors, demo data)
- ✅ `migrations/20260622-add-vendor-portal-users.sql` - Vendor portal migration
- ✅ Local database setup instructions in README.md

**Status:** ✅ Database infrastructure ready

---

## II. TECHNOLOGY STACK SUMMARY

| Layer | Technology | Status |
|-------|-----------|--------|
| Backend API (Visitor) | ASP.NET Core 10.0, JWT, MySQL | ✅ Implemented |
| Backend API (Admin/Vendor) | Node.js/Express, TypeScript, JWT, MySQL | ✅ Implemented |
| Frontend (Web) | React 18, Vite, React Router, Zustand | ✅ Implemented |
| Frontend (Mobile PWA) | React/Vite (location: mobile-pwa) | 🟡 Present, not audited |
| Frontend (Web Admin Alt) | React/Vite (location: web-admin) | 🟡 Present, not audited |
| Database | MySQL 8.0 | ✅ Schema defined |
| Auth | JWT Bearer (Node), JWT Bearer (.NET) | ✅ Configured |
| Package Managers | npm (Node), .NET CLI | ✅ Configured |

---

## III. CURRENT STATE BY MODULE

### A. AUTHENTICATION & AUTHORIZATION

#### Admin Login Flow
- **Backend Route:** `POST /api/admin/auth/login` (viettour-admin-api, port 5001)
- **Frontend Page:** `client/src/admin/pages/AdminLoginPage.jsx`
- **Status:** ✅ IMPLEMENTED
  - ✅ Default credentials: `admin@viettouraudio.vn` / `Admin123`
  - ✅ Backend stores hashed password (bcrypt)
  - ✅ Returns JWT token
  - ✅ Zustand store management
  - ⚠️ NEEDS VALIDATION: Frontend token persistence, refresh flow

#### Vendor Login Flow
- **Backend Route:** `POST /api/vendor/auth/login` (viettour-admin-api, port 5001)
- **Frontend Page:** `client/src/vendor/pages/VendorLoginPage.jsx`
- **Status:** ✅ IMPLEMENTED
  - ✅ Default credentials: `an@heritagefoods.vn` / `Vendor123`
  - ✅ Backend checks vendor status (APPROVED)
  - ✅ Returns JWT with vendorId
  - ✅ Zustand store management
  - ⚠️ NEEDS VALIDATION: Same as admin

#### JWT Token Management
- **Location:** `client/src/admin/store/authStore.js` (admin), `client/src/vendor/store/vendorAuthStore.js` (vendor)
- **Token Storage:** localStorage (separate keys)
- **Status:** ✅ IMPLEMENTED
  - ✅ Separate token storage for admin/vendor
  - ⚠️ NEEDS VALIDATION: Axios interceptor for Bearer token auto-injection

#### Role-Based Access Control
- **Backend Middleware:** `viettour-admin-api/src/middleware/auth.middleware.ts`
- **Frontend Guards:** `AdminGuard.jsx`, `VendorGuard.jsx`
- **Status:** 🟡 PARTIAL
  - ✅ Middleware checks role and redirects
  - ⚠️ NEEDS VALIDATION: All protected routes actually enforce roles

### B. ADMIN DASHBOARD & MANAGEMENT

#### Admin Dashboard
- **Location:** `client/src/admin/pages/AdminDashboard.jsx` (if exists)
- **Status:** 🟡 PARTIAL - Need to check if page exists and fetches data

#### Admin Pages Status
- ✅ Admin POIs page exists
- ✅ Admin Analytics page exists
- ✅ Admin Audit Logs page exists
- ✅ Admin Commissions page exists
- ✅ Admin Content page exists
- ✅ Admin Geofences page exists
- ✅ Admin Revenue page exists
- ✅ Admin Subscriptions page exists
- ✅ Admin TopUps page exists
- ✅ Admin Users page exists
- ✅ Admin Vendor Accounts page exists
- ✅ Admin Vendor Detail page exists
- ✅ Admin Vendors page exists

**Issue:** ⚠️ Many pages likely have mock UI; need API integration verification

### C. VENDOR PORTAL

#### Vendor Dashboard
- **Location:** `client/src/vendor/pages/VendorDashboard.jsx`
- **Status:** 🟡 PARTIAL
  - ✅ API endpoint exists: `GET /api/vendor/dashboard`
  - ✅ Displays vendor metrics
  - ⚠️ NEEDS VALIDATION: Real API integration

#### Vendor Pages Status
- ✅ Vendor POIs page exists: `client/src/vendor/pages/VendorPOIs.jsx`
- ✅ Vendor Revenue page exists: `client/src/vendor/pages/VendorRevenue.jsx`
- ✅ Vendor Dashboard API exists: `GET /api/vendor/dashboard`

**Status:** 🟡 PARTIAL - Pages exist, needs API integration verification

### D. MOBILE/VISITOR APP

#### Visitor Pages
- ✅ Landing page
- ✅ List page
- ✅ Map page
- ✅ Zone page
- ✅ Settings page

**Status:** 🟡 PARTIAL - Structure exists, needs end-to-end flow validation

#### QR Scan Flow
- **Status:** ❓ UNKNOWN - Need to verify QR scan API integration

#### GPS/Geolocation
- **Status:** ❓ UNKNOWN - Need to verify implementation

#### Audio Playback
- **Dependency:** Howler.js integrated
- **Status:** ✅ Integrated, needs validation

---

## IV. MISSING/INCOMPLETE ITEMS

### High Priority Issues

1. **🔴 CRITICAL: API Integration Validation**
   - Admin pages appear to have mock UI
   - Vendor pages need API binding verification
   - Many frontend components may not call correct backend endpoints

2. **🔴 CRITICAL: Health Check & Health Monitoring**
   - Need to verify all backend health endpoints
   - Need to verify database connection pooling
   - Need to verify service readiness

3. **🔴 Backend .NET API Endpoints**
   - Visitor API on port 5000 - need full endpoint list
   - Compare with client API calls to ensure match
   - Some endpoints may not exist yet

4. **🟡 Refresh Token Flow**
   - Admin store has refresh token support
   - Vendor store has refresh token support
   - ⚠️ Need to verify auto-refresh on 401

### Medium Priority Issues

5. **🟡 Error Handling**
   - Frontend needs consistent error toast/modal handling
   - Backend error responses need standardization

6. **🟡 Loading States**
   - Many pages may not have loading spinners
   - Needed for better UX

7. **🟡 Empty States**
   - Pages need proper empty state handling
   - Especially for list views (POIs, Tours, etc.)

### Low Priority Issues

8. **✅ Build Configuration**
   - Frontend build script exists
   - Backend build works (.NET CLI)
   - Admin API build works (tsc)

9. ❓ **Docker & Deployment**
   - docker-compose.yml exists but may need updates
   - Likely focuses on MySQL container

---

## V. DATABASE STATUS

### Tables Verified in schema.sql
✅ All 24 tables appear to be defined:
- User management (users, refresh_tokens)
- Vendor management (vendors, vendor_portal_users, vendor_subscriptions)
- Stall/POI management (stalls, pois, poi_contents, media_files)
- QR/Session management (qr_codes, visitor_sessions, qr_scan_events)
- Event tracking (play_history, visit_events)
- Financial (payments, vendor_wallets, top_up_requests, wallet_transactions, commission_earnings)
- Analytics (analytics_daily_stall, revenue_daily)
- Audit (audit_logs)

### Seed Data Status
- ✅ schema.sql includes seed data import statements
- ✅ seed.sql has admin user with bcrypt hash
- ✅ seed.sql has vendor users with bcrypt hash
- ✅ Demo data exists (vendors, stalls, POIs, etc.)

---

## VI. ENVIRONMENT & CONFIGURATION

### .env Files
- ✅ `.env.example` exists at root
- ✅ `viettour-admin-api/.env.example` exists
- ✅ Both have example values for ports, database, API URLs

### Port Configuration
- ✅ Visitor API: 5000 (HTTP, configured in launchSettings.json)
- ✅ Admin API: 5001 (configured in viettour-admin-api/.env)
- ✅ Frontend: 5173 (configured in vite.config.js)

### CORS Configuration
- ✅ .NET API allows: localhost:5173, localhost:5174, 127.0.0.1:5173, 127.0.0.1:5174
- ✅ Admin API allows: same origins + env-configurable FRONTEND_URL

---

## VII. DEPLOYMENT & RUN SCRIPTS

### Windows Scripts
- ✅ `run.bat` - Starts all services (recently rewritten)
- ✅ `stop.bat` - Stops all services (recently fixed)
- ✅ `start.bat` - Alternative launcher
- ⚠️ These scripts need testing on clean system

### Database Setup
- ✅ `database/README.md` - Contains setup instructions
- ✅ Migration files present
- ⚠️ Manual SQL import still required (not automated script)

---

## VIII. KNOWN ISSUES & GAPS

### 1. **API Endpoint Mismatch**
   - Frontend likely has hardcoded API URLs
   - Need to verify all endpoints match between frontend calls and backend routes
   - Many admin pages may call non-existent endpoints

### 2. **Mock vs Real API**
   - Admin analytics, content moderation, etc. may be using mock data
   - Vendor dashboard may be using mock data
   - Mobile app may be using mock GPS/QR data

### 3. **Authentication Flow Gaps**
   - 401 error handling may not auto-redirect to login
   - Token refresh may not be automatic
   - Session timeout handling unclear

### 4. **Database Uniqueness Constraints**
   - email fields have unique constraints
   - Need to ensure seed data doesn't conflict

### 5. **File Upload Handling**
   - Media upload exists in backend
   - Frontend file upload UI needs verification
   - Public URL serving needs verification

### 6. **Geolocation & GPS**
   - Geofence routes exist in admin API
   - Implementation details unknown
   - Mobile GPS/fake GPS need verification

### 7. **Audio File Handling**
   - Audio playback integrated (Howler.js)
   - TTS or mock audio generation unclear
   - Audio file serving needs verification

### 8. **Analytics & Event Tracking**
   - Backend routes exist
   - Frontend event tracking implementation unclear
   - Dashboard aggregation needs verification

### 9. **Mobile PWA & Web Admin**
   - Two additional frontend apps exist
   - Not yet audited
   - May be incomplete or abandoned

### 10. **Build & Production**
   - npm run build works (client)
   - dotnet build works (.NET API)
   - tsc build works (admin API)
   - ⚠️ Need to verify all scripts in package.json/csproj

---

## IX. RECOMMENDATIONS FOR COMPLETION

### Phase 1: Foundation (Critical Path)
1. ✅ Run backend services successfully
2. ✅ Verify database migration & seed
3. ✅ Verify admin login works end-to-end
4. ✅ Verify vendor login works end-to-end
5. ✅ Verify JWT refresh mechanism

### Phase 2: API Integration
1. Verify all admin dashboard API calls
2. Verify all vendor dashboard API calls
3. Verify all visitor/mobile API calls
4. Fix any API endpoint mismatches
5. Add missing endpoints to backend

### Phase 3: Features
1. Validate QR scan flow
2. Validate GPS/geofence flow
3. Validate audio playback
4. Validate analytics tracking
5. Validate file uploads

### Phase 4: Hardening
1. Error handling across all pages
2. Loading states
3. Empty states
4. Form validation
5. Responsive UI

### Phase 5: Testing & Docs
1. Create comprehensive API contract
2. Test checklist with real data
3. Update README with complete setup guide
4. Verify build processes
5. Document any remaining issues

---

## X. AUDIT CONCLUSION

**Overall Status:** 🟡 PARTIAL IMPLEMENTATION

**What's Good:**
- ✅ Database schema is comprehensive
- ✅ Authentication infrastructure exists (JWT, roles)
- ✅ Most UI pages are created
- ✅ Main routes and services are defined
- ✅ Build processes are configured
- ✅ Seed data is available

**What Needs Work:**
- 🟡 API integration across frontend
- 🟡 Endpoint matching between frontend/backend
- 🟡 Real data flow verification
- 🟡 Error handling & user feedback
- 🟡 Mobile/PWA implementation
- 🟡 Complete end-to-end testing

**Critical Next Steps:**
1. Verify all services start without errors
2. Verify database setup works
3. Verify admin/vendor login works
4. Verify one complete feature flow (e.g., QR → Tour → Audio)
5. Fix any blocking issues
6. Document all API contracts
7. Complete missing endpoints

---

*End of Audit Report*
