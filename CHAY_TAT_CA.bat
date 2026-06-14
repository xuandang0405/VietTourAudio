@echo off
setlocal
title VietTourAudio - Chay tat ca

set "ROOT=%~dp0"

echo ==================================================
echo  VietTourAudio - Chay toan bo du an
echo ==================================================
echo.
echo Can co MySQL dang chay voi database viettuoraudio.
echo Frontend:  http://localhost:5173
echo API khach: http://localhost:5000
echo Admin API: http://localhost:5001
echo.

start "VietTourAudio - Backend" cmd /k "call ""%ROOT%CHAY_SERVER.bat"""
start "VietTourAudio - Admin API" cmd /k "call ""%ROOT%CHAY_ADMIN.bat"""
start "VietTourAudio - Frontend" cmd /k "call ""%ROOT%CHAY_FRONTEND.bat"""

echo Da mo ba cua so chay du an.
timeout /t 4 /nobreak >nul
endlocal
