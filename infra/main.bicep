// HAYAT QUEST — synthetic-only Azure prototype (D-043, docs/07-azure-prototype-scope.md).
// Subscription-scope entry point: creates ONE new, isolated resource group and
// deploys everything into it. It does not reference or modify any existing
// resources. Run what-if first (scripts/whatif.ps1); never auto-deployed.

targetScope = 'subscription'

@description('Region. Approved: East US 2.')
@allowed([ 'eastus2' ])
param location string = 'eastus2'

@description('New, isolated resource group.')
param resourceGroupName string = 'rg-hayat-quest-dev'

@description('Short lowercase prefix for resource names.')
@minLength(3)
@maxLength(12)
param namePrefix string = 'hayatq'

@description('Foundry model to deploy. Confirm availability/quota in East US 2 first (Q-006).')
param modelName string

@description('Model version. Confirm in the Foundry model catalog.')
param modelVersion string

@description('Deployment SKU, e.g. GlobalStandard or Standard.')
param modelSkuName string = 'DataZoneStandard'

@description('Capacity in thousands of tokens per minute. Keep small for a demo.')
param modelCapacity int = 10

@description('Monthly budget alert amount in the billing currency. Alerts only; Azure budgets do not stop spend.')
param budgetAmount int = 50

@description('Emails for budget alerts. If empty, no budget is created.')
param budgetContactEmails array = []

@description('First day of the current month, for the budget start.')
param budgetStartDate string = utcNow('yyyy-MM-01')

@description('Turn the Presenter lab endpoint on in the deployed app. Off by default.')
param aiDemoEnabled bool = false

var tags = {
  project: 'hayat-quest'
  environment: 'dev'
  dataClass: 'synthetic-only'
}

resource rg 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: resourceGroupName
  location: location
  tags: tags
}

module app 'resources.bicep' = {
  name: 'hayat-quest-resources'
  scope: rg
  params: {
    location: location
    namePrefix: namePrefix
    tags: tags
    modelName: modelName
    modelVersion: modelVersion
    modelSkuName: modelSkuName
    modelCapacity: modelCapacity
    budgetAmount: budgetAmount
    budgetContactEmails: budgetContactEmails
    budgetStartDate: budgetStartDate
    aiDemoEnabled: aiDemoEnabled
  }
}

output resourceGroup string = rg.name
output webAppName string = app.outputs.webAppName
output webAppUrl string = app.outputs.webAppUrl
output foundryEndpoint string = app.outputs.foundryEndpoint
