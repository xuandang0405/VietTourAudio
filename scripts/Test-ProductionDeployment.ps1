[CmdletBinding()]
param(
  [string]$ConfigPath = (Join-Path (Split-Path -Parent $PSScriptRoot) 'deployment\production.config.json')
)

$ErrorActionPreference = 'Stop'
$config = Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json
$domain = ([string]$config.rootDomain).Trim().ToLowerInvariant()
$apiHost = "$($config.subdomains.api).$domain"
$adminHost = "$($config.subdomains.admin).$domain"
$vendorHost = "$($config.subdomains.vendor).$domain"
$hosts = @($domain, $apiHost, $adminHost, $vendorHost)

& (Join-Path $PSScriptRoot 'Test-ProductionDns.ps1') -ConfigPath $ConfigPath | Out-Host

foreach ($hostName in $hosts) {
  $request = [Net.HttpWebRequest]::Create("http://$hostName/")
  $request.AllowAutoRedirect = $false
  try {
    $response = $request.GetResponse()
  } catch [Net.WebException] {
    $response = $_.Exception.Response
  }

  if (-not $response -or [int]$response.StatusCode -notin @(301, 302, 307, 308) -or
      -not $response.Headers['Location'].StartsWith("https://$hostName")) {
    throw "HTTP redirect check failed for $hostName."
  }
  $response.Close()

  $httpsResponse = Invoke-WebRequest -Uri "https://$hostName/" -UseBasicParsing -TimeoutSec 30
  if ($httpsResponse.StatusCode -ne 200) {
    throw "HTTPS check failed for $hostName with status $($httpsResponse.StatusCode)."
  }
  Write-Host "PASS HTTPS: https://$hostName/"
}

$health = Invoke-RestMethod -Uri "https://$apiHost/health" -TimeoutSec 30
if (-not $health) {
  throw 'API health endpoint returned no payload.'
}
Write-Host 'PASS API health.'

$origin = "https://$adminHost"
$corsResponse = Invoke-WebRequest `
  -Uri "https://$apiHost/health" `
  -Method Options `
  -Headers @{
    Origin = $origin
    'Access-Control-Request-Method' = 'GET'
  } `
  -UseBasicParsing `
  -TimeoutSec 30
if ($corsResponse.Headers['Access-Control-Allow-Origin'] -ne $origin) {
  throw 'Production CORS preflight did not return the exact admin origin.'
}
Write-Host 'PASS exact production CORS.'

$signalR = Invoke-RestMethod `
  -Uri "https://$apiHost/hub/notifications/negotiate?negotiateVersion=1" `
  -Method Post `
  -Headers @{ Origin = "https://$domain" } `
  -ContentType 'text/plain;charset=UTF-8' `
  -Body '' `
  -TimeoutSec 30
if (-not $signalR.connectionToken -and -not $signalR.connectionId) {
  throw 'SignalR negotiate endpoint did not return a connection token/id.'
}
Write-Host 'PASS SignalR HTTPS negotiation.'

Write-Host 'Automated production checks passed. Camera/GPS permissions still require a real browser/device acceptance test.'
