[CmdletBinding()]
param(
  [string]$ConfigPath = (Join-Path (Split-Path -Parent $PSScriptRoot) 'deployment\production.config.json'),
  [switch]$SkipNpmCi
)

$ErrorActionPreference = 'Stop'
$repoRoot = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$clientRoot = Join-Path $repoRoot 'client'
$apiProject = Join-Path $repoRoot 'server\VietTourAudio.Api\VietTourAudio.Api.csproj'
$publishRoot = Join-Path $repoRoot 'deployment\publish'
$utf8NoBom = New-Object Text.UTF8Encoding($false)

function Assert-Success([string]$Description) {
  if ($LASTEXITCODE -ne 0) {
    throw "$Description failed with exit code $LASTEXITCODE."
  }
}

function Write-StaticWebConfig([string]$TargetDirectory) {
  $content = @'
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="HTTPS redirect" stopProcessing="true">
          <match url="(.*)" />
          <conditions>
            <add input="{HTTPS}" pattern="off" />
            <add input="{URL}" pattern="^/\.well-known/acme-challenge/" negate="true" />
          </conditions>
          <action type="Redirect" url="https://{HTTP_HOST}/{R:1}" redirectType="Permanent" />
        </rule>
        <rule name="React SPA fallback" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
    <httpProtocol>
      <customHeaders>
        <remove name="X-Powered-By" />
        <add name="X-Content-Type-Options" value="nosniff" />
        <add name="Referrer-Policy" value="strict-origin-when-cross-origin" />
        <add name="Permissions-Policy" value="camera=(self), geolocation=(self), microphone=(self)" />
      </customHeaders>
    </httpProtocol>
    <staticContent>
      <remove fileExtension=".webmanifest" />
      <mimeMap fileExtension=".webmanifest" mimeType="application/manifest+json" />
    </staticContent>
  </system.webServer>
</configuration>
'@
  [IO.File]::WriteAllText((Join-Path $TargetDirectory 'web.config'), $content, $utf8NoBom)
}

& (Join-Path $PSScriptRoot 'Sync-ProductionConfig.ps1') -ConfigPath $ConfigPath | Out-Host

if (-not $SkipNpmCi) {
  Push-Location $clientRoot
  try {
    & npm.cmd ci
    Assert-Success 'npm ci'
  } finally {
    Pop-Location
  }
}

foreach ($role in @('mobile', 'admin', 'vendor')) {
  $target = Join-Path $publishRoot $role
  Push-Location $clientRoot
  try {
    & npm.cmd run build -- --mode "production.$role" --outDir $target --emptyOutDir
    Assert-Success "React $role production build"
  } finally {
    Pop-Location
  }

  if (-not (Test-Path -LiteralPath (Join-Path $target 'index.html'))) {
    throw "React $role build did not produce index.html."
  }
  Write-StaticWebConfig $target
}

$apiTarget = Join-Path $publishRoot 'api'
if (Test-Path -LiteralPath $apiTarget) {
  $resolvedPublishRoot = [IO.Path]::GetFullPath($publishRoot).TrimEnd('\') + '\'
  $resolvedApiTarget = [IO.Path]::GetFullPath($apiTarget)
  if (-not $resolvedApiTarget.StartsWith($resolvedPublishRoot, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to clear API output outside $publishRoot."
  }
  Remove-Item -LiteralPath $apiTarget -Recurse -Force
}

& dotnet publish $apiProject --configuration Release --output $apiTarget --no-self-contained
Assert-Success 'ASP.NET Core production publish'

$webConfigPath = Join-Path $apiTarget 'web.config'
if (-not (Test-Path -LiteralPath $webConfigPath)) {
  throw 'dotnet publish did not generate web.config. The project is not ready for IIS.'
}

[xml]$webConfig = Get-Content -LiteralPath $webConfigPath -Raw
$aspNetCore = $webConfig.configuration.location.'system.webServer'.aspNetCore
if (-not $aspNetCore) {
  $aspNetCore = $webConfig.configuration.'system.webServer'.aspNetCore
}
if (-not $aspNetCore) {
  throw 'Generated web.config has no aspNetCore element.'
}
$aspNetCore.SetAttribute('hostingModel', 'inprocess')
$aspNetCore.SetAttribute('stdoutLogEnabled', 'false')

$environmentVariables = $aspNetCore.environmentVariables
if (-not $environmentVariables) {
  $environmentVariables = $webConfig.CreateElement('environmentVariables')
  $aspNetCore.AppendChild($environmentVariables) | Out-Null
}
$existingEnvironment = @($environmentVariables.environmentVariable) |
  Where-Object { $_.name -eq 'ASPNETCORE_ENVIRONMENT' } |
  Select-Object -First 1
if (-not $existingEnvironment) {
  $existingEnvironment = $webConfig.CreateElement('environmentVariable')
  $environmentVariables.AppendChild($existingEnvironment) | Out-Null
}
$existingEnvironment.SetAttribute('name', 'ASPNETCORE_ENVIRONMENT')
$existingEnvironment.SetAttribute('value', 'Production')

$systemWebServer = $aspNetCore.ParentNode
$existingRewrite = $systemWebServer.SelectSingleNode('rewrite')
if ($existingRewrite) {
  $systemWebServer.RemoveChild($existingRewrite) | Out-Null
}
$rewrite = $webConfig.CreateElement('rewrite')
$rules = $webConfig.CreateElement('rules')
$rule = $webConfig.CreateElement('rule')
$rule.SetAttribute('name', 'HTTPS redirect')
$rule.SetAttribute('stopProcessing', 'true')
$match = $webConfig.CreateElement('match')
$match.SetAttribute('url', '(.*)')
$conditions = $webConfig.CreateElement('conditions')
$httpsCondition = $webConfig.CreateElement('add')
$httpsCondition.SetAttribute('input', '{HTTPS}')
$httpsCondition.SetAttribute('pattern', 'off')
$acmeCondition = $webConfig.CreateElement('add')
$acmeCondition.SetAttribute('input', '{URL}')
$acmeCondition.SetAttribute('pattern', '^/\.well-known/acme-challenge/')
$acmeCondition.SetAttribute('negate', 'true')
$action = $webConfig.CreateElement('action')
$action.SetAttribute('type', 'Redirect')
$action.SetAttribute('url', 'https://{HTTP_HOST}/{R:1}')
$action.SetAttribute('redirectType', 'Permanent')
$conditions.AppendChild($httpsCondition) | Out-Null
$conditions.AppendChild($acmeCondition) | Out-Null
$rule.AppendChild($match) | Out-Null
$rule.AppendChild($conditions) | Out-Null
$rule.AppendChild($action) | Out-Null
$rules.AppendChild($rule) | Out-Null
$rewrite.AppendChild($rules) | Out-Null
$systemWebServer.InsertBefore($rewrite, $systemWebServer.FirstChild) | Out-Null

$webConfig.Save($webConfigPath)

& (Join-Path $PSScriptRoot 'Test-ProductionHardcodes.ps1') -Root $repoRoot | Out-Host

Write-Host "Production artifacts are ready in $publishRoot"
