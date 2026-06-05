import { useState } from "react";
import { Trash2, Copy, Check, Search, Calendar, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  useListSavedPrompts,
  useDeleteSavedPrompt,
  getListSavedPromptsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export default function History() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { data: savedPrompts, isLoading } = useListSavedPrompts();

  const deleteMutation = useDeleteSavedPrompt({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSavedPromptsQueryKey() });
        toast({ title: "Deleted", description: "Prompt removed from history." });
      },
    },
  });

  const handleCopy = async (prompt: string, id: number) => {
    await navigator.clipboard.writeText(prompt);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Copied!", description: "Content copied to clipboard." });
  };

  const filtered = (savedPrompts ?? []).filter(p =>
    p.prompt.toLowerCase().includes(search.toLowerCase()) ||
    p.taskType.toLowerCase().includes(search.toLowerCase()) ||
    (p.originalDescription ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground flex flex-col gap-2">
          <span>History</span>
          <span className="text-2xl text-primary font-medium opacity-90">इतिहास</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
          Your personal library of intelligence. Every successful generation is saved here.
        </p>
      </div>

      <div className="relative max-w-2xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          data-testid="input-search"
          placeholder="Search your saved prompts... / खोजें..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-12 h-14 text-lg bg-card border-card-border shadow-lg rounded-xl focus-visible:ring-primary"
        />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse bg-card/50 border-border/50">
              <CardContent className="h-32 p-6" />
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 bg-card/30 rounded-3xl border border-border border-dashed">
          <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-medium mb-1">No history found</h3>
          <p className="text-muted-foreground">Run agents and save their responses to build your library.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filtered.map(item => (
            <Card key={item.id} className="group bg-card border-card-border shadow-md hover:shadow-lg transition-all duration-300">
              <div className="flex flex-col md:flex-row">
                {/* Meta sidebar */}
                <div className="p-6 bg-secondary/30 md:w-64 border-b md:border-b-0 md:border-r border-border/50 flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(item.createdAt), "MMM d, yyyy")}
                  </div>
                  
                  <div className="space-y-2">
                    {item.label && (
                      <Badge variant="default" className="w-full justify-start bg-primary/20 text-primary hover:bg-primary/30 border-transparent">
                        <Tag className="w-3 h-3 mr-2" />
                        {item.label}
                      </Badge>
                    )}
                    <Badge variant="outline" className="w-full justify-start bg-background/50">
                      {item.taskType.replace(/_/g, " ")}
                    </Badge>
                    {item.platform && (
                      <Badge variant="outline" className="w-full justify-start bg-background/50">
                        {item.platform}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Content area */}
                <div className="p-6 flex-1 flex flex-col">
                  {item.originalDescription && (
                    <div className="mb-4 text-sm font-medium text-foreground/80 italic border-l-2 border-primary/50 pl-4 py-1">
                      "{item.originalDescription}"
                    </div>
                  )}
                  
                  <div className="bg-muted/30 rounded-xl p-4 mb-4 font-mono text-sm leading-relaxed border border-border/50 whitespace-pre-wrap flex-1">
                    {item.prompt}
                  </div>

                  {item.hindiExplanation && (
                    <div className="mb-6 text-sm text-muted-foreground bg-primary/5 p-3 rounded-lg border border-primary/10">
                      <span className="font-semibold text-primary mr-2">समझ:</span>
                      {item.hindiExplanation}
                    </div>
                  )}

                  <div className="flex justify-end gap-2 mt-auto">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="gap-2 hover:text-primary"
                      onClick={() => handleCopy(item.prompt, item.id)}
                    >
                      {copiedId === item.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      Copy
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground border border-transparent"
                      onClick={() => deleteMutation.mutate({ id: item.id })}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
