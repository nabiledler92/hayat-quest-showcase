import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SYNTHETIC_PROMPTS, findPrompt } from './prompts.js';
import { buildRequest, runDemo, type ResponsesClient } from './responses.js';
import type { Config } from '../config.js';

const srcDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    if (statSync(p).isDirectory()) return sourceFiles(p);
    return p.endsWith('.ts') && !p.endsWith('.test.ts') ? [p] : [];
  });
}

const foundryCfg: Config = {
  port: 0,
  aiDemoEnabled: true,
  aiMode: 'foundry',
  openaiEndpoint: 'https://example.invalid',
  openaiDeployment: 'demo-deployment',
  openaiApiVersion: 'test',
};

describe('store:false guardrail', () => {
  it('every allow-listed prompt builds a request with store === false and no response chaining', () => {
    for (const p of SYNTHETIC_PROMPTS) {
      const body = buildRequest(p, 'demo-deployment') as unknown as Record<string, unknown>;
      expect(body.store).toBe(false);
      expect(body.reasoning).toEqual({ effort: 'low' });
      expect(body.max_output_tokens).toBeLessThanOrEqual(1000);
      expect(body).not.toHaveProperty('previous_response_id');
      expect(body).not.toHaveProperty('conversation');
      expect(body).not.toHaveProperty('background');
    }
  });

  it('runDemo sends store:false to the client', async () => {
    const seen: unknown[] = [];
    const fake: ResponsesClient = {
      responses: {
        async create(body) {
          seen.push(body);
          return { output_text: ' ok ' };
        },
      },
    };
    const res = await runDemo(SYNTHETIC_PROMPTS[0], foundryCfg, fake);
    expect(res.output).toBe('ok');
    expect(res.label).toMatch(/synthetic, not health advice/);
    expect(seen).toHaveLength(1);
    expect((seen[0] as { store: unknown }).store).toBe(false);
  });

  it('fixture mode never calls the client', async () => {
    const fake: ResponsesClient = {
      responses: {
        create: () => {
          throw new Error('should not be called');
        },
      },
    };
    const res = await runDemo(SYNTHETIC_PROMPTS[1], { ...foundryCfg, aiMode: 'fixture' }, fake);
    expect(res.mode).toBe('fixture');
  });
});

describe('stateless-only API surface', () => {
  const files = sourceFiles(srcDir);

  it('no source file uses Assistants/Agent threads, runs, or response chaining', () => {
    const banned = /\b(threads|beta\.assistants|assistants\.create|runs\.create|previous_response_id|conversations\.create)\b/;
    const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
    for (const f of files) expect(stripComments(readFileSync(f, 'utf8')), f).not.toMatch(banned);
  });

  it('only ai/responses.ts constructs a model client or calls responses.create', () => {
    for (const f of files) {
      if (f.endsWith(path.join('ai', 'responses.ts'))) continue;
      const src = readFileSync(f, 'utf8');
      expect(src, f).not.toMatch(/new (Azure)?OpenAI\(/);
      expect(src, f).not.toMatch(/responses\.create\(/);
    }
  });
});

describe('prompt allow-list', () => {
  it('accepts only known IDs', () => {
    expect(findPrompt('tone-welcome')?.id).toBe('tone-welcome');
    expect(findPrompt('I have a health question')).toBeUndefined();
    expect(findPrompt({ id: 'tone-welcome' })).toBeUndefined();
    expect(findPrompt(undefined)).toBeUndefined();
  });
});
