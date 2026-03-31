CREATE TABLE `banners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`titleEn` varchar(255),
	`subtitle` varchar(255),
	`subtitleEn` varchar(255),
	`image` varchar(500) NOT NULL,
	`link` varchar(500),
	`ctaText` varchar(100),
	`ctaTextEn` varchar(100),
	`order` int NOT NULL DEFAULT 0,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `banners_order_status` ON `banners` (`order`,`status`);