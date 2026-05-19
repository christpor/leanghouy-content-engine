import { Router } from "express";
import { handleTelegramCallback } from "../services/telegram";
import { getDb } from "../db";
import { eq } from "drizzle-orm";
import { users } from "../../drizzle/schema";

const router = Router();

/**
 * Telegram webhook endpoint for receiving updates
 * POST /api/webhooks/telegram
 */
router.post("/telegram", async (req, res) => {
  try {
    const update = req.body;

    // Handle callback queries (button clicks)
    if (update.callback_query) {
      const { callback_query } = update;
      const callbackData = callback_query.data;
      const callbackQueryId = callback_query.id;
      const telegramUserId = callback_query.from.id;

      // Get the owner user (assuming single owner)
      const db = await getDb();
      if (!db) {
        return res.status(500).json({ error: "Database not available" });
      }

      const ownerUser = await db
        .select()
        .from(users)
        .where(eq(users.role, "admin"))
        .limit(1);

      if (!ownerUser.length) {
        return res.status(404).json({ error: "Owner not found" });
      }

      const owner = ownerUser[0];

      // Get Telegram config from environment
      const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
      const telegramChatId = process.env.TELEGRAM_CHAT_ID;

      if (!telegramBotToken || !telegramChatId) {
        return res.status(500).json({ error: "Telegram config not set" });
      }

      try {
        await handleTelegramCallback(
          {
            botToken: telegramBotToken,
            chatId: telegramChatId,
          },
          callbackQueryId,
          callbackData,
          owner.id
        );

        return res.json({ success: true });
      } catch (error) {
        console.error("[Telegram Webhook] Callback handling error:", error);
        return res.status(500).json({ error: "Failed to process callback" });
      }
    }

    // Handle other update types as needed
    res.json({ ok: true });
  } catch (error) {
    console.error("[Telegram Webhook] Error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

export default router;
