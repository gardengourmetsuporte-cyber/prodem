
-- Add industrial fields to checklist_items
ALTER TABLE public.checklist_items
  ADD COLUMN IF NOT EXISTS target_quantity integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS piece_dimensions text;

-- Add production tracking fields to checklist_completions
ALTER TABLE public.checklist_completions
  ADD COLUMN IF NOT EXISTS quantity_done integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
