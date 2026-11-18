// Sign-in boundary (D-018, docs/07-azure-prototype-scope.md).
//
// Real sign-in is a required feature, but Entra External ID isn't configured
// yet (Q-013). Until it is, only the clearly labelled mock provider is active,
// and the app never collects credentials itself.
//
// To enable Entra later: set the VITE_ENTRA_* values at build time, add
// @azure/msal-browser, and implement signIn() with loginRedirect against the
// External ID authority. Consent (D-040/D-041) still runs after sign-in.

export interface AuthProvider {
  kind: 'mock' | 'entra-external-id';
  /** Shown on the sign-in screen. Must never imply a real account for the mock. */
  label: string;
  isReal: boolean;
  signIn(): Promise<void>;
}

interface EntraConfig {
  tenantSubdomain: string; // <tenant>.ciamlogin.com
  clientId: string;
  redirectUri: string;
}

function readEntraConfig(): EntraConfig | null {
  const env = import.meta.env;
  const tenantSubdomain = env.VITE_ENTRA_TENANT_SUBDOMAIN as string | undefined;
  const clientId = env.VITE_ENTRA_CLIENT_ID as string | undefined;
  if (!tenantSubdomain || !clientId) return null;
  return { tenantSubdomain, clientId, redirectUri: window.location.origin };
}

const mockProvider: AuthProvider = {
  kind: 'mock',
  label: 'Demo sign-in — no account is created',
  isReal: false,
  async signIn() {
    /* no-op: nothing is collected or created */
  },
};

function entraProvider(cfg: EntraConfig): AuthProvider {
  return {
    kind: 'entra-external-id',
    label: `Sign in with ${cfg.tenantSubdomain}.ciamlogin.com`,
    isReal: true,
    async signIn() {
      throw new Error('Entra External ID sign-in is not implemented yet (Q-013).');
    },
  };
}

export function getAuthProvider(): AuthProvider {
  const cfg = readEntraConfig();
  // Until the Entra flow is implemented and reviewed, always fall back to the mock.
  if (cfg && import.meta.env.VITE_ENTRA_ENABLED === 'true') return entraProvider(cfg);
  return mockProvider;
}
