// قاب دستگاه‌ها و پیش‌نمایش صفحات واقعی اپ‌های نیتیو وب‌یار (iOS / Android / Windows)
// محتوای هر صفحه بر اساس صفحات واقعی اپ‌ها ساخته شده: صندوق گفتگو، چت، تماس، مخاطبین، ایمیل.
import type { ReactNode } from "react";
import {
  Bot,
  Camera,
  ChevronRight,
  Inbox,
  Mail,
  Mic,
  MicOff,
  Paperclip,
  Phone,
  PhoneOff,
  Search,
  Send,
  Settings,
  Smile,
  Tag,
  Users,
  Video,
  MessageCircle,
  Globe,
  MapPin,
  Monitor,
} from "lucide-react";
import type { AppPlatform } from "@/lib/apps.functions";

/* ───────── قاب‌ها ───────── */

export function PhoneFrame({
  children,
  variant = "ios",
  className,
}: {
  children: ReactNode;
  variant?: "ios" | "android";
  className?: string | undefined;
}) {
  return (
    <div
      className={`relative aspect-[9/19.5] w-[260px] shrink-0 rounded-[44px] border border-border bg-background p-[9px] shadow-[0_40px_80px_-30px_oklch(0_0_0/0.8)] ring-1 ring-foreground/10 ${className ?? ""}`}
    >
      <div className="relative h-full w-full overflow-hidden rounded-[36px] bg-card">
        {variant === "ios" ? (
          <div className="absolute top-2 left-1/2 z-20 h-[22px] w-[78px] -translate-x-1/2 rounded-full bg-background" />
        ) : (
          <div className="absolute top-2.5 left-1/2 z-20 h-[10px] w-[10px] -translate-x-1/2 rounded-full bg-background" />
        )}
        <StatusBar />
        <div className="absolute inset-x-0 top-[34px] bottom-0">{children}</div>
        {variant === "ios" && (
          <div className="absolute bottom-1.5 left-1/2 z-20 h-1 w-24 -translate-x-1/2 rounded-full bg-foreground/60" />
        )}
      </div>
    </div>
  );
}

function StatusBar() {
  return (
    <div dir="ltr" className="absolute inset-x-0 top-0 z-10 flex h-[34px] items-center justify-between px-6 text-[10px] font-bold text-foreground">
      <span>9:41</span>
      <span className="flex items-center gap-1">
        <span className="flex items-end gap-[1.5px]">
          {[4, 6, 8, 10].map((h) => (
            <span key={h} className="w-[2.5px] rounded-sm bg-foreground" style={{ height: h }} />
          ))}
        </span>
        <span className="ms-1 h-[9px] w-[18px] rounded-[3px] border border-foreground/70 p-[1px]">
          <span className="block h-full w-3/4 rounded-[1px] bg-foreground" />
        </span>
      </span>
    </div>
  );
}

export function DesktopFrame({ children, className }: { children: ReactNode; className?: string | undefined }) {
  return (
    <div className={`w-full overflow-hidden rounded-2xl border border-border bg-card shadow-[0_40px_90px_-30px_oklch(0_0_0/0.8)] ${className ?? ""}`}>
      <div dir="ltr" className="flex h-8 items-center justify-between border-b border-border bg-secondary/60 px-3">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <img src="/apps/windows.png" alt="" className="h-4 w-4 rounded" /> Webyar
        </div>
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
          <span>—</span>
          <span>▢</span>
          <span>✕</span>
        </div>
      </div>
      <div className="aspect-[16/10]">{children}</div>
    </div>
  );
}

/* ───────── اجزای مشترک ───────── */

const CHATS = [
  { name: "سارا محمدی", msg: "سفارشم کی ارسال می‌شه؟", time: "الان", ch: "web", unread: 2 },
  { name: "علی رضایی", msg: "پیام صوتی (۰:۱۴)", time: "۲ دقیقه", ch: "telegram", unread: 1 },
  { name: "مریم کریمی", msg: "ممنون از راهنمایی‌تون", time: "۵ دقیقه", ch: "instagram", unread: 0 },
  { name: "رضا احمدی", msg: "امکان تماس تصویری هست؟", time: "۱۲ دقیقه", ch: "whatsapp", unread: 0 },
  { name: "نگار حسینی", msg: "فاکتور رو ایمیل کردم", time: "۱ ساعت", ch: "email", unread: 0 },
  { name: "امید نوری", msg: "ایجنت هوشمند پاسخ داد", time: "۲ ساعت", ch: "web", unread: 0 },
];

