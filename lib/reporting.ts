import { env } from 'cloudflare:workers';

import { getGoogleAccessTokenForConnection, googleFetch } from '@/lib/google';
import { getPortalSite, getSiteMappings, PORTAL_TENANT_ID } from '@/lib/portal';

type RangeKey = '7d' | '28d' | '90d';

type GscRow = {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
};

type GscResponse = { rows?: GscRow[] };
type GaRow = {
  dimensionValues?: Array<{ value?: string }>;
  metricValues?: Array<{ value?: string }>;
};

type GaResponse = { rows?: GaRow[] };

const RANGE_DAYS: Record<RangeKey, number> = { '7d': 7, '28d': 28, '90d': 90 };

export async function loadDashboardData(
  _userId: string,
  siteId: string,
  range: RangeKey,
) {
  const site = getPortalSite(siteId);
  if (!site) throw new Error('SITE_NOT_FOUND');
  const mappings = await getSiteMappings(siteId);
  const gsc = mappings.find((mapping) => mapping.provider === 'gsc');
  const ga4 = mappings.find((mapping) => mapping.provider === 'ga4');
  if (!gsc || !ga4) throw new Error('SITE_NOT_MAPPED');

  const gscAccess = getGoogleAccessTokenForConnection(gsc.connection_id);
  const ga4Access =
    ga4.connection_id === gsc.connection_id
      ? gscAccess
      : getGoogleAccessTokenForConnection(ga4.connection_id);
  const [{ accessToken: gscAccessToken }, { accessToken: ga4AccessToken }] =
    await Promise.all([gscAccess, ga4Access]);
  const days = RANGE_DAYS[range];
  const today = startOfUtcDay(new Date());
  const gaEnd = addDays(today, -1);
  const gaStart = addDays(gaEnd, -(days - 1));
  const gaPreviousEnd = addDays(gaStart, -1);
  const gaPreviousStart = addDays(gaPreviousEnd, -(days - 1));
  const gscEnd = addDays(today, -3);
  const gscStart = addDays(gscEnd, -(days - 1));
  const gscPreviousEnd = addDays(gscStart, -1);
  const gscPreviousStart = addDays(gscPreviousEnd, -(days - 1));

  const [
    gscCurrent,
    gscPrevious,
    gscTrend,
    gscQueries,
    gscPages,
    gaCurrent,
    gaPrevious,
    gaChannels,
    gaTrend,
    gaSources,
    gaDevices,
    gaLocations,
    gaRealtime,
  ] = await Promise.all([
    runGsc(gscAccessToken, gsc.external_resource_id, gscStart, gscEnd),
    runGsc(
      gscAccessToken,
      gsc.external_resource_id,
      gscPreviousStart,
      gscPreviousEnd,
    ),
    runGsc(
      gscAccessToken,
      gsc.external_resource_id,
      gscStart,
      gscEnd,
      ['date'],
      1000,
    ),
    runGsc(
      gscAccessToken,
      gsc.external_resource_id,
      gscStart,
      gscEnd,
      ['query'],
      100,
    ),
    runGsc(
      gscAccessToken,
      gsc.external_resource_id,
      gscStart,
      gscEnd,
      ['page'],
      50,
    ),
    runGa(ga4AccessToken, ga4.external_resource_id, gaStart, gaEnd),
    runGa(
      ga4AccessToken,
      ga4.external_resource_id,
      gaPreviousStart,
      gaPreviousEnd,
    ),
    runGa(ga4AccessToken, ga4.external_resource_id, gaStart, gaEnd, [
      'sessionDefaultChannelGroup',
    ]),
    runGa(ga4AccessToken, ga4.external_resource_id, gaStart, gaEnd, ['date']),
    runGa(ga4AccessToken, ga4.external_resource_id, gaStart, gaEnd, [
      'sessionSourceMedium',
    ]),
    runGa(ga4AccessToken, ga4.external_resource_id, gaStart, gaEnd, [
      'deviceCategory',
    ]),
    runGa(ga4AccessToken, ga4.external_resource_id, gaStart, gaEnd, [
      'country',
      'city',
    ]),
    runGaRealtime(ga4AccessToken, ga4.external_resource_id),
  ]);

  const gscNow = gscCurrent.rows?.[0] ?? {};
  const gscBefore = gscPrevious.rows?.[0] ?? {};
  const gaNow = gaMetrics(gaCurrent.rows?.[0]);
  const gaBefore = gaMetrics(gaPrevious.rows?.[0]);
  const now = new Date().toISOString();

  await env.DB.batch([
    env.DB.prepare(
      `UPDATE data_sources SET last_success_at = ?, last_error_code = NULL
       WHERE tenant_id = ? AND site_id = ? AND provider = 'gsc'`,
    ).bind(now, PORTAL_TENANT_ID, siteId),
    env.DB.prepare(
      `UPDATE data_sources SET last_success_at = ?, last_error_code = NULL
       WHERE tenant_id = ? AND site_id = ? AND provider = 'ga4'`,
    ).bind(now, PORTAL_TENANT_ID, siteId),
  ]);

  return {
    site: { id: site.id, name: site.name, domain: site.domain },
    range,
    rangeLabel: `Last ${days} days`,
    updatedAt: now,
    gscFinalizedThrough: formatDate(gscEnd),
    integrity: {
      warning: mappingWarning(site.domain, gsc.display_name, ga4.display_name),
      gsc: {
        id: gsc.external_resource_id,
        name: gsc.display_name,
        lastSuccessAt: gsc.last_success_at,
      },
      ga4: {
        id: ga4.external_resource_id,
        name: ga4.display_name,
        lastSuccessAt: ga4.last_success_at,
      },
    },
    metrics: {
      clicks: number(gscNow.clicks),
      impressions: number(gscNow.impressions),
      ctr: number(gscNow.ctr) * 100,
      position: number(gscNow.position),
      activeUsers: gaNow.activeUsers,
      sessions: gaNow.sessions,
      engagementRate: gaNow.engagementRate * 100,
      keyEvents: gaNow.keyEvents,
      liveUsers: number(gaRealtime.rows?.[0]?.metricValues?.[0]?.value),
    },
    changes: {
      clicks: percentChange(number(gscNow.clicks), number(gscBefore.clicks)),
      impressions: percentChange(
        number(gscNow.impressions),
        number(gscBefore.impressions),
      ),
      position: positionChange(
        number(gscNow.position),
        number(gscBefore.position),
      ),
      activeUsers: percentChange(gaNow.activeUsers, gaBefore.activeUsers),
      sessions: percentChange(gaNow.sessions, gaBefore.sessions),
      engagementRate: percentChange(
        gaNow.engagementRate,
        gaBefore.engagementRate,
      ),
      keyEvents: percentChange(gaNow.keyEvents, gaBefore.keyEvents),
    },
    trend: (gscTrend.rows ?? []).map((row) => ({
      date: shortDate(row.keys?.[0]),
      clicks: number(row.clicks),
      impressions: number(row.impressions),
    })),
    queries: (gscQueries.rows ?? []).map((row) => ({
      query: row.keys?.[0] ?? '(not provided)',
      clicks: number(row.clicks),
      impressions: number(row.impressions),
      ctr: number(row.ctr) * 100,
      position: number(row.position),
    })),
    pages: (gscPages.rows ?? []).map((row) => ({
      path: displayPath(row.keys?.[0], site.domain),
      url: row.keys?.[0] ?? site.canonicalUrl,
      clicks: number(row.clicks),
      impressions: number(row.impressions),
      ctr: number(row.ctr) * 100,
      position: number(row.position),
    })),
    channels: (gaChannels.rows ?? []).map((row) => ({
      source: row.dimensionValues?.[0]?.value ?? 'Other',
      users: number(row.metricValues?.[0]?.value),
      sessions: number(row.metricValues?.[1]?.value),
      engagementRate: number(row.metricValues?.[2]?.value) * 100,
    })),
    analyticsTrend: (gaTrend.rows ?? []).map((row) => ({
      date: shortDate(row.dimensionValues?.[0]?.value),
      users: number(row.metricValues?.[0]?.value),
      sessions: number(row.metricValues?.[1]?.value),
    })),
    sources: (gaSources.rows ?? []).map((row) => ({
      source: row.dimensionValues?.[0]?.value ?? '(not set)',
      users: number(row.metricValues?.[0]?.value),
      sessions: number(row.metricValues?.[1]?.value),
      engagementRate: number(row.metricValues?.[2]?.value) * 100,
    })),
    devices: (gaDevices.rows ?? []).map((row) => ({
      device: row.dimensionValues?.[0]?.value ?? 'Other',
      users: number(row.metricValues?.[0]?.value),
      sessions: number(row.metricValues?.[1]?.value),
    })),
    locations: (gaLocations.rows ?? []).map((row) => ({
      country: row.dimensionValues?.[0]?.value ?? 'Unknown',
      city: row.dimensionValues?.[1]?.value ?? 'Unknown',
      users: number(row.metricValues?.[0]?.value),
      sessions: number(row.metricValues?.[1]?.value),
      engagementRate: number(row.metricValues?.[2]?.value) * 100,
    })),
  };
}

