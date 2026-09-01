import { getGoogleAccessTokenForConnection, googleFetch } from '@/lib/google';
import { getPortalSite, getSiteMappings } from '@/lib/portal';

type DateValue = {
  date?: { year?: number; month?: number; day?: number };
  value?: string;
};

type MetricSeries = {
  dailyMetric?: string;
  timeSeries?: { datedValues?: DateValue[] };
};

type PerformanceResponse = {
  multiDailyMetricTimeSeries?: Array<{
    dailyMetricTimeSeries?: MetricSeries[];
  }>;
};

const DAILY_METRICS = [
  'BUSINESS_IMPRESSIONS_DESKTOP_MAPS',
  'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH',
  'BUSINESS_IMPRESSIONS_MOBILE_MAPS',
  'BUSINESS_IMPRESSIONS_MOBILE_SEARCH',
  'WEBSITE_CLICKS',
  'CALL_CLICKS',
  'BUSINESS_DIRECTION_REQUESTS',
] as const;

export async function loadBusinessProfileData(_userId: string, siteId: string) {
  const site = getPortalSite(siteId);
  if (!site) throw new Error('SITE_NOT_FOUND');
  const mappings = await getSiteMappings(siteId);
  const listing = mappings.find((mapping) => mapping.provider === 'gbp');
  if (!listing) throw new Error('GBP_NOT_MAPPED');
  const { accessToken } = await getGoogleAccessTokenForConnection(
    listing.connection_id,
  );
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 1);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 27);
  const metricUrl = new URL(
    `https://businessprofileperformance.googleapis.com/v1/${listing.external_resource_id}:fetchMultiDailyMetricsTimeSeries`,
  );
  for (const metric of DAILY_METRICS)
    metricUrl.searchParams.append('dailyMetrics', metric);
  addDateRange(metricUrl, 'dailyRange.start_date', start);
  addDateRange(metricUrl, 'dailyRange.end_date', end);

  const locationUrl = new URL(
    `https://mybusinessbusinessinformation.googleapis.com/v1/${listing.external_resource_id}`,
  );
  locationUrl.searchParams.set(
    'readMask',
    'name,title,storeCode,websiteUri,phoneNumbers,categories,storefrontAddress,openInfo,metadata',
  );

  const [performance, location] = await Promise.all([
    googleFetch(
      metricUrl.toString(),
      accessToken,
    ) as Promise<PerformanceResponse>,
    googleFetch(locationUrl.toString(), accessToken) as Promise<{
      name?: string;
      title?: string;
      storeCode?: string;
      websiteUri?: string;
      phoneNumbers?: { primaryPhone?: string };
      categories?: { primaryCategory?: { displayName?: string } };
      storefrontAddress?: {
        addressLines?: string[];
        locality?: string;
        administrativeArea?: string;
        postalCode?: string;
      };
      openInfo?: { status?: string };
      metadata?: { mapsUri?: string; newReviewUri?: string };
    }>,
  ]);

  const series = (performance.multiDailyMetricTimeSeries ?? []).flatMap(
    (group) => group.dailyMetricTimeSeries ?? [],
  );
  const metricTotals = Object.fromEntries(
    series.map((item) => [
      item.dailyMetric ?? '',
      (item.timeSeries?.datedValues ?? []).reduce(
        (sum, point) => sum + numeric(point.value),
        0,
      ),
    ]),
  );
  const dateMap = new Map<
    string,
    { date: string; impressions: number; actions: number }
  >();
  for (const item of series) {
    const isImpression = item.dailyMetric?.includes('IMPRESSIONS');
    for (const point of item.timeSeries?.datedValues ?? []) {
      const date = apiDate(point.date);
      if (!date) continue;
      const row = dateMap.get(date) ?? { date, impressions: 0, actions: 0 };
      if (isImpression) row.impressions += numeric(point.value);
      else row.actions += numeric(point.value);
      dateMap.set(date, row);
    }
  }
  const impressions = DAILY_METRICS.filter((metric) =>
    metric.includes('IMPRESSIONS'),
  ).reduce((sum, metric) => sum + numeric(metricTotals[metric]), 0);
  const websiteClicks = numeric(metricTotals.WEBSITE_CLICKS);
  const calls = numeric(metricTotals.CALL_CLICKS);
  const directions = numeric(metricTotals.BUSINESS_DIRECTION_REQUESTS);
  const address = [
    ...(location.storefrontAddress?.addressLines ?? []),
    location.storefrontAddress?.locality,
    location.storefrontAddress?.administrativeArea,
    location.storefrontAddress?.postalCode,
  ]
    .filter(Boolean)
    .join(', ');

  return {
    site: { id: site.id, name: site.name, domain: site.domain },
    updatedAt: new Date().toISOString(),
    periodLabel: 'Last 28 complete days',
    listing: {
      id: listing.external_resource_id,
      title: location.title ?? listing.display_name,
      category: location.categories?.primaryCategory?.displayName ?? 'Business',
      address,
      phone: location.phoneNumbers?.primaryPhone ?? null,
      website: location.websiteUri ?? site.canonicalUrl,
      status: location.openInfo?.status ?? 'OPEN',
      mapsUrl: location.metadata?.mapsUri ?? null,
      reviewUrl: location.metadata?.newReviewUri ?? null,
    },
    metrics: {
      impressions,
      websiteClicks,
      calls,
      directions,
      actions: websiteClicks + calls + directions,
    },
    trend: [...dateMap.values()].sort((a, b) => a.date.localeCompare(b.date)),
  };
}

function addDateRange(url: URL, prefix: string, date: Date) {
  url.searchParams.set(`${prefix}.year`, String(date.getUTCFullYear()));
  url.searchParams.set(`${prefix}.month`, String(date.getUTCMonth() + 1));
  url.searchParams.set(`${prefix}.day`, String(date.getUTCDate()));
}

function apiDate(value?: { year?: number; month?: number; day?: number }) {
  if (!value?.year || !value.month || !value.day) return null;
  return `${value.year}-${String(value.month).padStart(2, '0')}-${String(value.day).padStart(2, '0')}`;
}

function numeric(value: string | number | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}
