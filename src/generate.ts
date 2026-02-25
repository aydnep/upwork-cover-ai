import OpenAI from "openai";
import type { UserProfile, CoverLetterTone } from "./types.js";

function buildSystemPrompt(profile: UserProfile): string {
  return `You are an expert Upwork cover letter writer. Write a personalized cover letter for the following freelancer:

Name: ${profile.name}
Title: ${profile.title}
Skills: ${profile.skills}
Experience: ${profile.experienceSummary}
Portfolio: ${profile.portfolioLinks}${profile.hourlyRate ? `\nRate: ${profile.hourlyRate}` : ""}${profile.location ? `\nLocation: ${profile.location}` : ""}${profile.bio ? `\nBio: ${profile.bio}` : ""}

Guidelines:
- Write 150-250 words
- Start with a compelling hook that addresses the client's specific need
- Highlight 2-3 most relevant skills/experiences for this particular job
- Show understanding of their project requirements
- End with a clear call to action
- Use first person ("I")
- Be specific, not generic — reference details from the job posting
- Do not use filler phrases like "I came across your job posting"
- Do not include a subject line or greeting — just the body text
- Do not use markdown formatting — write plain text`;
}

function buildUserPrompt(jobDescription: string, tone: CoverLetterTone): string {
  const toneGuide: Record<CoverLetterTone, string> = {
    professional: "Use a polished, professional tone. Be direct and business-focused.",
    friendly: "Use a warm, approachable tone. Be conversational but still competent.",
    confident: "Use a bold, assertive tone. Emphasize achievements and capability.",
    enthusiastic: "Use an energetic, passionate tone. Show genuine excitement for the project.",
  };

  return `Job Description:\n${jobDescription}\n\nTone: ${toneGuide[tone]}`;
}

const VALID_TONES = new Set<string>(["professional", "friendly", "confident", "enthusiastic"]);

export async function handleGenerate(
  request: Request,
  profile: UserProfile,
  apiKey: string,
  ctx: ExecutionContext,
): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const obj = body as Record<string, unknown>;
  const jobDescription = obj.jobDescription;
  const tone = obj.tone ?? "professional";

  if (typeof jobDescription !== "string" || jobDescription.trim() === "") {
    return Response.json({ error: "jobDescription is required" }, { status: 400 });
  }

  if (typeof tone !== "string" || !VALID_TONES.has(tone)) {
    return Response.json({ error: "tone must be one of: professional, friendly, confident, enthusiastic" }, { status: 400 });
  }

  const openai = new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });

  const stream = await openai.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: buildSystemPrompt(profile) },
      { role: "user", content: buildUserPrompt(jobDescription.trim(), tone as CoverLetterTone) },
    ],
    stream: true,
    temperature: 0.7,
    max_tokens: 1024,
  });

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  const streamTask = (async () => {
    try {
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          await writer.write(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
        }
      }
      await writer.write(encoder.encode("data: [DONE]\n\n"));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Stream error";
      await writer.write(encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`));
    } finally {
      await writer.close();
    }
  })();

  ctx.waitUntil(streamTask);

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
