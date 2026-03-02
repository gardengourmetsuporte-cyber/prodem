
-- Add finished_by column to track who finished a task (may differ from operator_id who started it)
ALTER TABLE public.production_logs 
ADD COLUMN IF NOT EXISTS finished_by UUID NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.production_logs.finished_by IS 'UUID of the employee who finished the task (supports multi-shift handoff)';
