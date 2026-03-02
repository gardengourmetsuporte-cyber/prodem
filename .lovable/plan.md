

## Adaptação do Checklist e Estoque para a Prodem

### Contexto

A Prodem usa folhas manuais para controlar produção de peças industriais. O checklist atual (abertura/fechamento de restaurante) precisa ser adaptado para **ordens de produção por setor industrial** com controle de quantidades, e o estoque precisa refletir matérias-primas industriais (chapas, barras, tubos).

### Mudanças no banco de dados

**1. Novos campos em `checklist_items`:**
- `target_quantity` (integer, default 0) -- quantidade total que precisa ser produzida
- `piece_dimensions` (text, nullable) -- medidas/especificações da peça (ex: "1200x600x2mm")

**2. Novos campos em `checklist_completions`:**
- `quantity_done` (integer, default 0) -- quantidade que o operador produziu naquela interação
- `status` (text, default 'pending') -- 'pending' | 'in_progress' | 'completed' para rastrear início vs. conclusão

Isso permite:
- Operador clica 1x = marca "em progresso" (iniciou a tarefa)
- Operador clica 2x = informa quantidade feita e marca "concluído"
- Sistema calcula restante (target - soma de quantity_done) para o próximo turno

**3. Dados iniciais -- setores/peças de exemplo:**

| Setor | Peças (subcategorias) | Itens (medidas) |
|---|---|---|
| Laser | Chapa lateral, Base transportador, Reforço estrutural | Medidas específicas com target_quantity |
| Dobra | Calha, Guia lateral, Suporte fixação | Medidas + quantidades |
| Solda | Estrutura transportador, Rack montagem, Carrinho base | Medidas + quantidades |
| Montagem | Transportador completo, Rack finalizado, Carrinho logístico | Itens montados |
| Pintura | Peças para pintura, Acabamento final | Itens de acabamento |

**4. Dados iniciais -- estoque industrial:**

Substituir categorias de restaurante por:
- **Chapas de Aço** (Chapa 2mm, 3mm, 4mm, 6mm)
- **Barras e Perfis** (Barra chata, Cantoneira, Tubo quadrado, Tubo redondo)
- **Parafusos e Fixadores** (Parafuso M8, M10, M12, Porca, Arruela)
- **Tintas e Acabamento** (Primer, Tinta esmalte, Verniz)
- **Rodízios e Componentes** (Rodízio fixo, giratório, Rolamento)
- **Consumíveis** (Disco de corte, Eletrodo, Arame MIG, Gás)

### Mudanças no front-end

**5. ChecklistView.tsx -- novo fluxo de interação:**
- Card da peça mostra: nome + dimensões + barra de progresso (feito/total)
- 1º clique: marca "Em progresso" (ícone play, cor amarela)
- 2º clique: abre input de quantidade feita → salva e calcula restante
- Se restante > 0: card fica parcialmente completo (laranja)
- Se restante = 0: card fica verde (completo)
- Exibir quantidade restante visualmente para próximo turno

**6. Checklists.tsx -- renomear tipos:**
- "Abertura" → "Turno 1" (ou manter flexível)
- "Fechamento" → "Turno 2"
- Labels e ícones adaptados para contexto industrial

**7. Estoque (`auto_provision_unit` function):**
- Atualizar a função de provisionamento para criar categorias e itens industriais em vez de restaurante
- Os dados existentes serão limpos quando o banco for zerado (próxima etapa)

### Arquitetura de dados (fluxo)

```text
Setor (Laser)
  └── Peça (Chapa Lateral)
       └── Item: "1200x600x2mm" → target: 50
            ├── Turno 1: João iniciou → fez 30 → restam 20
            └── Turno 2: Maria continuou → fez 20 → completo ✓
```

### Resumo de arquivos

| Arquivo | Ação |
|---|---|
| Migration SQL | Adicionar `target_quantity`, `piece_dimensions` em `checklist_items`; `quantity_done`, `status` em `checklist_completions` |
| `ChecklistView.tsx` | Novo card industrial com progresso, fluxo 2-cliques, input de quantidade |
| `Checklists.tsx` | Renomear labels (Turno 1/2), adaptar ícones |
| `useChecklistCompletions.ts` | Lógica de toggle com status (in_progress → completed + quantity) |
| `auto_provision_unit` | Atualizar setores/peças padrão e categorias de estoque para industrial |
| Inserção de dados | Popular categorias e itens de estoque industriais |

