-- Drop the old unique constraint (unit_id, date) and replace with (unit_id, date, shift)
ALTER TABLE production_orders DROP CONSTRAINT production_orders_unit_id_date_key;
ALTER TABLE production_orders ADD CONSTRAINT production_orders_unit_id_date_shift_key UNIQUE (unit_id, date, shift);