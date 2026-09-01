# AZ Web Corp SEO Portal

A multi-tenant client-reporting dashboard that pulls live Google Search Console and Google Analytics 4 data per client workspace, with real-time visitor tracking and role-based access control.

## What it does

- **Live visitor tracking** — real-time active-visitor map, per-minute audience pulse, top pages being viewed, all refreshed automatically.
- **Search Console & Analytics reporting** — clicks, impressions, position trends, and audience metrics pulled directly from Google's APIs per connected property.
- **Multi-tenant workspace model** — each client is an isolated tenant; a user's access is scoped to only the workspace(s) they're a member of via a `tenants` / `users` / `memberships` relationship, with distinct agency-admin, agency-staff, client-admin and client-viewer roles.
- **Google OAuth data connections** — clients connect their own GSC/GA4 properties via OAuth; tokens are encrypted at rest and scoped per tenant.
- **Local business profile view** — surfaces Google Business Profile data alongside search performance.

## Stack

- **Next.js (App Router)** — UI and API routes
- **Cloudflare Workers + D1** — edge hosting and serverless SQL database
- **Drizzle ORM** — schema, migrations, typed queries
- **ChatGPT platform auth** — sign-in via trusted `oai-authenticated-user-*` headers from the hosting platform
- **shadcn/ui components** — dashboard UI primitives

## Project structure

```
app/                  Next.js routes (pages + API)
  api/
    dashboard/        Aggregated per-site metrics endpoint
    google/           OAuth connect/callback/status/property mapping
    live/             Real-time visitor feed
    news/             Industry-relevant news feed per workspace
  dashboard/           Main dashboard page
components/            Dashboard UI (charts, live globe, business profile view, etc.)
db/
  schema.ts            Drizzle schema: tenants, users, memberships, sites,
                        Google connections, GA4/GSC daily rollups, audit log
lib/
  portal.ts            Workspace registry + access-control resolution
  google.ts            Google OAuth + API client helpers
  reporting.ts          Metric aggregation logic
drizzle/                Generated SQL migrations
```

## Data model

Access control is table-driven, not hardcoded: a `memberships` row links a `user` to a `tenant` with a `role` (`agency_admin`, `agency_staff`, `client_admin`, `client_viewer`). Each `tenant` owns one or more `sites`, each `site` can have one or more `data_sources` (a GA4 or GSC property) tied to a `google_connections` record holding an encrypted refresh token. Daily metric rollups (`ga4_daily_totals`, `gsc_daily_totals`, `gsc_daily_breakdowns`) are pre-aggregated per site/date rather than queried live from Google on every page load.

## Running locally

```bash
npm install
cp .env.example .env   # fill in Google OAuth credentials + a token encryption key
npm run dev
```

Requires a Google Cloud OAuth client (Search Console + Analytics Data API scopes) and a Cloudflare D1 database bound as `DB` (see `drizzle.config.ts`).

## Note on demo data

The workspace examples in this repo (`northstar-msp`, `meridian-health`) are fictional placeholders standing in for real client workspaces — this project was originally built as an internal tool for a live multi-client agency, and client-identifying details have been generalized for this public copy. The architecture, schema and logic are unchanged.
