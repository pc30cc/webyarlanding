// اتصال مستقیم به Google Search Console با کلید سرویس‌اکانت (Service Account) — فقط سمت سرور.
// هیچ واسطه‌ای در کار نیست؛ توکن دسترسی با امضای JWT (RS256) گرفته می‌شود.
import { createSign } from "node:crypto";
import { loadGscKeys } from "./settings.server";

const SCOPE = "https://www.googleapis.com/auth/webmasters";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const GSC_BASE = "https://www.googleapis.com/webmasters/v3";
const INSPECT_URL = "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect";

export interface ServiceAccount {
  client_email: string;
  private_key: string;
  project_id?: string;
}

export function parseServiceAccount(raw: string): ServiceAccount {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error("فایل کلید سرویس‌اکانت معتبر نیست (JSON خراب است)");
  }
  const sa = json as Partial<ServiceAccount>;
  if (!sa.client_email || !sa.private_key) {
    throw new Error("در فایل کلید، client_email یا private_key پیدا نشد");
  }
  return { client_email: sa.client_email, private_key: sa.private_key.replace(/\\n/g, "\n") };
}

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

let cachedToken: { token: string; expiresAt: number; email: string } | null = null;

async function getAccessToken(): Promise<string> {
  const { gscServiceAccountJson } = await loadGscKeys();
  if (!gscServiceAccountJson) {
    throw new Error("کلید سرویس‌اکانت گوگل ثبت نشده است");
  }
  const sa = parseServiceAccount(gscServiceAccountJson);

  if (cachedToken && cachedToken.email === sa.client_email && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const iat = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat,
      exp: iat + 3600,
    }),
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${payload}`);
  const signature = signer.sign(sa.private_key).toString("base64url");
  const assertion = `${header}.${payload}.${signature}`;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const data = (await res.json()) as { access_token?: string; error_description?: string };
  if (!res.ok || !data.access_token) {
    throw new Error(`گرفتن توکن گوگل ناموفق بود: ${data.error_description ?? res.status}`);
  }
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + 50 * 60 * 1000,
    email: sa.client_email,
  };
  return data.access_token;
}

async function gscFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`سرچ کنسول (${res.status}): ${text.slice(0, 300)}`);
  }
  return (text ? JSON.parse(text) : {}) as T;
}

export interface GscSite {
  siteUrl: string;
  permissionLevel: string;
}

export async function listSites(): Promise<GscSite[]> {
  const data = await gscFetch<{ siteEntry?: GscSite[] }>(`${GSC_BASE}/sites`);
  return (data.siteEntry ?? []).filter((s) => s.permissionLevel !== "siteUnverifiedUser");
}

/** آیا این پراپرتی، آدرس هدف را پوشش می‌دهد؟ (دامنه‌ای یا پیشوند آدرس) */
export function coversTarget(siteUrl: string, target: string): boolean {
  try {
    const url = new URL(target);
    if (siteUrl.startsWith("sc-domain:")) {
      const domain = siteUrl.slice("sc-domain:".length).toLowerCase();
      const host = url.hostname.toLowerCase();
      return host === domain || host.endsWith(`.${domain}`);
    }
    return url.href.startsWith(new URL(siteUrl).href);
  } catch {
    return false;
  }
}

/** انتخاب پراپرتی مناسب: اول انتخاب دستی مدیر، بعد تطابق خودکار با آدرس سایت */
export async function resolveProperty(
  siteUrl: string,
  preferred?: string,
): Promise<{ property: string; candidates: string[] }> {
  const sites = await listSites();
  const candidates = sites.map((s) => s.siteUrl);
  if (preferred && candidates.includes(preferred)) return { property: preferred, candidates };
  const matches = candidates.filter((s) => coversTarget(s, siteUrl));
  if (matches.length === 0) {
    throw new Error(
      "هیچ پراپرتی تأییدشده‌ای برای این دامنه در حساب سرویس‌اکانت پیدا نشد. ایمیل سرویس‌اکانت را در سرچ کنسول به‌عنوان کاربر اضافه کنید.",
    );
  }
  const exact = matches.find((m) => !m.startsWith("sc-domain:")) ?? matches[0]!;
  return { property: exact, candidates };
}

export interface SearchAnalyticsRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export async function querySearchAnalytics(
  property: string,
  body: Record<string, unknown>,
): Promise<SearchAnalyticsRow[]> {
  const data = await gscFetch<{ rows?: SearchAnalyticsRow[] }>(
    `${GSC_BASE}/sites/${encodeURIComponent(property)}/searchAnalytics/query`,
    { method: "POST", body: JSON.stringify(body) },
  );
  return data.rows ?? [];
}

export interface SitemapEntry {
  path: string;
  errors?: string;
  warnings?: string;
  isPending?: boolean;
  lastSubmitted?: string;
}

export async function listSitemaps(property: string): Promise<SitemapEntry[]> {
  const data = await gscFetch<{ sitemap?: SitemapEntry[] }>(
    `${GSC_BASE}/sites/${encodeURIComponent(property)}/sitemaps`,
  );
  return data.sitemap ?? [];
}

export async function submitSitemap(property: string, sitemapUrl: string): Promise<void> {
  await gscFetch(
    `${GSC_BASE}/sites/${encodeURIComponent(property)}/sitemaps/${encodeURIComponent(sitemapUrl)}`,
    { method: "PUT" },
  );
}

export interface UrlInspectionResult {
  verdict: string;
  coverageState: string;
  robotsTxtState: string;
  indexingState: string;
  lastCrawlTime?: string;
  pageFetchState?: string;
  canonical?: string;
  userCanonical?: string;
}

export async function inspectUrl(
  property: string,
  inspectionUrl: string,
): Promise<UrlInspectionResult | null> {
  try {
    const data = await gscFetch<{
      inspectionResult?: {
        indexStatusResult?: {
          verdict?: string;
          coverageState?: string;
          robotsTxtState?: string;
          indexingState?: string;
          lastCrawlTime?: string;
          pageFetchState?: string;
          googleCanonical?: string;
          userCanonical?: string;
        };
      };
    }>(INSPECT_URL, {
      method: "POST",
      body: JSON.stringify({ inspectionUrl, siteUrl: property }),
    });
    const r = data.inspectionResult?.indexStatusResult;
    if (!r) return null;
    return {
      verdict: r.verdict ?? "UNKNOWN",
      coverageState: r.coverageState ?? "",
      robotsTxtState: r.robotsTxtState ?? "",
      indexingState: r.indexingState ?? "",
      ...(r.lastCrawlTime ? { lastCrawlTime: r.lastCrawlTime } : {}),
      ...(r.pageFetchState ? { pageFetchState: r.pageFetchState } : {}),
      ...(r.googleCanonical ? { canonical: r.googleCanonical } : {}),
      ...(r.userCanonical ? { userCanonical: r.userCanonical } : {}),
    };
  } catch (e) {
    console.error("inspectUrl failed:", e);
    return null;
  }
}
