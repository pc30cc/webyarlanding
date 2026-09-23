CREATE TABLE public.scheduler_runs (
  job VARCHAR(60) NOT NULL PRIMARY KEY,
  last_run_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_status VARCHAR(20),
  last_note TEXT
);
GRANT ALL ON public.scheduler_runs TO service_role;
ALTER TABLE public.scheduler_runs ENABLE ROW LEVEL SECURITY;