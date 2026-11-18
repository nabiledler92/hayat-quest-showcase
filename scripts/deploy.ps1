# Deploy HAYAT QUEST to Azure. CREATES BILLABLE RESOURCES.
# Refuses to run unless -ConfirmCost is passed, which you should only do after
# reviewing scripts/whatif.ps1 output and the cost table in infra/README.md (D-043).
# Works in Windows PowerShell 5.1 and PowerShell 7.
param(
  [Parameter(Mandatory = $true)][string]$SubscriptionId,
  [switch]$ConfirmCost,
  [string]$ParametersFile = "$PSScriptRoot/../infra/main.parameters.json"
)
$ErrorActionPreference = 'Stop'

if (-not $ConfirmCost) {
  throw "Refusing to deploy: re-run with -ConfirmCost after reviewing what-if and costs."
}
$root = (Resolve-Path "$PSScriptRoot/..").Path

# Native commands don't throw in PowerShell 5.1; stop on any non-zero exit.
# PowerShell 5.1 also turns any stderr text (e.g. npm warnings) into a terminating
# error under 'Stop', so judge native steps by exit code only.
function Invoke-Step([string]$label, [scriptblock]$cmd) {
  Write-Host "==> $label"
  $prev = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try { & $cmd 2>&1 | ForEach-Object { "$_" } } finally { $ErrorActionPreference = $prev }
  if ($LASTEXITCODE -ne 0) { throw "Step failed ($LASTEXITCODE): $label" }
}

# 1. Build and verify
Invoke-Step 'client: install' { npm --prefix "$root/app" ci --no-audit --no-fund }
Invoke-Step 'client: build' { npm --prefix "$root/app" run build }
Invoke-Step 'client: bundle secret scan' { node "$root/scripts/check-bundle.mjs" }
Invoke-Step 'server: install' { npm --prefix "$root/server" ci --no-audit --no-fund }
Invoke-Step 'server: tests' { npm --prefix "$root/server" test }
Invoke-Step 'server: build' { npm --prefix "$root/server" run build }

# 2. Infrastructure
Invoke-Step 'select subscription' { az account set --subscription $SubscriptionId }
Write-Host '==> infrastructure: az deployment sub create'
$ErrorActionPreference = 'Continue'
$json = az deployment sub create `
  --name "hayat-quest-$(Get-Date -Format yyyyMMddHHmm)" `
  --location eastus2 `
  --template-file "$root/infra/main.bicep" `
  --parameters "@$ParametersFile" `
  --query properties.outputs -o json
if ($LASTEXITCODE -ne 0) { throw 'Infrastructure deployment failed' }
$ErrorActionPreference = 'Stop'
$out = $json | Out-String | ConvertFrom-Json
Write-Host "    resource group: $($out.resourceGroup.value)  web app: $($out.webAppName.value)"

# 3. Package: built client + compiled server + production deps only
$stage = Join-Path $env:TEMP 'hayat-quest-pkg'
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory -Force "$stage/app", "$stage/server" | Out-Null
Copy-Item "$root/app/dist" "$stage/app/dist" -Recurse
Copy-Item "$root/server/dist" "$stage/server/dist" -Recurse
Copy-Item "$root/server/package.json", "$root/server/package-lock.json" "$stage/server"
Invoke-Step 'package: production dependencies' { npm --prefix "$stage/server" ci --omit=dev --no-audit --no-fund }
$zip = Join-Path $env:TEMP 'hayat-quest.zip'
if (Test-Path $zip) { Remove-Item $zip -Force }
# tar.exe writes forward-slash paths, which Linux App Service needs
# (Compress-Archive in PowerShell 5.1 writes backslashes).
Invoke-Step 'package: zip' { tar.exe -a -c -f $zip -C $stage app server }

# 4. Deploy code (Entra-authenticated; basic auth is disabled on the app)
Invoke-Step 'code: az webapp deploy' {
  az webapp deploy --resource-group $out.resourceGroup.value --name $out.webAppName.value --src-path $zip --type zip
}

Write-Host "Deployed: $($out.webAppUrl.value)"
Write-Host 'Next: verify 30-day retention on the workspace and every App* table (docs/07).'
