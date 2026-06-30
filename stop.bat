@echo off
title VietTourAudio - Stop All Services
chcp 65001 >nul

set "ROOT=%~dp0"

echo =======================================================================
echo   VietTourAudio - Stopping All Services
echo =======================================================================
echo.

echo 1. Stopping .NET API...
taskkill /FI "WINDOWTITLE eq VietTourAudio - .NET API" /T /F >nul 2>&1
taskkill /IM dotnet.exe /F >nul 2>&1
echo   [OK] .NET API stopped.

echo.
echo 2. Stopping Frontend Client...
taskkill /FI "WINDOWTITLE eq VietTourAudio - Frontend" /T /F >nul 2>&1
echo   [OK] Client stopped.

echo.
echo 3. Stopping Web Admin...
taskkill /FI "WINDOWTITLE eq VietTourAudio - Web Admin" /T /F >nul 2>&1
echo   [OK] Web Admin stopped.

echo.
echo =======================================================================
echo   All services have been stopped successfully.
echo =======================================================================
echo.
pause
