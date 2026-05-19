import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { sendCaptionToTelegram, sendReminderToTelegram, editTelegramMessage } from "../services/telegram";
import { getContentItemById } from "../db";
import { TRPCError } from "@trpc/server";

export const telegramRouter = router({
  /**
   * Send a generated caption to Telegram for approval
   */
  sendForApproval: protectedProcedure
    .input(z.object({ contentId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify ownership
        const content = await getContentItemById(input.contentId, ctx.user.id);
        if (!content) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Content not found" });
        }

        // Get Telegram config from environment
        const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
        const telegramChatId = process.env.TELEGRAM_CHAT_ID;

        if (!telegramBotToken || !telegramChatId) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Telegram is not configured. Please set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID.",
          });
        }

        const result = await sendCaptionToTelegram(
          {
            botToken: telegramBotToken,
            chatId: telegramChatId,
          },
          input.contentId,
          content.captionKhmer || "",
          content.captionEnglish || "",
          content.hashtagsKhmer || "",
          content.hashtagsEnglish || "",
          content.photoUrl
        );

        return result;
      } catch (error) {
        console.error("[Telegram Router] Send for approval error:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send to Telegram",
        });
      }
    }),

  /**
   * Send a reminder notification
   */
  sendReminder: protectedProcedure
    .input(z.object({ approvedCount: z.number().int().nonnegative() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Get Telegram config from environment
        const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
        const telegramChatId = process.env.TELEGRAM_CHAT_ID;

        if (!telegramBotToken || !telegramChatId) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Telegram is not configured",
          });
        }

        const success = await sendReminderToTelegram(
          {
            botToken: telegramBotToken,
            chatId: telegramChatId,
          },
          input.approvedCount
        );

        return { success };
      } catch (error) {
        console.error("[Telegram Router] Send reminder error:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send reminder",
        });
      }
    }),

  /**
   * Update a Telegram message with new captions (after regeneration)
   */
  updateMessage: protectedProcedure
    .input(
      z.object({
        contentId: z.number().int().positive(),
        messageId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify ownership
        const content = await getContentItemById(input.contentId, ctx.user.id);
        if (!content) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Content not found" });
        }

        // Get Telegram config from environment
        const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
        const telegramChatId = process.env.TELEGRAM_CHAT_ID;

        if (!telegramBotToken || !telegramChatId) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Telegram is not configured",
          });
        }

        const success = await editTelegramMessage(
          {
            botToken: telegramBotToken,
            chatId: telegramChatId,
          },
          input.messageId,
          content.captionKhmer || "",
          content.captionEnglish || "",
          content.hashtagsKhmer || "",
          content.hashtagsEnglish || "",
          input.contentId
        );

        return { success };
      } catch (error) {
        console.error("[Telegram Router] Update message error:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update Telegram message",
        });
      }
    }),
});
