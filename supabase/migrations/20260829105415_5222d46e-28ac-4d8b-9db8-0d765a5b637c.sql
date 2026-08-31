-- ============ WIPE ============
DROP TABLE IF EXISTS public.blog_post_tags CASCADE;
DROP TABLE IF EXISTS public.blog_posts CASCADE;
DROP TABLE IF EXISTS public.blog_tags CASCADE;
DROP TABLE IF EXISTS public.blog_categories CASCADE;
DROP TABLE IF EXISTS public.media_assets CASCADE;
DROP TABLE IF EXISTS public.site_settings CASCADE;
DROP TABLE IF EXISTS public.autoblog_runs CASCADE;
DROP TABLE IF EXISTS public.autoblog_settings CASCADE;
DROP TABLE IF EXISTS public.admin_login_attempts CASCADE;
DROP TABLE IF EXISTS public.admin_accounts CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP FUNCTION IF EXISTS public.get_public_site_settings() CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role) CASCADE;
DROP FUNCTION IF EXISTS public.save_site_settings(jsonb, jsonb, text) CASCADE;
DROP FUNCTION IF EXISTS public.slugify_tag(text) CASCADE;
DROP FUNCTION IF EXISTS public.sync_post_tags(uuid, text[], text) CASCADE;
DROP FUNCTION IF EXISTS public.upsert_blog_tag(text, text) CASCADE;
DROP FUNCTION IF EXISTS public.validate_autoblog_run_hours() CASCADE;
DROP FUNCTION IF EXISTS public.tg_set_updated_at() CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;

-- ============ USERS ============
CREATE TABLE public.users (
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
CREATE UNIQUE INDEX users_email_idx ON public.users(email);
GRANT ALL ON public.users TO service_role;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_sessions (
  id          varchar(36) NOT NULL PRIMARY KEY,
  user_id     varchar(36) NOT NULL,
  token_hash  varchar(128) NOT NULL,
  expires_at  timestamp NOT NULL,
  ip_address  varchar(64),
  user_agent  varchar(500),
  created_at  timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX user_sessions_token_idx ON public.user_sessions(token_hash);
CREATE INDEX user_sessions_user_idx ON public.user_sessions(user_id);
GRANT ALL ON public.user_sessions TO service_role;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.login_attempts (
  id          varchar(36) NOT NULL PRIMARY KEY,
  email       varchar(191) NOT NULL,
  success     smallint NOT NULL DEFAULT 0,
  reason      varchar(191),
  ip_address  varchar(64),
  user_agent  varchar(500),
  created_at  timestamp NOT NULL DEFAULT now()
);
CREATE INDEX login_attempts_created_idx ON public.login_attempts(created_at);
GRANT ALL ON public.login_attempts TO service_role;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- ============ SETTINGS (key/value) ============
CREATE TABLE public.settings (
  id             varchar(36) NOT NULL PRIMARY KEY,
  setting_key    varchar(120) NOT NULL,
  setting_value  text NOT NULL DEFAULT '',
  is_private     smallint NOT NULL DEFAULT 0,
  updated_at     timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX settings_key_idx ON public.settings(setting_key);
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- ============ BLOG ============
CREATE TABLE public.blog_categories (
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
CREATE UNIQUE INDEX blog_categories_slug_idx ON public.blog_categories(slug);
GRANT ALL ON public.blog_categories TO service_role;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.blog_tags (
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
CREATE UNIQUE INDEX blog_tags_slug_idx ON public.blog_tags(slug);
GRANT ALL ON public.blog_tags TO service_role;
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.blog_posts (
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
CREATE UNIQUE INDEX blog_posts_slug_idx ON public.blog_posts(slug);
CREATE INDEX blog_posts_status_idx ON public.blog_posts(status);
CREATE INDEX blog_posts_category_idx ON public.blog_posts(category_id);
GRANT ALL ON public.blog_posts TO service_role;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.blog_post_tags (
  post_id     varchar(36) NOT NULL,
  tag_id      varchar(36) NOT NULL,
  created_at  timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, tag_id)
);
CREATE INDEX blog_post_tags_tag_idx ON public.blog_post_tags(tag_id);
GRANT ALL ON public.blog_post_tags TO service_role;
ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;

-- ============ MEDIA ============
CREATE TABLE public.media_assets (
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
CREATE INDEX media_assets_created_idx ON public.media_assets(created_at);
GRANT ALL ON public.media_assets TO service_role;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- ============ SEO PAGES ============
CREATE TABLE public.seo_pages (
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
CREATE UNIQUE INDEX seo_pages_key_idx ON public.seo_pages(page_key);
GRANT ALL ON public.seo_pages TO service_role;
ALTER TABLE public.seo_pages ENABLE ROW LEVEL SECURITY;

-- ============ AUTOBLOG ============
CREATE TABLE public.autoblog_settings (
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
GRANT ALL ON public.autoblog_settings TO service_role;
ALTER TABLE public.autoblog_settings ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.autoblog_runs (
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
CREATE INDEX autoblog_runs_started_idx ON public.autoblog_runs(started_at);
GRANT ALL ON public.autoblog_runs TO service_role;
ALTER TABLE public.autoblog_runs ENABLE ROW LEVEL SECURITY;

-- ============ CONTACT ============
CREATE TABLE public.contact_messages (
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
CREATE INDEX contact_messages_created_idx ON public.contact_messages(created_at);
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- ============ SEED ============
INSERT INTO public.autoblog_settings (id) VALUES ('11111111-1111-1111-1111-111111111111');
