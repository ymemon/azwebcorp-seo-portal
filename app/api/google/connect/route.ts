import { env } from 'cloudflare:workers';

import { getChatGPTUser } from '@/app/chatgpt-auth';
import {
  googleAuthorizationUrl,
  pkceChallenge,
  randomBase64Url,
} from '@/lib/google';
import { ensurePortalAccount, getPortalAccess } from '@/lib/portal';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!getPortalAccess(user).isAgencyAdmin)
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  await ensurePortalAccount(user);
  const state = randomBase64Url();
  const verifier = randomBase64Url(48);
  const challenge = await pkceChallenge(verifier);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

  await env.DB.batch([
    env.DB.prepare(`DELETE FROM oauth_states WHERE expires_at < ?`).bind(
      now.toISOString(),
    ),
    env.DB.prepare(
      `INSERT INTO oauth_states (id, user_id, code_verifier, return_to, expires_at, created_at)
       VALUES (?, ?, ?, '/dashboard', ?, ?)`,
    ).bind(
      state,
      user.userId,
      verifier,
      expiresAt.toISOString(),
      now.toISOString(),
    ),
  ]);

  try {
    return Response.redirect(googleAuthorizationUrl(state, challenge), 302);
  } catch {
    return Response.redirect(
      new URL(
        '/dashboard?google=configuration-required',
        'https://azwebcorp-seo-portal.webcorp.chatgpt.site',
      ),
      302,
    );
  }
}
