# دیتابیس PostgreSQL سلف‌هاست روی Coolify

سایت فقط با PostgreSQL کار می‌کند و از طریق متغیر `DATABASE_URL` مستقیماً (با درایور `pg`) به آن
وصل می‌شود. لایهٔ دسترسی در `src/lib/pg-db.server.ts` است، ساختار جدول‌ها در `db/schema.sql` و تایپ
ردیف‌ها در `src/lib/db-types.ts`.

---

## ۱) ساخت کانتینر PostgreSQL در Coolify

**روش پیشنهادی (دیتابیس مدیریت‌شده خود Coolify):**

1. Coolify ← پروژه سایت ← **New Resource ← Databases ← PostgreSQL**، نسخه **17**.
2. نام دیتابیس `webyar`، کاربر `webyar` و یک رمز قوی تعیین کنید.
3. **Make it publicly available** را خاموش بگذارید (اپ از شبکه داخلی وصل می‌شود).
4. Start بزنید و از صفحهٔ همان دیتابیس **Postgres URL (internal)** را کپی کنید؛ چیزی شبیه
   `postgresql://webyar:PASS@<uuid>:5432/webyar`.
5. در همان صفحه بخش **Backups** را هم می‌توانید فعال کنید (بک‌آپ سطح سرور با `pg_dump`، مکمل
   بک‌آپ داخل پنل ادمین).

**روش جایگزین (Docker Compose):** فایل `docker/postgres/docker-compose.yml` را در
**New Resource ← Docker Compose (Empty)** بگذارید، `POSTGRES_PASSWORD` را تعریف و Deploy کنید.
آدرس داخلی: `postgresql://webyar:PASS@webyar-db:5432/webyar`.

> اپ و دیتابیس باید در یک شبکهٔ Docker باشند (در Coolify: هر دو در یک Project/Environment، یا
> گزینهٔ «Connect to Predefined Network»).

## ۲) وصل کردن سایت به دیتابیس

1. Coolify ← اپ سایت ← **Environment Variables**:
   `DATABASE_URL=postgresql://webyar:PASS@<db-host>:5432/webyar`
2. **Redeploy**. هنگام بالا آمدن، `db/schema.sql` به‌صورت idempotent اجرا می‌شود (جدول‌ها و
   ستون‌های تازه ساخته می‌شوند، هیچ داده‌ای حذف نمی‌شود).
3. بررسی: `https://<domain>/api/public/health` باید `"database": "ok"` برگرداند.

متغیرهای اختیاری:

| متغیر                                       | کاربرد                                                               |
| ------------------------------------------- | -------------------------------------------------------------------- |
| `DATABASE_POOL_MAX`                         | حداکثر اتصال هم‌زمان (پیش‌فرض ۱۰)                                    |
| `DATABASE_AUTO_MIGRATE=false`               | اجرای خودکار `db/schema.sql` هنگام بالا آمدن را خاموش می‌کند         |
| `?sslmode=require` در انتهای `DATABASE_URL` | اتصال TLS برای سرور بیرونی                                           |
| `CRON_SECRET`                               | رمز Bearer برای `/api/public/autoblog-cron` و `/api/public/seo-cron` |

بدون `DATABASE_URL` صفحه‌های عمومی با تنظیمات پیش‌فرض بالا می‌آیند، ولی هر کوئری خطای «DATABASE_URL
تنظیم نشده است» می‌دهد و ورود به پنل ممکن نیست.

## ۳) انتقال داده به سرور دیگر

- **پنل ادمین ← پشتیبان‌گیری ← انتقال دیتابیس به دیتابیس**: رشتهٔ اتصال PostgreSQL مقصد را وارد
  کنید؛ ساختار و تعداد رکوردها مقایسه و سپس ساختار جدول‌ها و همهٔ داده‌ها مستقیم منتقل می‌شوند.
- یا دستی با ابزارهای خود PostgreSQL:

```sh
pg_dump --no-owner --no-privileges "$SOURCE_DATABASE_URL" | psql "$TARGET_DATABASE_URL" -v ON_ERROR_STOP=1
```

## ۴) بک‌آپ دستی و روزانه (پنل ادمین ← پشتیبان‌گیری)

- **گرفتن بک‌آپ الان**: از کل دیتابیس با `pg_dump` یک فایل `sql.gz` ساخته و روی همان فضای
  ذخیره‌سازی‌ای که در **تنظیمات عمومی ← ذخیره‌سازی رسانه** وصل است (بانی سی‌دی‌ان یا ابر آروان)
  آپلود می‌شود. اگر `pg_dump`/`psql` روی سرور نباشد (در ایمیج Nixpacks از طریق `nixpacks.toml`
  نصب می‌شوند)، فایل `json.gz` ساخته می‌شود.
- **بک‌آپ خودکار روزانه**: روشن/خاموش، ساعت اجرا به وقت تهران، مدت نگه‌داری (روز) و حداقل تعداد
  نسخه‌ای که همیشه نگه داشته می‌شود. زمان‌بند داخلی سرور هر ۵ دقیقه بررسی می‌کند و اگر سرور سر
  ساعت خاموش بوده، همان روز جبران می‌کند.
- **تاریخچه**: دانلود، بازیابی با یک کلیک (بعد از بررسی checksum فایل) و حذف هر نسخه.
- بازیابی دستی فایل `sql.gz` بیرون از پنل:
  `gunzip -c file.sql.gz | psql "$DATABASE_URL" -v ON_ERROR_STOP=1 --single-transaction`
- امنیت: فایل‌ها با نام تصادفی و بدون ACL عمومی آپلود می‌شوند و دانلود فقط از طریق API ذخیره‌سازی
  با کلید سمت سرور انجام می‌شود. روی بانی، Storage Zone به‌صورت پیش‌فرض از طریق Pull Zone عمومی
  است؛ اگر می‌خواهید پوشهٔ `backups/` اصلاً از سی‌دی‌ان در دسترس نباشد، در Pull Zone یک Edge Rule
  برای مسدود کردن `*/backups/*` بگذارید.
- فایل `json.gz` بعد از unzip (`gunzip`) همان فرمت JSON است و از بخش «بازیابی از فایل JSON» هم
  قابل بازیابی است.

## تست

```sh
TEST_DATABASE_URL=postgres://postgres@localhost:5432/webyar_test npx vitest run src/lib/pg-db.server.test.ts
```
