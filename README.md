# WEBYAR website

Public website and admin panel of webyar.ai, built with TanStack Start (React, SSR) on Vite and
Nitro, backed by a self-hosted PostgreSQL database.

## Development

You need Node.js 22 and npm, plus a PostgreSQL database (`DATABASE_URL`). The schema in
`db/schema.sql` is applied automatically on the first query.

```sh
npm ci
DATABASE_URL=postgresql://user:pass@localhost:5432/webyar npm run dev   # http://localhost:8080
npm test                                                                # vitest
```

## Build and run

```sh
npm run build                                          # emits dist/server + dist/client
node --env-file-if-exists=.env dist/server/index.mjs   # serves SSR and static assets
```

`NITRO_PRESET` selects another Nitro deploy target; the default is a plain Node server.
Production runs on Coolify with Nixpacks (`nixpacks.toml`). Environment variables are listed in
`.env.example`; database setup, backups and transfers are described in `docs/self-host-postgres.md`.
