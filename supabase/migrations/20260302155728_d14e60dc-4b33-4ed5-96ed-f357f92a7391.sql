
-- Drop the old unique index that doesn't account for project_id
DROP INDEX IF EXISTS idx_production_orders_unit_date_shift;

-- Create new unique index that includes project_id (using COALESCE for NULL safety)
CREATE UNIQUE INDEX idx_production_orders_unit_date_shift_project
ON public.production_orders (unit_id, date, shift, COALESCE(project_id, '00000000-0000-0000-0000-000000000000'));
