/**
 * ADFS/OAuth Configuration
 *
 * Placeholder for ADFS integration.
 * Real implementation would use redirect-based OAuth/OIDC flow.
 *
 * IMPORTANT: No client secrets should be stored in frontend code.
 * Real ADFS integration should use server-side redirect handlers.
 */

export interface AdfsConfig {
  provider: 'adfs' | 'oidc' | 'mock';
  authority?: string;  // ADFS/IDP authority URL
  clientId?: string;    // OAuth client ID (public, no secret)
  redirectUri?: string; // OAuth redirect URI
}

/**
 * ADFS Configuration for production use
 * These values should come from environment variables
 */
export const ADFs_CONFIG: AdfsConfig = {
  provider: 'mock', // Set to 'adfs' or 'oidc' when real ADFS is configured
};

/**
 * Mock ADFS login for development/demo
 * In production, this would redirect to real ADFS
 */
export function mockAdfsLogin(): void {
  console.log('[ADFS Mock] Simulating ADFS login redirect...');

  // In production, this would be:
  // window.location.href = `${authority}/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;

  // For demo, we'll simulate a successful ADFS login
  setTimeout(() => {
    const mockUser = {
      id: 'adfs-user-001',
      username: 'adfs_staff',
      email: 'staff@tonghua.org',
      role: 'admin' as const,
      provider: 'adfs',
    };

    // Dispatch custom event for login handler
    window.dispatchEvent(new CustomEvent('adfs-mock-login', {
      detail: { user: mockUser }
    }));
  }, 500);
}

/**
 * Check if ADFS is configured
 */
export function isAdfsConfigured(): boolean {
  return ADFs_CONFIG.provider !== 'mock' &&
    !!ADFs_CONFIG.authority &&
    !!ADFs_CONFIG.clientId;
}

/**
 * Initiate ADFS login flow
 */
export function loginWithAdfs(): void {
  if (!isAdfsConfigured()) {
    mockAdfsLogin();
    return;
  }

  const { authority, clientId, redirectUri } = ADFs_CONFIG;
  const params = new URLSearchParams({
    client_id: clientId!,
    redirect_uri: redirectUri || window.location.origin + '/auth/callback',
    response_type: 'code',
    scope: 'openid profile email',
    state: crypto.randomUUID(),
  });

  window.location.href = `${authority}/oauth2/authorize?${params.toString()}`;
}

/**
 * Get login button label based on config
 */
export function getAdfsButtonLabel(): string {
  if (isAdfsConfigured()) {
    return 'Continue with ADFS';
  }
  return 'Continue with ADFS (Demo)';
}
