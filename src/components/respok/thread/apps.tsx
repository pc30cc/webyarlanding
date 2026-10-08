/**
 * Apps in the Thread template: the brand app icon (Ink tile with the Thread symbol,
 * as on the brand book's app icon page), template-made store badges and app cards.
 * The admin's icon upload belongs to the Persian brand, so the English site always
 * draws the Respok icon.
 */
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { AppDto, AppPlatform } from "@/lib/apps.functions";
import { AndroidIcon, AppleIcon, GooglePlayIcon, WindowsIcon } from "@/components/site/brand-icons";
import { RespokLogo } from "../RespokLogo";
import { PLATFORM_EN, downloadHref } from "../shared/apps";
import { useRespok } from "../shared/context";
import { SHAPE, cx } from "./classes";
import { useEnglishText } from "./labels";

/** Platform logo (the operating system). */
export function PlatformGlyph({
  platform,
  className,
}: {
  platform: AppPlatform;
  className?: string | undefined;
}) {
  if (platform === "android") return <AndroidIcon className={className} />;
  if (platform === "windows") return <WindowsIcon className={className} />;
  return <AppleIcon className={className} />;
}

/** Store logo (where the app is downloaded). */
function StoreGlyph({
  platform,
  className,
}: {
  platform: AppPlatform;
  className?: string | undefined;
}) {
  if (platform === "android") return <GooglePlayIcon className={className} />;
  return <PlatformGlyph platform={platform} className={className} />;
}

/** The Respok app icon: Ink tile, the symbol at 56%, an optional platform badge. */
export function AppIcon({
  size = 56,
  platform,
  className,
}: {
  size?: number;
  platform?: AppPlatform;
  className?: string;
}) {
  const glyph = Math.round(size * 0.56);
  const badge = Math.max(22, Math.round(size * 0.4));
  return (
    <span
      aria-hidden="true"
      className={cx("relative inline-flex shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <span
        className="absolute inset-0 grid place-items-center bg-rpk-ink shadow-[0_10px_24px_-12px_rgb(22_20_43/0.6)]"
        style={{ borderRadius: Math.round(size * 0.225) }}
      >
        <RespokLogo
          concept="thread"
          variant="symbol"
          colorway="reversed"
          height={Math.round((glyph * 92) / 104)}
          title=""
        />
      </span>
      {platform && (
        <span
          className="absolute grid place-items-center rounded-full bg-white text-rpk-ink shadow-[0_2px_8px_rgb(22_20_43/0.18)] ring-2 ring-white"
          style={{ width: badge, height: badge, right: -badge * 0.28, bottom: -badge * 0.28 }}
        >
          <PlatformGlyph platform={platform} className="size-[52%]" />
        </span>
      )}
    </span>
  );
}

/**
 * Store badge. Released apps link to /go/{slug} (counted, nofollow); unreleased
 * platforms get a quiet outline badge that is not a link.
 */
export function StoreBadge({
  app,
  tone = "ink",
  className,
}: {
  app: Pick<AppDto, "slug" | "downloadUrl" | "platform">;
  /** "white" on Ink backgrounds. */
  tone?: "ink" | "white";
  className?: string;
}) {
  const meta = PLATFORM_EN[app.platform];
  const href = downloadHref(app);
  const body = (top: string, glyphClass: string) => (
    <>
      <StoreGlyph platform={app.platform} className={cx("size-6 shrink-0", glyphClass)} />
      <span className="flex flex-col items-start text-left">
        <span className="text-[11px] leading-none font-medium tracking-[0.01em] opacity-75">
          {top}
        </span>
        <span className="mt-1 text-[17px] leading-none font-bold tracking-[-0.01em]">
          {meta.store}
        </span>
      </span>
    </>
  );
  const base = cx(
    "inline-flex h-14 min-w-[188px] shrink-0 items-center gap-3 pr-6 pl-4",
    "rounded-[18px] rounded-es-[6px]",
    className,
  );
  if (href)
    return (
      <a
        href={href}
        rel="nofollow"
        className={cx(
          base,
          "transition-[transform,box-shadow] duration-200 ease-rpk-spring hover:-translate-y-px active:scale-[.97]",
          tone === "ink"
            ? "bg-rpk-ink text-white hover:shadow-[0_12px_24px_-12px_rgb(22_20_43/0.7)]"
            : "bg-white text-rpk-ink",
        )}
      >
        {body(meta.action, "")}
      </a>
    );
  return (
    <span
      className={cx(
        base,
        "border-[1.5px] border-dashed",
        tone === "ink" ? "border-rpk-away text-rpk-slate" : "border-white/30 text-white/70",
      )}
    >
      {body(meta.soon, "opacity-60")}
    </span>
  );
}

/** App card → /download/$slug (the whole card is the link; the store badge stays separate). */
export function AppCard({
  app,
  headingLevel = "h3",
  detailsLabel,
  store = false,
  compact = false,
}: {
  app: AppDto;
  headingLevel?: "h2" | "h3";
  detailsLabel: string;
  /** Show the store badge under the card body. */
  store?: boolean;
  compact?: boolean;
}) {
  const { brand } = useRespok();
  const en = useEnglishText();
  const meta = PLATFORM_EN[app.platform];
  const name = en(app.name, `${brand} for ${meta.label}`);
  const subtitle = en(app.subtitle);
  const Heading = headingLevel;
  return (
    <article
      className={cx(
        "group/app relative flex h-full flex-col bg-white shadow-rpk-card transition-[transform,box-shadow] duration-300 ease-rpk-spring hover:-translate-y-1 hover:shadow-[0_1px_2px_rgb(22_20_43/0.06),0_28px_50px_-28px_rgb(22_20_43/0.4)]",
        SHAPE.answerCard,
        compact ? "p-5" : "p-6 sm:p-7",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <AppIcon size={compact ? 48 : 60} platform={app.platform} />
        <span className="inline-flex h-7 items-center rounded-full bg-rpk-paper px-3 font-rpk-mono text-[12px] tracking-[0.04em] text-rpk-slate uppercase ring-1 ring-rpk-mist ring-inset">
          {meta.label}
        </span>
      </div>
      <Heading
        className={cx(
          "font-bold tracking-[-0.01em] text-balance text-rpk-ink",
          compact ? "mt-5 text-[18px] leading-[1.25]" : "mt-6 text-[20px] leading-[1.25]",
        )}
      >
        <Link
          to="/download/$slug"
          params={{ slug: app.slug }}
          className="rounded-md after:absolute after:inset-0 after:content-['']"
        >
          {name}
        </Link>
      </Heading>
      {subtitle && (
        <p className="mt-2 text-[15px] leading-[1.55] text-pretty text-rpk-slate">{subtitle}</p>
      )}
      <div className="mt-auto flex items-center justify-between gap-3 pt-6">
        {app.version ? (
          <span className="font-rpk-mono text-[12px] tracking-[0.04em] text-rpk-slate">
            v{app.version.replace(/^v/i, "")}
          </span>
        ) : (
          <span />
        )}
        <span className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-rpk-ink">
          {detailsLabel}
          <ArrowRight
            aria-hidden="true"
            strokeWidth={2.4}
            className="size-4 transition-transform duration-200 ease-rpk-spring group-hover/app:translate-x-0.5"
          />
        </span>
      </div>
      {store && (
        <div className="relative z-10 mt-5 border-t border-rpk-mist pt-5">
          <StoreBadge app={app} className="w-full justify-center" />
        </div>
      )}
    </article>
  );
}
