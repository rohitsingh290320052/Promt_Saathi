import { useState } from "react";
import {
  Mic, MicOff, Loader2, Zap, Sparkles, RefreshCw,
  Copy, Check, Bookmark, SplitSquareHorizontal, X,
  ExternalLink, ArrowRight, ChevronRight, HelpCircle,
  Wand2, ListOrdered, Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  useRunAgents, useSavePrompt, useGeneratePrompt, useRefinePrompt,
} from "@workspace/api-client-react";
import type {
  AgentRunResult, AgentResult, AgentRecommendation,
  PromptGenerateResult, GeneratedPromptVariant, PromptGenerateInputComplexity,
} from "@workspace/api-client-react";
import { useVoiceRecorder } from "@workspace/integrations-openai-ai-react";

// ─── Real-life starter scenarios ──────────────────────────────────────────────
const STARTERS = [
  { emoji: "💌", text: "Write a message to someone I haven't spoken to in years", textHi: "पुराने दोस्त को मैसेज", taskType: "writing" },
  { emoji: "🏥", text: "Explain diabetes in simple words for my elderly parents", textHi: "बीमारी आसान भाषा में", taskType: "education" },
  { emoji: "💼", text: "Help me write a professional email to my boss asking for a raise", textHi: "बॉस को ईमेल", taskType: "business" },
  { emoji: "🎂", text: "Write a heartfelt birthday speech for my best friend's surprise party", textHi: "जन्मदिन भाषण", taskType: "writing" },
  { emoji: "💻", text: "Build a simple website to showcase my portfolio", textHi: "पोर्टफोलियो वेबसाइट", taskType: "coding" },
  { emoji: "📖", text: "Explain how ChatGPT works to someone who has never used it", textHi: "AI क्या है सरल भाषा में", taskType: "education" },
  { emoji: "🌅", text: "Create a stunning image of a mountain sunrise with golden light", textHi: "सुंदर तस्वीर बनाएं", taskType: "image_dalle" },
  { emoji: "🚀", text: "Write a business plan for a home-cooked food delivery app in India", textHi: "व्यापार योजना", taskType: "business" },
  { emoji: "💔", text: "Write a kind letter helping someone going through a difficult breakup", textHi: "दिल को छूने वाला पत्र", taskType: "writing" },
  { emoji: "🎨", text: "Design a colorful festive poster for Diwali celebrations", textHi: "दीवाली पोस्टर", taskType: "image_dalle" },
  { emoji: "📱", text: "Create an Instagram caption for my travel photo from Rajasthan", textHi: "Instagram कैप्शन", taskType: "creative" },
  { emoji: "🧘", text: "Give me a simple 7-day morning routine for better mental health", textHi: "मानसिक स्वास्थ्य दिनचर्या", taskType: "education" },
];

const COMPLEX_PROMPT_STARTERS = [
  { emoji: "🏗️", text: "Design a full-stack SaaS app with auth, billing, and admin dashboard", textHi: "SaaS ऐप प्लान", taskType: "coding" },
  { emoji: "📊", text: "Create a 90-day go-to-market strategy for a new fintech product in India", textHi: "GTM रणनीति", taskType: "business" },
  { emoji: "🔬", text: "Write a research-grade literature review on renewable energy policy", textHi: "शोध समीक्षा", taskType: "education" },
  { emoji: "⚖️", text: "Draft a comprehensive legal compliance checklist for a healthcare startup", textHi: "कानूनी चेकलिस्ट", taskType: "business" },
  { emoji: "🎬", text: "Plan a 10-minute documentary script with interview questions and B-roll shots", textHi: "डॉक्यूमेंट्री स्क्रिप्ट", taskType: "creative" },
  { emoji: "🤖", text: "Build an AI agent workflow for customer support with escalation rules", textHi: "AI वर्कफ़्लो", taskType: "coding" },
];

const REFINE_ACTIONS = [
  { value: "more_detailed", label: "और विस्तृत", sub: "More detailed" },
  { value: "simpler", label: "सरल", sub: "Simpler" },
  { value: "more_creative", label: "रचनात्मक", sub: "More creative" },
  { value: "more_professional", label: "प्रोफेशनल", sub: "Professional" },
  { value: "different_tone", label: "अलग अंदाज़", sub: "Different tone" },
] as const;

