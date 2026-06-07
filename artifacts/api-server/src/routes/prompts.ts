import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { savedPromptsTable, promptTemplatesTable } from "@workspace/db";
import {
  GeneratePromptBody,
  RefinePromptBody,
  SavePromptBody,
  ListSavedPromptsQueryParams,
  GetSavedPromptParams,
  DeleteSavedPromptParams,
  ListPromptTemplatesQueryParams,
  GetPromptTemplateParams,
  GetPromptStatsResponse,
} 
from "@workspace/api-zod"; 

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY!
);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const router: IRouter = Router();

const TASK_TYPE_SYSTEM_PROMPTS: Record<string, string> = {
  chatgpt: `You are an expert prompt engineer specializing in creating highly effective prompts for ChatGPT and large language models. Generate clear, specific, and effective prompts that will get the best results from AI chatbots.`,
  image_midjourney: `You are an expert Midjourney prompt engineer. Generate detailed image prompts optimized for Midjourney v6, including style descriptors, lighting, camera angles, artistic references, and quality parameters like --ar 16:9 --v 6 --q 2.`,
  image_dalle: `You are an expert DALL-E prompt engineer. Generate detailed, vivid image descriptions optimized for DALL-E 3, focusing on subject matter, style, mood, lighting, and composition.`,
  image_stable_diffusion: `You are an expert Stable Diffusion prompt engineer. Generate prompts with positive and negative prompt sections, including artistic styles, technical parameters, and quality boosters like "masterpiece, best quality, highly detailed".`,
  video_ai: `You are an expert AI video prompt engineer for tools like Sora, RunwayML, and Pika. Generate cinematic video prompts with scene descriptions, camera movements, lighting, mood, and duration hints.`,
  writing: `You are an expert writing prompt engineer. Generate detailed writing prompts that specify tone, audience, format, length, and key points to cover.`,
  coding: `You are an expert coding prompt engineer. Generate precise technical prompts that specify programming language, framework, requirements, edge cases, and expected output format.`,
  business: `You are an expert business prompt engineer. Generate professional prompts for business tasks like reports, emails, strategies, and analysis.`,
  education: `You are an expert educational prompt engineer. Generate prompts for learning, teaching, and creating educational content.`,
  creative: `You are an expert creative writing prompt engineer. Generate imaginative, evocative prompts for stories, poems, and creative projects.`,
  personal: `You are an expert prompt engineer for personal productivity and self-improvement tasks.`,
};

