import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the rest client so tests don't hit the network or filesystem
vi.mock('@/services/n8n-rest-client', () => ({
  n8nRestLogin: vi.fn(),
  n8nRestCreateFolder: vi.fn(),
  n8nRestMoveWorkflow: vi.fn(),
}));

vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import {
  handleN8nLogin,
  handleN8nCreateFolder,
  handleN8nMoveWorkflow,
} from '@/mcp/handlers-n8n-rest';
import * as restClient from '@/services/n8n-rest-client';

describe('n8n REST handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.ENABLE_MULTI_TENANT;
  });

  describe('handleN8nLogin', () => {
    it('returns success with cookie path on valid input', async () => {
      (restClient.n8nRestLogin as any).mockResolvedValue({
        baseUrl: 'https://n8n.example.com',
        cookiePath: '/tmp/cookie.json',
      });

      const result: any = await handleN8nLogin({
        baseUrl: 'https://n8n.example.com',
        email: 'user@example.com',
        password: 'secret',
      });

      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('cookiePath');
      expect(result.content[0].text).toContain('Logged in');
    });

    it('rejects invalid baseUrl', async () => {
      const result: any = await handleN8nLogin({
        baseUrl: 'not-a-url',
        email: 'a@b.com',
        password: 'x',
      });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toMatch(/Invalid input/);
    });

    it('refuses when ENABLE_MULTI_TENANT=true', async () => {
      process.env.ENABLE_MULTI_TENANT = 'true';
      const result: any = await handleN8nLogin({
        baseUrl: 'https://n8n.example.com',
        email: 'a@b.com',
        password: 'x',
      });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toMatch(/multi-tenant/);
    });

    it('returns error message when login throws', async () => {
      (restClient.n8nRestLogin as any).mockRejectedValue(new Error('HTTP 401'));
      const result: any = await handleN8nLogin({
        baseUrl: 'https://n8n.example.com',
        email: 'a@b.com',
        password: 'x',
      });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('HTTP 401');
    });

    it('accepts mfaCode and forwards it to the rest client', async () => {
      (restClient.n8nRestLogin as any).mockResolvedValue({
        baseUrl: 'https://n8n.example.com',
        cookiePath: '/tmp/cookie.json',
      });

      const result: any = await handleN8nLogin({
        baseUrl: 'https://n8n.example.com',
        email: 'user@example.com',
        password: 'secret',
        mfaCode: '123456',
      });

      expect(result.isError).toBeFalsy();
      expect(restClient.n8nRestLogin).toHaveBeenCalledWith(
        expect.objectContaining({ mfaCode: '123456' })
      );
    });

    it('rejects malformed mfaCode (not 6 digits)', async () => {
      const result: any = await handleN8nLogin({
        baseUrl: 'https://n8n.example.com',
        email: 'user@example.com',
        password: 'secret',
        mfaCode: 'abcdef',
      });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toMatch(/Invalid input/);
    });
  });

  describe('handleN8nCreateFolder', () => {
    it('returns the created folder on success', async () => {
      (restClient.n8nRestCreateFolder as any).mockResolvedValue({ id: 'folder-1', name: 'Marketing' });
      const result: any = await handleN8nCreateFolder({
        baseUrl: 'https://n8n.example.com',
        projectId: 'project-1',
        name: 'Marketing',
      });
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('folder-1');
    });

    it('rejects missing projectId', async () => {
      const result: any = await handleN8nCreateFolder({
        baseUrl: 'https://n8n.example.com',
        name: 'Marketing',
      });
      expect(result.isError).toBe(true);
    });
  });

  describe('handleN8nMoveWorkflow', () => {
    it('returns the moved workflow on success', async () => {
      (restClient.n8nRestMoveWorkflow as any).mockResolvedValue({ id: 'wf-1', parentFolderId: 'f-1' });
      const result: any = await handleN8nMoveWorkflow({
        baseUrl: 'https://n8n.example.com',
        workflowId: 'wf-1',
        parentFolderId: 'f-1',
      });
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('wf-1');
    });

    it('accepts null parentFolderId (move to root)', async () => {
      (restClient.n8nRestMoveWorkflow as any).mockResolvedValue({ id: 'wf-1', parentFolderId: null });
      const result: any = await handleN8nMoveWorkflow({
        baseUrl: 'https://n8n.example.com',
        workflowId: 'wf-1',
        parentFolderId: null,
      });
      expect(result.isError).toBeFalsy();
    });
  });
});
