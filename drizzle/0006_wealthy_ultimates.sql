CREATE TABLE `nft_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`wallet_address` varchar(255) NOT NULL,
	`contract_address` varchar(255) NOT NULL,
	`token_id` varchar(255) NOT NULL,
	`token_name` varchar(255),
	`token_symbol` varchar(50),
	`chain_id` varchar(50) NOT NULL,
	`metadata` text,
	`image_url` varchar(500),
	`last_synced_at` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `nft_assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `nft_transfers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`from_address` varchar(255) NOT NULL,
	`to_address` varchar(255) NOT NULL,
	`contract_address` varchar(255) NOT NULL,
	`token_id` varchar(255) NOT NULL,
	`chain_id` varchar(50) NOT NULL,
	`transaction_hash` varchar(255),
	`status` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `nft_transfers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `thirdweb_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`thirdweb_api_key` varchar(512),
	`thirdweb_secret_key` varchar(512),
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `thirdweb_config_id` PRIMARY KEY(`id`)
);
