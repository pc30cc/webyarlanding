-- تاریخچه نسخه‌های پشتیبان دستی و روزانه که روی سی‌دی‌ان/فضای ذخیره‌سازی آپلود شده‌اند.
CREATE TABLE IF NOT EXISTS public.backup_runs (
  id            varchar(36) NOT NULL PRIMARY KEY,
  trigger_source varchar(20) NOT NULL DEFAULT 'manual',
  status        varchar(20) NOT NULL DEFAULT 'running',
  provider      varchar(20),
  path          text,
  filename      varchar(255),
  size_bytes    bigint,
  table_count   integer NOT NULL DEFAULT 0,
  row_count     integer NOT NULL DEFAULT 0,
  checksum      varchar(80),
  error         text,
  started_at    timestamp NOT NULL DEFAULT now(),
  finished_at   timestamp
);
CREATE INDEX IF NOT EXISTS backup_runs_started_idx ON public.backup_runs(started_at);
GRANT ALL ON public.backup_runs TO service_role;
ALTER TABLE public.backup_runs ENABLE ROW LEVEL SECURITY;
