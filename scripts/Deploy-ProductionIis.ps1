[CmdletBinding()]
param(
  [string]$ConfigPath = (Join-Path (Split-Path -Parent $PSScriptRoot) 'deployment\production.config.json'),
  [string]$SecretsPath = (Join-Path (Split-Path -Parent $PSScriptRoot) 'deployment\secrets.production.psd1'),
  [string]$CertificateEmail,
  [string]$WinAcmePath = 'C:\ProgramData\win-acme\wacs.exe',
  [switch]$SkipCertificate,
  [switch]$SkipFirewall
)

$ErrorActionPreference = 'Stop'
$repoRoot = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$publishRoot = Join-Path $repoRoot 'deployment\publish'
$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())

if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw 'Run this deployment script from an elevated PowerShell window (Run as Administrator).'
}

& (Join-Path $PSScriptRoot 'Sync-ProductionConfig.ps1') -ConfigPath $ConfigPath -Check | Out-Host
& (Join-Path $PSScriptRoot 'Test-ProductionDns.ps1') -ConfigPath $ConfigPath | Out-Host

if (-not (Test-Path -LiteralPath $SecretsPath -PathType Leaf)) {
  throw "Production secrets file is missing. Copy deployment\secrets.production.example.psd1 to deployment\secrets.production.psd1 and replace every placeholder."
}

$config = Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json
$secrets = Import-PowerShellDataFile -LiteralPath $SecretsPath
$domain = ([string]$config.rootDomain).Trim().ToLowerInvariant()
$apiHost = "$($config.subdomains.api).$domain"
$adminHost = "$($config.subdomains.admin).$domain"
$vendorHost = "$($config.subdomains.vendor).$domain"
$deployRoot = [IO.Path]::GetFullPath([string]$config.iis.deployRoot)
$sitePrefix = [string]$config.iis.sitePrefix

if ([string]::IsNullOrWhiteSpace($secrets.ConnectionString) -or
    $secrets.ConnectionString -match '(?i)REPLACE_|password=\s*(?:;|$)' -or
    ([string]$secrets.JwtKey).Length -lt 32 -or
    ([string]$secrets.JwtRefreshKey).Length -lt 32 -or
    $secrets.JwtKey -eq $secrets.JwtRefreshKey -or
    $secrets.JwtKey -match '(?i)REPLACE_|Development|Change-Me' -or
    $secrets.JwtRefreshKey -match '(?i)REPLACE_|Development|Change-Me') {
  throw 'Production secrets are missing, weak, identical, or still contain placeholders.'
}

foreach ($component in @('mobile', 'admin', 'vendor', 'api')) {
  if (-not (Test-Path -LiteralPath (Join-Path $publishRoot $component) -PathType Container)) {
    throw "Missing production artifact: deployment\publish\$component. Run scripts\Build-Production.ps1 first."
  }
}

if (-not (Test-Path "$env:windir\System32\inetsrv\appcmd.exe")) {
  throw 'IIS is not installed.'
}
if (-not (Test-Path "$env:ProgramFiles\IIS\Asp.Net Core Module\V2\aspnetcorev2.dll")) {
  throw 'ASP.NET Core Module V2 is missing. Install/repair the .NET Hosting Bundle after IIS.'
}

Import-Module WebAdministration
if (-not (Get-WebGlobalModule | Where-Object Name -eq 'RewriteModule')) {
  throw 'IIS URL Rewrite Module 2 is missing; static SPA fallback and HTTP-to-HTTPS rules require it.'
}

