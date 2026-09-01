import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

export const tenants = sqliteTable(
  'tenants',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    timezone: text('timezone').notNull().default('UTC'),
    status: text('status', { enum: ['active', 'suspended'] })
      .notNull()
      .default('active'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [uniqueIndex('tenants_slug_unique').on(table.slug)],
);

export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    authSubject: text('auth_subject').notNull(),
    email: text('email').notNull(),
    displayName: text('display_name').notNull(),
    createdAt: text('created_at').notNull(),
    lastLoginAt: text('last_login_at'),
  },
  (table) => [
    uniqueIndex('users_auth_subject_unique').on(table.authSubject),
    index('users_email_idx').on(table.email),
  ],
);

export const memberships = sqliteTable(
  'memberships',
  {
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role', {
      enum: ['agency_admin', 'agency_staff', 'client_admin', 'client_viewer'],
    }).notNull(),
    status: text('status', { enum: ['active', 'disabled'] })
      .notNull()
      .default('active'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.tenantId, table.userId] }),
    index('memberships_user_tenant_idx').on(table.userId, table.tenantId),
  ],
);

export const invitations = sqliteTable(
  'invitations',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    role: text('role', { enum: ['client_admin', 'client_viewer'] }).notNull(),
    tokenHash: text('token_hash').notNull(),
    expiresAt: text('expires_at').notNull(),
    acceptedAt: text('accepted_at'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('invitations_tenant_email_idx').on(table.tenantId, table.email),
  ],
);

export const oauthStates = sqliteTable(
  'oauth_states',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    codeVerifier: text('code_verifier').notNull(),
    returnTo: text('return_to').notNull().default('/dashboard'),
    expiresAt: text('expires_at').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('oauth_states_user_expires_idx').on(table.userId, table.expiresAt),
  ],
);

export const sites = sqliteTable(
  'sites',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    canonicalUrl: text('canonical_url').notNull(),
    timezone: text('timezone').notNull().default('UTC'),
    status: text('status', { enum: ['active', 'archived'] })
      .notNull()
      .default('active'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    uniqueIndex('sites_tenant_url_unique').on(
      table.tenantId,
      table.canonicalUrl,
    ),
    index('sites_tenant_status_idx').on(table.tenantId, table.status),
  ],
);

export const googleConnections = sqliteTable(
  'google_connections',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    googleSubject: text('google_subject').notNull(),
    googleEmail: text('google_email').notNull(),
    scopesJson: text('scopes_json').notNull(),
    refreshCiphertext: text('refresh_ciphertext'),
    refreshNonce: text('refresh_nonce'),
    keyVersion: integer('key_version'),
    status: text('status', { enum: ['active', 'expired', 'revoked'] })
      .notNull()
      .default('active'),
    connectedBy: text('connected_by')
      .notNull()
      .references(() => users.id),
    connectedAt: text('connected_at').notNull(),
    revokedAt: text('revoked_at'),
  },
  (table) => [
    index('google_connections_tenant_status_idx').on(
      table.tenantId,
      table.status,
    ),
  ],
);

export const dataSources = sqliteTable(
  'data_sources',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    siteId: text('site_id')
      .notNull()
      .references(() => sites.id, { onDelete: 'cascade' }),
    connectionId: text('connection_id')
      .notNull()
      .references(() => googleConnections.id, { onDelete: 'cascade' }),
    provider: text('provider', { enum: ['ga4', 'gsc', 'gbp'] }).notNull(),
    externalResourceId: text('external_resource_id').notNull(),
    displayName: text('display_name').notNull(),
    propertyTimezone: text('property_timezone'),
    enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
    lastSuccessAt: text('last_success_at'),
    lastErrorCode: text('last_error_code'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    uniqueIndex('data_sources_tenant_provider_resource_unique').on(
      table.tenantId,
      table.provider,
      table.externalResourceId,
    ),
    index('data_sources_tenant_site_idx').on(table.tenantId, table.siteId),
  ],
);

