// Runtime configuration. Everything comes from environment variables; no
// secrets are needed because Azure access uses Entra tokens (managed identity
// in Azure, `az login` locally). See docs/07-azure-prototype-scope.md.

export type AiMode = 'fixture' | 'foundry';

export interface Config {
  port: number;
  /** The Presenter lab endpoint is off unless explicitly enabled. */
  aiDemoEnabled: boolean;
  /** `fixture` returns canned text and never calls Azure. */
  aiMode: AiMode;
  /** e.g. https://<resource>.openai.azure.com — no keys. */
  openaiEndpoint?: string;
  openaiDeployment?: string;
  openaiApiVersion: string;
  appInsightsConnectionString?: string;
  /** Built client to serve in Azure (one web app). */
  staticDir?: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const aiMode: AiMode = env.AI_MODE === 'foundry' ? 'foundry' : 'fixture';
  const cfg: Config = {
    port: Number(env.PORT ?? 8787),
    aiDemoEnabled: env.AI_DEMO_ENABLED === 'true',
    aiMode,
    openaiEndpoint: env.AZURE_OPENAI_ENDPOINT || undefined,
    openaiDeployment: env.AZURE_OPENAI_DEPLOYMENT || undefined,
    // Verify against current Azure docs before deploying (BUILD-LOG).
    openaiApiVersion: env.AZURE_OPENAI_API_VERSION || '2025-04-01-preview',
    appInsightsConnectionString: env.APPLICATIONINSIGHTS_CONNECTION_STRING || undefined,
    staticDir: env.STATIC_DIR || undefined,
  };
  if (cfg.aiMode === 'foundry' && (!cfg.openaiEndpoint || !cfg.openaiDeployment)) {
    throw new Error('AI_MODE=foundry requires AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_DEPLOYMENT');
  }
  return cfg;
}
