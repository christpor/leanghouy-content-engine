import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Content items table: stores uploaded photos and generated captions
 * Bilingual support: both Khmer and English captions stored
 * Approval workflow: draft → approved → posted → archived
 */
export const contentItems = mysqlTable("contentItems", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  
  // Photo metadata
  photoStorageKey: varchar("photoStorageKey", { length: 255 }).notNull(),
  photoUrl: text("photoUrl").notNull(),
  photoFileName: varchar("photoFileName", { length: 255 }).notNull(),
  
  // Bilingual captions
  captionKhmer: text("captionKhmer"),
  captionEnglish: text("captionEnglish"),
  hashtagsKhmer: text("hashtagsKhmer"),
  hashtagsEnglish: text("hashtagsEnglish"),
  
  // Generation metadata
  generationTone: varchar("generationTone", { length: 50 }).default("professional"), // professional, casual, trendy
  customPrompt: text("customPrompt"),
  
  // Approval workflow
  status: mysqlEnum("status", ["draft", "approved", "posted", "archived"]).default("draft").notNull(),
  
  // Telegram sync
  telegramMessageId: varchar("telegramMessageId", { length: 255 }),
  telegramChatId: varchar("telegramChatId", { length: 255 }),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  postedAt: timestamp("postedAt"),
});

export type ContentItem = typeof contentItems.$inferSelect;
export type InsertContentItem = typeof contentItems.$inferInsert;

/**
 * Telegram sync table: tracks approval status changes from Telegram
 * Used to ensure dashboard stays in sync with Telegram interactions
 */
export const telegramSyncLog = mysqlTable("telegramSyncLog", {
  id: int("id").autoincrement().primaryKey(),
  contentItemId: int("contentItemId").notNull().references(() => contentItems.id),
  
  // Telegram interaction
  telegramUserId: varchar("telegramUserId", { length: 255 }).notNull(),
  telegramMessageId: varchar("telegramMessageId", { length: 255 }).notNull(),
  
  // Action tracking
  action: mysqlEnum("action", ["approved", "rejected", "viewed"]).notNull(),
  previousStatus: varchar("previousStatus", { length: 50 }),
  newStatus: varchar("newStatus", { length: 50 }),
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TelegramSyncLog = typeof telegramSyncLog.$inferSelect;
export type InsertTelegramSyncLog = typeof telegramSyncLog.$inferInsert;