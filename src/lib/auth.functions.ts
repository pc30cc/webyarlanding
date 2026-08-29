import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("ایمیل معتبر نیست"),
  password: z.string().min(6, "رمز عبور حداقل ۶ کاراکتر است"),
});

export interface SessionUserDto {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

/** ورود مدیر — بررسی رمز هش‌شده در جدول users */
export const loginAdmin = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => loginSchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string; user?: SessionUserDto }> => {
    const { db, toBool } = await import("./db.server");
    const auth = await import("./auth.server");

    const email = data.email.trim().toLowerCase();
    const { data: user } = await db
      .from("users")
      .select("id, email, display_name, role, is_active, password_hash")
      .eq("email", email)
      .maybeSingle();

    if (!user || !toBool(user.is_active)) {
      await auth.logLoginAttempt(email, false, "کاربر یافت نشد یا غیرفعال است");
      return { ok: false, error: "ایمیل یا رمز عبور نادرست است" };
    }

    const valid = await auth.verifyPassword(data.password, user.password_hash);
    if (!valid) {
      await auth.logLoginAttempt(email, false, "رمز عبور نادرست");
      return { ok: false, error: "ایمیل یا رمز عبور نادرست است" };
    }

    await auth.startSession(user.id);
    await auth.touchLastLogin(user.id);
    await auth.logLoginAttempt(email, true);

    return {
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name ?? user.email,
        role: user.role,
      },
    };
  });

export const logoutAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { endSession } = await import("./auth.server");
  await endSession();
  return { ok: true };
});

/** کاربر واردشده جاری (یا null) */
export const getSessionUser = createServerFn({ method: "GET" }).handler(
  async (): Promise<SessionUserDto | null> => {
    const { getCurrentUser } = await import("./auth.server");
    return await getCurrentUser();
  },
);

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "رمز جدید حداقل ۸ کاراکتر باشد"),
});

export const changeAdminPassword = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => changePasswordSchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    const { db } = await import("./db.server");
    const auth = await import("./auth.server");
    const user = await auth.requireAdmin();

    const { data: row } = await db.from("users").select("password_hash").eq("id", user.id).maybeSingle();
    if (!row) return { ok: false, error: "کاربر یافت نشد" };

    const valid = await auth.verifyPassword(data.currentPassword, row.password_hash);
    if (!valid) return { ok: false, error: "رمز فعلی نادرست است" };

    const hash = await auth.hashPassword(data.newPassword);
    await db.from("users").update({ password_hash: hash, updated_at: new Date().toISOString() }).eq("id", user.id);
    return { ok: true };
  });
