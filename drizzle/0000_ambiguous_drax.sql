CREATE TABLE `audit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`actor_user_id` text,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text,
	`metadata_json` text,
	`ip_hash` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `audit_events_tenant_created_idx` ON `audit_events` (`tenant_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `data_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`site_id` text NOT NULL,
	`connection_id` text NOT NULL,
	`provider` text NOT NULL,
	`external_resource_id` text NOT NULL,
	`display_name` text NOT NULL,
	`property_timezone` text,
	`enabled` integer DEFAULT true NOT NULL,
	`last_success_at` text,
	`last_error_code` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`connection_id`) REFERENCES `google_connections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `data_sources_tenant_provider_resource_unique` ON `data_sources` (`tenant_id`,`provider`,`external_resource_id`);--> statement-breakpoint
CREATE INDEX `data_sources_tenant_site_idx` ON `data_sources` (`tenant_id`,`site_id`);--> statement-breakpoint
CREATE TABLE `ga4_daily_totals` (
	`tenant_id` text NOT NULL,
	`site_id` text NOT NULL,
	`date` text NOT NULL,
	`active_users` integer DEFAULT 0 NOT NULL,
	`new_users` integer DEFAULT 0 NOT NULL,
	`sessions` integer DEFAULT 0 NOT NULL,
	`engaged_sessions` integer DEFAULT 0 NOT NULL,
	`views` integer DEFAULT 0 NOT NULL,
	`event_count` integer DEFAULT 0 NOT NULL,
	`key_events` integer DEFAULT 0 NOT NULL,
	`revenue_micros` integer DEFAULT 0 NOT NULL,
	`is_partial` integer DEFAULT false NOT NULL,
	`synced_at` text NOT NULL,
	PRIMARY KEY(`site_id`, `date`),
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ga4_totals_tenant_site_date_idx` ON `ga4_daily_totals` (`tenant_id`,`site_id`,`date`);--> statement-breakpoint
CREATE TABLE `google_connections` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`google_subject` text NOT NULL,
	`google_email` text NOT NULL,
	`scopes_json` text NOT NULL,
	`refresh_ciphertext` text,
	`refresh_nonce` text,
	`key_version` integer,
	`status` text DEFAULT 'active' NOT NULL,
	`connected_by` text NOT NULL,
	`connected_at` text NOT NULL,
	`revoked_at` text,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`connected_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `google_connections_tenant_status_idx` ON `google_connections` (`tenant_id`,`status`);--> statement-breakpoint
CREATE TABLE `gsc_daily_breakdowns` (
	`tenant_id` text NOT NULL,
	`site_id` text NOT NULL,
	`date` text NOT NULL,
	`search_type` text DEFAULT 'web' NOT NULL,
	`dimension_type` text NOT NULL,
	`dimension_value` text NOT NULL,
	`clicks` integer DEFAULT 0 NOT NULL,
	`impressions` integer DEFAULT 0 NOT NULL,
	`position_impression_sum` real DEFAULT 0 NOT NULL,
	`source_rank` integer,
	PRIMARY KEY(`site_id`, `date`, `search_type`, `dimension_type`, `dimension_value`),
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `gsc_breakdowns_tenant_site_dimension_date_idx` ON `gsc_daily_breakdowns` (`tenant_id`,`site_id`,`dimension_type`,`date`);--> statement-breakpoint
CREATE TABLE `gsc_daily_totals` (
	`tenant_id` text NOT NULL,
	`site_id` text NOT NULL,
	`date` text NOT NULL,
	`search_type` text DEFAULT 'web' NOT NULL,
	`clicks` integer DEFAULT 0 NOT NULL,
	`impressions` integer DEFAULT 0 NOT NULL,
	`position_impression_sum` real DEFAULT 0 NOT NULL,
	`is_partial` integer DEFAULT false NOT NULL,
	`synced_at` text NOT NULL,
	PRIMARY KEY(`site_id`, `date`, `search_type`),
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `gsc_totals_tenant_site_date_idx` ON `gsc_daily_totals` (`tenant_id`,`site_id`,`date`);--> statement-breakpoint
CREATE TABLE `invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` text NOT NULL,
	`accepted_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `invitations_tenant_email_idx` ON `invitations` (`tenant_id`,`email`);--> statement-breakpoint
CREATE TABLE `memberships` (
	`tenant_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`tenant_id`, `user_id`),
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `memberships_user_tenant_idx` ON `memberships` (`user_id`,`tenant_id`);--> statement-breakpoint
CREATE TABLE `sites` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`name` text NOT NULL,
	`canonical_url` text NOT NULL,
	`timezone` text DEFAULT 'UTC' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sites_tenant_url_unique` ON `sites` (`tenant_id`,`canonical_url`);--> statement-breakpoint
CREATE INDEX `sites_tenant_status_idx` ON `sites` (`tenant_id`,`status`);--> statement-breakpoint
CREATE TABLE `sync_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`source_id` text NOT NULL,
	`dataset` text NOT NULL,
	`range_start` text,
	`range_end` text,
	`status` text NOT NULL,
	`rows_written` integer DEFAULT 0 NOT NULL,
	`attempt` integer DEFAULT 1 NOT NULL,
	`started_at` text NOT NULL,
	`finished_at` text,
	`error_code` text,
	`error_summary` text,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_id`) REFERENCES `data_sources`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sync_runs_source_started_idx` ON `sync_runs` (`source_id`,`started_at`);--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`timezone` text DEFAULT 'UTC' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tenants_slug_unique` ON `tenants` (`slug`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`auth_subject` text NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`created_at` text NOT NULL,
	`last_login_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_auth_subject_unique` ON `users` (`auth_subject`);--> statement-breakpoint
CREATE INDEX `users_email_idx` ON `users` (`email`);