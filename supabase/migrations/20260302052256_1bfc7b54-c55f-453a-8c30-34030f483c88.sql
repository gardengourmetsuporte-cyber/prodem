
ALTER TABLE public.checklist_completions
  ADD COLUMN started_at timestamptz,
  ADD COLUMN finished_at timestamptz;
