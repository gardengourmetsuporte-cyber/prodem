
-- 1. Add process_type and material fields to checklist_items
ALTER TABLE public.checklist_items
  ADD COLUMN IF NOT EXISTS process_type text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cut_length_mm numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS qty_per_rack integer DEFAULT NULL;

-- 2. Add sequential order_number to production_orders
CREATE SEQUENCE IF NOT EXISTS public.production_order_number_seq START 1300;

ALTER TABLE public.production_orders
  ADD COLUMN IF NOT EXISTS order_number integer DEFAULT nextval('public.production_order_number_seq'),
  ADD COLUMN IF NOT EXISTS destination text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS requester text DEFAULT NULL;

-- 3. Create production_operations table (multi-step tracking per piece)
CREATE TABLE IF NOT EXISTS public.production_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  completion_id uuid NOT NULL REFERENCES public.checklist_completions(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES public.units(id),
  step_order integer NOT NULL DEFAULT 1,
  process_type text NOT NULL,
  operator_id uuid DEFAULT NULL,
  machine_ref text DEFAULT NULL,
  quantity_done integer NOT NULL DEFAULT 0,
  started_at timestamptz DEFAULT NULL,
  finished_at timestamptz DEFAULT NULL,
  notes text DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.production_operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view operations in their units"
  ON public.production_operations FOR SELECT
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Authenticated users can insert operations"
  ON public.production_operations FOR INSERT
  WITH CHECK (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Authenticated users can update operations"
  ON public.production_operations FOR UPDATE
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Authenticated users can delete operations"
  ON public.production_operations FOR DELETE
  USING (public.user_has_unit_access(auth.uid(), unit_id));

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_production_operations_completion ON public.production_operations(completion_id);
CREATE INDEX IF NOT EXISTS idx_production_operations_unit ON public.production_operations(unit_id);

-- 4. Create production_shipments table (expedition tracking)
CREATE TABLE IF NOT EXISTS public.production_shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.production_orders(id) ON DELETE CASCADE,
  checklist_item_id uuid NOT NULL REFERENCES public.checklist_items(id),
  unit_id uuid REFERENCES public.units(id),
  quantity_shipped integer NOT NULL DEFAULT 0,
  destination text DEFAULT NULL,
  requester text DEFAULT NULL,
  shipped_by uuid DEFAULT NULL,
  shipped_at timestamptz NOT NULL DEFAULT now(),
  notes text DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.production_shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view shipments in their units"
  ON public.production_shipments FOR SELECT
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Authenticated users can insert shipments"
  ON public.production_shipments FOR INSERT
  WITH CHECK (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Authenticated users can update shipments"
  ON public.production_shipments FOR UPDATE
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Authenticated users can delete shipments"
  ON public.production_shipments FOR DELETE
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE INDEX IF NOT EXISTS idx_production_shipments_order ON public.production_shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_production_shipments_item ON public.production_shipments(checklist_item_id);

-- 5. Make order_number unique
ALTER TABLE public.production_orders ADD CONSTRAINT production_orders_order_number_key UNIQUE (order_number);