router.post("/prompts/generate", async (req, res): Promise<void> => {
  const parsed = GeneratePromptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { description, taskType, tone, targetAudience, language, complexity } = parsed.data;
  const isComplex = complexity === "complex";
  const systemPrompt = (TASK_TYPE_SYSTEM_PROMPTS[taskType] ?? TASK_TYPE_SYSTEM_PROMPTS.chatgpt)
    + (isComplex
      ? ` For complex multi-step tasks, craft production-grade prompts with clear structure: Role, Context, Task, Step-by-step Instructions, Output Format, Constraints, and Quality Criteria.`
      : "");

  const toneStr = tone ? `Tone: ${tone}` : "";
  const audienceStr = targetAudience ? `Target audience: ${targetAudience}` : "";
  const langStr = language === "hi" ? "The user is writing in Hindi. Understand the Hindi description and generate English prompts." : "";

  const userMessage = isComplex
    ? `${langStr}

User's description: "${description}"
${toneStr}
${audienceStr}

This is a COMPLEX task where prompt quality is critical. Generate 3 expert prompt variants optimized for ${taskType.replace(/_/g, " ")}:
1. "Structured" — full prompt with Role, Context, Task, Instructions, Output Format, Constraints, and Examples
2. "Step-by-Step" — phased prompt that decomposes the work into ordered stages with checkpoints
3. "Expert Reasoning" — chain-of-thought prompt that asks the AI to plan, verify, and refine before delivering

Also provide:
- taskBreakdown: 3-5 concrete sub-steps to accomplish this task (step number, short title, description)
- hindiExplanation: brief Hindi explanation of how to use these prompts
- tips: 3 practical tips for complex tasks

Respond ONLY in this exact JSON format:
{
  "prompts": [
    {"prompt": "...", "label": "Structured", "platform": "..."},
    {"prompt": "...", "label": "Step-by-Step", "platform": "..."},
    {"prompt": "...", "label": "Expert Reasoning", "platform": "..."}
  ],
  "taskBreakdown": [
    {"step": 1, "title": "...", "description": "..."}
  ],
  "hindiExplanation": "...",
  "tips": ["...", "...", "..."]
}`
    : `${langStr}

User's description: "${description}"
${toneStr}
${audienceStr}

Generate 3 prompt variants optimized for ${taskType.replace(/_/g, " ")}:
1. A detailed/comprehensive version
2. A simple/concise version  
3. A creative/unique angle version

Also provide a brief Hindi explanation of what these prompts do and 3 tips for using them effectively.

Respond ONLY in this exact JSON format:
{
  "prompts": [
    {"prompt": "...", "label": "Detailed", "platform": "..."},
    {"prompt": "...", "label": "Simple", "platform": "..."},
    {"prompt": "...", "label": "Creative", "platform": "..."}
  ],
  "hindiExplanation": "...",
  "tips": ["...", "...", "..."]
}`;

 const result = await model.generateContent(
  `${systemPrompt}\n\n${userMessage}`
);

const raw = result.response.text() ?? "{}";


  let parsed2: {
    prompts?: Array<{ prompt: string; label: string; platform: string }>;
    hindiExplanation?: string;
    tips?: string[];
    taskBreakdown?: Array<{ step: number; title: string; description: string }>;
  };
  try {
    parsed2 = JSON.parse(raw);
  } catch {
    parsed2 = { prompts: [], hindiExplanation: "प्रॉम्प्ट तैयार हो गया।", tips: [] };
  }

  res.json({
    prompts: parsed2.prompts ?? [],
    taskType,
    hindiExplanation: parsed2.hindiExplanation ?? "आपका प्रॉम्प्ट तैयार है।",
    tips: parsed2.tips ?? [],
    ...(isComplex && parsed2.taskBreakdown?.length
      ? { taskBreakdown: parsed2.taskBreakdown }
      : {}),
  });
});

router.post("/prompts/refine", async (req, res): Promise<void> => {
  const parsed = RefinePromptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { originalPrompt, refineAction, taskType, additionalContext } = parsed.data;
  const systemPrompt = TASK_TYPE_SYSTEM_PROMPTS[taskType] ?? TASK_TYPE_SYSTEM_PROMPTS.chatgpt;

  const actionInstructions: Record<string, string> = {
    more_detailed: "Make this prompt much more detailed and specific, adding more context, requirements, and specifications.",
    simpler: "Simplify this prompt to be clearer and more concise while keeping the core intent.",
    more_creative: "Rewrite this prompt with a more creative, unique, and imaginative angle.",
    more_professional: "Rewrite this prompt in a more formal, professional tone.",
    different_tone: "Rewrite this prompt with a completely different approach and perspective.",
  };

  const instruction = actionInstructions[refineAction] ?? actionInstructions.more_detailed;
  const contextStr = additionalContext ? `Additional context: ${additionalContext}` : "";

  const userMessage = `Original prompt: "${originalPrompt}"
${contextStr}

${instruction}

Generate 3 refined variants and provide a Hindi explanation.

Respond ONLY in this exact JSON format:
{
  "prompts": [
    {"prompt": "...", "label": "Variant 1", "platform": "..."},
    {"prompt": "...", "label": "Variant 2", "platform": "..."},
    {"prompt": "...", "label": "Variant 3", "platform": "..."}
  ],
  "hindiExplanation": "...",
  "tips": ["...", "..."]
}`;

  const result = await model.generateContent(
  `${systemPrompt}\n\n${userMessage}`
);

const raw = result.response.text() ?? "{}";


  let parsed2: { prompts?: Array<{ prompt: string; label: string; platform: string }>; hindiExplanation?: string; tips?: string[] };
  try {
    parsed2 = JSON.parse(raw);
  } catch {
    parsed2 = { prompts: [], hindiExplanation: "प्रॉम्प्ट सुधार किया गया।", tips: [] };
  }

  res.json({
    prompts: parsed2.prompts ?? [],
    taskType,
    hindiExplanation: parsed2.hindiExplanation ?? "आपका प्रॉम्प्ट सुधार किया गया है।",
    tips: parsed2.tips ?? [],
  });
});

