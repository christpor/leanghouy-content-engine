import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getUserContentItems,
  getContentItemById,
  createContentItem,
  updateContentItem,
  deleteContentItem,
  getContentItemsByStatus,
} from "../db";
import { invokeLLM } from "../_core/llm";
import { TRPCError } from "@trpc/server";

const CAPTION_GENERATION_PROMPT = (tone: string, customPrompt?: string) => {
  const basePrompt = `You are a social media content expert for a professional hair salon. 
Generate engaging social media captions for a haircut/salon photo.

Tone: ${tone}
${customPrompt ? `Additional instructions: ${customPrompt}` : ""}

Return a JSON object with the following structure:
{
  "captionKhmer": "Khmer caption (2-3 sentences, engaging and professional)",
  "captionEnglish": "English caption (2-3 sentences, engaging and professional)",
  "hashtagsKhmer": "Khmer hashtags separated by spaces (5-8 relevant hashtags)",
  "hashtagsEnglish": "English hashtags separated by spaces (5-8 relevant hashtags)"
}

Make sure the captions are appropriate for the ${tone} tone and relevant to hair salon services.`;

  return basePrompt;
};

// Zod schema for caption generation response
const CaptionSchema = z.object({
  captionKhmer: z.string().min(10).max(500),
  captionEnglish: z.string().min(10).max(500),
  hashtagsKhmer: z.string().min(1).max(200),
  hashtagsEnglish: z.string().min(1).max(200),
});

type CaptionResponse = z.infer<typeof CaptionSchema>;

/**
 * Parse and validate LLM response for caption generation
 */
function parseCaptionResponse(content: string): CaptionResponse {
  try {
    const parsed = JSON.parse(content);
    return CaptionSchema.parse(parsed);
  } catch (error) {
    console.error("[Content] Failed to parse caption response:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to parse generated captions. Please try again.",
    });
  }
}

export const contentRouter = router({
  /**
   * List all content items for the authenticated user
   */
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().positive().default(50),
        offset: z.number().int().nonnegative().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const items = await getUserContentItems(ctx.user.id, input.limit, input.offset);
      return items;
    }),

  /**
   * Get a single content item by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const item = await getContentItemById(input.id, ctx.user.id);
      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Content not found" });
      }
      return item;
    }),

  /**
   * Generate captions for an uploaded photo
   * Expects the photo to already be uploaded via the upload.photo endpoint
   */
  generateCaptions: protectedProcedure
    .input(
      z.object({
        photoUrl: z.string().url(),
        photoStorageKey: z.string().min(1),
        photoFileName: z.string().min(1),
        tone: z.enum(["professional", "casual", "trendy"]).default("professional"),
        customPrompt: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Generate captions using LLM with vision
        const prompt = CAPTION_GENERATION_PROMPT(input.tone, input.customPrompt);

        const llmResponse = await invokeLLM({
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text" as const,
                  text: prompt,
                },
                {
                  type: "image_url" as const,
                  image_url: {
                    url: input.photoUrl,
                    detail: "high",
                  },
                },
              ] as any,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "caption_generation",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  captionKhmer: { type: "string" },
                  captionEnglish: { type: "string" },
                  hashtagsKhmer: { type: "string" },
                  hashtagsEnglish: { type: "string" },
                },
                required: ["captionKhmer", "captionEnglish", "hashtagsKhmer", "hashtagsEnglish"],
                additionalProperties: false,
              },
            },
          },
        });

        // Parse and validate the LLM response
        const content = llmResponse.choices[0]?.message?.content;
        if (!content || typeof content !== "string") {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to generate captions",
          });
        }

        const parsed = parseCaptionResponse(content);

        // Create content item in database
        const result = await createContentItem({
          userId: ctx.user.id,
          photoStorageKey: input.photoStorageKey,
          photoUrl: input.photoUrl,
          photoFileName: input.photoFileName,
          captionKhmer: parsed.captionKhmer,
          captionEnglish: parsed.captionEnglish,
          hashtagsKhmer: parsed.hashtagsKhmer,
          hashtagsEnglish: parsed.hashtagsEnglish,
          generationTone: input.tone,
          customPrompt: input.customPrompt,
          status: "draft",
        });

        // Fetch the created item to return full data
        const createdId = (result as any).insertId;
        const createdItem = await getContentItemById(createdId, ctx.user.id);

        return createdItem;
      } catch (error) {
        console.error("[Content] Generate captions error:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate captions",
        });
      }
    }),

  /**
   * Regenerate captions for an existing content item
   */
  regenerate: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        tone: z.enum(["professional", "casual", "trendy"]),
        customPrompt: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify ownership
        const item = await getContentItemById(input.id, ctx.user.id);
        if (!item) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Content not found" });
        }

        // Generate new captions using the existing photo URL
        const prompt = CAPTION_GENERATION_PROMPT(input.tone, input.customPrompt);

        const llmResponse = await invokeLLM({
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text" as const,
                  text: prompt,
                },
                {
                  type: "image_url" as const,
                  image_url: {
                    url: item.photoUrl,
                    detail: "high",
                  },
                },
              ] as any,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "caption_generation",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  captionKhmer: { type: "string" },
                  captionEnglish: { type: "string" },
                  hashtagsKhmer: { type: "string" },
                  hashtagsEnglish: { type: "string" },
                },
                required: ["captionKhmer", "captionEnglish", "hashtagsKhmer", "hashtagsEnglish"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = llmResponse.choices[0]?.message?.content;
        if (!content || typeof content !== "string") {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to generate captions",
          });
        }

        const parsed = parseCaptionResponse(content);

        // Update the content item
        await updateContentItem(input.id, ctx.user.id, {
          captionKhmer: parsed.captionKhmer,
          captionEnglish: parsed.captionEnglish,
          hashtagsKhmer: parsed.hashtagsKhmer,
          hashtagsEnglish: parsed.hashtagsEnglish,
          generationTone: input.tone,
          customPrompt: input.customPrompt,
        });

        const updatedItem = await getContentItemById(input.id, ctx.user.id);
        return updatedItem;
      } catch (error) {
        console.error("[Content] Regenerate error:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to regenerate captions",
        });
      }
    }),

  /**
   * Update content status (draft, approved, posted, archived)
   */
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        status: z.enum(["draft", "approved", "posted", "archived"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const item = await getContentItemById(input.id, ctx.user.id);
      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Content not found" });
      }

      const updateData: any = { status: input.status };
      if (input.status === "posted") {
        updateData.postedAt = new Date();
      }

      await updateContentItem(input.id, ctx.user.id, updateData);
      const updatedItem = await getContentItemById(input.id, ctx.user.id);
      return updatedItem;
    }),

  /**
   * Delete a content item
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const item = await getContentItemById(input.id, ctx.user.id);
      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Content not found" });
      }

      await deleteContentItem(input.id, ctx.user.id);
      return { success: true };
    }),

  /**
   * Get content items by status (e.g., all approved items)
   */
  getByStatus: protectedProcedure
    .input(z.object({ status: z.enum(["draft", "approved", "posted", "archived"]) }))
    .query(async ({ ctx, input }) => {
      const items = await getContentItemsByStatus(ctx.user.id, input.status);
      return items;
    }),
});
