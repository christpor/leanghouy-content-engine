import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface BilingualCaptionDisplayProps {
  captionKhmer: string;
  captionEnglish: string;
  hashtagsKhmer: string;
  hashtagsEnglish: string;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export function BilingualCaptionDisplay({
  captionKhmer,
  captionEnglish,
  hashtagsKhmer,
  hashtagsEnglish,
  onRegenerate,
  isRegenerating = false,
}: BilingualCaptionDisplayProps) {
  const [copiedKhmer, setCopiedKhmer] = useState(false);
  const [copiedEnglish, setCopiedEnglish] = useState(false);

  const handleCopy = (text: string, isKhmer: boolean) => {
    navigator.clipboard.writeText(text);
    if (isKhmer) {
      setCopiedKhmer(true);
      setTimeout(() => setCopiedKhmer(false), 2000);
    } else {
      setCopiedEnglish(true);
      setTimeout(() => setCopiedEnglish(false), 2000);
    }
    toast.success("Copied to clipboard!");
  };

  const khmerContent = `${captionKhmer}\n\n${hashtagsKhmer}`;
  const englishContent = `${captionEnglish}\n\n${hashtagsEnglish}`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Khmer Caption */}
        <Card className="p-6 border border-border hover:border-primary/50 transition-colors">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">ខ្មែរ (Khmer)</h3>
              <div className="space-y-3">
                <p className="text-base leading-relaxed text-foreground">{captionKhmer}</p>
                <p className="text-sm text-primary font-medium">{hashtagsKhmer}</p>
              </div>
            </div>
            <Button
              onClick={() => handleCopy(khmerContent, true)}
              variant="outline"
              size="sm"
              className="w-full"
            >
              {copiedKhmer ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Khmer
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* English Caption */}
        <Card className="p-6 border border-border hover:border-primary/50 transition-colors">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">English</h3>
              <div className="space-y-3">
                <p className="text-base leading-relaxed text-foreground">{captionEnglish}</p>
                <p className="text-sm text-primary font-medium">{hashtagsEnglish}</p>
              </div>
            </div>
            <Button
              onClick={() => handleCopy(englishContent, false)}
              variant="outline"
              size="sm"
              className="w-full"
            >
              {copiedEnglish ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy English
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>

      {onRegenerate && (
        <Button
          onClick={onRegenerate}
          variant="secondary"
          disabled={isRegenerating}
          className="w-full"
        >
          {isRegenerating ? "Regenerating..." : "Regenerate with Different Tone"}
        </Button>
      )}
    </div>
  );
}
