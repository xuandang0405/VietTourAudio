[CmdletBinding()]
param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = 'Stop'
$rootPath = [IO.Path]::GetFullPath($Root)
$targets = @(
  (Join-Path $rootPath 'deployment\publish'),
  (Join-Path $rootPath 'server\VietTourAudio.Api\appsettings.Production.json')
)
$targets += Get-ChildItem -LiteralPath (Join-Path $rootPath 'client') -Force -File |
  Where-Object Name -like '.env.production.*' |
  Select-Object -ExpandProperty FullName

# Bundled dependencies may use the inert base "http://localhost" only for URL
# parsing. A development endpoint is forbidden when loopback has a port, when
# the production IP is used as a URL host, or when a tunnel/custom port remains.
$forbidden = '(?i)(?:https?|wss?)://(?:localhost|127\.0\.0\.1|0\.0\.0\.0):\d+|(?:https?|wss?)://183\.81\.57\.253(?::\d+)?|(?:https?|wss?)://(?:api\.)?bkpvp\.top:\d+|ngrok-free\.(?:app|dev)|ngrok-skip-browser-warning'
$extensions = @('.js', '.css', '.html', '.json', '.config', '.xml', '.env', '.txt')
$violations = @()

foreach ($target in $targets) {
  $files = if (Test-Path -LiteralPath $target -PathType Container) {
    Get-ChildItem -LiteralPath $target -Recurse -Force -File |
      Where-Object { $extensions -contains $_.Extension -or $_.Name -like '.env*' -or $_.Name -eq 'web.config' }
  } elseif (Test-Path -LiteralPath $target -PathType Leaf) {
    Get-Item -LiteralPath $target
  } else {
    throw "Required production target is missing: $target"
  }

  foreach ($file in $files) {
    $lineNumber = 0
    foreach ($line in [IO.File]::ReadLines($file.FullName)) {
      $lineNumber++
      if ($line -match $forbidden) {
        $violations += "$($file.FullName):$lineNumber"
      }
    }
  }
}

if ($violations.Count -gt 0) {
  throw "Forbidden development/tunnel endpoint found in production output: $($violations -join ', ')"
}

$settingsPath = Join-Path $rootPath 'server\VietTourAudio.Api\appsettings.Production.json'
$settings = Get-Content -LiteralPath $settingsPath -Raw | ConvertFrom-Json
if (@($settings.Cors.AllowedOrigins).Count -ne 3 -or
    @($settings.Cors.AllowedOrigins | Where-Object { $_ -notmatch '^https://[^/:]+$' }).Count -gt 0) {
  throw 'Production CORS must contain exactly three HTTPS origins without ports.'
}

$apiWebConfigPath = Join-Path $rootPath 'deployment\publish\api\web.config'
[xml]$apiWebConfig = Get-Content -LiteralPath $apiWebConfigPath -Raw
$aspNetCore = $apiWebConfig.configuration.location.'system.webServer'.aspNetCore
if (-not $aspNetCore) {
  $aspNetCore = $apiWebConfig.configuration.'system.webServer'.aspNetCore
}
if (-not $aspNetCore -or $aspNetCore.hostingModel -ne 'inprocess') {
  throw 'Published API web.config is not configured for in-process IIS hosting.'
}
$environment = @($aspNetCore.environmentVariables.environmentVariable) |
  Where-Object name -eq 'ASPNETCORE_ENVIRONMENT' |
  Select-Object -First 1
if (-not $environment -or $environment.value -ne 'Production') {
  throw 'Published API web.config does not set ASPNETCORE_ENVIRONMENT=Production.'
}

Write-Host 'PASS: production outputs contain no old local/IP/port/tunnel endpoints; CORS and IIS hosting mode are correct.'
