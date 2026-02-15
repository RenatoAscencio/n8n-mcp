import { describe, it, expect, vi } from 'vitest';
import { CHATWOOT_CATALOG_NODES, registerChatwootNodes } from '@/integrations/chatwoot/chatwoot-node-catalog';

describe('Chatwoot Node Catalog', () => {
  describe('CHATWOOT_CATALOG_NODES', () => {
    it('should contain exactly 2 nodes', () => {
      expect(CHATWOOT_CATALOG_NODES).toHaveLength(2);
    });

    it('should define the main Chatwoot node correctly', () => {
      const main = CHATWOOT_CATALOG_NODES.find(n => n.nodeType.endsWith('.chatwoot'));
      expect(main).toBeDefined();
      expect(main!.displayName).toBe('Chatwoot');
      expect(main!.isCommunity).toBe(true);
      expect(main!.isTrigger).toBe(false);
      expect(main!.isWebhook).toBe(false);
      expect(main!.style).toBe('programmatic');
      expect(main!.category).toBe('Communication');
      expect(main!.npmPackageName).toBe('@renatoascencio/n8n-nodes-chatwoot');
      expect(main!.credentials).toHaveLength(3);
    });

    it('should define the trigger node correctly', () => {
      const trigger = CHATWOOT_CATALOG_NODES.find(n => n.nodeType.endsWith('.chatwootTrigger'));
      expect(trigger).toBeDefined();
      expect(trigger!.displayName).toBe('Chatwoot Trigger');
      expect(trigger!.isCommunity).toBe(true);
      expect(trigger!.isTrigger).toBe(true);
      expect(trigger!.isWebhook).toBe(true);
      expect(trigger!.credentials).toHaveLength(1);
    });

    it('should include resource options in main node properties', () => {
      const main = CHATWOOT_CATALOG_NODES.find(n => n.nodeType.endsWith('.chatwoot'));
      const resourceProp = main!.properties.find((p: any) => p.name === 'resource');
      expect(resourceProp).toBeDefined();
      expect(resourceProp.options.length).toBeGreaterThanOrEqual(27);
    });

    it('should include event options in trigger node properties', () => {
      const trigger = CHATWOOT_CATALOG_NODES.find(n => n.nodeType.endsWith('.chatwootTrigger'));
      const eventsProp = trigger!.properties.find((p: any) => p.name === 'events');
      expect(eventsProp).toBeDefined();
      expect(eventsProp.options.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('registerChatwootNodes', () => {
    it('should call saveNode for each catalog entry and return count', () => {
      const mockRepository = {
        saveNode: vi.fn(),
      };

      const count = registerChatwootNodes(mockRepository as any);

      expect(count).toBe(2);
      expect(mockRepository.saveNode).toHaveBeenCalledTimes(2);
    });

    it('should pass full node definitions to saveNode', () => {
      const mockRepository = {
        saveNode: vi.fn(),
      };

      registerChatwootNodes(mockRepository as any);

      const firstCall = mockRepository.saveNode.mock.calls[0][0];
      expect(firstCall.nodeType).toContain('chatwoot');
      expect(firstCall.isCommunity).toBe(true);
      expect(firstCall.packageName).toBe('@renatoascencio/n8n-nodes-chatwoot');
    });
  });
});
