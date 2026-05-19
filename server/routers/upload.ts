import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";
import { TRPCError } from "@trpc/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export const uploadRouter = router({
  /**
   * Upload a photo file to storage
   * Expects base64-encoded file data in the request
   */
  photo: protectedProcedure
    .input(
      z.object({
        fileName: z.string().min(1).max(255),
        mimeType: z.string().refine((type) => ALLOWED_MIME_TYPES.includes(type), {
          message: `File type must be one of: ${ALLOWED_MIME_TYPES.join(", ")}`,
        }),
        base64Data: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Decode base64 to buffer
        const buffer = Buffer.from(input.base64Data, "base64");

        // Validate file size
        if (buffer.length > MAX_FILE_SIZE) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
          });
        }

        // Validate minimum file size (at least 1KB)
        if (buffer.length < 1024) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "File is too small (minimum 1KB)",
          });
        }

        // Upload to storage
        const storageKey = `content/${ctx.user.id}/${Date.now()}-${input.fileName}`;
        const { key, url } = await storagePut(storageKey, buffer, input.mimeType);

        return {
          success: true,
          storageKey: key,
          photoUrl: url,
          fileName: input.fileName,
        };
      } catch (error) {
        console.error("[Upload] Photo upload error:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upload photo",
        });
      }
    }),
});
