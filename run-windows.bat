@echo off
setlocal

set "ROOT_DIR=%~dp0"
set "CLIENT_DIR=%ROOT_DIR%client"
set "SERVER_DIR=%ROOT_DIR%server\VietTourAudio.Api"

title VietTourAudio - Run Web

echo ==================================================
echo  VietTourAudio - Windows Runner
echo ==================================================
echo.

if "%~1"=="--check" goto CHECK_ONLY

call :CHECK_REQUIREMENTS
if errorlevel 1 goto END

if not exist "%CLIENT_DIR%\node_modules" (
  echo [1/4] Chua co node_modules, dang cai dependencies cho client...
  pushd "%CLIENT_DIR%"
  call npm install
  if errorlevel 1 (
    popd
    echo.
    echo Loi: npm install that bai. Vui long kiem tra NodeJS/npm.
    goto END
  )
  popd
) else (
  echo [1/4] Client dependencies da san sang.
)

echo [2/4] Restore server .NET...
pushd "%SERVER_DIR%"
call dotnet restore
if errorlevel 1 (
  popd
  echo.
  echo Loi: dotnet restore that bai. Vui long kiem tra .NET SDK.
  goto END
)
popd

where docker >nul 2>nul
if not errorlevel 1 (
  echo [3/4] Phat hien Docker, dang mo MySQL/phpMyAdmin bang docker compose...
  start "VietTourAudio - Database" cmd /k "cd /d ""%ROOT_DIR%"" && docker compose up mysql phpmyadmin"
) else (
  echo [3/4] Khong thay Docker, bo qua database container.
  echo       Neu can database, hay cai Docker Desktop hoac chay MySQL local.
)

echo [4/4] Dang mo server va client...
start "VietTourAudio - Server API" cmd /k "set DOTNET_ROLL_FORWARD=Major&& cd /d ""%SERVER_DIR%"" && dotnet run"
start "VietTourAudio - Client PWA" cmd /k "cd /d ""%CLIENT_DIR%"" && npm run dev -- --host 0.0.0.0"

echo.
echo Da mo cac cua so chay app.
echo Client: http://localhost:5173
echo API Swagger: xem URL hien thi trong cua so Server API, thuong la /swagger
echo.
echo Co the dong cua so nay. De dung app, hay dong cac cua so Server API, Client PWA va Database.
goto END

:CHECK_ONLY
call :CHECK_REQUIREMENTS
if errorlevel 1 goto END
echo Kiem tra runner thanh cong.
goto END

:CHECK_REQUIREMENTS
where node >nul 2>nul
if errorlevel 1 (
  echo Loi: Chua cai NodeJS. Tai NodeJS LTS tai https://nodejs.org/
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo Loi: Khong tim thay npm. Vui long cai lai NodeJS LTS.
  exit /b 1
)

where dotnet >nul 2>nul
if errorlevel 1 (
  echo Loi: Chua cai .NET SDK. Tai .NET SDK 8 tai https://dotnet.microsoft.com/download
  exit /b 1
)

if not exist "%CLIENT_DIR%\package.json" (
  echo Loi: Khong tim thay "%CLIENT_DIR%\package.json".
  exit /b 1
)

if not exist "%SERVER_DIR%\VietTourAudio.Api.csproj" (
  echo Loi: Khong tim thay "%SERVER_DIR%\VietTourAudio.Api.csproj".
  exit /b 1
)

exit /b 0

:END
echo.
pause
endlocal
