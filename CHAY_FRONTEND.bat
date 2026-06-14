@echo off
setlocal
title VietTourAudio - Frontend

set "ROOT=%~dp0"
set "CLIENT=%ROOT%client"
set "NODE_EXE="
set "NPM_CMD="
set "CODEX_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"

echo ==================================================
echo  VietTourAudio - Chay Frontend
echo ==================================================
echo.

if not exist "%CLIENT%\package.json" (
  echo LOI: Khong tim thay thu muc client.
  goto ERROR
)

if exist "%CODEX_NODE%\node.exe" (
  set "NODE_EXE=%CODEX_NODE%\node.exe"
  if exist "%CODEX_NODE%\npm.cmd" set "NPM_CMD=%CODEX_NODE%\npm.cmd"
)

if not defined NODE_EXE if exist "%ProgramFiles%\nodejs\node.exe" (
  set "NODE_EXE=%ProgramFiles%\nodejs\node.exe"
  if exist "%ProgramFiles%\nodejs\npm.cmd" set "NPM_CMD=%ProgramFiles%\nodejs\npm.cmd"
)

if not defined NODE_EXE (
  for /f "delims=" %%N in ('where node 2^>nul') do if not defined NODE_EXE set "NODE_EXE=%%N"
  for /f "delims=" %%N in ('where npm.cmd 2^>nul') do if not defined NPM_CMD set "NPM_CMD=%%N"
)

if not defined NODE_EXE (
  echo LOI: Chua co NodeJS.
  echo Tai NodeJS LTS tai: https://nodejs.org/
  goto ERROR
)

for %%N in ("%NODE_EXE%") do set "NODE_DIR=%%~dpN"
set "PATH=%NODE_DIR%;%PATH%"

pushd "%CLIENT%"

if not exist "node_modules\vite\bin\vite.js" (
  if not defined NPM_CMD (
    popd
    echo LOI: Thieu thu vien frontend va khong tim thay npm de cai dat.
    echo Hay cai NodeJS LTS tai: https://nodejs.org/
    goto ERROR
  )
  echo Dang cai thu vien frontend lan dau...
  call "%NPM_CMD%" install
  if errorlevel 1 (
    popd
    echo LOI: Khong cai duoc thu vien frontend.
    goto ERROR
  )
)

echo Dang build va mo http://localhost:5173
echo Khong dong cua so nay trong khi dang dung web.
echo Nhan Ctrl+C de dung frontend.
echo.

popd
call "%NODE_EXE%" "%ROOT%scripts\start-frontend.mjs"
set "EXIT_CODE=%ERRORLEVEL%"

if not "%EXIT_CODE%"=="0" goto ERROR
goto END

:ERROR
echo.
echo Frontend chua khoi dong duoc. Hay chup man hinh loi gui cho Codex.
pause

:END
endlocal
