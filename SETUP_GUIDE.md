# VIETTOURAUDIO - SETUP & VALIDATION GUIDE

**Version:** 1.0  
**Last Updated:** 2026-06-23  
**Status:** Ready for Local Testing

---

## PART 1: ENVIRONMENT SETUP

### Prerequisites
- **OS:** Windows 10/11
- **Node.js:** 18+ (LTS recommended)
- **MySQL:** 8.0+ (via XAMPP or local install)
- **.NET:** 10.0 SDK
- **Visual Studio Code** (optional but recommended)

### Quick Check
```powershell
node --version       # Should be v18+
npm --version       # Should be 9+
dotnet --version    # Should be 10.0+
```

---

## PART 2: DATABASE SETUP

### Option A: Fresh Setup (Recommended for First Time)

#### Step 1: Start MySQL
```powershell
# If using XAMPP:
# 1. Open XAMPP Control Panel
# 2. Click "Start" next to MySQL
# Verify: Should show "MySQL is running on port 3306"

# Or if MySQL is installed as service:
net start MySQL80   # or your MySQL version
```

#### Step 2: Create Database from Schema
```powershell
cd c:\Users\UNITY\Desktop\VietTourAudio-project-ready-database-integration\database

# Create database and tables
mysql -h localhost -u root < schema.sql

# Import seed data
mysql -h localhost -u root < seed.sql

# Verify
mysql -h localhost -u root viettuoraudio -e "SELECT COUNT(*) AS tables FROM information_schema.tables WHERE table_schema='viettuoraudio';"
# Should show: 26 tables
```

### Option B: Existing Database (Add Missing Tables)

If you already have a viettuoraudio database and just need to add missing tables:

```powershell
cd c:\Users\UNITY\Desktop\VietTourAudio-project-ready-database-integration\database

mysql -h localhost -u root < migration-add-missing-tables.sql
```

### Verify Database Tables
```powershell
mysql -h localhost -u root viettuoraudio -e "SHOW TABLES;"
```

Expected tables (26 total):
```
analytics_daily_stall
audit_logs
commission_earnings
favorites           ← NEW
media_files
payments
play_history
poi_contents
pois
qr_codes
qr_scan_events
refresh_tokens
revenue_daily
stalls
subscription_plans
tour_pois          ← NEW
tours              ← NEW
top_up_requests
users
vendor_portal_users
vendor_subscriptions
vendor_wallets
vendors
visit_events
visitor_sessions
wallet_transactions
```

### Verify Seed Data
```powershell
mysql -h localhost -u root viettuoraudio -e "
SELECT 'Users:' AS check_type, COUNT(*) AS count FROM users
UNION ALL
SELECT 'Vendors:', COUNT(*) FROM vendors
UNION ALL
SELECT 'Vendor Portal Users:', COUNT(*) FROM vendor_portal_users
UNION ALL
SELECT 'POIs:', COUNT(*) FROM pois
UNION ALL
SELECT 'QR Codes:', COUNT(*) FROM qr_codes;
"
```

Expected output:
```
Users: 1 (admin@viettouraudio.vn)
Vendors: 5
Vendor Portal Users: 1 (an@heritagefoods.vn)
POIs: 2
QR Codes: 3
```

---

## PART 3: CONFIGURE ENVIRONMENT

### Backend Configuration

#### .NET API (.env in `server/VietTourAudio.Api/`)

Create `appsettings.Development.json` if needed:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "server=localhost;port=3306;database=viettuoraudio;user=root;password=;SslMode=None;AllowPublicKeyRetrieval=True;"
  },
  "JwtSettings": {
    "SecretKey": "your-secret-key-change-in-production",
    "Issuer": "viettuoraudio",
    "Audience": "viettuoraudio-users"
  },
  "Storage": {
    "PublicBaseUrl": "http://localhost:5000/uploads"
  }
}
```

#### Admin API (Node.js)

Copy `.env.example` to `.env`:
```powershell
cd viettour-admin-api
Copy-Item .env.example .env
```

Edit `viettour-admin-api/.env`:
```env
PORT=5001
FRONTEND_URL=http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=viettuoraudio

# JWT
JWT_SECRET=your-secret-key-change-in-production

# Session
SESSION_SECRET=your-session-secret
```

#### Frontend (React/Vite)

Create `.env.local` in `client/`:
```env
VITE_DEV_PORT=5173
VITE_API_BASE_URL=http://localhost:5000/api
VITE_ADMIN_API_BASE_URL=http://localhost:5001/api
VITE_VENDOR_API_BASE_URL=http://localhost:5001/api/vendor
VITE_VENDOR_AUTH_API_BASE_URL=http://localhost:5001/api/vendor/auth
```

---

## PART 4: START SERVICES

### Option A: Use run.bat (Automatic)

```powershell
cd c:\Users\UNITY\Desktop\VietTourAudio-project-ready-database-integration

