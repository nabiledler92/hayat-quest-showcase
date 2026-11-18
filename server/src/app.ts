import Fastify, { type FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import { existsSync } from 'node:fs';
import { trace } from '@opentelemetry/api';
import type { Config } from './config.js';
import { SYNTHETIC_PROMPTS, findPrompt } from './ai/prompts.js';
import { DEMO_LABEL, runDemo, type ResponsesClient } from './ai/responses.js';

const RATE_LIMIT_PER_MIN = 20;

export function buildApp(cfg: Config, deps: { client?: ResponsesClient } = {}): FastifyInstance {
  // No request logging: URLs and bodies stay out of logs entirely.
  const app = Fastify({
    logger: { level: 'warn' },
    disableRequestLogging: true,
    bodyLimit: 1024,
    // Reject unknown fields instead of silently stripping them.
    ajv: { customOptions: { removeAdditional: false } },
  });

  app.get('/api/health', async () => ({ ok: true }));

  // ---- Presenter lab (internal, synthetic only) ----
  let windowStart = Date.now();
  let windowCount = 0;

  app.get('/api/ai-demo/prompts', async (_req, reply) => {
    if (!cfg.aiDemoEnabled) return reply.code(404).send({ error: 'not_enabled' });
    return {
      mode: cfg.aiMode,
      label: DEMO_LABEL,
      prompts: SYNTHETIC_PROMPTS.map(({ id, title }) => ({ id, title })),
    };
  });

  app.post(
    '/api/ai-demo',
    {
      schema: {
        body: {
          type: 'object',
          required: ['promptId'],
          additionalProperties: false,
          properties: { promptId: { type: 'string', maxLength: 64 } },
        },
      },
      // Never echo the request body in validation errors.
      attachValidation: true,
    },
    async (req, reply) => {
      if (!cfg.aiDemoEnabled) return reply.code(404).send({ error: 'not_enabled' });
      if (req.validationError) return reply.code(400).send({ error: 'invalid_request' });
      const prompt = findPrompt((req.body as { promptId: string }).promptId);
      if (!prompt) return reply.code(400).send({ error: 'unknown_prompt' });

      const now = Date.now();
      if (now - windowStart > 60_000) {
        windowStart = now;
        windowCount = 0;
      }
      if (++windowCount > RATE_LIMIT_PER_MIN) return reply.code(429).send({ error: 'rate_limited' });

      const span = trace.getActiveSpan();
      span?.setAttribute('hayat.prompt_id', prompt.id);
      span?.setAttribute('hayat.ai_mode', cfg.aiMode);
      if (cfg.openaiDeployment) span?.setAttribute('hayat.model_deployment', cfg.openaiDeployment);

      try {
        return await runDemo(prompt, cfg, deps.client);
      } catch {
        // Generic error only: upstream messages may echo prompt content.
        return reply.code(502).send({ error: 'ai_unavailable' });
      }
    },
  );

  // ---- Built client (Azure single web app) ----
  if (cfg.staticDir && existsSync(cfg.staticDir)) {
    app.register(fastifyStatic, { root: cfg.staticDir, index: 'index.html' });
    app.setNotFoundHandler((req, reply) => {
      if (req.url.startsWith('/api/')) return reply.code(404).send({ error: 'not_found' });
      return reply.sendFile('index.html');
    });
  }

  return app;
}
