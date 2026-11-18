import { describe, expect, it } from 'vitest';
import { buildApp } from './app.js';
import { loadConfig, type Config } from './config.js';

const base: Config = { port: 0, aiDemoEnabled: true, aiMode: 'fixture', openaiApiVersion: 'test' };

describe('/api/ai-demo', () => {
  it('is off by default', async () => {
    const app = buildApp(loadConfig({}));
    const res = await app.inject({ method: 'POST', url: '/api/ai-demo', payload: { promptId: 'tone-welcome' } });
    expect(res.statusCode).toBe(404);
    expect(loadConfig({}).aiMode).toBe('fixture');
  });

  it('returns labelled fixture output for an allow-listed prompt', async () => {
    const app = buildApp(base);
    const res = await app.inject({ method: 'POST', url: '/api/ai-demo', payload: { promptId: 'tone-welcome' } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.mode).toBe('fixture');
    expect(body.label).toBe('AI demo — synthetic, not health advice');
  });

  it('rejects free text and extra fields without echoing them', async () => {
    const app = buildApp(base);
    const secret = 'my sperm count result is';
    for (const payload of [{ promptId: secret }, { promptId: 'tone-welcome', text: secret }, { text: secret }]) {
      const res = await app.inject({ method: 'POST', url: '/api/ai-demo', payload });
      expect(res.statusCode).toBe(400);
      expect(res.body).not.toContain(secret);
    }
  });

  it('lists prompts by id and title only', async () => {
    const app = buildApp(base);
    const res = await app.inject({ method: 'GET', url: '/api/ai-demo/prompts' });
    const body = res.json();
    expect(body.prompts.length).toBeGreaterThan(0);
    for (const p of body.prompts) expect(Object.keys(p).sort()).toEqual(['id', 'title']);
  });

  it('refuses foundry mode without endpoint configuration', () => {
    expect(() => loadConfig({ AI_MODE: 'foundry' })).toThrow();
  });
});
