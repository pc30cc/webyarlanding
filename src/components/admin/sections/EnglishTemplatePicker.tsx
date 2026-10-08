import { Check, ExternalLink, Palette } from "lucide-react";
import { RespokLogo } from "@/components/respok/RespokLogo";
import {
  ENGLISH_TEMPLATES,
  getEnglishTemplate,
  getRespokBrandName,
  type EnglishTemplate,
  type SiteSettings,
} from "@/lib/settings";

const INFO: Record<EnglishTemplate, { title: string; description: string }> = {
  open: {
    title: "Open — حباب و نقطه",
    description:
      "طراحی ادیتوریال و تیره بر پایه لوگوی Open: هر سطح یک حباب گفتگو با یک گوشه صاف است که به نقطه مرجانی اشاره می‌کند.",
  },
  thread: {
    title: "Thread — رشته گفتگو",
    description:
      "طراحی روشن و گفتگومحور بر پایه لوگوی Thread: صفحه مثل یک گفتگو خوانده می‌شود؛ پرسش با کپسول سرمه‌ای و پاسخ با کپسول مرجانی.",
  },
};

/** Small, static preview of each template's look (no page code is loaded). */
function Preview({ template }: { template: EnglishTemplate }) {
  if (template === "open")
    return (
      <div
        dir="ltr"
        className="relative h-28 overflow-hidden rounded-lg bg-[#16142B] p-3"
      >
        <RespokLogo concept="open" colorway="reversed" height={16} />
        <div className="mt-3 h-2.5 w-3/5 rounded-full bg-white/90" />
        <div className="mt-1.5 h-2.5 w-2/5 rounded-full bg-white/90" />
        <div className="mt-3 h-4 w-16 rounded-[8px] rounded-br-[2px] bg-[#FF5A3C]" />
        <div className="absolute -right-6 bottom-[-28px] h-24 w-24 rounded-full rounded-br-[6px] bg-[#29264a]" />
        <span className="absolute bottom-2 right-2 h-2.5 w-2.5 rounded-full bg-[#FF5A3C]" />
      </div>
    );
  return (
    <div dir="ltr" className="h-28 overflow-hidden rounded-lg bg-[#F5F5F8] p-3">
      <RespokLogo concept="thread" height={16} />
      <div className="mt-3 flex flex-col gap-1.5">
        <span className="h-4 w-24 rounded-full rounded-bl-[3px] bg-[#16142B]" />
        <span className="h-4 w-32 self-end rounded-full rounded-br-[3px] bg-[#FF5A3C]" />
        <span className="h-4 w-20 rounded-full rounded-bl-[3px] bg-[#16142B]" />
      </div>
    </div>
  );
}

export function EnglishTemplatePicker({
  settings,
  pending,
  onSelect,
}: {
  settings: SiteSettings;
  pending: boolean;
  onSelect: (template: EnglishTemplate) => void;
}) {
  const active = getEnglishTemplate(settings);
  const english = settings.localization.language === "en";
  return (
    <div className="border-t border-border pt-5">
      <h3 className="flex items-center gap-2 font-semibold">
        <Palette className="h-4 w-4" /> قالب سایت انگلیسی (Respok)
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        نسخه انگلیسی سایت با برند Respok و یکی از دو قالب زیر نمایش داده
        می‌شود؛ هر دو قالب همه صفحات و محتوای سایت را دارند. با یک کلیک قالب
        عوض و ذخیره می‌شود. نام برند در متن‌ها:{" "}
        <span dir="ltr" className="font-medium text-foreground">
          {getRespokBrandName(settings)}
        </span>{" "}
        (از «نام برند (انگلیسی)» در تب برند قابل تغییر است).
        {!english &&
          " زبان فعلی سایت فارسی است؛ قالب انتخاب‌شده بعد از انتخاب انگلیسی نمایش داده می‌شود."}
      </p>
      <div
        role="radiogroup"
        aria-label="قالب سایت انگلیسی"
        className="mt-4 grid gap-3 sm:grid-cols-2"
      >
        {ENGLISH_TEMPLATES.map((template) => {
          const selected = template === active;
          return (
            <button
              key={template}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={pending}
              onClick={() => {
                if (!selected) onSelect(template);
              }}
              className={`rounded-xl border p-3 text-start transition-colors disabled:opacity-60 ${
                selected
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Preview template={template} />
              <span className="mt-3 flex items-center justify-between gap-2 text-sm font-semibold">
                {INFO[template].title}
                {selected && (
                  <span className="flex items-center gap-1 text-xs font-medium text-primary">
                    <Check className="h-3.5 w-3.5" /> فعال
                  </span>
                )}
              </span>
              <span className="mt-1 block text-xs leading-6 text-muted-foreground">
                {INFO[template].description}
              </span>
            </button>
          );
        })}
      </div>
      {english && (
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5" /> مشاهده سایت انگلیسی
        </a>
      )}
    </div>
  );
}
