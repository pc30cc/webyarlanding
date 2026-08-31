-- آمار بازدید سایت: بازدیدها (برای شمارش روزانه/هفتگی/ماهانه) و حضور لحظه‌ای
-- (برای شمارش «الان چند نفر آنلاین هستند»). هیچ IP یا داده‌ی شناسایی‌کننده ذخیره نمی‌شود؛
-- فقط یک شناسه‌ی نشست تصادفی که سمت مرورگر ساخته می‌شود.
CREATE TABLE public.site_visits (
  id          varchar(36) NOT NULL PRIMARY KEY,
  session_id  varchar(64) NOT NULL,
  path        varchar(500) NOT NULL,
  created_at  timestamp NOT NULL DEFAULT now()
);
CREATE INDEX site_visits_created_idx ON public.site_visits(created_at);
CREATE INDEX site_visits_session_idx ON public.site_visits(session_id);
GRANT ALL ON public.site_visits TO service_role;
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.site_presence (
  session_id  varchar(64) NOT NULL PRIMARY KEY,
  path        varchar(500) NOT NULL,
  last_seen   timestamp NOT NULL DEFAULT now()
);
CREATE INDEX site_presence_last_seen_idx ON public.site_presence(last_seen);
GRANT ALL ON public.site_presence TO service_role;
ALTER TABLE public.site_presence ENABLE ROW LEVEL SECURITY;
