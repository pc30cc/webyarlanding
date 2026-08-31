import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const genPostSchema = z.object({
  topic: z.string().min(2, "موضوع را وارد کنید"),
  tone: z.string().optional(),
  length: z.enum(["short", "medium", "long"]).optional(),
  saveAsDraft: z.boolean().optional().default(false),
  categoryId: z.string().nullable().optional(),
  author: z.string().optional(),
});

function toPersianError(e: unknown): Error {
  if (e instanceof Error) return e;
  return new Error("خطای ناشناخته در هوش مصنوعی");
}

export const generateBlogPost = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => genPostSchema.parse(input))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./auth.server");
    const { generateBlogPost: run } = await import("./ai.server");
    await requireAdmin();
    try {
      return await run(data);
    } catch (e) {
      throw toPersianError(e);
    }
  });

export const improveText = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ text: z.string().min(1), instruction: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./auth.server");
    const { improveText: run } = await import("./ai.server");
    await requireAdmin();
    try {
      return { text: await run(data) };
    } catch (e) {
      throw toPersianError(e);
    }
  });

export const generateSeoMeta = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ title: z.string().min(1), content: z.string().default("") }).parse(input),
  )
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./auth.server");
    const { generateSeoMeta: run } = await import("./ai.server");
    await requireAdmin();
    try {
      return await run(data);
    } catch (e) {
      throw toPersianError(e);
    }
  });

export const generateImage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ prompt: z.string().min(2), alt: z.string().optional() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./auth.server");
    const { generateImage: run } = await import("./ai.server");
    await requireAdmin();
    try {
      return await run(data);
    } catch (e) {
      throw toPersianError(e);
    }
  });

function maskKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) return "•".repeat(key.length);
  return `${key.slice(0, 4)}${"•".repeat(6)}${key.slice(-4)}`;
}

/** وضعیت کلیدهای API هوش مصنوعی — مقدار واقعی کلید هرگز به کلاینت برنمی‌گردد */
export const adminGetAiKeysStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdmin } = await import("./auth.server");
  await requireAdmin();
  const { loadAiKeys } = await import("./settings.server");
  const keys = await loadAiKeys();
  return {
    openaiKeySet: !!keys.aiOpenaiApiKey,
    openaiKeyPreview: maskKey(keys.aiOpenaiApiKey),
    geminiKeySet: !!keys.aiGeminiApiKey,
    geminiKeyPreview: maskKey(keys.aiGeminiApiKey),
  };
});

const saveAiKeysSchema = z.object({
  openaiApiKey: z.string().optional(),
  geminiApiKey: z.string().optional(),
  clearOpenai: z.boolean().optional().default(false),
  clearGemini: z.boolean().optional().default(false),
});

/** ذخیره یا حذف کلیدهای API — مقدار خالی/نامشخص به‌معنای «بدون تغییر» است */
export const adminSaveAiKeys = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => saveAiKeysSchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const { requireAdmin } = await import("./auth.server");
    await requireAdmin();
    const { saveAiKeys } = await import("./settings.server");
    const partial: { aiOpenaiApiKey?: string; aiGeminiApiKey?: string } = {};
    if (data.clearOpenai) partial.aiOpenaiApiKey = "";
    else if (data.openaiApiKey) partial.aiOpenaiApiKey = data.openaiApiKey;
    if (data.clearGemini) partial.aiGeminiApiKey = "";
    else if (data.geminiApiKey) partial.aiGeminiApiKey = data.geminiApiKey;
    await saveAiKeys(partial);
    return { ok: true };
  });