# Start all services in separate windows
.\run.bat

# Wait 5-10 seconds for services to start
# You should see 3 new command windows open:
# 1. VietTourAudio - .NET API (port 5000)
# 2. VietTourAudio - Admin API (port 5001)
# 3. VietTourAudio - Frontend (port 5173)
```

### Option B: Manual (For Debugging)

#### Terminal 1: .NET API
```powershell
cd server\VietTourAudio.Api
$env:ASPNETCORE_ENVIRONMENT = "Development"
dotnet run --no-launch-profile

# Should output: "Now listening on: http://localhost:5000"
```

#### Terminal 2: Admin API
```powershell
cd viettour-admin-api
npm run dev

# Should output: "Server is running at http://localhost:5001"
```

#### Terminal 3: Frontend
```powershell
cd client
npm run dev

# Should output: "VITE v6.0.7 ready in XXX ms"
# With: "Local: http://localhost:5173/"
```

### Verify All Services Running
```powershell
# Check ports are listening
netstat -ano | findstr /R "5000|5001|5173"

# Should show 3 connections to LISTENING on these ports
```

---

## PART 5: FIRST-TIME SETUP TEST

### Test .NET API Health
```powershell
# In PowerShell:
$response = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing
$response.Content | ConvertFrom-Json | Format-Table

# Expected output:
# ok    database
# ---   --------
# True  True
```

### Test Admin API Health
```powershell
$response = Invoke-WebRequest -Uri "http://localhost:5001/health" -UseBasicParsing
$response.Content | ConvertFrom-Json | Format-Table

# Expected: {"ok":true}
```

### Test Frontend Load
```powershell
# Open browser and navigate to:
# http://localhost:5173

# Should see login page with message:
# "Welcome to VietTourAudio Admin Portal" or similar
```

---

## PART 6: LOGIN & AUTHENTICATION TESTING

### Test Admin Login

#### Using Browser
1. Navigate to `http://localhost:5173/admin/login`
2. Enter credentials:
   - **Email:** `admin@viettouraudio.vn`
   - **Password:** `Admin123`
3. Click "Login"
4. **Expected Result:** Redirect to `/admin/dashboard` with data loaded

#### Using Postman/cURL
```powershell
$body = @{
    email = "admin@viettouraudio.vn"
    password = "Admin123"
} | ConvertTo-Json

$response = Invoke-WebRequest `
    -Uri "http://localhost:5001/api/admin/auth/login" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body $body `
    -UseBasicParsing

$response.Content | ConvertFrom-Json | Format-Table

# Expected output includes:
# success: true
# token: "eyJhbGciOiJIUzI1NiIs..."
# user: { id: "1", email: "admin@viettouraudio.vn", role: "ADMIN" }
```

### Test Vendor Login

#### Using Browser
1. Navigate to `http://localhost:5173/vendor/login`
2. Enter credentials:
   - **Email:** `an@heritagefoods.vn`
   - **Password:** `Vendor123`
3. Click "Login"
4. **Expected Result:** Redirect to `/vendor/dashboard` with vendor data

#### Using Postman/cURL
```powershell
$body = @{
    email = "an@heritagefoods.vn"
    password = "Vendor123"
} | ConvertTo-Json

$response = Invoke-WebRequest `
    -Uri "http://localhost:5001/api/vendor/auth/login" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body $body `
    -UseBasicParsing

$response.Content | ConvertFrom-Json | Format-Table

# Expected output includes:
# success: true
# user: { role: "VENDOR", vendorId: "1" }
```

---

## PART 7: VALIDATION CHECKLIST

### Infrastructure
- [ ] MySQL running on localhost:3306
- [ ] Database `viettuoraudio` created with 26 tables
- [ ] Seed data imported (1 admin, 5 vendors, 2 POIs)
- [ ] .env files configured for both backends
- [ ] .env.local configured for frontend

### Services
- [ ] .NET API builds without errors
- [ ] .NET API starts and listens on 5000
- [ ] .NET API /health endpoint responds OK
- [ ] Admin API builds and starts on 5001
- [ ] Admin API /health endpoint responds OK
- [ ] Frontend starts on 5173 with HMR

