import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, ArrowRight } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return null; // Router will handle redirect to ContentEngine
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-border/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Leanghouy Content Engine</h1>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-5xl md:text-6xl font-bold text-foreground">
              AI-Powered Social Media Content
            </h2>
            <p className="text-xl text-muted-foreground">
              Generate bilingual captions for your salon photos in seconds
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 my-8">
            <Card className="p-6 border border-border hover:border-primary/50 transition-colors">
              <div className="text-3xl mb-3">📸</div>
              <h3 className="font-semibold text-foreground mb-2">Upload Photos</h3>
              <p className="text-sm text-muted-foreground">
                Drag and drop your haircut photos
              </p>
            </Card>
            <Card className="p-6 border border-border hover:border-primary/50 transition-colors">
              <div className="text-3xl mb-3">✨</div>
              <h3 className="font-semibold text-foreground mb-2">AI Generation</h3>
              <p className="text-sm text-muted-foreground">
                Auto-generate Khmer & English captions
              </p>
            </Card>
            <Card className="p-6 border border-border hover:border-primary/50 transition-colors">
              <div className="text-3xl mb-3">📱</div>
              <h3 className="font-semibold text-foreground mb-2">Manage Content</h3>
              <p className="text-sm text-muted-foreground">
                Track and organize all your posts
              </p>
            </Card>
          </div>

          <div className="pt-4">
            <Button
              size="lg"
              onClick={() => (window.location.href = getLoginUrl())}
              className="gap-2"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>Leanghouy Barber & Salon © 2026</p>
        </div>
      </footer>
    </div>
  );
}
