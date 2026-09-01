import { env } from 'cloudflare:workers';

import { getChatGPTUser } from '@/app/chatgpt-auth';
import {
  encryptRefreshToken,
  exchangeAuthorizationCode,
  fetchGoogleIdentity,
} from '@/lib/google';
import { ensurePortalAccount, PORTAL_TENANT_ID } from '@/lib/portal';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  await ensurePortalAccount(user);
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const denied = url.searchParams.get('error');
  if (denied) return redirectDashboard('denied');
  if (!code || !state) return redirectDashboard('invalid-callback');

  const stored = await env.DB.prepare(
    `SELECT id, user_id, code_verifier, expires_at FROM oauth_states WHERE id = ?`,
  )
    .bind(state)
    .first<{
      id: string;
      user_id: string;
      code_verifier: string;
      expires_at: string;
    }>();

  if (
    !stored ||
    stored.user_id !== user.userId ||
    new Date(stored.expires_at).getTime() < Date.now()
  ) {
    return redirectDashboard('expired');
  }

  await env.DB.prepare(`DELETE FROM oauth_states WHERE id = ?`)
    .bind(state)
    .run();

  try {
    const tokens = await exchangeAuthorizationCode(code, stored.code_verifier);
    const identity = await fetchGoogleIdentity(tokens.access_token);
    if (!tokens.refresh_token)
      return redirectDashboard('missing-refresh-token');
    const encrypted = await encryptRefreshToken(tokens.refresh_token);
    const connectionId = `google_${identity.sub}`;
    const now = new Date().toISOString();
    await env.DB.prepare(
      `INSERT INTO google_connections
       (id, tenant_id, google_subject, google_email, scopes_json, refresh_ciphertext, refresh_nonce, key_version, status, connected_by, connected_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'active', ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         google_email = excluded.google_email,
         scopes_json = excluded.scopes_json,
         refresh_ciphertext = excluded.refresh_ciphertext,
         refresh_nonce = excluded.refresh_nonce,
         key_version = 1,
         status = 'active',
         connected_by = excluded.connected_by,
         connected_at = excluded.connected_at,
         revoked_at = NULL`,
    )
      .bind(
        connectionId,
        PORTAL_TENANT_ID,
        identity.sub,
        identity.email,
        JSON.stringify((tokens.scope ?? '').split(' ').filter(Boolean)),
        encrypted.ciphertext,
        encrypted.nonce,
        user.userId,
        now,
      )
      .run();
    return redirectDashboard('connected');
  } catch {
    return redirectDashboard('failed');
  }
}

function redirectDashboard(status: string) {
  const target = new URL(
    '/dashboard',
    'https://azwebcorp-seo-portal.webcorp.chatgpt.site',
  );
  target.searchParams.set('google', status);
  return Response.redirect(target, 302);
}
