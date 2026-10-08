import { THREAD_COPY } from "../copy";
import { PageOpener } from "../ui";

/** Temporary shell for pages that are still being designed. */
export function PlaceholderPage({ name }: { name: string }) {
  return (
    <PageOpener
      question={`What's on the ${name.toLowerCase()} page?`}
      title={name}
      lede={THREAD_COPY.placeholder}
      className="min-h-[60vh]"
    />
  );
}
