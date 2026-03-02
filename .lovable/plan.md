

## Plano: Reestruturação Completa do Módulo de Produção

### Diagnóstico do Estado Atual

O módulo de produção está **embutido dentro da página de Checklists** (`/checklists`), que é um componente monolítico de **925 linhas** misturando conceitos de checklist operacional (abertura/fechamento) com produção industrial. O `ChecklistView.tsx` tem **1644 linhas** e trata tanto itens de checklist simples quanto peças de produção com lógica condicional extremamente complexa. Isso gera:

- Confusão para o usuário (produção e checklists são coisas diferentes)
- Código frágil com muitos `(item as any).target_quantity > 0` para distinguir itens de produção
- UX subótima: o operador precisa entender "Turno 1 = abertura", navegar entre cards de checklist e encontrar suas peças
- O conceito de Projeto/OS existe no banco mas mal aparece na interface

### Visão: O que o papel nos ensina

Baseado nos documentos reais da Prodem:

1. **TABELA DE CORTES DE BARRAS** (documento master do projeto): Lista completa de materiais com código, descrição, medida de corte, qtd/rack, qtd total e PROCESSO (SERRA, METALEIRA, etc.)
2. **ORDEM DE PRODUÇÃO** (ficha por peça): Cada peça tem uma ficha individual com múltiplas operações, hora inicial/final, operador, ref máquina, qtd expedida
3. **Planilha de acompanhamento**: Grifo amarelo = em produção, riscado = concluído

### Plano de Ação (7 tarefas)

#### 1. Criar página dedicada `/production`
Separar produção de checklists. Nova rota `/production` com componente `src/pages/Production.tsx`. Redirecionar o item "Produção" do menu para `/production`. A página `/checklists` continuará existindo para checklists operacionais (limpeza, bônus, etc).

#### 2. Criar layout focado no Projeto/OS
A nova página abre com o **Projeto ativo** no topo (hero card premium):
- `#6421 — RACK BOOK ALTENADOR VW`
- Cliente: VALEO
- Progresso geral do projeto (não apenas do dia)
- Botão para trocar/gerenciar projetos

#### 3. Painel de Controle de Turnos (redesign)
Abaixo do projeto, dois cards lado a lado estilo o atual `ProductionDayCard`, mas com:
- Date strip horizontal para navegação entre dias
- Indicador visual claro de turno ativo
- Progresso em tempo real (manter o polling de 15s que já existe)

#### 4. Criar "Ordem de Produção Digital" (view por peça)
Replicar fielmente a ficha de papel. Ao tocar em uma peça na lista, abrir um Sheet com:
- Cabeçalho: código do material, descrição, medida de corte, processo
- Tabela de operações: hora inicial/final, data, qtd produzida, operador, ref máquina
- Campo de qtd expedida (novo conceito)
- Status visual: grifo amarelo (em andamento) / riscado (concluído)

#### 5. Lista de peças estilo "Tabela de Cortes"
A lista principal de peças do turno exibida como tabela industrial (não cards de checklist):
- Colunas: Código | Descrição | Medida | Processo | Qtd Pedida | Qtd Feita | Status
- Agrupada por PROCESSO (setor)
- Visual de grifo (highlight amarelo) para itens em produção
- Visual de riscado para itens concluídos
- Botão Play para iniciar, Stop para finalizar com quantidade + ref máquina

#### 6. Adicionar campo `quantity_shipped` (Expedição)
Nova coluna na tabela `checklist_completions` ou nova tabela `production_shipments`:
- Qtd expedida por item
- Data/hora, colaborador, destino, solicitante
- Isso replica a seção "EXPEDIÇÃO" do papel

#### 7. Migrar lógica de produção do ChecklistView
Extrair toda a lógica de produção (Play/Stop, quantity_done, machine_ref, timer, progress) que hoje está no ChecklistView para componentes dedicados na pasta `src/components/production/`:
- `ProductionItemRow.tsx` — linha da peça na tabela
- `ProductionItemSheet.tsx` — ficha detalhada da peça (ordem de produção digital)
- `ProductionShiftPanel.tsx` — painel de controle do turno
- Manter o `ChecklistView` limpo para checklists simples

### Detalhes Técnicos

**Banco de dados:**
- Nova migração para `quantity_shipped` em `checklist_completions`
- Habilitar realtime na tabela `production_orders` para atualizações em tempo real
- Tabela `production_projects` já existe e será aproveitada

**Hooks:**
- `useProductionOrders` já existe e será reutilizado
- `useProductionProjects` já existe
- Criar `useProductionPage` como hook principal da nova página, compondo os dois acima

**Roteamento:**
- Adicionar `Route path="/production"` no `App.tsx`
- Atualizar `modules.ts` para apontar para `/production`
- Manter `/checklists` para checklists operacionais

**Dashboard:**
- O `ProductionFlightBoard` no AdminDashboard já funciona e continuará igual, apenas apontando o link para `/production`

### O que NÃO muda
- Backend (hooks, queries, tabelas) permanecem praticamente iguais
- Gamificação (pontos, estrelas) continua funcionando
- Sistema de turnos 1 e 2 com herança de pendentes permanece
- Realtime via polling de 15s continua

