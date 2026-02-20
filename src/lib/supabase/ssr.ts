import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

type CookieItem = {
  name: string;
  value: string;
};

type CookieAdapter = {
  getAll: () => CookieItem[];
  setAll?: (cookies: CookieItem[]) => void;
};

type ServerClientOptions = {
  cookies: CookieAdapter;
};

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function decodeCookieValue(value: string): string {
  const urlDecoded = (() => {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  })();

  if (urlDecoded.startsWith('base64-')) {
    const raw = urlDecoded.slice('base64-'.length);
    try {
      return Buffer.from(raw, 'base64').toString('utf8');
    } catch {
      return urlDecoded;
    }
  }

  return urlDecoded;
}

function extractTokenFromPayload(raw: string): string | null {
  const decoded = decodeCookieValue(raw);
  const parsed = safeJsonParse(decoded);

  if (parsed && typeof parsed === 'object' && 'access_token' in parsed) {
    const token = (parsed as { access_token?: unknown }).access_token;
    return typeof token === 'string' ? token : null;
  }

  if (Array.isArray(parsed) && typeof parsed[0] === 'string') {
    return parsed[0];
  }

  return null;
}

function readAccessTokenFromCookies(cookies: CookieItem[]): string | null {
  const authCookies = cookies.filter((c) => c.name.includes('auth-token'));
  if (authCookies.length === 0) return null;

  // 1) Direct cookie value first
  for (const cookie of authCookies) {
    if (!/\.\d+$/.test(cookie.name)) {
      const token = extractTokenFromPayload(cookie.value);
      if (token) return token;
    }
  }

  // 2) Chunked cookies: e.g. sb-xxx-auth-token.0, .1 ...
  const chunkGroups = new Map<string, Array<{ idx: number; value: string }>>();

  for (const cookie of authCookies) {
    const match = cookie.name.match(/^(.*)\.(\d+)$/);
    if (!match) continue;
    const [, baseName, idxStr] = match;
    const list = chunkGroups.get(baseName) || [];
    list.push({ idx: Number(idxStr), value: cookie.value });
    chunkGroups.set(baseName, list);
  }

  for (const chunks of chunkGroups.values()) {
    const joined = chunks
      .sort((a, b) => a.idx - b.idx)
      .map((c) => c.value)
      .join('');

    const token = extractTokenFromPayload(joined);
    if (token) return token;
  }

  return null;
}

export function createServerClient(
  supabaseUrl: string,
  supabaseAnonKey: string,
  options: ServerClientOptions
) {
  const cookies = options.cookies.getAll();
  const accessToken = readAccessTokenFromCookies(cookies);

  const clientOptions: Parameters<typeof createSupabaseClient<Database>>[2] = {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  };

  if (accessToken) {
    clientOptions.global = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };
  }

  return createSupabaseClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    clientOptions
  );
}
