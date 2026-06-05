import { Router, type IRouter } from "express";
import { RunAgentsBody } from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { generateImageBuffer } from "@workspace/integrations-openai-ai-server/image";

const router: IRouter = Router();

type AgentResultOutput = {
  agentName: string;
  agentRole: string;
  agentEmoji: string;
  model: string;
  content: string;
  contentType: "text" | "markdown" | "code" | "image_base64" | "prompt_only";
  language: string;
  hindiSummary: string | null;
  imageBase64: string | null;
  navigateTo: string | null;
};

function isHindiText(text: string): boolean {
  return /[\u0900-\u097F]/.test(text);
}

function extractHindiSummary(content: string): { main: string; hindi: string | null } {
  if (content.includes("---Hindi Summary---")) {
    const parts = content.split("---Hindi Summary---");
    return { main: (parts[0] ?? content).trim(), hindi: (parts[1] ?? "").trim() || null };
  }
  return { main: content, hindi: null };
}

async function callGPT(systemPrompt: string, userMessage: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-5.4",
    max_completion_tokens: 8192,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });
  return completion.choices[0]?.message?.content ?? "";
}

async function callClaude(systemPrompt: string, userMessage: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });
  const block = message.content[0];
  return block?.type === "text" ? block.text : "";
}

async function runTextAgents(
  description: string,
  taskType: string,
  tone?: string,
  targetAudience?: string
): Promise<AgentResultOutput[]> {
  const isHindi = isHindiText(description);
  const langNote = isHindi
    ? "The user wrote in Hindi. Respond in English but include a brief Hindi summary at the end marked with '---Hindi Summary---'."
    : "";
  const toneNote = tone ? `Tone: ${tone}.` : "";
  const audienceNote = targetAudience ? `Target audience: ${targetAudience}.` : "";
  const base = [langNote, toneNote, audienceNote].filter(Boolean).join(" ");

  type AgentDef = {
    agentName: string;
    agentRole: string;
    agentEmoji: string;
    model: "gpt" | "claude" | "gpt-alt";
    contentType: "text" | "markdown" | "code";
    systemPrompt: string;
  };

  const agentDefs: AgentDef[] = (() => {
    if (taskType === "coding" || taskType === "code") {
      return [
        {
          agentName: "GPT-5",
          agentRole: "Full Solution",
          agentEmoji: "💻",
          model: "gpt" as const,
          contentType: "code" as const,
          systemPrompt: `You are an expert software engineer powered by GPT-5. Write clean, production-ready code with comments. ${base} Always provide complete, runnable code with clear explanations.`,
        },
        {
          agentName: "Claude",
          agentRole: "Architecture & Best Practices",
          agentEmoji: "🏗️",
          model: "claude" as const,
          contentType: "markdown" as const,
          systemPrompt: `You are a software architect powered by Claude. Explain the best architectural approach, design patterns, and best practices for this problem. ${base} Focus on scalability, maintainability, and clean code principles. Use markdown formatting.`,
        },
        {
          agentName: "GPT-5 Optimizer",
          agentRole: "Performance & Alternatives",
          agentEmoji: "⚡",
          model: "gpt-alt" as const,
          contentType: "code" as const,
          systemPrompt: `You are a performance optimization expert powered by GPT-5. Provide an optimized, alternative approach to solve this problem. ${base} Focus on efficiency, edge cases, and provide a comparison with the naive solution.`,
        },
      ];
    }
    if (taskType === "writing") {
      return [
        {
          agentName: "GPT-5",
          agentRole: "Creative Draft",
          agentEmoji: "✍️",
          model: "gpt" as const,
          contentType: "markdown" as const,
          systemPrompt: `You are an award-winning creative writer powered by GPT-5. Write a compelling, original piece. ${base} Use vivid language, strong narrative, and engaging flow. Format beautifully with markdown.`,
        },
        {
          agentName: "Claude",
          agentRole: "Polished & Professional",
          agentEmoji: "📝",
          model: "claude" as const,
          contentType: "markdown" as const,
          systemPrompt: `You are a professional editor and writer powered by Claude. Write a polished, structured version. ${base} Prioritize clarity, impact, and professional tone. Include headings and structure.`,
        },
        {
          agentName: "GPT-5 Storyteller",
          agentRole: "Narrative & Emotional",
          agentEmoji: "🎭",
          model: "gpt-alt" as const,
          contentType: "markdown" as const,
          systemPrompt: `You are a master storyteller powered by GPT-5. Write an emotionally resonant, story-driven version. ${base} Use narrative techniques, personal voice, and create genuine emotional connection.`,
        },
      ];
    }
    if (taskType === "business") {
      return [
        {
          agentName: "GPT-5",
          agentRole: "Strategic Analysis",
          agentEmoji: "📊",
          model: "gpt" as const,
          contentType: "markdown" as const,
          systemPrompt: `You are a McKinsey-level business strategist powered by GPT-5. Provide a structured, data-driven strategic analysis. ${base} Use frameworks like SWOT, Porter's Five Forces, or OKRs. Format with clear sections and bullet points.`,
        },
        {
          agentName: "Claude",
          agentRole: "Executive Perspective",
          agentEmoji: "💼",
          model: "claude" as const,
          contentType: "markdown" as const,
          systemPrompt: `You are a C-suite executive advisor powered by Claude. Write a concise, actionable executive response. ${base} Be direct, decisive, and focused on outcomes. Lead with the recommendation, then support it.`,
        },
        {
          agentName: "GPT-5 Innovator",
          agentRole: "Creative Business Angle",
          agentEmoji: "🚀",
          model: "gpt-alt" as const,
          contentType: "markdown" as const,
          systemPrompt: `You are a Silicon Valley entrepreneur powered by GPT-5. Provide a disruptive, creative business perspective. ${base} Think outside conventional frameworks, identify hidden opportunities, and challenge assumptions.`,
        },
      ];
    }
    if (taskType === "education") {
      return [
        {
          agentName: "GPT-5",
          agentRole: "Deep Explanation",
          agentEmoji: "🎓",
          model: "gpt" as const,
          contentType: "markdown" as const,
          systemPrompt: `You are a brilliant professor powered by GPT-5. Provide a thorough, academically rigorous explanation. ${base} Use examples, analogies, and build from fundamentals to advanced concepts.`,
        },
        {
          agentName: "Claude",
          agentRole: "Simple & Clear",
          agentEmoji: "📚",
          model: "claude" as const,
          contentType: "markdown" as const,
          systemPrompt: `You are a patient, excellent tutor powered by Claude. Explain this in the simplest, most accessible way. ${base} Use simple language, step-by-step breakdown, relatable examples.`,
        },
        {
          agentName: "GPT-5 Mentor",
          agentRole: "Practical Application",
          agentEmoji: "🧠",
          model: "gpt-alt" as const,
          contentType: "markdown" as const,
          systemPrompt: `You are an industry mentor powered by GPT-5 with decades of experience. Explain the real-world application and practical value. ${base} Connect theory to practice, share what actually matters, and give actionable next steps.`,
        },
      ];
    }
    if (taskType === "creative") {
      return [
        {
          agentName: "GPT-5",
          agentRole: "Bold & Original",
          agentEmoji: "🌟",
          model: "gpt" as const,
          contentType: "markdown" as const,
          systemPrompt: `You are a visionary creative director powered by GPT-5. Create something bold, original, and unexpected. ${base} Push creative boundaries, subvert expectations, and create something genuinely memorable.`,
        },
        {
          agentName: "Claude",
          agentRole: "Refined & Elegant",
          agentEmoji: "🎨",
          model: "claude" as const,
          contentType: "markdown" as const,
          systemPrompt: `You are a refined artist with exquisite taste powered by Claude. Create something elegant, balanced, and deeply crafted. ${base} Every word should earn its place. Focus on beauty, rhythm, and emotional depth.`,
        },
        {
          agentName: "GPT-5 Rebel",
          agentRole: "Experimental",
          agentEmoji: "⚡",
          model: "gpt-alt" as const,
          contentType: "markdown" as const,
          systemPrompt: `You are an experimental, avant-garde creator powered by GPT-5. Create something unconventional and rule-breaking. ${base} Challenge every assumption, use unexpected structures, and create something that surprises even you.`,
        },
      ];
    }
    // Default / chatgpt / personal
    return [
      {
        agentName: "GPT-5",
        agentRole: "Comprehensive Answer",
        agentEmoji: "🎯",
        model: "gpt" as const,
        contentType: "markdown" as const,
        systemPrompt: `You are a world-class expert powered by GPT-5. Provide the most comprehensive, accurate, and well-structured response. ${base} Use markdown formatting with clear headings, examples, and actionable insights.`,
      },
      {
        agentName: "Claude",
        agentRole: "Clear & Concise",
        agentEmoji: "✨",
        model: "claude" as const,
        contentType: "markdown" as const,
        systemPrompt: `You are Claude, brilliant at making complex things simple. Give a clear, concise, easy-to-understand response. ${base} Use simple language, short paragraphs, and practical examples anyone can follow.`,
      },
      {
        agentName: "GPT-5 Critic",
        agentRole: "Alternative Perspective",
        agentEmoji: "🔍",
        model: "gpt-alt" as const,
        contentType: "markdown" as const,
        systemPrompt: `You are a critical thinker powered by GPT-5 who challenges conventional wisdom. Provide a contrarian, alternative perspective. ${base} Question assumptions, highlight what others miss, and offer a genuinely different angle.`,
      },
    ];
  })();

  const agentPromises = agentDefs.map(async (def): Promise<AgentResultOutput> => {
    const raw = def.model === "claude"
      ? await callClaude(def.systemPrompt, description)
      : await callGPT(def.systemPrompt, description);

    const { main, hindi } = extractHindiSummary(raw);
    return {
      agentName: def.agentName,
      agentRole: def.agentRole,
      agentEmoji: def.agentEmoji,
      model: def.model === "claude" ? "claude-sonnet-4-6" : "gpt-5.4",
      content: main,
      contentType: def.contentType,
      language: isHindi ? "hi" : "en",
      hindiSummary: hindi,
      imageBase64: null,
      navigateTo: null,
    };
  });

  return Promise.all(agentPromises);
}

