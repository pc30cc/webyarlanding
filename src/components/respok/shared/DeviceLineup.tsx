/**
 * The apps on their own devices, for the home hero: a Mac laptop in the middle (a
 * Windows monitor behind it), an iPhone and an Android phone in front. Each device
 * links to its app page. The screens are drawn, not screenshots: an inbox with the
 * home page's sample conversations and an open chat.
 */
import type { CSSProperties, ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import type { AppDto, AppPlatform } from "@/lib/apps.functions";
import { PLATFORM_EN } from "./apps";

const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(" ");

type Surface = "ink" | "paper";

function Rows({ avatars, count }: { avatars: string[]; count: number }) {
  return (
    <div className="flex flex-col gap-[7%] px-[8%] pt-[6%]">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-[8%]">
          {avatars[i % Math.max(1, avatars.length)] ? (
            <img
              src={avatars[i % avatars.length]}
              alt=""
              loading="lazy"
              className="aspect-square w-[22%] shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="aspect-square w-[22%] shrink-0 rounded-full bg-rpk-haze" />
          )}
          <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
            <span className="h-[3px] w-[60%] rounded-full bg-rpk-ink/70" />
            <span className="h-[3px] w-[85%] rounded-full bg-rpk-haze" />
          </span>
          {i === 0 && <span className="size-[5px] shrink-0 rounded-full bg-rpk-signal" />}
        </div>
      ))}
    </div>
  );
}

function Chat() {
  const bubble = "h-[9%] min-h-[7px] rounded-[6px]";
  return (
    <div className="flex h-full flex-col justify-end gap-[5%] bg-rpk-paper px-[8%] pb-[8%]">
      <span className={cx(bubble, "w-[62%] rounded-bl-[2px] bg-white ring-1 ring-rpk-mist")} />
      <span className={cx(bubble, "ml-auto w-[54%] rounded-br-[2px] bg-rpk-signal")} />
      <span className={cx(bubble, "w-[70%] rounded-bl-[2px] bg-white ring-1 ring-rpk-mist")} />
      <span className={cx(bubble, "ml-auto w-[40%] rounded-br-[2px] bg-rpk-ink")} />
    </div>
  );
}

function ScreenHeader() {
  return (
    <div className="flex items-center gap-[6%] px-[8%] pt-[4%]">
      <span className="h-[3px] w-[30%] rounded-full bg-rpk-ink" />
      <span className="ml-auto size-[6px] rounded-full bg-rpk-haze" />
    </div>
  );
}

function Phone({ platform, avatars }: { platform: "ios" | "android"; avatars: string[] }) {
  const ios = platform === "ios";
  return (
    <span
      className={cx(
        "flex aspect-[9/19] w-full flex-col overflow-hidden border-[3px] border-(--rpk-frame) bg-white shadow-[0_24px_40px_-20px_rgb(22_20_43/0.6)]",
        ios ? "rounded-[18px]" : "rounded-[12px]",
      )}
    >
      <span className="flex justify-center pt-[6%]">
        {ios ? (
          <span className="h-[5px] w-[34%] rounded-full bg-rpk-ink" />
        ) : (
          <span className="size-[5px] rounded-full bg-rpk-ink" />
        )}
      </span>
      {ios ? (
        <span className="flex flex-1 flex-col">
          <ScreenHeader />
          <Rows avatars={avatars} count={Math.min(5, Math.max(3, avatars.length))} />
          <span className="mt-auto flex justify-around border-t border-rpk-mist px-[10%] py-[6%]">
            <span className="size-[6px] rounded-[2px] bg-rpk-signal" />
            <span className="size-[6px] rounded-[2px] bg-rpk-haze" />
            <span className="size-[6px] rounded-[2px] bg-rpk-haze" />
          </span>
        </span>
      ) : (
        <span className="flex flex-1 flex-col">
          <ScreenHeader />
          <span className="mt-[6%] flex-1">
            <Chat />
          </span>
          <span className="flex justify-center gap-[14%] bg-white py-[5%]">
            <span className="size-[4px] rounded-full bg-rpk-away" />
            <span className="size-[4px] rounded-full bg-rpk-away" />
            <span className="size-[4px] rounded-full bg-rpk-away" />
          </span>
        </span>
      )}
    </span>
  );
}

function DesktopScreen({ avatars, mac }: { avatars: string[]; mac: boolean }) {
  return (
    <span className="flex h-full flex-col overflow-hidden bg-white">
      <span className="flex h-[9%] min-h-[8px] items-center gap-[1.5%] border-b border-rpk-mist bg-rpk-paper px-[3%]">
        {mac ? (
          <>
            <span className="size-[4px] rounded-full bg-rpk-away" />
            <span className="size-[4px] rounded-full bg-rpk-away" />
            <span className="size-[4px] rounded-full bg-rpk-away" />
          </>
        ) : (
          <span className="ml-auto flex gap-[6px]">
            <span className="h-[1.5px] w-[5px] self-center bg-rpk-slate" />
            <span className="size-[5px] border border-rpk-slate" />
            <span className="size-[5px] rounded-full bg-rpk-signal/80" />
          </span>
        )}
      </span>
      <span className="grid flex-1 grid-cols-[2fr_3fr]">
        <span className="flex flex-col border-r border-rpk-mist">
          <ScreenHeader />
          <Rows avatars={avatars} count={Math.min(4, Math.max(3, avatars.length))} />
        </span>
        <Chat />
      </span>
    </span>
  );
}

