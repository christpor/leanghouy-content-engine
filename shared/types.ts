// Content item type matching database schema
export interface ContentItem {
  id: number;
  userId: number;
  photoStorageKey: string;
  photoUrl: string;
  photoFileName: string;
  captionKhmer: string | null;
  captionEnglish: string | null;
  hashtagsKhmer: string | null;
  hashtagsEnglish: string | null;
  generationTone: string | null;
  customPrompt: string | null;
  status: "draft" | "approved" | "posted" | "archived";
  telegramMessageId: string | null;
  telegramChatId: string | null;
  createdAt: Date;
  updatedAt: Date;
  postedAt: Date | null;
}
