import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../src/config/n8n-api', () => ({
  getN8nApiConfig: vi.fn(),
  isN8nApiConfigured: vi.fn(),
}));

vi.mock('../src/utils/version', () => ({
  PROJECT_VERSION: '2.33.5-test',
}));

vi.mock('../src/integrations/chatwoot', () => ({
  ChatwootIntegration: {
    getPackageName: () => '@renatoascencio/n8n-nodes-chatwoot',
    listTemplates: () => [
      { id: 'chatwoot-list-open-conversations', name: 'List Open Conversations', description: 'd1', category: 'monitoring', difficulty: 'beginner' },
      { id: 'chatwoot-contact-sync-sheets', name: 'Contact Sync to Sheets', description: 'd2', category: 'contact-sync', difficulty: 'beginner' },
      { id: 'chatwoot-send-message', name: 'Send Message', description: 'd3', category: 'messaging', difficulty: 'beginner' },
      { id: 'chatwoot-auto-assign', name: 'Auto-Assign Conversations', description: 'd4', category: 'automation', difficulty: 'intermediate' },
      { id: 'chatwoot-public-contact', name: 'Public API Contact', description: 'd5', category: 'public-api', difficulty: 'beginner' },
    ],
    getCapabilitiesSummary: () => 'Chatwoot: 27 resources, 130+ operations',
  },
  ChatwootConnectionValidator: {
    testApplicationApi: vi.fn(),
  },
}));

vi.mock('../src/mcp/handlers-n8n-manager', () => ({
  getN8nApiClient: vi.fn(),
}));

import { handleChatwootDoctor } from '../src/mcp/handlers-chatwoot';
import { getN8nApiConfig } from '../src/config/n8n-api';
import { getN8nApiClient } from '../src/mcp/handlers-n8n-manager';
import { ChatwootConnectionValidator } from '../src/integrations/chatwoot';

describe('handleChatwootDoctor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns server info and template status without n8n API', async () => {
    vi.mocked(getN8nApiConfig).mockReturnValue(null);

    const result = await handleChatwootDoctor({});

    expect(result.success).toBe(true);
    const data = result.data as Record<string, any>;

    // Server info
    expect(data.server.version).toBe('2.33.5-test');
    expect(data.server).toHaveProperty('platform');
    expect(data.server).toHaveProperty('nodeVersion');

    // n8n API not configured
    expect(data.n8nApi.configured).toBe(false);

    // Templates
    expect(data.templates.available).toBe(5);
    expect(data.templates.expected).toBe(5);
    expect(data.templates.healthy).toBe(true);

    // Summary should report n8n issue
    expect(data.summary.healthy).toBe(false);
    expect(data.summary.issues).toContain('n8n API not configured (N8N_API_URL/N8N_API_KEY missing)');
  });

  it('checks n8n API connectivity when configured', async () => {
    vi.mocked(getN8nApiConfig).mockReturnValue({
      baseUrl: 'https://n8n.example.com',
      apiKey: 'test-key',
      timeout: 30000,
      maxRetries: 3,
    });
    vi.mocked(getN8nApiClient).mockReturnValue({
      healthCheck: vi.fn().mockResolvedValue({ n8nVersion: '1.40.0' }),
      listCredentials: vi.fn().mockResolvedValue({
        data: [
          { name: 'My Chatwoot', type: 'chatwootApi' },
          { name: 'Other', type: 'googleApi' },
        ],
      }),
    } as any);

    const result = await handleChatwootDoctor({});
    const data = result.data as Record<string, any>;

    expect(data.n8nApi.configured).toBe(true);
    expect(data.n8nApi.connected).toBe(true);
    expect(data.n8nApi.n8nVersion).toBe('1.40.0');
    // API key must NOT appear
    expect(JSON.stringify(data)).not.toContain('test-key');

    expect(data.chatwootNode.checked).toBe(true);
    expect(data.chatwootNode.credentialsFound).toBe(1);
    expect(data.chatwootNode.credentialTypes).toEqual([
      { name: 'My Chatwoot', type: 'chatwootApi' },
    ]);

    expect(data.summary.healthy).toBe(true);
  });

  it('reports unreachable n8n API', async () => {
    vi.mocked(getN8nApiConfig).mockReturnValue({
      baseUrl: 'https://n8n.example.com',
      apiKey: 'test-key',
      timeout: 30000,
      maxRetries: 3,
    });
    vi.mocked(getN8nApiClient).mockReturnValue({
      healthCheck: vi.fn().mockRejectedValue(new Error('ECONNREFUSED')),
    } as any);

    const result = await handleChatwootDoctor({});
    const data = result.data as Record<string, any>;

    expect(data.n8nApi.connected).toBe(false);
    expect(data.n8nApi.error).toBeDefined();
    expect(data.summary.issues).toContain('n8n API configured but not reachable');
  });

  it('tests Chatwoot API when baseUrl and token provided', async () => {
    vi.mocked(getN8nApiConfig).mockReturnValue(null);
    vi.mocked(ChatwootConnectionValidator.testApplicationApi).mockResolvedValue({
      success: true,
      apiType: 'application',
      message: 'Application API connection successful',
      details: { status: 200 },
    });

    const result = await handleChatwootDoctor({
      chatwootBaseUrl: 'https://chatwoot.example.com',
      chatwootAccountId: '1',
      chatwootToken: 'secret-token-value',
    });
    const data = result.data as Record<string, any>;

    expect(data.chatwootApi).toBeDefined();
    expect(data.chatwootApi.applicationApi.success).toBe(true);
    // Token must NOT appear in output
    expect(JSON.stringify(data)).not.toContain('secret-token-value');
  });

  it('includes debug info in verbose mode', async () => {
    vi.mocked(getN8nApiConfig).mockReturnValue(null);

    const result = await handleChatwootDoctor({ verbose: true });
    const data = result.data as Record<string, any>;

    expect(data.debug).toBeDefined();
    expect(data.debug.chatwootCapabilities).toContain('27 resources');
  });

  it('sanitizes error messages containing tokens', async () => {
    vi.mocked(getN8nApiConfig).mockReturnValue({
      baseUrl: 'https://n8n.example.com',
      apiKey: 'test-key',
      timeout: 30000,
      maxRetries: 3,
    });
    vi.mocked(getN8nApiClient).mockReturnValue({
      healthCheck: vi.fn().mockRejectedValue(
        new Error('api_access_token: abc123def456ghi789jklmnop request failed'),
      ),
    } as any);

    const result = await handleChatwootDoctor({});
    const data = result.data as Record<string, any>;

    // Raw token must not be in output
    expect(data.n8nApi.error).not.toContain('abc123def456ghi789jklmnop');
    expect(data.n8nApi.error).toContain('***');
  });

  it('reports missing credentials when n8n connected but no chatwoot creds', async () => {
    vi.mocked(getN8nApiConfig).mockReturnValue({
      baseUrl: 'https://n8n.example.com',
      apiKey: 'test-key',
      timeout: 30000,
      maxRetries: 3,
    });
    vi.mocked(getN8nApiClient).mockReturnValue({
      healthCheck: vi.fn().mockResolvedValue({ n8nVersion: '1.40.0' }),
      listCredentials: vi.fn().mockResolvedValue({
        data: [{ name: 'Google', type: 'googleApi' }],
      }),
    } as any);

    const result = await handleChatwootDoctor({});
    const data = result.data as Record<string, any>;

    expect(data.chatwootNode.credentialsFound).toBe(0);
    expect(data.summary.issues).toContain('No Chatwoot credentials found in n8n instance');
  });
});
