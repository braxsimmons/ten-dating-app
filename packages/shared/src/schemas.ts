import { z } from "zod";
import {
  DATING_INTENTS,
  GENDER_OPTIONS,
  INTEREST_OPTIONS,
  MIN_AGE,
  REPORT_REASONS,
  SWIPE_ACTIONS,
} from "./constants";

const eighteenYearsAgo = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - MIN_AGE);
  return d;
};

export const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(50),
  dateOfBirth: z.coerce.date().max(eighteenYearsAgo(), {
    message: "You must be at least 18 years old.",
  }),
  gender: z.enum(GENDER_OPTIONS),
  interestedIn: z.enum(INTEREST_OPTIONS),
  locationCity: z.string().min(1).max(100).optional(),
  locationState: z.string().max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const profileUpdateSchema = z.object({
  bio: z.string().max(500).optional(),
  datingIntent: z.enum(DATING_INTENTS).optional(),
  height: z.number().int().min(120).max(250).nullable().optional(),
  education: z.string().max(100).nullable().optional(),
  work: z.string().max(100).nullable().optional(),
  religion: z.string().max(100).nullable().optional(),
  lifestyle: z.string().max(500).nullable().optional(),
  hiddenTrait: z.string().max(280).nullable().optional(),
  locationCity: z.string().max(100).optional(),
  locationState: z.string().max(100).optional(),
});

export const promptAnswerSchema = z.object({
  promptId: z.string(),
  answer: z.string().min(1).max(280),
});

export const swipeSchema = z.object({
  targetUserId: z.string(),
  action: z.enum(SWIPE_ACTIONS),
  isDoubleDown: z.boolean().optional().default(false),
});

export const messageSchema = z.object({
  matchId: z.string(),
  body: z.string().min(1).max(2000),
});

export const reportSchema = z.object({
  reportedUserId: z.string(),
  reason: z.enum(REPORT_REASONS),
  description: z.string().max(1000).optional(),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type PromptAnswerInput = z.infer<typeof promptAnswerSchema>;
export type SwipeInput = z.infer<typeof swipeSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
