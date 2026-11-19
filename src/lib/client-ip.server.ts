// آی‌پی واقعی بازدیدکننده پشت Traefik (و کلادفلر، اگر جلوی سایت باشد) — فقط سمت سرور.
//
// هر پروکسی خودمان (Traefik، شبکه داکر) آدرسی را که دیده به انتهای X-Forwarded-For اضافه می‌کند؛
// پس اولین ورودی از سمت راست که مال خودمان نیست «لبه» است: آدرسی که به پروکسی ما وصل شد. هرچه
// بازدیدکننده خودش در X-Forwarded-For بنویسد سمت چپ آن می‌ماند (Traefik بدون forwardedHeaders
// آن را کلاً پاک می‌کند)، پس قابل جعل نیست. getRequestIP({ xForwardedFor: true }) اولین ورودی از
// چپ را برمی‌گرداند که دست بازدیدکننده است.
//
//   - لبه یکی از آدرس‌های کلادفلر است: کلادفلر cf-connecting-ip و cf-ipcountry را خودش
//     بازنویسی می‌کند، پس بازدیدکننده همان cf-connecting-ip است و کشورش cf-ipcountry.
//   - هر لبه دیگری خود بازدیدکننده است و هدرهای cf-* نادیده گرفته می‌شوند (کسی که مستقیم به
//     آدرس سرور وصل شود نمی‌تواند آی‌پی یا کشورش را با این هدرها انتخاب کند).
//
// همان قاعده kindred-core-build (server/utils/clientIp.ts) روی همان سرور و همان Traefik.
import { BlockList, isIP } from "node:net";

/**
 * https://www.cloudflare.com/ips-v4 و https://www.cloudflare.com/ips-v6 (همان فهرست
 * kindred-core-build، خوانده‌شده 2026-10-17). CLOUDFLARE_IPS بدون deploy جایگزینش می‌کند:
 * فهرستی از IP و CIDR با کاما یا فاصله؛ «default» یعنی همین فهرست و «off» یعنی هیچ‌کدام.
 */
export const CLOUDFLARE_IP_RANGES: readonly string[] = [
  "173.245.48.0/20",
  "103.21.244.0/22",
  "103.22.200.0/22",
  "103.31.4.0/22",
  "141.101.64.0/18",
  "108.162.192.0/18",
  "190.93.240.0/20",
  "188.114.96.0/20",
  "197.234.240.0/22",
  "198.41.128.0/17",
  "162.158.0.0/15",
  "104.16.0.0/13",
  "104.24.0.0/14",
  "172.64.0.0/13",
  "131.0.72.0/22",
  "2400:cb00::/32",
  "2606:4700::/32",
  "2803:f800::/32",
  "2405:b500::/32",
  "2405:8100::/32",
  "2a06:98c0::/29",
  "2c0f:f248::/32",
];

/** هشت گروه ۱۶ بیتی یک آدرس IPv6 (هر شکل نوشتن، با دنباله IPv4 نقطه‌دار)، یا null. */
function ipv6Groups(ip: string): number[] | null {
  if (isIP(ip) !== 6) return null;
  let text = ip;
  const dotted = text.match(/^(.*:)(\d+\.\d+\.\d+\.\d+)$/);
  if (dotted) {
    const o = dotted[2]!.split(".").map(Number);
    text = `${dotted[1]}${((o[0]! << 8) | o[1]!).toString(16)}:${((o[2]! << 8) | o[3]!).toString(16)}`;
  }
  const [head, tail] = text.split("::");
  const part = (x: string | undefined) =>
    x
      ? x
          .split(":")
          .filter(Boolean)
          .map((h) => parseInt(h, 16))
      : [];
  const a = part(head);
  const b = tail === undefined ? [] : part(tail);
  const fill = 8 - a.length - b.length;
  if (fill < 0 || (tail === undefined && fill !== 0)) return null;
  return [...a, ...new Array<number>(fill).fill(0), ...b];
}

/** پورت، براکت و zone را می‌اندازد و IPv4-mapped را به IPv4 ساده برمی‌گرداند؛ اگر IP نباشد null. */
export function normalizeIp(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let ip = String(raw).trim().toLowerCase();
  if (!ip || ip === "unknown") return null;
  if (ip.startsWith("[")) {
    const close = ip.indexOf("]");
    if (close > 0) ip = ip.slice(1, close);
  } else if (ip.includes(".") && ip.split(":").length === 2) {
    ip = ip.split(":")[0]!;
  }
  const zone = ip.indexOf("%");
  if (zone > 0) ip = ip.slice(0, zone);
  const g = ipv6Groups(ip);
  if (g && g.slice(0, 5).every((x) => x === 0) && g[5] === 0xffff) {
    return `${g[6]! >> 8}.${g[6]! & 255}.${g[7]! >> 8}.${g[7]! & 255}`;
  }
  return isIP(ip) ? ip : null;
}

