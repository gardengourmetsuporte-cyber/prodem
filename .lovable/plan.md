

## Análise da Situação

Atualmente:
- **Almoxarifado** = matéria-prima (chapas, barras, parafusos) — itens do `inventory_items`
- **Produção** = peças sendo fabricadas (cortes laser, dobras, soldas) — itens do `checklist_items` com `target_quantity`
- Não existe ligação direta entre os dois módulos
- A aba "Todos" soma ambos os estoques e não faz sentido funcional

## Proposta de Ligação Produção ↔ Estoque

### Modelo conceitual

```text
┌─────────────────────┐       ┌──────────────────────┐
│  ALMOXARIFADO       │       │  PRODUÇÃO             │
│  (inventory_items)  │──────▶│  (checklist_items)    │
│                     │ BOM   │                       │
│  Chapa 2mm          │       │  Peça 1200x600x2mm    │
│  Parafuso M8        │       │  Rack 1800x1200       │
└─────────────────────┘       └──────────────────────┘
```

A ligação real seria via **BOM (Bill of Materials)** — uma tabela que diz "para produzir a peça X, preciso de Y unidades do material Z". Porém isso é complexo e requer cadastro detalhado.

### Abordagem simplificada (recomendada)

1. **Remover a aba "Todos"** — só existem "Almoxarifado" e "Produção"
2. **Almoxarifado** = mostra `inventory_items` (matéria-prima, como já é)
3. **Produção** = mostra os itens da checklist de produção do dia (do `production_orders` + `checklist_items`), com progresso de execução, **não** itens de estoque
4. Na aba Produção do estoque, listar os itens do pedido de produção ativo com: nome da peça, quantidade pedida, quantidade feita, % de conclusão
5. Clicar numa peça na aba Produção redireciona para a checklist daquele setor

### Mudanças técnicas

1. **Migração**: nenhuma necessária (dados já existem nas tabelas)
2. **`src/pages/Inventory.tsx`**:
   - Remover opção "todos" do `LocationFilter`
   - Default para "almoxarifado"
   - Na aba "Produção", renderizar uma lista vinda do hook `useProductionOrders` com o relatório de progresso das peças do dia
   - Cada item mostra: nome peça, dimensões, qtd pedida vs feita, barra de progresso
   - Click leva para `/checklists`
3. **Criar componente `ProductionStockView.tsx`**: lista de peças do pedido de produção ativo com progresso visual

