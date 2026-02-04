/**
 * Chatwoot Workflow Templates for n8n
 *
 * Ready-to-use workflow JSON templates using @renatoascencio/n8n-nodes-chatwoot.
 * These templates can be imported directly into n8n via the API or UI.
 */

export interface ChatwootWorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'contact-sync' | 'messaging' | 'monitoring' | 'automation';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  requiredCredential: 'chatwootApi' | 'chatwootPlatformApi' | 'chatwootPublicApi';
  workflow: Record<string, unknown>;
}

export const CHATWOOT_WORKFLOW_TEMPLATES: ChatwootWorkflowTemplate[] = [
  // =========================================================================
  // Template 1: List Conversations (Beginner)
  // =========================================================================
  {
    id: 'chatwoot-list-conversations',
    name: 'Chatwoot: List Open Conversations',
    description: 'Fetches all open conversations from Chatwoot on a schedule. Useful for monitoring and reporting.',
    category: 'monitoring',
    difficulty: 'beginner',
    requiredCredential: 'chatwootApi',
    workflow: {
      name: 'Chatwoot - List Open Conversations',
      nodes: [
        {
          parameters: { rule: { interval: [{ field: 'hours', hoursInterval: 1 }] } },
          name: 'Schedule Trigger',
          type: 'n8n-nodes-base.scheduleTrigger',
          typeVersion: 1.2,
          position: [250, 300],
        },
        {
          parameters: {
            resource: 'conversation',
            operation: 'getAll',
            returnAll: false,
            limit: 50,
            filters: { status: 'open' },
          },
          name: 'Get Open Conversations',
          type: '@renatoascencio/n8n-nodes-chatwoot.chatwoot',
          typeVersion: 1,
          position: [470, 300],
          credentials: { chatwootApi: { id: '', name: 'Chatwoot API' } },
        },
      ],
      connections: {
        'Schedule Trigger': { main: [[{ node: 'Get Open Conversations', type: 'main', index: 0 }]] },
      },
    },
  },

  // =========================================================================
  // Template 2: New Contact Sync (Intermediate)
  // =========================================================================
  {
    id: 'chatwoot-contact-sync',
    name: 'Chatwoot: Contact Sync to Google Sheets',
    description: 'When a new contact is created in Chatwoot (via webhook), adds their info to a Google Sheet for CRM tracking.',
    category: 'contact-sync',
    difficulty: 'intermediate',
    requiredCredential: 'chatwootApi',
    workflow: {
      name: 'Chatwoot - Contact Sync to Sheets',
      nodes: [
        {
          parameters: { events: ['contact_created'] },
          name: 'Chatwoot Trigger',
          type: '@renatoascencio/n8n-nodes-chatwoot.chatwootTrigger',
          typeVersion: 1,
          position: [250, 300],
          credentials: { chatwootApi: { id: '', name: 'Chatwoot API' } },
          webhookId: '',
        },
        {
          parameters: {
            mode: 'manual',
            assignments: {
              assignments: [
                { name: 'name', type: 'string', value: '={{ $json.contact?.name || "Unknown" }}' },
                { name: 'email', type: 'string', value: '={{ $json.contact?.email || "" }}' },
                { name: 'phone', type: 'string', value: '={{ $json.contact?.phone_number || "" }}' },
                { name: 'source', type: 'string', value: 'chatwoot' },
                { name: 'created_at', type: 'string', value: '={{ $now.toISO() }}' },
              ],
            },
          },
          name: 'Extract Contact Data',
          type: 'n8n-nodes-base.set',
          typeVersion: 3.4,
          position: [470, 300],
        },
      ],
      connections: {
        'Chatwoot Trigger': { main: [[{ node: 'Extract Contact Data', type: 'main', index: 0 }]] },
      },
    },
  },

  // =========================================================================
  // Template 3: Send Message (Beginner)
  // =========================================================================
  {
    id: 'chatwoot-send-message',
    name: 'Chatwoot: Send Message to Conversation',
    description: 'Sends an outgoing message to a specific Chatwoot conversation. Triggered by webhook or manual input.',
    category: 'messaging',
    difficulty: 'beginner',
    requiredCredential: 'chatwootApi',
    workflow: {
      name: 'Chatwoot - Send Message',
      nodes: [
        {
          parameters: { httpMethod: 'POST', path: 'send-chatwoot-message' },
          name: 'Webhook',
          type: 'n8n-nodes-base.webhook',
          typeVersion: 2,
          position: [250, 300],
        },
        {
          parameters: {
            resource: 'message',
            operation: 'create',
            conversationId: '={{ $json.body.conversation_id }}',
            content: '={{ $json.body.message }}',
            messageType: 'outgoing',
            private: false,
          },
          name: 'Send Message',
          type: '@renatoascencio/n8n-nodes-chatwoot.chatwoot',
          typeVersion: 1,
          position: [470, 300],
          credentials: { chatwootApi: { id: '', name: 'Chatwoot API' } },
        },
        {
          parameters: { respondWith: 'json', responseBody: '={{ JSON.stringify({ success: true }) }}' },
          name: 'Respond',
          type: 'n8n-nodes-base.respondToWebhook',
          typeVersion: 1.1,
          position: [690, 300],
        },
      ],
      connections: {
        Webhook: { main: [[{ node: 'Send Message', type: 'main', index: 0 }]] },
        'Send Message': { main: [[{ node: 'Respond', type: 'main', index: 0 }]] },
      },
    },
  },

  // =========================================================================
  // Template 4: Auto-Assign Conversations (Intermediate)
  // =========================================================================
  {
    id: 'chatwoot-auto-assign',
    name: 'Chatwoot: Auto-Assign New Conversations',
    description: 'Automatically assigns new conversations to available agents based on team or round-robin logic.',
    category: 'automation',
    difficulty: 'intermediate',
    requiredCredential: 'chatwootApi',
    workflow: {
      name: 'Chatwoot - Auto-Assign Conversations',
      nodes: [
        {
          parameters: { events: ['conversation_created'] },
          name: 'Chatwoot Trigger',
          type: '@renatoascencio/n8n-nodes-chatwoot.chatwootTrigger',
          typeVersion: 1,
          position: [250, 300],
          credentials: { chatwootApi: { id: '', name: 'Chatwoot API' } },
        },
        {
          parameters: { resource: 'agent', operation: 'getAll' },
          name: 'Get Available Agents',
          type: '@renatoascencio/n8n-nodes-chatwoot.chatwoot',
          typeVersion: 1,
          position: [470, 300],
          credentials: { chatwootApi: { id: '', name: 'Chatwoot API' } },
        },
        {
          parameters: {
            jsCode: `// Filter to online agents and pick one randomly
const agents = $input.all().filter(a => a.json.availability_status === 'available');
if (agents.length === 0) return [{ json: { agent_id: null } }];
const selected = agents[Math.floor(Math.random() * agents.length)];
return [{ json: { agent_id: selected.json.id } }];`,
          },
          name: 'Select Agent',
          type: 'n8n-nodes-base.code',
          typeVersion: 2,
          position: [690, 300],
        },
        {
          parameters: {
            resource: 'conversation',
            operation: 'assign',
            conversationId: '={{ $("Chatwoot Trigger").item.json.conversation?.id }}',
            assigneeId: '={{ $json.agent_id }}',
          },
          name: 'Assign Conversation',
          type: '@renatoascencio/n8n-nodes-chatwoot.chatwoot',
          typeVersion: 1,
          position: [910, 300],
          credentials: { chatwootApi: { id: '', name: 'Chatwoot API' } },
        },
      ],
      connections: {
        'Chatwoot Trigger': { main: [[{ node: 'Get Available Agents', type: 'main', index: 0 }]] },
        'Get Available Agents': { main: [[{ node: 'Select Agent', type: 'main', index: 0 }]] },
        'Select Agent': { main: [[{ node: 'Assign Conversation', type: 'main', index: 0 }]] },
      },
    },
  },

  // =========================================================================
  // Template 5: Public API - Widget Contact (Beginner)
  // =========================================================================
  {
    id: 'chatwoot-public-contact',
    name: 'Chatwoot: Create Contact via Public API',
    description: 'Creates a contact and conversation through the Public API, simulating a website widget interaction.',
    category: 'messaging',
    difficulty: 'beginner',
    requiredCredential: 'chatwootPublicApi',
    workflow: {
      name: 'Chatwoot - Public API Contact',
      nodes: [
        {
          parameters: { httpMethod: 'POST', path: 'chatwoot-public-contact' },
          name: 'Webhook',
          type: 'n8n-nodes-base.webhook',
          typeVersion: 2,
          position: [250, 300],
        },
        {
          parameters: {
            resource: 'publicContact',
            operation: 'create',
            name: '={{ $json.body.name }}',
            email: '={{ $json.body.email }}',
          },
          name: 'Create Public Contact',
          type: '@renatoascencio/n8n-nodes-chatwoot.chatwoot',
          typeVersion: 1,
          position: [470, 300],
          credentials: { chatwootPublicApi: { id: '', name: 'Chatwoot Public API' } },
        },
        {
          parameters: {
            resource: 'publicConversation',
            operation: 'create',
            contactIdentifier: '={{ $json.source_id }}',
          },
          name: 'Create Conversation',
          type: '@renatoascencio/n8n-nodes-chatwoot.chatwoot',
          typeVersion: 1,
          position: [690, 300],
          credentials: { chatwootPublicApi: { id: '', name: 'Chatwoot Public API' } },
        },
      ],
      connections: {
        Webhook: { main: [[{ node: 'Create Public Contact', type: 'main', index: 0 }]] },
        'Create Public Contact': { main: [[{ node: 'Create Conversation', type: 'main', index: 0 }]] },
      },
    },
  },
];
