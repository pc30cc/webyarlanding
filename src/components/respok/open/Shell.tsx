import type { RespokShellProps } from "../types";
import { RespokLogo } from "../RespokLogo";

export function OpenShell({ children }: RespokShellProps) {
  return (
    <>
      <header className="p-4">
        <RespokLogo concept="open" height={28} />
      </header>
      <main className="flex-1">{children}</main>
    </>
  );
}
