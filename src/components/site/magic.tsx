// جلوه‌های بصری الهام‌گرفته از Magic UI و React Bits — بدون وابستگی خارجی
import { useRef, type ReactNode, type MouseEvent } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/** پس‌زمینه شفق (Aurora) با لکه‌های رنگی متحرک + شبکه محو */
export function AuroraBackdrop({ className }: { className?: string | undefined }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}>
      <div className="animate-aurora absolute -top-40 start-[10%] h-[420px] w-[420px] rounded-full bg-primary/25 blur-[110px] sm:h-[560px] sm:w-[560px]" />
      <div
        className="animate-aurora absolute top-20 end-[5%] h-[380px] w-[380px] rounded-full bg-accent/25 blur-[110px] sm:h-[520px] sm:w-[520px]"
        style={{ animationDelay: "-6s" }}
      />
      <div
        className="animate-aurora absolute -bottom-40 start-1/3 h-[300px] w-[300px] rounded-full bg-info/15 blur-[100px]"
        style={{ animationDelay: "-12s" }}
      />
      <div className="bg-grid absolute inset-0" />
    </div>
  );
}

/** نوار چرخان بی‌پایان (Marquee) */
export function Marquee({ children, duration = 40, className }: { children: ReactNode; duration?: number; className?: string | undefined }) {
  return (
    <div
      className={`relative flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)] ${className ?? ""}`}
    >
      <div
        className="animate-marquee flex w-max shrink-0 items-center hover:[animation-play-state:paused]"
        style={{ ["--marquee-duration" as string]: `${duration}s` }}
      >
        <div className="flex shrink-0 items-center gap-10 pe-10 sm:gap-16 sm:pe-16">{children}</div>
        <div aria-hidden className="flex shrink-0 items-center gap-10 pe-10 sm:gap-16 sm:pe-16">
          {children}
        </div>
      </div>
    </div>
  );
}

/** کارت با نورافکن دنبال‌کننده ماوس */
export function SpotlightCard({ children, className }: { children: ReactNode; className?: string | undefined }) {
  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <div onMouseMove={onMove} className={`spotlight rounded-3xl border border-border bg-card/70 ${className ?? ""}`}>
      {children}
    </div>
  );
}

/** نشان کوچک بالای تیتر با نقطه زنده */
export function LiveBadge({ children }: { children: ReactNode }) {
  return (
    <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-foreground">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping-soft absolute inline-flex h-full w-full rounded-full bg-success" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
      </span>
      {children}
    </span>
  );
}

/** پارالاکس ملایم هنگام اسکرول */
export function Parallax({ children, offset = 60, className }: { children: ReactNode; offset?: number; className?: string | undefined }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset]);
  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  desc,
  center = true,
}: {
  eyebrow?: string;
  title: ReactNode;
  desc?: ReactNode;
  center?: boolean;
}) {
  return (
    <div className={`mb-12 max-w-2xl sm:mb-16 ${center ? "mx-auto text-center" : ""}`}>
      {eyebrow && <div className="mb-3 text-sm font-bold text-primary">{eyebrow}</div>}
      <h2 className="text-[26px] leading-[1.4] font-extrabold text-foreground sm:text-4xl lg:text-[44px] lg:leading-[1.3]">{title}</h2>
      {desc && <p className="mt-4 text-base leading-[1.9] text-muted-foreground sm:text-lg">{desc}</p>}
    </div>
  );
}
