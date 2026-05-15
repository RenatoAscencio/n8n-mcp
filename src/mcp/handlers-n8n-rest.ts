import { z } from 'zod';
import { logger } from '../utils/logger';
import {
  n8nRestLogin,
  n8nRestCreateFolder,
  n8nRestMoveWorkflow,
} from '../services/n8n-rest-client';

function multiTenantBlocked(): { content: any[]; isError?: boolean } | null {
  if (process.env.ENABLE_MULTI_TENANT === 'true') {
    return {
      content: [{
        type: 'text',
        text: 'n8n REST tools (login/create_folder/move_workflow) are disabled in multi-tenant mode — the on-disk cookie would leak across tenants.',
      }],
      isError: true,
    };
  }
  return null;
}

function jsonResult(data: any) {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

function errorResult(message: string) {
  return { content: [{ type: 'text', text: message }], isError: true };
}

const loginSchema = z.object({
  baseUrl: z.string().url(),
  email: z.string().min(1),
  password: z.string().min(1),
});

const folderSchema = z.object({
  baseUrl: z.string().url(),
  projectId: z.string().min(1),
  name: z.string().min(1),
  parentFolderId: z.string().nullable().optional(),
});

const moveSchema = z.object({
  baseUrl: z.string().url(),
  workflowId: z.string().min(1),
  parentFolderId: z.string().nullable(),
});

export async function handleN8nLogin(args: unknown) {
  const blocked = multiTenantBlocked();
  if (blocked) return blocked;
  const parsed = loginSchema.safeParse(args);
  if (!parsed.success) return errorResult(`Invalid input: ${parsed.error.message}`);

  try {
    const result = await n8nRestLogin(parsed.data);
    return jsonResult({
      success: true,
      baseUrl: result.baseUrl,
      cookiePath: result.cookiePath,
      message: 'Logged in. Cookie saved to disk for subsequent REST tool calls.',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`n8n_login failed: ${message}`);
    return errorResult(message);
  }
}

export async function handleN8nCreateFolder(args: unknown) {
  const blocked = multiTenantBlocked();
  if (blocked) return blocked;
  const parsed = folderSchema.safeParse(args);
  if (!parsed.success) return errorResult(`Invalid input: ${parsed.error.message}`);

  try {
    const folder = await n8nRestCreateFolder(parsed.data);
    return jsonResult({ success: true, folder });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`n8n_create_folder failed: ${message}`);
    return errorResult(message);
  }
}

export async function handleN8nMoveWorkflow(args: unknown) {
  const blocked = multiTenantBlocked();
  if (blocked) return blocked;
  const parsed = moveSchema.safeParse(args);
  if (!parsed.success) return errorResult(`Invalid input: ${parsed.error.message}`);

  try {
    const workflow = await n8nRestMoveWorkflow(parsed.data);
    return jsonResult({ success: true, workflow });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`n8n_move_workflow failed: ${message}`);
    return errorResult(message);
  }
}
