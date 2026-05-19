import { describe, expect, it, beforeEach, vi } from "vitest";
import { telegramRouter } from "./telegram";
import type { TrpcContext } from "../_core/context";
import type { User } from "../../drizzle/schema";

// Mock services
vi.mock("../services/telegram", () => ({
  sendCaptionToTelegram: vi.fn(),
  sendReminderToTelegram: vi.fn(),
  editTelegramMessage: vi.fn(),
}));

// Mock database
vi.mock("../db", () => ({
  getContentItemById: vi.fn(),
}));

function createAuthContext(): TrpcContext {
  const user: User = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("telegramRouter", () => {
  let ctx: TrpcContext;
  let caller: ReturnType<typeof telegramRouter.createCaller>;

  beforeEach(() => {
    ctx = createAuthContext();
    caller = telegramRouter.createCaller(ctx);
    vi.clearAllMocks();

    // Set environment variables
    process.env.TELEGRAM_BOT_TOKEN = "test-bot-token";
    process.env.TELEGRAM_CHAT_ID = "test-chat-id";
  });

  describe("sendForApproval", () => {
    it("sends a caption to Telegram for approval", async () => {
      const mockContent = {
        id: 1,
        userId: 1,
        photoStorageKey: "test-key",
        photoUrl: "http://example.com/photo.jpg",
        photoFileName: "photo.jpg",
        captionKhmer: "ក្រមក្រមក្រម",
        captionEnglish: "Test caption",
        hashtagsKhmer: "#សាលុង",
        hashtagsEnglish: "#salon",
        generationTone: "professional",
        customPrompt: null,
        status: "draft",
        telegramMessageId: null,
        telegramChatId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        postedAt: null,
      };

      const { getContentItemById } = await import("../db");
      const { sendCaptionToTelegram } = await import("../services/telegram");

      vi.mocked(getContentItemById).mockResolvedValue(mockContent as any);
      vi.mocked(sendCaptionToTelegram).mockResolvedValue({
        messageId: "123456",
        success: true,
      });

      const result = await caller.sendForApproval({ contentId: 1 });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("123456");
      expect(sendCaptionToTelegram).toHaveBeenCalledWith(
        expect.objectContaining({
          botToken: "test-bot-token",
          chatId: "test-chat-id",
        }),
        1,
        "ក្រមក្រមក្រម",
        "Test caption",
        "#សាលុង",
        "#salon",
        "http://example.com/photo.jpg"
      );
    });

    it("throws NOT_FOUND when content does not exist", async () => {
      const { getContentItemById } = await import("../db");
      vi.mocked(getContentItemById).mockResolvedValue(null);

      await expect(caller.sendForApproval({ contentId: 999 })).rejects.toThrow(
        "Content not found"
      );
    });

    it("throws error when Telegram config is missing", async () => {
      delete process.env.TELEGRAM_BOT_TOKEN;

      const mockContent = {
        id: 1,
        userId: 1,
        photoStorageKey: "test-key",
        photoUrl: "http://example.com/photo.jpg",
        photoFileName: "photo.jpg",
        captionKhmer: "ក្រមក្រមក្រម",
        captionEnglish: "Test caption",
        hashtagsKhmer: "#សាលុង",
        hashtagsEnglish: "#salon",
        generationTone: "professional",
        customPrompt: null,
        status: "draft",
        telegramMessageId: null,
        telegramChatId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        postedAt: null,
      };

      const { getContentItemById } = await import("../db");
      vi.mocked(getContentItemById).mockResolvedValue(mockContent as any);

      await expect(caller.sendForApproval({ contentId: 1 })).rejects.toThrow(
        "Telegram is not configured"
      );
    });
  });

  describe("sendReminder", () => {
    it("sends a reminder notification", async () => {
      const { sendReminderToTelegram } = await import("../services/telegram");
      vi.mocked(sendReminderToTelegram).mockResolvedValue(true);

      const result = await caller.sendReminder({ approvedCount: 3 });

      expect(result.success).toBe(true);
      expect(sendReminderToTelegram).toHaveBeenCalledWith(
        expect.objectContaining({
          botToken: "test-bot-token",
          chatId: "test-chat-id",
        }),
        3
      );
    });

    it("handles reminder send failure", async () => {
      const { sendReminderToTelegram } = await import("../services/telegram");
      vi.mocked(sendReminderToTelegram).mockResolvedValue(false);

      const result = await caller.sendReminder({ approvedCount: 3 });

      expect(result.success).toBe(false);
    });
  });

  describe("updateMessage", () => {
    it("updates a Telegram message with new captions", async () => {
      const mockContent = {
        id: 1,
        userId: 1,
        photoStorageKey: "test-key",
        photoUrl: "http://example.com/photo.jpg",
        photoFileName: "photo.jpg",
        captionKhmer: "ក្រមក្រមក្រម ថ្មី",
        captionEnglish: "Updated caption",
        hashtagsKhmer: "#សាលុង",
        hashtagsEnglish: "#salon",
        generationTone: "casual",
        customPrompt: null,
        status: "draft",
        telegramMessageId: "123456",
        telegramChatId: "test-chat-id",
        createdAt: new Date(),
        updatedAt: new Date(),
        postedAt: null,
      };

      const { getContentItemById } = await import("../db");
      const { editTelegramMessage } = await import("../services/telegram");

      vi.mocked(getContentItemById).mockResolvedValue(mockContent as any);
      vi.mocked(editTelegramMessage).mockResolvedValue(true);

      const result = await caller.updateMessage({
        contentId: 1,
        messageId: "123456",
      });

      expect(result.success).toBe(true);
      expect(editTelegramMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          botToken: "test-bot-token",
          chatId: "test-chat-id",
        }),
        "123456",
        "ក្រមក្រមក្រម ថ្មី",
        "Updated caption",
        "#សាលុង",
        "#salon",
        1
      );
    });

    it("throws NOT_FOUND when content does not exist", async () => {
      const { getContentItemById } = await import("../db");
      vi.mocked(getContentItemById).mockResolvedValue(null);

      await expect(
        caller.updateMessage({ contentId: 999, messageId: "123456" })
      ).rejects.toThrow("Content not found");
    });
  });
});
