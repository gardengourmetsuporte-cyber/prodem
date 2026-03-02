
-- Create production_orders table
CREATE TABLE public.production_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (unit_id, date)
);

-- Create production_order_items table
CREATE TABLE public.production_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.production_orders(id) ON DELETE CASCADE,
  checklist_item_id UUID NOT NULL REFERENCES public.checklist_items(id) ON DELETE CASCADE,
  quantity_ordered INTEGER NOT NULL DEFAULT 0,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (order_id, checklist_item_id)
);

-- Enable RLS
ALTER TABLE public.production_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_order_items ENABLE ROW LEVEL SECURITY;

-- RLS for production_orders
CREATE POLICY "Users can view production orders in their units"
ON public.production_orders FOR SELECT
TO authenticated
USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Admins can insert production orders"
ON public.production_orders FOR INSERT
TO authenticated
WITH CHECK (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Admins can update production orders"
ON public.production_orders FOR UPDATE
TO authenticated
USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Admins can delete production orders"
ON public.production_orders FOR DELETE
TO authenticated
USING (public.user_has_unit_access(auth.uid(), unit_id));

-- RLS for production_order_items
CREATE POLICY "Users can view production order items in their units"
ON public.production_order_items FOR SELECT
TO authenticated
USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Admins can insert production order items"
ON public.production_order_items FOR INSERT
TO authenticated
WITH CHECK (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Admins can update production order items"
ON public.production_order_items FOR UPDATE
TO authenticated
USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Admins can delete production order items"
ON public.production_order_items FOR DELETE
TO authenticated
USING (public.user_has_unit_access(auth.uid(), unit_id));

-- Trigger for updated_at
CREATE TRIGGER update_production_orders_updated_at
BEFORE UPDATE ON public.production_orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