const CH_COLOR: Record<string, string> = {
  web: "bg-primary",
  telegram: "bg-info",
  instagram: "bg-accent",
  whatsapp: "bg-success",
  email: "bg-warning",
};

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const hues = ["from-primary to-info", "from-accent to-primary", "from-warning to-destructive", "from-success to-primary"];
  const idx = name.charCodeAt(0) % hues.length;
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${hues[idx]} font-bold text-background`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {name.charAt(0)}
    </span>
  );
}

function ChatRow({ c, compact }: { c: (typeof CHATS)[number]; compact?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 ${compact ? "px-3 py-2" : "px-4 py-2.5"}`}>
      <div className="relative">
        <Avatar name={c.name} size={compact ? 32 : 38} />
        <span className={`absolute -bottom-0.5 -end-0.5 h-3 w-3 rounded-full border-2 border-card ${CH_COLOR[c.ch]}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[12px] font-bold text-foreground">{c.name}</span>
          <span className="shrink-0 text-[9px] text-muted-foreground">{c.time}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[10.5px] text-muted-foreground">{c.msg}</span>
          {c.unread > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
              {c.unread.toLocaleString("fa-IR")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function Bubble({ me, children, time }: { me?: boolean; children: ReactNode; time?: string }) {
  return (
    <div className={`flex ${me ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[78%] rounded-2xl px-3 py-2 text-[11px] leading-5 ${
          me ? "rounded-ss-md bg-primary text-primary-foreground" : "rounded-se-md bg-secondary text-foreground"
        }`}
      >
        {children}
        {time && <div className={`mt-0.5 text-[8.5px] ${me ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{time}</div>}
      </div>
    </div>
  );
}

function ChatThread({ compact }: { compact?: boolean }) {
  return (
    <div className={`flex flex-col gap-2 ${compact ? "p-3" : "p-3.5"}`}>
      <div className="mx-auto rounded-full bg-secondary px-2.5 py-0.5 text-[9px] text-muted-foreground">امروز</div>
      <Bubble time="۱۰:۲۱">سلام، سفارشم کی ارسال می‌شه؟ کد پیگیری ۴۸۲۱</Bubble>
      <div className="flex justify-center">
        <span className="flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[9px] text-accent">
          <Bot className="h-3 w-3" /> ایجنت هوشمند وضعیت را بررسی کرد
        </span>
      </div>
      <Bubble me time="۱۰:۲۲">سلام سارا جان سفارش شما امروز بسته‌بندی شد و فردا تحویل پست می‌شه.</Bubble>
      <Bubble time="۱۰:۲۳">
        <span className="flex items-center gap-2">
          <Mic className="h-3.5 w-3.5" />
          <span className="flex items-end gap-[2px]">
            {[6, 10, 7, 12, 5, 9, 13, 6, 8, 11, 5, 7].map((h, i) => (
              <span key={i} className="w-[2px] rounded bg-foreground/60" style={{ height: h }} />
            ))}
          </span>
          ۰:۰۸
        </span>
      </Bubble>
      <Bubble me time="۱۰:۲۴">اگر مایل باشید با تماس تصویری محصول رو نشونتون می‌دم</Bubble>
    </div>
  );
}

function Composer() {
  return (
    <div className="flex items-center gap-1.5 border-t border-border bg-card px-2.5 py-2">
      <Paperclip className="h-4 w-4 text-muted-foreground" />
      <Smile className="h-4 w-4 text-muted-foreground" />
      <div className="flex-1 rounded-full bg-secondary px-3 py-1.5 text-[10px] text-muted-foreground">پیام… ( / پاسخ آماده)</div>
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary">
        <Send className="h-3.5 w-3.5 text-primary-foreground" />
      </span>
    </div>
  );
}

/* ───────── صفحات موبایل ───────── */

function MobileHeader({ title, android }: { title: string; android?: boolean | undefined }) {
  return (
    <div className="px-4 pt-2 pb-2">
      <div className={`font-extrabold text-foreground ${android ? "text-[17px]" : "text-[22px]"}`}>{title}</div>
      <div className="mt-2 flex items-center gap-2 rounded-xl bg-secondary px-3 py-1.5 text-[10px] text-muted-foreground">
        <Search className="h-3.5 w-3.5" /> جستجو در گفتگوها
      </div>
    </div>
  );
}

function TabBar({ active, android }: { active: number; android?: boolean | undefined }) {
  const tabs = [
    { Icon: Inbox, label: "صندوق" },
    { Icon: Mail, label: "ایمیل" },
    { Icon: Users, label: "مخاطبین" },
    { Icon: MessageCircle, label: "تیم" },
    { Icon: Settings, label: "تنظیمات" },
  ];
  return (
    <div className={`absolute inset-x-0 bottom-0 flex justify-around border-t border-border bg-card/95 pt-1.5 ${android ? "pb-2" : "pb-5"}`}>
      {tabs.map((t, i) => (
        <div key={t.label} className={`flex flex-col items-center gap-0.5 ${i === active ? "text-primary" : "text-muted-foreground"}`}>
          <span className={android && i === active ? "rounded-full bg-primary/15 px-3 py-0.5" : ""}>
            <t.Icon className="h-4 w-4" />
          </span>
          <span className="text-[8.5px]">{t.label}</span>
        </div>
      ))}
    </div>
  );
}

