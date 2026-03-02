-- Add pin_code column to employees for production floor authentication
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS pin_code text;

-- Create index for fast PIN lookup
CREATE INDEX IF NOT EXISTS idx_employees_pin_unit ON public.employees (unit_id, pin_code) WHERE pin_code IS NOT NULL;