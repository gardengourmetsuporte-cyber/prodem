
-- Create production_projects table
CREATE TABLE public.production_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  project_number TEXT NOT NULL,
  description TEXT NOT NULL,
  client TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.production_projects ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view projects of their units"
  ON public.production_projects FOR SELECT
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can create projects in their units"
  ON public.production_projects FOR INSERT
  WITH CHECK (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can update projects in their units"
  ON public.production_projects FOR UPDATE
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can delete projects in their units"
  ON public.production_projects FOR DELETE
  USING (public.user_has_unit_access(auth.uid(), unit_id));

-- Add project_id to production_orders
ALTER TABLE public.production_orders
  ADD COLUMN project_id UUID REFERENCES public.production_projects(id) ON DELETE SET NULL;

-- Add machine_ref to checklist_completions
ALTER TABLE public.checklist_completions
  ADD COLUMN machine_ref TEXT;

-- Trigger for updated_at
CREATE TRIGGER update_production_projects_updated_at
  BEFORE UPDATE ON public.production_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
