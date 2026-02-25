import type { UserProfile, Result } from "./types.js";

export async function getProfile(kv: KVNamespace, email: string): Promise<UserProfile | null> {
  return kv.get<UserProfile>(email, "json");
}

export async function saveProfile(kv: KVNamespace, email: string, profile: UserProfile): Promise<void> {
  await kv.put(email, JSON.stringify(profile));
}

export function validateProfile(data: unknown): Result<UserProfile> {
  if (typeof data !== "object" || data === null) {
    return { ok: false, error: "Profile must be an object" };
  }

  const obj = data as Record<string, unknown>;

  const requiredStrings = ["name", "title", "skills", "experienceSummary", "portfolioLinks"] as const;
  for (const field of requiredStrings) {
    if (typeof obj[field] !== "string" || (obj[field] as string).trim() === "") {
      return { ok: false, error: `${field} is required and must be a non-empty string` };
    }
  }

  const optionalStrings = ["hourlyRate", "location", "bio"] as const;
  for (const field of optionalStrings) {
    if (obj[field] !== undefined && typeof obj[field] !== "string") {
      return { ok: false, error: `${field} must be a string if provided` };
    }
  }

  return {
    ok: true,
    value: {
      name: (obj.name as string).trim(),
      title: (obj.title as string).trim(),
      skills: (obj.skills as string).trim(),
      experienceSummary: (obj.experienceSummary as string).trim(),
      portfolioLinks: (obj.portfolioLinks as string).trim(),
      hourlyRate: obj.hourlyRate ? (obj.hourlyRate as string).trim() : undefined,
      location: obj.location ? (obj.location as string).trim() : undefined,
      bio: obj.bio ? (obj.bio as string).trim() : undefined,
    },
  };
}

export async function handleGetProfile(kv: KVNamespace, email: string): Promise<Response> {
  const profile = await getProfile(kv, email);
  if (!profile) {
    return Response.json({ profile: null });
  }
  return Response.json({ profile });
}

export async function handlePutProfile(kv: KVNamespace, email: string, request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = validateProfile(body);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  await saveProfile(kv, email, result.value);
  return Response.json({ profile: result.value });
}
