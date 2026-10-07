-- اسکیمای کامل دیتابیس WEBYAR برای PostgreSQL سلف‌هاست (کانتینر Coolify).
-- معادل تجمیعی همه فایل‌های supabase/migrations بدون بخش‌های مخصوص Supabase
-- (RLS، GRANT به service_role). کاملاً idempotent است: اجرای چندباره هیچ داده‌ای را
-- حذف یا تغییر نمی‌دهد. سرور در حالت DATABASE_URL هنگام بالا آمدن خودکار اجرایش می‌کند.
--
-- نکته: انتقال اصلی با scripts/db/migrate-from-supabase.sh و pg_dump انجام می‌شود که
-- ساختار واقعی دیتابیس Supabase را عیناً منتقل می‌کند؛ این فایل برای نصب تازه و تضمین
-- وجود جدول‌های جدیدتر (مثل backup_runs) است.

-- ============ USERS ============
CREATE TABLE IF NOT EXISTS public.users (
  id             varchar(36) NOT NULL PRIMARY KEY,
  email          varchar(191) NOT NULL,
  password_hash  varchar(255) NOT NULL,
  display_name   varchar(191),
  role           varchar(20) NOT NULL DEFAULT 'admin',
  is_active      smallint NOT NULL DEFAULT 1,
  last_login_at  timestamp,
  created_at     timestamp NOT NULL DEFAULT now(),
  updated_at     timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON public.users(email);

CREATE TABLE IF NOT EXISTS public.user_sessions (
  id          varchar(36) NOT NULL PRIMARY KEY,
  user_id     varchar(36) NOT NULL,
  token_hash  varchar(128) NOT NULL,
  expires_at  timestamp NOT NULL,
  ip_address  varchar(64),
  user_agent  varchar(500),
  created_at  timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS user_sessions_token_idx ON public.user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS user_sessions_user_idx ON public.user_sessions(user_id);

CREATE TABLE IF NOT EXISTS public.login_attempts (
  id          varchar(36) NOT NULL PRIMARY KEY,
  email       varchar(191) NOT NULL,
  success     smallint NOT NULL DEFAULT 0,
  reason      varchar(191),
  ip_address  varchar(64),
  user_agent  varchar(500),
  created_at  timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS login_attempts_created_idx ON public.login_attempts(created_at);

-- ============ SETTINGS (key/value) ============
CREATE TABLE IF NOT EXISTS public.settings (
  id             varchar(36) NOT NULL PRIMARY KEY,
  setting_key    varchar(120) NOT NULL,
  setting_value  text NOT NULL DEFAULT '',
  is_private     smallint NOT NULL DEFAULT 0,
  updated_at     timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS settings_key_idx ON public.settings(setting_key);

-- ============ BLOG ============
CREATE TABLE IF NOT EXISTS public.blog_categories (
  id               varchar(36) NOT NULL PRIMARY KEY,
  slug             varchar(191) NOT NULL,
  name             varchar(191) NOT NULL,
  description      text,
  parent_id        varchar(36),
  sort_order       integer NOT NULL DEFAULT 0,
  seo_title        varchar(255),
  seo_description  varchar(500),
  created_at       timestamp NOT NULL DEFAULT now(),
  updated_at       timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS blog_categories_slug_idx ON public.blog_categories(slug);

CREATE TABLE IF NOT EXISTS public.blog_tags (
  id               varchar(36) NOT NULL PRIMARY KEY,
  slug             varchar(191) NOT NULL,
  name             varchar(191) NOT NULL,
  description      text,
  seo_title        varchar(255),
  seo_description  varchar(500),
  sort_order       integer NOT NULL DEFAULT 0,
  created_at       timestamp NOT NULL DEFAULT now(),
  updated_at       timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS blog_tags_slug_idx ON public.blog_tags(slug);

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id               varchar(36) NOT NULL PRIMARY KEY,
  slug             varchar(191) NOT NULL,
  title            varchar(255) NOT NULL,
  excerpt          text,
  content          text,
  cover_image      text,
  status           varchar(20) NOT NULL DEFAULT 'draft',
  author           varchar(191),
  tags_csv         text NOT NULL DEFAULT '',
  category_id      varchar(36),
  indexable        smallint NOT NULL DEFAULT 1,
  seo_title        varchar(255),
  seo_description  varchar(500),
  canonical_url    varchar(500),
  robots           varchar(60) NOT NULL DEFAULT 'index,follow',
  focus_keyword    varchar(191),
  published_at     timestamp,
  created_at       timestamp NOT NULL DEFAULT now(),
  updated_at       timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS blog_posts_slug_idx ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS blog_posts_status_idx ON public.blog_posts(status);
CREATE INDEX IF NOT EXISTS blog_posts_category_idx ON public.blog_posts(category_id);

CREATE TABLE IF NOT EXISTS public.blog_post_tags (
  post_id     varchar(36) NOT NULL,
  tag_id      varchar(36) NOT NULL,
  created_at  timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, tag_id)
);
CREATE INDEX IF NOT EXISTS blog_post_tags_tag_idx ON public.blog_post_tags(tag_id);

-- ============ MEDIA ============
CREATE TABLE IF NOT EXISTS public.media_assets (
  id          varchar(36) NOT NULL PRIMARY KEY,
  provider    varchar(40) NOT NULL DEFAULT 'supabase',
  path        text NOT NULL,
  url         text NOT NULL,
  filename    varchar(255) NOT NULL,
  mime_type   varchar(120),
  size_bytes  bigint,
  width       integer,
  height      integer,
  alt         varchar(500),
  uploaded_by varchar(36),
  created_at  timestamp NOT NULL DEFAULT now(),
  updated_at  timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS media_assets_created_idx ON public.media_assets(created_at);

-- ============ SEO PAGES ============
CREATE TABLE IF NOT EXISTS public.seo_pages (
  id               varchar(36) NOT NULL PRIMARY KEY,
  page_key         varchar(120) NOT NULL,
  path             varchar(255) NOT NULL DEFAULT '/',
  title            varchar(255),
  description      varchar(500),
  og_image         varchar(1000),
  robots           varchar(60) NOT NULL DEFAULT 'index,follow',
  canonical_url    varchar(500),
  schema_json      text,
  created_at       timestamp NOT NULL DEFAULT now(),
  updated_at       timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS seo_pages_key_idx ON public.seo_pages(page_key);

-- ============ AUTOBLOG ============
CREATE TABLE IF NOT EXISTS public.autoblog_settings (
  id              varchar(36) NOT NULL PRIMARY KEY,
  enabled         smallint NOT NULL DEFAULT 0,
  posts_per_day   integer NOT NULL DEFAULT 1,
  run_hours       varchar(120) NOT NULL DEFAULT '3',
  with_image      smallint NOT NULL DEFAULT 1,
  master_prompt   text NOT NULL DEFAULT '',
  topic_pool      text NOT NULL DEFAULT '',
  category_id     varchar(36),
  author          varchar(191),
  publish_status  varchar(20) NOT NULL DEFAULT 'published',
  last_run_at     timestamp,
  next_topic_seed integer NOT NULL DEFAULT 0,
  total_generated integer NOT NULL DEFAULT 0,
  created_at      timestamp NOT NULL DEFAULT now(),
  updated_at      timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.autoblog_runs (
  id               varchar(36) NOT NULL PRIMARY KEY,
  trigger_source   varchar(40) NOT NULL DEFAULT 'cron',
  status           varchar(20) NOT NULL DEFAULT 'running',
  posts_requested  integer NOT NULL DEFAULT 0,
  posts_created    integer NOT NULL DEFAULT 0,
  post_ids         text NOT NULL DEFAULT '',
  error            text,
  details          text,
  started_at       timestamp NOT NULL DEFAULT now(),
  finished_at      timestamp
);
CREATE INDEX IF NOT EXISTS autoblog_runs_started_idx ON public.autoblog_runs(started_at);

-- ============ CONTACT ============
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id          varchar(36) NOT NULL PRIMARY KEY,
  name        varchar(191) NOT NULL,
  email       varchar(191),
  phone       varchar(60),
  subject     varchar(255),
  message     text NOT NULL,
  status      varchar(20) NOT NULL DEFAULT 'new',
  ip_address  varchar(64),
  created_at  timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contact_messages_created_idx ON public.contact_messages(created_at);

-- ============ ANALYTICS ============
CREATE TABLE IF NOT EXISTS public.site_visits (
  id          varchar(36) NOT NULL PRIMARY KEY,
  session_id  varchar(64) NOT NULL,
  path        varchar(500) NOT NULL,
  created_at  timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS site_visits_created_idx ON public.site_visits(created_at);
CREATE INDEX IF NOT EXISTS site_visits_session_idx ON public.site_visits(session_id);

CREATE TABLE IF NOT EXISTS public.site_presence (
  session_id  varchar(64) NOT NULL PRIMARY KEY,
  path        varchar(500) NOT NULL,
  last_seen   timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS site_presence_last_seen_idx ON public.site_presence(last_seen);

-- ============ SEO PROPOSALS ============
CREATE TABLE IF NOT EXISTS public.seo_proposals (
  id varchar(36) PRIMARY KEY,
  kind varchar(40) NOT NULL DEFAULT 'seo',
  action varchar(40) NOT NULL,
  target varchar(500) NOT NULL DEFAULT '',
  title varchar(500) NOT NULL DEFAULT '',
  detail text NOT NULL DEFAULT '',
  severity varchar(20) NOT NULL DEFAULT 'warning',
  before_json text NOT NULL DEFAULT '',
  after_json text NOT NULL DEFAULT '',
  status varchar(20) NOT NULL DEFAULT 'pending',
  error text NOT NULL DEFAULT '',
  source varchar(20) NOT NULL DEFAULT 'cron',
  created_at timestamp NOT NULL DEFAULT now(),
  decided_at timestamp,
  applied_at timestamp
);
CREATE INDEX IF NOT EXISTS seo_proposals_status_idx ON public.seo_proposals (status, created_at DESC);

-- ============ SCHEDULER ============
CREATE TABLE IF NOT EXISTS public.scheduler_runs (
  job VARCHAR(60) NOT NULL PRIMARY KEY,
  last_run_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_status VARCHAR(20),
  last_note TEXT
);

-- ============ CATALOG (امکانات/راهکارها) ============
CREATE TABLE IF NOT EXISTS public.catalog_categories (
  id          varchar(36) NOT NULL PRIMARY KEY,
  type        varchar(16) NOT NULL,
  name        varchar(160) NOT NULL,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamp NOT NULL DEFAULT now(),
  updated_at  timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.catalog_items (
  id           varchar(36) NOT NULL PRIMARY KEY,
  type         varchar(16) NOT NULL,
  category_id  varchar(36),
  slug         varchar(120) NOT NULL,
  icon         varchar(60) NOT NULL DEFAULT '',
  title        varchar(200) NOT NULL,
  short_desc   text NOT NULL DEFAULT '',
  description  text NOT NULL DEFAULT '',
  bullets_json text NOT NULL DEFAULT '[]',
  sort_order   integer NOT NULL DEFAULT 0,
  published    smallint NOT NULL DEFAULT 1,
  created_at   timestamp NOT NULL DEFAULT now(),
  updated_at   timestamp NOT NULL DEFAULT now()
);

-- ============ APPS ============
CREATE TABLE IF NOT EXISTS public.apps (
  id varchar(36) PRIMARY KEY,
  slug varchar(120) NOT NULL UNIQUE,
  platform varchar(16) NOT NULL DEFAULT 'ios',
  name varchar(160) NOT NULL,
  subtitle varchar(200) NOT NULL DEFAULT '',
  icon_url text NOT NULL DEFAULT '',
  short_desc text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  features_json text NOT NULL DEFAULT '[]',
  screenshots_json text NOT NULL DEFAULT '[]',
  version varchar(40) NOT NULL DEFAULT '',
  size varchar(40) NOT NULL DEFAULT '',
  min_os varchar(80) NOT NULL DEFAULT '',
  download_url text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  enabled smallint NOT NULL DEFAULT 1,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.app_download_clicks (
  id varchar(36) PRIMARY KEY,
  app_id varchar(36) NOT NULL,
  platform varchar(16) NOT NULL DEFAULT '',
  referrer text,
  user_agent varchar(400),
  created_at timestamp without time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS app_download_clicks_app_idx ON public.app_download_clicks(app_id, created_at);

-- ============ BACKUPS ============
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

-- ============ SEED (فقط اگر وجود نداشته باشد) ============
INSERT INTO public.autoblog_settings (id) VALUES ('11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;
