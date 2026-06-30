[CmdletBinding()]
param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot),
  [string]$OutputPath
)

$ErrorActionPreference = 'Stop'
$rootPath = [IO.Path]::GetFullPath($Root)
$excludedDirectories = @(
  '.git', 'node_modules', 'dist', 'build', 'bin', 'obj',
  '.vite', '.data-protection-keys', 'wwwroot', 'uploads', 'publish'
)
$textExtensions = @(
  '.cs', '.csproj', '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
  '.json', '.ps1', '.bat', '.cmd', '.sh', '.yml', '.yaml', '.xml',
  '.config', '.env', '.example', '.md', '.sql'
)
$patterns = [ordered]@{
  Localhost = '(?i)\blocalhost\b'
  Loopback = '\b(?:127\.0\.0\.1|0\.0\.0\.0)\b'
  TargetIp = '\b183\.81\.57\.253\b'
  UrlWithPort = '(?i)https?://[^\s"''<>]+:\d{2,5}\b'
  HardcodedDomain = '(?i)\b(?:api\.|admin\.|vendor\.|www\.)?bkpvp\.top\b'
  PortSetting = '(?i)\b(?:port|listen|applicationUrl|ASPNETCORE_URLS)\b[^\r\n]{0,80}\b(?:80|443|3000|3001|3306|5000|5001|5173|5174|5175|5176|45200|8443)\b'
}

$files = Get-ChildItem -LiteralPath $rootPath -Recurse -Force -File |
  Where-Object {
    $relative = $_.FullName.Substring($rootPath.Length).TrimStart('\', '/')
    $parts = $relative -split '[\\/]'
    -not ($parts | Where-Object { $excludedDirectories -contains $_ }) -and
    ($textExtensions -contains $_.Extension -or $_.Name -like '.env*')
  }

$findings = foreach ($file in $files) {
  $relativePath = $file.FullName.Substring($rootPath.Length).TrimStart('\', '/').Replace('\', '/')
  $lineNumber = 0
  foreach ($line in [IO.File]::ReadLines($file.FullName)) {
    $lineNumber++
    foreach ($entry in $patterns.GetEnumerator()) {
      if ($line -match $entry.Value) {
        [pscustomobject]@{
          Type = $entry.Key
          Path = $relativePath
          Line = $lineNumber
          Text = $line.Trim()
        }
      }
    }
  }
}

$findings = @($findings | Sort-Object Path, Line, Type)

if ($OutputPath) {
  $absoluteOutput = if ([IO.Path]::IsPathRooted($OutputPath)) {
    [IO.Path]::GetFullPath($OutputPath)
  } else {
    [IO.Path]::GetFullPath((Join-Path $rootPath $OutputPath))
  }

  $outputDirectory = Split-Path -Parent $absoluteOutput
  [IO.Directory]::CreateDirectory($outputDirectory) | Out-Null
  $findings | Export-Csv -LiteralPath $absoluteOutput -NoTypeInformation -Encoding UTF8
  Write-Host "Wrote $($findings.Count) findings to $absoluteOutput"
}

$findings
