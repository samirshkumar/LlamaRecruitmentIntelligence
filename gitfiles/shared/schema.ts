import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull(),
  avatarUrl: text("avatar_url"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  role: true,
  avatarUrl: true,
});

// Job schema
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  department: text("department").notNull(),
  description: text("description").notNull(),
  requirements: text("requirements").notNull(),
  experience: text("experience").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").notNull(),
  // Additional fields like salary range, location, etc. can be added later
});

export const insertJobSchema = createInsertSchema(jobs).pick({
  title: true,
  department: true,
  description: true,
  requirements: true,
  experience: true,
  status: true,
  createdBy: true,
});

// Candidate schema
export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  resumeText: text("resume_text").notNull(),
  resumeUrl: text("resume_url"),
  status: text("status").notNull().default("new"),
  jobId: integer("job_id").notNull(),
  score: integer("score"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCandidateSchema = createInsertSchema(candidates).pick({
  name: true,
  email: true,
  phone: true,
  resumeText: true,
  resumeUrl: true,
  status: true,
  jobId: true,
  score: true,
});

// Interview schema
export const interviews = pgTable("interviews", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").notNull(),
  jobId: integer("job_id").notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  status: text("status").notNull().default("scheduled"),
  transcript: text("transcript"),
  feedbackSummary: text("feedback_summary"),
  recommendation: text("recommendation"),
  sentimentScore: integer("sentiment_score"),
  sentimentAnalysis: jsonb("sentiment_analysis"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertInterviewSchema = createInsertSchema(interviews).pick({
  candidateId: true,
  jobId: true,
  scheduledAt: true,
  status: true,
  transcript: true,
  feedbackSummary: true,
  recommendation: true,
  sentimentScore: true,
  sentimentAnalysis: true,
});

// Email template schema
export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).pick({
  type: true,
  subject: true,
  body: true,
});

// Email log schema
export const emailLogs = pgTable("email_logs", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").notNull(),
  templateId: integer("template_id").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  status: text("status").notNull(),
});

export const insertEmailLogSchema = createInsertSchema(emailLogs).pick({
  candidateId: true,
  templateId: true,
  subject: true,
  body: true,
  status: true,
});

// Activity log schema
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  agent: text("agent").notNull(),
  action: text("action").notNull(),
  details: text("details").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).pick({
  agent: true,
  action: true,
  details: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

export type Candidate = typeof candidates.$inferSelect;
export type InsertCandidate = z.infer<typeof insertCandidateSchema>;

export type Interview = typeof interviews.$inferSelect;
export type InsertInterview = z.infer<typeof insertInterviewSchema>;

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;

export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = z.infer<typeof insertEmailLogSchema>;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
