// Vite config for TanStack Start (SSR) + Nitro.
//
// `vite build` emits a plain Node server: dist/server/index.mjs serves SSR and the static
// assets in dist/client (Coolify/Nixpacks starts it with `node dist/server/index.mjs`).
// NITRO_PRESET (or SERVER_PRESET) still selects another Nitro deploy target when set.
// src/client.tsx (custom client entry) and src/server.ts are picked up by convention.
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

const nitroPreset = process.env["NITRO_PRESET"] || process.env["SERVER_PRESET"] || "node-server";

export default defineConfig(({ command, mode }) => {
  // `vite build --mode development` (npm run build:dev): React development build in the browser
  const isDevBuild = command === "build" && mode === "development";

  return {
    ...(isDevBuild
      ? {
          environments: {
            client: { define: { "process.env.NODE_ENV": JSON.stringify("development") } },
          },
        }
      : {}),
    css: { transformer: "lightningcss" },
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
      ignoreOutdatedRequests: true,
    },
    plugins: [
      tailwindcss(),
      tsConfigPaths({ projects: ["./tsconfig.json"] }),
      tanstackStart({
        // Server-only modules (any `server/` folder or `server-only` import) must never end up
        // in the client bundle; fail the build instead.
        importProtection: {
          behavior: "error",
          client: { files: ["**/server/**"], specifiers: ["server-only"] },
        },
        // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error
        // wrapper). nitro/vite builds from this.
        server: { entry: "server" },
      }),
      ...(command === "build"
        ? [
            nitro({
              preset: nitroPreset,
              output: { dir: "dist", serverDir: "dist/server", publicDir: "dist/client" },
            }),
          ]
        : []),
      viteReact(),
    ],
    server: { host: "::", port: 8080 },
    // `vite preview` on a custom domain otherwise rejects the request host.
    preview: { allowedHosts: true },
  };
});
