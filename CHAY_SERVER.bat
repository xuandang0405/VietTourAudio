@echo off
setlocal
title VietTourAudio - Backend Server

set "ROOT=%~dp0"
set "SERVER=%ROOT%server\VietTourAudio.Api"

echo ==================================================
echo  VietTourAudio - Chay Backend Server
echo ==================================================
echo.

if not exist "%SERVER%\VietTourAudio.Api.csproj" (
  echo LOI: Khong tim thay du an backend.
  goto ERROR
)

where dotnet >nul 2>nul
if errorlevel 1 (
  echo LOI: Chua cai .NET SDK.
  echo Tai tai: https://dotnet.microsoft.com/download
  goto ERROR
)

set "DOTNET_ROLL_FORWARD=Major"
set "ASPNETCORE_ENVIRONMENT=Development"
set "DOTNET_ENVIRONMENT=Development"

pushd "%SERVER%"

if not exist "obj\project.assets.json" (
  echo Dang tai thu vien backend lan dau...
  call dotnet restore
  if errorlevel 1 (
    popd
    echo LOI: Khong tai duoc thu vien backend.
    goto ERROR
  )
)

echo Backend API: http://localhost:5000
echo Swagger:     http://localhost:5000/swagger
echo Khong dong cua so nay trong khi dang dung server.
echo Nhan Ctrl+C de dung server.
echo.

echo Dang kiem tra ban build backend...
call dotnet build --no-restore
if errorlevel 1 (
  popd
  echo LOI: Backend build that bai.
  goto ERROR
)

start "" cmd /c "timeout /t 5 /nobreak >nul && start http://localhost:5000/swagger"
call dotnet run --no-build --no-launch-profile --urls http://0.0.0.0:5000
set "EXIT_CODE=%ERRORLEVEL%"
popd

if not "%EXIT_CODE%"=="0" goto ERROR
goto END

:ERROR
echo.
echo Server chua khoi dong duoc. Hay chup man hinh loi gui cho Codex.
pause

:END
endlocal
