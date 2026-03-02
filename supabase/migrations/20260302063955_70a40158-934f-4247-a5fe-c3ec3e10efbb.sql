
-- Add shift column to production_orders (1 = Turno 1, 2 = Turno 2)
ALTER TABLE public.production_orders ADD COLUMN shift integer NOT NULL DEFAULT 1;

-- Create unique constraint: one order per unit+date+shift
CREATE UNIQUE INDEX idx_production_orders_unit_date_shift 
  ON public.production_orders (unit_id, date, shift);
