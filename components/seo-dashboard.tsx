'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  AlertTriangle,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleGauge,
  Download,
  Eye,
  FileBarChart,
  FileText,
  Globe2,
  LayoutDashboard,
  Lightbulb,
  LoaderCircle,
  LogOut,
  Menu,
  MousePointerClick,
  MapPin,
  MonitorSmartphone,
  PlugZap,
  Printer,
  Radio,
  RefreshCw,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  UsersRound,
} from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { BusinessProfileView } from '@/components/business-profile-view';
import {
  ClientNewsTicker,
  LiveView,
  PartnershipBanner,
  type WorkspaceKey,
} from '@/components/portal-live';
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
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type RangeKey = '7d' | '28d' | '90d';
type ViewKey =
  | 'live'
  | 'overview'
  | 'search'
  | 'analytics'
  | 'business'
  | 'pages'
  | 'opportunities'
  | 'reports'
  | 'connectors';

type DashboardData = {
  site: { id: WorkspaceKey; name: string; domain: string };
  range: RangeKey;
  rangeLabel: string;
  updatedAt: string;
  gscFinalizedThrough: string;
  integrity: {
    warning: string | null;
    gsc: { id: string; name: string; lastSuccessAt: string | null };
    ga4: { id: string; name: string; lastSuccessAt: string | null };
  };
  metrics: {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
    activeUsers: number;
    sessions: number;
    engagementRate: number;
    keyEvents: number;
    liveUsers: number;
  };
  changes: Record<
    | 'clicks'
    | 'impressions'
    | 'position'
    | 'activeUsers'
    | 'sessions'
    | 'engagementRate'
    | 'keyEvents',
    number | null
  >;
  trend: Array<{ date: string; clicks: number; impressions: number }>;
  queries: Array<{
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  pages: Array<{
    path: string;
    url: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  channels: Array<{
    source: string;
    users: number;
    sessions: number;
    engagementRate: number;
  }>;
  analyticsTrend: Array<{ date: string; users: number; sessions: number }>;
  sources: Array<{
    source: string;
    users: number;
    sessions: number;
    engagementRate: number;
  }>;
  devices: Array<{ device: string; users: number; sessions: number }>;
  locations: Array<{
    country: string;
    city: string;
    users: number;
    sessions: number;
    engagementRate: number;
  }>;
};

type StatusData = {
  configurationReady: boolean;
  redirectUri: string;
  connected: boolean;
  googleEmail: string | null;
  googleAccounts: Array<{
    id: string;
    email: string;
    connectedAt: string;
  }>;
  sites: Array<{ id: WorkspaceKey; name: string; domain: string }>;
  mappings: Array<{
    site_id: string;
    connection_id: string;
    provider: 'ga4' | 'gsc' | 'gbp';
    external_resource_id: string;
    display_name: string;
    last_success_at?: string | null;
    last_error_code?: string | null;
  }>;
};

type AccountProperty = {
  id: string;
  name: string;
  note: string;
  connectionId: string;
  googleEmail: string;
};

type PropertyList = {
  accounts: Array<{
    id: string;
    email: string;
    connectedAt: string;
    available: boolean;
  }>;
  gsc: AccountProperty[];
  ga4: AccountProperty[];
  gbp: AccountProperty[];
  gbpAvailable: boolean;
  gbpMessage: string | null;
};

const workspaceProfiles: Record<
  WorkspaceKey,
  { name: string; domain: string }
> = {
  'everything-it': { name: 'Everything IT', domain: 'everythingit.ie' },
  'palo-verde': {
    name: 'Palo Verde Cancer Specialists',
    domain: 'pvhomed.com',
  },
  'az-web-corp': { name: 'AZ Web Corp', domain: 'azwebcorp.com' },
};

const rangeProfiles: Record<RangeKey, string> = {
  '7d': 'Last 7 days',
  '28d': 'Last 28 days',
  '90d': 'Last 90 days',
};

const navigation: Array<{
  key: ViewKey;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { key: 'live', label: 'Live', icon: Radio },
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'search', label: 'Search Console', icon: Search },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'business', label: 'Google Business', icon: Building2 },
  { key: 'pages', label: 'Landing pages', icon: FileText },
  { key: 'opportunities', label: 'Opportunities', icon: Lightbulb },
  { key: 'reports', label: 'Reports', icon: FileBarChart },
  { key: 'connectors', label: 'Data connections', icon: PlugZap },
];

const performanceConfig = {
  clicks: { label: 'Clicks', color: '#f63c13' },
  impressions: { label: 'Impressions', color: '#e6b84d' },
} satisfies ChartConfig;
const channelConfig = {
  users: { label: 'Active users', color: '#f63c13' },
} satisfies ChartConfig;
const analyticsConfig = {
  users: { label: 'Active users', color: '#f63c13' },
  sessions: { label: 'Sessions', color: '#e6b84d' },
} satisfies ChartConfig;

function initials(name: string) {
  return name
    .split(/\s|@/u)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function formatCompact(value: number) {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function changePhrase(value: number | null, label: string) {
  if (value === null) return `${label} is new for this comparison period`;
  if (Math.abs(value) < 0.5) return `${label} held steady`;
  return `${label} ${value > 0 ? 'increased' : 'decreased'} ${Math.abs(value).toFixed(1)}%`;
}

function expectedCtr(position: number) {
  if (position <= 3) return 0.12;
  if (position <= 5) return 0.07;
  if (position <= 10) return 0.035;
  if (position <= 20) return 0.015;
  return 0.0075;
}

function queryOpportunity(row: DashboardData['queries'][number]) {
  const attainableClicks = row.impressions * expectedCtr(row.position);
  return Math.max(0, Math.round(attainableClicks - row.clicks));
}

function bestQueryOpportunities(data: DashboardData) {
  return [...data.queries]
    .filter((row) => row.impressions >= 10 && row.position >= 3)
    .map((row) => ({ ...row, potentialClicks: queryOpportunity(row) }))
    .sort((a, b) => b.potentialClicks - a.potentialClicks)
    .slice(0, 8);
}

function opportunityAction(row: DashboardData['queries'][number]) {
  if (row.position <= 5 && row.ctr < 3)
    return 'Rewrite the title and description to win more clicks.';
  if (row.position <= 10)
    return 'Strengthen on-page relevance and internal links.';
  if (row.position <= 20)
    return 'Expand the page section that best answers this search.';
  return 'Create or consolidate a dedicated page for this intent.';
}

function propertyLooksRecommended(domain: string, name: string) {
  const normalizedDomain = domain.toLowerCase().replace(/^www\./u, '');
  const normalizedName = name.toLowerCase();
  const brand = normalizedDomain.split('.')[0]?.replaceAll('-', '') ?? '';
  return (
    normalizedName.includes(normalizedDomain) ||
    normalizedName.replaceAll(/[^a-z0-9]/gu, '').includes(brand)
  );
}

function googlePropertyKey(property: { id: string; connectionId: string }) {
  return JSON.stringify([property.connectionId, property.id]);
}

function mappedPropertyKey(mapping?: {
  connection_id: string;
  external_resource_id: string;
}) {
  return mapping
    ? googlePropertyKey({
        connectionId: mapping.connection_id,
        id: mapping.external_resource_id,
      })
    : '';
}

function mappingDomain(name: string) {
  return (
    name
      .toLowerCase()
      .match(/(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+(?:\.[a-z0-9-]+)+)/u)?.[1] ??
    null
  );
}

function connectionWarning(domain: string, propertyName?: string) {
  if (!propertyName) return null;
  const mappedDomain = mappingDomain(propertyName);
  if (
    !mappedDomain ||
    mappedDomain === domain ||
    mappedDomain.endsWith(`.${domain}`)
  )
    return null;
  return `This property appears to belong to ${mappedDomain}, not ${domain}.`;
}

function Change({
  value,
  inverse = false,
}: {
  value: number | null;
  inverse?: boolean;
}) {
  if (value === null)
    return <span className="text-xs text-muted-foreground">New</span>;
  const positive = inverse ? value <= 0 : value >= 0;
  const Icon = value >= 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-semibold ${positive ? 'text-[#4cc98a]' : 'text-[#ef8f8f]'}`}
    >
      <Icon className="size-3.5" />
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

function StatusDot({ color = 'green' }: { color?: 'green' | 'gold' }) {
  return (
    <span
      className={`inline-flex size-2 rounded-full ${color === 'green' ? 'bg-[#4cc98a]' : 'bg-[#e6b84d]'}`}
    />
  );
}

function AppNavigation({
  active,
  onChange,
  isAgencyAdmin,
}: {
  active: ViewKey;
  onChange: (view: ViewKey) => void;
  isAgencyAdmin: boolean;
}) {
  return (
    <nav aria-label="Portal sections" className="space-y-1 px-3">
      <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/75">
        Workspace
      </p>
      {navigation
        .filter((item) => isAgencyAdmin || item.key !== 'connectors')
        .map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${isActive ? 'bg-primary/12 font-semibold text-white ring-1 ring-primary/20' : 'text-[#aab2bd] hover:bg-white/5 hover:text-white'}`}
            >
              <Icon
                className={`size-4 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-white'}`}
              />
              {item.label}
            </button>
          );
        })}
    </nav>
  );
}