/** آدرس خصوصی، loopback، link-local یا رزرو (یعنی یکی از hopهای خودمان، یا نامعتبر). */
export function isPrivateOrReservedIp(raw: string): boolean {
  const ip = normalizeIp(raw);
  if (!ip) return true;
  if (isIP(ip) === 4) {
    const o = ip.split(".").map(Number) as [number, number, number, number];
    if (o[0] === 0 || o[0] === 10 || o[0] === 127) return true;
    if (o[0] === 169 && o[1] === 254) return true;
    if (o[0] === 172 && o[1] >= 16 && o[1] <= 31) return true;
    if (o[0] === 192 && o[1] === 168) return true;
    if (o[0] === 100 && o[1] >= 64 && o[1] <= 127) return true; // CGNAT
    if (o[0] >= 224) return true;
    return false;
  }
  const g = ipv6Groups(ip);
  if (!g) return true;
  if (g.slice(0, 7).every((x) => x === 0) && g[7]! <= 1) return true; // :: و ::1
  if ((g[0]! & 0xffc0) === 0xfe80) return true; // fe80::/10
  if ((g[0]! & 0xfe00) === 0xfc00) return true; // fc00::/7
  if ((g[0]! & 0xff00) === 0xff00) return true; // ff00::/8
  return false;
}

let cloudflare: BlockList | null = null;
let cloudflareSource: string | undefined;

function cloudflareRanges(): BlockList {
  const raw = (process.env["CLOUDFLARE_IPS"] ?? "").trim();
  if (cloudflare && cloudflareSource === raw) return cloudflare;
  const list = new BlockList();
  const entries = raw ? raw.split(/[\s,]+/).filter(Boolean) : ["default"];
  const add = (entry: string) => {
    const [addr, bits, extra] = entry.split("/");
    const ip = normalizeIp(addr);
    if (!ip || extra !== undefined) return false;
    const type = isIP(ip) === 4 ? "ipv4" : "ipv6";
    if (bits === undefined) {
      list.addAddress(ip, type);
      return true;
    }
    const prefix = Number(bits);
    if (!/^\d{1,3}$/.test(bits) || prefix < 1 || prefix > (type === "ipv4" ? 32 : 128))
      return false;
    list.addSubnet(ip, prefix, type);
    return true;
  };
  for (const entry of entries) {
    const word = entry.toLowerCase();
    if (word === "off" || word === "none") continue;
    if (word === "default") {
      for (const range of CLOUDFLARE_IP_RANGES) add(range);
      continue;
    }
    if (!add(entry)) console.warn(`[client-ip] CLOUDFLARE_IPS: "${entry}" is not an IP or CIDR`);
  }
  cloudflare = list;
  cloudflareSource = raw;
  return list;
}

/** آیا این آدرس یکی از لبه‌های کلادفلر است؟ */
export function isCloudflareIp(raw: string | null | undefined): boolean {
  const ip = normalizeIp(raw);
  if (!ip) return false;
  return cloudflareRanges().check(ip, isIP(ip) === 4 ? "ipv4" : "ipv6");
}

/** آنچه از درخواست لازم است: آدرس TCP همتا و هدرهای پروکسی. */
export interface ForwardingFacts {
  /** آدرس سوکت (بدون X-Forwarded-For)؛ پشت Traefik آدرس خصوصی Traefik است. */
  peer: string | null | undefined;
  xForwardedFor: string | null | undefined;
  cfConnectingIp?: string | null | undefined;
  cfIpCountry?: string | null | undefined;
}

function headerList(value: string | null | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * لبه: آدرسی که به بیرونی‌ترین پروکسی ما وصل شد، یا null وقتی همه hopها مال خودمان‌اند. همتای
 * عمومی خودش لبه است. همتای خصوصی (Traefik) یا ناشناخته (adapterی که آدرس سوکت را نمی‌دهد):
 * X-Forwarded-For از راست خوانده می‌شود و hopهای خودمان رد می‌شوند. ورودی نامعتبر خواندن را متوقف
 * می‌کند، چون چیزی سمت چپ آن قابل اعتماد نیست.
 */
export function edgeIp(facts: ForwardingFacts): string | null {
  const peer = normalizeIp(facts.peer);
  if (peer && (isCloudflareIp(peer) || !isPrivateOrReservedIp(peer))) return peer;
  const chain = headerList(facts.xForwardedFor);
  for (let i = chain.length - 1; i >= 0; i -= 1) {
    const ip = normalizeIp(chain[i]);
    if (!ip) return null;
    if (isCloudflareIp(ip)) return ip;
    if (isPrivateOrReservedIp(ip)) continue;
    return ip;
  }
  return null;
}

/**
 * آی‌پی بازدیدکننده برای محدودیت تلاش ورود و لاگ‌ها. پشت کلادفلر cf-connecting-ip، وگرنه لبه؛
 * اگر هیچ‌کدام معلوم نباشد (اجرای محلی) آدرس سوکت، و در نهایت رشته خالی.
 */
export function resolveClientIp(facts: ForwardingFacts): string {
  const edge = edgeIp(facts);
  if (edge && isCloudflareIp(edge)) {
    const cf = normalizeIp(headerList(facts.cfConnectingIp)[0]);
    if (cf && !isPrivateOrReservedIp(cf)) return cf;
    return edge;
  }
  if (edge) return edge;
  return normalizeIp(facts.peer) ?? "";
}

/**
 * کشور بازدیدکننده از cf-ipcountry، فقط وقتی لبه کلادفلر است؛ وگرنه null. «XX» (ناشناس) و
 * «T1» (Tor) هم null هستند.
 */
export function resolveCloudflareCountry(facts: ForwardingFacts): string | null {
  if (!isCloudflareIp(edgeIp(facts))) return null;
  const code = (headerList(facts.cfIpCountry)[0] ?? "").toUpperCase();
  if (!/^[A-Z]{2}$/.test(code) || code === "XX" || code === "T1") return null;
  return code;
}
