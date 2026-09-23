import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { ReviewResult, SeoProposal } from "./seoproposals.server";

export type { ReviewResult, SeoProposal };

/** فهرست پیشنهادهای سئو و محتوا */
export const listSeoProposals = createServerFn({ method: "GET" }).handler(
  async (): Promise<SeoProposal[]> => {
    const { requireAdmin } = await import("./auth.server");
    await requireAdmin();
    const { listProposals } = await import("./seoproposals.server");
    return await listProposals();
  },
);

/** اجرای دستی بررسی و ساخت پیشنهادها (بدون اعمال روی سایت) */
export const runSeoReviewNow = createServerFn({ method: "POST" }).handler(
  async (): Promise<ReviewResult> => {
    const { requireAdmin } = await import("./auth.server");
    await requireAdmin();
    const { runSeoReview, formatReviewForTelegram } = await import("./seoproposals.server");
    const result = await runSeoReview("manual");
    const { loadSettings } = await import("./settings.server");
    const settings = await loadSettings();
    if (settings.searchConsole.notifyTelegram) {
      const { sendTelegramToAdmins } = await import("./telegram.server");
      await sendTelegramToAdmins(formatReviewForTelegram(result));
    }
    return result;
  },
);

/** تأیید یا رد یک پیشنهاد */
export const decideSeoProposal = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().min(1), approve: z.boolean() }).parse(input),
  )
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string; status: string }> => {
    const { requireAdmin } = await import("./auth.server");
    await requireAdmin();
    const { decideProposal } = await import("./seoproposals.server");
    return await decideProposal(data.id, data.approve);
  });

/** تأیید همه پیشنهادهای در انتظار */
export const approveAllSeoProposals = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ applied: number; failed: number }> => {
    const { requireAdmin } = await import("./auth.server");
    await requireAdmin();
    const { listProposals, decideProposal } = await import("./seoproposals.server");
    const pending = await listProposals("pending");
    let applied = 0;
    let failed = 0;
    for (const p of pending) {
      const r = await decideProposal(p.id, true);
      if (r.ok) applied++;
      else failed++;
    }
    return { applied, failed };
  },
);
