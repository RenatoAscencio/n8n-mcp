import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { logger } from '../utils/logger';
import { saveCookie, loadCookie } from './n8n-rest-cookie-store';

/**
 * Client for the n8n internal REST API (`/rest/*`).
 *
 * SECURITY/STABILITY NOTES:
 * - `/rest/*` is the API used by the n8n UI. It is NOT officially documented
 *   and may change between n8n releases.
 * - Authentication uses a session cookie issued by `POST /rest/login`, NOT the
 *   public API key.
 * - This client is intended for single-user (stdio) usage. In multi-tenant HTTP
 *   mode this cookie path would leak across tenants — the handlers refuse to
 *   run in that mode.
 */

export interface N8nRestLoginInput {
  baseUrl: string;
  email: string;
  password: string;
}

export interface N8nRestFolderInput {
  baseUrl: string;
  projectId: string;
  name: string;
  parentFolderId?: string | null;
}

export interface N8nRestMoveWorkflowInput {
  baseUrl: string;
  workflowId: string;
  parentFolderId: string | null;
}

function normalizeBaseUrl(input: string): string {
  try {
    const parsed = new URL(input);
    parsed.hash = '';
    parsed.username = '';
    parsed.password = '';
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return input.replace(/\/$/, '');
  }
}

function buildClient(baseUrl: string, cookie: string | null = null, timeout = 30000): AxiosInstance {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (cookie) headers['Cookie'] = cookie;

  return axios.create({
    baseURL: baseUrl,
    timeout,
    headers,
    maxRedirects: 0,
    validateStatus: () => true,
  });
}

function extractSetCookie(res: AxiosResponse): string | null {
  const raw = res.headers['set-cookie'];
  if (!raw) return null;
  const cookies = Array.isArray(raw) ? raw : [raw];
  const authCookie = cookies.find(c => c.startsWith('n8n-auth='));
  if (!authCookie) return null;
  // Keep only the `name=value` portion; drop attributes (Path, Expires, etc.).
  return authCookie.split(';')[0].trim();
}

export async function n8nRestLogin(input: N8nRestLoginInput): Promise<{ baseUrl: string; cookiePath: string }>
{
  const baseUrl = normalizeBaseUrl(input.baseUrl);
  const client = buildClient(baseUrl);

  logger.info(`Logging in to n8n REST API at ${baseUrl}`);
  const res = await client.post('/rest/login', {
    emailOrLdapLoginId: input.email,
    password: input.password,
  });

  if (res.status !== 200) {
    throw new Error(`Login failed: HTTP ${res.status} — ${JSON.stringify(res.data)}`);
  }

  const cookie = extractSetCookie(res);
  if (!cookie) {
    throw new Error('Login succeeded but n8n-auth cookie was not returned. Check that the instance accepts password auth.');
  }

  const cookiePath = await saveCookie(baseUrl, cookie);
  return { baseUrl, cookiePath };
}

async function authenticatedClient(baseUrl: string): Promise<AxiosInstance> {
  const normalized = normalizeBaseUrl(baseUrl);
  const cookie = await loadCookie(normalized);
  if (!cookie) {
    throw new Error(`No saved cookie for ${normalized}. Run n8n_login first.`);
  }
  return buildClient(normalized, cookie);
}

export async function n8nRestCreateFolder(input: N8nRestFolderInput): Promise<any> {
  const client = await authenticatedClient(input.baseUrl);
  const payload: Record<string, unknown> = { name: input.name };
  if (input.parentFolderId !== undefined) payload.parentFolderId = input.parentFolderId;

  const res = await client.post(`/rest/projects/${encodeURIComponent(input.projectId)}/folders`, payload);
  if (res.status >= 400) {
    throw new Error(`Create folder failed: HTTP ${res.status} — ${JSON.stringify(res.data)}`);
  }
  return res.data;
}

export async function n8nRestMoveWorkflow(input: N8nRestMoveWorkflowInput): Promise<any> {
  const client = await authenticatedClient(input.baseUrl);
  const res = await client.patch(
    `/rest/workflows/${encodeURIComponent(input.workflowId)}`,
    { parentFolderId: input.parentFolderId }
  );
  if (res.status >= 400) {
    throw new Error(`Move workflow failed: HTTP ${res.status} — ${JSON.stringify(res.data)}`);
  }
  return res.data;
}
