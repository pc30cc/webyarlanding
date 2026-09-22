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

/**
 * صحنه‌های متنوع برای کاور مقالات — تصادفی انتخاب می‌شوند تا تصاویر شبیه هم و تکراری نشوند.
 * چون موضوع سایت خدمات آنلاین/دیجیتال (چت، تماس تصویری، فروش اینترنتی) است، صحنه‌ها عمداً حول
 * کسب‌وکار آنلاین/دیجیتال می‌چرخند نه فضای فیزیکی مغازه؛ با این حال بین شخصیت مرد/زن و بین
 * ژست‌ها و زاویه‌های مختلف (نه فقط تایپ‌کردن روی صفحه از یک زاویه‌ی ثابت) تنوع دارد.
 */
const COVER_SCENES = [
  "مردی صاحب یک فروشگاه اینترنتی، در حال بسته‌بندی سفارش مشتری در جعبه، با کارتن‌های دور و بر روی میز کار",
  "زنی با ظاهر امروزی و شیک، مطابق سبک جوانان امروز ایرانی، در حال عکاسی از یک محصول برای فروشگاه آنلاینش با گوشی روی سه‌پایه کوچک",
  "مردی به‌عنوان اپراتور پشتیبانی آنلاین با هدست، در حال صحبت و لبخندی طبیعی، در محیط کاری نرم و روشن",
  "زنی با ظاهر امروزی و شیک، صاحب یک کسب‌وکار خانگی، در حال بسته‌بندی سفارش‌های آنلاین روی میز آشپزخانه",
  "دو نفر (یک مرد و یک زن با ظاهر امروزی) دور یک میز کوچک، در حال بررسی دوستانه آمار فروش آنلاین روی لپ‌تاپ",
  "مردی پیک موتوری، در حال تحویل بسته سفارش اینترنتی به مشتری دم در، با لبخندی دوستانه",
  "زنی با ظاهر امروزی و شیک، فریلنسر، نشسته روی مبل خانه در حالتی راحت و در حال کار با تبلت",
  "ترکیب‌بندی انتزاعی و مینیمال از حباب‌های گفت‌وگو، آیکون سبد خرید و گره‌های اتصال شبکه‌ای، بدون حضور انسان، با رنگ‌های ملایم و گرم",
  "مردی صاحب یک کسب‌وکار کوچک، در حال گرفتن عکس از یک محصول دست‌ساز برای فروش اینترنتی، نور طبیعی از پنجره",
  "زنی با ظاهر امروزی و شیک، در حال پاسخ‌دادن به پیام مشتری از طریق گوشی هوشمند، نشسته در یک کافه با نور طبیعی",
  "نمای نزدیک از دستان یک مرد که محصولات را برای ارسال سفارش آنلاین در جعبه می‌چیند",
  "مردی جوان صاحب یک استارتاپ، در حال توضیح یک ایده روی تخته سفید کوچک برای همکارش (زنی با ظاهر امروزی و شیک)",
  "زنی با ظاهر امروزی و شیک، مدیر شبکه‌های اجتماعی یک برند، در حال بررسی پیام‌های مشتریان روی گوشی در فضایی روشن و دنج",
  "مردی در حال تماس تصویری دوستانه با یک مشتری از طریق لپ‌تاپ، در محیطی غیررسمی مثل خانه یا دفتر کوچک",
  "نمای از بالای سر یک زن با ظاهر امروزی که سفارش‌های آنلاین را روی میز آشپزخانه بسته‌بندی می‌کند",
  "مردی میان‌سال، صاحب یک فروشگاه محلی که به‌تازگی فروش آنلاین را هم شروع کرده، با لبخند رضایت در حال چک‌کردن سفارش‌های جدید روی گوشی",
];

