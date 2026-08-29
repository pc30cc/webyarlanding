import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface AdminDashboardDto {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  categories: number;
  tags: number;
  media: number;
  messages: number;
  unreadMessages: number;
  recentLogins: { id: string; email: string; success: boolean; createdAt: string; ipAddress: string | null }[];
}

export const getAdminDashboard = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminDashboardDto> => {
    const { requireAdmin } = await import("./auth.server");
    const { db, toBool } = await import("./db.server");
    await requireAdmin();

    const [posts, categories, tags, media, messages, logins] = await Promise.all([
      db.from("blog_posts").select("id, status", { count: "exact" }),
      db.from("blog_categories").select("id", { count: "exact" }),
      db.from("blog_tags").select("id", { count: "exact" }),
      db.from("media_assets").select("id", { count: "exact" }),
      db.from("contact_messages").select("id, status", { count: "exact" }),
      db.from("login_attempts").select("id, email, success, created_at, ip_address").order("created_at", { ascending: false }).limit(8),
    ]);

    const postsRows = (posts.data ?? []) as { id: string; status: string }[];
    const messagesRows = (messages.data ?? []) as { id: string; status: string }[];

    return {
      totalPosts: postsRows.length,
      publishedPosts: postsRows.filter((p) => p.status === "published").length,
      draftPosts: postsRows.filter((p) => p.status !== "published").length,
      categories: categories.data?.length ?? 0,
      tags: tags.data?.length ?? 0,
      media: media.data?.length ?? 0,
      messages: messagesRows.length,
      unreadMessages: messagesRows.filter((m) => m.status !== "read").length,
      recentLogins: (logins.data ?? []).map((row) => ({
        id: row.id,
        email: row.email,
        success: toBool(row.success),
        createdAt: row.created_at,
        ipAddress: row.ip_address,
      })),
    };
  },
);

export interface LoginAttemptDto {
  id: string;
  email: string;
  success: boolean;
  reason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export const listLoginAttempts = createServerFn({ method: "GET" }).handler(
  async (): Promise<LoginAttemptDto[]> => {
    const { requireAdmin } = await import("./auth.server");
    const { db, toBool } = await import("./db.server");
    await requireAdmin();
    const { data } = await db
      .from("login_attempts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    return (data ?? []).map((row) => ({
      id: row.id,
      email: row.email,
      success: toBool(row.success),
      reason: row.reason,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      createdAt: row.created_at,
    }));
  },
);

export interface ContactMessageDto {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  subject: string | null;
  message: string;
  status: string;
  ipAddress: string | null;
  createdAt: string;
}

export const listContactMessages = createServerFn({ method: "GET" }).handler(
  async (): Promise<ContactMessageDto[]> => {
    const { requireAdmin } = await import("./auth.server");
    const { db } = await import("./db.server");
    await requireAdmin();
    const { data } = await db.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(300);
    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      subject: row.subject,
      message: row.message,
      status: row.status,
      ipAddress: row.ip_address,
      createdAt: row.created_at,
    }));
  },
);

export const markMessageRead = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string(), status: z.string().default("read") }).parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const { requireAdmin } = await import("./auth.server");
    const { db } = await import("./db.server");
    await requireAdmin();
    await db.from("contact_messages").update({ status: data.status }).eq("id", data.id);
    return { ok: true };
  });

export const deleteMessage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const { requireAdmin } = await import("./auth.server");
    const { db } = await import("./db.server");
    await requireAdmin();
    await db.from("contact_messages").delete().eq("id", data.id);
    return { ok: true };
  });
