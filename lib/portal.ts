import { env } from 'cloudflare:workers';

import type { ChatGPTUser } from '@/app/chatgpt-auth';

export const PORTAL_TENANT_ID = 'tenant_azwebcorp';

export const PORTAL_SITES = [
  {
    id: 'northstar-msp',
    name: 'Northstar Managed IT',
    domain: 'northstarmsp.example',
    canonicalUrl: 'https://northstarmsp.example',
    timezone: 'Europe/Dublin',
  },
  {
    id: 'meridian-health',
    name: 'Meridian Health Partners',
    domain: 'meridianhealth.example',
    canonicalUrl: 'https://meridianhealth.example',
    timezone: 'America/Phoenix',
  },
  {
    id: 'az-web-corp',
    name: 'AZ Web Corp',
    domain: 'azwebcorp.com',
    canonicalUrl: 'https://azwebcorp.com',
    timezone: 'America/Phoenix',
  },
] as const;

export type PortalSiteId = (typeof PORTAL_SITES)[number]['id'];

export function isPortalSiteId(value: string): value is PortalSiteId {
  return PORTAL_SITES.some((site) => site.id === value);
}

export function getPortalSite(siteId: string) {
  return PORTAL_SITES.find((site) => site.id === siteId) ?? null;
}

export function getPortalAccess(user: Pick<ChatGPTUser, 'email'>) {
  const email = user.email.trim().toLowerCase();
  const adminEmails = (env.PORTAL_ADMIN_EMAILS ?? '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  if (adminEmails.includes(email))
    return {
      isAgencyAdmin: true,
      siteIds: PORTAL_SITES.map((site) => site.id) as PortalSiteId[],
    };
  let configured: Record<string, string[]> = {};
  try {
    configured = JSON.parse(env.PORTAL_CLIENT_ACCESS_JSON ?? '{}') as Record<
      string,
      string[]
    >;
  } catch {
    configured = {};
  }
  const siteIds = (configured[email] ?? []).filter(isPortalSiteId);
  return { isAgencyAdmin: false, siteIds };
}

export function canAccessPortalSite(
  user: Pick<ChatGPTUser, 'email'>,
  siteId: string,
) {
  return (
    isPortalSiteId(siteId) && getPortalAccess(user).siteIds.includes(siteId)
  );
}

export async function ensurePortalAccount(user: ChatGPTUser) {
  const now = new Date().toISOString();
  const db = env.DB;
  const role = getPortalAccess(user).isAgencyAdmin
    ? 'agency_admin'
    : 'client_viewer';

  await db.batch([
    db
      .prepare(
        `INSERT OR IGNORE INTO tenants (id, slug, name, timezone, status, created_at)
       VALUES (?, ?, ?, ?, 'active', ?)`,
      )
      .bind(
        PORTAL_TENANT_ID,
        'azwebcorp',
        'AZ Web Corp',
        'America/Phoenix',
        now,
      ),
    db
      .prepare(
        `INSERT INTO users (id, auth_subject, email, display_name, created_at, last_login_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         email = excluded.email,
         display_name = excluded.display_name,
         last_login_at = excluded.last_login_at`,
      )
      .bind(user.userId, user.userId, user.email, user.displayName, now, now),
    db
      .prepare(
        `INSERT INTO memberships (tenant_id, user_id, role, status, created_at)
       VALUES (?, ?, ?, 'active', ?)
       ON CONFLICT(tenant_id, user_id) DO UPDATE SET
         role = excluded.role,
         status = 'active'`,
      )
      .bind(PORTAL_TENANT_ID, user.userId, role, now),
    ...PORTAL_SITES.map((site) =>
      db
        .prepare(
          `INSERT INTO sites (id, tenant_id, name, canonical_url, timezone, status, created_at)
         VALUES (?, ?, ?, ?, ?, 'active', ?)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           canonical_url = excluded.canonical_url,
           timezone = excluded.timezone,
           status = 'active'`,
        )
        .bind(
          site.id,
          PORTAL_TENANT_ID,
          site.name,
          site.canonicalUrl,
          site.timezone,
          now,
        ),
    ),
  ]);
}

export async function getSiteMappings(siteId?: string) {
  const db = env.DB;
  const result = siteId
    ? await db
        .prepare(
          `SELECT site_id, connection_id, provider, external_resource_id, display_name, property_timezone, last_success_at, last_error_code
         FROM data_sources
         WHERE tenant_id = ? AND site_id = ? AND enabled = 1`,
        )
        .bind(PORTAL_TENANT_ID, siteId)
        .all()
    : await db
        .prepare(
          `SELECT site_id, connection_id, provider, external_resource_id, display_name, property_timezone, last_success_at, last_error_code
         FROM data_sources
         WHERE tenant_id = ? AND enabled = 1`,
        )
        .bind(PORTAL_TENANT_ID)
        .all();

  return result.results as Array<{
    site_id: string;
    connection_id: string;
    provider: 'ga4' | 'gsc' | 'gbp';
    external_resource_id: string;
    display_name: string;
    property_timezone: string | null;
    last_success_at: string | null;
    last_error_code: string | null;
  }>;
}
