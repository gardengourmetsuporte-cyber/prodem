

## Plano: Registrar tempo de produção por peça

### Problema
Atualmente, ao iniciar e finalizar a produção de um item, não se registra **quando** começou e terminou. O usuário quer saber o tempo gasto e, futuramente, ter o tempo médio de produção.

### Mudanças no banco de dados

Adicionar duas colunas à tabela `checklist_completions`:
- `started_at` (timestamptz, nullable) — preenchido ao clicar "Iniciar Produção"
- `finished_at` (timestamptz, nullable) — preenchido ao clicar "Finalizar Produção"

Com essas duas colunas é possível calcular duração e médias.

### Mudanças no código

1. **`src/hooks/checklists/useChecklistCompletions.ts`**
   - Na função `startProduction`: gravar `started_at: new Date().toISOString()`
   - Na função `finishProduction`: gravar `finished_at: new Date().toISOString()`

2. **`src/components/checklists/ChecklistView.tsx`**
   - Nos itens de produção que estão "Em Produção", exibir o tempo decorrido desde `started_at` (cronômetro ao vivo)
   - Nos itens concluídos, exibir a duração total (ex: "⏱ 1h 23min")

3. **`src/components/production/ProductionReport.tsx` / `ProductionReportSheet.tsx`**
   - Exibir coluna de tempo gasto por peça no relatório de produção
   - Calcular e mostrar tempo médio de produção por tipo de item

### Detalhes técnicos
- O cronômetro ao vivo usa um `setInterval` de 1s comparando `Date.now()` com `started_at`
- A duração é calculada como `finished_at - started_at`
- Para o tempo médio, uma query agrupa por `item_id` e faz `AVG(finished_at - started_at)` nos últimos 30 dias