function SidebarContent({
  active,
  onChange,
  workspace,
  onWorkspaceChange,
  workspaceIds,
  isAgencyAdmin,
  signOutHref,
}: {
  active: ViewKey;
  onChange: (view: ViewKey) => void;
  workspace: WorkspaceKey;
  onWorkspaceChange: (workspace: WorkspaceKey) => void;
  workspaceIds: WorkspaceKey[];
  isAgencyAdmin: boolean;
  signOutHref: string;
}) {
  const profile = workspaceProfiles[workspace];
  return (
    <div className="flex h-full flex-col bg-[#080b10]">
      <div className="flex h-[76px] items-center border-b border-white/8 px-5">
        <Image
          src="/azwebcorp-logo.png"
          alt="AZ Web Corp"
          width={226}
          height={73}
          className="brand-logo h-auto w-40"
          priority
        />
      </div>
      <div className="p-3">
        <label className="block rounded-xl border border-white/8 bg-white/[0.035] p-3">
          <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Client account
          </span>
          <span className="relative block">
            <select
              value={workspace}
              onChange={(event) =>
                onWorkspaceChange(event.target.value as WorkspaceKey)
              }
              className="h-10 w-full appearance-none rounded-lg border border-white/10 bg-[#111823] px-3 pr-8 text-sm font-semibold text-white outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
              aria-label="Select client account"
            >
              {Object.entries(workspaceProfiles)
                .filter(([key]) => workspaceIds.includes(key as WorkspaceKey))
                .map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.name}
                  </option>
                ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" />
          </span>
          <span className="mt-2 flex items-center gap-1.5 text-[11px] text-[#4cc98a]">
            <CheckCircle2 className="size-3.5" /> {profile.domain}
          </span>
        </label>
      </div>
      <div className="mt-2 flex-1 overflow-y-auto scrollbar-subtle">
        <AppNavigation
          active={active}
          onChange={onChange}
          isAgencyAdmin={isAgencyAdmin}
        />
      </div>
      <div className="m-3 rounded-xl border border-white/8 bg-white/[0.035] p-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-white">
          <ShieldCheck className="size-4 text-[#4cc98a]" />{' '}
          {isAgencyAdmin ? 'Agency administrator' : 'Private client access'}
        </div>
        <p className="mt-1.5 text-[11px] leading-4 text-muted-foreground">
          Reporting is view-only. Each client login can be limited to its own
          workspace.
        </p>
      </div>
      <div className="border-t border-white/8 px-4 py-4">
        <a
          href={signOutHref}
          target="_top"
          className="flex items-center gap-2 text-xs font-medium text-muted-foreground transition hover:text-white"
        >
          <LogOut className="size-3.5" /> Sign out
        </a>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  change,
  note,
  icon: Icon,
  inverse = false,
}: {
  title: string;
  value: string;
  change: number | null;
  note: string;
  icon: typeof Eye;
  inverse?: boolean;
}) {
  return (
    <Card className="gap-0 border border-white/5 bg-[#101720]/92 py-0 shadow-none ring-0">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <span className="rounded-lg border border-white/8 bg-white/5 p-2 text-primary">
            <Icon className="size-4" />
          </span>
        </div>
        <div className="mt-4 flex items-end gap-2">
          <span className="text-2xl font-semibold tracking-[-0.035em] text-white sm:text-[1.8rem]">
            {value}
          </span>
          <span className="mb-1">
            <Change value={change} inverse={inverse} />
          </span>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}

function DataState({
  loading,
  error,
  setupRequired,
  onRetry,
  onSetup,
}: {
  loading: boolean;
  error: string | null;
  setupRequired: boolean;
  onRetry: () => void;
  onSetup: () => void;
}) {
  if (loading)
    return (
      <div className="grid min-h-[52vh] place-items-center rounded-2xl border border-white/8 bg-white/[0.025]">
        <div className="text-center">
          <LoaderCircle className="mx-auto size-7 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">
            Loading live Google data…
          </p>
        </div>
      </div>
    );
  if (setupRequired)
    return (
      <div className="grid min-h-[52vh] place-items-center rounded-2xl border border-[#e6b84d]/20 bg-[#e6b84d]/[0.045] p-8 text-center">
        <div className="max-w-md">
          <PlugZap className="mx-auto size-9 text-[#f5d47d]" />
          <h2 className="mt-4 text-xl font-semibold">
            Connect this client’s Google properties
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Select the correct Search Console and Analytics properties once. The
            dashboard will then load verified live data.
          </p>
          <Button className="mt-5" onClick={onSetup}>
            Open data connections <ArrowRight />
          </Button>
        </div>
      </div>
    );
  if (error)
    return (
      <div className="grid min-h-[52vh] place-items-center rounded-2xl border border-[#ef8f8f]/20 bg-[#ef8f8f]/[0.04] p-8 text-center">
        <div className="max-w-md">
          <h2 className="text-xl font-semibold">
            Live data could not be loaded
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {error}
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Button onClick={onRetry}>
              <RefreshCw /> Try again
            </Button>
            <Button variant="outline" onClick={onSetup}>
              Review connection
            </Button>
          </div>
        </div>
      </div>
    );
  return null;
}

function IntegrityAlert({
  data,
  onReview,
}: {
  data: DashboardData;
  onReview: () => void;
}) {
  if (!data.integrity.warning) return null;
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-[#e6b84d]/25 bg-[#e6b84d]/[0.055] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#e6b84d]/12 text-[#f5d47d]">
          <AlertTriangle className="size-4.5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-[#f5d47d]">
            Property mapping needs review
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {data.integrity.warning} Mixed properties can make an otherwise
            accurate report misleading.
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="shrink-0 border-[#e6b84d]/25 bg-[#e6b84d]/8"
        onClick={onReview}
      >
        Review mapping
      </Button>
    </div>
  );
}

function ExecutiveBrief({
  data,
  onView,
}: {
  data: DashboardData;
  onView: (view: ViewKey) => void;
}) {
  const opportunities = bestQueryOpportunities(data);
  const topOpportunity = opportunities[0];
  const improving = [
    data.changes.clicks,
    data.changes.impressions,
    data.changes.activeUsers,
    data.changes.engagementRate,
  ].filter((value) => value !== null && value > 0).length;
  return (
    <Card className="mb-4 overflow-hidden border border-primary/16 bg-[linear-gradient(120deg,rgb(246_60_19/10%),rgb(16_23_32/96%)_42%,rgb(230_184_77/6%))] ring-0">
      <CardContent className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#ff8a70]">
            <Sparkles className="size-3.5" /> Executive signal
          </div>
          <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em]">
            {improving >= 3
              ? 'Organic momentum is moving in the right direction.'
              : improving === 2
                ? 'Performance is mixed, with clear areas to build on.'
                : 'The next gains will come from focused optimization.'}
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {changePhrase(data.changes.clicks, 'Search clicks')};{' '}
            {changePhrase(
              data.changes.activeUsers,
              'organic users',
            ).toLowerCase()}
            .
            {topOpportunity
              ? ` “${topOpportunity.query}” is the strongest visible quick-win opportunity, with about ${topOpportunity.potentialClicks} additional clicks available at a stronger CTR.`
              : ' Keep expanding qualified impressions and improving snippets on ranking pages.'}
          </p>
        </div>
        <Button onClick={() => onView('opportunities')}>
          View opportunities <ArrowRight />
        </Button>
      </CardContent>
    </Card>
  );
}

