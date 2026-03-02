

## Situação Atual

A funcionalidade **já existe** no código. No painel de planejamento (ícone ⚙️), há o botão **"Puxar último turno"** que:

1. Calcula a data de ontem
2. Busca todos os pedidos daquele dia (Turno 1 + Turno 2)
3. Soma as quantidades pedidas e subtrai as completadas
4. Retorna apenas os itens **pendentes** (não finalizados)
5. Soma essas quantidades ao plano atual do Turno 1 de hoje

### Como usar

1. No novo dia, abra o painel de planejamento (⚙️)
2. Clique no botão **"Puxar último turno"** (ícone de relógio/History)
3. Os itens pendentes do dia anterior serão importados com as quantidades restantes

### Problemas identificados

O botão está com label **"Puxar último turno"**, que é ambíguo — parece referir-se ao turno anterior do mesmo dia, não ao dia anterior. Sugiro melhorar:

1. **Renomear o botão** para **"Puxar pendências do dia anterior"** para deixar claro
2. **Adicionar indicador visual** — mostrar um badge quando há pendências do dia anterior, para que o operador saiba que existem itens não concluídos
3. **Mensagem mais detalhada** no toast, informando a data de origem (ex: "3 itens pendentes de 01/03 importados")

### Mudanças

- `ProductionPlanSheet.tsx`: Renomear label do botão e melhorar toast
- `useProductionOrders.ts` (opcional): Adicionar função `hasPendingFromYesterday` para badge visual

Escopo pequeno — apenas ajuste de texto e UX.

