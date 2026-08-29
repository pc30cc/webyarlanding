// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Self-hosted deploys (Coolify/Nixpacks) set NITRO_PRESET=node-server so the build
// emits a plain Node server. Inside Lovable the platform preset still wins.
const selfHostPreset = process.env["NITRO_PRESET"];

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  ...(selfHostPreset ? {
        nitro: {
          preset: selfHostPreset,
          output: { dir: "dist", serverDir: "dist/server", publicDir: "dist/client" },
        },
      } : {}),
  vite: {
    // `vite preview` on a custom domain otherwise rejects the request host.
    preview: { allowedHosts: true },
  },
});
