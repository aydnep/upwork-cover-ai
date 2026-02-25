import { Google, generateState, generateCodeVerifier, decodeIdToken } from "arctic";
import type { Env, JwtPayload } from "./types.js";

const JWT_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days
const COOKIE_NAME = "session";

function getRedirectUri(request: Request): string {
  const url = new URL(request.url);
  return `${url.origin}/auth/callback`;
}

function createGoogle(env: Env, request: Request): Google {
  return new Google(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, getRedirectUri(request));
}

export function handleGoogleAuth(env: Env, request: Request): Response {
  const google = createGoogle(env, request);
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const url = google.createAuthorizationURL(state, codeVerifier, ["openid", "email", "profile"]);

  const isSecure = new URL(request.url).protocol === "https:";
  const cookieFlags = `HttpOnly; SameSite=Lax; Path=/; Max-Age=600${isSecure ? "; Secure" : ""}`;

  return new Response(null, {
    status: 302,
    headers: [
      ["Location", url.toString()],
      ["Set-Cookie", `oauth_state=${state}; ${cookieFlags}`],
      ["Set-Cookie", `code_verifier=${codeVerifier}; ${cookieFlags}`],
    ],
  });
}

export async function handleGoogleCallback(env: Env, request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookies = parseCookies(request);
  const storedState = cookies.get("oauth_state");
  const codeVerifier = cookies.get("code_verifier");

  if (!code || !state || !storedState || !codeVerifier || state !== storedState) {
    return new Response("Invalid OAuth callback", { status: 400 });
  }

  const google = createGoogle(env, request);

  let tokens;
  try {
    tokens = await google.validateAuthorizationCode(code, codeVerifier);
  } catch {
    return new Response("Failed to validate authorization code", { status: 400 });
  }

  const idToken = tokens.idToken();
  const claims = decodeIdToken(idToken) as {
    email?: string;
    name?: string;
    picture?: string;
  };

  if (!claims.email) {
    return new Response("No email in ID token", { status: 400 });
  }

  const jwt = await createJwt(
    { email: claims.email, name: claims.name ?? claims.email, picture: claims.picture },
    env.JWT_SECRET,
  );

  const isSecure = url.protocol === "https:";
  const cookieFlags = `HttpOnly; SameSite=Lax; Path=/; Max-Age=${JWT_EXPIRY_SECONDS}${isSecure ? "; Secure" : ""}`;

  return new Response(null, {
    status: 302,
    headers: [
      ["Location", "/"],
      ["Set-Cookie", `${COOKIE_NAME}=${jwt}; ${cookieFlags}`],
      ["Set-Cookie", `oauth_state=; Path=/; Max-Age=0`],
      ["Set-Cookie", `code_verifier=; Path=/; Max-Age=0`],
    ],
  });
}

export function handleLogout(request: Request): Response {
  const isSecure = new URL(request.url).protocol === "https:";
  const cookieFlags = `HttpOnly; SameSite=Lax; Path=/; Max-Age=0${isSecure ? "; Secure" : ""}`;
  return new Response(null, {
    status: 302,
    headers: [
      ["Location", "/"],
      ["Set-Cookie", `${COOKIE_NAME}=; ${cookieFlags}`],
    ],
  });
}

export async function getAuthenticatedUser(request: Request, jwtSecret: string): Promise<JwtPayload | null> {
  const cookies = parseCookies(request);
  const token = cookies.get(COOKIE_NAME);
  if (!token) return null;
  return verifyJwt(token, jwtSecret);
}

function parseCookies(request: Request): Map<string, string> {
  const header = request.headers.get("Cookie") ?? "";
  const map = new Map<string, string>();
  for (const pair of header.split(";")) {
    const idx = pair.indexOf("=");
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    map.set(key, value);
  }
  return map;
}

async function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function base64UrlEncode(data: ArrayBuffer | Uint8Array): string {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function createJwt(
  payload: Omit<JwtPayload, "iat" | "exp">,
  secret: string,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JwtPayload = {
    ...payload,
    iat: now,
    exp: now + JWT_EXPIRY_SECONDS,
  };

  const header = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = base64UrlEncode(new TextEncoder().encode(JSON.stringify(fullPayload)));
  const signingInput = `${header}.${body}`;

  const key = await getKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signingInput));

  return `${signingInput}.${base64UrlEncode(signature)}`;
}

async function verifyJwt(token: string, secret: string): Promise<JwtPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, body, sig] = parts as [string, string, string];
  const signingInput = `${header}.${body}`;

  const key = await getKey(secret);
  const signatureBytes = base64UrlDecode(sig);
  const isValid = await crypto.subtle.verify("HMAC", key, signatureBytes, new TextEncoder().encode(signingInput));
  if (!isValid) return null;

  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(body))) as JwtPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
