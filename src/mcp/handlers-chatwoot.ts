/**
 * Chatwoot MCP Tool Handlers
 *
 * Implements the chatwoot_doctor diagnostic tool that validates
 * the full Chatwoot integration stack: MCP server, n8n API,
 * Chatwoot node installation, credentials, and templates.
 */

import { McpToolResponse } from '../types/n8n-api';
import { InstanceContext } from '../types/instance-context';
import { ChatwootIntegration } from '../integrations/chatwoot';
import { ChatwootConnectionValidator } from '../integrations/chatwoot';
import { getN8nApiConfig } from '../config/n8n-api';
import { PROJECT_VERSION } from '../utils/version';
import { logger } from '../utils/logger';

interface ChatwootDoctorArgs {
  chatwootBaseUrl?: string;
  chatwootAccountId?: string;
  chatwootToken?: string;
  verbose?: boolean;
}

export async function handleChatwootDoctor(
  args: ChatwootDoctorArgs,
  context?: InstanceContext,
): Promise<McpToolResponse> {
  const startTime = Date.now();
  const report: Record<string, unknown> = {};

  // 1. MCP Server Info
  report.server = {
    version: PROJECT_VERSION,
    isDocker: process.env.IS_DOCKER === 'true',
    mcpMode: process.env.MCP_MODE || 'stdio',
    nodeVersion: process.version,
    platform: process.platform,
    timestamp: new Date().toISOString(),
  };

  // 2. n8n API Connectivity
  const apiConfig = getN8nApiConfig();
  const n8nApiStatus: Record<string, unknown> = {
    configured: apiConfig !== null,
    baseUrl: apiConfig?.baseUrl ?? null,
  };

  if (apiConfig) {
    try {
      const { getN8nApiClient } = await import('./handlers-n8n-manager');
      const client = getN8nApiClient(context);
      if (client) {
        const health = await client.healthCheck();
        n8nApiStatus.connected = true;
        n8nApiStatus.n8nVersion = health.n8nVersion || 'unknown';
      } else {
        n8nApiStatus.connected = false;
        n8nApiStatus.error = 'Could not create API client';
      }
    } catch (error) {
      n8nApiStatus.connected = false;
      n8nApiStatus.error = sanitizeErrorMessage(error);
    }
  }
  report.n8nApi = n8nApiStatus;

  // 3. Chatwoot Node Installation (credentials check via n8n API)
  const nodeInstallation: Record<string, unknown> = {
    packageName: ChatwootIntegration.getPackageName(),
    checked: false,
  };

  if (apiConfig && n8nApiStatus.connected) {
    try {
      const { getN8nApiClient } = await import('./handlers-n8n-manager');
      const client = getN8nApiClient(context);
      if (client) {
        const credResponse = await client.listCredentials();
        const chatwootCreds = credResponse.data.filter(
          (c) =>
            c.type === 'chatwootApi' ||
            c.type === 'chatwootPlatformApi' ||
            c.type === 'chatwootPublicApi',
        );
        nodeInstallation.checked = true;
        nodeInstallation.credentialsFound = chatwootCreds.length;
        nodeInstallation.credentialTypes = chatwootCreds.map((c) => ({
          name: c.name,
          type: c.type,
        }));
      }
    } catch (error) {
      nodeInstallation.checked = true;
      nodeInstallation.error = sanitizeErrorMessage(error);
    }
  }
  report.chatwootNode = nodeInstallation;

  // 4. Template Availability
  const templates = ChatwootIntegration.listTemplates();
  report.templates = {
    available: templates.length,
    expected: 5,
    healthy: templates.length === 5,
    list: templates.map((t) => ({ id: t.id, name: t.name, category: t.category })),
  };

  // 5. Chatwoot API Connectivity (optional)
  if (args.chatwootBaseUrl) {
    const chatwootApi: Record<string, unknown> = {
      baseUrl: args.chatwootBaseUrl,
      tokenProvided: !!args.chatwootToken,
      accountIdProvided: !!args.chatwootAccountId,
    };

    if (args.chatwootToken && args.chatwootAccountId) {
      try {
        const result = await ChatwootConnectionValidator.testApplicationApi(
          args.chatwootBaseUrl,
          args.chatwootAccountId,
          args.chatwootToken,
        );
        chatwootApi.applicationApi = {
          success: result.success,
          message: result.message,
          ...(result.details ? { status: result.details.status } : {}),
        };
      } catch (error) {
        chatwootApi.applicationApi = {
          success: false,
          message: sanitizeErrorMessage(error),
        };
      }
    } else if (args.chatwootToken) {
      chatwootApi.note =
        'Provide both chatwootAccountId and chatwootToken to test Application API';
    }

    report.chatwootApi = chatwootApi;
  }

  // 6. Summary
  const issues: string[] = [];
  if (!apiConfig) issues.push('n8n API not configured (N8N_API_URL/N8N_API_KEY missing)');
  if (apiConfig && !n8nApiStatus.connected)
    issues.push('n8n API configured but not reachable');
  if (
    nodeInstallation.checked &&
    (nodeInstallation.credentialsFound as number) === 0
  ) {
    issues.push('No Chatwoot credentials found in n8n instance');
  }
  if (templates.length !== 5) {
    issues.push(`Expected 5 templates, found ${templates.length}`);
  }

  report.summary = {
    healthy: issues.length === 0,
    issueCount: issues.length,
    issues,
    responseTimeMs: Date.now() - startTime,
  };

  // Verbose debug
  if (args.verbose) {
    report.debug = {
      envKeys: Object.keys(process.env).filter(
        (k) =>
          k.startsWith('N8N_') ||
          k.startsWith('MCP_') ||
          k.startsWith('CHATWOOT_') ||
          k === 'IS_DOCKER',
      ),
      chatwootCapabilities: ChatwootIntegration.getCapabilitiesSummary(),
    };
  }

  logger.info('chatwoot_doctor completed', {
    healthy: issues.length === 0,
    issueCount: issues.length,
    responseTimeMs: Date.now() - startTime,
  });

  return { success: true, data: report };
}

/** Sanitize error messages to prevent secret leakage */
function sanitizeErrorMessage(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  return msg
    .replace(/api_access_token[=:]\s*\S+/gi, 'api_access_token=***')
    .replace(/token[=:]\s*[A-Za-z0-9_\-]{20,}/gi, 'token=***')
    .replace(/key[=:]\s*[A-Za-z0-9_\-]{20,}/gi, 'key=***')
    .replace(/Bearer\s+\S+/gi, 'Bearer ***');
}
