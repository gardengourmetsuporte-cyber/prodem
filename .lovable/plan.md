

## Problema Atual

Hoje, ao navegar para um novo dia, **todos os projetos ativos** aparecem no seletor — mesmo os que já foram 100% concluídos no dia anterior. Isso permite que o usuário "puxe" uma OS já finalizada para um novo dia, duplicando trabalho. A lógica de "Pendências de ontem" já calcula corretamente os itens pendentes, mas não há **guarda** impedindo de recriar uma OS completa.

## Plano

### 1. Filtrar projetos disponíveis por dia com base em status de conclusão

**Arquivo:** `src/hooks/useProductionPage.ts`

Alterar o filtro de `activeProjects` para excluir projetos que:
- Já têm produção em dias anteriores **e** estão 100% concluídos (sem pendências)
- Não têm produção no dia selecionado

Manter no dropdown apenas:
- Projetos **com ordens no dia selecionado** (já planejados para esse dia)
- Projetos **novos** (sem nenhuma ordem ainda — nunca foram planejados)
- Projetos **com pendências** de dias anteriores (incompletos)

### 2. Validar no "Pendências de ontem" se há de fato itens pendentes

**Arquivo:** `src/hooks/useProductionOrders.ts` → `getPendingFromDate`

Já funciona corretamente (retorna `null` se tudo foi concluído). Apenas reforçar a mensagem no `ProductionPlanSheet` para indicar que a OS foi finalizada.

### 3. Adicionar query de "projeto tem pendências?" 

**Arquivo:** `src/hooks/useProductionPage.ts`

Nova query que, para cada projeto ativo, verifica se a última data de produção tem itens pendentes. Se não tiver, o projeto não aparece para novos dias (só aparece nos dias onde já tem ordem).

### Detalhes Técnicos

```text
Fluxo de decisão para exibir projeto no dropdown:

Projeto X no dia D selecionado:
├─ Tem ordem no dia D? → MOSTRA (já planejado)
├─ Nunca teve ordem em nenhum dia? → MOSTRA (novo)
├─ Teve ordens em dias anteriores?
│   ├─ Tem pendências (itens não concluídos)? → MOSTRA
│   └─ Tudo concluído? → NÃO MOSTRA
└─ Arquivado? → NÃO MOSTRA
```

A verificação de pendências será feita via query que compara `production_order_items.quantity_ordered` com `checklist_completions.quantity_done` para a última data de produção de cada projeto. Isso será uma query única agrupada, não N+1.

### 4. Prevenir criação duplicada no `saveOrder`

**Arquivo:** `src/hooks/useProductionOrders.ts`

Antes de criar uma nova ordem, verificar se o projeto já tem todas as peças concluídas (sem pendências globais). Se sim, bloquear com toast de erro: "Esta OS já foi concluída. Não há pendências."

