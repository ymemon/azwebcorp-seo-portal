import { getChatGPTUser } from '@/app/chatgpt-auth';
import { googleConfiguration, listGoogleConnections } from '@/lib/google';
import {
  ensurePortalAccount,
  getPortalAccess,
  getSiteMappings,
  PORTAL_SITES,
} from '@/lib/portal';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!getPortalAccess(user).isAgencyAdmin)
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  await ensurePortalAccount(user);
  const [connections, mappings] = await Promise.all([
    listGoogleConnections(user.userId),
    getSiteMappings(),
  ]);
  const configuration = googleConfiguration();
  return Response.json({
    configurationReady: configuration.ready,
    redirectUri:
      configuration.redirectUri ??
      'https://azwebcorp-seo-portal.webcorp.chatgpt.site/api/google/callback',
    connected: connections.length > 0,
    googleEmail: connections[0]?.google_email ?? null,
    googleAccounts: connections.map((connection) => ({
      id: connection.id,
      email: connection.google_email,
      connectedAt: connection.connected_at,
    })),
    sites: PORTAL_SITES,
    mappings,
  });
}
