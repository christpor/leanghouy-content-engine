import { useState } from "react";
import { Copy, Check, Trash2, Eye, Archive, CheckCircle2, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { ContentItem } from "@shared/types";

interface ContentHistoryDashboardProps {
  items: ContentItem[];
  onStatusChange: (id: number, status: "draft" | "approved" | "posted" | "archived") => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onViewDetails: (item: ContentItem) => void;
  isLoading?: boolean;
}

const STATUS_CONFIG = {
  draft: { label: "Draft", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", icon: Clock },
  approved: { label: "Approved", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300", icon: CheckCircle2 },
  posted: { label: "Posted", color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300", icon: CheckCircle2 },
  archived: { label: "Archived", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", icon: Archive },
};

export function ContentHistoryDashboard({
  items,
  onStatusChange,
  onDelete,
  onViewDetails,
  isLoading = false,
}: ContentHistoryDashboardProps) {
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleCopyCaption = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Copied to clipboard!");
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this content?")) return;
    setDeletingId(id);
    try {
      await onDelete(id);
      toast.success("Content deleted successfully");
    } catch (error) {
      toast.error("Failed to delete content");
    } finally {
      setDeletingId(null);
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await onStatusChange(id, newStatus as any);
      toast.success("Status updated successfully");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  if (items.length === 0) {
    return (
      <Card className="p-12 text-center border border-dashed">
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-muted">
            <FileText className="w-6 h-6 text-muted-foreground" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No Content Yet</h3>
        <p className="text-sm text-muted-foreground">
          Upload a photo and generate captions to get started
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const StatusIcon = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG]?.icon || Clock;
        const statusConfig = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG];

        return (
          <Card key={item.id} className="overflow-hidden border border-border hover:border-primary/50 transition-colors">
            <div className="p-4 md:p-6">
              <div className="flex gap-4">
                {/* Thumbnail */}
                <div className="flex-shrink-0">
                  <img
                    src={item.photoUrl}
                    alt="Content thumbnail"
                    className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-lg"
                  />
                </div>

                {/* Content Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString()} at{" "}
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <p className="text-sm font-medium text-foreground truncate">{item.photoFileName}</p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusConfig.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig.label}
                    </div>
                  </div>

                  {/* Captions Preview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                    <div className="text-xs">
                      <p className="text-muted-foreground font-medium mb-1">ខ្មែរ</p>
                      <p className="text-foreground line-clamp-2">{item.captionKhmer}</p>
                    </div>
                    <div className="text-xs">
                      <p className="text-muted-foreground font-medium mb-1">English</p>
                      <p className="text-foreground line-clamp-2">{item.captionEnglish}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyCaption(`${item.captionKhmer}\n\n${item.hashtagsKhmer}`, item.id)}
                      disabled={isLoading}
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 mr-1" />
                          Khmer
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyCaption(`${item.captionEnglish}\n\n${item.hashtagsEnglish}`, item.id)}
                      disabled={isLoading}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      English
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewDetails(item)}
                      disabled={isLoading}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>

                    {/* Status Selector */}
                    <Select
                      value={item.status}
                      onValueChange={(value) => handleStatusChange(item.id, value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="w-32 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="posted">Posted</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(item.id)}
                      disabled={isLoading || deletingId === item.id}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
