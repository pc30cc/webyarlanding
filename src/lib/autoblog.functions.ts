import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getAutoblogSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdmin } = await import("./auth.server");
  const { getSettings } = await import("./autoblog.server");
  await requireAdmin();
  return await getSettings();
});

const saveSchema = z.object({
  enabled: z.boolean(),
  runHours: z.array(z.number().int().min(0).max(23)),
  withImage: z.boolean(),
  masterPrompt: z.string(),
  topicPool: z.array(z.string()),
  categoryId: z.string().nullable(),
  author: z.string(),
  publishStatus: z.enum(["published", "draft"]),
});

export const saveAutoblogSettings = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => saveSchema.parse(input))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./auth.server");
    const { saveSettings } = await import("./autoblog.server");
    await requireAdmin();
    return await saveSettings(data);
  });

export const runAutoblogNow = createServerFn({ method: "POST" }).handler(async () => {
  const { requireAdmin } = await import("./auth.server");
  const { runAutoblog } = await import("./autoblog.server");
  await requireAdmin();
  return await runAutoblog("manual", { ignoreHourCheck: true });
});

export const listAutoblogRuns = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdmin } = await import("./auth.server");
  const { listRuns } = await import("./autoblog.server");
  await requireAdmin();
  return await listRuns(30);
});
