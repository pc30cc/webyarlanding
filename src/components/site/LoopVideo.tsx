import { useEffect, useRef } from "react";

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
  const webmSrc = src.replace(/\.mp4(?:\?.*)?$/i, ".webm");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const play = () => {
      el.muted = true;
      void el.play().catch(() => undefined);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          play();
        } else {
          el.pause();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    el.addEventListener("canplay", play);
    play();
    return () => {
      io.disconnect();
      el.removeEventListener("canplay", play);
    };
  }, [src]);

  return (
    <video
      ref={ref}
      poster={poster}
      title={title}
      aria-label={title}
      width={width}
      height={height}
      muted
      autoPlay
      loop
      playsInline
      preload="metadata"
      disablePictureInPicture
      disableRemotePlayback
      controlsList="nodownload nofullscreen noremoteplayback"
      className={className}
    >
      <source src={webmSrc} type="video/webm" />
      <source src={src} type="video/mp4" />
    </video>
  );
}
