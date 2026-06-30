[CmdletBinding()]
param(
  [string]$HostingBundleInstaller,
  [string]$UrlRewriteInstaller,
  [string]$WinAcmeZip,
  [string]$WinAcmeDirectory = 'C:\ProgramData\win-acme'
)

$ErrorActionPreference = 'Stop'
$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw 'Run this prerequisite installer from an elevated PowerShell window (Run as Administrator).'
}

$features = @(
  'IIS-WebServerRole',
  'IIS-WebServer',
  'IIS-CommonHttpFeatures',
  'IIS-DefaultDocument',
  'IIS-StaticContent',
  'IIS-HttpErrors',
  'IIS-HttpRedirect',
  'IIS-ApplicationDevelopment',
  'IIS-WebSockets',
  'IIS-HealthAndDiagnostics',
  'IIS-HttpLogging',
  'IIS-Security',
  'IIS-RequestFiltering',
  'IIS-Performance',
  'IIS-HttpCompressionStatic',
  'IIS-WebServerManagementTools',
  'IIS-ManagementConsole'
)

foreach ($feature in $features) {
  Enable-WindowsOptionalFeature -Online -FeatureName $feature -All -NoRestart | Out-Null
}

if ($HostingBundleInstaller) {
  $hostingInstaller = [IO.Path]::GetFullPath($HostingBundleInstaller)
  if (-not (Test-Path -LiteralPath $hostingInstaller -PathType Leaf)) {
    throw "Hosting Bundle installer not found: $hostingInstaller"
  }
  $process = Start-Process -FilePath $hostingInstaller -ArgumentList '/install', '/quiet', '/norestart' -Wait -PassThru -WindowStyle Hidden
  if ($process.ExitCode -notin @(0, 3010)) {
    throw "ASP.NET Core Hosting Bundle installer failed with exit code $($process.ExitCode)."
  }
}

if ($UrlRewriteInstaller) {
  $rewriteInstaller = [IO.Path]::GetFullPath($UrlRewriteInstaller)
  if (-not (Test-Path -LiteralPath $rewriteInstaller -PathType Leaf)) {
    throw "IIS URL Rewrite installer not found: $rewriteInstaller"
  }
  $process = Start-Process -FilePath msiexec.exe -ArgumentList '/i', "`"$rewriteInstaller`"", '/qn', '/norestart' -Wait -PassThru -WindowStyle Hidden
  if ($process.ExitCode -notin @(0, 3010)) {
    throw "IIS URL Rewrite installer failed with exit code $($process.ExitCode)."
  }
}

if ($WinAcmeZip) {
  $archive = [IO.Path]::GetFullPath($WinAcmeZip)
  if (-not (Test-Path -LiteralPath $archive -PathType Leaf)) {
    throw "win-acme archive not found: $archive"
  }
  [IO.Directory]::CreateDirectory($WinAcmeDirectory) | Out-Null
  Expand-Archive -LiteralPath $archive -DestinationPath $WinAcmeDirectory -Force
}

if (-not (Test-Path "$env:windir\System32\inetsrv\appcmd.exe")) {
  throw 'IIS appcmd.exe is missing after feature installation.'
}
if (-not (Test-Path "$env:ProgramFiles\IIS\Asp.Net Core Module\V2\aspnetcorev2.dll")) {
  throw 'ASP.NET Core Module V2 is missing. Install/repair the .NET 8 Hosting Bundle after enabling IIS.'
}

iisreset | Out-Host
Write-Host 'Windows IIS hosting prerequisites are installed. Reboot if Windows reports a pending restart.'
