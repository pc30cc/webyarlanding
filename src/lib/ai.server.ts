// لایه سرور هوش مصنوعی — فقط سمت سرور. از دروازه‌ی Lovable AI استفاده می‌کند.
import { db, newId, nowIso, toCsv } from "./db.server";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const TEXT_MODEL = "google/gemini-3-flash";
const IMAGE_MODEL = "google/gemini-2.5-flash-image";

export class AiGatewayError extends Error {
  constructor(public code: "RATE_LIMIT" | "NO_CREDIT" | "UNKNOWN", message: string) {
    super(message);
  }
}

function apiKey(): string {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new AiGatewayError("UNKNOWN", "کلید LOVABLE_API_KEY در سرور تنظیم نشده است.");
  return key;
}

async function chat(messages: { role: string; content: string }[], jsonMode = false): Promise<string> {
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: TEXT_MODEL,
      messages,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (res.status === 429) {
    throw new AiGatewayError("RATE_LIMIT", "محدودیت تعداد درخواست به هوش مصنوعی — کمی صبر کنید و دوباره تلاش کنید.");
  }
  if (res.status === 402) {
    throw new AiGatewayError("NO_CREDIT", "اعتبار حساب هوش مصنوعی کافی نیست — لطفاً اعتبار را افزایش دهید.");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new AiGatewayError("UNKNOWN", `خطای هوش مصنوعی: ${res.status} ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

function extractJson<T>(raw: string, fallback: T): T {
  try {
    const cleaned = raw.trim().replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "");
    return JSON.parse(cleaned) as T;
  } catch {
    return fallback;
  }
}

export interface GeneratedPost {
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
}

export async function generatePostContent(input: {
  topic: string;
  tone?: string | undefined;
  length?: "short" | "medium" | "long" | undefined;
}): Promise<GeneratedPost> {
  const lengthHint =
    input.length === "long" ? "حدود ۱۲۰۰ تا ۱۸۰۰ کلمه" : input.length === "short" ? "حدود ۳۰۰ تا ۵۰۰ کلمه" : "حدود ۶۰۰ تا ۹۰۰ کلمه";
  const tone = input.tone || "حرفه‌ای و روان";

  const raw = await chat(
    [
      {
        role: "system",
        content:
          "شما یک نویسنده‌ی ارشد فارسی‌زبان و متخصص سئو هستید. همیشه فقط یک JSON معتبر با ساختار خواسته‌شده برمی‌گردانید، بدون هیچ توضیح اضافه.",
      },
      {
        role: "user",
        content:
          `درباره موضوع «${input.topic}» یک مقاله فارسی با لحن ${tone} و طول ${lengthHint} بنویس. ` +
          `خروجی را دقیقاً به شکل JSON با کلیدهای زیر بده:\n` +
          `{"title": "عنوان جذاب", "excerpt": "خلاصه یک تا دو جمله‌ای", "content": "متن کامل مقاله با فرمت markdown شامل تیترهای H2/H3", ` +
          `"tags": ["برچسب۱","برچسب۲","برچسب۳"], "seoTitle": "عنوان سئو حداکثر ۶۰ کاراکتر", "seoDescription": "توضیح متا حداکثر ۱۶۰ کاراکتر"}`,
      },
    ],
    true,
  );

  return extractJson<GeneratedPost>(raw, {
    title: input.topic,
    excerpt: "",
    content: "",
    tags: [],
    seoTitle: input.topic,
    seoDescription: "",
  });
}

export async function generateBlogPost(input: {
  topic: string;
  tone?: string | undefined;
  length?: "short" | "medium" | "long" | undefined;
  saveAsDraft?: boolean | undefined;
  categoryId?: string | null | undefined;
  author?: string | undefined;
}): Promise<GeneratedPost & { postId?: string }> {
  const generated = await generatePostContent(input);
  if (!input.saveAsDraft) return generated;

  const { savePost } = await import("./blog.server");
  const postId = await savePost({
    title: generated.title,
    excerpt: generated.excerpt,
    content: generated.content,
    tags: generated.tags,
    status: "draft",
    categoryId: input.categoryId ?? null,
    author: input.author ?? "",
    seoTitle: generated.seoTitle,
    seoDescription: generated.seoDescription,
  });
  return { ...generated, postId };
}

export async function improveText(input: { text: string; instruction: string }): Promise<string> {
  return await chat([
    {
      role: "system",
      content: "شما ویراستار حرفه‌ای متون فارسی هستید. فقط متن نهایی اصلاح‌شده را برگردانید، بدون توضیح اضافه.",
    },
    {
      role: "user",
      content: `دستور: ${input.instruction}\n\nمتن:\n${input.text}`,
    },
  ]);
}

export interface SeoMeta {
  seoTitle: string;
  seoDescription: string;
  focusKeyword: string;
}

export async function generateSeoMeta(input: { title: string; content: string }): Promise<SeoMeta> {
  const raw = await chat(
    [
      {
        role: "system",
        content: "شما متخصص سئو هستید و فقط یک JSON معتبر برمی‌گردانید.",
      },
      {
        role: "user",
        content:
          `برای این مقاله متا سئو مناسب پیشنهاد بده:\nعنوان: ${input.title}\nمحتوا: ${input.content.slice(0, 2000)}\n\n` +
          `خروجی JSON: {"seoTitle": "...", "seoDescription": "...", "focusKeyword": "..."}`,
      },
    ],
    true,
  );
  return extractJson<SeoMeta>(raw, { seoTitle: input.title, seoDescription: "", focusKeyword: "" });
}

export async function generateImage(input: { prompt: string; alt?: string | undefined }): Promise<{ id: string; url: string }> {
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      messages: [{ role: "user", content: input.prompt }],
      modalities: ["image", "text"],
    }),
  });

  if (res.status === 429) throw new AiGatewayError("RATE_LIMIT", "محدودیت تعداد درخواست تصویرسازی — کمی صبر کنید.");
  if (res.status === 402) throw new AiGatewayError("NO_CREDIT", "اعتبار حساب هوش مصنوعی برای تصویرسازی کافی نیست.");
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new AiGatewayError("UNKNOWN", `خطای تصویرسازی: ${res.status} ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  const dataUrl: string | undefined = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!dataUrl) throw new AiGatewayError("UNKNOWN", "پاسخ تصویرسازی نامعتبر بود.");

  const id = newId();
  const sizeMatch = dataUrl.match(/^data:(.+?);base64,(.+)$/);
  const mime = sizeMatch?.[1] ?? "image/png";
  const base64Len = sizeMatch?.[2]?.length ?? 0;

  await db.from("media_assets").insert({
    id,
    provider: "lovable-ai",
    path: `ai-generated/${id}.png`,
    url: dataUrl,
    filename: `${id}.png`,
    mime_type: mime,
    size_bytes: Math.round((base64Len * 3) / 4),
    alt: input.alt ?? input.prompt.slice(0, 480),
    updated_at: nowIso(),
  });

  return { id, url: dataUrl };
}
