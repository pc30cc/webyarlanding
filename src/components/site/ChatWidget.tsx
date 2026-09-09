import type { SiteSettings } from "@/lib/settings";
import { ScriptWidget } from "./ScriptWidget";

/** ویجت چت — تزریق اسکریپت تنظیم‌شده در پنل مدیریت، فقط سمت کلاینت. */
export function ChatWidget({ settings }: { settings: SiteSettings }) {
  return <ScriptWidget config={settings.chatWidget} />;
}
