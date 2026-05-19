import { Request, Response } from "express";
import { getDb } from "../db";
import { contentItems } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendReminderToTelegram } from "../services/telegram";
import { notifyOwner } from "../_core/notification";
import { sdk } from "../_core/sdk";

/**
 * Daily reminder handler
 * Checks for approved but unposted content and sends reminders
 * Path: /api/scheduled/dailyReminder
 * Cron: 0 9 * * * (daily at 9 AM UTC)
 */
export async function dailyReminderHandler(req: Request, res: Response) {
  try {
    // Authenticate as cron
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({
        error: "Database not available",
        timestamp: new Date().toISOString(),
      });
    }

    // Find all approved but unposted content
    const approvedContent = await db
      .select()
      .from(contentItems)
      .where(eq(contentItems.status, "approved"));

    if (approvedContent.length === 0) {
      return res.json({
        ok: true,
        message: "No approved content to remind about",
        count: 0,
      });
    }

    // Send Telegram reminder if configured
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.TELEGRAM_CHAT_ID;

    let telegramSuccess = false;
    if (telegramBotToken && telegramChatId) {
      try {
        telegramSuccess = await sendReminderToTelegram(
          {
            botToken: telegramBotToken,
            chatId: telegramChatId,
          },
          approvedContent.length
        );
      } catch (error) {
        console.error("[Daily Reminder] Telegram send failed:", error);
        // Continue even if Telegram fails
      }
    }

    // Send in-app notification to owner
    try {
      await notifyOwner({
        title: `📢 ${approvedContent.length} Post(s) Ready to Share`,
        content: `You have ${approvedContent.length} approved post(s) waiting to be posted. Visit your Content Engine dashboard to share them now!`,
      });
    } catch (error) {
      console.error("[Daily Reminder] In-app notification failed:", error);
      // Continue even if notification fails
    }

    return res.json({
      ok: true,
      message: `Reminder sent for ${approvedContent.length} approved content item(s)`,
      count: approvedContent.length,
      telegramSent: telegramSuccess,
    });
  } catch (error) {
    console.error("[Daily Reminder] Handler error:", error);

    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      context: {
        url: req.url,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  }
}