// ─── What kind of help? (simplified task type labels) ─────────────────────────
const HELP_TYPES = [
  { value: "writing", emoji: "✍️", label: "लिखना है", subLabel: "Write something" },
  { value: "education", emoji: "📚", label: "समझना है", subLabel: "Explain something" },
  { value: "business", emoji: "💼", label: "काम के लिए", subLabel: "For work / business" },
  { value: "coding", emoji: "💻", label: "कोडिंग", subLabel: "Build / code something" },
  { value: "creative", emoji: "🌟", label: "रचनात्मक", subLabel: "Creative idea" },
  { value: "image_dalle", emoji: "🖼️", label: "तस्वीर बनाएं", subLabel: "Generate an image" },
  { value: "image_midjourney", emoji: "🎨", label: "Midjourney", subLabel: "Midjourney prompt" },
  { value: "image_stable_diffusion", emoji: "✨", label: "Stable Diffusion", subLabel: "SD prompt" },
  { value: "video_ai", emoji: "🎬", label: "वीडियो", subLabel: "Video AI prompt" },
  { value: "chatgpt", emoji: "💬", label: "कुछ और", subLabel: "Something else" },
];

// ─── Recommendation Banner ────────────────────────────────────────────────────
function RecommendationBanner({ rec }: { rec: AgentRecommendation }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-orange-500/8 to-yellow-500/5 p-5">
      {/* Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent pointer-events-none" />

      <div className="relative space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <span className="text-base">⭐</span>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400/80">
            Best AI for this · सबसे अच्छा AI
          </span>
        </div>

        {/* Main recommendation */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-400/20 border border-amber-400/30 flex items-center justify-center text-3xl shrink-0">
            {rec.bestAIEmoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xl font-bold text-foreground">{rec.bestAI}</span>
              {rec.canDirectRespond ? (
                <Badge className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border">
                  ✓ यहाँ उपलब्ध
                </Badge>
              ) : (
                <Badge className="text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-400 border-blue-500/30 border">
                  बाहर खोलें
                </Badge>
              )}
            </div>
            <p className="text-sm text-amber-200/80">{rec.reasonHindi}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{rec.reason}</p>
          </div>

          {/* CTA */}
          {!rec.canDirectRespond && (
            <a
              href={rec.bestAIUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm px-4 py-2.5 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg shadow-amber-500/25"
            >
              खोलें <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Alternatives */}
        {rec.alternatives && rec.alternatives.length > 0 && (
          <div className="pt-3 border-t border-amber-500/15">
            <p className="text-xs text-muted-foreground mb-2">और विकल्प · Alternatives</p>
            <div className="flex flex-wrap gap-2">
              {rec.alternatives.map((alt, i) => (
                <a
                  key={i}
                  href={alt.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={alt.why}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card/60 border border-border/60 hover:border-amber-400/40 hover:bg-amber-500/10 text-xs font-medium transition-all duration-150 group"
                >
                  <span>{alt.emoji}</span>
                  <span>{alt.name}</span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-amber-400 transition-colors" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Voice button ─────────────────────────────────────────────────────────────
function VoiceButton({ onTranscript }: { onTranscript: (t: string) => void }) {
  const recorder = useVoiceRecorder();
  const [isTranscribing, setIsTranscribing] = useState(false);

  const handleClick = async () => {
    if (recorder.state === "recording") {
      const blob = await recorder.stopRecording();
      if (blob.size === 0) return;
      setIsTranscribing(true);
      try {
        const res = await fetch("/api/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/octet-stream" },
          body: blob,
        });
        if (res.ok) {
          const data = (await res.json()) as { text: string };
          if (data.text) onTranscript(data.text);
        }
      } finally {
        setIsTranscribing(false);
      }
    } else {
      await recorder.startRecording();
    }
  };

  const isRecording = recorder.state === "recording";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isTranscribing}
      title="बोलें / Speak in Hindi or English"
      className={cn(
        "absolute bottom-3 right-3 flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200",
        isRecording
          ? "bg-red-500/20 text-red-400 border border-red-500/40"
          : isTranscribing
          ? "bg-primary/10 text-primary border border-primary/30 cursor-wait"
          : "bg-secondary/60 text-muted-foreground border border-border/60 hover:text-primary hover:border-primary/50 hover:bg-primary/10"
      )}
    >
      {isTranscribing ? (
        <><Loader2 className="w-4 h-4 animate-spin" /><span>सुन रहा हूँ...</span></>
      ) : isRecording ? (
        <><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /><MicOff className="w-4 h-4" /><span>रोकें / Stop</span></>
      ) : (
        <><Mic className="w-4 h-4" /><span>बोलें / Speak</span></>
      )}
    </button>
  );
}

// ─── Model badge ──────────────────────────────────────────────────────────────
function ModelBadge({ model }: { model?: string | null }) {
  if (!model) return null;
  const isClaude = model.startsWith("claude");
  const isImage = model === "gpt-image-1";
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border",
      isImage && "bg-orange-500/15 text-orange-400 border-orange-500/30",
      isClaude && "bg-amber-500/15 text-amber-400 border-amber-500/30",
      !isImage && !isClaude && "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    )}>
      {isImage ? "DALL-E" : isClaude ? "Claude" : "GPT-5"}
    </span>
  );
}

// ─── Agent card ───────────────────────────────────────────────────────────────
function AgentCard({
  agent, index, onSave, onCopy, copiedIndex, isSelected, onToggleSelect, canCompare,
}: {
  agent: AgentResult; index: number;
  onSave: (a: AgentResult) => void; onCopy: (text: string, i: number) => void;
  copiedIndex: number | null; isSelected: boolean;
  onToggleSelect: (i: number) => void; canCompare: boolean;
}) {
  const isImageResult = agent.contentType === "image_base64" && agent.imageBase64;
  const isPromptOnly = agent.contentType === "prompt_only";

  return (
    <Card className={cn(
      "bg-card border-card-border shadow-xl overflow-hidden flex flex-col h-full transition-all duration-300",
      isSelected ? "border-primary ring-2 ring-primary/30" : "hover:border-primary/30"
    )}>
      <CardHeader className="bg-secondary/30 pb-4">
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="text-4xl shrink-0">{agent.agentEmoji}</div>
            <div className="min-w-0">
              <CardTitle className="text-lg leading-tight">{agent.agentName}</CardTitle>
              <CardDescription className="text-xs font-medium text-primary mt-0.5">{agent.agentRole}</CardDescription>
              <div className="mt-1.5"><ModelBadge model={agent.model} /></div>
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            {canCompare && !isImageResult && (
              <Button variant="ghost" size="icon" className={cn("h-8 w-8", isSelected ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary")} onClick={() => onToggleSelect(index)}>
                <SplitSquareHorizontal className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => onSave(agent)}><Bookmark className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => onCopy(agent.content, index)}>
              {copiedIndex === index ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col">
        {isImageResult ? (
          <div className="p-4 flex-1">
            <img src={`data:image/png;base64,${agent.imageBase64}`} alt="AI generated" className="w-full rounded-xl border border-border/60" />
            {agent.content && <p className="mt-3 text-xs text-muted-foreground italic line-clamp-3">{agent.content}</p>}
          </div>
        ) : (
          <div className="p-5 flex-1 flex flex-col">
            {isPromptOnly && <Badge variant="outline" className="mb-3 w-fit text-[10px] border-dashed text-muted-foreground">Generated Prompt</Badge>}
            <pre className="flex-1 whitespace-pre-wrap font-sans text-sm text-foreground/90 leading-relaxed">{agent.content}</pre>
            {agent.navigateTo && (
              <a href={agent.navigateTo} target="_blank" rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold w-full justify-center bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 hover:border-primary/60 transition-all">
                <ExternalLink className="w-4 h-4" />Open in {agent.agentName}<ArrowRight className="w-4 h-4 ml-auto" />
              </a>
            )}
          </div>
        )}
        {agent.hindiSummary && (
          <div className="p-4 bg-muted/30 border-t border-border">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">सारांश · Summary</p>
            <p className="text-xs text-foreground/80 leading-relaxed">{agent.hindiSummary}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Compare view ─────────────────────────────────────────────────────────────
function CompareView({ agents, selectedIndices, onClose }: { agents: AgentResult[]; selectedIndices: number[]; onClose: () => void }) {
  const left = agents[selectedIndices[0]!];
  const right = agents[selectedIndices[1]!];
  if (!left || !right) return null;
  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-auto">
      <div className="max-w-7xl mx-auto p-6 min-h-screen flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div><h2 className="text-2xl font-bold">तुलना करें · Compare</h2><p className="text-sm text-muted-foreground">Pick your favourite response</p></div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>
        <div className="grid grid-cols-2 gap-4 flex-1">
          {[left, right].map((agent, i) => (
            <div key={i} className={cn("flex flex-col rounded-2xl border-2 overflow-hidden", i === 0 ? "border-primary/40" : "border-purple-500/40")}>
              <div className={cn("p-4 flex items-center gap-3", i === 0 ? "bg-primary/10" : "bg-purple-500/10")}>
                <span className="text-3xl">{agent.agentEmoji}</span>
                <div><div className="font-bold">{agent.agentName}</div><div className={cn("text-xs font-medium", i === 0 ? "text-primary" : "text-purple-400")}>{agent.agentRole}</div></div>
                <div className="ml-auto"><ModelBadge model={agent.model} /></div>
              </div>
              <div className="flex-1 p-5 bg-card overflow-auto">
                <pre className="whitespace-pre-wrap font-sans text-sm text-foreground/90 leading-relaxed">{agent.content}</pre>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-center gap-3 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">कौन सा बेहतर है? · Which do you prefer?</p>
          {[left, right].map((agent, i) => (
            <Button key={i} variant="outline" className={cn("gap-2 border-2", i === 0 ? "border-primary/40 hover:bg-primary/10" : "border-purple-500/40 hover:bg-purple-500/10")} onClick={onClose}>
              <span>{agent.agentEmoji}</span>{agent.agentName}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Generated prompt card ────────────────────────────────────────────────────
function PromptVariantCard({
  variant, index, onSave, onCopy, onRefine, onRunWithAI, copiedIndex, isRefining,
}: {
  variant: GeneratedPromptVariant; index: number;
  onSave: (v: GeneratedPromptVariant) => void;
  onCopy: (text: string, i: number) => void;
  onRefine: (prompt: string, action: string) => void;
  onRunWithAI: (prompt: string) => void;
  copiedIndex: number | null; isRefining: boolean;
}) {
  const [showRefine, setShowRefine] = useState(false);

  return (
    <Card className="bg-card border-card-border shadow-xl overflow-hidden flex flex-col h-full hover:border-primary/30 transition-all duration-300">
      <CardHeader className="bg-secondary/30 pb-4">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <Badge variant="outline" className="mb-2 text-[10px] border-primary/40 text-primary">{variant.platform}</Badge>
            <CardTitle className="text-lg leading-tight">{variant.label}</CardTitle>
            <CardDescription className="text-xs mt-1">Ready-to-use AI prompt</CardDescription>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => onSave(variant)}>
              <Bookmark className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => onCopy(variant.prompt, index)}>
              {copiedIndex === index ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col">
        <div className="p-5 flex-1">
          <pre className="whitespace-pre-wrap font-sans text-sm text-foreground/90 leading-relaxed">{variant.prompt}</pre>
        </div>
        <div className="p-4 border-t border-border bg-muted/20 space-y-2">
          <div className="relative">
            <Button
              variant="outline" size="sm" className="w-full gap-2"
              disabled={isRefining}
              onClick={() => setShowRefine((v) => !v)}
            >
              {isRefining ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
              सुधारें · Refine
            </Button>
            {showRefine && (
              <div className="absolute bottom-full left-0 right-0 mb-1 z-10 rounded-xl border border-border bg-popover shadow-lg p-1 space-y-0.5">
                {REFINE_ACTIONS.map((action) => (
                  <button
                    key={action.value}
                    type="button"
                    className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-primary/10 transition-colors"
                    onClick={() => { onRefine(variant.prompt, action.value); setShowRefine(false); }}
                  >
                    <div className="font-semibold">{action.label}</div>
                    <div className="text-muted-foreground">{action.sub}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button size="sm" className="w-full gap-2" onClick={() => onRunWithAI(variant.prompt)}>
            <Play className="w-3 h-3" />इस प्रॉम्प्ट से AI चलाएं · Run with AI
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Home() {
  const { toast } = useToast();

  // Form state (kept simple — no react-hook-form needed for this simplified UX)
  const [mode, setMode] = useState<"ask" | "generate">("ask");
  const [description, setDescription] = useState("");
  const [taskType, setTaskType] = useState("chatgpt");
  const [showHelpTypes, setShowHelpTypes] = useState(false);
  const [complexity, setComplexity] = useState<PromptGenerateInputComplexity>("complex");
  const [targetAudience, setTargetAudience] = useState("");

  // Results
  const [result, setResult] = useState<AgentRunResult | null>(null);
  const [promptResult, setPromptResult] = useState<PromptGenerateResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [selectedForCompare, setSelectedForCompare] = useState<number[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  // Onboarding: true until user has run at least one query
  const [hasRun, setHasRun] = useState(false);

  const runAgents = useRunAgents({
    mutation: {
      onSuccess: (data) => {
        setResult(data as AgentRunResult);
        setSelectedForCompare([]);
        setHasRun(true);
      },
      onError: () => toast({ title: "कुछ गलत हुआ", description: "Please try again.", variant: "destructive" }),
    },
  });

  const save = useSavePrompt({
    mutation: {
      onSuccess: () => toast({ title: "सेव हो गया ✓", description: "Response saved to history." }),
      onError: () => toast({ title: "Error", description: "Could not save.", variant: "destructive" }),
    },
  });

  const generatePrompt = useGeneratePrompt({
    mutation: {
      onSuccess: (data) => {
        setPromptResult(data as PromptGenerateResult);
        setResult(null);
        setHasRun(true);
      },
      onError: () => toast({ title: "प्रॉम्प्ट नहीं बना", description: "Please try again.", variant: "destructive" }),
    },
  });

  const refinePrompt = useRefinePrompt({
    mutation: {
      onSuccess: (data) => {
        setPromptResult(data as PromptGenerateResult);
        toast({ title: "प्रॉम्प्ट सुधारा गया", description: "Refined variants are ready." });
      },
      onError: () => toast({ title: "सुधार विफल", description: "Could not refine prompt.", variant: "destructive" }),
    },
  });

  const handleStarter = (starter: typeof STARTERS[0]) => {
    setDescription(starter.text);
    setTaskType(starter.taskType);
    setShowHelpTypes(false);
  };

  const handleRun = () => {
    if (!description.trim()) {
      toast({ title: "कुछ लिखें या बोलें", description: "Please describe what you need.", variant: "destructive" });
      return;
    }
    if (mode === "generate") {
      setPromptResult(null);
      generatePrompt.mutate({
        data: {
          description: description.trim(),
          taskType,
          complexity,
          ...(targetAudience.trim() ? { targetAudience: targetAudience.trim() } : {}),
          language: /[\u0900-\u097F]/.test(description) ? "hi" : "en",
        },
      });
      return;
    }
    setPromptResult(null);
    setResult(null);
    runAgents.mutate({ data: { description: description.trim(), taskType } });
  };

  const handleRunWithPrompt = (prompt: string) => {
    setMode("ask");
    setDescription(prompt);
    setResult(null);
    setPromptResult(null);
    runAgents.mutate({ data: { description: prompt, taskType } });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRefinePrompt = (originalPrompt: string, refineAction: string) => {
    refinePrompt.mutate({
      data: {
        originalPrompt,
        refineAction,
        taskType,
        ...(description.trim() ? { additionalContext: description.trim() } : {}),
      },
    });
  };

  const handleCopy = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast({ title: "Copy हो गया!", description: "Content copied to clipboard." });
  };

  const handleSave = (agent: AgentResult) => {
    save.mutate({ data: { prompt: agent.content, taskType: result?.taskType ?? taskType, category: taskType, label: agent.agentRole, platform: agent.agentName, originalDescription: description, isFavorite: false } });
  };

  const handleSavePromptVariant = (variant: GeneratedPromptVariant) => {
    save.mutate({
      data: {
        prompt: variant.prompt,
        taskType,
        category: taskType,
        label: variant.label,
        platform: variant.platform,
        originalDescription: description,
        hindiExplanation: promptResult?.hindiExplanation,
        isFavorite: false,
      },
    });
  };

  const handleToggleCompare = (index: number) => {
    setSelectedForCompare((prev) => {
      if (prev.includes(index)) return prev.filter((i) => i !== index);
      if (prev.length >= 2) return [prev[1]!, index];
      return [...prev, index];
    });
  };

  const isLoading = runAgents.isPending || generatePrompt.isPending;
  const isGenerateMode = mode === "generate";
  const selectedHelpType = HELP_TYPES.find((h) => h.value === taskType);
  const hasTextAgents = result?.agents.some((a) => a.contentType !== "image_base64" && a.contentType !== "prompt_only");
  const isImageTask = !isGenerateMode && ["image_dalle", "image_midjourney", "image_stable_diffusion"].includes(taskType);
  const activeStarters = isGenerateMode ? COMPLEX_PROMPT_STARTERS : STARTERS;

  return (
    <>
      {showCompare && result && (
        <CompareView agents={result.agents} selectedIndices={selectedForCompare} onClose={() => setShowCompare(false)} />
      )}

      <div className="max-w-4xl mx-auto p-5 md:p-10 space-y-10">

        {/* ── Hero ── */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {isGenerateMode ? "प्रॉम्प्ट जनरेटर · Prompt Generator" : "GPT-5 · Claude · DALL-E — सब एक साथ"}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
            {isGenerateMode ? (
              <>जटिल काम के लिए<br /><span className="text-primary">बेहतरीन प्रॉम्प्ट</span></>
            ) : (
              <>आज आपकी कैसे<br /><span className="text-primary">मदद करें?</span></>
            )}
          </h1>
          <p className="text-base text-muted-foreground max-w-xl leading-relaxed">
            {isGenerateMode ? (
              <>बड़े और जटिल कामों के लिए 3 expert prompts बनाएं — structured, step-by-step, और reasoning वाले।<br />
              <span className="text-foreground/50 text-sm">Generate production-grade prompts for complex tasks, then run them with AI.</span></>
            ) : (
              <>Hindi या English में लिखें या बोलें — 3 AI एक्सपर्ट्स तुरंत जवाब देंगे।<br />
              <span className="text-foreground/50 text-sm">Type or speak in Hindi or English. Three AI experts answer instantly.</span></>
            )}
          </p>
        </div>

        {/* ── Starter tiles (shown before first run) ── */}
        {!hasRun && !isLoading && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {isGenerateMode ? "👇 जटिल काम के उदाहरण · Complex task examples" : "👇 एक टैप में शुरू करें · Tap to start"}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {activeStarters.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleStarter(s)}
                  className="group text-left p-4 rounded-2xl bg-card border border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 space-y-1.5"
                >
                  <div className="text-2xl">{s.emoji}</div>
                  <div className="text-xs font-semibold text-primary">{s.textHi}</div>
                  <div className="text-xs text-muted-foreground leading-snug line-clamp-2 group-hover:text-foreground/70 transition-colors">{s.text}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Main input area ── */}
        <div className="space-y-5 bg-card/50 border border-border/60 rounded-2xl p-5 md:p-6">

          <Tabs value={mode} onValueChange={(v) => { setMode(v as "ask" | "generate"); setResult(null); setPromptResult(null); }}>
            <TabsList className="w-full h-auto p-1 grid grid-cols-2">
              <TabsTrigger value="ask" className="gap-2 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Zap className="w-4 h-4" />AI से पूछें · Ask AI
              </TabsTrigger>
              <TabsTrigger value="generate" className="gap-2 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Wand2 className="w-4 h-4" />प्रॉम्प्ट बनाएं · Generate Prompt
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* What kind of help */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              किस तरह की मदद चाहिए? <span className="text-muted-foreground font-normal text-xs">· What kind of help?</span>
            </label>
            <button
              type="button"
              onClick={() => setShowHelpTypes(!showHelpTypes)}
              className="flex items-center gap-3 w-full p-3 rounded-xl bg-secondary/50 border border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
            >
              <span className="text-2xl">{selectedHelpType?.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{selectedHelpType?.label}</div>
                <div className="text-xs text-muted-foreground">{selectedHelpType?.subLabel}</div>
              </div>
              <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform", showHelpTypes && "rotate-90")} />
            </button>

            {showHelpTypes && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pt-1">
                {HELP_TYPES.map((h) => (
                  <button
                    key={h.value}
                    type="button"
                    onClick={() => { setTaskType(h.value); setShowHelpTypes(false); }}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 text-center",
                      taskType === h.value
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-primary/40 hover:bg-card/80"
                    )}
                  >
                    <span className="text-2xl">{h.emoji}</span>
                    <span className={cn("text-xs font-semibold leading-tight", taskType === h.value ? "text-primary" : "text-foreground")}>{h.label}</span>
                    <span className="text-[9px] text-muted-foreground leading-tight">{h.subLabel}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Text input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              {isGenerateMode
                ? <>काम का विवरण लिखें <span className="text-muted-foreground font-normal text-xs">· Describe the complex task</span></>
                : <>अपनी बात लिखें या बोलें <span className="text-muted-foreground font-normal text-xs">· Describe what you need</span></>}
            </label>
            <div className="relative">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={isGenerateMode
                  ? "जैसे: एक ed-tech SaaS के लिए पूरा product roadmap, tech stack, और MVP plan बनाओ..."
                  : "यहाँ लिखें... जैसे: मेरे बेटे की परीक्षा है, उसके लिए एक motivational speech लिखो"}
                rows={5}
                className="resize-none text-base p-4 pb-14 bg-card border-card-border focus-visible:ring-primary shadow-inner rounded-xl w-full"
              />
              <VoiceButton onTranscript={(t) => setDescription((prev) => prev ? `${prev} ${t}` : t)} />
            </div>
            {description && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <HelpCircle className="w-3 h-3" />
                <span>{isGenerateMode
                  ? "जटिल काम में goals, constraints, और expected output लिखें · Include goals, constraints, and output format"
                  : "जितना ज़्यादा लिखेंगे, उतना अच्छा जवाब मिलेगा · More detail = better answer"}</span>
              </div>
            )}
          </div>

          {isGenerateMode && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  जटिलता · Complexity
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: "complex" as const, label: "जटिल काम", sub: "Complex — structured + breakdown" },
                    { value: "standard" as const, label: "सामान्य", sub: "Standard — 3 quick variants" },
                  ]).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setComplexity(opt.value)}
                      className={cn(
                        "p-3 rounded-xl border-2 text-left transition-all",
                        complexity === opt.value
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/40"
                      )}
                    >
                      <div className="text-sm font-semibold">{opt.label}</div>
                      <div className="text-[11px] text-muted-foreground">{opt.sub}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  किसके लिए? <span className="text-muted-foreground font-normal text-xs">· Target audience (optional)</span>
                </label>
                <Input
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g. senior developers, Indian SMB founders, university students"
                  className="bg-card"
                />
              </div>
            </div>
          )}

          {/* Image task note */}
          {isImageTask && (
            <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-secondary/20 p-3 text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>{taskType === "image_dalle" ? "3 real images will be generated — this takes about 20 seconds." : "3 expertly crafted prompts will be made with an 'Open' button for each platform."}</span>
            </div>
          )}

          {/* Run button */}
          <Button
            onClick={handleRun}
            disabled={isLoading || !description.trim()}
            size="lg"
            className="w-full h-14 text-base font-bold rounded-xl gap-3 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/25 disabled:opacity-50"
          >
            {isLoading ? (
              <><RefreshCw className="w-5 h-5 animate-spin" /><span>{isGenerateMode ? "प्रॉम्प्ट बन रहा है... / Generating prompts..." : "AI सोच रहा है... / Working on it..."}</span></>
            ) : isGenerateMode ? (
              <><Wand2 className="w-5 h-5" /><span>प्रॉम्प्ट बनाएं · Generate Prompts</span></>
            ) : (
              <><Zap className="w-5 h-5 fill-current" /><span>AI से पूछें · Ask AI</span></>
            )}
          </Button>
        </div>

        {/* ── Loading ── */}
        {isLoading && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>{isGenerateMode
                ? "बेहतरीन प्रॉम्प्ट तैयार हो रहे हैं... · Crafting expert prompts..."
                : "GPT-5 और Claude आपका जवाब तैयार कर रहे हैं... · GPT-5 and Claude are working on your answer..."}</span>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse bg-card/50 border-border/50">
                  <CardHeader className="gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted/50" />
                    <div className="space-y-2"><div className="h-4 w-2/3 bg-muted/50 rounded" /><div className="h-3 w-1/2 bg-muted/50 rounded" /></div>
                  </CardHeader>
                  <CardContent><div className="space-y-2">{[1,2,3,4].map(j => <div key={j} className="h-3 bg-muted/50 rounded" style={{ width: j === 3 ? "70%" : "100%" }} />)}</div></CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ── Prompt generation results ── */}
        {promptResult && !isLoading && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
              <Wand2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-primary text-sm mb-1">प्रॉम्प्ट गाइड · Prompt guide</p>
                <p className="text-sm text-foreground/90">{promptResult.hindiExplanation}</p>
              </div>
            </div>

            {promptResult.taskBreakdown && promptResult.taskBreakdown.length > 0 && (
              <div className="rounded-2xl border border-border/60 bg-card/50 p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <ListOrdered className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">काम के चरण · Task breakdown</h3>
                </div>
                <div className="space-y-3">
                  {promptResult.taskBreakdown.map((step) => (
                    <div key={step.step} className="flex gap-3 p-3 rounded-xl bg-secondary/30 border border-border/40">
                      <div className="w-7 h-7 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                        {step.step}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{step.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {promptResult.tips && promptResult.tips.length > 0 && (
              <div className="rounded-xl border border-border/50 bg-secondary/20 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">💡 सुझाव · Tips</p>
                <ul className="space-y-1.5">
                  {promptResult.tips.map((tip, i) => (
                    <li key={i} className="text-sm text-foreground/80 flex gap-2">
                      <span className="text-primary shrink-0">•</span>{tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-5 items-start">
              {promptResult.prompts.map((variant, i) => (
                <PromptVariantCard
                  key={i}
                  variant={variant}
                  index={i}
                  onSave={handleSavePromptVariant}
                  onCopy={handleCopy}
                  onRefine={handleRefinePrompt}
                  onRunWithAI={handleRunWithPrompt}
                  copiedIndex={copiedIndex}
                  isRefining={refinePrompt.isPending}
                />
              ))}
            </div>

            <div className="pt-4 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">कोई प्रॉम्प्ट पसंद नहीं? दोबारा बनाएं · Not happy? Generate again</p>
              <Button variant="outline" className="gap-2" onClick={() => { setPromptResult(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                <RefreshCw className="w-4 h-4" />नया विवरण · New task
              </Button>
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {result && !isLoading && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">

            {/* AI Recommendation Banner */}
            {result.recommendation && (
              <RecommendationBanner rec={result.recommendation} />
            )}

            {result.hindiOverview && (
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-primary text-sm mb-1">AI का सारांश · Summary</p>
                  <p className="text-sm text-foreground/90">{result.hindiOverview}</p>
                </div>
              </div>
            )}

            {hasTextAgents && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {selectedForCompare.length === 0 && "💡  को दबाएं और 2 जवाब चुनें, फिर तुलना करें"}
                  {selectedForCompare.length === 1 && "एक और चुनें · Select one more to compare"}
                  {selectedForCompare.length === 2 && "तुलना के लिए तैयार! · Ready to compare"}
                </p>
                {selectedForCompare.length === 2 && (
                  <Button size="sm" variant="outline" className="gap-2 bg-primary/15 text-primary border-primary/40 hover:bg-primary/25" onClick={() => setShowCompare(true)}>
                    <SplitSquareHorizontal className="w-4 h-4" />तुलना करें
                  </Button>
                )}
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-5 items-start">
              {result.agents.map((agent, i) => (
                <AgentCard key={i} agent={agent} index={i}
                  onSave={handleSave} onCopy={handleCopy} copiedIndex={copiedIndex}
                  isSelected={selectedForCompare.includes(i)}
                  onToggleSelect={handleToggleCompare}
                  canCompare={hasTextAgents ?? false}
                />
              ))}
            </div>

            {/* Ask again */}
            <div className="pt-4 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">संतुष्ट नहीं? कुछ और पूछें · Not satisfied? Try again</p>
              <Button variant="outline" className="gap-2" onClick={() => { setResult(null); setDescription(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                <RefreshCw className="w-4 h-4" />नया सवाल · New question
              </Button>
            </div>
          </div>
        )}

        {/* ── Starter tiles (shown again after first run at bottom) ── */}
        {hasRun && !isLoading && !result && !promptResult && (
          <div className="space-y-4 pt-4 border-t border-border/50">
            <p className="text-sm font-semibold text-muted-foreground">फिर से कोशिश करें · Try another</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {activeStarters.slice(0, 6).map((s, i) => (
                <button key={i} onClick={() => handleStarter(s)}
                  className="group text-left p-4 rounded-2xl bg-card border border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 space-y-1.5">
                  <div className="text-2xl">{s.emoji}</div>
                  <div className="text-xs font-semibold text-primary">{s.textHi}</div>
                  <div className="text-xs text-muted-foreground leading-snug line-clamp-2">{s.text}</div>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </>
  );
}
