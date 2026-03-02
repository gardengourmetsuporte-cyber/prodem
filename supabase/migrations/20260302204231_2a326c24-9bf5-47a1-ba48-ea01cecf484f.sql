
-- Add project_id column to production_order_items (replacing reliance on order_id)
ALTER TABLE public.production_order_items 
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.production_projects(id) ON DELETE CASCADE;

-- Backfill project_id from the associated production_order
UPDATE public.production_order_items poi
SET project_id = po.project_id
FROM public.production_orders po
WHERE poi.order_id = po.id
  AND po.project_id IS NOT NULL
  AND poi.project_id IS NULL;

-- Make order_id nullable since new flow doesn't use orders
ALTER TABLE public.production_order_items ALTER COLUMN order_id DROP NOT NULL;

-- Add project_id column to checklist_completions
ALTER TABLE public.checklist_completions 
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.production_projects(id) ON DELETE SET NULL;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_production_order_items_project_id ON public.production_order_items(project_id);
CREATE INDEX IF NOT EXISTS idx_checklist_completions_project_id ON public.checklist_completions(project_id);
