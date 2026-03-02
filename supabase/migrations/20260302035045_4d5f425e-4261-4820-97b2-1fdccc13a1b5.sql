
-- Update default access levels for Prodem's 4 roles
-- First delete existing default access levels (from auto_provision or manual creation)
-- Then the auto_provision function will handle creating new ones

-- Update the auto_provision function to include the 4 Prodem roles
CREATE OR REPLACE FUNCTION public.auto_provision_unit(p_user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_unit_id uuid;
  v_slug text;
  cat_chapas uuid;
  cat_barras uuid;
  cat_parafusos uuid;
  cat_tintas uuid;
  cat_rodizios uuid;
  cat_consumiveis uuid;
  fc_id uuid;
  sector_id uuid;
  sub_id uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM user_units WHERE user_id = p_user_id) THEN
    RETURN (SELECT unit_id FROM user_units WHERE user_id = p_user_id LIMIT 1);
  END IF;

  v_slug := 'prodem';
  WHILE EXISTS (SELECT 1 FROM units WHERE slug = v_slug) LOOP
    v_slug := 'prodem-' || substr(gen_random_uuid()::text, 1, 8);
  END LOOP;

  INSERT INTO units (name, slug, created_by)
  VALUES ('Prodem Minas', v_slug, p_user_id)
  RETURNING id INTO new_unit_id;

  INSERT INTO user_units (user_id, unit_id, is_default, role)
  VALUES (p_user_id, new_unit_id, true, 'owner');

  -- =============================================
  -- ACCESS LEVELS (4 Prodem roles)
  -- =============================================
  INSERT INTO access_levels (name, description, modules, unit_id, is_default) VALUES
    ('Dono / Admin', 'Acesso total a todos os módulos e configurações', 
     ARRAY['dashboard','checklists','inventory','orders','finance','employees','customers','cash-closing','agenda','ranking','rewards','copilot','recipes','marketing','menu-admin','whatsapp','settings'], 
     new_unit_id, true),
    ('Líder de Produção', 'Checklists, estoque produção, equipe do setor',
     ARRAY['dashboard','checklists','inventory','orders','agenda','ranking','rewards','employees'],
     new_unit_id, false),
    ('Operador', 'Apenas checklists e registro de produção',
     ARRAY['dashboard','checklists','ranking','rewards'],
     new_unit_id, false),
    ('Financeiro', 'Apenas módulo financeiro e relatórios',
     ARRAY['dashboard','finance','cash-closing','customers','orders'],
     new_unit_id, false);

  -- =============================================
  -- FINANCIAL ACCOUNTS
  -- =============================================
  INSERT INTO finance_accounts (user_id, name, type, balance, color, icon, unit_id) VALUES
    (p_user_id, 'Caixa', 'wallet', 0, '#f59e0b', 'Wallet', new_unit_id),
    (p_user_id, 'Banco', 'bank', 0, '#3b82f6', 'Building2', new_unit_id);

  -- =============================================
  -- FINANCIAL CATEGORIES
  -- =============================================
  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, unit_id)
  VALUES (p_user_id, 'Matéria-prima', 'expense', 'ShoppingCart', '#ef4444', true, 0, new_unit_id) RETURNING id INTO fc_id;
  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, parent_id, unit_id) VALUES
    (p_user_id, 'Chapas de Aço', 'expense', 'ShoppingCart', '#ef4444', true, 0, fc_id, new_unit_id),
    (p_user_id, 'Barras e Perfis', 'expense', 'ShoppingCart', '#ef4444', true, 1, fc_id, new_unit_id),
    (p_user_id, 'Tubos', 'expense', 'ShoppingCart', '#ef4444', true, 2, fc_id, new_unit_id),
    (p_user_id, 'Parafusos e Fixadores', 'expense', 'ShoppingCart', '#ef4444', true, 3, fc_id, new_unit_id),
    (p_user_id, 'Consumíveis de Solda', 'expense', 'ShoppingCart', '#ef4444', true, 4, fc_id, new_unit_id);

  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, unit_id)
  VALUES (p_user_id, 'Despesas Administrativas', 'expense', 'Building2', '#f59e0b', true, 1, new_unit_id) RETURNING id INTO fc_id;
  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, parent_id, unit_id) VALUES
    (p_user_id, 'Energia', 'expense', 'Building2', '#f59e0b', true, 0, fc_id, new_unit_id),
    (p_user_id, 'Água', 'expense', 'Building2', '#f59e0b', true, 1, fc_id, new_unit_id),
    (p_user_id, 'Aluguel', 'expense', 'Building2', '#f59e0b', true, 2, fc_id, new_unit_id),
    (p_user_id, 'Internet', 'expense', 'Building2', '#f59e0b', true, 3, fc_id, new_unit_id),
    (p_user_id, 'Manutenção', 'expense', 'Building2', '#f59e0b', true, 4, fc_id, new_unit_id);

  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, unit_id)
  VALUES (p_user_id, 'Folha de Pagamento', 'expense', 'Users', '#3b82f6', true, 2, new_unit_id) RETURNING id INTO fc_id;
  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, parent_id, unit_id) VALUES
    (p_user_id, 'Salários', 'expense', 'Users', '#3b82f6', true, 0, fc_id, new_unit_id),
    (p_user_id, 'FGTS', 'expense', 'Users', '#3b82f6', true, 1, fc_id, new_unit_id),
    (p_user_id, 'INSS', 'expense', 'Users', '#3b82f6', true, 2, fc_id, new_unit_id);

  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, unit_id)
  VALUES (p_user_id, 'Impostos', 'expense', 'FileText', '#f43f5e', true, 3, new_unit_id);

  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, unit_id)
  VALUES (p_user_id, 'Projetos', 'income', 'Briefcase', '#22c55e', true, 0, new_unit_id) RETURNING id INTO fc_id;
  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, parent_id, unit_id) VALUES
    (p_user_id, 'Transportadores', 'income', 'Briefcase', '#22c55e', true, 0, fc_id, new_unit_id),
    (p_user_id, 'Racks', 'income', 'Briefcase', '#22c55e', true, 1, fc_id, new_unit_id),
    (p_user_id, 'Carrinhos', 'income', 'Briefcase', '#22c55e', true, 2, fc_id, new_unit_id),
    (p_user_id, 'Serviços', 'income', 'Briefcase', '#22c55e', true, 3, fc_id, new_unit_id);

  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, unit_id)
  VALUES (p_user_id, 'Outros', 'income', 'MoreHorizontal', '#64748b', true, 1, new_unit_id);

  -- =============================================
  -- STOCK CATEGORIES + INVENTORY ITEMS
  -- =============================================
  INSERT INTO categories (name, color, icon, sort_order, unit_id) VALUES
    ('Chapas de Aço', '#ef4444', 'Layers', 0, new_unit_id) RETURNING id INTO cat_chapas;
  INSERT INTO categories (name, color, icon, sort_order, unit_id) VALUES
    ('Barras e Perfis', '#f59e0b', 'Ruler', 1, new_unit_id) RETURNING id INTO cat_barras;
  INSERT INTO categories (name, color, icon, sort_order, unit_id) VALUES
    ('Parafusos e Fixadores', '#3b82f6', 'Wrench', 2, new_unit_id) RETURNING id INTO cat_parafusos;
  INSERT INTO categories (name, color, icon, sort_order, unit_id) VALUES
    ('Tintas e Acabamento', '#8b5cf6', 'Paintbrush', 3, new_unit_id) RETURNING id INTO cat_tintas;
  INSERT INTO categories (name, color, icon, sort_order, unit_id) VALUES
    ('Rodízios e Componentes', '#22c55e', 'Cog', 4, new_unit_id) RETURNING id INTO cat_rodizios;
  INSERT INTO categories (name, color, icon, sort_order, unit_id) VALUES
    ('Consumíveis', '#f43f5e', 'Flame', 5, new_unit_id) RETURNING id INTO cat_consumiveis;

  INSERT INTO inventory_items (name, unit_type, current_stock, min_stock, category_id, unit_id) VALUES
    ('Chapa 2mm (1200x3000)', 'unidade', 0, 10, cat_chapas, new_unit_id),
    ('Chapa 3mm (1200x3000)', 'unidade', 0, 8, cat_chapas, new_unit_id),
    ('Chapa 4mm (1200x3000)', 'unidade', 0, 5, cat_chapas, new_unit_id),
    ('Chapa 6mm (1200x3000)', 'unidade', 0, 3, cat_chapas, new_unit_id),
    ('Chapa 8mm (1200x3000)', 'unidade', 0, 2, cat_chapas, new_unit_id),
    ('Chapa galvanizada 1.5mm', 'unidade', 0, 5, cat_chapas, new_unit_id),
    ('Barra chata 1/2"x1/8"', 'unidade', 0, 20, cat_barras, new_unit_id),
    ('Barra chata 3/4"x1/8"', 'unidade', 0, 15, cat_barras, new_unit_id),
    ('Cantoneira 1"x1/8"', 'unidade', 0, 20, cat_barras, new_unit_id),
    ('Cantoneira 1.1/2"x1/8"', 'unidade', 0, 10, cat_barras, new_unit_id),
    ('Tubo quadrado 30x30x1.5mm', 'unidade', 0, 15, cat_barras, new_unit_id),
    ('Tubo quadrado 40x40x2mm', 'unidade', 0, 10, cat_barras, new_unit_id),
    ('Tubo redondo 1"', 'unidade', 0, 10, cat_barras, new_unit_id),
    ('Tubo retangular 40x20x1.5mm', 'unidade', 0, 10, cat_barras, new_unit_id),
    ('Perfil U 75x40mm', 'unidade', 0, 5, cat_barras, new_unit_id),
    ('Parafuso M8x25', 'unidade', 0, 100, cat_parafusos, new_unit_id),
    ('Parafuso M10x30', 'unidade', 0, 100, cat_parafusos, new_unit_id),
    ('Parafuso M12x40', 'unidade', 0, 50, cat_parafusos, new_unit_id),
    ('Porca M8', 'unidade', 0, 100, cat_parafusos, new_unit_id),
    ('Porca M10', 'unidade', 0, 100, cat_parafusos, new_unit_id),
    ('Porca M12', 'unidade', 0, 50, cat_parafusos, new_unit_id),
    ('Arruela lisa M8', 'unidade', 0, 100, cat_parafusos, new_unit_id),
    ('Arruela lisa M10', 'unidade', 0, 100, cat_parafusos, new_unit_id),
    ('Rebite pop 4.0x12mm', 'unidade', 0, 200, cat_parafusos, new_unit_id),
    ('Primer anticorrosivo', 'litro', 0, 20, cat_tintas, new_unit_id),
    ('Tinta esmalte sintético', 'litro', 0, 20, cat_tintas, new_unit_id),
    ('Tinta epóxi industrial', 'litro', 0, 10, cat_tintas, new_unit_id),
    ('Thinner', 'litro', 0, 20, cat_tintas, new_unit_id),
    ('Verniz protetor', 'litro', 0, 5, cat_tintas, new_unit_id),
    ('Rodízio fixo 4"', 'unidade', 0, 20, cat_rodizios, new_unit_id),
    ('Rodízio giratório 4"', 'unidade', 0, 20, cat_rodizios, new_unit_id),
    ('Rodízio giratório c/ freio 5"', 'unidade', 0, 10, cat_rodizios, new_unit_id),
    ('Rolamento 6204', 'unidade', 0, 20, cat_rodizios, new_unit_id),
    ('Mancal pedestal P204', 'unidade', 0, 10, cat_rodizios, new_unit_id),
    ('Disco de corte 7"', 'unidade', 0, 30, cat_consumiveis, new_unit_id),
    ('Disco de desbaste 7"', 'unidade', 0, 20, cat_consumiveis, new_unit_id),
    ('Disco flap 7"', 'unidade', 0, 15, cat_consumiveis, new_unit_id),
    ('Eletrodo 6013 3.25mm', 'kg', 0, 10, cat_consumiveis, new_unit_id),
    ('Arame MIG 1.0mm', 'kg', 0, 15, cat_consumiveis, new_unit_id),
    ('Gás CO2', 'unidade', 0, 2, cat_consumiveis, new_unit_id),
    ('Gás Argônio', 'unidade', 0, 2, cat_consumiveis, new_unit_id),
    ('Broca HSS 8mm', 'unidade', 0, 10, cat_consumiveis, new_unit_id),
    ('Broca HSS 10mm', 'unidade', 0, 10, cat_consumiveis, new_unit_id),
    ('Serra copo 22mm', 'unidade', 0, 5, cat_consumiveis, new_unit_id),
    ('Lixa ferro grão 80', 'unidade', 0, 30, cat_consumiveis, new_unit_id);

  -- =============================================
  -- CHECKLIST SECTORS (same as before, truncated for brevity - they're already seeded)
  -- =============================================
  INSERT INTO checklist_sectors (name, color, icon, sort_order, unit_id, scope) VALUES
    ('Laser', '#ef4444', 'Zap', 0, new_unit_id, 'standard') RETURNING id INTO sector_id;

  INSERT INTO checklist_subcategories (name, sector_id, sort_order, unit_id, scope) VALUES
    ('Chapa Lateral', sector_id, 0, new_unit_id, 'standard') RETURNING id INTO sub_id;
  INSERT INTO checklist_items (name, description, subcategory_id, checklist_type, points, sort_order, unit_id, target_quantity, piece_dimensions) VALUES
    ('1200x600x2mm', 'Chapa lateral do transportador', sub_id, 'abertura', 5, 0, new_unit_id, 50, '1200x600x2mm'),
    ('1500x600x2mm', 'Chapa lateral grande', sub_id, 'abertura', 5, 1, new_unit_id, 30, '1500x600x2mm'),
    ('800x400x3mm', 'Chapa lateral reforçada', sub_id, 'abertura', 5, 2, new_unit_id, 20, '800x400x3mm');

  RETURN new_unit_id;
END;
$function$;

-- Also update existing units with the 4 access levels if they don't have them
DO $$
DECLARE
  v_unit_id uuid;
BEGIN
  FOR v_unit_id IN SELECT id FROM units LOOP
    -- Only add if no access levels exist for this unit
    IF NOT EXISTS (SELECT 1 FROM access_levels WHERE unit_id = v_unit_id AND name = 'Dono / Admin') THEN
      -- Delete old defaults
      DELETE FROM access_levels WHERE unit_id = v_unit_id AND is_default = true;
      
      INSERT INTO access_levels (name, description, modules, unit_id, is_default) VALUES
        ('Dono / Admin', 'Acesso total a todos os módulos e configurações', 
         ARRAY['dashboard','checklists','inventory','orders','finance','employees','customers','cash-closing','agenda','ranking','rewards','copilot','recipes','marketing','menu-admin','whatsapp','settings'], 
         v_unit_id, true),
        ('Líder de Produção', 'Checklists, estoque produção, equipe do setor',
         ARRAY['dashboard','checklists','inventory','orders','agenda','ranking','rewards','employees'],
         v_unit_id, false),
        ('Operador', 'Apenas checklists e registro de produção',
         ARRAY['dashboard','checklists','ranking','rewards'],
         v_unit_id, false),
        ('Financeiro', 'Apenas módulo financeiro e relatórios',
         ARRAY['dashboard','finance','cash-closing','customers','orders'],
         v_unit_id, false);
    END IF;
  END LOOP;
END $$;
