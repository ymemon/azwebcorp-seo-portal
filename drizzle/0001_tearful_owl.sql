CREATE TABLE `oauth_states` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`code_verifier` text NOT NULL,
	`return_to` text DEFAULT '/dashboard' NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `oauth_states_user_expires_idx` ON `oauth_states` (`user_id`,`expires_at`);