async function runImageAgents(
  description: string,
  taskType: string
): Promise<AgentResultOutput[]> {
  const isHindi = isHindiText(description);

  if (taskType === "image_dalle") {
    // Generate 3 different prompt variations, then generate real images with gpt-image-1
    const promptSystems = [
      "You are a DALL-E prompt engineer. Write a vivid, detailed image generation prompt for DALL-E. Focus on art style, lighting, composition, mood. Output ONLY the prompt, nothing else.",
      "You are a cinematic artist. Write a photorealistic image prompt for DALL-E. Think like a film director — describe camera angle, lighting, subject, atmosphere. Output ONLY the prompt.",
      "You are an abstract/artistic visionary. Write a creative, artistic image prompt for DALL-E. Think surreal, painterly, or conceptual. Output ONLY the prompt.",
    ];

    const agentDefs = [
      { agentName: "DALL-E", agentRole: "Vivid Composition", agentEmoji: "🖼️" },
      { agentName: "DALL-E Cinematic", agentRole: "Photorealistic", agentEmoji: "🎬" },
      { agentName: "DALL-E Artistic", agentRole: "Abstract & Creative", agentEmoji: "🎨" },
    ];

    const results = await Promise.all(
      promptSystems.map(async (sys, i): Promise<AgentResultOutput> => {
        const prompt = await callGPT(sys, description);
        let imageBase64: string | null = null;
        let content = prompt;
        try {
          const buffer = await generateImageBuffer(prompt.trim(), "1024x1024");
          imageBase64 = buffer.toString("base64");
          content = prompt;
        } catch {
          content = prompt;
        }
        const def = agentDefs[i]!;
        return {
          agentName: def.agentName,
          agentRole: def.agentRole,
          agentEmoji: def.agentEmoji,
          model: "gpt-image-1",
          content,
          contentType: imageBase64 ? "image_base64" : "prompt_only",
          language: isHindi ? "hi" : "en",
          hindiSummary: null,
          imageBase64,
          navigateTo: null,
        };
      })
    );
    return results;
  }

  if (taskType === "image_midjourney") {
    const promptSystems = [
      "You are a Midjourney expert. Write a highly detailed Midjourney prompt. Include subject, style, lighting, --ar ratio, --style, --v parameters. Output ONLY the Midjourney prompt with parameters.",
      "You are a Midjourney photorealism expert. Write a cinematic Midjourney prompt focused on photorealism. Include all technical parameters. Output ONLY the prompt.",
      "You are a Midjourney art director. Write an artistic, stylized Midjourney prompt. Reference art styles or artists if relevant. Include all parameters. Output ONLY the prompt.",
    ];
    const agentDefs = [
      { agentName: "Midjourney", agentRole: "Classic Style", agentEmoji: "🎨" },
      { agentName: "MJ Cinematic", agentRole: "Photorealistic", agentEmoji: "📸" },
      { agentName: "MJ Artistic", agentRole: "Stylized Art", agentEmoji: "🖌️" },
    ];
    return Promise.all(
      promptSystems.map(async (sys, i): Promise<AgentResultOutput> => {
        const prompt = (await callGPT(sys, description)).trim();
        const def = agentDefs[i]!;
        const encodedPrompt = encodeURIComponent(prompt);
        return {
          agentName: def.agentName,
          agentRole: def.agentRole,
          agentEmoji: def.agentEmoji,
          model: "gpt-5.4",
          content: prompt,
          contentType: "prompt_only",
          language: isHindi ? "hi" : "en",
          hindiSummary: null,
          imageBase64: null,
          navigateTo: `https://www.midjourney.com/imagine?prompt=${encodedPrompt}`,
        };
      })
    );
  }

  if (taskType === "image_stable_diffusion") {
    const promptSystems = [
      "You are a Stable Diffusion expert. Write a detailed positive prompt for Stable Diffusion. Include style keywords, quality tags like 'masterpiece, best quality', and subject details. Output ONLY the positive prompt.",
      "You are a Stable Diffusion photorealism expert. Write a realistic photography-style SD prompt. Include camera settings, lighting, and quality tags. Output ONLY the prompt.",
      "You are a Stable Diffusion anime/artistic expert. Write a stylized SD prompt with anime or illustration style. Include style tags. Output ONLY the prompt.",
    ];
    const agentDefs = [
      { agentName: "Stable Diffusion", agentRole: "General Style", agentEmoji: "✨" },
      { agentName: "SD Realistic", agentRole: "Photorealistic", agentEmoji: "📷" },
      { agentName: "SD Artistic", agentRole: "Stylized", agentEmoji: "🎭" },
    ];
    return Promise.all(
      promptSystems.map(async (sys, i): Promise<AgentResultOutput> => {
        const prompt = (await callGPT(sys, description)).trim();
        const def = agentDefs[i]!;
        const encodedPrompt = encodeURIComponent(prompt);
        return {
          agentName: def.agentName,
          agentRole: def.agentRole,
          agentEmoji: def.agentEmoji,
          model: "gpt-5.4",
          content: prompt,
          contentType: "prompt_only",
          language: isHindi ? "hi" : "en",
          hindiSummary: null,
          imageBase64: null,
          navigateTo: `https://stablediffusionweb.com/#demo?prompt=${encodedPrompt}`,
        };
      })
    );
  }

  if (taskType === "video_ai") {
    const agentDefs = [
      {
        agentName: "Runway",
        agentRole: "Scene Description",
        agentEmoji: "🎬",
        system: "You are a Runway ML video prompt expert. Write a cinematic video generation prompt describing the scene, camera motion, and mood. Output ONLY the prompt.",
        url: (p: string) => `https://runwayml.com/`,
      },
      {
        agentName: "Sora",
        agentRole: "OpenAI Video",
        agentEmoji: "🌊",
        system: "You are an OpenAI Sora prompt expert. Write a vivid, detailed video generation prompt. Describe subjects, motion, environment, and style. Output ONLY the prompt.",
        url: (p: string) => `https://sora.com/`,
      },
      {
        agentName: "Pika",
        agentRole: "Short Video Clip",
        agentEmoji: "⚡",
        system: "You are a Pika video prompt expert. Write a concise, punchy video clip prompt. Focus on action, motion, and visual impact. Output ONLY the prompt.",
        url: (p: string) => `https://pika.art/`,
      },
    ];
    return Promise.all(
      agentDefs.map(async (def): Promise<AgentResultOutput> => {
        const prompt = (await callGPT(def.system, description)).trim();
        return {
          agentName: def.agentName,
          agentRole: def.agentRole,
          agentEmoji: def.agentEmoji,
          model: "gpt-5.4",
          content: prompt,
          contentType: "prompt_only",
          language: isHindi ? "hi" : "en",
          hindiSummary: null,
          imageBase64: null,
          navigateTo: def.url(prompt),
        };
      })
    );
  }

  // Fallback
  return runTextAgents(description, taskType);
}

