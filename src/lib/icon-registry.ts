// نگاشت نام آیکون (ذخیره‌شده در دیتابیس به‌صورت رشته) به کامپوننت Lucide —
// برای اینکه آیتم‌های محصولات/راه‌کارها از پنل مدیریت قابل انتخاب آیکون باشند
// بدون اینکه کل مجموعه Lucide (هزاران آیکون) به باندل اضافه شود.
import type { LucideIcon } from "lucide-react";
import {
  MessageSquare,
  Video,
  Sparkles,
  Users,
  Megaphone,
  Share2,
  Palette,
  BarChart3,
  Webhook,
  ShoppingCart,
  Briefcase,
  Rocket,
  GraduationCap,
  HeartPulse,
  Building2,
  Zap,
  Shield,
  Globe,
  Bell,
  Calendar,
  Mail,
  Phone,
  FileText,
  Layers,
  Settings,
  Star,
  TrendingUp,
  Clock,
  Lock,
  Headphones,
  Smartphone,
  CreditCard,
  Gift,
  Target,
  Bot,
  Database,
  Cloud,
  BadgeCheck,
} from "lucide-react";

export const ICON_REGISTRY = {
  MessageSquare,
  Video,
  Sparkles,
  Users,
  Megaphone,
  Share2,
  Palette,
  BarChart3,
  Webhook,
  ShoppingCart,
  Briefcase,
  Rocket,
  GraduationCap,
  HeartPulse,
  Building2,
  Zap,
  Shield,
  Globe,
  Bell,
  Calendar,
  Mail,
  Phone,
  FileText,
  Layers,
  Settings,
  Star,
  TrendingUp,
  Clock,
  Lock,
  Headphones,
  Smartphone,
  CreditCard,
  Gift,
  Target,
  Bot,
  Database,
  Cloud,
  BadgeCheck,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICON_REGISTRY;

export const ICON_NAMES = Object.keys(ICON_REGISTRY) as IconName[];

const FALLBACK_ICON: LucideIcon = Sparkles;

export function getIcon(name: string | null | undefined): LucideIcon {
  if (name && name in ICON_REGISTRY) return ICON_REGISTRY[name as IconName];
  return FALLBACK_ICON;
}
