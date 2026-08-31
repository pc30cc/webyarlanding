// لایه سرور هوش مصنوعی — فقط سمت سرور. مستقیم به OpenAI یا Google Gemini وصل می‌شود
// (بدون واسطه یا دروازه‌ی شخص ثالث)؛ کلید API و مدل هر سرویس از تنظیمات پنل ادمین خوانده می‌شود.
import { db, newId, nowIso } from "./db.server";
import { loadAiKeys, loadSettings } from "./settings.server";
import type { AiSettings } from "./settings";
import type { AiApiKeys } from "./settings.server";

export class AiGatewayError extends Error {
  constructor(
    public code: "RATE_LIMIT" | "NO_CREDIT" | "NOT_CONFIGURED" | "UNKNOWN",
    message: string,
  ) {
    super(message);
  }
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface AiConfig {
  ai: AiSettings;
  keys: AiApiKeys;
}

async function getAiConfig(): Promise<AiConfig> {
  const [settings, keys] = await Promise.all([loadSettings(), loadAiKeys()]);
  return { ai: settings.ai, keys };
}

function withStyle(instruction: string, systemPrompt: string): string {
  return systemPrompt ? `${instruction}\n\nسبک و لحن نوشتار: ${systemPrompt}` : instruction;
}

async function chatOpenAi(
  messages: ChatMessage[],
  jsonMode: boolean,
  config: AiConfig,
): Promise<string> {
  const key = config.keys.aiOpenaiApiKey;
  if (!key) {
    throw new AiGatewayError(
      "NOT_CONFIGURED",
      "کلید API اوپن‌ای‌آی در تنظیمات عمومی → هوش مصنوعی وارد نشده است.",
    );
  }
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.ai.openai?.textModel || "gpt-4o-mini",
      messages,
      temperature: config.ai.temperature,
      max_tokens: config.ai.maxTokens,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (res.status === 429) {
    throw new AiGatewayError(
      "RATE_LIMIT",
      "محدودیت تعداد درخواست اوپن‌ای‌آی — کمی صبر کنید و دوباره تلاش کنید.",
    );
  }
  if (res.status === 401 || res.status === 403) {
    throw new AiGatewayError("UNKNOWN", "کلید API اوپن‌ای‌آی نامعتبر است یا دسترسی کافی ندارد.");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new AiGatewayError("UNKNOWN", `خطای اوپن‌ای‌آی: ${res.status} ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

async function chatGemini(
  messages: ChatMessage[],
  jsonMode: boolean,
  config: AiConfig,
): Promise<string> {
  const key = config.keys.aiGeminiApiKey;
  if (!key) {
    throw new AiGatewayError(
      "NOT_CONFIGURED",
      "کلید API جمینای در تنظیمات عمومی → هوش مصنوعی وارد نشده است.",
    );
  }
  const model = config.ai.gemini?.textModel || "gemini-2.0-flash";
  const systemMsg = messages.find((m) => m.role === "system");
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: config.ai.temperature,
      maxOutputTokens: config.ai.maxTokens,
      ...(jsonMode ? { responseMimeType: "application/json" } : {}),
    },
  };
  if (systemMsg) body["systemInstruction"] = { parts: [{ text: systemMsg.content }] };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
  );

  if (res.status === 429) {
    throw new AiGatewayError(
      "RATE_LIMIT",
      "محدودیت تعداد درخواست جمینای — کمی صبر کنید و دوباره تلاش کنید.",
    );
  }
  if (res.status === 400 || res.status === 403) {
    throw new AiGatewayError("UNKNOWN", "کلید API جمینای نامعتبر است یا دسترسی کافی ندارد.");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new AiGatewayError("UNKNOWN", `خطای جمینای: ${res.status} ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

async function chat(messages: ChatMessage[], jsonMode = false): Promise<string> {
  const config = await getAiConfig();
  return config.ai.provider === "gemini"
    ? chatGemini(messages, jsonMode, config)
    : chatOpenAi(messages, jsonMode, config);
}

function extractJson<T>(raw: string, fallback: T): T {
  try {
    const cleaned = raw
      .trim()
      .replace(/^```json/i, "")
      .replace(/^```/, "")
      .replace(/```$/, "");
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
    input.length === "long"
      ? "حدود ۱۲۰۰ تا ۱۸۰۰ کلمه"
      : input.length === "short"
        ? "حدود ۳۰۰ تا ۵۰۰ کلمه"
        : "حدود ۶۰۰ تا ۹۰۰ کلمه";
  const tone = input.tone || "حرفه‌ای و روان";
  const config = await getAiConfig();

  const raw = await chat(
    [
      {
        role: "system",
        content: withStyle(
          "شما یک نویسنده‌ی ارشد فارسی‌زبان و متخصص سئو هستید. همیشه فقط یک JSON معتبر با ساختار خواسته‌شده برمی‌گردانید، بدون هیچ توضیح اضافه.",
          config.ai.systemPrompt,
        ),
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
  withImage?: boolean | undefined;
}): Promise<
  GeneratedPost & { postId?: string; coverImage?: string; imageError?: string | undefined }
> {
  const generated = await generatePostContent(input);
  if (!input.saveAsDraft) return generated;

  let coverImage = "";
  let imageError: string | undefined;
  if (input.withImage) {
    try {
      const image = await generateImage({
        prompt: `عکس کاور حرفه‌ای و مرتبط با موضوع: ${generated.title}`,
        alt: generated.title,
      });
      coverImage = image.url;
    } catch (e) {
      imageError = e instanceof Error ? e.message : "خطای ناشناخته در تولید تصویر";
      console.error("generateBlogPost: cover image generation failed:", e);
    }
  }

  const { savePost } = await import("./blog.server");
  const postId = await savePost({
    title: generated.title,
    excerpt: generated.excerpt,
    content: generated.content,
    coverImage,
    tags: generated.tags,
    status: "draft",
    categoryId: input.categoryId ?? null,
    author: input.author ?? "",
    seoTitle: generated.seoTitle,
    seoDescription: generated.seoDescription,
  });
  return { ...generated, postId, coverImage, imageError };
}

export async function improveText(input: { text: string; instruction: string }): Promise<string> {
  const config = await getAiConfig();
  return await chat([
    {
      role: "system",
      content: withStyle(
        "شما ویراستار حرفه‌ای متون فارسی هستید. فقط متن نهایی اصلاح‌شده را برگردانید، بدون توضیح اضافه.",
        config.ai.systemPrompt,
      ),
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

async function generateImageOpenAi(prompt: string, config: AiConfig): Promise<string> {
  const key = config.keys.aiOpenaiApiKey;
  if (!key) {
    throw new AiGatewayError(
      "NOT_CONFIGURED",
      "کلید API اوپن‌ای‌آی در تنظیمات عمومی → هوش مصنوعی وارد نشده است.",
    );
  }
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.ai.openai?.imageModel || "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json",
    }),
  });

  if (res.status === 429)
    throw new AiGatewayError("RATE_LIMIT", "محدودیت تعداد درخواست تصویرسازی — کمی صبر کنید.");
  if (res.status === 401 || res.status === 403) {
    throw new AiGatewayError("UNKNOWN", "کلید API اوپن‌ای‌آی نامعتبر است یا دسترسی کافی ندارد.");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new AiGatewayError("UNKNOWN", `خطای تصویرسازی: ${res.status} ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  const b64: string | undefined = data?.data?.[0]?.b64_json;
  if (!b64) throw new AiGatewayError("UNKNOWN", "پاسخ تصویرسازی نامعتبر بود.");
  return `data:image/png;base64,${b64}`;
}

async function generateImageGemini(prompt: string, config: AiConfig): Promise<string> {
  const key = config.keys.aiGeminiApiKey;
  if (!key) {
    throw new AiGatewayError(
      "NOT_CONFIGURED",
      "کلید API جمینای در تنظیمات عمومی → هوش مصنوعی وارد نشده است.",
    );
  }
  const model = config.ai.gemini?.imageModel || "gemini-2.5-flash-image";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
      }),
    },
  );

  if (res.status === 429)
    throw new AiGatewayError("RATE_LIMIT", "محدودیت تعداد درخواست تصویرسازی — کمی صبر کنید.");
  if (res.status === 400 || res.status === 403) {
    throw new AiGatewayError("UNKNOWN", "کلید API جمینای نامعتبر است یا دسترسی کافی ندارد.");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new AiGatewayError("UNKNOWN", `خطای تصویرسازی: ${res.status} ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  const parts: { inlineData?: { mimeType: string; data: string } }[] =
    data?.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((p) => p.inlineData);
  if (!imagePart?.inlineData) throw new AiGatewayError("UNKNOWN", "پاسخ تصویرسازی نامعتبر بود.");
  return `data:${imagePart.inlineData.mimeType || "image/png"};base64,${imagePart.inlineData.data}`;
}

export async function generateImage(input: {
  prompt: string;
  alt?: string | undefined;
}): Promise<{ id: string; url: string }> {
  const config = await getAiConfig();
  const dataUrl =
    config.ai.provider === "gemini"
      ? await generateImageGemini(input.prompt, config)
      : await generateImageOpenAi(input.prompt, config);

  const id = newId();
  const sizeMatch = dataUrl.match(/^data:(.+?);base64,(.+)$/);
  const mime = sizeMatch?.[1] ?? "image/png";
  const base64Len = sizeMatch?.[2]?.length ?? 0;

  const { error } = await db.from("media_assets").insert({
    id,
    provider: config.ai.provider,
    path: `ai-generated/${id}.png`,
    url: dataUrl,
    filename: `${id}.png`,
    mime_type: mime,
    size_bytes: Math.round((base64Len * 3) / 4),
    alt: input.alt ?? input.prompt.slice(0, 480),
    updated_at: nowIso(),
  });
  if (error) {
    throw new AiGatewayError("UNKNOWN", `ذخیره‌سازی تصویر در دیتابیس ناموفق بود: ${error.message}`);
  }

  return { id, url: dataUrl };
}
