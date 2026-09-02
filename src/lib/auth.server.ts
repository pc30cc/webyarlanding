// احراز هویت اختصاصی WEBYAR — بدون Supabase Auth.
// رمز عبور با PBKDF2-SHA256 هش می‌شود و نشست‌ها در جدول user_sessions نگهداری می‌شوند.
import {
  getCookie,
  setCookie,
  deleteCookie,
  getRequestHeader,
  getRequestIP,
} from "@tanstack/react-start/server";
import { db, newId, nowIso, toBool } from "./db.server";

export const SESSION_COOKIE = "webyar_session";
const SESSION_DAYS = 14;
const PBKDF2_ITERATIONS = 120_000;

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

function toBase64(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const byte of view) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as unknown as BufferSource, iterations, hash: "SHA-256" },
    key,
    256,
  );
  return toBase64(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toBase64(salt)}$${hash}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = (stored || "").split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = Number(parts[1]) || PBKDF2_ITERATIONS;
  const salt = fromBase64(parts[2]!);
  const computed = await pbkdf2(password, salt, iterations);
  if (computed.length !== parts[3]!.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i += 1)
    diff |= computed.charCodeAt(i) ^ parts[3]!.charCodeAt(i);
  return diff === 0;
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function clientIp(): string {
  return getRequestIP({ xForwardedFor: true }) ?? "";
}

export function clientUserAgent(): string {
  return (getRequestHeader("user-agent") ?? "").slice(0, 480);
}

export async function logLoginAttempt(
  email: string,
  success: boolean,
  reason?: string,
): Promise<void> {
  await db.from("login_attempts").insert({
    id: newId(),
    email: email.slice(0, 190),
    success: success ? 1 : 0,
    reason: reason?.slice(0, 190) ?? null,
    ip_address: clientIp(),
    user_agent: clientUserAgent(),
  });
}

const LOGIN_RATE_LIMIT_WINDOW_MINUTES = 15;
const LOGIN_RATE_LIMIT_MAX_PER_EMAIL = 8;
const LOGIN_RATE_LIMIT_MAX_PER_IP = 20;

/** بررسی محدودیت تعداد تلاش ناموفق ورود (بر اساس ایمیل و آی‌پی) — جلوگیری از حمله brute-force */
export async function isLoginRateLimited(email: string): Promise<boolean> {
  const since = new Date(Date.now() - LOGIN_RATE_LIMIT_WINDOW_MINUTES * 60_000).toISOString();
  const ip = clientIp();
  const [byEmail, byIp] = await Promise.all([
    db
      .from("login_attempts")
      .select("id", { count: "exact", head: true })
      .eq("email", email.slice(0, 190))
      .eq("success", 0)
      .gte("created_at", since),
    ip
      ? db
          .from("login_attempts")
          .select("id", { count: "exact", head: true })
          .eq("ip_address", ip)
          .eq("success", 0)
          .gte("created_at", since)
      : Promise.resolve({ count: 0 }),
  ]);
  return (
    (byEmail.count ?? 0) >= LOGIN_RATE_LIMIT_MAX_PER_EMAIL ||
    (byIp.count ?? 0) >= LOGIN_RATE_LIMIT_MAX_PER_IP
  );
}

/** ساخت نشست جدید و ست کردن کوکی */
export async function startSession(userId: string): Promise<void> {
  const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const tokenHash = await sha256Hex(token);
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await db.from("user_sessions").insert({
    id: newId(),
    user_id: userId,
    token_hash: tokenHash,
    expires_at: expires.toISOString(),
    ip_address: clientIp(),
    user_agent: clientUserAgent(),
  });

  setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function endSession(): Promise<void> {
  const token = getCookie(SESSION_COOKIE);
  if (token) {
    const tokenHash = await sha256Hex(token);
    await db.from("user_sessions").delete().eq("token_hash", tokenHash);
  }
  deleteCookie(SESSION_COOKIE, { path: "/" });
}

/** کاربر جاری از روی کوکی نشست — یا null */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = getCookie(SESSION_COOKIE);
  if (!token) return null;

  const tokenHash = await sha256Hex(token);
  const { data: session } = await db
    .from("user_sessions")
    .select("id, user_id, expires_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (!session) return null;
  if (new Date(session.expires_at).getTime() < Date.now()) {
    await db.from("user_sessions").delete().eq("id", session.id);
    return null;
  }

  const { data: user } = await db
    .from("users")
    .select("id, email, display_name, role, is_active")
    .eq("id", session.user_id)
    .maybeSingle();

  if (!user || !toBool(user.is_active)) return null;

  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name ?? user.email,
    role: user.role,
  };
}

/** الزام ورود مدیر؛ در غیر این صورت خطا */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "owner")) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function touchLastLogin(userId: string): Promise<void> {
  await db.from("users").update({ last_login_at: nowIso() }).eq("id", userId);
}
