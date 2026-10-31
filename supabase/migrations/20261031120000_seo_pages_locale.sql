-- تنظیمات سئوی هر صفحه به تفکیک زبان. NULL یعنی زبان پیش‌فرض سایت (همه ردیف‌های قدیمی بدون
-- تغییر همین معنا را دارند). ردیف زبان‌های دیگر کلید «<کلید صفحه>@<زبان>» دارد تا page_key یکتا بماند.
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS locale varchar(5);
