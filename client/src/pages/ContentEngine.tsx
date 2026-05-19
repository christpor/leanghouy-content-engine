import { useState } from "react";
import { Loader2, Sparkles, History } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { PhotoUploadBox } from "@/components/PhotoUploadBox";
import { BilingualCaptionDisplay } from "@/components/Bilingual CaptionDisplay";
import { RegenerateDialog } from "@/components/RegenerateDialog";
import { ContentHistoryDashboard } from "@/components/ContentHistoryDashboard";
import type { ContentItem } from "@shared/types";

/**
 * Convert File to base64 string using browser FileReader API
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Extract base64 part after the comma (remove data:image/jpeg;base64, prefix)
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ContentEngine() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<ContentItem | null>(null);
  const [regenerateOpen, setRegenerateOpen] = useState(false);
  const [selectedContentForDetails, setSelectedContentForDetails] = useState<ContentItem | null>(null);

  // Queries
  const { data: contentList, isLoading: isLoadingList, refetch: refetchList } = trpc.content.list.useQuery({
    limit: 50,
    offset: 0,
  });

  // Mutations
  const uploadMutation = trpc.upload.photo.useMutation();
  const generateCaptionsMutation = trpc.content.generateCaptions.useMutation();
  const regenerateMutation = trpc.content.regenerate.useMutation();
  const updateStatusMutation = trpc.content.updateStatus.useMutation();
  const deleteMutation = trpc.content.delete.useMutation();

  const handleUploadSuccess = async (file: File, previewUrl: string) => {
    setSelectedFile(file);
    setPreview(previewUrl);

    try {
      // Convert file to base64 using browser FileReader API
      const base64Data = await fileToBase64(file);

      // Upload file
      const uploadResult = await uploadMutation.mutateAsync({
        fileName: file.name,
        mimeType: file.type || "image/jpeg",
        base64Data,
      });

      // Generate captions
      const captionsResult = await generateCaptionsMutation.mutateAsync({
        photoUrl: uploadResult.photoUrl,
        photoStorageKey: uploadResult.storageKey,
        photoFileName: uploadResult.fileName,
        tone: "professional",
      });

      setGeneratedContent(captionsResult);
      await refetchList();
      toast.success("Captions generated successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to generate captions. Please try again.");
      setSelectedFile(null);
      setPreview(null);
    }
  };

  const handleRegenerate = async (tone: "professional" | "casual" | "trendy", customPrompt?: string) => {
    if (!generatedContent) return;

    try {
      const result = await regenerateMutation.mutateAsync({
        id: generatedContent.id,
        tone,
        customPrompt,
      });

      setGeneratedContent(result);
      toast.success("Captions regenerated successfully!");
    } catch (error) {
      console.error("Regenerate error:", error);
      toast.error("Failed to regenerate captions. Please try again.");
    }
  };

  const handleStatusChange = async (id: number, status: "draft" | "approved" | "posted" | "archived") => {
    try {
      await updateStatusMutation.mutateAsync({ id, status });
      await refetchList();
    } catch (error) {
      console.error("Status update error:", error);
      throw error;
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      await refetchList();
    } catch (error) {
      console.error("Delete error:", error);
      throw error;
    }
  };

  const isGenerating = uploadMutation.isPending || generateCaptionsMutation.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">Content Engine</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Generate bilingual social media captions from your photos
          </p>
        </div>

        <Tabs defaultValue="create" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Create
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Create Tab */}
          <TabsContent value="create" className="space-y-6">
            <Card className="p-6 border border-border">
              <PhotoUploadBox
                onUploadSuccess={handleUploadSuccess}
                isLoading={isGenerating}
              />
            </Card>

            {generatedContent && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-foreground">Generated Captions</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setGeneratedContent(null);
                      setSelectedFile(null);
                      setPreview(null);
                    }}
                  >
                    Clear
                  </Button>
                </div>

                <Card className="p-6 border border-border">
                  <BilingualCaptionDisplay
                    captionKhmer={generatedContent.captionKhmer || ""}
                    captionEnglish={generatedContent.captionEnglish || ""}
                    hashtagsKhmer={generatedContent.hashtagsKhmer || ""}
                    hashtagsEnglish={generatedContent.hashtagsEnglish || ""}
                    onRegenerate={() => setRegenerateOpen(true)}
                    isRegenerating={regenerateMutation.isPending}
                  />
                </Card>

                {/* Status Info */}
                <Card className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <span className="font-semibold">Status:</span> {generatedContent.status}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Created on {new Date(generatedContent.createdAt).toLocaleString()}
                  </p>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-foreground">Content History</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchList()}
                disabled={isLoadingList}
              >
                {isLoadingList ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  "Refresh"
                )}
              </Button>
            </div>

            {isLoadingList ? (
              <Card className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
              </Card>
            ) : (
              <ContentHistoryDashboard
                items={contentList || []}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                onViewDetails={setSelectedContentForDetails}
                isLoading={updateStatusMutation.isPending || deleteMutation.isPending}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Regenerate Dialog */}
      <RegenerateDialog
        open={regenerateOpen}
        onOpenChange={setRegenerateOpen}
        onRegenerate={handleRegenerate}
        isLoading={regenerateMutation.isPending}
      />

      {/* Details Modal (if needed) */}
      {selectedContentForDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-semibold">{selectedContentForDetails.photoFileName}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedContentForDetails(null)}
                >
                  ✕
                </Button>
              </div>

              <img
                src={selectedContentForDetails.photoUrl}
                alt="Content"
                className="w-full rounded-lg"
              />

              <BilingualCaptionDisplay
                captionKhmer={selectedContentForDetails.captionKhmer || ""}
                captionEnglish={selectedContentForDetails.captionEnglish || ""}
                hashtagsKhmer={selectedContentForDetails.hashtagsKhmer || ""}
                hashtagsEnglish={selectedContentForDetails.hashtagsEnglish || ""}
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
