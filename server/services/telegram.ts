import axios from "axios";
import { getDb } from "../db";
import { eq } from "drizzle-orm";
import { contentItems, telegramSyncLog } from "../../drizzle/schema";

/**
 * Telegram Bot Service
 * Handles sending messages to Telegram and receiving approval callbacks
 */

const TELEGRAM_API_URL = "https://api.telegram.org";

export interface TelegramConfig {
  botToken: string;
  chatId: string;
}

/**
 * Send a caption to Telegram with inline approval buttons
 */
export async function sendCaptionToTelegram(
  config: TelegramConfig,
  contentId: number,
  captionKhmer: string,
  captionEnglish: string,
  hashtagsKhmer: string,
  hashtagsEnglish: string,
  photoUrl: string
): Promise<{ messageId: string; success: boolean }> {
  try {
    const message = `
📸 *New Content Ready for Review*

*Khmer (ខ្មែរ):*
${captionKhmer}
${hashtagsKhmer}

*English:*
${captionEnglish}
${hashtagsEnglish}

---
Content ID: \`${contentId}\`
    `.trim();

    const response = await axios.post(
      `${TELEGRAM_API_URL}/bot${config.botToken}/sendPhoto`,
      {
        chat_id: config.chatId,
        photo: photoUrl,
        caption: message,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "✅ Approve",
                callback_data: `approve_${contentId}`,
              },
              {
                text: "❌ Reject",
                callback_data: `reject_${contentId}`,
              },
            ],
            [
              {
                text: "🔄 Regenerate",
                callback_data: `regenerate_${contentId}`,
              },
            ],
          ],
        },
      }
    );

    const messageId = response.data.result.message_id.toString();

    // Log the sync
    const db = await getDb();
    if (db) {
      await db.insert(telegramSyncLog).values({
        contentItemId: contentId,
        telegramUserId: config.chatId,
        telegramMessageId: messageId,
        action: "viewed",
        createdAt: new Date(),
      });

      // Update content item with Telegram metadata
      await db
        .update(contentItems)
        .set({
          telegramMessageId: messageId,
          telegramChatId: config.chatId,
          updatedAt: new Date(),
        })
        .where(eq(contentItems.id, contentId));
    }

    return { messageId, success: true };
  } catch (error) {
    console.error("[Telegram] Failed to send caption:", error);
    throw error;
  }
}

/**
 * Handle Telegram callback query (approval/rejection)
 */
export async function handleTelegramCallback(
  config: TelegramConfig,
  callbackQueryId: string,
  callbackData: string,
  userId: number
): Promise<{ success: boolean; action: string; contentId: number }> {
  try {
    const [action, contentIdStr] = callbackData.split("_");
    const contentId = parseInt(contentIdStr, 10);

    if (!action || !contentId) {
      throw new Error("Invalid callback data format");
    }

    // Update content status based on action
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    let newStatus: "approved" | "rejected" | "draft" = "draft";

    if (action === "approve") {
      newStatus = "approved";
    } else if (action === "reject") {
      newStatus = "draft"; // Reject means go back to draft
    }

    // Update content item
    await db
      .update(contentItems)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(contentItems.id, contentId));

    // Log the sync action
    await db.insert(telegramSyncLog).values({
      contentItemId: contentId,
      telegramUserId: config.chatId,
      telegramMessageId: callbackQueryId,
      action: action as "approved" | "rejected" | "viewed",
      newStatus: newStatus,
      createdAt: new Date(),
    });

    // Send acknowledgment to Telegram
    await axios.post(`${TELEGRAM_API_URL}/bot${config.botToken}/answerCallbackQuery`, {
      callback_query_id: callbackQueryId,
      text: `${action === "approve" ? "✅ Approved" : "❌ Rejected"}`,
      show_alert: false,
    });

    return { success: true, action, contentId };
  } catch (error) {
    console.error("[Telegram] Failed to handle callback:", error);
    throw error;
  }
}

/**
 * Send a reminder notification to Telegram
 */
export async function sendReminderToTelegram(
  config: TelegramConfig,
  approvedCount: number
): Promise<boolean> {
  try {
    const message = `
🔔 *Content Reminder*

You have *${approvedCount}* approved post(s) ready to be posted!

Visit your Content Engine dashboard to post them now.
    `.trim();

    await axios.post(`${TELEGRAM_API_URL}/bot${config.botToken}/sendMessage`, {
      chat_id: config.chatId,
      text: message,
      parse_mode: "Markdown",
    });

    return true;
  } catch (error) {
    console.error("[Telegram] Failed to send reminder:", error);
    return false;
  }
}

/**
 * Edit a Telegram message (for regeneration preview)
 */
export async function editTelegramMessage(
  config: TelegramConfig,
  messageId: string,
  captionKhmer: string,
  captionEnglish: string,
  hashtagsKhmer: string,
  hashtagsEnglish: string,
  contentId: number
): Promise<boolean> {
  try {
    const message = `
📸 *Content Updated*

*Khmer (ខ្មែរ):*
${captionKhmer}
${hashtagsKhmer}

*English:*
${captionEnglish}
${hashtagsEnglish}

---
Content ID: \`${contentId}\`
    `.trim();

    await axios.post(`${TELEGRAM_API_URL}/bot${config.botToken}/editMessageCaption`, {
      chat_id: config.chatId,
      message_id: parseInt(messageId, 10),
      caption: message,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "✅ Approve",
              callback_data: `approve_${contentId}`,
            },
            {
              text: "❌ Reject",
              callback_data: `reject_${contentId}`,
            },
          ],
          [
            {
              text: "🔄 Regenerate",
              callback_data: `regenerate_${contentId}`,
            },
          ],
        ],
      },
    });

    return true;
  } catch (error) {
    console.error("[Telegram] Failed to edit message:", error);
    return false;
  }
}
