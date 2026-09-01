import { env } from 'cloudflare:workers';

import { getChatGPTUser } from '@/app/chatgpt-auth';
import {
  getGoogleAccessTokenForConnection,
  listGoogleProperties,
} from '@/lib/google';
import {
  ensurePortalAccount,
  getPortalSite,
  getPortalAccess,
  PORTAL_TENANT_ID,
} from '@/lib/portal';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!getPortalAccess(user).isAgencyAdmin)
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  await ensurePortalAccount(user);
  const body = (await request.json()) as {
    siteId?: string;
    gscId?: string;
    gscConnectionId?: string;
    ga4Id?: string;
    ga4ConnectionId?: string;
    gbpId?: string;
    gbpConnectionId?: string;
  };
  const site = body.siteId ? getPortalSite(body.siteId) : null;
  if (
    !site ||
    !body.gscId ||
    !body.gscConnectionId ||
    !body.ga4Id ||
    !body.ga4ConnectionId ||
    (body.gbpId && !body.gbpConnectionId)
  ) {
    return Response.json(
      {
        error:
          'Choose both a Search Console property and an Analytics property.',
      },
      { status: 400 },
    );
  }

  try {
    const connectionIds = [
      body.gscConnectionId,
      body.ga4ConnectionId,
      ...(body.gbpConnectionId ? [body.gbpConnectionId] : []),
    ];
    const availableByConnection = new Map(
      await Promise.all(
        [...new Set(connectionIds)].map(async (connectionId) => {
          const { accessToken } =
            await getGoogleAccessTokenForConnection(connectionId);
          return [
            connectionId,
            await listGoogleProperties(accessToken),
          ] as const;
        }),
      ),
    );
    const gsc = availableByConnection
      .get(body.gscConnectionId)
      ?.gsc.find((property) => property.id === body.gscId);
    const ga4 = availableByConnection
      .get(body.ga4ConnectionId)
      ?.ga4.find((property) => property.id === body.ga4Id);
    const gbp = body.gbpId
      ? availableByConnection
          .get(body.gbpConnectionId!)
          ?.gbp.find((property) => property.id === body.gbpId)
      : null;
    if (!gsc || !ga4)
      return Response.json(
        {
          error:
            'One of the selected Google properties is not available to this account.',
        },
        { status: 403 },
      );
    if (body.gbpId && !gbp)
      return Response.json(
        {
          error:
            'That Google Business Profile listing is not available to this account.',
        },
        { status: 403 },
      );
    const now = new Date().toISOString();
    await env.DB.batch([
      env.DB.prepare(
        `DELETE FROM data_sources WHERE tenant_id = ? AND site_id = ? AND provider = 'gsc'`,
      ).bind(PORTAL_TENANT_ID, site.id),
      env.DB.prepare(
        `DELETE FROM data_sources WHERE tenant_id = ? AND site_id = ? AND provider = 'ga4'`,
      ).bind(PORTAL_TENANT_ID, site.id),
      env.DB.prepare(
        `DELETE FROM data_sources WHERE tenant_id = ? AND site_id = ? AND provider = 'gbp'`,
      ).bind(PORTAL_TENANT_ID, site.id),
      env.DB.prepare(
        `INSERT INTO data_sources
         (id, tenant_id, site_id, connection_id, provider, external_resource_id, display_name, enabled, created_at)
         VALUES (?, ?, ?, ?, 'gsc', ?, ?, 1, ?)`,
      ).bind(
        `gsc_${site.id}`,
        PORTAL_TENANT_ID,
        site.id,
        body.gscConnectionId,
        gsc.id,
        gsc.name,
        now,
      ),
      env.DB.prepare(
        `INSERT INTO data_sources
         (id, tenant_id, site_id, connection_id, provider, external_resource_id, display_name, enabled, created_at)
         VALUES (?, ?, ?, ?, 'ga4', ?, ?, 1, ?)`,
      ).bind(
        `ga4_${site.id}`,
        PORTAL_TENANT_ID,
        site.id,
        body.ga4ConnectionId,
        ga4.id,
        ga4.name,
        now,
      ),
      ...(gbp
        ? [
            env.DB.prepare(
              `INSERT INTO data_sources
               (id, tenant_id, site_id, connection_id, provider, external_resource_id, display_name, enabled, created_at)
               VALUES (?, ?, ?, ?, 'gbp', ?, ?, 1, ?)`,
            ).bind(
              `gbp_${site.id}`,
              PORTAL_TENANT_ID,
              site.id,
              body.gbpConnectionId,
              gbp.id,
              gbp.name,
              now,
            ),
          ]
        : []),
    ]);
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    return Response.json(
      {
        error: message.includes('GOOGLE_NOT_CONNECTED')
          ? 'One of the selected Google accounts is no longer connected.'
          : 'The property mapping could not be saved.',
      },
      { status: 502 },
    );
  }
}
