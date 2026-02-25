# Upwork Cover Letter AI

Generate personalized cover letters for Upwork jobs using AI. Paste a job URL or description, and get a tailored cover letter based on your saved profile.

Built as a Cloudflare Worker with Google OAuth, Groq LLM (Llama 3.3 70B), and Firecrawl for web scraping.

## Features

- Google OAuth sign-in
- Save your freelancer profile (name, title, skills, experience, etc.)
- Import profile from your Upwork profile URL
- Fetch job descriptions from Upwork job URLs
- Generate cover letters with selectable tone (professional, friendly, confident, enthusiastic)
- Streaming AI response via Server-Sent Events

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (`npm install -g wrangler`)
- A Cloudflare account
- API keys for the services below

## Required API Keys

| Service | Purpose | Get it at |
|---------|---------|-----------|
| **Groq** | LLM for cover letter generation | https://console.groq.com/ |
| **Google OAuth** | User authentication | https://console.cloud.google.com/apis/credentials |
| **Firecrawl** (optional) | Scraping Upwork job/profile pages | https://www.firecrawl.dev/ |
| **JWT Secret** | Signing auth tokens | Generate with `openssl rand -hex 32` |

### Google OAuth Setup

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the Google+ API / People API
3. Create OAuth 2.0 credentials (Web application)
4. Add authorized redirect URI: `http://localhost:8787/auth/callback` (dev) and `https://your-worker.workers.dev/auth/callback` (prod)

## Setup

```bash
# Install dependencies
npm install

# Create .dev.vars with your secrets (for local development)
cat > .dev.vars << 'EOF'
GROQ_API_KEY=your_groq_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FIRECRAWL_API_KEY=your_firecrawl_api_key
JWT_SECRET=your_jwt_secret
EOF
```

## Development

```bash
npm run dev
# Opens at http://localhost:8787
```

## Deployment

```bash
# Set production secrets (one-time)
wrangler secret put GROQ_API_KEY
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put FIRECRAWL_API_KEY
wrangler secret put JWT_SECRET

# Deploy
npm run deploy
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local dev server |
| `npm run deploy` | Deploy to Cloudflare Workers |
| `npm run typecheck` | Run TypeScript type checking |

## Tech Stack

- **Runtime**: Cloudflare Workers
- **Language**: TypeScript
- **Auth**: Google OAuth 2.0 via [Arctic](https://arcticjs.dev/)
- **LLM**: Groq API (OpenAI SDK compatible)
- **Scraping**: Firecrawl API
- **Storage**: Cloudflare KV
