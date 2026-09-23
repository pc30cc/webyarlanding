CREATE TABLE public.apps (
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
GRANT ALL ON public.apps TO service_role;
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.app_download_clicks (
  id varchar(36) PRIMARY KEY,
  app_id varchar(36) NOT NULL,
  platform varchar(16) NOT NULL DEFAULT '',
  referrer text,
  user_agent varchar(400),
  created_at timestamp without time zone NOT NULL DEFAULT now()
);
CREATE INDEX app_download_clicks_app_idx ON public.app_download_clicks(app_id, created_at);
GRANT ALL ON public.app_download_clicks TO service_role;
ALTER TABLE public.app_download_clicks ENABLE ROW LEVEL SECURITY;

INSERT INTO public.apps (id, slug, platform, name, subtitle, short_desc, description, features_json, version, size, min_os, sort_order) VALUES
('a1000000-0000-4000-8000-000000000001','webyar-ios','ios','وب‌یار برای آیفون','صندوق گفتگو و تماس، در جیب شما','پاسخ به چت‌ها، تماس صوتی و تصویری و ایمیل مشتریان از روی آیفون؛ با اعلان لحظه‌ای.','اپلیکیشن نیتیو وب‌یار برای iOS با SwiftUI ساخته شده تا اپراتورها هر جا که هستند به مشتریان پاسخ دهند. صف گفتگوها، چت با پیوست و پیام صوتی، پاسخ‌های آماده، تماس صوتی و تصویری، صندوق ایمیل، مخاطبین با اطلاعات دستگاه و موقعیت بازدیدکننده، گفتگوی تیمی با همکاران و تنظیمات اعلان — همه با رابط راست‌چین و تقویم شمسی.','["صندوق گفتگوی یکپارچه با صف زنده","چت با پیوست، پیام صوتی و ایموجی","تماس صوتی و تصویری با کیفیت بالا","تحویل گفتگو به ایجنت هوش مصنوعی","اعلان لحظه‌ای برای پیام و تماس جدید","صندوق ایمیل و پاسخ از داخل اپ","مخاطبین با دستگاه و موقعیت بازدیدکننده","گفتگوی تیمی با همکاران"]','1.1.1','۲۸ مگابایت','iOS 17 به بالا',1),
('a1000000-0000-4000-8000-000000000002','webyar-android','android','وب‌یار برای اندروید','همه کانال‌ها، یک اپ اندرویدی','اپ نیتیو اندروید برای پاسخ‌گویی سریع به چت، تماس و ایمیل مشتریان با اعلان لحظه‌ای.','اپلیکیشن نیتیو وب‌یار برای اندروید با Jetpack Compose ساخته شده و روی گوشی‌ها و تبلت‌های اندرویدی سریع و سبک اجرا می‌شود. گفتگوها را از صف بردارید، با مشتری تماس تصویری بگیرید، ایمیل‌ها را پاسخ دهید، وضعیت و اولویت و برچسب گفتگو را تغییر دهید و با همکاران هماهنگ شوید.','["صف گفتگوها و صندوق هر کانال","چت با فایل، تصویر و پیام صوتی","تماس صوتی و تصویری داخل اپ","وضعیت، اولویت، انتقال و برچسب گفتگو","یادداشت داخلی برای تیم","اعلان پیام و تماس حتی در پس‌زمینه","صندوق ایمیل","مدیریت نشست‌ها و امنیت حساب"]','1.1.1','۲۲ مگابایت','Android 7.0 به بالا',2),
('a1000000-0000-4000-8000-000000000003','webyar-windows','windows','وب‌یار برای ویندوز','میز کار حرفه‌ای اپراتور','اپ دسکتاپ ویندوز با چیدمان سه‌ستونه، جستجوی سریع و اعلان‌های ویندوز.','نسخه ویندوز وب‌یار همه امکانات اپ موبایل را با قدرت دسکتاپ ارائه می‌دهد: چیدمان سه‌ستونه با پنل جزئیات، جستجوی سراسری با Ctrl+K، ناوبری با کیبورد، کشیدن و رها کردن فایل، پاسخ آماده با «/»، اعلان‌های ویندوز و نشان روی نوار وظیفه، اجرا در سینی سیستم و شروع خودکار با ویندوز.','["چیدمان سه‌ستونه با پنل جزئیات","جستجوی سراسری با Ctrl+K","پاسخ آماده با کلید /","کشیدن و رها کردن فایل","تماس صوتی و تصویری","اعلان ویندوز و نشان نوار وظیفه","اجرا در سینی سیستم","ذخیره امن نشست با رمزنگاری ویندوز"]','1.1.1','۹۵ مگابایت','Windows 10 و 11 (۶۴ بیتی)',3);