

## Problema
O widget "Checklist do Dia" na dashboard conta TODOS os itens cadastrados no checklist (7 itens), mas deveria mostrar apenas os itens do plano de produção do dia (1 item).

## Solução
Modificar o `ChecklistDashboardWidget` para usar o `useProductionOrders` em vez de contar todos os checklist items. Se existir um plano de produção ativo, o total e progresso são baseados nos itens do plano. Se não existir plano, mostra "Nenhum plano hoje".

### Arquivo a editar
`src/components/dashboard/ChecklistDashboardWidget.tsx`

### Mudanças
- Importar `useProductionOrders` e `useUnit`
- Usar `report` e `totals` do hook de produção para calcular progresso
- Remover a query de todos os setores/completions (não mais necessária)
- Manter o visual atual (ícone, barra de progresso, texto) mas com dados do plano de produção