export async function loadLiveData(_userId: string, siteId: string) {
  const site = getPortalSite(siteId);
  if (!site) throw new Error('SITE_NOT_FOUND');
  const mappings = await getSiteMappings(siteId);
  const ga4 = mappings.find((mapping) => mapping.provider === 'ga4');
  if (!ga4) throw new Error('SITE_NOT_MAPPED');
  const { accessToken } = await getGoogleAccessTokenForConnection(
    ga4.connection_id,
  );
  const results = await Promise.allSettled([
    runGaRealtime(accessToken, ga4.external_resource_id),
    runGaRealtime(accessToken, ga4.external_resource_id, ['minutesAgo'], 30),
    runGaRealtime(
      accessToken,
      ga4.external_resource_id,
      ['country', 'city'],
      12,
    ),
    runGaRealtime(
      accessToken,
      ga4.external_resource_id,
      ['unifiedScreenName'],
      10,
    ),
    runGaRealtime(accessToken, ga4.external_resource_id, ['deviceCategory'], 8),
  ]);
  const report = (index: number) =>
    results[index]?.status === 'fulfilled'
      ? results[index].value
      : ({ rows: [] } as GaResponse);
  const total = report(0);
  const minutes = report(1);
  const locations = report(2);
  const pages = report(3);
  const devices = report(4);

  if (results.every((result) => result.status === 'rejected'))
    throw new Error('REALTIME_REPORT_FAILED');

  return {
    site: { id: site.id, name: site.name, domain: site.domain },
    propertyName: ga4.display_name,
    updatedAt: new Date().toISOString(),
    windowMinutes: 30,
    activeUsers: number(total.rows?.[0]?.metricValues?.[0]?.value),
    timeline: (minutes.rows ?? [])
      .map((row) => ({
        minutesAgo: number(row.dimensionValues?.[0]?.value),
        activeUsers: number(row.metricValues?.[0]?.value),
      }))
      .sort((a, b) => b.minutesAgo - a.minutesAgo),
    locations: (locations.rows ?? []).map((row) => ({
      country: row.dimensionValues?.[0]?.value ?? 'Unknown',
      city: row.dimensionValues?.[1]?.value ?? 'Unknown',
      activeUsers: number(row.metricValues?.[0]?.value),
    })),
    pages: (pages.rows ?? []).map((row) => ({
      title: row.dimensionValues?.[0]?.value ?? 'Untitled page',
      activeUsers: number(row.metricValues?.[0]?.value),
    })),
    devices: (devices.rows ?? []).map((row) => ({
      device: row.dimensionValues?.[0]?.value ?? 'Other',
      activeUsers: number(row.metricValues?.[0]?.value),
    })),
  };
}

