"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatwootIntegration = void 0;
const workflow_templates_1 = require("./workflow-templates");
const connection_validator_1 = require("./connection-validator");
class ChatwootIntegration {
    static getInstallationGuide() {
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
    static listTemplates() {
        return workflow_templates_1.CHATWOOT_WORKFLOW_TEMPLATES.map((t) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            category: t.category,
            difficulty: t.difficulty,
        }));
    }
    static getTemplate(templateId) {
        return workflow_templates_1.CHATWOOT_WORKFLOW_TEMPLATES.find((t) => t.id === templateId);
    }
    static getTemplatesByCategory(category) {
        return workflow_templates_1.CHATWOOT_WORKFLOW_TEMPLATES.filter((t) => t.category === category);
    }
    static async validateConnection(config) {
        if (!config.baseUrl) {
            return [{ success: false, apiType: 'application', message: 'baseUrl is required' }];
        }
        return connection_validator_1.ChatwootConnectionValidator.testAll({
            baseUrl: config.baseUrl,
            accountId: config.accountId,
            token: config.token,
            platformToken: config.platformToken,
        });
    }
    static isUsedInWorkflow(workflow) {
        const nodes = workflow.nodes;
        if (!Array.isArray(nodes))
            return false;
        return nodes.some((node) => node.type?.includes('chatwoot') ||
            node.type?.includes('n8n-nodes-chatwoot'));
    }
    static getNodeTypes() {
        return {
            main: this.NODE_TYPE,
            trigger: this.TRIGGER_TYPE,
        };
    }
    static getPackageName() {
        return this.PACKAGE_NAME;
    }
    static getCapabilitiesSummary() {
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
exports.ChatwootIntegration = ChatwootIntegration;
ChatwootIntegration.PACKAGE_NAME = '@renatoascencio/n8n-nodes-chatwoot';
ChatwootIntegration.NODE_TYPE = '@renatoascencio/n8n-nodes-chatwoot.chatwoot';
ChatwootIntegration.TRIGGER_TYPE = '@renatoascencio/n8n-nodes-chatwoot.chatwootTrigger';
//# sourceMappingURL=chatwoot-integration.js.map