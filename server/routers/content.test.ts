import { describe, expect, it, beforeEach, vi } from "vitest";
import { contentRouter } from "./content";
import { uploadRouter } from "./upload";
import type { TrpcContext } from "../_core/context";
import type { User } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

// Mock database functions
vi.mock("../db", () => ({
  getUserContentItems: vi.fn(),
  getContentItemById: vi.fn(),
  createContentItem: vi.fn(),
  updateContentItem: vi.fn(),
  deleteContentItem: vi.fn(),
  getContentItemsByStatus: vi.fn(),
}));

// Mock LLM
vi.mock("../_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

// Mock storage
vi.mock("../storage", () => ({
  storagePut: vi.fn(),
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

describe("uploadRouter", () => {
  let ctx: TrpcContext;
  let caller: ReturnType<typeof uploadRouter.createCaller>;

  beforeEach(() => {
    ctx = createAuthContext();
    caller = uploadRouter.createCaller(ctx);
    vi.clearAllMocks();
  });

  describe("photo", () => {
    it("uploads a photo successfully", async () => {
      const { storagePut } = await import("../storage");
      vi.mocked(storagePut).mockResolvedValue({
        key: "content/1/1234567890-photo.jpg",
        url: "http://example.com/storage/photo.jpg",
      } as any);

      const base64Data = Buffer.alloc(2048, "x").toString("base64");

      const result = await caller.photo({
        fileName: "photo.jpg",
        mimeType: "image/jpeg",
        base64Data,
      });

      expect(result.success).toBe(true);
      expect(result.photoUrl).toBe("http://example.com/storage/photo.jpg");
      expect(result.storageKey).toBe("content/1/1234567890-photo.jpg");
      expect(storagePut).toHaveBeenCalled();
    });

    it("rejects invalid MIME types", async () => {
      const base64Data = Buffer.alloc(2048, "x").toString("base64");

      await expect(
        caller.photo({
          fileName: "photo.txt",
          mimeType: "text/plain",
          base64Data,
        })
      ).rejects.toThrow("File type must be one of");
    });

    it("rejects files exceeding size limit", async () => {
      const largeData = Buffer.alloc(11 * 1024 * 1024, "x").toString("base64");

      await expect(
        caller.photo({
          fileName: "large.jpg",
          mimeType: "image/jpeg",
          base64Data: largeData,
        })
      ).rejects.toThrow("exceeds maximum");
    });

    it("rejects files smaller than 1KB", async () => {
      const smallData = Buffer.alloc(512, "x").toString("base64");

      await expect(
        caller.photo({
          fileName: "tiny.jpg",
          mimeType: "image/jpeg",
          base64Data: smallData,
        })
      ).rejects.toThrow("too small");
    });

    it("accepts valid image MIME types", async () => {
      const { storagePut } = await import("../storage");
      vi.mocked(storagePut).mockResolvedValue({
        key: "content/1/1234567890-photo.png",
        url: "http://example.com/storage/photo.png",
      } as any);

      const base64Data = Buffer.alloc(2048, "x").toString("base64");

      const result = await caller.photo({
        fileName: "photo.png",
        mimeType: "image/png",
        base64Data,
      });

      expect(result.success).toBe(true);
      expect(result.photoUrl).toBe("http://example.com/storage/photo.png");
    });
  });
});

describe("contentRouter", () => {
  let ctx: TrpcContext;
  let caller: ReturnType<typeof contentRouter.createCaller>;

  beforeEach(() => {
    ctx = createAuthContext();
    caller = contentRouter.createCaller(ctx);
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("returns content items for the authenticated user", async () => {
      const mockItems = [
        {
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
        },
      ];

      const { getUserContentItems } = await import("../db");
      vi.mocked(getUserContentItems).mockResolvedValue(mockItems as any);

      const result = await caller.list({ limit: 50, offset: 0 });

      expect(result).toEqual(mockItems);
      expect(getUserContentItems).toHaveBeenCalledWith(1, 50, 0);
    });
  });

  describe("getById", () => {
    it("returns a content item by ID", async () => {
      const mockItem = {
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
      vi.mocked(getContentItemById).mockResolvedValue(mockItem as any);

      const result = await caller.getById({ id: 1 });

      expect(result).toEqual(mockItem);
      expect(getContentItemById).toHaveBeenCalledWith(1, 1);
    });

    it("throws NOT_FOUND error when content does not exist", async () => {
      const { getContentItemById } = await import("../db");
      vi.mocked(getContentItemById).mockResolvedValue(null);

      await expect(caller.getById({ id: 999 })).rejects.toThrow("Content not found");
    });
  });

  describe("generateCaptions", () => {
    it("generates captions successfully", async () => {
      const mockLLMResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                captionKhmer: "ក្រមក្រមក្រម ស្អាត",
                captionEnglish: "Beautiful haircut design",
                hashtagsKhmer: "#សាលុង #កាត់សក់",
                hashtagsEnglish: "#salon #haircut",
              }),
            },
          },
        ],
      };

      const mockCreatedItem = {
        id: 1,
        userId: 1,
        photoStorageKey: "content/1/123-photo.jpg",
        photoUrl: "http://example.com/photo.jpg",
        photoFileName: "photo.jpg",
        captionKhmer: "ក្រមក្រមក្រម ស្អាត",
        captionEnglish: "Beautiful haircut design",
        hashtagsKhmer: "#សាលុង #កាត់សក់",
        hashtagsEnglish: "#salon #haircut",
        generationTone: "professional",
        customPrompt: null,
        status: "draft",
        telegramMessageId: null,
        telegramChatId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        postedAt: null,
      };

      const { invokeLLM } = await import("../_core/llm");
      const { createContentItem, getContentItemById } = await import("../db");

      vi.mocked(invokeLLM).mockResolvedValue(mockLLMResponse as any);
      vi.mocked(createContentItem).mockResolvedValue({ insertId: 1 } as any);
      vi.mocked(getContentItemById).mockResolvedValue(mockCreatedItem as any);

      const result = await caller.generateCaptions({
        photoUrl: "http://example.com/photo.jpg",
        photoStorageKey: "content/1/123-photo.jpg",
        photoFileName: "photo.jpg",
        tone: "professional",
      });

      expect(result).toEqual(mockCreatedItem);
      expect(invokeLLM).toHaveBeenCalled();
      expect(createContentItem).toHaveBeenCalled();
    });

    it("handles invalid LLM response gracefully", async () => {
      const { invokeLLM } = await import("../_core/llm");

      vi.mocked(invokeLLM).mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                captionKhmer: "x",
                captionEnglish: "y",
                hashtagsKhmer: "#tag",
                hashtagsEnglish: "#tag",
              }),
            },
          },
        ],
      } as any);

      await expect(
        caller.generateCaptions({
          photoUrl: "http://example.com/photo.jpg",
          photoStorageKey: "content/1/123-photo.jpg",
          photoFileName: "photo.jpg",
          tone: "professional",
        })
      ).rejects.toThrow("Failed to parse generated captions");
    });

    it("handles LLM failures gracefully", async () => {
      const { invokeLLM } = await import("../_core/llm");

      vi.mocked(invokeLLM).mockRejectedValue(new Error("LLM service error"));

      await expect(
        caller.generateCaptions({
          photoUrl: "http://example.com/photo.jpg",
          photoStorageKey: "content/1/123-photo.jpg",
          photoFileName: "photo.jpg",
          tone: "professional",
        })
      ).rejects.toThrow("Failed to generate captions");
    });
  });

  describe("regenerate", () => {
    it("regenerates captions with a different tone", async () => {
      const mockExistingItem = {
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

      const mockUpdatedItem = {
        ...mockExistingItem,
        generationTone: "casual",
        captionKhmer: "កាត់សក់ស្អាត!",
        captionEnglish: "Fresh haircut vibes!",
      };

      const mockLLMResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                captionKhmer: "កាត់សក់ស្អាត!",
                captionEnglish: "Fresh haircut vibes!",
                hashtagsKhmer: "#សាលុង",
                hashtagsEnglish: "#salon",
              }),
            },
          },
        ],
      };

      const { invokeLLM } = await import("../_core/llm");
      const { getContentItemById, updateContentItem } = await import("../db");

      vi.mocked(getContentItemById).mockResolvedValueOnce(mockExistingItem as any);
      vi.mocked(invokeLLM).mockResolvedValue(mockLLMResponse as any);
      vi.mocked(updateContentItem).mockResolvedValue({} as any);
      vi.mocked(getContentItemById).mockResolvedValueOnce(mockUpdatedItem as any);

      const result = await caller.regenerate({
        id: 1,
        tone: "casual",
      });

      expect(result).toEqual(mockUpdatedItem);
      expect(updateContentItem).toHaveBeenCalledWith(1, 1, expect.objectContaining({ generationTone: "casual" }));
    });

    it("throws NOT_FOUND when content does not exist", async () => {
      const { getContentItemById } = await import("../db");
      vi.mocked(getContentItemById).mockResolvedValue(null);

      await expect(caller.regenerate({ id: 999, tone: "casual" })).rejects.toThrow("Content not found");
    });
  });

  describe("updateStatus", () => {
    it("updates content status to approved", async () => {
      const mockItem = {
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
        status: "approved",
        telegramMessageId: null,
        telegramChatId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        postedAt: null,
      };

      const { getContentItemById, updateContentItem } = await import("../db");
      vi.mocked(getContentItemById).mockResolvedValueOnce(mockItem as any);
      vi.mocked(updateContentItem).mockResolvedValue({} as any);
      vi.mocked(getContentItemById).mockResolvedValueOnce(mockItem as any);

      const result = await caller.updateStatus({ id: 1, status: "approved" });

      expect(result).toEqual(mockItem);
      expect(updateContentItem).toHaveBeenCalledWith(1, 1, { status: "approved" });
    });

    it("sets postedAt timestamp when marking as posted", async () => {
      const mockItem = {
        id: 1,
        userId: 1,
        status: "posted",
        postedAt: expect.any(Date),
      };

      const { getContentItemById, updateContentItem } = await import("../db");
      vi.mocked(getContentItemById).mockResolvedValueOnce(mockItem as any);
      vi.mocked(updateContentItem).mockResolvedValue({} as any);
      vi.mocked(getContentItemById).mockResolvedValueOnce(mockItem as any);

      await caller.updateStatus({ id: 1, status: "posted" });

      const updateCall = vi.mocked(updateContentItem).mock.calls[0];
      expect(updateCall[2]).toHaveProperty("postedAt");
      expect(updateCall[2].postedAt).toBeInstanceOf(Date);
    });
  });

  describe("delete", () => {
    it("deletes a content item", async () => {
      const mockItem = {
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

      const { getContentItemById, deleteContentItem } = await import("../db");
      vi.mocked(getContentItemById).mockResolvedValue(mockItem as any);
      vi.mocked(deleteContentItem).mockResolvedValue({} as any);

      const result = await caller.delete({ id: 1 });

      expect(result).toEqual({ success: true });
      expect(deleteContentItem).toHaveBeenCalledWith(1, 1);
    });

    it("throws NOT_FOUND error when content does not exist", async () => {
      const { getContentItemById } = await import("../db");
      vi.mocked(getContentItemById).mockResolvedValue(null);

      await expect(caller.delete({ id: 999 })).rejects.toThrow("Content not found");
    });
  });

  describe("getByStatus", () => {
    it("returns content items filtered by status", async () => {
      const mockItems = [
        {
          id: 1,
          userId: 1,
          status: "approved",
          photoStorageKey: "test-key",
          photoUrl: "http://example.com/photo.jpg",
          photoFileName: "photo.jpg",
          captionKhmer: "ក្រមក្រមក្រម",
          captionEnglish: "Test caption",
          hashtagsKhmer: "#សាលុង",
          hashtagsEnglish: "#salon",
          generationTone: "professional",
          customPrompt: null,
          telegramMessageId: null,
          telegramChatId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          postedAt: null,
        },
      ];

      const { getContentItemsByStatus } = await import("../db");
      vi.mocked(getContentItemsByStatus).mockResolvedValue(mockItems as any);

      const result = await caller.getByStatus({ status: "approved" });

      expect(result).toEqual(mockItems);
      expect(getContentItemsByStatus).toHaveBeenCalledWith(1, "approved");
    });
  });
});
