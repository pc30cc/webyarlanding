CREATE TABLE public.seo_proposals (
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

CREATE INDEX seo_proposals_status_idx ON public.seo_proposals (status, created_at DESC);

GRANT ALL ON public.seo_proposals TO service_role;

ALTER TABLE public.seo_proposals ENABLE ROW LEVEL SECURITY;