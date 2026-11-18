// The ONLY module allowed to call the model (enforced by guardrails.test.ts).
//
// Rules from docs/07-azure-prototype-scope.md:
//  - Responses API with `store: false` on every request.
//  - No Agent Service threads/messages/runs, no persisted responses, no
//    previous-response IDs. Each call is independent.
//  - Prompt/response text is never logged or added to telemetry.

import { AzureOpenAI } from 'openai';
import type { ResponseCreateParamsNonStreaming } from 'openai/resources/responses/responses';
import { DefaultAzureCredential, getBearerTokenProvider } from '@azure/identity';
import type { Config } from '../config.js';
import { SYSTEM_INSTRUCTIONS, type SyntheticPrompt } from './prompts.js';

export const DEMO_LABEL = 'AI demo — synthetic, not health advice';

/** Minimal surface we use, so tests can inject a fake. */
export interface ResponsesClient {
  responses: { create(body: ResponseCreateParamsNonStreaming): Promise<{ output_text: string }> };
}

export interface DemoResult {
  promptId: string;
  output: string;
  mode: 'fixture' | 'foundry';
  label: typeof DEMO_LABEL;
}

/** Builds the request body. `store: false` is fixed here and cannot be overridden. */
export function buildRequest(prompt: SyntheticPrompt, deployment: string): ResponseCreateParamsNonStreaming {
  return {
    model: deployment,
    instructions: SYSTEM_INSTRUCTIONS,
    input: prompt.input,
    // GPT-5-family models spend output tokens on reasoning first; keep effort
    // low and leave headroom so the short answer isn't cut off (D-045).
    reasoning: { effort: 'low' },
    max_output_tokens: 600,
    store: false,
  };
}

export function createFoundryClient(cfg: Config): ResponsesClient {
  const credential = new DefaultAzureCredential();
  const azureADTokenProvider = getBearerTokenProvider(credential, 'https://cognitiveservices.azure.com/.default');
  return new AzureOpenAI({
    endpoint: cfg.openaiEndpoint,
    apiVersion: cfg.openaiApiVersion,
    deployment: cfg.openaiDeployment,
    azureADTokenProvider,
  }) as unknown as ResponsesClient;
}

export async function runDemo(prompt: SyntheticPrompt, cfg: Config, client?: ResponsesClient): Promise<DemoResult> {
  if (cfg.aiMode === 'fixture') {
    return { promptId: prompt.id, output: prompt.fixture, mode: 'fixture', label: DEMO_LABEL };
  }
  const c = client ?? createFoundryClient(cfg);
  const body = buildRequest(prompt, cfg.openaiDeployment!);
  if (body.store !== false) throw new Error('store must be false'); // belt and braces
  const res = await c.responses.create(body);
  return { promptId: prompt.id, output: (res.output_text ?? '').trim(), mode: 'foundry', label: DEMO_LABEL };
}
