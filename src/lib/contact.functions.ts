import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2, "نام باید حداقل ۲ کاراکتر باشد"),
  email: z.string().email("ایمیل معتبر نیست"),
  phone: z.string().optional().default(""),
  subject: z.string().min(2, "موضوع الزامی است"),
  message: z.string().min(5, "پیام باید حداقل ۵ کاراکتر باشد"),
});

export type ContactInput = z.infer<typeof contactSchema>;

/** ثبت پیام تماس با ما (عمومی) */
export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => contactSchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const { db, newId, nowIso } = await import("./db.server");
    await db.from("contact_messages").insert({
      id: newId(),
      name: data.name,
      email: data.email,
      phone: data.phone ?? "",
      subject: data.subject,
      message: data.message,
      created_at: nowIso(),
    });
    return { ok: true };
  });
