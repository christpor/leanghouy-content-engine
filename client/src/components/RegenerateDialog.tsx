import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface RegenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegenerate: (tone: "professional" | "casual" | "trendy", customPrompt?: string) => Promise<void>;
  isLoading?: boolean;
}

export function RegenerateDialog({
  open,
  onOpenChange,
  onRegenerate,
  isLoading = false,
}: RegenerateDialogProps) {
  const [selectedTone, setSelectedTone] = useState<"professional" | "casual" | "trendy">("professional");
  const [customPrompt, setCustomPrompt] = useState("");

  const handleRegenerate = async () => {
    await onRegenerate(selectedTone, customPrompt || undefined);
    onOpenChange(false);
    setCustomPrompt("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Regenerate Captions</DialogTitle>
          <DialogDescription>
            Choose a different tone or add custom instructions to regenerate your captions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Tone Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Caption Tone</Label>
            <RadioGroup value={selectedTone} onValueChange={(value: any) => setSelectedTone(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="professional" id="professional" />
                <Label htmlFor="professional" className="font-normal cursor-pointer">
                  <span className="font-medium">Professional</span>
                  <p className="text-sm text-muted-foreground">Formal, polished, business-focused</p>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="casual" id="casual" />
                <Label htmlFor="casual" className="font-normal cursor-pointer">
                  <span className="font-medium">Casual</span>
                  <p className="text-sm text-muted-foreground">Friendly, approachable, conversational</p>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="trendy" id="trendy" />
                <Label htmlFor="trendy" className="font-normal cursor-pointer">
                  <span className="font-medium">Trendy</span>
                  <p className="text-sm text-muted-foreground">Modern, energetic, social media-savvy</p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Custom Prompt */}
          <div className="space-y-2">
            <Label htmlFor="customPrompt" className="text-base font-semibold">
              Custom Instructions (Optional)
            </Label>
            <Textarea
              id="customPrompt"
              placeholder="e.g., 'Focus on the hair color' or 'Make it more playful'"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="min-h-20"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Add specific instructions to customize the caption generation
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRegenerate}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Regenerating...
              </>
            ) : (
              "Regenerate"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