/** حال‌وهوای نوری/رنگی تصویر — با صحنه ترکیب می‌شود تا کاورها شبیه هم نشوند */
const COVER_MOODS = [
  "نور طلایی اواخر بعدازظهر از پنجره، سایه‌های بلند و گرم، رنگ‌های کهربایی",
  "نور ملایم و سرد یک صبح ابری، پالت آبی و خاکستری آرام",
  "نور شب با چراغ‌های گرم داخل اتاق و انعکاس ملایم صفحه‌نمایش، فضای دنج",
  "نور روشن و پرکنتراست ظهر، رنگ‌های تمیز و روشن با سفیدی زیاد",
  "پالت گرم خاکی و کرم با بافت چوب و کاغذ در قاب",
  "پالت سرد مینیمال با سطوح سفید و سبز گیاهان در پس‌زمینه",
  "نور پراکنده و مه‌آلود کنار پنجره در یک روز بارانی، حال‌وهوای آرام",
  "رنگ‌های زنده و شاد با یک لکه‌رنگ برجسته (مثلاً نارنجی یا فیروزه‌ای) در ترکیب‌بندی",
];

/** زاویه و فاصله دوربین — برای اینکه همه کاورها از یک قاب تکراری نباشند */
const COVER_SHOTS = [
  "نمای متوسط از فاصله نزدیک با عمق میدان کم و پس‌زمینه محو",
  "نمای باز از فاصله دور که کل فضا دیده شود",
  "نمای از بالا (فلت‌لی) روی سطح میز",
  "نمای از زاویه پایین و کمی مورب",
  "نمای شانه‌ای از پشت سر شخصیت",
  "نمای بسیار نزدیک روی دست‌ها و جزئیات کار",
  "قاب‌بندی از پشت شیشه یا لای در، با پیش‌زمینه‌ی محو",
];

function pickBy<T>(list: T[], seed?: number): T {
  const idx =
    typeof seed === "number"
      ? ((seed % list.length) + list.length) % list.length
      : Math.floor(Math.random() * list.length);
  return list[idx]!;
}

/**
 * پرامپت ساخت تصویر کاور — عکس‌گونه و واقعی، با صحنه/نور/زاویه‌ی متغیر.
 * `variantSeed` باعث می‌شود کاورهای پشت‌سرهم (تولید خودکار) روی ترکیب‌های متفاوت بچرخند.
 */
