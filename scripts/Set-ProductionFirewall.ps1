[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw 'Run this firewall script from an elevated PowerShell window.'
}

$rules = @(
  @{ Name = 'VietTourAudio-Allow-HTTP'; Action = 'Allow'; Ports = '80' },
  @{ Name = 'VietTourAudio-Allow-HTTPS'; Action = 'Allow'; Ports = '443' },
  @{ Name = 'VietTourAudio-Block-Internal'; Action = 'Block'; Ports = '3000-3001,3306,5000-5001,5173-5176,45200,8443' }
)

foreach ($rule in $rules) {
  Get-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue | Remove-NetFirewallRule
  New-NetFirewallRule `
    -DisplayName $rule.Name `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort $rule.Ports `
    -Action $rule.Action `
    -Profile Any | Out-Null
}

Write-Host 'Firewall now allows public TCP 80/443 and explicitly blocks known internal application/database ports.'