[IO.Directory]::CreateDirectory($deployRoot) | Out-Null
$deployRootPrefix = $deployRoot.TrimEnd('\') + '\'

function Copy-PublishedSite([string]$Name) {
  $source = Join-Path $publishRoot $Name
  $target = [IO.Path]::GetFullPath((Join-Path $deployRoot $Name))
  if (-not $target.StartsWith($deployRootPrefix, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to mirror outside configured IIS deploy root: $target"
  }
  [IO.Directory]::CreateDirectory($target) | Out-Null
  & robocopy.exe $source $target /MIR /R:2 /W:2 /NFL /NDL /NP
  if ($LASTEXITCODE -gt 7) {
    throw "robocopy failed for $Name with exit code $LASTEXITCODE."
  }
  return $target
}

$paths = @{}
foreach ($component in @('mobile', 'admin', 'vendor', 'api')) {
  $paths[$component] = Copy-PublishedSite $component
}

$siteDefinitions = @(
  @{ Key = 'mobile'; Site = "$sitePrefix-Mobile"; Pool = "$sitePrefix-Mobile"; Host = $domain },
  @{ Key = 'admin'; Site = "$sitePrefix-Admin"; Pool = "$sitePrefix-Admin"; Host = $adminHost },
  @{ Key = 'vendor'; Site = "$sitePrefix-Vendor"; Pool = "$sitePrefix-Vendor"; Host = $vendorHost },
  @{ Key = 'api'; Site = "$sitePrefix-Api"; Pool = "$sitePrefix-Api"; Host = $apiHost }
)

foreach ($definition in $siteDefinitions) {
  if (-not (Test-Path "IIS:\AppPools\$($definition.Pool)")) {
    New-WebAppPool -Name $definition.Pool | Out-Null
  }
  Set-ItemProperty "IIS:\AppPools\$($definition.Pool)" -Name managedRuntimeVersion -Value ''
  Set-ItemProperty "IIS:\AppPools\$($definition.Pool)" -Name managedPipelineMode -Value Integrated
  Set-ItemProperty "IIS:\AppPools\$($definition.Pool)" -Name processModel.identityType -Value ApplicationPoolIdentity
  Set-ItemProperty "IIS:\AppPools\$($definition.Pool)" -Name enable32BitAppOnWin64 -Value $false

  if (-not (Test-Path "IIS:\Sites\$($definition.Site)")) {
    New-Website `
      -Name $definition.Site `
      -PhysicalPath $paths[$definition.Key] `
      -ApplicationPool $definition.Pool `
      -Port 80 `
      -HostHeader $definition.Host | Out-Null
  } else {
    Set-ItemProperty "IIS:\Sites\$($definition.Site)" -Name physicalPath -Value $paths[$definition.Key]
    Set-ItemProperty "IIS:\Sites\$($definition.Site)" -Name applicationPool -Value $definition.Pool
    $httpBinding = Get-WebBinding -Name $definition.Site -Protocol http |
      Where-Object bindingInformation -eq "*:80:$($definition.Host)"
    if (-not $httpBinding) {
      New-WebBinding -Name $definition.Site -Protocol http -Port 80 -HostHeader $definition.Host
    }
  }
}

$apiDefinition = $siteDefinitions | Where-Object Key -eq 'api'
$environmentFilter = "system.applicationHost/applicationPools/add[@name='$($apiDefinition.Pool)']/environmentVariables"
$environmentValues = [ordered]@{
  ASPNETCORE_ENVIRONMENT = 'Production'
  ConnectionStrings__DefaultConnection = [string]$secrets.ConnectionString
  Jwt__Key = [string]$secrets.JwtKey
  Jwt__RefreshKey = [string]$secrets.JwtRefreshKey
}
foreach ($entry in $environmentValues.GetEnumerator()) {
  try {
    Remove-WebConfigurationProperty `
      -PSPath 'MACHINE/WEBROOT/APPHOST' `
      -Filter $environmentFilter `
      -Name '.' `
      -AtElement @{ name = $entry.Key } `
      -ErrorAction Stop
  } catch {
    if ($_.Exception.Message -notmatch '(?i)not found|cannot find|does not exist') {
      throw
    }
  }
  Add-WebConfigurationProperty `
    -PSPath 'MACHINE/WEBROOT/APPHOST' `
    -Filter $environmentFilter `
    -Name '.' `
    -Value @{ name = $entry.Key; value = $entry.Value }
}

$uploadsPath = Join-Path $deployRoot 'uploads'
$dataProtectionPath = Join-Path $paths.api '.data-protection-keys'
[IO.Directory]::CreateDirectory($uploadsPath) | Out-Null
[IO.Directory]::CreateDirectory($dataProtectionPath) | Out-Null
& icacls.exe $paths.api /grant "IIS AppPool\$($apiDefinition.Pool):(OI)(CI)(RX)" /T /C | Out-Null
& icacls.exe $uploadsPath /grant "IIS AppPool\$($apiDefinition.Pool):(OI)(CI)(M)" /T /C | Out-Null
& icacls.exe $dataProtectionPath /grant "IIS AppPool\$($apiDefinition.Pool):(OI)(CI)(M)" /T /C | Out-Null

Set-WebConfigurationProperty `
  -PSPath 'MACHINE/WEBROOT/APPHOST' `
  -Filter 'system.webServer/webSocket' `
  -Name enabled `
  -Value true

if (-not $SkipFirewall) {
  & (Join-Path $PSScriptRoot 'Set-ProductionFirewall.ps1') | Out-Host
}

foreach ($definition in $siteDefinitions) {
  Start-WebAppPool -Name $definition.Pool -ErrorAction SilentlyContinue
  Start-Website -Name $definition.Site -ErrorAction SilentlyContinue
}

if (-not $SkipCertificate) {
  if ([string]::IsNullOrWhiteSpace($CertificateEmail)) {
    throw 'CertificateEmail is required unless -SkipCertificate is specified.'
  }
  if (-not (Test-Path -LiteralPath $WinAcmePath -PathType Leaf)) {
    throw "win-acme not found: $WinAcmePath"
  }

  $siteIds = @($siteDefinitions | ForEach-Object {
    (Get-Website -Name $_.Site).id
  }) -join ','
  $hosts = @($domain, $apiHost, $adminHost, $vendorHost) -join ','

  & $WinAcmePath `
    --source iis `
    --siteid $siteIds `
    --host $hosts `
    --commonname $domain `
    --order single `
    --validation selfhosting `
    --store certificatestore `
    --installation iis `
    --accepttos `
    --emailaddress $CertificateEmail
  if ($LASTEXITCODE -ne 0) {
    throw "win-acme certificate issuance failed with exit code $LASTEXITCODE."
  }

  $renewalTasks = @(Get-ScheduledTask | Where-Object TaskName -like 'win-acme*')
  if ($renewalTasks.Count -ne 1) {
    throw "Expected exactly one win-acme renewal task, found $($renewalTasks.Count)."
  }
}

iisreset | Out-Host
Write-Host 'IIS production deployment completed.'
