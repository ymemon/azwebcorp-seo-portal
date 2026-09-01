'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ArrowRight,
  Clock3,
  ExternalLink,
  Globe2,
  LoaderCircle,
  MonitorSmartphone,
  Newspaper,
  Radio,
  RefreshCw,
} from 'lucide-react';

import { LiveGlobe } from '@/components/live-globe';
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

export type WorkspaceKey = 'northstar-msp' | 'meridian-health' | 'az-web-corp';

type LiveData = {
  site: { id: WorkspaceKey; name: string; domain: string };
  propertyName: string;
  updatedAt: string;
  windowMinutes: number;
  activeUsers: number;
  timeline: Array<{ minutesAgo: number; activeUsers: number }>;
  locations: Array<{ country: string; city: string; activeUsers: number }>;
  pages: Array<{ title: string; activeUsers: number }>;
  devices: Array<{ device: string; activeUsers: number }>;
};

type NewsData = {
  topic: string;
  updatedAt: string;
  items: Array<{
    title: string;
    url: string;
    source: string;
    publishedAt: string;
  }>;
};

const partnershipProfiles: Record<
  WorkspaceKey,
  {
    headline: string;
    copy: string;
    image?: string;
    imagePosition?: string;
  }
> = {
  'northstar-msp': {
    headline: 'AZ Web Corp × Northstar Managed IT',
    copy: 'A shared growth workspace for organic visibility, analytics and the next best action.',
  },
  'meridian-health': {
    headline: 'AZ Web Corp × Meridian Health Partners',
    copy: 'Digital growth with a patient-first view of visibility, engagement and local demand.',
  },
  'az-web-corp': {
    headline: 'AZ Web Corp Growth Command Center',
    copy: 'One live view of the agency’s search presence, audience quality and highest-value opportunities.',
  },
};

const liveChartConfig = {
  activeUsers: { label: 'Active users', color: '#e6b84d' },
} satisfies ChartConfig;