export function InboxScreen({ android }: { android?: boolean | undefined }) {
  return (
    <div className="relative h-full" dir="rtl">
      <MobileHeader title="صندوق گفتگو" android={android} />
      <div className="flex gap-1.5 px-4 pb-2">
        {["همه", "در انتظار", "من", "هوش مصنوعی"].map((f, i) => (
          <span key={f} className={`rounded-full px-2.5 py-1 text-[9.5px] ${i === 1 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
            {f}
          </span>
        ))}
      </div>
      <div className="divide-y divide-border">
        {CHATS.map((c) => (
          <ChatRow key={c.name} c={c} />
        ))}
      </div>
      <TabBar active={0} android={android} />
    </div>
  );
}

export function ChatScreen(_props: { android?: boolean | undefined } = {}) {
  return (
    <div className="flex h-full flex-col" dir="rtl">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <ChevronRight className="h-4 w-4 text-primary" />
        <Avatar name="سارا محمدی" size={30} />
        <div className="min-w-0 flex-1">
          <div className="text-[11.5px] font-bold text-foreground">سارا محمدی</div>
          <div className="flex items-center gap-1 text-[9px] text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" /> در حال مشاهده صفحه محصول
          </div>
        </div>
        <Phone className="h-4 w-4 text-primary" />
        <Video className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 overflow-hidden">
        <ChatThread />
      </div>
      <Composer />
      <div className="h-4 bg-card" />
    </div>
  );
}

export function CallScreen(_props: { android?: boolean | undefined } = {}) {
  return (
    <div className="relative h-full overflow-hidden bg-gradient-to-b from-secondary to-background" dir="rtl">
      <img src="/videos/video-call-poster.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background/80" />
      <div className="relative flex flex-col items-center pt-6 text-center">
        <div className="text-[14px] font-bold text-foreground">سارا محمدی</div>
        <div className="text-[10px] text-foreground/80">تماس تصویری · ۰۲:۱۴</div>
      </div>
      <div className="absolute top-20 end-3 h-24 w-16 overflow-hidden rounded-xl border-2 border-foreground/30 bg-secondary">
        <div className="flex h-full items-center justify-center">
          <Avatar name="اپراتور" size={30} />
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-8 flex justify-center gap-3">
        {[MicOff, Camera, Video].map((I, i) => (
          <span key={i} className="glass flex h-11 w-11 items-center justify-center rounded-full">
            <I className="h-4.5 w-4.5 text-foreground" />
          </span>
        ))}
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive">
          <PhoneOff className="h-5 w-5 text-destructive-foreground" />
        </span>
      </div>
    </div>
  );
}

export function ContactScreen(_props: { android?: boolean | undefined } = {}) {
  return (
    <div className="h-full" dir="rtl">
      <div className="flex flex-col items-center gap-1.5 border-b border-border px-4 pt-4 pb-3">
        <Avatar name="رضا احمدی" size={56} />
        <div className="text-[13px] font-bold text-foreground">رضا احمدی</div>
        <div className="flex items-center gap-1 text-[9.5px] text-success">
          <span className="h-1.5 w-1.5 rounded-full bg-success" /> آنلاین روی سایت
        </div>
        <div className="mt-1 flex gap-2">
          {[MessageCircle, Phone, Video, Mail].map((I, i) => (
            <span key={i} className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15">
              <I className="h-3.5 w-3.5 text-primary" />
            </span>
          ))}
        </div>
      </div>
      <div className="space-y-2 p-3 text-[10.5px]">
        {[
          { I: MapPin, k: "موقعیت", v: "تهران، ایران" },
          { I: Monitor, k: "دستگاه", v: "iPhone · Safari" },
          { I: Globe, k: "صفحه فعلی", v: "/products/video-call" },
          { I: Tag, k: "برچسب‌ها", v: "مشتری ویژه · پیگیری" },
        ].map((r) => (
          <div key={r.k} className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2">
            <r.I className="h-3.5 w-3.5 text-primary" />
            <span className="text-muted-foreground">{r.k}</span>
            <span className="ms-auto truncate font-medium text-foreground">{r.v}</span>
          </div>
        ))}
        <div className="rounded-xl border border-dashed border-warning/50 bg-warning/10 px-3 py-2 text-warning">
          یادداشت داخلی: پیش‌فاکتور نسخه سازمانی ارسال شود.
        </div>
      </div>
    </div>
  );
}

export function EmailScreen({ android }: { android?: boolean | undefined }) {
  const mails = [
    { n: "نگار حسینی", s: "فاکتور سفارش ۱۲۸۴", p: "سلام، فاکتور رو پیوست کردم…" },
    { n: "شرکت آریا", s: "درخواست همکاری", p: "برای نسخه سازمانی تماس بگیرید" },
    { n: "حمید صادقی", s: "مشکل ورود", p: "رمز عبورم رو فراموش کردم…" },
    { n: "لیلا مرادی", s: "تشکر", p: "پشتیبانی عالی بود ممنون" },
  ];
  return (
    <div className="relative h-full" dir="rtl">
      <MobileHeader title="ایمیل" android={android} />
      <div className="divide-y divide-border">
        {mails.map((m) => (
          <div key={m.n} className="flex gap-2.5 px-4 py-2.5">
            <Avatar name={m.n} size={34} />
            <div className="min-w-0">
              <div className="text-[11.5px] font-bold text-foreground">{m.n}</div>
              <div className="truncate text-[10.5px] text-foreground/90">{m.s}</div>
              <div className="truncate text-[9.5px] text-muted-foreground">{m.p}</div>
            </div>
          </div>
        ))}
      </div>
      <TabBar active={1} android={android} />
    </div>
  );
}

export const MOBILE_SCREENS = [
  { key: "inbox", title: "صندوق گفتگوی یکپارچه", C: InboxScreen },
  { key: "chat", title: "چت با پیوست و پیام صوتی", C: ChatScreen },
  { key: "call", title: "تماس تصویری", C: CallScreen },
  { key: "contact", title: "پرونده کامل بازدیدکننده", C: ContactScreen },
  { key: "email", title: "صندوق ایمیل", C: EmailScreen },
] as const;

/* ───────── صفحه ویندوز (سه‌ستونه) ───────── */

export function WindowsScreen() {
  return (
    <div className="flex h-full text-foreground" dir="rtl">
      <div className="flex w-12 flex-col items-center gap-3 border-e border-border bg-secondary/40 py-3">
        {[Inbox, Mail, Phone, Users, MessageCircle, Settings].map((I, i) => (
          <span key={i} className={`flex h-8 w-8 items-center justify-center rounded-lg ${i === 0 ? "bg-primary/20 text-primary" : "text-muted-foreground"}`}>
            <I className="h-4 w-4" />
          </span>
        ))}
      </div>
      <div className="w-[30%] border-e border-border">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-[10px] text-muted-foreground">
          <Search className="h-3.5 w-3.5" /> جستجو… <span dir="ltr" className="ms-auto rounded border border-border px-1">Ctrl K</span>
        </div>
        <div className="divide-y divide-border">
          {CHATS.slice(0, 6).map((c) => (
            <ChatRow key={c.name} c={c} compact />
          ))}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Avatar name="سارا محمدی" size={26} />
          <span className="text-[11px] font-bold">سارا محمدی</span>
          <span className="rounded-full bg-success/15 px-2 text-[9px] text-success">باز</span>
          <span className="ms-auto flex gap-2 text-primary">
            <Phone className="h-3.5 w-3.5" />
            <Video className="h-3.5 w-3.5" />
          </span>
        </div>
        <div className="flex-1 overflow-hidden">
          <ChatThread compact />
        </div>
        <Composer />
      </div>
      <div className="hidden w-[24%] border-s border-border p-3 text-[10px] sm:block">
        <div className="flex flex-col items-center gap-1 pb-3">
          <Avatar name="سارا محمدی" size={40} />
          <span className="font-bold">سارا محمدی</span>
          <span className="text-muted-foreground">تهران · Chrome</span>
        </div>
        {["وضعیت: باز", "اولویت: بالا", "اپراتور: شما", "برچسب: سفارش"].map((r) => (
          <div key={r} className="mb-1.5 rounded-lg bg-secondary px-2 py-1.5 text-muted-foreground">{r}</div>
        ))}
      </div>
    </div>
  );
}

/** پیش‌نمایش اصلی یک پلتفرم (برای کارت‌ها و لندینگ) */
export function PlatformPreview({ platform, className }: { platform: AppPlatform; className?: string | undefined }) {
  if (platform === "windows") {
    return (
      <DesktopFrame className={className}>
        <WindowsScreen />
      </DesktopFrame>
    );
  }
  return (
    <PhoneFrame variant={platform} className={className}>
      {platform === "ios" ? <InboxScreen /> : <ChatScreen />}
    </PhoneFrame>
  );
}
