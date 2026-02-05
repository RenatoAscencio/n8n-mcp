import { ToolDefinition } from '../types';

/**
 * Chatwoot Integration Tools
 *
 * Diagnostic tools for the Chatwoot integration module.
 * Always available (not gated by n8n API configuration).
 */
export const chatwootTools: ToolDefinition[] = [
  {
    name: 'chatwoot_doctor',
    description: `Diagnose Chatwoot integration health. Checks: MCP server version, Docker detection, n8n API connectivity, Chatwoot node installation, credential configuration, template availability. Optionally tests Chatwoot API connectivity if baseUrl/token provided. No secrets in output.`,
    inputSchema: {
      type: 'object',
      properties: {
        chatwootBaseUrl: {
          type: 'string',
          description: 'Optional: Chatwoot instance URL to test connectivity (e.g., https://app.chatwoot.com)',
        },
        chatwootAccountId: {
          type: 'string',
          description: 'Optional: Chatwoot account ID for Application API test',
        },
        chatwootToken: {
          type: 'string',
          description: 'Optional: Chatwoot API token for connectivity test (will be masked in output)',
        },
        verbose: {
          type: 'boolean',
          description: 'Include extended debug information (default: false)',
        },
      },
    },
    annotations: {
      title: 'Chatwoot Doctor',
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
];
