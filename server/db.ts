import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, contentItems, ContentItem, InsertContentItem, telegramSyncLog, InsertTelegramSyncLog } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get all content items for a user, ordered by creation date (newest first)
 */
export async function getUserContentItems(userId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(contentItems)
    .where(eq(contentItems.userId, userId))
    .orderBy(desc(contentItems.createdAt))
    .limit(limit)
    .offset(offset);

  return result;
}

/**
 * Get a single content item by ID (with ownership check)
 */
export async function getContentItemById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(contentItems)
    .where(and(eq(contentItems.id, id), eq(contentItems.userId, userId)))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Create a new content item
 */
export async function createContentItem(data: InsertContentItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(contentItems).values(data);
  return result;
}

/**
 * Update content item (captions, status, etc.)
 */
export async function updateContentItem(id: number, userId: number, updates: Partial<ContentItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Ensure user owns this content
  const existing = await getContentItemById(id, userId);
  if (!existing) throw new Error("Content not found or unauthorized");

  const result = await db
    .update(contentItems)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(contentItems.id, id));

  return result;
}

/**
 * Delete a content item
 */
export async function deleteContentItem(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Ensure user owns this content
  const existing = await getContentItemById(id, userId);
  if (!existing) throw new Error("Content not found or unauthorized");

  const result = await db.delete(contentItems).where(eq(contentItems.id, id));
  return result;
}

/**
 * Get content items by status (e.g., all approved items)
 */
export async function getContentItemsByStatus(userId: number, status: string) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(contentItems)
    .where(and(eq(contentItems.userId, userId), eq(contentItems.status, status as any)))
    .orderBy(desc(contentItems.createdAt));

  return result;
}

/**
 * Log Telegram sync action
 */
export async function logTelegramSync(data: InsertTelegramSyncLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(telegramSyncLog).values(data);
  return result;
}