function Laptop({ avatars }: { avatars: string[] }) {
  return (
    <span className="flex w-full flex-col items-center">
      <span className="block aspect-[16/10] w-[86%] overflow-hidden rounded-t-[10px] border-[4px] border-b-[6px] border-(--rpk-frame) bg-(--rpk-frame) shadow-[0_30px_50px_-30px_rgb(22_20_43/0.7)]">
        <DesktopScreen avatars={avatars} mac />
      </span>
      <span className="h-[7px] w-full rounded-b-[8px] bg-gradient-to-b from-rpk-haze to-rpk-away" />
    </span>
  );
}

function Monitor({ avatars }: { avatars: string[] }) {
  return (
    <span className="flex w-full flex-col items-center">
      <span className="block aspect-[16/10] w-full overflow-hidden rounded-[8px] border-[4px] border-(--rpk-frame) bg-(--rpk-frame) shadow-[0_30px_50px_-30px_rgb(22_20_43/0.7)]">
        <DesktopScreen avatars={avatars} mac={false} />
      </span>
      <span className="h-[14px] w-[10%] bg-(--rpk-frame)" />
      <span className="h-[4px] w-[30%] rounded-full bg-(--rpk-frame)" />
    </span>
  );
}

function DeviceLink({
  app,
  label,
  style,
  className,
  children,
}: {
  app: AppDto;
  label: string;
  style: CSSProperties;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      to="/download/$slug"
      params={{ slug: app.slug }}
      aria-label={label}
      title={label}
      style={style}
      className={cx(
        "absolute block rounded-[14px] transition-transform duration-300 ease-rpk-spring hover:-translate-y-1.5 focus-visible:-translate-y-1.5",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function DeviceLineup({
  apps,
  brand,
  avatars,
  surface = "paper",
  className,
}: {
  apps: AppDto[];
  brand: string;
  /** Contact photos shown in the drawn inboxes. */
  avatars: string[];
  surface?: Surface;
  className?: string;
}) {
  const find = (platform: AppPlatform) => apps.find((app) => app.platform === platform);
  const ios = find("ios");
  const android = find("android");
  const mac = find("mac");
  const windows = find("windows");
  if (!ios && !android && !mac && !windows) return null;

  const label = (app: AppDto) => `${brand} for ${PLATFORM_EN[app.platform].label}`;
  const both = !!mac && !!windows;
  const ink = surface === "ink";
  const ordered = [ios, android, mac, windows].filter((app): app is AppDto => !!app);

  return (
    <div className={className}>
      <div
        className="relative mx-auto aspect-[16/10] w-full max-w-[560px]"
        // Device frames: Ink on light pages, a lifted Ink on the Ink hero so they stay visible.
        style={{ "--rpk-frame": ink ? "#4a4775" : "#16142b" } as CSSProperties}
      >
        {windows && (
          <DeviceLink
            app={windows}
            label={label(windows)}
            className="z-0"
            style={
              both
                ? { left: "8%", top: "0%", width: "54%" }
                : { left: "18%", top: "6%", width: "64%" }
            }
          >
            <Monitor avatars={avatars} />
          </DeviceLink>
        )}
        {mac && (
          <DeviceLink
            app={mac}
            label={label(mac)}
            className="z-10"
            style={
              both
                ? { left: "34%", top: "26%", width: "56%" }
                : { left: "16%", top: "12%", width: "68%" }
            }
          >
            <Laptop avatars={avatars} />
          </DeviceLink>
        )}
        {ios && (
          <DeviceLink
            app={ios}
            label={label(ios)}
            className="z-20 -rotate-[4deg]"
            style={{ left: "0%", bottom: "0%", width: "19%" }}
          >
            <Phone platform="ios" avatars={avatars} />
          </DeviceLink>
        )}
        {android && (
          <DeviceLink
            app={android}
            label={label(android)}
            className="z-20 rotate-[4deg]"
            style={{ right: "0%", bottom: "0%", width: "19%" }}
          >
            <Phone platform="android" avatars={avatars} />
          </DeviceLink>
        )}
      </div>
      <ul className={cx("mt-6 flex flex-wrap gap-2", ink ? "justify-start" : "justify-center")}>
        {ordered.map((app) => (
          <li key={app.id}>
            <Link
              to="/download/$slug"
              params={{ slug: app.slug }}
              className={cx(
                "inline-flex h-9 items-center rounded-full px-3.5 font-rpk-mono text-[12px] tracking-[0.04em] uppercase transition-colors",
                ink
                  ? "bg-white/[0.06] text-white/70 ring-1 ring-white/10 hover:bg-white/[0.12] hover:text-white"
                  : "bg-rpk-paper text-rpk-slate ring-1 ring-rpk-mist hover:text-rpk-ink",
              )}
            >
              {PLATFORM_EN[app.platform].label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