async function runGsc(
  accessToken: string,
  property: string,
  startDate: Date,
  endDate: Date,
  dimensions: string[] = [],
  rowLimit = 1,
) {
  return (await googleFetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        dimensions,
        rowLimit,
        dataState: 'final',
      }),
    },
  )) as GscResponse;
}

async function runGa(
  accessToken: string,
  property: string,
  startDate: Date,
  endDate: Date,
  dimensions: string[] = [],
) {
  const metrics = dimensions.length
    ? ['activeUsers', 'sessions', 'engagementRate']
    : ['activeUsers', 'sessions', 'engagementRate', 'keyEvents'];
  return (await googleFetch(
    `https://analyticsdata.googleapis.com/v1beta/${property}:runReport`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        dateRanges: [
          { startDate: formatDate(startDate), endDate: formatDate(endDate) },
        ],
        dimensions: dimensions.map((name) => ({ name })),
        metrics: metrics.map((name) => ({ name })),
        orderBys: dimensions.length
          ? dimensions[0] === 'date'
            ? [{ dimension: { dimensionName: 'date' }, desc: false }]
            : [{ metric: { metricName: 'activeUsers' }, desc: true }]
          : undefined,
        limit: dimensions.length ? '20' : '1',
      }),
    },
  )) as GaResponse;
}