### Authentication (Admin)
- [ ] Admin login form loads
- [ ] Default credentials work (admin@viettouraudio.vn / Admin123)
- [ ] JWT token received and stored
- [ ] Redirect to dashboard after login
- [ ] Dashboard shows data (no blank screen)
- [ ] Refresh page keeps auth state (token persisted)
- [ ] Logout works and clears token

### Authentication (Vendor)
- [ ] Vendor login form loads
- [ ] Default credentials work (an@heritagefoods.vn / Vendor123)
- [ ] JWT token received with vendorId
- [ ] Redirect to vendor dashboard
- [ ] Vendor dashboard shows their data only
- [ ] Admin cannot access vendor routes
- [ ] Vendor cannot access admin routes

### Error Handling
- [ ] Invalid credentials show error message
- [ ] Network errors show clear message
- [ ] 401 responses redirect to login
- [ ] Form validation works

---

## PART 8: TROUBLESHOOTING

### "MySQL port already in use"
```powershell
# Check what's using port 3306
netstat -ano | findstr :3306

# If another MySQL is running:
net stop MySQL80
# Wait 10 seconds
# Start your XAMPP MySQL
```

### ".NET API won't start - port 5000 in use"
```powershell
# Find and kill process on 5000
$proc = Get-Process | Where-Object { $_.ProcessName -like "*dotnet*" }
$proc | Stop-Process -Force

# Then restart
```

### "Admin API shows npm ERR! permission denied"
```powershell
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
cd viettour-admin-api
rm -r node_modules
npm install
npm run dev
```

### "Frontend shows blank page or connection refused"
```powershell
# 1. Check if backend services are actually running
netstat -ano | findstr /R "5000|5001"

# 2. Check browser console for CORS errors
# Open DevTools (F12) → Console tab → Look for errors

# 3. If CORS error, backend may not be running
# Restart backends using terminals above
```

### "Login works but dashboard is blank"
```
This means:
1. ✓ Auth works
2. ✗ API call to get dashboard data failed
3. ✗ Fix: Check /api/admin/dashboard endpoint exists

See PART 9 for endpoint validation
```

---

## PART 9: API ENDPOINT VALIDATION

### Check Which Endpoints Exist
```powershell
# List all .NET controllers
Get-ChildItem server\VietTourAudio.Api\Controllers -Name

# List all Node.js routes
Get-ChildItem viettour-admin-api\src\routes -Name

# Compare against API_CONTRACT.md to find missing endpoints
```

### If Dashboard is Blank:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Login to admin dashboard
4. Check XHR requests - look for failed requests
5. See which endpoint returned 404 or 500
6. See API_CONTRACT.md for expected endpoint path
7. If missing, it needs to be implemented

---

## PART 10: NEXT STEPS

### If Everything Works ✅
1. Proceed to [VTA_COMPLETION_CHECKLIST.md](VTA_COMPLETION_CHECKLIST.md)
2. Run through all 164 items to identify remaining work
3. Prioritize based on "Critical Issues" section

### If Issues Found ❌
1. Document error message
2. Check TROUBLESHOOTING section
3. See API_CONTRACT.md for endpoint details
4. See PROJECT_AUDIT.md for architecture overview
5. Report issue with: error message + timestamp + which service

---

## PART 11: RUNNING TESTS

### Run Frontend Tests
```powershell
cd client
npm test
```

### Run Backend Tests (.NET)
```powershell
cd server/VietTourAudio.Api
dotnet test
```

### Run Admin API Tests
```powershell
cd viettour-admin-api
npm test
```

---

## PART 12: PRODUCTION BUILD

### Build Frontend
```powershell
cd client
npm run build

# Output in: client/dist/
# Size should be < 1MB gzipped
```

### Build .NET
```powershell
cd server\VietTourAudio.Api
dotnet publish -c Release -o ../publish

# Output in: server/publish/
```

### Build Admin API
```powershell
cd viettour-admin-api
npm run build

# Output in: viettour-admin-api/dist/
```

---

## Support Documentation

- [API_CONTRACT.md](API_CONTRACT.md) - All API endpoints
- [PROJECT_AUDIT.md](PROJECT_AUDIT.md) - Architecture overview
- [VTA_COMPLETION_CHECKLIST.md](VTA_COMPLETION_CHECKLIST.md) - 164-item completion checklist
- [SYSTEM_STATUS_CHECK.md](SYSTEM_STATUS_CHECK.md) - System status verification
- [README.md](README.md) - Quick start guide

---

**Last Updated:** 2026-06-23  
**Maintained By:** VietTourAudio Team
