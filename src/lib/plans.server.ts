import {
  COMPARISON_FEATURE_KEYS,
  COMPARISON_LIMIT_KEYS,
  FEATURE_LABELS_FA,
  LIMIT_LABELS_FA,
  type PlansComparison,
  type PublicPlan,
} from "./plans";
import { loadSettings } from "./settings.server";

interface RemotePlan {
  slug?: string;
  name?: string;
  description?: string;
  prices?: Record<string, { monthly?: number; yearly?: number }>;
  entitlements?: Record<string, unknown>;
  limits?: Record<string, unknown>;
  is_free?: boolean;
  sort_order?: number;
  localized?: Record<string, { name?: string; description?: string }>;
}

/** مبلغ ذخیره‌شده در اپلیکیشن ریال است؛ نمایش سایت تومان است */
function rialToToman(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n / 10);
}

function limitText(value: unknown): string {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "—";
  if (n < 0) return "نامحدود";
  return new Intl.NumberFormat("fa-IR").format(n);
}

function normalize(remote: RemotePlan, index: number, total: number): PublicPlan {
  const fa = remote.localized?.["fa"];
  const entitlements = remote.entitlements ?? {};
  const limits = remote.limits ?? {};
  const irr = remote.prices?.["IRR"] ?? {};

  const features = Object.keys(FEATURE_LABELS_FA)
    .filter((key) => entitlements[key] === true)
    .map((key) => FEATURE_LABELS_FA[key] as string);

  const limitRows = Object.keys(LIMIT_LABELS_FA)
    .filter((key) => limits[key] !== undefined && limits[key] !== null)
    .slice(0, 6)
    .map((key) => ({ label: LIMIT_LABELS_FA[key] as string, value: limitText(limits[key]) }));

  return {
    slug: remote.slug || `plan-${index}`,
    name: fa?.name?.trim() || remote.name || "پلن",
    description: fa?.description?.trim() || remote.description || "",
    isFree: remote.is_free === true,
    monthly: remote.is_free ? 0 : rialToToman(irr.monthly),
    yearly: remote.is_free ? 0 : rialToToman(irr.yearly),
    features,
    limits: limitRows,
    // پلن میانی معمولاً پیشنهادی است
    popular: total >= 3 && index === 1,
  };
}

function buildComparison(remotes: RemotePlan[], plans: PublicPlan[]): PlansComparison {
  const rows: PlansComparison["rows"] = [];
  for (const key of COMPARISON_LIMIT_KEYS) {
    if (!remotes.some((r) => r.limits?.[key] !== undefined)) continue;
    rows.push({
      label: LIMIT_LABELS_FA[key] as string,
      values: remotes.map((r) => limitText(r.limits?.[key])),
    });
  }
  for (const key of COMPARISON_FEATURE_KEYS) {
    if (!remotes.some((r) => r.entitlements?.[key] !== undefined)) continue;
    rows.push({
      label: FEATURE_LABELS_FA[key] as string,
      values: remotes.map((r) => r.entitlements?.[key] === true),
    });
  }
  return { plans: plans.map((p) => p.name), rows };
}

/** خواندن پلن‌ها از API اپلیکیشن — در صورت خطا null تا سایت پلن‌های پیش‌فرض را نشان دهد */
export async function loadRemotePlans(): Promise<{
  plans: PublicPlan[];
  comparison: PlansComparison;
} | null> {
  try {
    const settings = await loadSettings();
    if (!settings.plans?.enabled) return null;
    const url = (settings.plans.apiUrl || "").trim();
    if (!url) return null;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      headers: { accept: "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;

    const body = (await res.json()) as { plans?: RemotePlan[] };
    const remotes = (body.plans ?? []).filter((p) => p && (p.slug || p.name));
    if (remotes.length === 0) return null;
    remotes.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    const plans = remotes.map((r, i) => normalize(r, i, remotes.length));
    return { plans, comparison: buildComparison(remotes, plans) };
  } catch (error) {
    console.error("loadRemotePlans failed:", error);
    return null;
  }
}
