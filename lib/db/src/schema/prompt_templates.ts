import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const promptTemplatesTable = pgTable("prompt_templates", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  titleHindi: text("title_hindi").notNull(),
  description: text("description").notNull(),
  descriptionHindi: text("description_hindi").notNull(),
  prompt: text("prompt").notNull(),
  taskType: text("task_type").notNull(),
  category: text("category").notNull(),
  platform: text("platform").notNull(),
  usageCount: integer("usage_count").notNull().default(0),
  tags: text("tags").array().notNull().default([]),
});

export const insertPromptTemplateSchema = createInsertSchema(promptTemplatesTable).omit({
  id: true,
});
export type InsertPromptTemplate = z.infer<typeof insertPromptTemplateSchema>;
export type PromptTemplate = typeof promptTemplatesTable.$inferSelect;
