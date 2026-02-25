export interface Env {
  GROQ_API_KEY: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  JWT_SECRET: string;
  FIRECRAWL_API_KEY?: string;
  UpworkCoverAI_KV: KVNamespace;
}

export interface UserProfile {
  name: string;
  title: string;
  skills: string;
  experienceSummary: string;
  portfolioLinks: string;
  hourlyRate?: string;
  location?: string;
  bio?: string;
}

export interface JwtPayload {
  email: string;
  name: string;
  picture?: string;
  iat: number;
  exp: number;
}

export type CoverLetterTone =
  | "professional"
  | "friendly"
  | "confident"
  | "enthusiastic";

export type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };
