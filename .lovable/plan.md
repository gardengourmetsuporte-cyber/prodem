

## Ajuste do Cadastro de Produtos para Setor Industrial (Prodem)

### Contexto

O cadastro atual é genérico (restaurante/alimentação). A Prodem é uma indústria metalúrgica que trabalha com chapas, tubos, perfis, parafusos, tintas, gases de solda, etc. O formulário precisa de campos específicos para esse setor.

### Campos novos na tabela `inventory_items`

| Campo | Tipo | Exemplo |
|---|---|---|
| `material_type` | text | Aço carbono, Inox 304, Alumínio |
| `dimensions` | text | 1200x3000mm, Ø 2" |
| `thickness` | text | 3mm, 1/4", #12 |
| `technical_spec` | text | ASTM A36, NBR 8800 |
| `internal_code` | text | CHP-001, TUB-045 |
| `location` | text | Prateleira A3, Galpão 2 |
| `weight_per_unit` | numeric | 85.2 (kg por peça/chapa) |

### Unidades de controle adicionais

Além de `unidade`, `kg`, `litro`, adicionar:
- **Metros (m)** — para tubos, barras, perfis
- **Metros² (m²)** — para chapas

Isso requer alterar o enum `unit_type_enum` no banco e o formulário.

### Seção "Ficha Técnica" no formulário

Substituir a seção "Configurar para Fichas Técnicas" (voltada para receitas culinárias) por uma seção **"Ficha Técnica"** industrial:

- **Código Interno** — código próprio da empresa
- **Material** — tipo do material (select com opções comuns + campo livre)
- **Espessura** — campo texto livre
- **Dimensões** — campo texto livre (ex: 1200x3000mm)
- **Especificação Técnica** — norma, liga, grau (ex: ASTM A36)
- **Peso por unidade** — kg por peça/chapa
- **Localização** — onde fica armazenado no galpão

### Mudanças

1. **Migration SQL** — adicionar 7 colunas à tabela `inventory_items` + ampliar enum com `metro` e `metro_quadrado`
2. **`src/types/database.ts`** — atualizar interface `InventoryItem` com os novos campos
3. **`src/components/inventory/ItemFormSheetNew.tsx`** — redesenhar formulário com os campos industriais, remover seção de fichas de receita e substituir por ficha técnica industrial
4. **`src/hooks/useInventoryDB.ts`** — incluir novos campos no `addItem` e `updateItem`
5. **`src/components/inventory/ItemCardNew.tsx`** — exibir código interno, material e dimensões no card do item

### Resultado

O formulário de cadastro fica específico para indústria metalúrgica, com campos relevantes como material, espessura, dimensões e norma técnica, eliminando referências a fichas de receita que não fazem sentido nesse contexto.

