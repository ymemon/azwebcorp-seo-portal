'use client';

import { useCallback, useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ArrowRight,
  Building2,
  ExternalLink,
  Globe2,
  LoaderCircle,
  MapPin,
  MousePointerClick,
  Navigation,
  PhoneCall,
  RefreshCw,
} from 'lucide-react';

import type { WorkspaceKey } from '@/components/portal-live';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

type BusinessData = {
  updatedAt: string;
  periodLabel: string;
  listing: {
    id: string;
    title: string;
    category: string;
    address: string;
    phone: string | null;
    website: string;
    status: string;
    mapsUrl: string | null;
    reviewUrl: string | null;
  };
  metrics: {
    impressions: number;
    websiteClicks: number;
    calls: number;
    directions: number;
    actions: number;
  };
  trend: Array<{ date: string; impressions: number; actions: number }>;
};

const businessChartConfig = {
  impressions: { label: 'Profile views', color: '#e6b84d' },
  actions: { label: 'Customer actions', color: '#f63c13' },
} satisfies ChartConfig;

function compact(value: number) {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function BusinessProfileView({
  workspace,
  onSetup,
}: {
  workspace: WorkspaceKey;
  onSetup: () => void;
}) {
  const [data, setData] = useState<BusinessData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/google/business?siteId=${workspace}`, {
        cache: 'no-store',
      });
      const payload = (await response.json()) as BusinessData & {
        error?: string;
      };
      if (!response.ok) {
        setData(null);
        setError(payload.error ?? 'Business Profile data could not be loaded.');
      } else {
        setData(payload);
        setError(null);
      }
    } catch {
      setData(null);
      setError('Business Profile data could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [workspace]);
  useEffect(() => void load(), [load]);

  if (loading)
    return (
      <div className="grid min-h-[55vh] place-items-center rounded-3xl border border-white/8 bg-white/[0.025]">
        <LoaderCircle className="size-8 animate-spin text-[#e6b84d]" />
      </div>
    );

  if (!data)
    return (
      <div className="grid min-h-[55vh] place-items-center rounded-3xl border border-[#e6b84d]/20 bg-[#e6b84d]/[0.04] p-8 text-center">
        <div className="max-w-lg">
          <Building2 className="mx-auto size-10 text-[#f5d47d]" />
          <h2 className="mt-4 text-2xl font-semibold">
            Connect the client’s Google listing
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {error}
          </p>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            Google requires the Business Profile APIs to be approved and
            enabled, plus a one-time reconnect to grant listing access.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button onClick={onSetup}>
              Open data connections <ArrowRight />
            </Button>
            <a
              href="https://developers.google.com/my-business/content/prereqs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 text-sm font-semibold transition hover:bg-white/10"
            >
              Google requirements <ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>
      </div>
    );

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge className="border border-[#4285f4]/25 bg-[#4285f4]/10 text-[#8ab4f8]">
            Google Business Profile
          </Badge>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em]">
            Local visibility and actions
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Search and Maps performance for the connected listing.
          </p>
        </div>
        <Button
          variant="outline"
          className="border-white/10 bg-white/5"
          onClick={() => void load()}
        >
          <RefreshCw /> Refresh listing
        </Button>
      </div>

      <Card className="mt-5 overflow-hidden border border-white/7 bg-[linear-gradient(120deg,rgb(66_133_244/10%),#101720_48%,rgb(230_184_77/6%))] ring-0">
        <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#4285f4]/14 text-[#8ab4f8]">
              <Building2 className="size-6" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-semibold">{data.listing.title}</h3>
                <Badge
                  variant="outline"
                  className="border-[#4cc98a]/25 bg-[#4cc98a]/8 text-[#75dca8]"
                >
                  {data.listing.status === 'OPEN'
                    ? 'Verified live listing'
                    : data.listing.status}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {data.listing.category}
              </p>
              {data.listing.address && (
                <p className="mt-2 flex items-start gap-1.5 text-xs text-[#c6cdd6]">
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-[#e6b84d]" />{' '}
                  {data.listing.address}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.listing.mapsUrl && (
              <a
                href={data.listing.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-semibold transition hover:bg-white/10"
              >
                <MapPin className="size-3.5" /> Open Maps
              </a>
            )}
            {data.listing.reviewUrl && (
              <a
                href={data.listing.reviewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-white transition hover:bg-primary/90"
              >
                Review link <ExternalLink className="size-3.5" />
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Profile views',
            value: data.metrics.impressions,
            icon: Globe2,
            note: 'Google Search + Maps',
          },
          {
            label: 'Website clicks',
            value: data.metrics.websiteClicks,
            icon: MousePointerClick,
            note: data.periodLabel,
          },
          {
            label: 'Call clicks',
            value: data.metrics.calls,
            icon: PhoneCall,
            note: data.periodLabel,
          },
          {
            label: 'Direction requests',
            value: data.metrics.directions,
            icon: Navigation,
            note: data.periodLabel,
          },
        ].map((metric) => {
          const Icon = metric.icon;
          return (
            <Card
              key={metric.label}
              className="border border-white/6 bg-[#101720]/92 ring-0"
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between">
                  <p className="text-xs font-medium text-muted-foreground">
                    {metric.label}
                  </p>
                  <span className="rounded-lg border border-white/8 bg-white/5 p-2 text-[#e6b84d]">
                    <Icon className="size-4" />
                  </span>
                </div>
                <p className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
                  {compact(metric.value)}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {metric.note}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-4 border border-white/6 bg-[#101720]/92 ring-0">
        <CardHeader>
          <CardTitle>Local discovery trend</CardTitle>
          <CardDescription>
            Daily profile views and high-intent customer actions
          </CardDescription>
          <CardAction>
            <Badge
              variant="outline"
              className="border-white/10 text-muted-foreground"
            >
              {data.periodLabel}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          {data.trend.length ? (
            <ChartContainer
              config={businessChartConfig}
              className="h-[310px] w-full aspect-auto"
            >
              <AreaChart
                data={data.trend}
                margin={{ left: 4, right: 8, top: 12, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="business-impressions-fill"
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="var(--color-impressions)"
                      stopOpacity={0.28}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--color-impressions)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="rgba(255,255,255,0.07)"
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  minTickGap={30}
                />
                <YAxis hide />
                <ChartTooltip
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Area
                  type="monotone"
                  dataKey="actions"
                  stroke="var(--color-actions)"
                  strokeWidth={1.8}
                  fill="transparent"
                />
                <Area
                  type="monotone"
                  dataKey="impressions"
                  stroke="var(--color-impressions)"
                  strokeWidth={2.5}
                  fill="url(#business-impressions-fill)"
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <p className="grid h-[310px] place-items-center text-sm text-muted-foreground">
              No Business Profile metrics are available for this period.
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