// ─── AI Recommendation Engine ─────────────────────────────────────────────────

type AgentAlternative = { name: string; emoji: string; url: string; why: string };
type AgentRecommendation = {
  bestAI: string;
  bestAIEmoji: string;
  bestAIUrl: string;
  canDirectRespond: boolean;
  reason: string;
  reasonHindi: string;
  alternatives: AgentAlternative[];
};

const AI_TOOLS_CATALOGUE = `
AVAILABLE AI TOOLS (you must pick from this list):

Text/Chat (PromptBridge CAN respond directly):
- GPT-5 | 🤖 | https://chatgpt.com | Best for: general questions, analysis, explanations, summaries
- Claude | 🧠 | https://claude.ai | Best for: long-form writing, deep reasoning, coding, research, nuanced topics
- Gemini | ✨ | https://gemini.google.com | Best for: Google Workspace integration, multimodal, real-time info

Image (PromptBridge CAN respond with DALL-E):
- DALL-E | 🖼️ | https://chatgpt.com/image | Best for: photorealistic images, concept art, illustrations, portraits
- Midjourney | 🎨 | https://midjourney.com | Best for: stunning artistic images, cinematic, painterly, highest quality art, avatars
- Stable Diffusion | ✨ | https://stablediffusionweb.com | Best for: custom/stylized images, open-source, anime, fantasy art
- Leonardo AI | 🦁 | https://leonardo.ai | Best for: game assets, concept art, characters, consistent styles
- Adobe Firefly | 🔥 | https://firefly.adobe.com | Best for: professional design assets, safe-for-commercial-use images
- Canva AI | 🎨 | https://canva.com | Best for: social media posts, banners, flyers, non-designers

Video (PromptBridge CANNOT respond, link only):
- Runway ML | 🎬 | https://runwayml.com | Best for: cinematic video generation, video editing AI, professional video
- Sora | 🌊 | https://sora.com | Best for: realistic video clips, text-to-video, OpenAI video
- Pika | ⚡ | https://pika.art | Best for: short fun video clips, social media videos, quick animations
- Kling AI | 🎭 | https://klingai.com | Best for: high-quality realistic video, long video

Audio/Music (PromptBridge CANNOT respond, link only):
- Suno | 🎵 | https://suno.com | Best for: AI music generation, full songs with vocals, any genre
- Udio | 🎶 | https://udio.com | Best for: music generation, diverse genres, high quality audio
- ElevenLabs | 🎙️ | https://elevenlabs.io | Best for: voice cloning, text-to-speech, podcasts, audiobooks

Coding/Development (PromptBridge CAN respond with Claude/GPT):
- GitHub Copilot | 👨‍💻 | https://github.com/features/copilot | Best for: real-time code suggestions inside your IDE
- Cursor | 🖱️ | https://cursor.sh | Best for: AI-powered code editor, full project coding
- Replit AI | 🔧 | https://replit.com | Best for: running and building apps online, beginners

Research/Knowledge (PromptBridge CANNOT respond best, link only):
- Perplexity | 🔍 | https://perplexity.ai | Best for: real-time web search + AI answers, research, fact-checking, news
- NotebookLM | 📓 | https://notebooklm.google | Best for: understanding documents, PDFs, research papers

Presentations (PromptBridge CANNOT respond, link only):
- Gamma | 📊 | https://gamma.app | Best for: beautiful AI-generated slide decks and presentations
- Beautiful.ai | 🎯 | https://beautiful.ai | Best for: professional presentation design

Writing/Marketing (PromptBridge CAN respond with Claude/GPT):
- Jasper | ✍️ | https://jasper.ai | Best for: marketing copy, SEO content, brand voice
- Copy.ai | 📝 | https://copy.ai | Best for: marketing content, sales emails, ad copy

Translation (PromptBridge CAN respond but these are specialized):
- DeepL | 🌍 | https://deepl.com | Best for: accurate document translation, 30+ languages
- Google Translate | 🌐 | https://translate.google.com | Best for: quick text translation, conversation

Legal/Specialized (PromptBridge CANNOT respond best, link only):
- Harvey AI | ⚖️ | https://harvey.ai | Best for: legal documents, contracts, case analysis

Design (PromptBridge CANNOT respond, link only):
- Figma AI | 🖌️ | https://figma.com | Best for: UI/UX design, wireframes, prototypes
- Looka | 💼 | https://looka.com | Best for: logo design, brand kits
`;

