@echo off
setlocal
title VietTourAudio - Cai database

set "ROOT=%~dp0"
set "MYSQL_EXE="

where mysql.exe >nul 2>nul
if not errorlevel 1 (
  for /f "delims=" %%M in ('where mysql.exe') do if not defined MYSQL_EXE set "MYSQL_EXE=%%M"
)

if not defined MYSQL_EXE if exist "C:\xampp\mysql\bin\mysql.exe" set "MYSQL_EXE=C:\xampp\mysql\bin\mysql.exe"

if not defined MYSQL_EXE (
  echo LOI: May chua co MySQL 8 hoac mysql.exe khong nam trong PATH.
  echo Hay cai MySQL Community Server 8, sau do chay lai file nay.
  pause
  exit /b 1
)

echo ==================================================
echo  VietTourAudio - Tao database local
echo ==================================================
echo.
echo CANH BAO: thao tac nay se reset database viettuoraudio.
echo Du lieu hien co trong database nay se bi xoa.
echo.
choice /C YN /M "Tiep tuc"
if errorlevel 2 exit /b 0

pushd "%ROOT%"
echo.
echo Nhap mat khau tai khoan root MySQL khi duoc hoi.
"%MYSQL_EXE%" -u root -p < "database\setup-local.sql"
set "EXIT_CODE=%ERRORLEVEL%"
popd

if not "%EXIT_CODE%"=="0" (
  echo.
  echo Cai database that bai. Kiem tra MySQL dang chay va mat khau root.
  pause
  exit /b %EXIT_CODE%
)

echo.
echo Database viettuoraudio da san sang.
echo Bay gio co the chay CHAY_TAT_CA.bat.
pause
endlocal
