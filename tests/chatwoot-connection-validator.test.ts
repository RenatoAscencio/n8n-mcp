import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ChatwootConnectionValidator } from '../src/integrations/chatwoot/connection-validator';

describe('ChatwootConnectionValidator', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('testApplicationApi', () => {
    it('returns success on 200', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      });

      const result = await ChatwootConnectionValidator.testApplicationApi(
        'https://chatwoot.example.com',
        '1',
        'token123',
      );

      expect(result.success).toBe(true);
      expect(result.apiType).toBe('application');
      expect(result.message).toBe('Application API connection successful');
    });

    it('classifies 401 as auth error', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      const result = await ChatwootConnectionValidator.testApplicationApi(
        'https://chatwoot.example.com',
        '1',
        'bad-token',
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('401');
      expect(result.details?.suggestion).toContain('API access token');
    });

    it('classifies 404 as wrong URL/accountId', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const result = await ChatwootConnectionValidator.testApplicationApi(
        'https://chatwoot.example.com',
        '999',
        'token',
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('404');
      expect(result.details?.suggestion).toContain('baseUrl');
    });

    it('classifies ECONNREFUSED as network error', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('connect ECONNREFUSED'));

      const result = await ChatwootConnectionValidator.testApplicationApi(
        'https://chatwoot.example.com',
        '1',
        'token',
      );

      expect(result.success).toBe(false);
      expect(result.apiType).toBe('application');
      expect(result.message).toContain('not reachable');
      expect(result.details?.errorType).toBe('network');
    });

    it('classifies DNS failure', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(
        new Error('getaddrinfo ENOTFOUND bad-host.example.com'),
      );

      const result = await ChatwootConnectionValidator.testApplicationApi(
        'https://bad-host.example.com',
        '1',
        'token',
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('DNS');
      expect(result.details?.errorType).toBe('dns');
    });

    it('classifies abort as timeout', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new DOMException('The operation was aborted', 'AbortError'));

      const result = await ChatwootConnectionValidator.testApplicationApi(
        'https://slow.example.com',
        '1',
        'token',
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('timed out');
      expect(result.details?.errorType).toBe('timeout');
    });

    it('classifies SSL errors', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(
        new Error('UNABLE_TO_VERIFY_LEAF_SIGNATURE'),
      );

      const result = await ChatwootConnectionValidator.testApplicationApi(
        'https://self-signed.example.com',
        '1',
        'token',
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('SSL');
      expect(result.details?.errorType).toBe('ssl');
    });

    it('sanitizes tokens from error messages', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(
        new Error('request failed with api_access_token: mySecretToken12345678'),
      );

      const result = await ChatwootConnectionValidator.testApplicationApi(
        'https://chatwoot.example.com',
        '1',
        'mySecretToken12345678',
      );

      expect(result.success).toBe(false);
      expect(result.message).not.toContain('mySecretToken12345678');
      expect(result.message).toContain('***');
    });
  });

  describe('testPlatformApi', () => {
    it('returns success on 200', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      });

      const result = await ChatwootConnectionValidator.testPlatformApi(
        'https://chatwoot.example.com',
        'platform-token',
      );

      expect(result.success).toBe(true);
      expect(result.apiType).toBe('platform');
    });

    it('classifies 403 as permissions error', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      });

      const result = await ChatwootConnectionValidator.testPlatformApi(
        'https://chatwoot.example.com',
        'limited-token',
      );

      expect(result.success).toBe(false);
      expect(result.apiType).toBe('platform');
      expect(result.message).toContain('403');
      expect(result.details?.suggestion).toContain('permissions');
    });
  });

  describe('testAll', () => {
    it('runs both APIs when both configs provided', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      });

      const results = await ChatwootConnectionValidator.testAll({
        baseUrl: 'https://chatwoot.example.com',
        accountId: '1',
        token: 'app-token',
        platformToken: 'platform-token',
      });

      expect(results).toHaveLength(2);
      expect(results[0].apiType).toBe('application');
      expect(results[1].apiType).toBe('platform');
    });

    it('skips APIs when configs missing', async () => {
      const results = await ChatwootConnectionValidator.testAll({
        baseUrl: 'https://chatwoot.example.com',
      });

      expect(results).toHaveLength(0);
    });
  });
});
