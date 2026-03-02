
-- Add quantity_shipped to checklist_completions for expedition tracking
ALTER TABLE public.checklist_completions 
ADD COLUMN IF NOT EXISTS quantity_shipped integer NOT NULL DEFAULT 0;

-- Add shipped_at, shipped_by for expedition audit
ALTER TABLE public.checklist_completions 
ADD COLUMN IF NOT EXISTS shipped_at timestamptz DEFAULT NULL;

ALTER TABLE public.checklist_completions 
ADD COLUMN IF NOT EXISTS shipped_by uuid DEFAULT NULL;

-- Enable realtime on production_orders for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.production_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.production_order_items;
