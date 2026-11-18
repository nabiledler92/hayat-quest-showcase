import { describe, expect, it } from 'vitest';
import { BasicTracerProvider, InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { RedactingSpanProcessor, redactAttributes, stripQuery } from './telemetry.js';

describe('telemetry redaction', () => {
  it('keeps only allow-listed attributes', () => {
    expect(
      redactAttributes({
        'http.route': '/api/ai-demo',
        'http.response.status_code': 200,
        'url.full': 'https://x/api?email=a@b.c',
        'url.query': 'email=a@b.c',
        'enduser.id': 'user-123',
        'gen_ai.prompt': 'secret',
        'hayat.prompt_id': 'tone-welcome',
      }),
    ).toEqual({ 'http.route': '/api/ai-demo', 'http.response.status_code': 200, 'hayat.prompt_id': 'tone-welcome' });
  });

  it('strips query strings from span names', () => {
    expect(stripQuery('GET /api/x?email=a@b.c')).toBe('GET /api/x');
  });

  it('exported spans never contain prompt or response text', () => {
    const exporter = new InMemorySpanExporter();
    const provider = new BasicTracerProvider({
      // Redactor must run before the exporting processor.
      spanProcessors: [new RedactingSpanProcessor(), new SimpleSpanProcessor(exporter)],
    });
    const tracer = provider.getTracer('test');
    const health = 'synthetic health text 42';
    const span = tracer.startSpan('POST /api/ai-demo?q=' + health);
    span.setAttribute('http.route', '/api/ai-demo');
    span.setAttribute('http.request.body', health);
    span.setAttribute('gen_ai.completion', health);
    span.setAttribute('enduser.email', 'person@example.com');
    span.addEvent('exception', { 'exception.message': health });
    span.end();

    const [out] = exporter.getFinishedSpans();
    const serialized = JSON.stringify({ name: out.name, attributes: out.attributes, events: out.events });
    expect(serialized).not.toContain(health);
    expect(serialized).not.toContain('person@example.com');
    expect(out.attributes).toEqual({ 'http.route': '/api/ai-demo' });
    expect(out.events).toHaveLength(0);
  });
});
