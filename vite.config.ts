// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { copyFileSync, existsSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Plugin } from "vite";
import { scrubBrandText } from "./src/lib/brand-scrub";

// Self-hosted deploys (Coolify/Nixpacks) set NITRO_PRESET=node-server so the build
// emits a plain Node server. Inside Lovable the platform preset still wins.
const selfHostPreset = process.env["NITRO_PRESET"];

// The English site (respok.app) is deployed from this same repository. Its build is
// recognized by SITE_BRAND=respok or by the domain Coolify passes to the build, and must not
// ship anything that names the Persian brand to the browser.
const respokBuild =
  process.env["SITE_BRAND"] === "respok" ||
  /(?:^|[,/])(?:www\.)?respok\.app(?:$|[,/:])/.test(
    `${process.env["COOLIFY_FQDN"] ?? ""},${process.env["COOLIFY_URL"] ?? ""}`,
  );

/** Swaps the Persian site's public files (icons, logo, manifest) for Respok ones in the output. */
function replaceRespokPublicFiles(out: string) {
  const from = (name: string) => join(out, "respok", "open", name);
  const replace: Record<string, string> = {
    "favicon.ico": from("favicon-32x32.png"),
    "favicon.png": from("favicon-32x32.png"),
    "favicon-16x16.png": from("favicon-32x32.png"),
    "favicon-32x32.png": from("favicon-32x32.png"),
    "favicon-48x48.png": from("favicon-32x32.png"),
    "favicon.svg": from("favicon.svg"),
    "safari-pinned-tab.svg": from("favicon.svg"),
    "apple-touch-icon.png": from("apple-touch-icon.png"),
    "icon-192.png": from("apple-touch-icon.png"),
    "icon-512.png": from("apple-touch-icon.png"),
    "icon-maskable-192.png": from("apple-touch-icon.png"),
    "icon-maskable-512.png": from("apple-touch-icon.png"),
    "apps/ios.png": from("apple-touch-icon.png"),
    "apps/android.png": from("apple-touch-icon.png"),
    "apps/windows.png": from("apple-touch-icon.png"),
    "og-image.png": from("og-image.png"),
  };
  for (const [target, source] of Object.entries(replace))
    if (existsSync(source)) copyFileSync(source, join(out, target));
  rmSync(join(out, "webyar-logo.png"), { force: true });
  writeFileSync(
    join(out, "site.webmanifest"),
    JSON.stringify(
      {
        name: "RESPOK",
        short_name: "RESPOK",
        description: "Live chat for your website",
        lang: "en",
        dir: "ltr",
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: "#16142B",
        background_color: "#FFFFFF",
        icons: [{ src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
      },
      null,
      2,
    ),
  );
}

/** Rewrites every browser chunk with the same function the server uses for HTML. */
function respokBrandScrub(): Plugin {
  return {
    name: "respok-brand-scrub",
    apply: "build",
    enforce: "post",
    // Nitro copies public/ into the output after the client build and records each file's
    // size when it builds the server, so the swap runs right at the start of that build.
    buildStart() {
      if (this.environment.name === "nitro")
        replaceRespokPublicFiles(join(process.cwd(), "dist/client"));
    },
    renderChunk(code) {
      if (this.environment.name !== "client") return null;
      const next = scrubBrandText(code);
      return next === code ? null : { code: next, map: null };
    },
  };
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  ...(selfHostPreset
    ? {
        nitro: {
          preset: selfHostPreset,
          output: { dir: "dist", serverDir: "dist/server", publicDir: "dist/client" },
        },
      }
    : {}),
  vite: {
    // `vite preview` on a custom domain otherwise rejects the request host.
    preview: { allowedHosts: true },
    define: { __RESPOK_BUILD__: JSON.stringify(respokBuild) },
    plugins: respokBuild ? [respokBrandScrub()] : [],
  },
});
