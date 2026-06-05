import { useState } from "react";
import { useLocation } from "wouter";
import { Search, Copy, Check, ExternalLink, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useListPromptTemplates } from "@workspace/api-client-react";

const TASK_TYPE_EMOJIS: Record<string, string> = {
  chatgpt: "💬",
  image_midjourney: "🎨",
  image_dalle: "🖼️",
  image_stable_diffusion: "✨",
  video_ai: "🎬",
  writing: "✍️",
  coding: "💻",
  business: "💼",
  education: "📚",
  creative: "🌟",
  personal: "🧘",
};

const CATEGORIES = [
  { value: "", label: "All", labelHi: "सभी" },
  { value: "chatgpt", label: "ChatGPT", labelHi: "चैट" },
  { value: "image_midjourney", label: "Midjourney", labelHi: "छवि" },
  { value: "image_dalle", label: "DALL-E", labelHi: "छवि" },
  { value: "video_ai", label: "Video AI", labelHi: "वीडियो" },
  { value: "writing", label: "Writing", labelHi: "लेखन" },
  { value: "coding", label: "Coding", labelHi: "कोडिंग" },
  { value: "business", label: "Business", labelHi: "व्यवसाय" },
  { value: "education", label: "Education", labelHi: "शिक्षा" },
  { value: "creative", label: "Creative", labelHi: "रचनात्मक" },
];

export default function Templates() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { data: templates, isLoading } = useListPromptTemplates(
    selectedCategory ? { category: selectedCategory } : undefined
  );

  const handleCopy = async (prompt: string, id: number) => {
    await navigator.clipboard.writeText(prompt);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Copied!", description: "Template prompt copied." });
  };

  const handleUseTemplate = (description: string, taskType: string) => {
    // Navigate home and pass data via state or query params 
    // Simplified for mockup - typically handled with a store or complex routing
    setLocation(`/?description=${encodeURIComponent(description)}&taskType=${encodeURIComponent(taskType)}`);
  };

  const filtered = (templates ?? []).filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.titleHindi.includes(search) ||
    t.description.toLowerCase().includes(search.toLowerCase()) ||
    t.descriptionHindi.includes(search)
  );

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground flex flex-col gap-2">
          <span>Templates</span>
          <span className="text-2xl text-primary font-medium opacity-90">टेम्पलेट्स</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
          Pre-built prompt structures engineered for maximum impact. Ready to use.
        </p>
      </div>

      <div className="bg-card rounded-2xl p-4 md:p-6 shadow-lg border border-card-border space-y-6">
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            data-testid="input-search-templates"
            placeholder="Search templates... / खोजें..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-12 h-14 text-lg bg-background border-border rounded-xl"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 border",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                    : "bg-secondary text-secondary-foreground border-transparent hover:border-border"
                )}
              >
                {cat.value && <span className="text-base">{TASK_TYPE_EMOJIS[cat.value]}</span>}
                <div className="flex flex-col items-start leading-none">
                  <span>{cat.label}</span>
                  <span className={cn("text-[9px] opacity-70", isSelected ? "text-primary-foreground" : "text-muted-foreground")}>{cat.labelHi}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="animate-pulse bg-card/50 border-border/50">
              <CardHeader className="space-y-4">
                <div className="h-6 w-3/4 bg-muted/50 rounded" />
                <div className="h-4 w-1/2 bg-muted/50 rounded" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-20 w-full bg-muted/50 rounded" />
                <div className="flex gap-2">
                  <div className="h-6 w-16 bg-muted/50 rounded-full" />
                  <div className="h-6 w-16 bg-muted/50 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 bg-card/30 rounded-3xl border border-border border-dashed">
          <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-medium mb-1">No templates found</h3>
          <p className="text-muted-foreground">Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(template => (
            <Card
              key={template.id}
              className="group bg-card hover:bg-card/80 border-card-border hover:border-primary/50 transition-all duration-300 shadow-lg flex flex-col h-full"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{TASK_TYPE_EMOJIS[template.taskType] ?? "📝"}</span>
                      <CardTitle className="text-lg leading-tight">{template.title}</CardTitle>
                    </div>
                    <CardDescription className="text-sm font-medium text-primary/80">{template.titleHindi}</CardDescription>
                  </div>
                  <Badge variant="secondary" className="bg-secondary text-secondary-foreground font-mono">
                    <Zap className="w-3 h-3 mr-1 text-yellow-500" />
                    {template.usageCount}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 flex flex-col">
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                  {template.descriptionHindi}
                </p>
                <div className="relative mt-auto">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-muted/20 pointer-events-none rounded-lg" />
                  <p className="text-sm text-foreground/80 font-mono bg-muted/40 rounded-lg p-4 line-clamp-3 border border-border/50">
                    {template.prompt}
                  </p>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs bg-background/50">{template.platform}</Badge>
                    {template.tags.slice(0, 1).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs bg-secondary/50">#{tag}</Badge>
                    ))}
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-9 w-9 rounded-full hover:text-primary"
                      onClick={() => handleCopy(template.prompt, template.id)}
                    >
                      {copiedId === template.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="default"
                      size="icon"
                      className="h-9 w-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => handleUseTemplate(template.description, template.taskType)}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
