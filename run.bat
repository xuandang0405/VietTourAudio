@echo off
chcp 65001 >nul
setlocal

set "ROOT=%~dp0"
set "CLIENT_PORT=5173"
set "API_PORT=5000"
set "ADMIN_API_PORT=5001"
set "API_BASE_URL=http://localhost:%API_PORT%/api"
set "ADMIN_API_BASE_URL=http://localhost:%ADMIN_API_PORT%/api"
set "VENDOR_API_BASE_URL=http://localhost:%ADMIN_API_PORT%/api/vendor"
set "VENDOR_AUTH_API_BASE_URL=http://localhost:%ADMIN_API_PORT%/api/vendor/auth"
set "DOTNET_CONNECTION=server=localhost;port=3306;database=viettuoraudio;user=root;password=;SslMode=None;AllowPublicKeyRetrieval=True;"

echo.
echo ============================================================
echo   VietTourAudio - Run for Windows
echo ============================================================
echo.

echo [1/4] Checking database on localhost:3306...
netstat -ano | findstr /R /C:":3306 .*LISTENING" >nul 2>&1
if %ERRORLEVEL% equ 0 (
  echo   [OK]  Local MySQL is listening on localhost:3306
) else (
  echo   MySQL not detected on port 3306. Attempting to start...
  if exist "C:\xampp\mysql\bin\mysqld.exe" (
    echo   Starting XAMPP MySQL...
    start /B "C:\xampp\mysql\bin\mysqld.exe" --defaults-file=C:\xampp\mysql\bin\my.ini
    timeout /t 5 /nobreak >nul
    netstat -ano | findstr /R /C:":3306 .*LISTENING" >nul 2>&1
    if %ERRORLEVEL% equ 0 (
      echo   [OK]  XAMPP MySQL started successfully
    ) else (
      echo   [WARN] XAMPP MySQL may still be starting. Continuing...
    )
  ) else (
    where docker >nul 2>&1
    if %ERRORLEVEL% equ 0 (
      echo   No local MySQL detected. Starting docker compose fallback...
      cd /d "%ROOT%"
      docker compose up -d
      if %ERRORLEVEL% neq 0 (
        echo   [WARN] Docker fallback failed. Start MySQL manually, then rerun run.bat.
      ) else (
        echo   [OK]  Docker MySQL/phpMyAdmin requested.
      )
    ) else (
      echo   [WARN] No MySQL on localhost:3306 and docker is not available in PATH.
      echo   [WARN] Start XAMPP MySQL or another local MySQL service before using the app.
    )
  )
)

echo.
echo [2/4] Starting .NET visitor API on port %API_PORT%...
start "VietTourAudio - .NET API" cmd /k "pushd "%ROOT%server\VietTourAudio.Api" && set ASPNETCORE_ENVIRONMENT=Development && set ASPNETCORE_URLS=http://localhost:%API_PORT% && set ConnectionStrings__DefaultConnection=%DOTNET_CONNECTION% && set Storage__PublicBaseUrl=http://localhost:%API_PORT%/uploads && dotnet run --no-launch-profile"
echo   [OK]  Visitor API : http://localhost:%API_PORT%
echo   [OK]  Swagger     : http://localhost:%API_PORT%/swagger

echo.
echo [3/4] Starting Admin API on port %ADMIN_API_PORT%...
if not exist "%ROOT%server\viettour-admin-api\.env" (
  if exist "%ROOT%server\viettour-admin-api\.env.example" (
    echo   Creating server\viettour-admin-api\.env from .env.example...
    copy /y "%ROOT%server\viettour-admin-api\.env.example" "%ROOT%server\viettour-admin-api\.env" >nul
  )
)
if not exist "%ROOT%server\viettour-admin-api\node_modules" (
  echo   Installing viettour-admin-api dependencies...
  cd /d "%ROOT%server\viettour-admin-api"
  call npm install
)
start "VietTourAudio - Admin API" cmd /k "pushd "%ROOT%server\viettour-admin-api" && npm run dev"
echo   [OK]  Admin API   : http://localhost:%ADMIN_API_PORT%

echo.
echo [4/4] Starting React client on port %CLIENT_PORT%...
if not exist "%ROOT%client\node_modules" (
  echo   Installing client dependencies...
  cd /d "%ROOT%client"
  call npm install
)
start "VietTourAudio - Frontend" cmd /k "pushd "%ROOT%client" && set "VITE_DEV_PORT=%CLIENT_PORT%" && set "VITE_API_BASE_URL=%API_BASE_URL%" && set "VITE_ADMIN_API_BASE_URL=%ADMIN_API_BASE_URL%" && set "VITE_VENDOR_API_BASE_URL=%VENDOR_API_BASE_URL%" && set "VITE_VENDOR_AUTH_API_BASE_URL=%VENDOR_AUTH_API_BASE_URL%" && npm run dev"
echo   [OK]  Frontend    : http://localhost:%CLIENT_PORT%

echo.
echo ============================================================
echo   All core services were started.
echo ============================================================
echo.
echo   Frontend      : http://localhost:%CLIENT_PORT%
echo   Visitor API   : http://localhost:%API_PORT%
echo   Swagger       : http://localhost:%API_PORT%/swagger
echo   Admin API     : http://localhost:%ADMIN_API_PORT%
echo   Vendor login  : http://localhost:%CLIENT_PORT%/vendor/login
echo   Admin login   : http://localhost:%CLIENT_PORT%/admin/login
echo.
echo   Demo admin    : admin@viettouraudio.vn / Admin123
echo   Demo vendor   : an@heritagefoods.vn / Vendor123
echo.
echo   To stop the stack: run stop.bat
echo.
pause
