import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from './config.js';
import { startTelemetry } from './telemetry.js';

const cfg = loadConfig();
// Telemetry must start before the HTTP server module graph is loaded.
await startTelemetry(cfg.appInsightsConnectionString);
const { buildApp } = await import('./app.js');

const here = path.dirname(fileURLToPath(import.meta.url));
const staticDir = cfg.staticDir ?? path.resolve(here, '../../app/dist');
const app = buildApp({ ...cfg, staticDir });

await app.listen({ port: cfg.port, host: '0.0.0.0' });
console.log(`HAYAT QUEST server on :${cfg.port} · ai-demo ${cfg.aiDemoEnabled ? `on (${cfg.aiMode})` : 'off'}`);