export function buildCoverImagePrompt(title: string, variantSeed?: number): string {
  const scene = pickBy(COVER_SCENES, variantSeed);
  const mood = pickBy(COVER_MOODS, typeof variantSeed === "number" ? variantSeed * 3 + 1 : undefined);
  const shot = pickBy(COVER_SHOTS, typeof variantSeed === "number" ? variantSeed * 5 + 2 : undefined);
  return (
    `یک عکس باکیفیت و کاملاً واقع‌گرایانه به‌عنوان کاور مقاله‌ای با موضوع «${title}» بساز؛ این صحنه را به‌کار ببر: ${scene}. ` +
    `حال‌وهوای نور و رنگ تصویر: ${mood}. زاویه و قاب‌بندی دوربین: ${shot}. این ترکیب باید کاملاً متفاوت از کاورهای قبلی به نظر برسد. ` +
    `تصویر باید دقیقاً مثل یک عکس واقعی گرفته‌شده با دوربین باشد، نه یک اثر گرافیکی یا تولیدشده با هوش مصنوعی: نور طبیعی و کمی نامتقارن، بافت پوست واقعی با جزئیات ریز (نه صاف و شیشه‌ای)، حالت بدن و صورت طبیعی و بدون ژست تصنعی، ترکیب‌بندی کمی نامتقارن مثل عکس‌های واقعی روزمره (نه کاملاً مرکزچین و متقارن)، رنگ‌های طبیعی و نه بیش‌ازحد اشباع یا براق. ` +
    `از ویژگی‌های معمول و لودهنده‌ی تصاویر هوش مصنوعی به‌شدت پرهیز کن: پوست بیش‌ازحد صاف و پلاستیکی، تقارن غیرطبیعی صورت، دست و انگشتان عجیب یا نادرست، نگاه خیره و لبخند قالبی و تکراری به دوربین، نورپردازی استودیویی بیش‌ازحد کامل و بی‌نقص. ` +
    `اگر شخصیت زن در تصویر هست، ظاهر و پوشش او باید امروزی، ساده و شیک باشد، دقیقاً مثل سبک پوشش جوانان امروز ایرانی در فضای کاری (نه پوشش رسمی و سنگین، و نه لباس بیش‌ازحد رسمی یا قدیمی)؛ با این حال به‌هیچ‌وجه پا یا ساق پای برهنه نشان داده نشود. لباس همه‌ی افراد متناسب با نوع کسب‌وکار، ساده و امروزی باشد. ` +
    `فضای تصویر باید مرتبط با کسب‌وکار آنلاین/اینترنتی باشد (فروشگاه اینترنتی، پشتیبانی آنلاین، فریلنسری، ارسال سفارش، شبکه‌های اجتماعی و مانند آن)، نه فضای فیزیکی داخل یک مغازه یا ویترین؛ از تکرار همیشگی صحنه‌ی «فرد پشت میز و لپ‌تاپ در محیط اداری رسمی» و از تکرار همیشگی زاویه‌ی «کار کردن با موبایل یا کامپیوتر» هم خودداری کن. تنوع در نوع صحنه، جنسیت شخصیت و زاویه دوربین داشته باش. ترکیب‌بندی ساده و خلوت باشد، بدون شلوغی بصری و بدون هیچ متن یا نوشته‌ای روی تصویر.`
  );
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
  return config.ai.textProvider === "gemini"
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
  focusKeyword: string;
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
          `{"title": "عنوان جذاب — فقط از حروف و کلمات فارسی تشکیل شود، هیچ نشانه یا کاراکتر خاصی مثل : ؟ ! - _ « » ( ) در آن نباشد", ` +
          `"excerpt": "خلاصه یک تا دو جمله‌ای", "content": "متن کامل مقاله با فرمت markdown شامل تیترهای H2/H3", ` +
          `"tags": ["برچسب۱","برچسب۲","برچسب۳"], "seoTitle": "عنوان سئو حداکثر ۶۰ کاراکتر", "seoDescription": "توضیح متا حداکثر ۱۶۰ کاراکتر", ` +
          `"focusKeyword": "مهم‌ترین کلمه یا عبارت کلیدی هدف این مقاله (۲ تا ۴ کلمه)"}`,
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
    focusKeyword: input.topic,
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
        prompt: buildCoverImagePrompt(generated.title),
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
    focusKeyword: generated.focusKeyword,
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

/** فراخوانی عمومی هوش مصنوعی با خروجی JSON — برای ماژول‌های دیگر سرور (مثل بررسی سئو) */
export async function aiJson<T>(system: string, user: string, fallback: T): Promise<T> {
  const raw = await chat(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    true,
  );
  return extractJson<T>(raw, fallback);
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
  const model = config.ai.openai?.imageModel || "gpt-image-1";
  // خانواده dall-e (قدیمی) به response_format نیاز دارد؛ خانواده gpt-image این پارامتر را
  // نمی‌پذیرد و همیشه b64_json برمی‌گرداند — ارسال آن برای gpt-image باعث خطای ۴۰۰ می‌شود.
  const isLegacyDalle = model.startsWith("dall-e");
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      n: 1,
      size: "1024x1024",
      ...(isLegacyDalle ? { response_format: "b64_json" } : {}),
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
    config.ai.imageProvider === "gemini"
      ? await generateImageGemini(input.prompt, config)
      : await generateImageOpenAi(input.prompt, config);

  const id = newId();
  const filename = `covers/${id}.png`;

  const { uploadImageDataUrl, StorageError } = await import("./storage.server");
  let uploaded: Awaited<ReturnType<typeof uploadImageDataUrl>>;
  try {
    uploaded = await uploadImageDataUrl(dataUrl, filename);
  } catch (e) {
    if (e instanceof StorageError) throw new AiGatewayError("UNKNOWN", e.message);
    throw e;
  }
  const { url, path, mimeType, sizeBytes } = uploaded;

  const { error } = await db.from("media_assets").insert({
    id,
    provider: config.ai.imageProvider,
    path,
    url,
    filename: path.split("/").pop() ?? `${id}.jpg`,
    mime_type: mimeType,
    size_bytes: sizeBytes,
    alt: input.alt ?? input.prompt.slice(0, 480),
    updated_at: nowIso(),
  });
  if (error) {
    throw new AiGatewayError("UNKNOWN", `ذخیره‌سازی تصویر در دیتابیس ناموفق بود: ${error.message}`);
  }

  return { id, url };
}
