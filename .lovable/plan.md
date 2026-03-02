

## Transformar Cardápio Digital em Canal de Vendas / Catálogo de Peças

### Objetivo

Converter o módulo "Cardápio Digital" (pensado para restaurante) em um **Catálogo de Peças Industrial** onde clientes da Prodem podem navegar produtos, solicitar orçamentos e fazer pedidos diretamente pelo site público.

### Mudanças

#### 1. Renomear vocabulário em todo o módulo

| De | Para |
|---|---|
| Cardápio Digital | Catálogo de Produtos |
| Cardápio | Catálogo |
| Mesa (table_number) | Referência do cliente |
| Buscar no cardápio | Buscar peça ou produto |
| Destaques | Produtos em Destaque |
| Seu Pedido | Sua Cotação |
| Finalizar Pedido | Solicitar Orçamento |
| Popular | Destaque |
| Roleta da Sorte | (remover aba game) |

Arquivos: `modules.ts`, `DigitalMenu.tsx`, `MenuLanding.tsx`, `MenuProductList.tsx`, `MenuProductDetail.tsx`, `MenuCart.tsx`, `MenuSearch.tsx`, `MenuBottomNav.tsx`, `CardapioHub.tsx`

#### 2. Adaptar a landing pública (`MenuLanding.tsx`)

- Trocar "cuisine_type" por segmento industrial (ex: "Engenharia Mecânica & Metalúrgica")
- Trocar "delivery_time" por "Prazo sob consulta"
- Trocar status "Aberto/Fechado" por "Atendimento Online" / "Fora do horário"
- Manter logo e banner

#### 3. Adaptar o carrinho/checkout (`MenuCart.tsx`)

- Remover campo "número da mesa"
- Adicionar campos: **Nome**, **Empresa**, **Telefone**, **E-mail**, **Observações gerais**
- Trocar "Finalizar Pedido" por "Solicitar Orçamento"
- Salvar dados do cliente junto com o pedido

#### 4. Adaptar bottom nav (`MenuBottomNav.tsx`)

- Remover aba "Roleta" (game)
- Renomear: Início → Início, Cardápio → Catálogo, Pedido → Cotação
- Trocar ícones para contexto industrial

#### 5. Remover lógica de gamificação da página pública (`DigitalMenu.tsx`)

- Remover toda a seção de "game" (roleta) da página pública
- Simplificar para 3 abas: Início, Catálogo, Cotação

#### 6. Adaptar textos do detalhe do produto (`MenuProductDetail.tsx`)

- Trocar placeholder "sem cebola, bem passado" por "Especificar acabamento, quantidade exata, etc."
- Manter lógica de opcionais (útil para variações: tipo de aço, acabamento, etc.)

#### 7. Renomear módulo no admin (`modules.ts` e `CardapioHub.tsx`)

- "Cardápio Digital" → "Catálogo de Produtos"
- Header: "Catálogo de Produtos" com ícone apropriado
- Link "Ver público" → "Ver catálogo"

### Arquivos a editar

1. `src/lib/modules.ts` — renomear label e children
2. `src/pages/DigitalMenu.tsx` — remover game, renomear textos
3. `src/components/digital-menu/MenuLanding.tsx` — adaptar vocabulário industrial
4. `src/components/digital-menu/MenuProductList.tsx` — renomear textos
5. `src/components/digital-menu/MenuProductDetail.tsx` — adaptar placeholders
6. `src/components/digital-menu/MenuCart.tsx` — trocar mesa por dados do cliente
7. `src/components/digital-menu/MenuSearch.tsx` — renomear placeholders
8. `src/components/digital-menu/MenuBottomNav.tsx` — remover game, renomear abas
9. `src/pages/CardapioHub.tsx` — renomear header e labels

