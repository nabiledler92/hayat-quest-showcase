# Architecture and guardrails

## Principles
1. **Education and navigation, never diagnosis.** No health statement ships without clinician review, and every unreviewed string carries a visible "pending clinical review" label. The "Reviewed information" label renders only for content marked as reviewed.
2. **Nothing saved by default.** The participant journey is held in memory and makes no network calls. Saving history, personalising from it, and keeping a journal are separate, explicit opt-ins.
3. **The model can't see what users type.** The browser sends only allow-listed prompt IDs. The server holds the fixed, synthetic prompt text.
4. **Minimal, redacted telemetry.** The server records route, status, duration, prompt ID and model deployment name, and nothing else.

## Components

| Part | Responsibility |
|---|---|
| `app/` | React client: the 15-screen journey, canvas isometric scene (`src/scene/`), sign-in boundary (`src/auth/`, mock until Entra External ID is configured), and the Presenter lab |
| `server/` | Fastify API. `POST /api/ai-demo` is off unless `AI_DEMO_ENABLED=true` and runs in fixture mode by default. It serves the built client in Azure |
| `server/src/ai/responses.ts` | The only module allowed to call the model: Responses API with `store: false`, `reasoning.effort: 'low'`, and an Entra token via `DefaultAzureCredential` (no keys) |
| `server/src/telemetry.ts` | Azure Monitor OpenTelemetry with a redacting span processor that strips attributes, events and query strings before export |
| `infra/` | Bicep: an isolated resource group, Log Analytics with 30 days on the workspace and every `App*` table, keyless AI Services with a gpt-5.4-mini deployment (DataZoneStandard), a Linux web app with managed identity and least-privilege role, and a budget alert |
| `scripts/` | `whatif.ps1` (preview only), `deploy.ps1` (refuses to run without `-ConfirmCost`), `check-bundle.mjs` (secret scan of the client bundle) |

## Notes on retention
`store: false` stops the app from persisting responses, but it is **not** a zero-retention promise: service-side processing and abuse-monitoring terms apply and must be checked before any real participant data. The prototype uses synthetic prompts only.
