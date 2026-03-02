
-- Add warehouse and production stock columns to inventory_items
ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS warehouse_stock numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS production_stock numeric DEFAULT 0;

-- Migrate existing data: all current_stock goes to warehouse
UPDATE public.inventory_items
SET warehouse_stock = COALESCE(current_stock, 0),
    production_stock = 0;

-- Add location column to stock_movements
ALTER TABLE public.stock_movements
  ADD COLUMN IF NOT EXISTS location text DEFAULT 'almoxarifado';

-- Add 'transferencia' as a valid movement type
-- Update the trigger to handle location-based stock
CREATE OR REPLACE FUNCTION public.update_stock_on_movement()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.type = 'entrada' THEN
    -- Entries go to the specified location (default: almoxarifado)
    IF COALESCE(NEW.location, 'almoxarifado') = 'producao' THEN
      UPDATE public.inventory_items
      SET production_stock = production_stock + NEW.quantity,
          current_stock = current_stock + NEW.quantity,
          updated_at = now()
      WHERE id = NEW.item_id;
    ELSE
      UPDATE public.inventory_items
      SET warehouse_stock = warehouse_stock + NEW.quantity,
          current_stock = current_stock + NEW.quantity,
          updated_at = now()
      WHERE id = NEW.item_id;
    END IF;
  ELSIF NEW.type = 'saida' THEN
    -- Exits from the specified location
    IF COALESCE(NEW.location, 'almoxarifado') = 'producao' THEN
      UPDATE public.inventory_items
      SET production_stock = GREATEST(0, production_stock - NEW.quantity),
          current_stock = GREATEST(0, current_stock - NEW.quantity),
          updated_at = now()
      WHERE id = NEW.item_id;
    ELSE
      UPDATE public.inventory_items
      SET warehouse_stock = GREATEST(0, warehouse_stock - NEW.quantity),
          current_stock = GREATEST(0, current_stock - NEW.quantity),
          updated_at = now()
      WHERE id = NEW.item_id;
    END IF;
  ELSIF NEW.type = 'transferencia' THEN
    -- Transfer from warehouse to production (or vice-versa)
    IF COALESCE(NEW.location, 'almoxarifado') = 'almoxarifado_to_producao' THEN
      UPDATE public.inventory_items
      SET warehouse_stock = GREATEST(0, warehouse_stock - NEW.quantity),
          production_stock = production_stock + NEW.quantity,
          updated_at = now()
      WHERE id = NEW.item_id;
    ELSIF COALESCE(NEW.location, '') = 'producao_to_almoxarifado' THEN
      UPDATE public.inventory_items
      SET production_stock = GREATEST(0, production_stock - NEW.quantity),
          warehouse_stock = warehouse_stock + NEW.quantity,
          updated_at = now()
      WHERE id = NEW.item_id;
    END IF;
    -- current_stock stays the same for transfers
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update reverse trigger too
CREATE OR REPLACE FUNCTION public.reverse_stock_on_movement_delete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.type = 'entrada' THEN
    IF COALESCE(OLD.location, 'almoxarifado') = 'producao' THEN
      UPDATE public.inventory_items
      SET production_stock = GREATEST(0, production_stock - OLD.quantity),
          current_stock = GREATEST(0, current_stock - OLD.quantity),
          updated_at = now()
      WHERE id = OLD.item_id;
    ELSE
      UPDATE public.inventory_items
      SET warehouse_stock = GREATEST(0, warehouse_stock - OLD.quantity),
          current_stock = GREATEST(0, current_stock - OLD.quantity),
          updated_at = now()
      WHERE id = OLD.item_id;
    END IF;
  ELSIF OLD.type = 'saida' THEN
    IF COALESCE(OLD.location, 'almoxarifado') = 'producao' THEN
      UPDATE public.inventory_items
      SET production_stock = production_stock + OLD.quantity,
          current_stock = current_stock + OLD.quantity,
          updated_at = now()
      WHERE id = OLD.item_id;
    ELSE
      UPDATE public.inventory_items
      SET warehouse_stock = warehouse_stock + OLD.quantity,
          current_stock = current_stock + OLD.quantity,
          updated_at = now()
      WHERE id = OLD.item_id;
    END IF;
  ELSIF OLD.type = 'transferencia' THEN
    IF COALESCE(OLD.location, '') = 'almoxarifado_to_producao' THEN
      UPDATE public.inventory_items
      SET warehouse_stock = warehouse_stock + OLD.quantity,
          production_stock = GREATEST(0, production_stock - OLD.quantity),
          updated_at = now()
      WHERE id = OLD.item_id;
    ELSIF COALESCE(OLD.location, '') = 'producao_to_almoxarifado' THEN
      UPDATE public.inventory_items
      SET production_stock = production_stock + OLD.quantity,
          warehouse_stock = GREATEST(0, warehouse_stock - OLD.quantity),
          updated_at = now()
      WHERE id = OLD.item_id;
    END IF;
  END IF;
  
  RETURN OLD;
END;
$function$;
