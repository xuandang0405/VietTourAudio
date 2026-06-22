@echo off
chcp 65001 >nul

echo.
echo ============================================================
echo    VietTourAudio - Dung tat ca dich vu
echo ============================================================
echo.

echo Dung cac tien trinh cua workspace hien tai...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$root = [System.IO.Path]::GetFullPath('%~dp0'); $targets = @([System.IO.Path]::Combine($root, 'server\VietTourAudio.Api'), [System.IO.Path]::Combine($root, 'viettour-admin-api'), [System.IO.Path]::Combine($root, 'client')); Get-CimInstance Win32_Process | Where-Object { $commandLine = $_.CommandLine; $_.ProcessId -ne $PID -and $commandLine -and (($targets | Where-Object { $commandLine -like ('*' + $_ + '*') }).Count -gt 0) } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"
echo   [OK] Da gui lenh dung cho .NET API, Admin API va Frontend.

where docker >nul 2>&1
if %ERRORLEVEL% equ 0 (
	echo Dung Docker fallback neu dang chay...
	cd /d "%~dp0"
	docker compose down >nul 2>&1
)

echo.
echo Tat ca dich vu da dung.
echo.
pause
