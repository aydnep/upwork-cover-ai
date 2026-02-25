import type { Env } from "./types.js";
import { handleGoogleAuth, handleGoogleCallback, handleLogout, getAuthenticatedUser } from "./auth.js";
import { handleGetProfile, handlePutProfile } from "./profile.js";
import { getProfile } from "./profile.js";
import { handleScrape, handleImportProfile } from "./scraper.js";
import { handleGenerate } from "./generate.js";
import { renderPage } from "./ui.js";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      return await handleRequest(request, env, ctx);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Internal Server Error";
      console.error("Unhandled error:", err);
      return Response.json({ error: message }, { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;

async function handleRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  const { pathname } = url;
  const method = request.method;

  // Public routes
  if (pathname === "/" && method === "GET") {
    const user = await getAuthenticatedUser(request, env.JWT_SECRET);
    const html = renderPage(user, Boolean(env.FIRECRAWL_API_KEY));
    return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  if (pathname === "/auth/google" && method === "GET") {
    return handleGoogleAuth(env, request);
  }

  if (pathname === "/auth/callback" && method === "GET") {
    return handleGoogleCallback(env, request);
  }

  if (pathname === "/auth/logout" && method === "POST") {
    return handleLogout(request);
  }

  // Authenticated API routes
  if (pathname.startsWith("/api/")) {
    const user = await getAuthenticatedUser(request, env.JWT_SECRET);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (pathname === "/api/profile" && method === "GET") {
      return handleGetProfile(env.UpworkCoverAI_KV, user.email);
    }

    if (pathname === "/api/profile" && method === "PUT") {
      return handlePutProfile(env.UpworkCoverAI_KV, user.email, request);
    }

    if (pathname === "/api/scrape" && method === "POST") {
      return handleScrape(request, env.FIRECRAWL_API_KEY);
    }

    if (pathname === "/api/import-profile" && method === "POST") {
      return handleImportProfile(request, env.FIRECRAWL_API_KEY, env.GROQ_API_KEY);
    }

    if (pathname === "/api/generate" && method === "POST") {
      const profile = await getProfile(env.UpworkCoverAI_KV, user.email);
      if (!profile) {
        return Response.json({ error: "Please save your profile first" }, { status: 400 });
      }
      return handleGenerate(request, profile, env.GROQ_API_KEY, ctx);
    }
  }

  return new Response("Not Found", { status: 404 });
}
