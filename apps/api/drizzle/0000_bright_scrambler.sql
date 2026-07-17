CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`font_a_key` text NOT NULL,
	`font_b_key` text NOT NULL,
	`font_size` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`last_accessed_at` integer DEFAULT (unixepoch()) NOT NULL
);