function Overview({
  data,
  onView,
}: {
  data: DashboardData;
  onView: (view: ViewKey) => void;
}) {
  return (
    <>
      <ExecutiveBrief data={data} onView={onView} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Search clicks"
          value={formatCompact(data.metrics.clicks)}
          change={data.changes.clicks}
          note="Google Search Console"
          icon={MousePointerClick}
        />
        <MetricCard
          title="Impressions"
          value={formatCompact(data.metrics.impressions)}
          change={data.changes.impressions}
          note="Across Google Search"
          icon={Eye}
        />
        <MetricCard
          title="Organic users"
          value={formatCompact(data.metrics.activeUsers)}
          change={data.changes.activeUsers}
          note="Google Analytics 4"
          icon={UsersRound}
        />
        <MetricCard
          title="Average position"
          value={data.metrics.position.toFixed(1)}
          change={data.changes.position}
          note="Lower is better"
          icon={Target}
        />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(330px,0.65fr)]">
        <Card className="border border-white/5 bg-[#101720]/92 ring-0">
          <CardHeader>
            <CardTitle>Search performance</CardTitle>
            <CardDescription>
              Clicks and impressions from Google Search Console
            </CardDescription>
            <CardAction>
              <Badge
                variant="outline"
                className="border-white/10 text-muted-foreground"
              >
                Through {data.gscFinalizedThrough}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            {data.trend.length ? (
              <ChartContainer
                config={performanceConfig}
                className="h-[290px] w-full aspect-auto"
              >
                <AreaChart
                  data={data.trend}
                  margin={{ left: 4, right: 8, top: 12, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="clicks-fill"
                      x1="0"
                      x2="0"
                      y1="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="var(--color-clicks)"
                        stopOpacity={0.32}
                      />
                      <stop
                        offset="100%"
                        stopColor="var(--color-clicks)"
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
                    tickMargin={10}
                    minTickGap={26}
                  />
                  <YAxis yAxisId="clicks" hide />
                  <YAxis yAxisId="impressions" orientation="right" hide />
                  <ChartTooltip
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Area
                    yAxisId="impressions"
                    type="monotone"
                    dataKey="impressions"
                    stroke="var(--color-impressions)"
                    strokeWidth={1.5}
                    fill="transparent"
                    strokeOpacity={0.65}
                  />
                  <Area
                    yAxisId="clicks"
                    type="monotone"
                    dataKey="clicks"
                    stroke="var(--color-clicks)"
                    strokeWidth={2.5}
                    fill="url(#clicks-fill)"
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <p className="grid h-[290px] place-items-center text-sm text-muted-foreground">
                No finalized Search Console data in this period.
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="border border-white/5 bg-[#101720]/92 ring-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StatusDot /> Live visitors
            </CardTitle>
            <CardDescription>
              Active users in the last 30 minutes
            </CardDescription>
            <CardAction>
              <span className="text-3xl font-semibold">
                {data.metrics.liveUsers}
              </span>
            </CardAction>
          </CardHeader>
          <CardContent>
            {data.channels.length ? (
              <ChartContainer
                config={channelConfig}
                className="h-[220px] w-full aspect-auto"
              >
                <BarChart
                  data={data.channels.slice(0, 6)}
                  layout="vertical"
                  margin={{ left: 0, right: 12 }}
                >
                  <CartesianGrid
                    horizontal={false}
                    stroke="rgba(255,255,255,0.07)"
                  />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="source"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={88}
                  />
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Bar
                    dataKey="users"
                    radius={[0, 6, 6, 0]}
                    fill="var(--color-users)"
                    barSize={11}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="grid h-[220px] place-items-center text-sm text-muted-foreground">
                No acquisition rows available.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card className="border border-white/5 bg-[#101720]/92 ring-0">
          <CardHeader>
            <CardTitle>Top search queries</CardTitle>
            <CardDescription>Searches creating the most clicks</CardDescription>
            <CardAction>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView('search')}
              >
                View all <ArrowRight />
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-1">
            {data.queries.slice(0, 5).map((row, index) => (
              <div
                key={row.query}
                className="flex items-center gap-3 rounded-xl px-2 py-2.5"
              >
                <span className="grid size-7 place-items-center rounded-lg bg-white/5 text-xs text-muted-foreground">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {row.query}
                </span>
                <span className="text-sm tabular-nums">{row.clicks}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border border-white/5 bg-[#101720]/92 ring-0">
          <CardHeader>
            <CardTitle>Pages driving growth</CardTitle>
            <CardDescription>Organic clicks by landing page</CardDescription>
            <CardAction>
              <Button variant="ghost" size="sm" onClick={() => onView('pages')}>
                View all <ArrowRight />
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-1">
            {data.pages.slice(0, 5).map((page, index) => (
              <div
                key={page.url}
                className="flex items-center gap-3 rounded-xl px-2 py-2.5"
              >
                <span className="grid size-7 place-items-center rounded-lg bg-white/5 text-xs text-muted-foreground">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {page.path}
                </span>
                <span className="text-sm tabular-nums">{page.clicks}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function SearchView({ data }: { data: DashboardData }) {
  const [filter, setFilter] = useState('');
  const rows = data.queries.filter((row) =>
    row.query.toLowerCase().includes(filter.trim().toLowerCase()),
  );
  return (
    <section>
      <Badge className="border border-primary/20 bg-primary/10 text-[#ff8a70]">
        Google Search Console
      </Badge>
      <h2 className="mt-3 text-2xl font-semibold">Search performance</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Verified results from the connected Search Console property.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Clicks"
          value={formatCompact(data.metrics.clicks)}
          change={data.changes.clicks}
          note={data.rangeLabel}
          icon={MousePointerClick}
        />
        <MetricCard
          title="Impressions"
          value={formatCompact(data.metrics.impressions)}
          change={data.changes.impressions}
          note={data.rangeLabel}
          icon={Eye}
        />
        <MetricCard
          title="CTR"
          value={formatPercent(data.metrics.ctr)}
          change={null}
          note="Clicks ÷ impressions"
          icon={Target}
        />
        <MetricCard
          title="Average position"
          value={data.metrics.position.toFixed(1)}
          change={data.changes.position}
          note="Impression weighted"
          icon={Search}
        />
      </div>
      <Card className="mt-4 border border-white/5 bg-[#101720]/92 ring-0">
        <CardHeader>
          <CardTitle>Top queries</CardTitle>
          <CardDescription>
            Finalized through {data.gscFinalizedThrough}
          </CardDescription>
          <CardAction>
            <div className="relative block w-40 sm:w-56">
              <Search className="pointer-events-none absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder="Filter queries"
                className="h-9 border-white/10 bg-white/5 pl-9 text-xs"
                aria-label="Filter search queries"
              />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/8 hover:bg-transparent">
                <TableHead className="pl-4">Query</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
                <TableHead className="hidden text-right sm:table-cell">
                  Impressions
                </TableHead>
                <TableHead className="hidden text-right md:table-cell">
                  CTR
                </TableHead>
                <TableHead className="pr-4 text-right">Position</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.query} className="border-white/6">
                  <TableCell className="pl-4 font-medium">
                    {row.query}
                  </TableCell>
                  <TableCell className="text-right">{row.clicks}</TableCell>
                  <TableCell className="hidden text-right text-muted-foreground sm:table-cell">
                    {row.impressions}
                  </TableCell>
                  <TableCell className="hidden text-right text-muted-foreground md:table-cell">
                    {formatPercent(row.ctr)}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    {row.position.toFixed(1)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!rows.length && (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No queries match “{filter}”.
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function AnalyticsView({ data }: { data: DashboardData }) {
  return (
    <section>
      <Badge className="border border-primary/20 bg-primary/10 text-[#ff8a70]">
        Google Analytics 4
      </Badge>
      <h2 className="mt-3 text-2xl font-semibold">Traffic and engagement</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Realtime activity is separated from finalized daily reporting.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Active users"
          value={formatCompact(data.metrics.activeUsers)}
          change={data.changes.activeUsers}
          note={data.rangeLabel}
          icon={UsersRound}
        />
        <MetricCard
          title="Sessions"
          value={formatCompact(data.metrics.sessions)}
          change={data.changes.sessions}
          note={data.rangeLabel}
          icon={BarChart3}
        />
        <MetricCard
          title="Engagement rate"
          value={formatPercent(data.metrics.engagementRate)}
          change={data.changes.engagementRate}
          note="Engaged sessions"
          icon={CircleGauge}
        />
        <MetricCard
          title="Key events"
          value={formatCompact(data.metrics.keyEvents)}
          change={data.changes.keyEvents}
          note="Configured conversions"
          icon={Sparkles}
        />
      </div>
      <Card className="mt-4 border border-white/5 bg-[#101720]/92 ring-0">
        <CardHeader>
          <CardTitle>Audience trend</CardTitle>
          <CardDescription>
            Active users and sessions across the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.analyticsTrend.length ? (
            <ChartContainer
              config={analyticsConfig}
              className="h-[260px] w-full aspect-auto"
            >
              <AreaChart
                data={data.analyticsTrend}
                margin={{ left: 4, right: 8, top: 12, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="analytics-users-fill"
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="var(--color-users)"
                      stopOpacity={0.28}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--color-users)"
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
                  tickMargin={10}
                  minTickGap={26}
                />
                <YAxis hide />
                <ChartTooltip
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Area
                  type="monotone"
                  dataKey="sessions"
                  stroke="var(--color-sessions)"
                  strokeWidth={1.5}
                  fill="transparent"
                  strokeOpacity={0.75}
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="var(--color-users)"
                  strokeWidth={2.5}
                  fill="url(#analytics-users-fill)"
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <p className="grid h-[260px] place-items-center text-sm text-muted-foreground">
              No Analytics trend data is available for this period.
            </p>
          )}
        </CardContent>
      </Card>
      <Card className="mt-4 border border-white/5 bg-[#101720]/92 ring-0">
        <CardHeader>
          <CardTitle>Acquisition quality</CardTitle>
          <CardDescription>Users and engagement by channel</CardDescription>
          <CardAction>
            <Badge
              variant="outline"
              className="border-[#4cc98a]/25 bg-[#4cc98a]/8 text-[#75dca8]"
            >
              {data.metrics.liveUsers} live now
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.channels.map((channel) => (
            <div
              key={channel.source}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded-xl border border-white/7 bg-white/[0.025] p-3"
            >
              <div>
                <p className="text-sm font-medium">{channel.source}</p>
                <p className="text-[11px] text-muted-foreground">
                  Acquisition channel
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{channel.users}</p>
                <p className="text-[11px] text-muted-foreground">users</p>
              </div>
              <div className="w-20 text-right">
                <p className="font-semibold">
                  {formatPercent(channel.engagementRate)}
                </p>
                <p className="text-[11px] text-muted-foreground">engagement</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="border border-white/5 bg-[#101720]/92 ring-0">
          <CardHeader>
            <CardTitle>Traffic sources</CardTitle>
            <CardDescription>
              Source and medium behind each session
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {data.sources.slice(0, 7).map((source, index) => (
              <div
                key={`${source.source}-${index}`}
                className="flex items-center gap-3 rounded-xl px-1 py-2.5"
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-white/5 text-xs text-muted-foreground">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {source.source}
                </span>
                <span className="text-sm tabular-nums">{source.sessions}</span>
              </div>
            ))}
            {!data.sources.length && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No source data available.
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="border border-white/5 bg-[#101720]/92 ring-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MonitorSmartphone className="size-4 text-primary" /> Devices
            </CardTitle>
            <CardDescription>How visitors access the website</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.devices.slice(0, 5).map((device) => {
              const total = data.devices.reduce(
                (sum, item) => sum + item.users,
                0,
              );
              const share = total ? (device.users / total) * 100 : 0;
              return (
                <div key={device.device}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize">{device.device}</span>
                    <span className="font-semibold tabular-nums">
                      {share.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/7">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-[#ff8a70]"
                      style={{ width: `${Math.max(2, share)}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {!data.devices.length && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No device data available.
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="border border-white/5 bg-[#101720]/92 ring-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="size-4 text-primary" /> Top locations
            </CardTitle>
            <CardDescription>
              Cities producing the most active users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {data.locations.slice(0, 7).map((location, index) => (
              <div
                key={`${location.country}-${location.city}-${index}`}
                className="flex items-center gap-3 rounded-xl px-1 py-2.5"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {location.city}
                  </span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {location.country}
                  </span>
                </span>
                <span className="text-sm font-semibold tabular-nums">
                  {location.users}
                </span>
              </div>
            ))}
            {!data.locations.length && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No location data available.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function PagesView({ data }: { data: DashboardData }) {
  return (
    <section>
      <Badge className="border border-primary/20 bg-primary/10 text-[#ff8a70]">
        Content performance
      </Badge>
      <h2 className="mt-3 text-2xl font-semibold">Landing page intelligence</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Pages earning visibility and organic visits.
      </p>
      <Card className="mt-6 border border-white/5 bg-[#101720]/92 ring-0">
        <CardHeader>
          <CardTitle>Organic landing pages</CardTitle>
          <CardDescription>Search Console performance</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/8 hover:bg-transparent">
                <TableHead className="pl-4">Page</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
                <TableHead className="hidden text-right sm:table-cell">
                  Impressions
                </TableHead>
                <TableHead className="hidden text-right md:table-cell">
                  CTR
                </TableHead>
                <TableHead className="pr-4 text-right">Position</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.pages.map((page) => (
                <TableRow key={page.url} className="border-white/6">
                  <TableCell
                    className="max-w-72 truncate pl-4 font-medium"
                    title={page.url}
                  >
                    {page.path}
                  </TableCell>
                  <TableCell className="text-right">{page.clicks}</TableCell>
                  <TableCell className="hidden text-right text-muted-foreground sm:table-cell">
                    {page.impressions}
                  </TableCell>
                  <TableCell className="hidden text-right text-muted-foreground md:table-cell">
                    {formatPercent(page.ctr)}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    {page.position.toFixed(1)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}

function OpportunitiesView({ data }: { data: DashboardData }) {
  const opportunities = bestQueryOpportunities(data);
  const topPage = [...data.pages]
    .filter((page) => page.position >= 4 && page.position <= 20)
    .sort((a, b) => b.impressions - a.impressions)[0];
  const strongestSource =
    [...data.sources]
      .filter((source) => source.sessions >= 3)
      .sort((a, b) => b.engagementRate - a.engagementRate)[0] ??
    data.sources[0];
  const totalPotential = opportunities.reduce(
    (sum, row) => sum + row.potentialClicks,
    0,
  );
  return (
    <section>
      <Badge className="border border-primary/20 bg-primary/10 text-[#ff8a70]">
        Action center
      </Badge>
      <h2 className="mt-3 text-2xl font-semibold">Growth opportunities</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Prioritized from live visibility, rankings, CTR and audience quality.
      </p>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="border border-primary/15 bg-[linear-gradient(145deg,rgb(246_60_19/10%),rgb(16_23_32/96%))] ring-0">
          <CardHeader>
            <span className="mb-3 grid size-10 place-items-center rounded-xl bg-primary/12 text-primary">
              <Rocket className="size-5" />
            </span>
            <CardTitle>Estimated click upside</CardTitle>
            <CardDescription>
              From visible queries already earning impressions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-[-0.04em]">
              +{formatCompact(totalPotential)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              directional opportunity, not a forecast
            </p>
          </CardContent>
        </Card>
        <Card className="border border-white/5 bg-[#101720]/92 ring-0">
          <CardHeader>
            <span className="mb-3 grid size-10 place-items-center rounded-xl bg-[#e6b84d]/10 text-[#f5d47d]">
              <Trophy className="size-5" />
            </span>
            <CardTitle>Page to strengthen</CardTitle>
            <CardDescription>
              High visibility within striking distance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="truncate text-sm font-semibold" title={topPage?.url}>
              {topPage?.path ?? 'No clear page opportunity yet'}
            </p>
            {topPage && (
              <p className="mt-2 text-xs text-muted-foreground">
                {formatCompact(topPage.impressions)} impressions · position{' '}
                {topPage.position.toFixed(1)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="border border-white/5 bg-[#101720]/92 ring-0">
          <CardHeader>
            <span className="mb-3 grid size-10 place-items-center rounded-xl bg-[#4cc98a]/10 text-[#75dca8]">
              <TrendingUp className="size-5" />
            </span>
            <CardTitle>Quality acquisition</CardTitle>
            <CardDescription>Most engaged visible source</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="truncate text-sm font-semibold">
              {strongestSource?.source ?? 'No source data yet'}
            </p>
            {strongestSource && (
              <p className="mt-2 text-xs text-muted-foreground">
                {formatPercent(strongestSource.engagementRate)} engagement ·{' '}
                {strongestSource.sessions} sessions
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      <Card className="mt-4 border border-white/5 bg-[#101720]/92 ring-0">
        <CardHeader>
          <CardTitle>Priority keyword actions</CardTitle>
          <CardDescription>
            Ranked by estimated incremental clicks at a stronger CTR
          </CardDescription>
          <CardAction>
            <Badge
              variant="outline"
              className="border-[#e6b84d]/25 bg-[#e6b84d]/8 text-[#f5d47d]"
            >
              {opportunities.length} opportunities
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="px-0">
          {opportunities.length ? (
            <Table>
              <TableHeader>
                <TableRow className="border-white/8 hover:bg-transparent">
                  <TableHead className="pl-4">Search query</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">
                    Impressions
                  </TableHead>
                  <TableHead className="text-right">Position</TableHead>
                  <TableHead className="hidden text-right md:table-cell">
                    Upside
                  </TableHead>
                  <TableHead className="hidden w-[38%] lg:table-cell">
                    Recommended action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {opportunities.map((row) => (
                  <TableRow key={row.query} className="border-white/6">
                    <TableCell className="max-w-64 pl-4 font-medium">
                      {row.query}
                    </TableCell>
                    <TableCell className="hidden text-right text-muted-foreground sm:table-cell">
                      {row.impressions}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.position.toFixed(1)}
                    </TableCell>
                    <TableCell className="hidden text-right font-semibold text-[#75dca8] md:table-cell">
                      +{row.potentialClicks}
                    </TableCell>
                    <TableCell className="hidden text-xs leading-5 text-muted-foreground lg:table-cell">
                      {opportunityAction(row)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="px-6 py-14 text-center">
              <Lightbulb className="mx-auto size-8 text-[#f5d47d]" />
              <p className="mt-3 text-sm font-semibold">
                No strong query opportunities yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                More finalized Search Console data will reveal opportunities.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function ReportsView({
  data,
  onExport,
  onPrint,
}: {
  data: DashboardData;
  onExport: () => void;
  onPrint: () => void;
}) {
  return (
    <section>
      <Badge className="border border-primary/20 bg-primary/10 text-[#ff8a70]">
        Client reporting
      </Badge>
      <h2 className="mt-3 text-2xl font-semibold">Reports</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Export the selected client’s verified performance snapshot.
      </p>
      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="border border-white/5 bg-[#101720]/92 ring-0">
          <CardHeader>
            <CardTitle>Current-period snapshot</CardTitle>
            <CardDescription>
              {data.site.name} · {data.rangeLabel}
            </CardDescription>
            <CardAction>
              <Badge
                variant="outline"
                className="border-[#4cc98a]/25 bg-[#4cc98a]/8 text-[#75dca8]"
              >
                Live data
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="mb-4 rounded-xl border border-primary/12 bg-primary/[0.045] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#ff8a70]">
                Executive summary
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {changePhrase(data.changes.clicks, 'Search clicks')};{' '}
                {changePhrase(
                  data.changes.impressions,
                  'visibility',
                ).toLowerCase()}
                ;{' '}
                {changePhrase(
                  data.changes.activeUsers,
                  'active users',
                ).toLowerCase()}
                .
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/7 bg-white/[0.025] p-4">
                <p className="text-xs text-muted-foreground">Search clicks</p>
                <p className="mt-2 text-2xl font-semibold">
                  {formatCompact(data.metrics.clicks)}
                </p>
              </div>
              <div className="rounded-xl border border-white/7 bg-white/[0.025] p-4">
                <p className="text-xs text-muted-foreground">Sessions</p>
                <p className="mt-2 text-2xl font-semibold">
                  {formatCompact(data.metrics.sessions)}
                </p>
              </div>
              <div className="rounded-xl border border-white/7 bg-white/[0.025] p-4">
                <p className="text-xs text-muted-foreground">Key events</p>
                <p className="mt-2 text-2xl font-semibold">
                  {formatCompact(data.metrics.keyEvents)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-white/5 bg-[#101720]/92 ring-0">
          <CardHeader>
            <span className="mb-3 grid size-10 place-items-center rounded-xl bg-primary/12 text-primary">
              <Download className="size-5" />
            </span>
            <CardTitle>Export snapshot</CardTitle>
            <CardDescription>
              Download a detailed CSV or print a presentation-ready report.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto space-y-2">
            <Button className="w-full" onClick={onExport}>
              <Download /> Download CSV
            </Button>
            <Button
              variant="outline"
              className="w-full border-white/10 bg-white/5"
              onClick={onPrint}
            >
              <Printer /> Print or save PDF
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function ConnectionsSection({
  onMapped,
}: {
  onMapped: (siteId: WorkspaceKey) => void;
}) {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [properties, setProperties] = useState<PropertyList | null>(null);
  const [selections, setSelections] = useState<
    Record<string, { gscId: string; ga4Id: string; gbpId: string }>
  >({});
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    const response = await fetch('/api/google/status', { cache: 'no-store' });
    const payload = (await response.json()) as StatusData;
    setStatus(payload);
    const initial: Record<
      string,
      { gscId: string; ga4Id: string; gbpId: string }
    > = {};
    for (const site of payload.sites)
      initial[site.id] = {
        gscId: mappedPropertyKey(
          payload.mappings.find(
            (mapping) =>
              mapping.site_id === site.id && mapping.provider === 'gsc',
          ),
        ),
        ga4Id: mappedPropertyKey(
          payload.mappings.find(
            (mapping) =>
              mapping.site_id === site.id && mapping.provider === 'ga4',
          ),
        ),
        gbpId: mappedPropertyKey(
          payload.mappings.find(
            (mapping) =>
              mapping.site_id === site.id && mapping.provider === 'gbp',
          ),
        ),
      };
    setSelections(initial);
    if (payload.connected) {
      const propertyResponse = await fetch('/api/google/properties', {
        cache: 'no-store',
      });
      const propertyPayload =
        (await propertyResponse.json()) as PropertyList & { error?: string };
      if (propertyResponse.ok) setProperties(propertyPayload);
      else
        setMessage(
          propertyPayload.error ?? 'Google properties could not be loaded.',
        );
    }
  }, []);
  useEffect(() => {
    const timeout = window.setTimeout(() => void loadStatus(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadStatus]);

  async function save(siteId: WorkspaceKey) {
    const selection = selections[siteId];
    const gsc = properties?.gsc.find(
      (property) => googlePropertyKey(property) === selection.gscId,
    );
    const ga4 = properties?.ga4.find(
      (property) => googlePropertyKey(property) === selection.ga4Id,
    );
    const gbp = selection.gbpId
      ? properties?.gbp.find(
          (property) => googlePropertyKey(property) === selection.gbpId,
        )
      : null;
    if (!gsc || !ga4 || (selection.gbpId && !gbp)) {
      setMessage('Choose properties from the connected Google accounts.');
      return;
    }
    setSaving(siteId);
    setMessage(null);
    const response = await fetch('/api/google/mappings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        siteId,
        gscId: gsc.id,
        gscConnectionId: gsc.connectionId,
        ga4Id: ga4.id,
        ga4ConnectionId: ga4.connectionId,
        gbpId: gbp?.id,
        gbpConnectionId: gbp?.connectionId,
      }),
    });
    const payload = (await response.json()) as { error?: string };
    setSaving(null);
    if (!response.ok)
      return setMessage(payload.error ?? 'The mapping could not be saved.');
    setMessage(
      `${workspaceProfiles[siteId].name} is connected to live Google data.`,
    );
    await loadStatus();
    onMapped(siteId);
  }

  if (!status)
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <LoaderCircle className="size-7 animate-spin text-primary" />
      </div>
    );
  return (
    <section>
      <Badge className="border border-primary/20 bg-primary/10 text-[#ff8a70]">
        Owner setup
      </Badge>
      <h2 className="mt-3 text-2xl font-semibold">Data connections</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Connect one or more Google accounts, then map each client service to the
        account that owns it.
      </p>
      {!status.configurationReady ? (
        <Card className="mt-6 border border-[#e6b84d]/20 bg-[#e6b84d]/[0.045] ring-0">
          <CardHeader>
            <span className="mb-3 grid size-10 place-items-center rounded-xl bg-[#e6b84d]/10 text-[#f5d47d]">
              <PlugZap className="size-5" />
            </span>
            <CardTitle>Google authorization setup required</CardTitle>
            <CardDescription>
              The portal code is ready. Add the Google OAuth client ID and
              secret, enable the Search Console, Analytics and Business Profile
              APIs, and register this callback URL:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <code className="block overflow-x-auto rounded-xl border border-white/8 bg-black/20 p-3 text-xs text-[#f5d47d]">
              {status.redirectUri}
            </code>
          </CardContent>
        </Card>
      ) : !status.connected ? (
        <Card className="mt-6 max-w-xl border border-white/6 bg-[#101720]/92 ring-0">
          <CardHeader>
            <span className="mb-3 grid size-10 place-items-center rounded-xl bg-primary/12 text-primary">
              <PlugZap className="size-5" />
            </span>
            <CardTitle>Connect Google</CardTitle>
            <CardDescription>
              Start with any Google account that can access a client’s GA4,
              Search Console or Business Profile properties. You can add other
              accounts afterward. The portal only performs reporting reads.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* oxlint-disable-next-line next/no-html-link-for-pages -- OAuth must use a full browser navigation. */}
            <a
              href="/api/google/connect"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary/90"
            >
              Authorize Google <ArrowRight className="size-4" />
            </a>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-[#4cc98a]/20 bg-[#4cc98a]/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold">
                <StatusDot /> Google accounts connected
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {status.googleAccounts.map((account) => (
                  <Badge
                    key={account.id}
                    variant="outline"
                    className="border-white/10 bg-black/10 text-[10px] text-muted-foreground"
                  >
                    {account.email}
                  </Badge>
                ))}
              </div>
            </div>
            {/* oxlint-disable-next-line next/no-html-link-for-pages -- OAuth must use a full browser navigation. */}
            <a
              href="/api/google/connect"
              className="text-xs font-semibold text-[#75dca8] hover:text-white"
            >
              + Add another Google account
            </a>
          </div>
          {message && (
            <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.035] p-3 text-sm text-muted-foreground">
              {message}
            </div>
          )}
          <div className="mt-4 grid gap-4 xl:grid-cols-3">
            {status.sites.map((site) => {
              const selection = selections[site.id] ?? {
                gscId: '',
                ga4Id: '',
                gbpId: '',
              };
              const mappedGsc = status.mappings.find(
                (mapping) =>
                  mapping.site_id === site.id && mapping.provider === 'gsc',
              );
              const mappedGa4 = status.mappings.find(
                (mapping) =>
                  mapping.site_id === site.id && mapping.provider === 'ga4',
              );
              const mappedGbp = status.mappings.find(
                (mapping) =>
                  mapping.site_id === site.id && mapping.provider === 'gbp',
              );
              const ga4Warning = connectionWarning(
                site.domain,
                mappedGa4?.display_name,
              );
              const fullyMapped = Boolean(mappedGsc && mappedGa4);
              return (
                <Card
                  key={site.id}
                  className="border border-white/6 bg-[#101720]/92 ring-0"
                >
                  <CardHeader>
                    <CardTitle>{site.name}</CardTitle>
                    <CardDescription>{site.domain}</CardDescription>
                    <CardAction>
                      <Badge
                        variant="outline"
                        className={
                          ga4Warning
                            ? 'border-[#e6b84d]/25 bg-[#e6b84d]/8 text-[#f5d47d]'
                            : fullyMapped
                              ? 'border-[#4cc98a]/25 bg-[#4cc98a]/8 text-[#75dca8]'
                              : 'border-white/10 text-muted-foreground'
                        }
                      >
                        {ga4Warning
                          ? 'Review mapping'
                          : fullyMapped
                            ? mappedGbp
                              ? 'All connected'
                              : 'SEO connected'
                            : 'Setup needed'}
                      </Badge>
                    </CardAction>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {ga4Warning && (
                      <div className="flex gap-2 rounded-xl border border-[#e6b84d]/20 bg-[#e6b84d]/[0.05] p-3 text-xs leading-5 text-muted-foreground">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#f5d47d]" />
                        <span>{ga4Warning}</span>
                      </div>
                    )}
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                        Search Console
                      </span>
                      <select
                        value={selection.gscId}
                        onChange={(event) =>
                          setSelections((current) => ({
                            ...current,
                            [site.id]: {
                              ...selection,
                              gscId: event.target.value,
                            },
                          }))
                        }
                        className="h-10 w-full rounded-lg border border-white/10 bg-[#111823] px-3 text-sm outline-none focus:border-primary"
                      >
                        <option value="">Choose property</option>
                        {properties?.gsc.map((property) => (
                          <option
                            key={googlePropertyKey(property)}
                            value={googlePropertyKey(property)}
                          >
                            {property.name} · {property.googleEmail}
                            {propertyLooksRecommended(
                              site.domain,
                              property.name,
                            )
                              ? ' · Recommended'
                              : ''}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                        Google Analytics 4
                      </span>
                      <select
                        value={selection.ga4Id}
                        onChange={(event) =>
                          setSelections((current) => ({
                            ...current,
                            [site.id]: {
                              ...selection,
                              ga4Id: event.target.value,
                            },
                          }))
                        }
                        className="h-10 w-full rounded-lg border border-white/10 bg-[#111823] px-3 text-sm outline-none focus:border-primary"
                      >
                        <option value="">Choose property</option>
                        {properties?.ga4.map((property) => (
                          <option
                            key={googlePropertyKey(property)}
                            value={googlePropertyKey(property)}
                          >
                            {property.name} · {property.note} ·{' '}
                            {property.googleEmail}
                            {propertyLooksRecommended(
                              site.domain,
                              `${property.name} ${property.note}`,
                            )
                              ? ' · Recommended'
                              : ''}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground">
                        <span>Google Business Profile</span>
                        <span className="text-[10px] text-[#e6b84d]">
                          Local listing
                        </span>
                      </span>
                      <select
                        value={selection.gbpId}
                        onChange={(event) =>
                          setSelections((current) => ({
                            ...current,
                            [site.id]: {
                              ...selection,
                              gbpId: event.target.value,
                            },
                          }))
                        }
                        disabled={!properties?.gbpAvailable}
                        className="h-10 w-full rounded-lg border border-white/10 bg-[#111823] px-3 text-sm outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        <option value="">Choose listing</option>
                        {properties?.gbp.map((property) => (
                          <option
                            key={googlePropertyKey(property)}
                            value={googlePropertyKey(property)}
                          >
                            {property.name}
                            {property.note ? ` · ${property.note}` : ''}
                            {` · ${property.googleEmail}`}
                            {propertyLooksRecommended(
                              site.domain,
                              `${property.name} ${property.note}`,
                            )
                              ? ' · Recommended'
                              : ''}
                          </option>
                        ))}
                      </select>
                      {!properties?.gbpAvailable && (
                        <span className="mt-1.5 block text-[10px] leading-4 text-[#f5d47d]">
                          {properties?.gbpMessage ??
                            'Reconnect Google after Business Profile API access is enabled.'}
                        </span>
                      )}
                    </label>
                    <Button
                      className="w-full"
                      disabled={
                        !selection.gscId ||
                        !selection.ga4Id ||
                        saving === site.id
                      }
                      onClick={() => void save(site.id)}
                    >
                      {saving === site.id ? (
                        <>
                          <LoaderCircle className="animate-spin" /> Saving
                        </>
                      ) : (
                        <>
                          <CheckCircle2 /> Save connection
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

export function SeoDashboard({
  userName,
  signOutHref,
  workspaceIds,
  isAgencyAdmin,
}: {
  userName: string;
  signOutHref: string;
  workspaceIds: WorkspaceKey[];
  isAgencyAdmin: boolean;
}) {
  const [range, setRange] = useState<RangeKey>('28d');
  const [workspace, setWorkspace] = useState<WorkspaceKey>(
    workspaceIds[0] ?? 'everything-it',
  );
  const [activeView, setActiveView] = useState<ViewKey>('live');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [setupRequired, setSetupRequired] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const profile = workspaceProfiles[workspace];
  const loadData = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      setSetupRequired(false);
      try {
        const response = await fetch(
          `/api/dashboard?siteId=${workspace}&range=${range}`,
          { cache: 'no-store', signal },
        );
        const payload = (await response.json()) as DashboardData & {
          error?: string;
          code?: string;
        };
        if (!response.ok) {
          if (
            payload.code === 'SITE_NOT_MAPPED' ||
            payload.code === 'GOOGLE_NOT_CONNECTED'
          )
            setSetupRequired(true);
          else setError(payload.error ?? 'Live reporting could not be loaded.');
          setData(null);
        } else setData(payload);
      } catch (caught) {
        if ((caught as Error).name !== 'AbortError')
          setError('The request was interrupted. Please try again.');
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [range, workspace],
  );
  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(
      () => void loadData(controller.signal),
      0,
    );
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [loadData, refreshKey]);
  const exportSnapshot = useCallback(() => {
    if (!data) return;
    const rows: string[][] = [
      ['AZ Web Corp SEO Portal snapshot'],
      ['Client', data.site.name],
      ['Domain', data.site.domain],
      ['Period', data.rangeLabel],
      ['Generated', new Date().toISOString()],
      ['Search Console property', data.integrity.gsc.name],
      ['Analytics property', data.integrity.ga4.name],
      ...(data.integrity.warning
        ? [['DATA QUALITY WARNING', data.integrity.warning]]
        : []),
      [],
      ['PERFORMANCE SUMMARY'],
      ['Metric', 'Current value', 'Change vs previous period'],
      [
        'Search clicks',
        String(data.metrics.clicks),
        data.changes.clicks === null
          ? 'New'
          : `${data.changes.clicks.toFixed(1)}%`,
      ],
      [
        'Impressions',
        String(data.metrics.impressions),
        data.changes.impressions === null
          ? 'New'
          : `${data.changes.impressions.toFixed(1)}%`,
      ],
      ['CTR', formatPercent(data.metrics.ctr), ''],
      [
        'Average position',
        data.metrics.position.toFixed(1),
        data.changes.position === null
          ? 'New'
          : `${data.changes.position.toFixed(1)}% improvement`,
      ],
      [
        'Active users',
        String(data.metrics.activeUsers),
        data.changes.activeUsers === null
          ? 'New'
          : `${data.changes.activeUsers.toFixed(1)}%`,
      ],
      [
        'Sessions',
        String(data.metrics.sessions),
        data.changes.sessions === null
          ? 'New'
          : `${data.changes.sessions.toFixed(1)}%`,
      ],
      [
        'Engagement rate',
        formatPercent(data.metrics.engagementRate),
        data.changes.engagementRate === null
          ? 'New'
          : `${data.changes.engagementRate.toFixed(1)}%`,
      ],
      [
        'Key events',
        String(data.metrics.keyEvents),
        data.changes.keyEvents === null
          ? 'New'
          : `${data.changes.keyEvents.toFixed(1)}%`,
      ],
      [],
      ['TOP SEARCH QUERIES'],
      ['Query', 'Clicks', 'Impressions', 'CTR', 'Position'],
      ...data.queries
        .slice(0, 25)
        .map((row) => [
          row.query,
          String(row.clicks),
          String(row.impressions),
          formatPercent(row.ctr),
          row.position.toFixed(1),
        ]),
      [],
      ['TOP LANDING PAGES'],
      ['Page', 'Clicks', 'Impressions', 'CTR', 'Position'],
      ...data.pages
        .slice(0, 25)
        .map((row) => [
          row.url,
          String(row.clicks),
          String(row.impressions),
          formatPercent(row.ctr),
          row.position.toFixed(1),
        ]),
      [],
      ['TRAFFIC SOURCES'],
      ['Source / medium', 'Users', 'Sessions', 'Engagement rate'],
      ...data.sources
        .slice(0, 20)
        .map((row) => [
          row.source,
          String(row.users),
          String(row.sessions),
          formatPercent(row.engagementRate),
        ]),
      [],
      ['TOP LOCATIONS'],
      ['City', 'Country', 'Users', 'Sessions', 'Engagement rate'],
      ...data.locations
        .slice(0, 20)
        .map((row) => [
          row.city,
          row.country,
          String(row.users),
          String(row.sessions),
          formatPercent(row.engagementRate),
        ]),
    ];
    const csv = rows
      .map((row) =>
        row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(','),
      )
      .join('\n');
    const url = URL.createObjectURL(
      new Blob([csv], { type: 'text/csv;charset=utf-8' }),
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${workspace}-${range}-seo-snapshot.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [data, range, workspace]);
  const printReport = useCallback(() => window.print(), []);
  const sidebarProps = {
    active: activeView,
    onChange: setActiveView,
    workspace,
    onWorkspaceChange: setWorkspace,
    workspaceIds,
    isAgencyAdmin,
    signOutHref,
  };
  const content = useMemo(() => {
    if (activeView === 'connectors')
      return (
        <ConnectionsSection
          onMapped={(siteId) => {
            setWorkspace(siteId);
            setRefreshKey((key) => key + 1);
          }}
        />
      );
    if (activeView === 'live')
      return (
        <LiveView
          workspace={workspace}
          onSetup={() => setActiveView('connectors')}
        />
      );
    if (activeView === 'business')
      return (
        <BusinessProfileView
          workspace={workspace}
          onSetup={() => setActiveView('connectors')}
        />
      );
    const state = (
      <DataState
        loading={loading}
        error={error}
        setupRequired={setupRequired}
        onRetry={() => setRefreshKey((key) => key + 1)}
        onSetup={() => setActiveView('connectors')}
      />
    );
    if (!data) return state;
    if (activeView === 'overview')
      return <Overview data={data} onView={setActiveView} />;
    if (activeView === 'search') return <SearchView data={data} />;
    if (activeView === 'analytics') return <AnalyticsView data={data} />;
    if (activeView === 'pages') return <PagesView data={data} />;
    if (activeView === 'opportunities')
      return <OpportunitiesView data={data} />;
    return (
      <ReportsView
        data={data}
        onExport={exportSnapshot}
        onPrint={printReport}
      />
    );
  }, [
    activeView,
    data,
    error,
    exportSnapshot,
    loading,
    printReport,
    setupRequired,
    workspace,
  ]);
  return (
    <div className="portal-shell min-h-screen bg-[#07090d] text-white">
      <aside className="portal-sidebar fixed inset-y-0 left-0 z-30 hidden w-[252px] border-r border-white/8 lg:block">
        <SidebarContent {...sidebarProps} />
      </aside>
      <div className="lg:pl-[252px]">
        <header className="portal-header sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-white/8 bg-[#090d12]/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-white/8 bg-white/5 lg:hidden"
                  />
                }
              >
                <Menu />
                <span className="sr-only">Open navigation</span>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[286px] border-white/8 bg-[#080b10] p-0"
              >
                <SheetHeader className="sr-only">
                  <SheetTitle>Portal navigation</SheetTitle>
                  <SheetDescription>
                    Choose a client and portal section.
                  </SheetDescription>
                </SheetHeader>
                <SidebarContent {...sidebarProps} />
              </SheetContent>
            </Sheet>
            <div>
              <p className="text-[11px] text-muted-foreground">
                {activeView === 'overview'
                  ? 'Performance overview'
                  : navigation.find((item) => item.key === activeView)?.label}
              </p>
              <h1 className="text-sm font-semibold sm:text-base">
                {profile.name}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="hidden border-[#4cc98a]/25 bg-[#4cc98a]/8 text-[#75dca8] sm:inline-flex"
            >
              {isAgencyAdmin ? 'Owner only' : 'Client workspace'}
            </Badge>
            <Avatar>
              <AvatarFallback className="bg-primary/15 font-semibold text-[#ff8a70]">
                {initials(userName)}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>
        <ClientNewsTicker workspace={workspace} />
        <main className="portal-main relative mx-auto w-full max-w-[1540px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <div className="portal-watermark pointer-events-none fixed bottom-8 right-8 z-0 hidden opacity-[0.025] lg:block">
            <Image
              src="/azwebcorp-logo.png"
              alt=""
              width={452}
              height={146}
              className="brand-logo w-[430px]"
              aria-hidden="true"
            />
          </div>
          <div className="relative z-[1]">
            {activeView === 'overview' && (
              <PartnershipBanner workspace={workspace} />
            )}
            {!['connectors', 'live', 'business'].includes(activeView) && (
              <div className="portal-toolbar mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Globe2 className="size-3.5" /> {profile.domain}
                    {data && (
                      <>
                        <span aria-hidden="true">•</span>
                        <span className="inline-flex items-center gap-1.5">
                          <StatusDot /> Live Google data
                        </span>
                        <span aria-hidden="true">•</span>
                        <span>Updated {formatUpdatedAt(data.updatedAt)}</span>
                      </>
                    )}
                  </div>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
                    Organic growth at a glance
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    What changed, where visitors came from, and the pages
                    creating demand.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <select
                      value={range}
                      onChange={(event) =>
                        setRange(event.target.value as RangeKey)
                      }
                      className="h-9 appearance-none rounded-lg border border-white/10 bg-[#111823] pl-9 pr-9 text-xs font-semibold outline-none focus:border-primary/60"
                      aria-label="Reporting period"
                    >
                      {Object.entries(rangeProfiles).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-2.5 size-4 text-muted-foreground" />
                  </label>
                  <Button
                    variant="outline"
                    className="border-white/10 bg-white/5"
                    onClick={() => setRefreshKey((key) => key + 1)}
                    disabled={loading}
                  >
                    <RefreshCw className={loading ? 'animate-spin' : ''} />{' '}
                    Refresh
                  </Button>
                  <Button onClick={exportSnapshot} disabled={!data}>
                    <Download /> Export
                  </Button>
                </div>
              </div>
            )}
            {data &&
              !['connectors', 'live', 'business'].includes(activeView) && (
                <IntegrityAlert
                  data={data}
                  onReview={() => setActiveView('connectors')}
                />
              )}
            {content}
          </div>
        </main>
      </div>
    </div>
  );
}
