/**
 * Chatwoot Node Catalog
 *
 * Static definitions for the @renatoascencio/n8n-nodes-chatwoot community nodes.
 * Registers them in the MCP database so they appear in search results and
 * pass workflow validation.
 */

import type { ParsedNode } from '../../parsers/node-parser';
import type { CommunityNodeFields } from '../../database/node-repository';
import type { NodeRepository } from '../../database/node-repository';

const PACKAGE_NAME = '@renatoascencio/n8n-nodes-chatwoot';

const CHATWOOT_RESOURCES = [
  'account', 'agent', 'agentBot', 'auditLog', 'automationRule',
  'cannedResponse', 'contact', 'conversation', 'csatSurvey',
  'customAttribute', 'customFilter', 'helpCenter', 'inbox',
  'integration', 'label', 'message', 'profile', 'report', 'team', 'webhook',
  'platformAccount', 'platformUser', 'accountUser', 'accountAgentBot',
  'publicContact', 'publicConversation', 'publicMessage',
];

const CHATWOOT_TRIGGER_EVENTS = [
  'conversation_created', 'conversation_status_changed', 'conversation_updated',
  'conversation_assignee_changed', 'conversation_team_changed',
  'message_created', 'message_updated',
  'contact_created', 'contact_updated',
  'webwidget_triggered',
];

/**
 * Static catalog entries for both Chatwoot community nodes.
 */
export const CHATWOOT_CATALOG_NODES: Array<ParsedNode & CommunityNodeFields> = [
  // Main node
  {
    style: 'programmatic',
    nodeType: `${PACKAGE_NAME}.chatwoot`,
    displayName: 'Chatwoot',
    description: 'Interact with the Chatwoot API — manage conversations, contacts, messages, teams, and more across Application, Platform, and Public APIs.',
    category: 'Communication',
    packageName: PACKAGE_NAME,
    properties: [
      {
        name: 'resource',
        displayName: 'Resource',
        type: 'options',
        default: 'conversation',
        options: CHATWOOT_RESOURCES.map(r => ({ name: r, value: r })),
      },
    ],
    credentials: [
      { name: 'chatwootApi', required: true },
      { name: 'chatwootPlatformApi', required: false },
      { name: 'chatwootPublicApi', required: false },
    ],
    operations: CHATWOOT_RESOURCES.map(r => ({ resource: r })),
    isAITool: false,
    isTrigger: false,
    isWebhook: false,
    isVersioned: false,
    version: '1',
    isCommunity: true,
    isVerified: false,
    authorName: 'Renato Ascencio',
    authorGithubUrl: 'https://github.com/RenatoAscworkers',
    npmPackageName: PACKAGE_NAME,
  },
  // Trigger node
  {
    style: 'programmatic',
    nodeType: `${PACKAGE_NAME}.chatwootTrigger`,
    displayName: 'Chatwoot Trigger',
    description: 'Starts a workflow when a Chatwoot event occurs — new conversations, messages, contact updates, and more via webhook.',
    category: 'Communication',
    packageName: PACKAGE_NAME,
    properties: [
      {
        name: 'events',
        displayName: 'Events',
        type: 'multiOptions',
        default: [],
        options: CHATWOOT_TRIGGER_EVENTS.map(e => ({ name: e, value: e })),
      },
    ],
    credentials: [
      { name: 'chatwootApi', required: true },
    ],
    operations: [],
    isAITool: false,
    isTrigger: true,
    isWebhook: true,
    isVersioned: false,
    version: '1',
    isCommunity: true,
    isVerified: false,
    authorName: 'Renato Ascencio',
    authorGithubUrl: 'https://github.com/RenatoAscworkers',
    npmPackageName: PACKAGE_NAME,
  },
];

/**
 * Register Chatwoot community nodes in the database.
 * Returns the number of nodes registered.
 */
export function registerChatwootNodes(repository: NodeRepository): number {
  let count = 0;
  for (const node of CHATWOOT_CATALOG_NODES) {
    repository.saveNode(node);
    count++;
  }
  return count;
}
