export const APP_NAME = "Ten";
export const TAGLINE = "You get 10 chances a day. Choose wisely.";

export const DEFAULT_DAILY_SWIPE_LIMIT = 10;
export const MIN_PHOTOS = 2;
export const MAX_PHOTOS = 5;
export const REQUIRED_PROMPT_ANSWERS = 3;
export const MIN_AGE = 18;
export const MAX_AGE = 99;

export const GENDER_OPTIONS = ["woman", "man", "nonbinary", "other"] as const;
export type Gender = (typeof GENDER_OPTIONS)[number];

export const INTEREST_OPTIONS = ["women", "men", "everyone"] as const;
export type Interest = (typeof INTEREST_OPTIONS)[number];

export const DATING_INTENTS = [
  "long-term",
  "short-term",
  "figuring-it-out",
  "friends",
  "marriage",
] as const;
export type DatingIntent = (typeof DATING_INTENTS)[number];

export const SWIPE_ACTIONS = ["like", "pass"] as const;
export type SwipeActionType = (typeof SWIPE_ACTIONS)[number];

export const REPORT_REASONS = [
  "inappropriate-photos",
  "harassment",
  "fake-profile",
  "spam",
  "underage",
  "other",
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const ROLES = ["user", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const FEATURE_FLAGS = {
  DELAYED_MATCH_REVEAL: "delayed_match_reveal",
  STREAKS: "streaks",
  REVEAL_NOW_PURCHASE: "reveal_now_purchase",
} as const;
