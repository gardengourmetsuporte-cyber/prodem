
-- 1. Add 'lider' role to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'lider';

-- 2. Add approval status to profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
    CREATE TYPE public.user_status AS ENUM ('pending', 'approved', 'suspended');
  END IF;
END$$;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status public.user_status NOT NULL DEFAULT 'pending';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approved_at timestamptz;

-- 3. Mark existing users as approved (they're already active)
UPDATE public.profiles SET status = 'approved' WHERE status = 'pending';

-- 4. Update handle_new_user to set status = 'pending' by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  validated_full_name text;
BEGIN
  validated_full_name := COALESCE(
    LEFT(TRIM(NEW.raw_user_meta_data->>'full_name'), 255),
    LEFT(TRIM(SPLIT_PART(NEW.email, '@', 1)), 255)
  );
  
  IF validated_full_name IS NULL OR validated_full_name = '' THEN
    validated_full_name := 'User';
  END IF;
  
  -- Create profile with pending status
  INSERT INTO public.profiles (user_id, full_name, status)
  VALUES (NEW.id, validated_full_name, 'pending');
  
  -- Assign default role (funcionario) - never allow role specification via metadata
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'funcionario');
  
  RETURN NEW;
END;
$function$;

-- 5. Create sector_modules table to link departments to modules
CREATE TABLE IF NOT EXISTS public.sector_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  sector_name text NOT NULL,
  description text,
  modules text[] NOT NULL DEFAULT '{}',
  color text NOT NULL DEFAULT '#3b82f6',
  icon text DEFAULT 'Building2',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(unit_id, sector_name)
);

ALTER TABLE public.sector_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sector_modules for their units"
ON public.sector_modules FOR SELECT
USING (unit_id IN (SELECT get_user_unit_ids(auth.uid())));

CREATE POLICY "Admins can manage sector_modules"
ON public.sector_modules FOR ALL
USING (
  unit_id IN (SELECT get_user_unit_ids(auth.uid()))
  AND has_role(auth.uid(), 'admin')
);

-- 6. Add sector_id to user_units to link users to departments
ALTER TABLE public.user_units ADD COLUMN IF NOT EXISTS sector_module_id uuid REFERENCES public.sector_modules(id) ON DELETE SET NULL;

-- 7. Seed default industrial sectors for existing units
INSERT INTO public.sector_modules (unit_id, sector_name, description, modules, color, icon, sort_order)
SELECT 
  u.id,
  s.sector_name,
  s.description,
  s.modules,
  s.color,
  s.icon,
  s.sort_order
FROM public.units u
CROSS JOIN (VALUES
  ('Administração', 'Acesso completo a todos os módulos', 
   ARRAY['dashboard','checklists','inventory','orders','finance','employees','customers','cash-closing','agenda','ranking','rewards','copilot','recipes','marketing','settings'],
   '#3b82f6', 'Shield', 0),
  ('Produção', 'Checklists, estoque e fichas técnicas',
   ARRAY['dashboard','checklists','inventory','recipes','ranking','rewards'],
   '#f59e0b', 'Factory', 1),
  ('Logística', 'Estoque, pedidos e recebimento',
   ARRAY['dashboard','inventory','orders','recipes'],
   '#22c55e', 'Truck', 2),
  ('Comercial', 'Clientes, marketing e financeiro',
   ARRAY['dashboard','customers','marketing','finance','orders'],
   '#8b5cf6', 'Briefcase', 3)
) AS s(sector_name, description, modules, color, icon, sort_order)
ON CONFLICT (unit_id, sector_name) DO NOTHING;

-- 8. Function to approve user
CREATE OR REPLACE FUNCTION public.approve_user(
  p_target_user_id uuid,
  p_role app_role DEFAULT 'funcionario',
  p_unit_id uuid DEFAULT NULL,
  p_sector_module_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only admins can approve
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: only admins can approve users';
  END IF;

  -- Update profile status
  UPDATE profiles 
  SET status = 'approved', 
      approved_by = auth.uid(), 
      approved_at = now(),
      updated_at = now()
  WHERE user_id = p_target_user_id;

  -- Update role
  DELETE FROM user_roles WHERE user_id = p_target_user_id;
  INSERT INTO user_roles (user_id, role) VALUES (p_target_user_id, p_role);

  -- If unit specified, ensure user is in unit with sector
  IF p_unit_id IS NOT NULL THEN
    INSERT INTO user_units (user_id, unit_id, is_default, role, sector_module_id)
    VALUES (p_target_user_id, p_unit_id, true, 
      CASE WHEN p_role = 'admin' THEN 'admin' WHEN p_role = 'lider' THEN 'admin' ELSE 'member' END,
      p_sector_module_id)
    ON CONFLICT (user_id, unit_id) 
    DO UPDATE SET sector_module_id = p_sector_module_id, role = EXCLUDED.role;
  END IF;
END;
$function$;

-- 9. Function to suspend user
CREATE OR REPLACE FUNCTION public.suspend_user(p_target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE profiles SET status = 'suspended', updated_at = now() WHERE user_id = p_target_user_id;
END;
$function$;
