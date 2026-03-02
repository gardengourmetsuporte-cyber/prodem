
-- Add material/thickness/plate_size to production_projects
ALTER TABLE public.production_projects
  ADD COLUMN IF NOT EXISTS material text,
  ADD COLUMN IF NOT EXISTS thickness text,
  ADD COLUMN IF NOT EXISTS plate_size text;

-- Create production_groupings table
CREATE TABLE public.production_groupings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.production_projects(id) ON DELETE CASCADE,
  grouping_number int NOT NULL DEFAULT 1,
  material text,
  plate_size text,
  thickness text,
  total_cut_length text,
  processing_time text,
  cut_time text,
  movement_time text,
  perforation_time text,
  total_pieces int NOT NULL DEFAULT 0,
  unique_pieces int NOT NULL DEFAULT 0,
  notes text,
  unit_id uuid REFERENCES public.units(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create production_grouping_items table
CREATE TABLE public.production_grouping_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grouping_id uuid NOT NULL REFERENCES public.production_groupings(id) ON DELETE CASCADE,
  checklist_item_id uuid NOT NULL REFERENCES public.checklist_items(id) ON DELETE CASCADE,
  quantity int NOT NULL DEFAULT 1,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.production_groupings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_grouping_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for production_groupings
CREATE POLICY "Users can view groupings for their units"
  ON public.production_groupings FOR SELECT
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can insert groupings for their units"
  ON public.production_groupings FOR INSERT
  WITH CHECK (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can update groupings for their units"
  ON public.production_groupings FOR UPDATE
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can delete groupings for their units"
  ON public.production_groupings FOR DELETE
  USING (public.user_has_unit_access(auth.uid(), unit_id));

-- RLS policies for production_grouping_items (via grouping's unit_id)
CREATE POLICY "Users can view grouping items"
  ON public.production_grouping_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.production_groupings g
    WHERE g.id = grouping_id AND public.user_has_unit_access(auth.uid(), g.unit_id)
  ));

CREATE POLICY "Users can insert grouping items"
  ON public.production_grouping_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.production_groupings g
    WHERE g.id = grouping_id AND public.user_has_unit_access(auth.uid(), g.unit_id)
  ));

CREATE POLICY "Users can update grouping items"
  ON public.production_grouping_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.production_groupings g
    WHERE g.id = grouping_id AND public.user_has_unit_access(auth.uid(), g.unit_id)
  ));

CREATE POLICY "Users can delete grouping items"
  ON public.production_grouping_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.production_groupings g
    WHERE g.id = grouping_id AND public.user_has_unit_access(auth.uid(), g.unit_id)
  ));

-- Trigger for updated_at on production_groupings
CREATE TRIGGER update_production_groupings_updated_at
  BEFORE UPDATE ON public.production_groupings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
