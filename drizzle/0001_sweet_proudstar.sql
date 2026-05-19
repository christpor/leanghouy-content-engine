CREATE TABLE `contentItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`photoStorageKey` varchar(255) NOT NULL,
	`photoUrl` text NOT NULL,
	`photoFileName` varchar(255) NOT NULL,
	`captionKhmer` text,
	`captionEnglish` text,
	`hashtagsKhmer` text,
	`hashtagsEnglish` text,
	`generationTone` varchar(50) DEFAULT 'professional',
	`customPrompt` text,
	`status` enum('draft','approved','posted','archived') NOT NULL DEFAULT 'draft',
	`telegramMessageId` varchar(255),
	`telegramChatId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`postedAt` timestamp,
	CONSTRAINT `contentItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `telegramSyncLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contentItemId` int NOT NULL,
	`telegramUserId` varchar(255) NOT NULL,
	`telegramMessageId` varchar(255) NOT NULL,
	`action` enum('approved','rejected','viewed') NOT NULL,
	`previousStatus` varchar(50),
	`newStatus` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `telegramSyncLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `contentItems` ADD CONSTRAINT `contentItems_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `telegramSyncLog` ADD CONSTRAINT `telegramSyncLog_contentItemId_contentItems_id_fk` FOREIGN KEY (`contentItemId`) REFERENCES `contentItems`(`id`) ON DELETE no action ON UPDATE no action;