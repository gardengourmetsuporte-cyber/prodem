
-- Drop the old unique constraint that doesn't include project_id
ALTER TABLE public.production_orders DROP CONSTRAINT IF EXISTS production_orders_unit_id_date_shift_key;

-- Add new unique constraint including project_id (with COALESCE for NULLs)
-- We already have the index idx_production_orders_unit_date_shift_project, so this is enough
