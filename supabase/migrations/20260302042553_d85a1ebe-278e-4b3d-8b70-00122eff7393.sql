
-- Add industrial fields to inventory_items
ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS material_type text,
  ADD COLUMN IF NOT EXISTS dimensions text,
  ADD COLUMN IF NOT EXISTS thickness text,
  ADD COLUMN IF NOT EXISTS technical_spec text,
  ADD COLUMN IF NOT EXISTS internal_code text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS weight_per_unit numeric;

-- Extend unit_type enum with metro and metro_quadrado
ALTER TYPE public.unit_type ADD VALUE IF NOT EXISTS 'metro';
ALTER TYPE public.unit_type ADD VALUE IF NOT EXISTS 'metro_quadrado';
