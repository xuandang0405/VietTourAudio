# ============================================================
#  VietTourAudio - Stop All Services
#  Chạy: .\stop.ps1
# ============================================================

$Root = $PSScriptRoot

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   VietTourAudio - Dung tat ca dich vu" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Dung Docker containers
Write-Host "Dung Docker (MySQL + phpMyAdmin)..." -ForegroundColor Yellow
Set-Location $Root
docker compose down
Write-Host "  [OK] Docker containers da dung." -ForegroundColor Green

# Tat cac process dotnet
Write-Host "Dung .NET API..." -ForegroundColor Yellow
Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "  [OK] .NET API da dung." -ForegroundColor Green

# Tat cac process node (nodemon / vite)
Write-Host "Dung Node.js (Admin API + Frontend)..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "  [OK] Node.js da dung." -ForegroundColor Green

Write-Host ""
Write-Host "Tat ca dich vu da dung." -ForegroundColor Green
Write-Host ""
