

## Sistema de Ordens de Produção Diárias

### Conceito

O admin cria um **Plano de Produção** para o dia, definindo quais peças e quantidades precisam ser produzidas. Esse plano alimenta o que aparece no checklist de produção dos operadores. No final do dia, o sistema gera automaticamente um **relatório comparativo**: pedido vs produzido vs pendente.

### Arquitetura

```text
┌─────────────────────┐
│  production_orders   │  ← Plano do dia (admin cria)
│  date, status, notes │
└────────┬────────────┘
         │ 1:N
┌────────▼────────────┐
│ production_order_    │  ← Itens do plano com qtd pedida
│ items                │
│ item_id, qty_ordered │
│ qty_done (calculado) │
└──────────────────────┘
         │
         ▼ lê de
┌──────────────────────┐
│ checklist_completions │  ← Registro real de produção
│ quantity_done, status │
└──────────────────────┘
```

### Banco de Dados (2 tabelas novas)

**`production_orders`** — Cabeçalho do plano diário
- `id`, `unit_id`, `created_by`, `date`, `status` (draft/active/closed), `notes`, `created_at`
- RLS: acesso por `unit_id` via `user_has_unit_access`

**`production_order_items`** — Itens e quantidades pedidas
- `id`, `order_id` (FK), `checklist_item_id` (FK para `checklist_items`), `quantity_ordered`, `unit_id`
- RLS: mesma política via join com `production_orders`

### Fluxo

1. **Admin abre tela "Plano de Produção"** — seleciona data, vê lista de peças disponíveis (itens com `target_quantity > 0`)
2. **Define quantidades** — pode usar `target_quantity` como sugestão padrão ou ajustar
3. **Salva o plano** — status `active`
4. **Operadores** — o checklist mostra apenas as peças que estão no plano do dia (filtro automático)
5. **Relatório automático** — cruza `production_order_items.quantity_ordered` com `checklist_completions.quantity_done` do dia, mostrando:
   - Total pedido
   - Total produzido
   - Pendente (diferença)
   - % de conclusão

### Frontend

1. **Nova aba/seção na página de Checklists** (visível só para admin): "Plano de Produção"
   - Formulário para selecionar peças e definir quantidades
   - Botão "Gerar Plano do Dia"
   
2. **Filtro no ChecklistView**: quando existe um plano ativo para o dia, exibir apenas os itens incluídos no plano (com a quantidade ajustada)

3. **Relatório de Produção**: card/seção que mostra a tabela comparativa pedido x produzido, com indicadores visuais (verde = completo, amarelo = parcial, vermelho = não iniciado)

### Hook

- `useProductionOrders(unitId, date)` — CRUD do plano + cálculo do relatório cruzando com completions

### Detalhes Técnicos

- O `target_quantity` dos `checklist_items` continua sendo a capacidade máxima/padrão da peça
- O `quantity_ordered` do plano pode ser menor que `target_quantity` (ex: "hoje só preciso de 30 das 80 peças")
- O relatório é calculado client-side cruzando os dados de `production_order_items` com `checklist_completions` do mesmo dia
- Possibilidade de "copiar plano de ontem" para agilizar dias repetitivos

