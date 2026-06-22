#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

docker compose up -d mysql phpmyadmin

echo "Database is running at localhost:3306"
echo "phpMyAdmin is running at http://localhost:${PHPMYADMIN_PORT:-8080}"
echo "Start client: cd client && npm install && npm run dev"
echo "Database name: viettuoraudio"
echo "Start server: cd server/VietTourAudio.Api && dotnet restore && dotnet run"
