/**
 * Chatwoot Integration for n8n-MCP
 *
 * Main integration module that provides:
 * - Node detection (is @renatoascencio/n8n-nodes-chatwoot installed?)
 * - Workflow template generation
 * - Connection validation
 * - Installation guidance
 */

import { CHATWOOT_WORKFLOW_TEMPLATES, ChatwootWorkflowTemplate } from './workflow-templates';
import { ChatwootConnectionValidator, ConnectionTestResult } from './connection-validator';

export interface ChatwootConfig {
  baseUrl?: string;
  accountId?: string | number;
  token?: string;
  platformToken?: string;
  inboxIdentifier?: string;
}

export class ChatwootIntegration {
  private static readonly PACKAGE_NAME = '@renatoascencio/n8n-nodes-chatwoot';
  private static readonly NODE_TYPE = '@renatoascencio/n8n-nodes-chatwoot.chatwoot';
  private static readonly TRIGGER_TYPE = '@renatoascencio/n8n-nodes-chatwoot.chatwootTrigger';

  /**
   * Get installation instructions for the Chatwoot community node
   */
  static getInstallationGuide(): string {
    return `
## Installing the Chatwoot Community Node

### Option 1: n8n UI (Recommended)
1. Go to **Settings > Community Nodes** in your n8n instance
2. Click **Install**
3. Enter: \`${this.PACKAGE_NAME}\`
4. Accept the risks and click **Install**

### Option 2: CLI
\`\`\`bash
# For self-hosted n8n
cd ~/.n8n/nodes
npm install ${this.PACKAGE_NAME}
# Restart n8n
\`\`\`

### Option 3: Docker
Add to your \`docker-compose.yml\`:
\`\`\`yaml
environment:
  - N8N_CUSTOM_EXTENSIONS=${this.PACKAGE_NAME}
\`\`\`

### After Installation
Configure credentials in n8n:
1. **Chatwoot API** - For most operations (conversations, contacts, messages, etc.)
   - Base URL: Your Chatwoot instance URL
   - Account ID: Your account number
   - API Access Token: From Chatwoot Profile Settings

2. **Chatwoot Platform API** (optional) - For super admin operations
   - Base URL: Your Chatwoot instance URL
   - Platform Token: From super admin panel

3. **Chatwoot Public API** (optional) - For widget/external integrations
   - Base URL: Your Chatwoot instance URL
   - Inbox Identifier: From inbox settings
`.trim();
  }

  /**
   * List all available workflow templates
   */
  static listTemplates(): { id: string; name: string; description: string; category: string; difficulty: string }[] {
    return CHATWOOT_WORKFLOW_TEMPLATES.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      category: t.category,
      difficulty: t.difficulty,
    }));
  }

  /**
   * Get a specific workflow template by ID
   */
  static getTemplate(templateId: string): ChatwootWorkflowTemplate | undefined {
    return CHATWOOT_WORKFLOW_TEMPLATES.find((t) => t.id === templateId);
  }

  /**
   * Get all templates for a specific category
   */
  static getTemplatesByCategory(category: string): ChatwootWorkflowTemplate[] {
    return CHATWOOT_WORKFLOW_TEMPLATES.filter((t) => t.category === category);
  }

  /**
   * Validate connection to Chatwoot
   */
  static async validateConnection(config: ChatwootConfig): Promise<ConnectionTestResult[]> {
    if (!config.baseUrl) {
      return [{ success: false, apiType: 'application', message: 'baseUrl is required' }];
    }

    return ChatwootConnectionValidator.testAll({
      baseUrl: config.baseUrl,
      accountId: config.accountId,
      token: config.token,
      platformToken: config.platformToken,
    });
  }

  /**
   * Check if the Chatwoot node is referenced in a workflow
   */
  static isUsedInWorkflow(workflow: Record<string, unknown>): boolean {
    const nodes = workflow.nodes as Array<Record<string, unknown>> | undefined;
    if (!Array.isArray(nodes)) return false;

    return nodes.some(
      (node) =>
        (node.type as string)?.includes('chatwoot') ||
        (node.type as string)?.includes('n8n-nodes-chatwoot'),
    );
  }

  /**
   * Get the Chatwoot node type strings for use in n8n
   */
  static getNodeTypes(): { main: string; trigger: string } {
    return {
      main: this.NODE_TYPE,
      trigger: this.TRIGGER_TYPE,
    };
  }

  /**
   * Get the npm package name
   */
  static getPackageName(): string {
    return this.PACKAGE_NAME;
  }

  /**
   * Get a summary of Chatwoot node capabilities
   */
  static getCapabilitiesSummary(): string {
    return `
## Chatwoot Node Capabilities

**Package:** ${this.PACKAGE_NAME}
**Resources:** 27 | **Operations:** 130+ | **API Types:** 3

### Application API (20 resources)
Account, Agent, Agent Bot, Audit Log, Automation Rule, Canned Response,
Contact, Conversation, CSAT Survey, Custom Attribute, Custom Filter,
Help Center, Inbox, Integration, Label, Message, Profile, Report, Team, Webhook

### Platform API (4 resources)
Platform Account, Platform User, Account User, Account Agent Bot

### Public API (3 resources)
Public Contact, Public Conversation, Public Message

### Key Features
- Real-time webhook trigger node
- Dynamic dropdown selectors (agents, teams, inboxes, labels)
- Smart pagination (page-based + cursor-based)
- 3 credential types for different access levels
- Detailed error messages for all HTTP error codes
`.trim();
  }
}
