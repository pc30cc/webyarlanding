import { useRespok } from "../../shared/context";
import { OPEN_COPY } from "../copy";
import { ChapterHero } from "../ui";

/** Shell for pages whose Open layout is still being composed. */
export function Placeholder({ name, path }: { name: string; path: string }) {
  const { brand } = useRespok();
  return (
    <ChapterHero
      running={`${brand} · ${name}`}
      path={path}
      eyebrow={name}
      title={name}
      lede={OPEN_COPY.placeholder}
    >
      <div className="h-24 sm:h-40" aria-hidden="true" />
    </ChapterHero>
  );
}
