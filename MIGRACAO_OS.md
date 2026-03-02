# Arquivo copiado de migration SQL para o user rodar direto do Supabase Studio UI.

1. Acesse o Supabase vinculado a este projeto.
2. Vá no `SQL Editor` (na barra esquerda).
3. Clique em "New Query".
4. Cole o código abaixo e clique em RUN.

```sql
-- Step 1: Add a project_id column to the production_order_items table
ALTER TABLE public.production_order_items 
ADD COLUMN IF NOT EXISTS project_id uuid references public.production_projects(id) on delete cascade;

-- Step 2: Ensure order_id is no longer strictly required (since we might insert just with project_id in the future)
ALTER TABLE public.production_order_items 
ALTER COLUMN order_id DROP NOT NULL;

-- Step 3: Add an index for fetching items by project_id
CREATE INDEX IF NOT EXISTS idx_prod_order_items_project_id ON public.production_order_items(project_id);

-- Step 4: Add a project_id column to checklist_completions so it can optionally tie into a project_id for scoping progress
ALTER TABLE public.checklist_completions 
ADD COLUMN IF NOT EXISTS project_id uuid references public.production_projects(id) on delete cascade;

-- Create an index to quickly find completions by project
CREATE INDEX IF NOT EXISTS idx_chk_completions_project_id ON public.checklist_completions(project_id);
```
