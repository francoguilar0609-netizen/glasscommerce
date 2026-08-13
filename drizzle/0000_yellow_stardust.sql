CREATE TABLE `order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` text NOT NULL,
	`product_id` integer NOT NULL,
	`name` text NOT NULL,
	`unit_price` integer NOT NULL,
	`quantity` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_email` text NOT NULL,
	`currency` text DEFAULT 'PEN' NOT NULL,
	`total` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`payment_id` text,
	`preference_id` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`emoji` text NOT NULL,
	`price_pen` integer NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_slug_unique` ON `products` (`slug`);