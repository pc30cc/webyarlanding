import type { RespokShellProps } from "../types";
import { OPEN_COPY } from "./copy";
import { OpenFooter } from "./Footer";
import { OpenHeader } from "./Header";

/** Open frame: Ink header, the page's chapters, Ink footer. */
export function OpenShell({ children }: RespokShellProps) {
  return (
    <>
      <span id="top" aria-hidden="true" className="absolute top-0 left-0 h-px w-px" />
      <a
        href="#main"
        className="fixed top-3 left-3 z-[60] -translate-y-24 rounded-[16px] rounded-br-[4px] bg-rpk-signal px-5 py-3 text-[15px] font-semibold text-rpk-ink shadow-rpk-launcher transition-transform focus:translate-y-0"
      >
        {OPEN_COPY.skip}
      </a>
      <OpenHeader />
      <main id="main" tabIndex={-1} className="flex-1 bg-rpk-paper text-rpk-ink outline-none">
        {children}
      </main>
      <OpenFooter />
    </>
  );
}
