

## Plano: Corrigir Toda a Lógica do Fluxo de Produção

### Problema Central
A lógica de queries no `useProductionOrders` **não isola corretamente por projeto**. Quando `projectId` é `null`, as queries omitem o filtro ao invés de filtrar `project_id IS NULL`, causando:
- Ordens de projetos diferentes se misturando
- Erros de duplicidade na criação
- Pendências importadas de projetos errados
- Fluxo T1→T2 puxando dados cruzados

### Mudanças Necessárias

#### 1. `useProductionOrders.ts` — Isolamento por projeto em TODAS as queries

**Fetch de ordem (linhas 57-76):** Quando `projectId` é `null`, adicionar `.is('project_id', null)` ao invés de simplesmente omitir o filtro. Mesma correção para a query do outro turno (linhas 80-99).

**`saveOrder` (linhas 242-274):** A busca de ordem existente antes do insert também precisa do filtro `.is('project_id', null)` quando projectId é falso. O parâmetro `projectId` interno sombreia o do hook — renomear para `saveProjectId` para clareza.

**`closeShiftAndCreateNext` (linhas 422-431):** A busca do turno 2 existente precisa do mesmo tratamento — filtrar `.is('project_id', null)` quando sem projeto.

**`getPendingFromDate` (linhas 536-590):** Adicionar filtro de `project_id` para não puxar pendências de outros projetos.

**`copyFromDate` (linhas 515-533):** Adicionar filtro de `project_id`.

**`resetDayOrders` (linhas 340-399):** Já filtra por projectId — mas precisa do `.is('project_id', null)` quando sem projeto.

#### 2. `useProductionPage.ts` — Sincronização de projeto selecionado

- Quando `activeProjects` muda e o `selectedProjectId` não está mais na lista, fazer fallback automático para o primeiro projeto disponível
- Garantir que `currentProjectId` nunca fique dessincronizado dos dados renderizados

#### 3. `ProductionPlanSheet.tsx` — Proteção na criação

- Sincronizar o `projectId` interno do sheet com o projeto ativo da página ao abrir
- Prevenir salvamento se o projeto mudou enquanto o sheet estava aberto (stale state)

### Resumo Técnico

Criar uma função helper `addProjectFilter(query, projectId)` que aplica `.eq('project_id', pid)` se existir ou `.is('project_id', null)` se não, e usá-la consistentemente em **todas** as 8+ queries que precisam de isolamento por projeto no hook.

**Arquivos modificados:**
- `src/hooks/useProductionOrders.ts` — ~12 pontos de correção
- `src/hooks/useProductionPage.ts` — sync de projeto selecionado  
- `src/components/production/ProductionPlanSheet.tsx` — sync de projeto ao abrir