export const syncRuns = sqliteTable(
  'sync_runs',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    sourceId: text('source_id')
      .notNull()
      .references(() => dataSources.id, { onDelete: 'cascade' }),
    dataset: text('dataset').notNull(),
    rangeStart: text('range_start'),
    rangeEnd: text('range_end'),
    status: text('status', {
      enum: ['queued', 'running', 'succeeded', 'failed'],
    }).notNull(),
    rowsWritten: integer('rows_written').notNull().default(0),
    attempt: integer('attempt').notNull().default(1),
    startedAt: text('started_at').notNull(),
    finishedAt: text('finished_at'),
    errorCode: text('error_code'),
    errorSummary: text('error_summary'),
  },
  (table) => [
    index('sync_runs_source_started_idx').on(table.sourceId, table.startedAt),
  ],
);

export const ga4DailyTotals = sqliteTable(
  'ga4_daily_totals',
  {
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    siteId: text('site_id')
      .notNull()
      .references(() => sites.id, { onDelete: 'cascade' }),
    date: text('date').notNull(),
    activeUsers: integer('active_users').notNull().default(0),
    newUsers: integer('new_users').notNull().default(0),
    sessions: integer('sessions').notNull().default(0),
    engagedSessions: integer('engaged_sessions').notNull().default(0),
    views: integer('views').notNull().default(0),
    eventCount: integer('event_count').notNull().default(0),
    keyEvents: integer('key_events').notNull().default(0),
    revenueMicros: integer('revenue_micros').notNull().default(0),
    isPartial: integer('is_partial', { mode: 'boolean' })
      .notNull()
      .default(false),
    syncedAt: text('synced_at').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.siteId, table.date] }),
    index('ga4_totals_tenant_site_date_idx').on(
      table.tenantId,
      table.siteId,
      table.date,
    ),
  ],
);

export const gscDailyTotals = sqliteTable(
  'gsc_daily_totals',
  {
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    siteId: text('site_id')
      .notNull()
      .references(() => sites.id, { onDelete: 'cascade' }),
    date: text('date').notNull(),
    searchType: text('search_type').notNull().default('web'),
    clicks: integer('clicks').notNull().default(0),
    impressions: integer('impressions').notNull().default(0),
    positionImpressionSum: real('position_impression_sum').notNull().default(0),
    isPartial: integer('is_partial', { mode: 'boolean' })
      .notNull()
      .default(false),
    syncedAt: text('synced_at').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.siteId, table.date, table.searchType] }),
    index('gsc_totals_tenant_site_date_idx').on(
      table.tenantId,
      table.siteId,
      table.date,
    ),
  ],
);

export const gscDailyBreakdowns = sqliteTable(
  'gsc_daily_breakdowns',
  {
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    siteId: text('site_id')
      .notNull()
      .references(() => sites.id, { onDelete: 'cascade' }),
    date: text('date').notNull(),
    searchType: text('search_type').notNull().default('web'),
    dimensionType: text('dimension_type', {
      enum: ['query', 'page', 'device', 'country'],
    }).notNull(),
    dimensionValue: text('dimension_value').notNull(),
    clicks: integer('clicks').notNull().default(0),
    impressions: integer('impressions').notNull().default(0),
    positionImpressionSum: real('position_impression_sum').notNull().default(0),
    sourceRank: integer('source_rank'),
  },
  (table) => [
    primaryKey({
      columns: [
        table.siteId,
        table.date,
        table.searchType,
        table.dimensionType,
        table.dimensionValue,
      ],
    }),
    index('gsc_breakdowns_tenant_site_dimension_date_idx').on(
      table.tenantId,
      table.siteId,
      table.dimensionType,
      table.date,
    ),
  ],
);

export const auditEvents = sqliteTable(
  'audit_events',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    actorUserId: text('actor_user_id').references(() => users.id),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id'),
    metadataJson: text('metadata_json'),
    ipHash: text('ip_hash'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('audit_events_tenant_created_idx').on(
      table.tenantId,
      table.createdAt,
    ),
  ],
);
