import type { SiteSettings } from "@/lib/settings";
import { ScriptWidget } from "./ScriptWidget";

/** ویجت مرکز تماس — تزریق کد نصب تنظیم‌شده در پنل مدیریت، فقط سمت کلاینت. */
export function CallCenterWidget({ settings }: { settings: SiteSettings }) {
  return <ScriptWidget config={settings.callCenterWidget} />;
}
