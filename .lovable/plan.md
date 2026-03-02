

## Simplificar opções de ação nos itens de produção

### Situação atual
Quando o operador clica num item pendente, aparecem 4 opções:
1. **Iniciar Produção** — ação principal
2. **Concluir direto** — pula o fluxo de iniciar/finalizar
3. **Não concluído** — sem pontos
4. **Já estava pronto** — sem pontos

### Proposta

Manter apenas **Iniciar Produção** para itens industriais (com `target_quantity > 0`). A opção "Não concluído" faz sentido manter pois o líder precisa poder marcar que algo não foi produzido (falta de material, máquina parada, etc).

Para itens simples (sem `target_quantity`, tipo limpeza ou organização), as opções atuais continuam como estão.

### Mudança

**Arquivo:** `src/components/checklists/ChecklistView.tsx` (linhas ~1500-1527)

Para itens com `hasIndustrialData` (target_quantity > 0), remover:
- "Concluir direto"
- "Já estava pronto"

Manter apenas:
- **Iniciar Produção** (com seleção de pessoa para admin)
- **Não concluído** (para registrar que não foi feito)

### Resultado
O fluxo fica mais limpo e direto: o operador inicia a produção, depois finaliza informando a quantidade. Se não rolou, marca como não concluído.

