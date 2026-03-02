
-- =============================================
-- 1. production_pieces
-- =============================================
CREATE TABLE public.production_pieces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.production_projects(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  material_code text,
  description text NOT NULL,
  cut_length_mm numeric,
  qty_per_rack integer DEFAULT 0,
  qty_total integer NOT NULL DEFAULT 1,
  process_type text DEFAULT 'SERRA',
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.production_pieces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pp_select" ON public.production_pieces FOR SELECT
  USING (public.user_has_unit_access(auth.uid(), unit_id));
CREATE POLICY "pp_insert" ON public.production_pieces FOR INSERT
  WITH CHECK (public.user_has_unit_access(auth.uid(), unit_id));
CREATE POLICY "pp_update" ON public.production_pieces FOR UPDATE
  USING (public.user_has_unit_access(auth.uid(), unit_id));
CREATE POLICY "pp_delete" ON public.production_pieces FOR DELETE
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE INDEX idx_production_pieces_project ON public.production_pieces(project_id);
CREATE INDEX idx_production_pieces_unit ON public.production_pieces(unit_id);

CREATE TRIGGER update_production_pieces_updated_at
  BEFORE UPDATE ON public.production_pieces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 2. production_logs
-- =============================================
CREATE TABLE public.production_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  piece_id uuid NOT NULL REFERENCES public.production_pieces(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.production_projects(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  operation text NOT NULL,
  started_at timestamptz DEFAULT now(),
  finished_at timestamptz,
  quantity_done integer NOT NULL DEFAULT 0,
  operator_id uuid,
  machine_ref text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.production_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pl_select" ON public.production_logs FOR SELECT
  USING (public.user_has_unit_access(auth.uid(), unit_id));
CREATE POLICY "pl_insert" ON public.production_logs FOR INSERT
  WITH CHECK (public.user_has_unit_access(auth.uid(), unit_id));
CREATE POLICY "pl_update" ON public.production_logs FOR UPDATE
  USING (public.user_has_unit_access(auth.uid(), unit_id));
CREATE POLICY "pl_delete" ON public.production_logs FOR DELETE
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE INDEX idx_production_logs_piece ON public.production_logs(piece_id);
CREATE INDEX idx_production_logs_project ON public.production_logs(project_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.production_logs;

-- =============================================
-- 3. Recreate production_shipments
-- =============================================
DROP TABLE IF EXISTS public.production_shipments CASCADE;

CREATE TABLE public.production_shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  piece_id uuid NOT NULL REFERENCES public.production_pieces(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.production_projects(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 0,
  shipped_at timestamptz DEFAULT now(),
  operator_id uuid,
  destination text,
  requester text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.production_shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ps_select" ON public.production_shipments FOR SELECT
  USING (public.user_has_unit_access(auth.uid(), unit_id));
CREATE POLICY "ps_insert" ON public.production_shipments FOR INSERT
  WITH CHECK (public.user_has_unit_access(auth.uid(), unit_id));
CREATE POLICY "ps_update" ON public.production_shipments FOR UPDATE
  USING (public.user_has_unit_access(auth.uid(), unit_id));
CREATE POLICY "ps_delete" ON public.production_shipments FOR DELETE
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE INDEX idx_production_shipments_piece ON public.production_shipments(piece_id);
CREATE INDEX idx_production_shipments_project ON public.production_shipments(project_id);
