[CmdletBinding()]
param(
  [string]$SecretsPath = (Join-Path (Split-Path -Parent $PSScriptRoot) 'deployment\secrets.production.psd1'),
  [string]$MySqlPath = 'C:\xampp\mysql\bin\mysql.exe',
  [string]$PhpPath = 'C:\xampp\php\php.exe',
  [string]$DatabaseName = 'viettuoraudio',
  [string]$DatabaseUser = 'viettour_prod',
  [string]$RootPassword,
  [switch]$Force
)

$ErrorActionPreference = 'Stop'
$utf8NoBom = New-Object Text.UTF8Encoding($false)

if ((Test-Path -LiteralPath $SecretsPath) -and -not $Force) {
  throw "Secrets file already exists: $SecretsPath. Use -Force only when intentionally rotating all generated secrets."
}
if (-not (Test-Path -LiteralPath $MySqlPath -PathType Leaf)) {
  throw "mysql client not found: $MySqlPath"
}
if (-not (Test-Path -LiteralPath $PhpPath -PathType Leaf)) {
  throw "PHP CLI not found: $PhpPath"
}
if ($DatabaseName -notmatch '^[a-zA-Z0-9_]+$' -or $DatabaseUser -notmatch '^[a-zA-Z0-9_]+$') {
  throw 'DatabaseName and DatabaseUser may contain only letters, digits, and underscores.'
}

function New-RandomSecret([int]$Length) {
  $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  $bytes = New-Object byte[] $Length
  $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
  try {
    $rng.GetBytes($bytes)
  } finally {
    $rng.Dispose()
  }
  -join ($bytes | ForEach-Object { $alphabet[$_ % $alphabet.Length] })
}

$databasePassword = New-RandomSecret 40
$jwtKey = New-RandomSecret 96
$jwtRefreshKey = New-RandomSecret 96
$adminPassword = New-RandomSecret 24
$vendorPassword = New-RandomSecret 24

$adminHash = & $PhpPath -r 'echo password_hash($argv[1], PASSWORD_BCRYPT);' $adminPassword
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($adminHash)) {
  throw 'Failed to generate a BCrypt admin password hash.'
}
$vendorHash = & $PhpPath -r 'echo password_hash($argv[1], PASSWORD_BCRYPT);' $vendorPassword
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($vendorHash)) {
  throw 'Failed to generate a BCrypt vendor password hash.'
}

$sql = @"
CREATE USER IF NOT EXISTS '$DatabaseUser'@'localhost' IDENTIFIED BY '$databasePassword';
ALTER USER '$DatabaseUser'@'localhost' IDENTIFIED BY '$databasePassword';
CREATE USER IF NOT EXISTS '$DatabaseUser'@'127.0.0.1' IDENTIFIED BY '$databasePassword';
ALTER USER '$DatabaseUser'@'127.0.0.1' IDENTIFIED BY '$databasePassword';
GRANT ALL PRIVILEGES ON ``$DatabaseName``.* TO '$DatabaseUser'@'localhost';
GRANT ALL PRIVILEGES ON ``$DatabaseName``.* TO '$DatabaseUser'@'127.0.0.1';
UPDATE ``$DatabaseName``.users SET pass_hash='$adminHash'
WHERE role IN ('ADMIN','SUPER_ADMIN') AND status='ACTIVE'
ORDER BY id LIMIT 1;
UPDATE ``$DatabaseName``.vendor_portal_users
SET pass_hash='$vendorHash', must_change_password=1, password_reset_at=UTC_TIMESTAMP(6)
WHERE status='ACTIVE'
ORDER BY id LIMIT 1;
FLUSH PRIVILEGES;
SELECT CONCAT('ADMIN_EMAIL=', email) FROM ``$DatabaseName``.users
WHERE role IN ('ADMIN','SUPER_ADMIN') AND status='ACTIVE'
ORDER BY id LIMIT 1;
SELECT CONCAT('VENDOR_EMAIL=', email) FROM ``$DatabaseName``.vendor_portal_users
WHERE status='ACTIVE'
ORDER BY id LIMIT 1;
"@

$mysqlArguments = @('-uroot', '--batch', '--skip-column-names')
if (-not [string]::IsNullOrEmpty($RootPassword)) {
  $mysqlArguments += "--password=$RootPassword"
}
$mysqlArguments += @('-e', $sql)
$mysqlOutput = @(& $MySqlPath @mysqlArguments)
if ($LASTEXITCODE -ne 0) {
  throw 'MySQL production user creation or admin credential rotation failed.'
}
$adminEmail = [string]($mysqlOutput | Where-Object { $_ -like 'ADMIN_EMAIL=*' } | Select-Object -First 1)
$adminEmail = $adminEmail.Replace('ADMIN_EMAIL=', '').Trim()
$vendorEmail = [string]($mysqlOutput | Where-Object { $_ -like 'VENDOR_EMAIL=*' } | Select-Object -First 1)
$vendorEmail = $vendorEmail.Replace('VENDOR_EMAIL=', '').Trim()
if ([string]::IsNullOrWhiteSpace($adminEmail)) {
  throw 'No active admin account was found after credential rotation.'
}
if ([string]::IsNullOrWhiteSpace($vendorEmail)) {
  throw 'No active vendor account was found after credential rotation.'
}

$content = @"
@{
  ConnectionString = 'server=127.0.0.1;port=3306;database=$DatabaseName;user=$DatabaseUser;password=$databasePassword;SslMode=None;AllowPublicKeyRetrieval=False;GuidFormat=None;'
  JwtKey = '$jwtKey'
  JwtRefreshKey = '$jwtRefreshKey'
  BootstrapAdminEmail = '$adminEmail'
  BootstrapAdminPassword = '$adminPassword'
  BootstrapVendorEmail = '$vendorEmail'
  BootstrapVendorPassword = '$vendorPassword'
}
"@

$absoluteSecretsPath = [IO.Path]::GetFullPath($SecretsPath)
[IO.Directory]::CreateDirectory((Split-Path -Parent $absoluteSecretsPath)) | Out-Null
[IO.File]::WriteAllText($absoluteSecretsPath, $content, $utf8NoBom)

$currentIdentity = [Security.Principal.WindowsIdentity]::GetCurrent().Name
& icacls.exe $absoluteSecretsPath /inheritance:r /grant:r "$currentIdentity`:(F)" '*S-1-5-18:(F)' '*S-1-5-32-544:(F)' | Out-Null
if ($LASTEXITCODE -ne 0) {
  throw 'Secrets were created, but applying the restricted file ACL failed.'
}

Write-Host "Production secrets initialized at $absoluteSecretsPath."
Write-Host 'Admin and Vendor passwords were rotated. Open the protected secrets file locally to retrieve the bootstrap logins.'
