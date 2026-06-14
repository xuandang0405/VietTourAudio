@echo off
setlocal
title VietTourAudio - Admin API

set "ROOT=%~dp0"
set "ADMIN=%ROOT%viettour-admin-api"
set "NODE_EXE="
set "NPM_CMD="
set "CODEX_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"

echo ==================================================
echo  VietTourAudio - Chay Admin API
echo ==================================================
echo.

if exist "%CODEX_NODE%\node.exe" set "NODE_EXE=%CODEX_NODE%\node.exe"
if exist "%CODEX_NODE%\npm.cmd" set "NPM_CMD=%CODEX_NODE%\npm.cmd"

if not defined NODE_EXE if exist "%ProgramFiles%\nodejs\node.exe" set "NODE_EXE=%ProgramFiles%\nodejs\node.exe"
if not defined NPM_CMD if exist "%ProgramFiles%\nodejs\npm.cmd" set "NPM_CMD=%ProgramFiles%\nodejs\npm.cmd"

if not defined NODE_EXE (
  for /f "delims=" %%N in ('where node 2^>nul') do if not defined NODE_EXE set "NODE_EXE=%%N"
)
if not defined NPM_CMD (
  for /f "delims=" %%N in ('where npm.cmd 2^>nul') do if not defined NPM_CMD set "NPM_CMD=%%N"
)

if not defined NODE_EXE (
  echo LOI: Chua co NodeJS.
  goto ERROR
)

pushd "%ADMIN%"

if not exist "node_modules\typescript\bin\tsc" (
  if not defined NPM_CMD (
    popd
    echo LOI: Thieu thu vien Admin API va khong tim thay npm.
    goto ERROR
  )
  call "%NPM_CMD%" install
  if errorlevel 1 (
    popd
    goto ERROR
  )
)

echo Dang build Admin API...
call "%NODE_EXE%" "node_modules\typescript\bin\tsc"
if errorlevel 1 (
  popd
  goto ERROR
)

echo Admin API: http://localhost:5001
echo Health:    http://localhost:5001/health
echo Tai khoan demo: superadmin@viettouraudio.vn / Admin123
echo.
call "%NODE_EXE%" "dist\server.js"
set "EXIT_CODE=%ERRORLEVEL%"
popd

if not "%EXIT_CODE%"=="0" goto ERROR
goto END

:ERROR
echo.
echo Admin API chua khoi dong duoc. Hay kiem tra MySQL va file cau hinh .env.
pause

:END
endlocal