async function getAIRecommendation(description: string, taskType: string): Promise<AgentRecommendation> {
  const fallback: AgentRecommendation = {
    bestAI: "Claude",
    bestAIEmoji: "🧠",
    bestAIUrl: "https://claude.ai",
    canDirectRespond: true,
    reason: "Claude is excellent for this type of task.",
    reasonHindi: "Claude इस काम के लिए बेहतरीन है।",
    alternatives: [
      { name: "GPT-5", emoji: "🤖", url: "https://chatgpt.com", why: "Great general-purpose AI" },
      { name: "Perplexity", emoji: "🔍", url: "https://perplexity.ai", why: "For research with web search" },
    ],
  };

  try {
    const promptable = `
User request: "${description}"
Task type: ${taskType}

${AI_TOOLS_CATALOGUE}

RULES:
- "canDirectRespond" = true ONLY if PromptBridge CAN respond directly (text/coding/writing/business/education/creative/DALL-E image tasks)
- "canDirectRespond" = false for: video, music, presentations, real-time web search, specialized tools, Midjourney, Stable Diffusion
- Pick the SINGLE best AI tool for this SPECIFIC request
- Consider the user's EXACT words, not just the category
- Provide 2-3 alternatives that are meaningfully different
- Keep reason under 20 words
- Keep reasonHindi under 25 words in Hindi script

Return ONLY valid JSON matching this exact shape:
{
  "bestAI": "name",
  "bestAIEmoji": "emoji",
  "bestAIUrl": "https://...",
  "canDirectRespond": true/false,
  "reason": "English reason",
  "reasonHindi": "Hindi reason",
  "alternatives": [
    { "name": "name", "emoji": "emoji", "url": "https://...", "why": "short why" }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 500,
      messages: [
        { role: "system", content: "You are an AI tool recommendation expert. Return ONLY valid compact JSON with no markdown fences." },
        { role: "user", content: promptable },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned) as AgentRecommendation;
    return parsed;
  } catch {
    return fallback;
  }
}

router.post("/agents/run", async (req, res): Promise<void> => {
  const parsed = RunAgentsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { description, taskType, tone, targetAudience } = parsed.data;

  const isImageTask = ["image_dalle", "image_midjourney", "image_stable_diffusion", "video_ai"].includes(taskType);

  const agentResultsPromise = isImageTask
    ? runImageAgents(description, taskType)
    : runTextAgents(description, taskType, tone ?? undefined, targetAudience ?? undefined);

  const isHindi = isHindiText(description);
  const hindiOverviewPromise = openai.chat.completions.create({
    model: "gpt-5.4",
    max_completion_tokens: 200,
    messages: [
      {
        role: "system",
        content: "You are a bilingual assistant. Summarize what 3 AI agents have done in 1-2 sentences in Hindi. Be brief and clear.",
      },
      {
        role: "user",
        content: `Task: "${description}" (Type: ${taskType}). Three AI agents have responded. Summarize in Hindi.`,
      },
    ],
  });

  const recommendationPromise = getAIRecommendation(description, taskType);

  const [agentResults, hindiOverviewCompletion, recommendation] = await Promise.all([
    agentResultsPromise,
    hindiOverviewPromise,
    recommendationPromise,
  ]);

  const hindiOverview =
    hindiOverviewCompletion.choices[0]?.message?.content ??
    "तीन AI एजेंट्स ने आपके सवाल का जवाब दिया है।";

  res.json({ agents: agentResults, taskType, hindiOverview, recommendation });
});

export default router;
