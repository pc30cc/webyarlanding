-- تصاویر تولیدشده با هوش مصنوعی به‌صورت data URL (base64) هستند و طول آن‌ها به‌راحتی
-- از چند ده‌هزار کاراکتر عبور می‌کند؛ varchar(500)/varchar(1000) باعث شکست خاموش INSERT می‌شد.
ALTER TABLE public.blog_posts ALTER COLUMN cover_image TYPE text;
ALTER TABLE public.media_assets ALTER COLUMN url TYPE text;
ALTER TABLE public.media_assets ALTER COLUMN path TYPE text;
