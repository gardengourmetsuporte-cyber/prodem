

## Análise da situação atual

O sistema **já suporta** saída de estoque da produção. O fluxo funciona assim:

1. Na aba **Almoxarifado**, clique em qualquer item
2. O sheet de movimentação abre com 3 opções: **Entrada**, **Saída**, **Transferência**
3. Ao selecionar **Saída**, aparece a escolha entre **Almoxarifado** e **Produção**
4. Basta selecionar **Produção** e confirmar a quantidade

### O problema

A aba **Produção** mostra apenas o progresso de checklists/peças, mas **não lista os itens de estoque com `production_stock`** — então não há como fazer saída diretamente por ali.

## Plano: Adicionar lista de estoque na aba Produção

Modificar `ProductionStockView.tsx` para incluir, abaixo do progresso de produção, uma **seção de "Materiais em Produção"** que lista os itens com `production_stock > 0`, permitindo clicar para abrir o sheet de movimentação.

### Mudanças

1. **`src/components/inventory/ProductionStockView.tsx`**
   - Receber `items` (do inventário) e callbacks `onItemClick` via props
   - Filtrar itens com `production_stock > 0`
   - Renderizar cards simplificados mostrando nome, estoque produção e botão de saída rápida

2. **`src/pages/Inventory.tsx`**
   - Passar `items`, `handleItemClick` para `ProductionStockView`
   - Ao clicar num item da lista de produção, pré-selecionar saída de produção no sheet

Resultado: o usuário consegue ver e dar saída nos materiais da produção diretamente pela aba Produção, sem precisar voltar ao Almoxarifado.

