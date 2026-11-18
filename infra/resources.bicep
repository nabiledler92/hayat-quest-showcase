// Resource-group-scope resources for HAYAT QUEST. See main.bicep.

param location string
param namePrefix string
param tags object
param modelName string
param modelVersion string
param modelSkuName string
param modelCapacity int
param budgetAmount int
param budgetContactEmails array
param budgetStartDate string
param aiDemoEnabled bool

var suffix = uniqueString(resourceGroup().id)
var retentionDays = 30

// Application Insights tables whose retention must be set explicitly; they can
// otherwise default to 90 days even when the workspace default is 30.
var appInsightsTables = [
  'AppAvailabilityResults'
  'AppBrowserTimings'
  'AppDependencies'
  'AppEvents'
  'AppExceptions'
  'AppMetrics'
  'AppPageViews'
  'AppPerformanceCounters'
  'AppRequests'
  'AppSystemEvents'
  'AppTraces'
]

// ---------- Monitoring (new workspace; never reuse an existing one) ----------
resource workspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: '${namePrefix}-log-${suffix}'
  location: location
  tags: tags
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: retentionDays
    features: { enableLogAccessUsingOnlyResourcePermissions: true }
  }
}

resource tables 'Microsoft.OperationalInsights/workspaces/tables@2022-10-01' = [
  for t in appInsightsTables: {
    parent: workspace
    name: t
    properties: {
      retentionInDays: retentionDays
      totalRetentionInDays: retentionDays
    }
  }
]

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${namePrefix}-appi-${suffix}'
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: workspace.id
    IngestionMode: 'LogAnalytics'
    DisableIpMasking: false
    DisableLocalAuth: false
  }
}

// ---------- Foundry (AI Services) + one model deployment ----------
resource foundry 'Microsoft.CognitiveServices/accounts@2024-10-01' = {
  name: '${namePrefix}-ai-${suffix}'
  location: location
  tags: tags
  kind: 'AIServices'
  sku: { name: 'S0' }
  identity: { type: 'SystemAssigned' }
  properties: {
    customSubDomainName: '${namePrefix}-ai-${suffix}'
    // No API keys: Entra (managed identity) only.
    disableLocalAuth: true
    publicNetworkAccess: 'Enabled'
  }
}

resource modelDeployment 'Microsoft.CognitiveServices/accounts/deployments@2024-10-01' = {
  parent: foundry
  name: 'demo-${modelName}'
  sku: {
    name: modelSkuName
    capacity: modelCapacity
  }
  properties: {
    model: {
      format: 'OpenAI'
      name: modelName
      version: modelVersion
    }
    versionUpgradeOption: 'NoAutoUpgrade'
  }
}

// ---------- Hosting: one Linux web app serving client + API ----------
resource plan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: '${namePrefix}-plan-${suffix}'
  location: location
  tags: tags
  kind: 'linux'
  sku: {
    name: 'B1'
    tier: 'Basic'
  }
  properties: { reserved: true }
}

resource web 'Microsoft.Web/sites@2023-12-01' = {
  name: '${namePrefix}-web-${suffix}'
  location: location
  tags: tags
  kind: 'app,linux'
  identity: { type: 'SystemAssigned' }
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|22-lts'
      appCommandLine: 'node server/dist/index.js'
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      http20Enabled: true
      alwaysOn: false
      appSettings: [
        { name: 'AI_MODE', value: 'foundry' }
        { name: 'AI_DEMO_ENABLED', value: string(aiDemoEnabled) }
        { name: 'AZURE_OPENAI_ENDPOINT', value: 'https://${foundry.properties.customSubDomainName}.openai.azure.com' }
        { name: 'AZURE_OPENAI_DEPLOYMENT', value: modelDeployment.name }
        { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appInsights.properties.ConnectionString }
        { name: 'STATIC_DIR', value: '/home/site/wwwroot/app/dist' }
        { name: 'SCM_DO_BUILD_DURING_DEPLOYMENT', value: 'false' }
      ]
    }
  }
}

// Disable basic-auth publishing credentials (deploy with Entra via az CLI).
resource scmBasicAuth 'Microsoft.Web/sites/basicPublishingCredentialsPolicies@2023-12-01' = {
  parent: web
  name: 'scm'
  properties: { allow: false }
}
resource ftpBasicAuth 'Microsoft.Web/sites/basicPublishingCredentialsPolicies@2023-12-01' = {
  parent: web
  name: 'ftp'
  properties: { allow: false }
}

// Web app identity may call the model, nothing more.
var cognitiveServicesOpenAIUser = '5e0bd9bd-7b93-4f28-af87-19fc36ad61bd'
resource webCanCallModel 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(foundry.id, web.id, cognitiveServicesOpenAIUser)
  scope: foundry
  properties: {
    principalId: web.identity.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', cognitiveServicesOpenAIUser)
  }
}

// ---------- Budget alert (alerts only — does not cap spend) ----------
resource budget 'Microsoft.Consumption/budgets@2023-11-01' = if (!empty(budgetContactEmails)) {
  name: '${namePrefix}-budget'
  properties: {
    category: 'Cost'
    amount: budgetAmount
    timeGrain: 'Monthly'
    timePeriod: { startDate: budgetStartDate }
    notifications: {
      actual80: {
        enabled: true
        operator: 'GreaterThanOrEqualTo'
        threshold: 80
        contactEmails: budgetContactEmails
        thresholdType: 'Actual'
      }
      forecast100: {
        enabled: true
        operator: 'GreaterThanOrEqualTo'
        threshold: 100
        contactEmails: budgetContactEmails
        thresholdType: 'Forecasted'
      }
    }
  }
}

output webAppName string = web.name
output webAppUrl string = 'https://${web.properties.defaultHostName}'
output foundryEndpoint string = 'https://${foundry.properties.customSubDomainName}.openai.azure.com'