router.get("/saved-prompts", async (req, res): Promise<void> => {
  const params = ListSavedPromptsQueryParams.safeParse(req.query);
  const conditions = [];
  if (params.success && params.data.category) {
    conditions.push(eq(savedPromptsTable.category, params.data.category));
  }
  if (params.success && params.data.taskType) {
    conditions.push(eq(savedPromptsTable.taskType, params.data.taskType));
  }

  const query = db.select().from(savedPromptsTable).orderBy(desc(savedPromptsTable.createdAt));
  const rows = conditions.length > 0
    ? await db.select().from(savedPromptsTable).where(conditions[0]).orderBy(desc(savedPromptsTable.createdAt))
    : await query;

  res.json(rows);
});

router.post("/saved-prompts", async (req, res): Promise<void> => {
  const parsed = SavePromptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db.insert(savedPromptsTable).values({
    prompt: parsed.data.prompt,
    taskType: parsed.data.taskType,
    category: parsed.data.category,
    label: parsed.data.label,
    platform: parsed.data.platform,
    originalDescription: parsed.data.originalDescription,
    hindiExplanation: parsed.data.hindiExplanation,
    isFavorite: parsed.data.isFavorite ?? false,
  }).returning();

  res.status(201).json(row);
});

router.get("/saved-prompts/:id", async (req, res): Promise<void> => {
  const params = GetSavedPromptParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db.select().from(savedPromptsTable).where(eq(savedPromptsTable.id, params.data.id));
  if (!row) {
    res.status(404).json({ error: "Saved prompt not found" });
    return;
  }

  res.json(row);
});

router.delete("/saved-prompts/:id", async (req, res): Promise<void> => {
  const params = DeleteSavedPromptParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db.delete(savedPromptsTable).where(eq(savedPromptsTable.id, params.data.id)).returning();
  if (!row) {
    res.status(404).json({ error: "Saved prompt not found" });
    return;
  }

  res.sendStatus(204);
});

router.get("/prompt-templates", async (req, res): Promise<void> => {
  const params = ListPromptTemplatesQueryParams.safeParse(req.query);
  const conditions = [];
  if (params.success && params.data.category) {
    conditions.push(eq(promptTemplatesTable.category, params.data.category));
  }
  if (params.success && params.data.taskType) {
    conditions.push(eq(promptTemplatesTable.taskType, params.data.taskType));
  }

  const rows = conditions.length > 0
    ? await db.select().from(promptTemplatesTable).where(conditions[0]).orderBy(desc(promptTemplatesTable.usageCount))
    : await db.select().from(promptTemplatesTable).orderBy(desc(promptTemplatesTable.usageCount));

  res.json(rows);
});

router.get("/prompt-templates/:id", async (req, res): Promise<void> => {
  const params = GetPromptTemplateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db.select().from(promptTemplatesTable).where(eq(promptTemplatesTable.id, params.data.id));
  if (!row) {
    res.status(404).json({ error: "Template not found" });
    return;
  }

  await db.update(promptTemplatesTable).set({ usageCount: sql`${promptTemplatesTable.usageCount} + 1` }).where(eq(promptTemplatesTable.id, params.data.id));

  res.json(row);
});

router.get("/prompts/stats", async (_req, res): Promise<void> => {
  const [totalSaved] = await db.select({ count: sql<number>`count(*)::int` }).from(savedPromptsTable);
  const [totalTemplates] = await db.select({ count: sql<number>`count(*)::int` }).from(promptTemplatesTable);

  const taskTypeCounts = await db
    .select({ taskType: savedPromptsTable.taskType, count: sql<number>`count(*)::int` })
    .from(savedPromptsTable)
    .groupBy(savedPromptsTable.taskType)
    .orderBy(desc(sql`count(*)`));

  const result = GetPromptStatsResponse.parse({
    totalGenerated: (totalSaved?.count ?? 0) * 3,
    totalSaved: totalSaved?.count ?? 0,
    totalTemplates: totalTemplates?.count ?? 0,
    topTaskTypes: taskTypeCounts.map(r => ({ taskType: r.taskType, count: r.count })),
    recentActivity: totalSaved?.count ?? 0,
  });

  res.json(result);
});

router.get("/prompts/popular-templates", async (_req, res): Promise<void> => {
  const rows = await db.select().from(promptTemplatesTable).orderBy(desc(promptTemplatesTable.usageCount)).limit(6);
  res.json(rows);
});

export default router;