async function runGaRealtime(
  accessToken: string,
  property: string,
  dimensions: string[] = [],
  limit = 1,
) {
  return (await googleFetch(
    `https://analyticsdata.googleapis.com/v1beta/${property}:runRealtimeReport`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        dimensions: dimensions.map((name) => ({ name })),
        metrics: [{ name: 'activeUsers' }],
        orderBys: dimensions.length
          ? dimensions[0] === 'minutesAgo'
            ? [
                {
                  dimension: {
                    dimensionName: 'minutesAgo',
                    orderType: 'NUMERIC',
                  },
                  desc: true,
                },
              ]
            : [{ metric: { metricName: 'activeUsers' }, desc: true }]
          : undefined,
        limit: String(limit),
      }),
    },
  )) as GaResponse;
}

function gaMetrics(row?: GaRow) {
  return {
    activeUsers: number(row?.metricValues?.[0]?.value),
    sessions: number(row?.metricValues?.[1]?.value),
    engagementRate: number(row?.metricValues?.[2]?.value),
    keyEvents: number(row?.metricValues?.[3]?.value),
  };
}

function number(value: string | number | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function percentChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

function positionChange(current: number, previous: number) {
  if (!current || !previous) return null;
  return ((previous - current) / previous) * 100;
}

function startOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function shortDate(value?: string) {
  if (!value) return '';
  const normalized = /^\d{8}$/u.test(value)
    ? `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`
    : value;
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(`${normalized}T00:00:00Z`));
}

function displayPath(value: string | undefined, domain: string) {
  if (!value) return '/';
  try {
    const url = new URL(value);
    return url.pathname + url.search;
  } catch {
    return (
      value.replace(`https://${domain}`, '').replace(`http://${domain}`, '') ||
      '/'
    );
  }
}

function mappingWarning(
  expectedDomain: string,
  gscName: string,
  ga4Name: string,
) {
  const mismatches = [
    ['Search Console', gscName],
    ['Analytics', ga4Name],
  ]
    .map(([provider, value]) => ({
      provider,
      mappedDomain: domainIn(value),
    }))
    .filter(
      ({ mappedDomain }) =>
        mappedDomain &&
        mappedDomain !== expectedDomain &&
        !mappedDomain.endsWith(`.${expectedDomain}`),
    );
  if (!mismatches.length) return null;
  return `${mismatches.map((item) => item.provider).join(' and ')} may be mapped to the wrong website (${mismatches.map((item) => item.mappedDomain).join(', ')}).`;
}

function domainIn(value: string) {
  const match = value
    .toLowerCase()
    .match(/(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+(?:\.[a-z0-9-]+)+)/u);
  return match?.[1]?.replace(/\/$/u, '') ?? null;
}
