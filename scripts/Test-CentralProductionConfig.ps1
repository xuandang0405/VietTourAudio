[CmdletBinding()]
param(
  [string]$ConfigPath = (Join-Path (Split-Path -Parent $PSScriptRoot) 'deployment\production.config.json')
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$tempRoot = Join-Path ([IO.Path]::GetTempPath()) ('VietTourAudio-ConfigTest-' + [Guid]::NewGuid().ToString('N'))

try {
  [IO.Directory]::CreateDirectory($tempRoot) | Out-Null
  $testConfigPath = Join-Path $tempRoot 'production.config.json'
  $config = Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json
  $originalDomain = [string]$config.rootDomain
  $config.rootDomain = 'central-config-test.invalid'
  $config | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $testConfigPath -Encoding UTF8

  & (Join-Path $PSScriptRoot 'Sync-ProductionConfig.ps1') `
    -ConfigPath $testConfigPath `
    -OutputRoot $tempRoot | Out-Null

  $mobileEnv = Get-Content -LiteralPath (Join-Path $tempRoot 'client\.env.production.mobile') -Raw
  $backend = Get-Content -LiteralPath (Join-Path $tempRoot 'server\VietTourAudio.Api\appsettings.Production.json') -Raw |
    ConvertFrom-Json

  if ($mobileEnv -notmatch 'VITE_API_BASE_URL=https://api\.central-config-test\.invalid/api') {
    throw 'Mobile production env did not follow the temporary central domain.'
  }
  if ($backend.Cors.AllowedOrigins -notcontains 'https://admin.central-config-test.invalid') {
    throw 'Backend CORS did not follow the temporary central domain.'
  }
  if ($backend.Cors.AllowedOrigins -contains "https://$originalDomain") {
    throw 'Generated backend CORS retained the original domain.'
  }

  Write-Host 'PASS: changing one central value updated frontend env and backend CORS outputs without manual edits.'
} finally {
  if (Test-Path -LiteralPath $tempRoot) {
    Remove-Item -LiteralPath $tempRoot -Recurse -Force
  }
}
