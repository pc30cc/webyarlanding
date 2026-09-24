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
  const [shouldLoad, setShouldLoad] = useState(false);
  const preferredSrc = src.replace(/\.mp4(?:\?.*)?$/i, ".webm");

  const tryPlay = () => {
    const el = ref.current;
    if (!el) return;
    el.muted = true;
    void el.play().catch(() => undefined);
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoad(true);
          if (el.currentSrc) void el.play().catch(() => undefined);
        } else {
          el.pause();
        }
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || !shouldLoad) return;
    el.load();
    tryPlay();
  }, [shouldLoad]);

  return (
    <video
      ref={ref}
      poster={poster}
      title={title}
      aria-label={title}
      width={width}
      height={height}
      autoPlay={shouldLoad}
      muted
      defaultMuted
      loop
      playsInline
      preload={shouldLoad ? "metadata" : "none"}
      disablePictureInPicture
      disableRemotePlayback
      controlsList="nodownload nofullscreen noremoteplayback"
      className={className}
      onCanPlay={tryPlay}
      onLoadedData={tryPlay}
    >
      {shouldLoad ? (
        <>
          <source src={preferredSrc} type="video/webm" />
          <source src={src} type="video/mp4" />
        </>
      ) : null}
    </video>
  );
}
