@echo off
setlocal
title VietTourAudio - Frontend

set "ROOT=%~dp0"
set "CLIENT=%ROOT%client"
set "PORTABLE_NODE="

echo ==================================================
echo  VietTourAudio - Chay Frontend
echo ==================================================
echo.

if not exist "%CLIENT%\package.json" (
  echo LOI: Khong tim thay thu muc client.
  goto ERROR
)

where node >nul 2>nul
if errorlevel 1 (
  for /f "delims=" %%N in ('where /r "%USERPROFILE%\Documents\Codex" node.exe 2^>nul') do if not defined PORTABLE_NODE set "PORTABLE_NODE=%%~dpN"
  if defined PORTABLE_NODE if exist "%PORTABLE_NODE%node.exe" (
    set "PATH=%PORTABLE_NODE%;%PATH%"
  ) else (
    echo LOI: Chua co NodeJS.
    echo Tai NodeJS LTS tai: https://nodejs.org/
    goto ERROR
  )
)

pushd "%CLIENT%"

if not exist "node_modules\vite\bin\vite.js" (
  echo Dang cai thu vien frontend lan dau...
  call npm install
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
call node "%ROOT%scripts\start-frontend.mjs"
set "EXIT_CODE=%ERRORLEVEL%"

if not "%EXIT_CODE%"=="0" goto ERROR
goto END

:ERROR
echo.
echo Frontend chua khoi dong duoc. Hay chup man hinh loi gui cho Codex.
pause

:END
endlocal
