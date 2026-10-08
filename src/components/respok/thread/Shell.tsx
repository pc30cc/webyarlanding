import type { RespokShellProps } from "../types";
import { RespokLogo } from "../RespokLogo";

export function ThreadShell({ children }: RespokShellProps) {
  return (
    <>
      <header className="p-4">
        <RespokLogo concept="thread" height={28} />
      </header>
      <main className="flex-1">{children}</main>
    </>
  );
}
