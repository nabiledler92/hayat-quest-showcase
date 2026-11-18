# HAYAT QUEST — Azure infrastructure (not deployed)

Bicep for the synthetic-only prototype (D-043). **Nothing here has been deployed.** Deploying requires your review of the what-if output and the costs below.

## What it would create (all in a new `rg-hayat-quest-dev`, East US 2)

| Resource | SKU / setting | Notes | Rough monthly cost* |
|---|---|---|---|
| Log Analytics workspace | PerGB2018, **30-day** retention | New; never reuses an existing workspace | ~US$0–3 at demo volume |
| 11 `App*` tables | **30 days** each, set explicitly | Prevents the 90-day table default | included |
| Application Insights | Workspace-based | Fed only by redacted server spans | included |
| Foundry (AI Services) account | S0, **local auth disabled** | No API keys exist | no standing fee |
| Model deployment | `modelName`/`modelVersion` param, capacity 10K TPM | Choose in Q-006 | per token, <US$1 for demos |
| App Service plan | Linux **B1** | One web app: client + API | ~US$13 |
| Web app | Node 22, HTTPS only, system managed identity, basic-auth publishing off | `AI_DEMO_ENABLED=false` unless the param is set | included in plan |
| Role assignment | Cognitive Services OpenAI User → web app identity | Least privilege on the Foundry account only | free |
| Budget (optional) | Monthly alerts at 80% actual / 100% forecast | **Alerts only — does not cap spend** | free |

\* Estimates only. Confirm in the Azure pricing calculator for your subscription and currency.

## Steps (you run these; nothing runs automatically)
1. Install the Azure CLI, then `az login`.
2. In `main.parameters.json`, set `modelName` / `modelVersion` (Q-006) and `budgetContactEmails`.
3. Preview, which changes nothing:
   `powershell -File scripts/whatif.ps1 -SubscriptionId <id>`
4. Review the output and costs. Only then:
   `powershell -File scripts/deploy.ps1 -SubscriptionId <id> -ConfirmCost`
5. After deploying, check in the portal that the workspace and every `App*` table show 30 days. Then send a synthetic prompt and confirm that no prompt text appears in Application Insights.

## Verification status
- 2026-11-18: `bicep build`/`lint` clean; what-if against the project subscription showed 21 Create, 0 Modify, 0 Delete.
- Not covered by what-if: App Service B1 quota, model capacity, and whether the `App*` table PUTs succeed at deploy time.
- Model availability, quota and the Responses API `api-version` in East US 2.
