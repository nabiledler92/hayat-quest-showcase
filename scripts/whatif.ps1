# Preview what the HAYAT QUEST infra WOULD create. Makes no changes.
# Requires: Azure CLI (az) signed in to the intended subscription.
param(
  [Parameter(Mandatory = $true)][string]$SubscriptionId,
  [string]$ParametersFile = "$PSScriptRoot/../infra/main.parameters.json"
)
$ErrorActionPreference = 'Stop'

$params = Get-Content $ParametersFile -Raw
if ($params -match 'REPLACE_ME') {
  throw "Set modelName/modelVersion in $ParametersFile first (open question Q-006)."
}

az account set --subscription $SubscriptionId
Write-Host "Subscription:" (az account show --query "{name:name, id:id}" -o tsv)

az deployment sub what-if `
  --name "hayat-quest-whatif" `
  --location eastus2 `
  --template-file "$PSScriptRoot/../infra/main.bicep" `
  --parameters "@$ParametersFile" `
  --result-format FullResourcePayloads
