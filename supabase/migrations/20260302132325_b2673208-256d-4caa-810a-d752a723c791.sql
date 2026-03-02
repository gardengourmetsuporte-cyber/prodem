
-- Add material_code column to checklist_items
ALTER TABLE public.checklist_items ADD COLUMN IF NOT EXISTS material_code text;

-- Add index for material_code lookups
CREATE INDEX IF NOT EXISTS idx_checklist_items_material_code ON public.checklist_items(material_code) WHERE material_code IS NOT NULL;
