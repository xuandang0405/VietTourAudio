@echo off
chcp 65001 >nul
setlocal

set "ROOT=%~dp0"

echo.
echo ============================================================
echo   VietTourAudio - Database Setup
echo ============================================================
echo.
echo This script sets up the viettuoraudio database for first time.
echo WARNING: This will RESET the database (drop and recreate all tables + data)
echo.

:: Find MySQL executable
set "MYSQL="
if exist "C:\xampp\mysql\bin\mysql.exe" set "MYSQL=C:\xampp\mysql\bin\mysql.exe"
if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" set "MYSQL=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
if exist "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" set "MYSQL=C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe"

if "%MYSQL%"=="" (
  where mysql >nul 2>&1
  if %ERRORLEVEL% equ 0 (
    set "MYSQL=mysql"
  ) else (
    echo [ERROR] Cannot find mysql.exe. Please ensure MySQL is installed.
    echo   Checked: C:\xampp\mysql\bin\mysql.exe
    echo   Checked: C:\Program Files\MySQL\...
    pause
    exit /b 1
  )
)

echo Found MySQL at: %MYSQL%
echo.

:: Check if MySQL is running
netstat -ano | findstr /R /C:":3306 .*LISTENING" >nul 2>&1
if %ERRORLEVEL% neq 0 (
  echo MySQL is not running. Attempting to start XAMPP MySQL...
  if exist "C:\xampp\mysql\bin\mysqld.exe" (
    start /B "C:\xampp\mysql\bin\mysqld.exe" --defaults-file=C:\xampp\mysql\bin\my.ini
    timeout /t 6 /nobreak >nul
  ) else (
    echo [ERROR] Please start MySQL manually and rerun this script.
    pause
    exit /b 1
  )
)

echo [1/3] Creating database schema (tables + relationships)...
type "%ROOT%database\schema.sql" | "%MYSQL%" -u root
if %ERRORLEVEL% neq 0 (
  echo [ERROR] Schema import failed! Check MySQL connection.
  pause
  exit /b 1
)
echo   [OK]  Schema imported - 26 tables created

echo.
echo [2/3] Importing seed data (demo accounts + POIs + analytics)...
type "%ROOT%database\seed.sql" | "%MYSQL%" -u root
if %ERRORLEVEL% neq 0 (
  echo [ERROR] Seed import failed!
  pause
  exit /b 1
)
echo   [OK]  Seed data imported

echo.
echo [3/3] Verifying database...
"%MYSQL%" -u root viettuoraudio -e "SELECT COUNT(*) AS tables FROM information_schema.tables WHERE table_schema='viettuoraudio';"
echo.
echo ============================================================
echo   Database setup COMPLETE!
echo.
echo   Demo Admin Credentials:
echo   Email   : admin@viettouraudio.vn
echo   Password: Admin123
echo   Portal  : http://localhost:5173/admin
echo.
echo   Demo Vendor Credentials:
echo   Email   : an@heritagefoods.vn
echo   Password: Vendor123
echo   Portal  : http://localhost:5173/vendor
echo ============================================================
echo.
echo Run .\run.bat to start all services.
echo.
pause
