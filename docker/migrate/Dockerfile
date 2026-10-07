# ایمیج یک‌بارمصرف برای انتقال دیتابیس از Supabase به Postgres سلف‌هاست.
# pg_dump نسخه ۱۷ (باید هم‌نسخه یا جدیدتر از Postgres سوپابیس باشد) + Node برای اسکریپت.
#   docker build -t webyar-migrate -f docker/migrate/Dockerfile .
#   docker run --rm --network coolify \
#     -e SOURCE_DATABASE_URL='postgresql://postgres:PASS@db.xxxx.supabase.co:5432/postgres' \
#     -e TARGET_DATABASE_URL='postgresql://webyar:PASS@webyar-db:5432/webyar' \
#     webyar-migrate
FROM postgres:17-bookworm
RUN apt-get update \
 && apt-get install -y --no-install-recommends nodejs npm ca-certificates \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
RUN npm init -y >/dev/null && npm install pg@8 --omit=dev --no-audit --no-fund
COPY db/schema.sql db/schema.sql
COPY scripts/db/migrate-from-supabase.mjs scripts/db/migrate-from-supabase.mjs
ENTRYPOINT ["node", "scripts/db/migrate-from-supabase.mjs"]
