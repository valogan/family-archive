// Single-password gate for the whole app. Enabled when AUTH_PASSWORD is
// set; sessions are HMAC-signed expiry stamps in a cookie. Uses Web
// Crypto so the same helpers run in Edge middleware and Node routes.

export const SESSION_COOKIE = "fa_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function isAuthEnabled(): boolean {
  return Boolean(process.env.AUTH_PASSWORD);
}

function authSecret(): string {
  return process.env.AUTH_SECRET || process.env.AUTH_PASSWORD || "";
}

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function verifyPassword(password: string): Promise<boolean> {
  const expected = process.env.AUTH_PASSWORD || "";
  if (!expected) return false;
  // Compare HMACs of the values so length and timing of the real
  // password don't leak through the comparison.
  return timingSafeEqual(
    await hmac(expected, "pw-check"),
    await hmac(password, "pw-check")
  );
}

export async function createSessionToken(): Promise<{
  token: string;
  maxAge: number;
}> {
  const expires = String(Date.now() + SESSION_TTL_MS);
  const sig = await hmac(authSecret(), expires);
  return { token: `${expires}.${sig}`, maxAge: Math.floor(SESSION_TTL_MS / 1000) };
}

export async function verifySessionToken(
  token: string | undefined
): Promise<boolean> {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const expires = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expiresNum = Number(expires);
  if (!Number.isFinite(expiresNum) || expiresNum < Date.now()) return false;
  return timingSafeEqual(sig, await hmac(authSecret(), expires));
}
