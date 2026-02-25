import OpenAI from "openai";
import type { Result, UserProfile } from "./types.js";

const ALLOWED_HOSTS = ["www.upwork.com", "upwork.com"];

interface FirecrawlResponse {
  success: boolean;
  data?: {
    markdown?: string;
  };
  error?: string;
}

export async function scrapeJobUrl(url: string, apiKey: string): Promise<Result<string>> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, error: "Invalid URL" };
  }

  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    return { ok: false, error: "Only Upwork URLs are allowed" };
  }

  if (parsed.protocol !== "https:") {
    return { ok: false, error: "Only HTTPS URLs are allowed" };
  }

  const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url,
      formats: ["markdown"],
    }),
  });

  if (!response.ok) {
    return { ok: false, error: `Firecrawl API error: ${response.status}` };
  }

  const data = (await response.json()) as FirecrawlResponse;

  if (!data.success || !data.data?.markdown) {
    return { ok: false, error: data.error ?? "Failed to scrape page" };
  }

  return { ok: true, value: data.data.markdown };
}

const PROFILE_EXTRACTION_PROMPT = `You are a data extraction assistant. Extract the freelancer's profile information from the following Upwork profile page content. Return a JSON object with these fields:

- "name" (string, required): Full name of the freelancer
- "title" (string, required): Professional title/headline
- "skills" (string, required): Comma-separated list of skills
- "experienceSummary" (string, required): A brief summary of their experience and work history
- "portfolioLinks" (string, required): Any portfolio or website links found, comma-separated (use empty string if none found)
- "hourlyRate" (string, optional): Their hourly rate if listed
- "location" (string, optional): Their location if listed
- "bio" (string, optional): Their bio/overview text

Only return valid JSON. Do not include any text outside the JSON object.`;

async function extractProfileFromMarkdown(
  markdown: string,
  apiKey: string,
): Promise<Result<UserProfile>> {
  const openai = new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });

  const completion = await openai.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: PROFILE_EXTRACTION_PROMPT },
      { role: "user", content: markdown },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
    max_tokens: 1024,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    return { ok: false, error: "LLM returned empty response" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return { ok: false, error: "LLM returned invalid JSON" };
  }

  const obj = parsed as Record<string, unknown>;

  // Ensure required fields have at least empty-string fallbacks
  const profile: UserProfile = {
    name: typeof obj["name"] === "string" ? obj["name"] : "",
    title: typeof obj["title"] === "string" ? obj["title"] : "",
    skills: typeof obj["skills"] === "string" ? obj["skills"] : "",
    experienceSummary: typeof obj["experienceSummary"] === "string" ? obj["experienceSummary"] : "",
    portfolioLinks: typeof obj["portfolioLinks"] === "string" ? obj["portfolioLinks"] : "",
    hourlyRate: typeof obj["hourlyRate"] === "string" ? obj["hourlyRate"] : undefined,
    location: typeof obj["location"] === "string" ? obj["location"] : undefined,
    bio: typeof obj["bio"] === "string" ? obj["bio"] : undefined,
  };

  return { ok: true, value: profile };
}

export async function handleImportProfile(
  request: Request,
  firecrawlKey: string | undefined,
  groqKey: string,
): Promise<Response> {
  if (!firecrawlKey) {
    return Response.json({ error: "Scraping is not configured" }, { status: 501 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const url = (body as Record<string, unknown>).url;
  if (typeof url !== "string" || url.trim() === "") {
    return Response.json({ error: "url is required" }, { status: 400 });
  }

  const scrapeResult = await scrapeJobUrl(url.trim(), firecrawlKey);
  if (!scrapeResult.ok) {
    return Response.json({ error: scrapeResult.error }, { status: 400 });
  }

  const profileResult = await extractProfileFromMarkdown(scrapeResult.value, groqKey);
  if (!profileResult.ok) {
    return Response.json({ error: profileResult.error }, { status: 500 });
  }

  return Response.json({ profile: profileResult.value });
}

export async function handleScrape(request: Request, apiKey: string | undefined): Promise<Response> {
  if (!apiKey) {
    return Response.json({ error: "Scraping is not configured" }, { status: 501 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const url = (body as Record<string, unknown>).url;
  if (typeof url !== "string" || url.trim() === "") {
    return Response.json({ error: "url is required" }, { status: 400 });
  }

  const result = await scrapeJobUrl(url.trim(), apiKey);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  return Response.json({ markdown: result.value });
}
