# ============================================================
#  VietTourAudio - Start All Services
#  Chạy: .\start.ps1
#  Dừng: Ctrl+C trong từng cửa sổ, rồi chạy .\stop.ps1
# ============================================================

$Root = $PSScriptRoot

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   VietTourAudio - Khoi dong tat ca dich vu" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ── 1. Docker (MySQL + phpMyAdmin) ──────────────────────────
Write-Host "[1/4] Khoi dong Docker (MySQL + phpMyAdmin)..." -ForegroundColor Yellow
Set-Location $Root
docker compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [WARN] Docker compose that bai. Dam bao Docker Desktop dang chay." -ForegroundColor Red
} else {
    Write-Host "  [OK]  MySQL   : localhost:3306" -ForegroundColor Green
    Write-Host "  [OK]  phpMyAdmin: http://localhost:8080" -ForegroundColor Green
}

# Doi MySQL san sang (toi da 30 giay)
Write-Host "  Cho MySQL san sang..." -ForegroundColor DarkGray
$tries = 0
do {
    Start-Sleep -Seconds 2
    $tries++
    $result = docker exec viettouraudio-mysql mysqladmin ping -u root -prootpassword --silent 2>$null
} while ($result -ne "mysqld is alive" -and $tries -lt 15)

if ($tries -lt 15) {
    Write-Host "  [OK]  MySQL da san sang." -ForegroundColor Green
} else {
    Write-Host "  [WARN] MySQL chua san sang sau 30 giay, tiep tuc..." -ForegroundColor DarkYellow
}

# ── 2. .NET API (port 5000) ──────────────────────────────────
Write-Host ""
Write-Host "[2/4] Khoi dong .NET API (port 5000)..." -ForegroundColor Yellow
$dotnetPath = Join-Path $Root "server\VietTourAudio.Api"
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "Set-Location '$dotnetPath'; Write-Host '.NET API' -ForegroundColor Cyan; dotnet run" `
    -WindowStyle Normal

Write-Host "  [OK]  .NET API : http://localhost:5000" -ForegroundColor Green
Write-Host "  [OK]  Swagger  : http://localhost:5000/swagger" -ForegroundColor Green

# ── 3. Admin API Node.js (TypeScript) ───────────────────────
Write-Host ""
Write-Host "[3/4] Khoi dong Admin API (Node.js/TypeScript)..." -ForegroundColor Yellow
$adminApiPath = Join-Path $Root "server\viettour-admin-api"

# Kiem tra node_modules
if (-not (Test-Path (Join-Path $adminApiPath "node_modules"))) {
    Write-Host "  Cai dat dependencies (npm install)..." -ForegroundColor DarkGray
    Push-Location $adminApiPath
    npm install
    Pop-Location
}

Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "Set-Location '$adminApiPath'; Write-Host 'Admin API (Node.js)' -ForegroundColor Cyan; npm run dev" `
    -WindowStyle Normal

Write-Host "  [OK]  Admin API : kiem tra port trong viettour-admin-api" -ForegroundColor Green

# ── 4. Frontend React/Vite (port 5173) ──────────────────────
Write-Host ""
Write-Host "[4/4] Khoi dong Frontend (React + Vite, port 5173)..." -ForegroundColor Yellow
$clientPath = Join-Path $Root "client"

# Kiem tra node_modules
if (-not (Test-Path (Join-Path $clientPath "node_modules"))) {
    Write-Host "  Cai dat dependencies (npm install)..." -ForegroundColor DarkGray
    Push-Location $clientPath
    npm install
    Pop-Location
}

Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "Set-Location '$clientPath'; Write-Host 'Frontend React/Vite' -ForegroundColor Cyan; npm run dev" `
    -WindowStyle Normal

Write-Host "  [OK]  Frontend  : http://localhost:5173" -ForegroundColor Green

# ── Tong ket ─────────────────────────────────────────────────
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Tat ca dich vu da khoi dong!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Frontend       : http://localhost:5173" -ForegroundColor White
Write-Host "  .NET API       : http://localhost:5000" -ForegroundColor White
Write-Host "  Swagger        : http://localhost:5000/swagger" -ForegroundColor White
Write-Host "  Admin API      : xem console Admin API" -ForegroundColor White
Write-Host "  phpMyAdmin     : http://localhost:8080" -ForegroundColor White
Write-Host "  MySQL          : localhost:3306" -ForegroundColor White
Write-Host ""
Write-Host "  De dung tat ca: chay .\stop.ps1" -ForegroundColor DarkYellow
Write-Host ""
