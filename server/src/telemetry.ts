// Operational telemetry only (docs/07-azure-prototype-scope.md):
// request metadata and timing — never request/response bodies, query strings,
// emails, account IDs or health text.
//
// A redaction span processor runs before export and strips every attribute not
// on the allow-list, plus all span events (exception messages could echo input).

import type { Context } from '@opentelemetry/api';
import type { ReadableSpan, Span, SpanProcessor } from '@opentelemetry/sdk-trace-base';

export const ALLOWED_ATTRIBUTES = new Set([
  'http.request.method',
  'http.method',
  'http.response.status_code',
  'http.status_code',
  'http.route',
  'url.scheme',
  'server.port',
  'hayat.prompt_id',
  'hayat.ai_mode',
  'hayat.model_deployment',
  'gen_ai.operation.name',
  'gen_ai.request.model',
]);

/** Pure helper: returns only allow-listed attributes. */
export function redactAttributes(attrs: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(attrs)) if (ALLOWED_ATTRIBUTES.has(k)) out[k] = v;
  return out;
}

/** Strips a URL down to its path (no query string or fragment). */
export function stripQuery(name: string): string {
  return name.replace(/[?#].*$/, '');
}

export class RedactingSpanProcessor implements SpanProcessor {
  onStart(_span: Span, _ctx: Context): void {}

  onEnd(span: ReadableSpan): void {
    // ReadableSpan is typed read-only, but processors run before the exporter in
    // registration order, so mutating here is what the exporter sees.
    const s = span as unknown as {
      attributes: Record<string, unknown>;
      events: unknown[];
      name: string;
      links: unknown[];
    };
    const kept = redactAttributes(s.attributes);
    for (const k of Object.keys(s.attributes)) delete s.attributes[k];
    Object.assign(s.attributes, kept);
    s.events.length = 0;
    s.name = stripQuery(s.name);
  }

  forceFlush(): Promise<void> {
    return Promise.resolve();
  }
  shutdown(): Promise<void> {
    return Promise.resolve();
  }
}

/** Starts Azure Monitor only when a connection string is configured. */
export async function startTelemetry(connectionString: string | undefined): Promise<void> {
  if (!connectionString) return;
  const { useAzureMonitor } = await import('@azure/monitor-opentelemetry');
  useAzureMonitor({
    azureMonitorExporterOptions: { connectionString },
    spanProcessors: [new RedactingSpanProcessor()],
    enableLiveMetrics: false,
    instrumentationOptions: {
      http: { enabled: true },
      azureSdk: { enabled: false },
      mongoDb: { enabled: false },
      mySql: { enabled: false },
      postgreSql: { enabled: false },
      redis: { enabled: false },
      redis4: { enabled: false },
      // Log instrumentations off: logs could contain content.
      bunyan: { enabled: false },
      winston: { enabled: false },
    },
  });
}
