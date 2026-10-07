# انتقال دیتابیس از Supabase به PostgreSQL سلف‌هاست روی Coolify

این راهنما دیتابیس سایت را از Supabase به یک کانتینر اختصاصی PostgreSQL روی همان سرور Coolify
منتقل می‌کند. کد سایت هر دو حالت را پشتیبانی می‌کند:

| متغیر `DATABASE_URL` | دیتابیس مورد استفاده |
| --- | --- |
| تنظیم شده | PostgreSQL سلف‌هاست (اتصال مستقیم با درایور `pg`) |
| تنظیم نشده | Supabase (مثل قبل) |

لایهٔ `src/lib/pg-db.server.ts` همان API کلاینت Supabase را پیاده می‌کند، پس هیچ بخش دیگری از کد
تغییر نکرده و برگشت به Supabase فقط با حذف `DATABASE_URL` ممکن است.

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

## ۲) انتقال داده‌ها

اسکریپت `scripts/db/migrate-from-supabase.mjs` کل اسکیمای `public` و همهٔ ردیف‌ها را منتقل و در
پایان **تعداد ردیف تک‌تک جدول‌ها را در مبدأ و مقصد مقایسه** می‌کند. اگر مقصد داده داشته باشد بدون
`--force` کاری انجام نمی‌دهد، و انتقال در یک تراکنش است: یا کامل انجام می‌شود یا هیچ تغییری نمی‌دهد.
جدول `site_presence` (فقط «آنلاین‌های لحظه‌ای») منتقل نمی‌شود.

### روش A — دقیق‌ترین: `pg_dump` (اگر رمز دیتابیس Supabase را دارید)

ساختار را دقیقاً همان‌طور که روی Supabase هست (ستون‌ها، پیش‌فرض‌ها، ایندکس‌ها، محدودیت‌ها) با
`pg_dump` می‌برد و بخش‌های مخصوص Supabase (RLS، policy، grant) را حذف می‌کند.

`SOURCE_DATABASE_URL` را از داشبورد Supabase ← **Connect ← Session pooler / Direct** بردارید.
روی سرور Coolify (از داخل پوشهٔ ریپو):

```sh
docker build -t webyar-migrate -f docker/migrate/Dockerfile .
docker run --rm --network coolify \
  -e SOURCE_DATABASE_URL='postgresql://postgres.xxxx:PASS@aws-0-xx.pooler.supabase.com:5432/postgres' \
  -e TARGET_DATABASE_URL='postgresql://webyar:PASS@<db-host>:5432/webyar' \
  webyar-migrate
```

### روش B — بدون رمز دیتابیس: API سرویس Supabase

اگر پروژه روی Lovable Cloud است و رمز مستقیم دیتابیس را ندارید، همان `SUPABASE_URL` و
`SUPABASE_SERVICE_ROLE_KEY` که سایت الان دارد کافی است. در Coolify ← اپ سایت ← **Terminal**:

```sh
TARGET_DATABASE_URL='postgresql://webyar:PASS@<db-host>:5432/webyar' \
  node scripts/db/migrate-from-supabase.mjs --method=api
```

فهرست جدول‌ها و ستون‌ها از OpenAPI خود Supabase خوانده می‌شود؛ هر جدول/ستونی که در
`db/schema.sql` نباشد با نوع واقعی‌اش ساخته می‌شود.

خروجی موفق در پایان یک جدول ✓ برای همهٔ جدول‌ها و پیام «انتقال کامل و تأییدشده انجام شد» است.

## ۳) وصل کردن سایت به دیتابیس جدید

1. Coolify ← اپ سایت ← **Environment Variables**:
   `DATABASE_URL=postgresql://webyar:PASS@<db-host>:5432/webyar`
2. **Redeploy**. هنگام بالا آمدن، `db/schema.sql` به‌صورت idempotent اجرا می‌شود (جدول‌های جدید
   مثل `backup_runs` ساخته می‌شوند، هیچ داده‌ای حذف نمی‌شود).
3. در پنل ادمین ← **پشتیبان‌گیری** باید برچسب «دیتابیس: PostgreSQL سلف‌هاست» را ببینید.

برای برگشت به Supabase کافی است `DATABASE_URL` را حذف و Redeploy کنید. توجه: داده‌هایی که در این
فاصله در Postgres ثبت شده‌اند به Supabase برنمی‌گردند (با بک‌آپ/بازیابی پنل منتقلشان کنید).

## ۴) بک‌آپ دستی و روزانه (پنل ادمین ← پشتیبان‌گیری)

- **گرفتن بک‌آپ الان**: کل دیتابیس به یک فایل `json.gz` تبدیل و روی همان فضای ذخیره‌سازی‌ای که در
  **تنظیمات عمومی ← ذخیره‌سازی رسانه** وصل است (بانی سی‌دی‌ان یا ابر آروان) آپلود می‌شود.
- **بک‌آپ خودکار روزانه**: روشن/خاموش، ساعت اجرا به وقت تهران، مدت نگه‌داری (روز) و حداقل تعداد
  نسخه‌ای که همیشه نگه داشته می‌شود. زمان‌بند داخلی سرور هر ۵ دقیقه بررسی می‌کند و اگر سرور سر
  ساعت خاموش بوده، همان روز جبران می‌کند.
- **تاریخچه**: دانلود، بازیابی با یک کلیک (بعد از بررسی checksum فایل) و حذف هر نسخه.
- امنیت: فایل‌ها با نام تصادفی و بدون ACL عمومی آپلود می‌شوند و دانلود فقط از طریق API ذخیره‌سازی
  با کلید سمت سرور انجام می‌شود. روی بانی، Storage Zone به‌صورت پیش‌فرض از طریق Pull Zone عمومی
  است؛ اگر می‌خواهید پوشهٔ `backups/` اصلاً از سی‌دی‌ان در دسترس نباشد، در Pull Zone یک Edge Rule
  برای مسدود کردن `*/backups/*` بگذارید.
- فایل دانلودشده بعد از unzip (`gunzip`) همان فرمت JSON است و از بخش «بازیابی از فایل JSON» هم
  قابل بازیابی است.

## تست

```sh
TEST_DATABASE_URL=postgres://postgres@localhost:5432/webyar_test npx vitest run src/lib/pg-db.server.test.ts
```
