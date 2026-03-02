

## Redesign Completo do Modulo de Producao

### Problema Atual

O modulo atual amarra pecas de producao ao sistema de checklists (`checklist_items` + `checklist_completions`), criando uma camada de complexidade desnecessaria. O fluxo real da fabrica e direto: OS → Lista de Cortes → Ordem de Producao por peca → Registro de producao → Expedicao.

### Documentos Fisicos a Digitalizar

Baseado nas fotos enviadas, existem 3 documentos-chave:

```text
1. TABELA DE CORTES DE BARRAS (lista mestre da OS)
   ┌──────────┬─────────────────────┬────────┬──────────┬──────────┬──────────┐
   │ Cod.Mat  │ Descricao Material  │Comp(mm)│ Qtd/Rack │ Qtd Total│ Processo │
   ├──────────┼─────────────────────┼────────┼──────────┼──────────┼──────────┤
   │ MP013.04 │ BARRA REDONDA 1/2"  │  58mm  │    2     │    54    │  SERRA   │
   │ MP010.06 │ FERRO CHATO 1x3/16" │ 658mm  │   24     │   648    │METALEIRA │
   └──────────┴─────────────────────┴────────┴──────────┴──────────┴──────────┘

2. ORDEM DE PRODUCAO (ficha individual por peca)
   ┌─ OS 1302 ──────────────────────────────────────────┐
   │ Descricao: BARRA REDONDA 6000MM - 5/16 POL         │
   │ Medida: 235mm  │  Qtd Total: 27                    │
   │                                                     │
   │ PRODUCAO (3 blocos = 3 operacoes possiveis)         │
   │  Operacao │ Hora │ Data │ Qtd.Prod │ Operador       │
   │  METALEIRA│      │      │          │                │
   │  Qtd.Expedida: ___   Ref.Maquina: ___              │
   │                                                     │
   │ EXPEDICAO                                           │
   │  Data/Hora │ Colaborador │ Destino │ Solicitante    │
   └─────────────────────────────────────────────────────┘

3. RESULTADO DO AGRUPAMENTO (nesting CNC - ja existe parcialmente)
   ┌─ Agrupamento 1 ─────────────────────────────────────┐
   │ Material: Aco laminado a frio  │ Espessura: 4,75mm  │
   │ Placa: 1200x3000mm                                  │
   │ Corte: 27min1s │ Movimento: 9min11s                  │
   │ Lista de pecas: PC13.04592 (54), PC13.04642 (4)...  │
   └──────────────────────────────────────────────────────┘
```

### Nova Arquitetura de Dados

Eliminar dependencia de `checklist_items`. Criar tabelas proprias e independentes:

**Tabelas novas:**
- `production_pieces` — pecas da OS (substitui checklist_items para producao). Campos: `project_id`, `material_code`, `description`, `cut_length_mm`, `qty_per_rack`, `qty_total`, `process_type` (SERRA/METALEIRA/METALEIRA+DOBRA), `sort_order`
- `production_logs` — registros de producao (substitui checklist_completions). Campos: `piece_id`, `project_id`, `operation` (nome do processo), `started_at`, `finished_at`, `quantity_done`, `operator_id`, `machine_ref`, `date`
- `production_shipments` — expedicao por peca. Campos: `piece_id`, `project_id`, `quantity`, `shipped_at`, `operator_id`, `destination`, `requester`

**Tabelas mantidas (ja existem e funcionam bem):**
- `production_projects` — OS com numero, cliente, descricao
- `production_groupings` + `production_grouping_items` — nesting CNC (ajustar FK para `production_pieces`)

**Tabelas removidas/desativadas:**
- `production_orders` — nao mais necessaria (a OS = projeto)
- `production_order_items` — substituida por `production_pieces`

### Nova Interface (3 telas principais)

**Tela 1: Selecao de OS** (substitui a tela atual com date strip)
- Lista de OS ativas como cards grandes
- Cada card mostra: numero, cliente, barra de progresso, qtd pecas
- Botao para criar nova OS (admin)
- Sem seletor de data — a OS e o centro do fluxo, nao o dia

**Tela 2: Tabela de Cortes** (tela principal da OS)
- Replica fiel da "TABELA DE CORTES DE BARRAS" do papel
- Colunas: Cod. Material, Descricao, Comp.(mm), Qtd/Rack, Qtd Total, Processo, Status
- Tap na linha abre a ficha da peca (Tela 3)
- Botao rapido de INICIAR/FECHAR por linha
- Filtro por processo (SERRA, METALEIRA, etc.)
- Secao de Agrupamentos CNC colapsavel abaixo

**Tela 3: Ficha da Peca** (sheet/modal — replica a Ordem de Producao)
- Header: cod. material, descricao, medida, qtd total
- Historico de operacoes: lista de registros com operador, hora, qtd
- Botao "Registrar Producao": operacao, qtd, ref. maquina
- Secao "Expedicao": destino, solicitante, qtd expedida
- Barra de progresso: produzido vs total vs expedido

### Tarefas de Implementacao

1. **Migracoes SQL** — criar `production_pieces`, `production_logs`, refatorar `production_shipments`, ajustar FKs dos groupings
2. **Hooks novos** — `useProductionPieces`, `useProductionLogs`, `useProductionShipments` (simples, sem logica de shifts/orders)
3. **Tela de OS** — nova lista de projetos como landing page do modulo
4. **Tabela de Cortes** — novo componente fiel ao papel
5. **Ficha da Peca** — sheet com registro de operacoes e expedicao
6. **Limpeza** — remover componentes e hooks antigos nao mais usados
7. **Corrigir erros TS** — os erros de build atuais serao eliminados naturalmente com a nova arquitetura

### Detalhes Tecnicos

- As `production_pieces` terao RLS por `unit_id` via `user_has_unit_access`
- `production_logs` registra cada operacao individualmente (permite multiplas operacoes por peca: SERRA → METALEIRA → DOBRA)
- O progresso da OS e calculado somando `production_logs.quantity_done` por `piece_id` vs `production_pieces.qty_total`
- Realtime via channel no `production_logs` para atualizacao live no chao de fabrica
- Dashboard (`ProductionFlightBoard`) sera adaptado para ler das novas tabelas

