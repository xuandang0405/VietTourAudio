[CmdletBinding()]
param(
  [string]$ConfigPath = (Join-Path (Split-Path -Parent $PSScriptRoot) 'deployment\production.config.json'),
  [string[]]$DnsServers = @('1.1.1.1', '8.8.8.8')
)

$ErrorActionPreference = 'Stop'
$config = Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json
$domain = ([string]$config.rootDomain).Trim().ToLowerInvariant()
$expectedIp = ([string]$config.serverIp).Trim()
$hosts = @(
  $domain,
  "$($config.subdomains.api).$domain",
  "$($config.subdomains.admin).$domain",
  "$($config.subdomains.vendor).$domain"
)
$failures = @()

Write-Host 'Authoritative nameservers:'
Resolve-DnsName -Name $domain -Type NS -Server $DnsServers[0] -DnsOnly |
  Where-Object Type -eq 'NS' |
  Select-Object NameHost, TTL |
  Format-Table -AutoSize

foreach ($dnsServer in $DnsServers) {
  Write-Host "A records via resolver $dnsServer"
  foreach ($hostName in $hosts) {
    try {
      $ips = @(Resolve-DnsName -Name $hostName -Type A -Server $dnsServer -DnsOnly -ErrorAction Stop |
        Where-Object Type -eq 'A' |
        Select-Object -ExpandProperty IPAddress -Unique)
    } catch {
      $ips = @()
    }

    $isExact = $ips.Count -eq 1 -and $ips[0] -eq $expectedIp
    [pscustomobject]@{
      Host = $hostName
      Expected = $expectedIp
      Actual = if ($ips.Count) { $ips -join ', ' } else { 'NXDOMAIN/NO A' }
      Exact = $isExact
    } | Format-Table -AutoSize

    if (-not $isExact) {
      $failures += "$hostName via $dnsServer"
    }
  }
}

if ($failures.Count -gt 0) {
  throw "DNS is not ready for production HTTPS: $($failures -join '; ')."
}

Write-Host 'PASS: all four public names resolve exactly to the configured server IP.'
