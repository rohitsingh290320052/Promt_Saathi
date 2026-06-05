import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const savedPromptsTable = pgTable("saved_prompts", {
  id: serial("id").primaryKey(),
  prompt: text("prompt").notNull(),
  taskType: text("task_type").notNull(),
  category: text("category").notNull(),
  label: text("label"),
  platform: text("platform"),
  originalDescription: text("original_description"),
  hindiExplanation: text("hindi_explanation"),
  isFavorite: boolean("is_favorite").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSavedPromptSchema = createInsertSchema(savedPromptsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertSavedPrompt = z.infer<typeof insertSavedPromptSchema>;
export type SavedPrompt = typeof savedPromptsTable.$inferSelect;
