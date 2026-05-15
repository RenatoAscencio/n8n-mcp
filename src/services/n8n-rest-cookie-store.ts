import { promises as fs } from 'fs';
import { homedir } from 'os';
import { dirname, join } from 'path';
import { createHash } from 'crypto';
import { logger } from '../utils/logger';

const COOKIE_DIR = join(homedir(), '.n8n-mcp', 'cookies');

export interface StoredCookie {
  baseUrl: string;
  cookie: string;
  storedAt: string;
}

function hashBaseUrl(baseUrl: string): string {
  return createHash('sha256').update(baseUrl).digest('hex').slice(0, 16);
}

function cookieFilePath(baseUrl: string): string {
  return join(COOKIE_DIR, `${hashBaseUrl(baseUrl)}.json`);
}

export async function saveCookie(baseUrl: string, cookie: string): Promise<string> {
  await fs.mkdir(COOKIE_DIR, { recursive: true, mode: 0o700 });
  const filePath = cookieFilePath(baseUrl);
  const data: StoredCookie = { baseUrl, cookie, storedAt: new Date().toISOString() };
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), { mode: 0o600 });
  logger.info(`Cookie saved for ${baseUrl} at ${filePath}`);
  return filePath;
}

export async function loadCookie(baseUrl: string): Promise<string | null> {
  try {
    const raw = await fs.readFile(cookieFilePath(baseUrl), 'utf8');
    const data = JSON.parse(raw) as StoredCookie;
    return data.cookie;
  } catch (err: any) {
    if (err.code === 'ENOENT') return null;
    logger.warn(`Failed to read cookie for ${baseUrl}: ${err.message}`);
    return null;
  }
}

export async function clearCookie(baseUrl: string): Promise<void> {
  try {
    await fs.unlink(cookieFilePath(baseUrl));
  } catch (err: any) {
    if (err.code !== 'ENOENT') throw err;
  }
}