export function ClientNewsTicker({ workspace }: { workspace: WorkspaceKey }) {
  const [news, setNews] = useState<NewsData | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/news?siteId=${workspace}`, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(
        async (response): Promise<NewsData | null> =>
          response.ok ? (response.json() as Promise<NewsData>) : null,
      )
      .then((payload: NewsData | null) => setNews(payload))
      .catch(() => undefined);
    return () => controller.abort();
  }, [workspace]);

  if (!news?.items.length) return null;
  const loopedItems = [...news.items, ...news.items];
  return (
    <div className="portal-news relative z-10 overflow-hidden border-b border-[#e6b84d]/15 bg-[linear-gradient(90deg,rgb(230_184_77/8%),rgb(246_60_19/5%),transparent)]">
      <div className="flex h-10 items-center">
        <div className="relative z-20 flex h-full shrink-0 items-center gap-2 border-r border-white/10 bg-[#0b1118] px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-[#f5d47d] sm:px-6">
          <Newspaper className="size-3.5" /> Client intelligence
        </div>
        <div className="min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_4%,black_96%,transparent)]">
          <div className="news-ticker-track flex w-max items-center whitespace-nowrap">
            {loopedItems.map((item, index) => (
              <a
                key={`${item.url}-${index}`}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-2 px-6 text-xs text-[#c6cdd6] transition hover:text-white"
              >
                <span className="size-1.5 rounded-full bg-primary" />
                <span className="font-medium">{item.title}</span>
                <span className="text-[10px] text-muted-foreground">
                  {item.source}
                </span>
                <ExternalLink className="size-3 opacity-0 transition group-hover:opacity-100" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PartnershipBanner({ workspace }: { workspace: WorkspaceKey }) {
  const profile = partnershipProfiles[workspace];
  return (
    <section className="portal-partnership relative mb-5 min-h-52 overflow-hidden rounded-[1.4rem] border border-white/10 bg-[#0c141d] shadow-[0_24px_70px_rgb(0_0_0/30%)]">
      {profile.image ? (
        <Image
          src={profile.image}
          alt={`${profile.headline} partnership`}
          fill
          sizes="(max-width: 1024px) 100vw, 1200px"
          className="object-cover opacity-58"
          style={{ objectPosition: profile.imagePosition }}
          priority
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_20%,rgb(230_184_77/20%),transparent_28%),radial-gradient(circle_at_18%_80%,rgb(246_60_19/22%),transparent_34%),linear-gradient(120deg,#0c141d,#101b27)]" />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(5_10_15/96%)_0%,rgb(5_10_15/76%)_46%,rgb(5_10_15/18%)_100%)]" />
      <div className="relative z-10 flex min-h-52 max-w-2xl flex-col justify-end p-5 sm:p-7">
        <Badge className="mb-3 w-fit border border-[#e6b84d]/25 bg-[#e6b84d]/10 text-[#f5d47d]">
          Partnership workspace
        </Badge>
        <h2 className="text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
          {profile.headline}
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-[#bdc5cf]">
          {profile.copy}
        </p>
      </div>
    </section>
  );
}

export function LiveView({
  workspace,
  onSetup,
}: {
  workspace: WorkspaceKey;
  onSetup: () => void;
}) {
  const [data, setData] = useState<LiveData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/live?siteId=${workspace}`, {
        cache: 'no-store',
      });
      const payload = (await response.json()) as LiveData & {
        error?: string;
      };
      if (!response.ok) {
        setData(null);
        setError(payload.error ?? 'Realtime data could not be loaded.');
      } else {
        setData(payload);
        setError(null);
      }
    } catch {
      setError('Realtime data could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), 30_000);
    return () => window.clearInterval(interval);
  }, [load]);

  const dominantDevice = useMemo(
    () =>
      [...(data?.devices ?? [])].sort(
        (a, b) => b.activeUsers - a.activeUsers,
      )[0],
    [data],
  );

  if (loading && !data)
    return (
      <div className="grid min-h-[60vh] place-items-center rounded-3xl border border-white/8 bg-white/[0.025]">
        <div className="text-center">
          <LoaderCircle className="mx-auto size-8 animate-spin text-[#e6b84d]" />
          <p className="mt-3 text-sm text-muted-foreground">
            Opening the live signal…
          </p>
        </div>
      </div>
    );

  if (!data)
    return (
      <div className="grid min-h-[55vh] place-items-center rounded-3xl border border-[#e6b84d]/20 bg-[#e6b84d]/[0.04] p-8 text-center">
        <div className="max-w-md">
          <Radio className="mx-auto size-9 text-[#f5d47d]" />
          <h2 className="mt-4 text-xl font-semibold">
            Live signal needs Analytics
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {error}
          </p>
          <Button className="mt-5" onClick={onSetup}>
            Review connection <ArrowRight />
          </Button>
        </div>
      </div>
    );

  const timeline = data.timeline.map((row) => ({
    ...row,
    label: row.minutesAgo === 0 ? 'Now' : `${row.minutesAgo}m`,
  }));
  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge className="border border-[#4cc98a]/25 bg-[#4cc98a]/10 text-[#75dca8]">
            <span className="mr-1.5 size-1.5 animate-pulse rounded-full bg-[#4cc98a]" />
            Realtime
          </Badge>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em]">
            Live audience command center
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Visitor activity from the last {data.windowMinutes} minutes,
            refreshed automatically.
          </p>
        </div>
        <Button
          variant="outline"
          className="border-white/10 bg-white/5"
          onClick={() => void load()}
          disabled={loading}
        >
          <RefreshCw className={loading ? 'animate-spin' : ''} /> Refresh live
        </Button>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(360px,0.9fr)_minmax(0,1.1fr)]">
        <Card className="relative overflow-hidden border border-[#4cc98a]/12 bg-[radial-gradient(circle_at_50%_42%,rgb(76_201_138/8%),transparent_40%),#081018] ring-0">
          <CardContent className="p-0">
            <LiveGlobe
              locations={data.locations}
              activeUsers={data.activeUsers}
            />
          </CardContent>
        </Card>
        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="border border-white/6 bg-[#101720]/92 ring-0">
              <CardContent className="p-4">
                <Radio className="size-4 text-[#4cc98a]" />
                <p className="mt-4 text-3xl font-semibold">
                  {data.activeUsers}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Active visitors
                </p>
              </CardContent>
            </Card>
            <Card className="border border-white/6 bg-[#101720]/92 ring-0">
              <CardContent className="p-4">
                <Globe2 className="size-4 text-[#e6b84d]" />
                <p className="mt-4 text-3xl font-semibold">
                  {data.locations.length}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Active locations
                </p>
              </CardContent>
            </Card>
            <Card className="border border-white/6 bg-[#101720]/92 ring-0">
              <CardContent className="p-4">
                <MonitorSmartphone className="size-4 text-primary" />
                <p className="mt-4 truncate text-lg font-semibold capitalize">
                  {dominantDevice?.device ?? '—'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Leading device
                </p>
              </CardContent>
            </Card>
          </div>
          <Card className="border border-white/6 bg-[#101720]/92 ring-0">
            <CardHeader>
              <CardTitle>Audience pulse</CardTitle>
              <CardDescription>Active users minute by minute</CardDescription>
              <CardAction>
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Clock3 className="size-3.5" /> Auto-refresh 30s
                </span>
              </CardAction>
            </CardHeader>
            <CardContent>
              {timeline.length ? (
                <ChartContainer
                  config={liveChartConfig}
                  className="h-[235px] w-full aspect-auto"
                >
                  <AreaChart
                    data={timeline}
                    margin={{ left: 4, right: 8, top: 12, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="live-users-fill"
                        x1="0"
                        x2="0"
                        y1="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="var(--color-activeUsers)"
                          stopOpacity={0.38}
                        />
                        <stop
                          offset="100%"
                          stopColor="var(--color-activeUsers)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      vertical={false}
                      stroke="rgba(255,255,255,0.07)"
                    />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      minTickGap={30}
                    />
                    <YAxis hide allowDecimals={false} />
                    <ChartTooltip
                      content={<ChartTooltipContent indicator="line" />}
                    />
                    <Area
                      type="monotone"
                      dataKey="activeUsers"
                      stroke="var(--color-activeUsers)"
                      strokeWidth={2.5}
                      fill="url(#live-users-fill)"
                    />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <p className="grid h-[235px] place-items-center text-sm text-muted-foreground">
                  Waiting for the first realtime events.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card className="border border-white/6 bg-[#101720]/92 ring-0">
          <CardHeader>
            <CardTitle>Visitors by location</CardTitle>
            <CardDescription>Where the live audience is active</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {data.locations.slice(0, 8).map((location, index) => (
              <div
                key={`${location.country}-${location.city}`}
                className="flex items-center gap-3 rounded-xl px-2 py-2.5"
              >
                <span className="grid size-7 place-items-center rounded-lg bg-white/5 text-xs text-muted-foreground">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {location.city}, {location.country}
                </span>
                <span className="rounded-full border border-[#4cc98a]/20 bg-[#4cc98a]/8 px-2 py-1 text-xs font-semibold text-[#75dca8]">
                  {location.activeUsers}
                </span>
              </div>
            ))}
            {!data.locations.length && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No visitor locations in the current window.
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="border border-white/6 bg-[#101720]/92 ring-0">
          <CardHeader>
            <CardTitle>Pages being viewed</CardTitle>
            <CardDescription>
              Content attracting attention right now
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {data.pages.slice(0, 8).map((page, index) => (
              <div
                key={`${page.title}-${index}`}
                className="flex items-center gap-3 rounded-xl px-2 py-2.5"
              >
                <span className="grid size-7 place-items-center rounded-lg bg-white/5 text-xs text-muted-foreground">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {page.title}
                </span>
                <span className="text-sm tabular-nums">{page.activeUsers}</span>
              </div>
            ))}
            {!data.pages.length && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No active pages in the current window.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
