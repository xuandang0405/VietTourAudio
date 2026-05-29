@echo off
setlocal

cd /d "%~dp0.."
docker compose up -d mysql phpmyadmin

echo Database is running at localhost:3306
echo Database name: viettuoraudio
echo phpMyAdmin is running at http://localhost:8080
echo Start client: use ..\run-windows.bat on Windows if the path contains #, otherwise cd client ^&^& npm install ^&^& npm run dev
echo Start server: cd server\VietTourAudio.Api ^&^& dotnet restore ^&^& dotnet run

endlocal
