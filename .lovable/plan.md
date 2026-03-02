

## Plano: Turnos compartilhando as mesmas tarefas com progresso acumulado

### Problema atual
Hoje cada item tem um `checklist_type` (abertura/fechamento) que separa as tarefas por turno. Turno 1 e Turno 2 veem listas diferentes. Não há vínculo de progresso entre eles.

### Solução
Fazer ambos os turnos verem **as mesmas tarefas**, com o progresso de produção acumulado entre turnos. O Turno 2 mostra apenas a **diferença restante** como meta.

```text
Item: Chapa Lateral (meta: 50)
  ├── Turno 1: João fez 30 → restam 20
  └── Turno 2: vê meta de 20 → Maria faz 20 → completo ✓
       (itens 100% feitos no T1 já aparecem verdes)
```

### Mudanças

**1. Fetch de completions (`useChecklistFetch.ts`)**
- Para Turno 2 (`fechamento`), buscar TAMBÉM as completions do Turno 1 (`abertura`) do mesmo dia
- Retornar ambos os conjuntos para que o front consiga calcular o acumulado

**2. Hook `useChecklists.ts`**
- Adicionar uma query extra: `allShiftCompletions` — busca completions de AMBOS os turnos para o dia selecionado
- Passar essas completions acumuladas para a view

**3. Filtro de items (`ChecklistView.tsx` e `Checklists.tsx`)**
- Remover o filtro por `checklist_type` na listagem de items — todos os items aparecem em ambos os turnos
- Ou: items com type `abertura` aparecem também no `fechamento` (mesma lista)

**4. Lógica de progresso no `ChecklistView.tsx`**
- Calcular `totalDone` = soma de `quantity_done` de TODOS os turnos (abertura + fechamento) para aquele item/dia
- `remaining` = `target_quantity - totalDone`
- Se `remaining <= 0`: item aparece como **completado** (verde, sem ação)
- Se `remaining > 0` e Turno 1 já fez algo: mostrar barra de progresso parcial + meta restante
- No input de "Finalizar Produção", sugerir a quantidade restante como padrão

**5. `useChecklistCompletions.ts`**
- `isItemCompleted`: considerar completions de TODOS os turnos — se soma ≥ target, está completo
- `startProduction` e `finishProduction`: gravar com o `checklist_type` do turno atual (para saber quem fez o quê em cada turno)
- `getCompletionProgress`: calcular baseado no acumulado cross-turno

**6. Progresso nos cards de turno (`Checklists.tsx`)**
- Card do Turno 2 mostra progresso considerando o que já foi feito no Turno 1
- Items 100% feitos no Turno 1 contam como "completados" no Turno 2

### Detalhes técnicos

- Não é necessária migration SQL — os campos `target_quantity`, `quantity_done` e `status` já existem
- A separação por `checklist_type` nos completions é mantida (para auditoria: saber qual turno fez o quê)
- A mudança é puramente de **lógica de exibição e cálculo**: ambos os turnos veem os mesmos items, e o progresso acumula

### Arquivos afetados

| Arquivo | Mudança |
|---|---|
| `useChecklistFetch.ts` | Nova função para buscar completions cross-turno |
| `useChecklists.ts` | Query adicional para completions acumuladas |
| `useChecklistCompletions.ts` | Lógica de `isItemCompleted` e progresso cross-turno |
| `ChecklistView.tsx` | Exibir meta restante, items já completos do turno anterior |
| `Checklists.tsx` | Remover filtro de tipo nos items; ajustar progresso dos cards |

