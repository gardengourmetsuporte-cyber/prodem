-- Drop the ambiguous overload (the one WITHOUT p_old_values)
DROP FUNCTION IF EXISTS public.log_audit_event(uuid, uuid, text, text, uuid, jsonb);
