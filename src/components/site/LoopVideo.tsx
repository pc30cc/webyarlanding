import { useEffect, useRef, useState } from "react";

type Props = {
  src: string;
  poster: string;
  title: string;
  className?: string;
  width?: number;
  height?: number;
};

/**
 * ویدیوی تزئینی لوپ، بهینه برای سرعت و Core Web Vitals:
 * - فایل فقط وقتی نزدیک دید کاربر است بارگذاری می‌شود (preload=none)
 * - بیرون از دید متوقف می‌شود تا CPU/باتری مصرف نشود
 * - با «کاهش حرکت» سیستم فقط تصویر پوستر نمایش داده می‌شود
 */
export function LoopVideo({ src, poster, title, className, width, height }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setActive(true);
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={active ? src : undefined}
      poster={poster}
      title={title}
      aria-label={title}
      width={width}
      height={height}
      muted
      loop
      playsInline
      preload="none"
      disablePictureInPicture
      disableRemotePlayback
      controlsList="nodownload nofullscreen noremoteplayback"
      className={className}
    />
  );
}
