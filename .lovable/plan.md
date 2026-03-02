

## Plano: Integrar Dados de Agrupamento CNC ao Módulo de Produção

### O que os documentos mostram

Os "Resultado do Agrupamento" são fichas técnicas geradas pelo software CNC que descrevem como peças são cortadas de chapas de aço. Contêm dados que o sistema atual **não captura**:

- **Material** (ex: Aço laminado a frio)
- **Espessura** (ex: 2,00mm → 4,75mm)
- **Tamanho da placa** (ex: 1200,00 x 3000,00 mm)
- **Tempos planejados** (processamento, corte, movimento, perfuração)
- **Agrupamento visual** (layout de nesting na chapa)
- **Contagem por agrupamento** ("5 peças do total de 76", "11 peças do total de 98")

### O que já existe no banco

- `checklist_items` já tem `material_code` (PC13.04635) e `piece_dimensions` (400,35 x 75,44 mm)
- `production_projects` tem `project_number`, `description`, `client`
- `production_orders` vincula a um `project_id`

### O que falta

1. **Campos no projeto**: material, espessura, tamanho da placa — dados do agrupamento que pertencem ao nível do projeto/OS
2. **Tabela de agrupamentos**: cada projeto pode ter múltiplos agrupamentos (Agrupamento1, Agrupamento2), cada um com suas peças e quantidades
3. **Visualização na UI**: o hero do projeto precisa mostrar esses dados técnicos

### Tarefas

#### 1. Criar tabela `production_groupings`
Nova tabela para armazenar os agrupamentos CNC vinculados a um projeto:

```text
production_groupings
├── id (uuid)
├── project_id (fk → production_projects)
├── grouping_number (int) — 1, 2, 3...
├── material (text) — "Aço laminado a frio"
├── plate_size (text) — "1200,00 x 3000,00 mm"
├── thickness (text) — "4,75 mm"
├── total_cut_length (text) — "137595,56 mm"
├── processing_time (text) — "36min24,6s"
├── cut_time (text) — "27min1s"
├── movement_time (text) — "9min11s"
├── perforation_time (text) — "0s"
├── total_pieces (int) — 98
├── unique_pieces (int) — 11
├── notes (text)
├── unit_id, created_at
```

#### 2. Criar tabela `production_grouping_items`
Vincula peças (checklist_items) a um agrupamento com a contagem específica daquele nesting:

```text
production_grouping_items
├── id (uuid)
├── grouping_id (fk → production_groupings)
├── checklist_item_id (fk → checklist_items)
├── quantity (int) — contagem neste agrupamento (ex: 54, 4, 1)
├── sort_order (int)
```

#### 3. Adicionar campos ao `production_projects`
Adicionar `material`, `thickness`, `plate_size` diretamente no projeto para o caso mais simples (projeto com espessura única).

#### 4. Criar UI de cadastro de Agrupamento
No `ProjectSheet`, adicionar aba/seção para cadastrar agrupamentos:
- Formulário com campos técnicos (material, espessura, tempos)
- Seletor de peças com quantidades por agrupamento
- Visualização em lista dos agrupamentos existentes

#### 5. Exibir dados de agrupamento no Hero e na Tabela de Cortes
- No `ProductionProjectHero`: mostrar material, espessura, total de peças do projeto
- No `ProductionCutTable`: mostrar badge de agrupamento por peça, com contagem correta
- Adicionar card resumo por agrupamento (expandível) mostrando tempos planejados e progresso

#### 6. Hook `useProductionGroupings`
Novo hook para CRUD dos agrupamentos, com queries por `project_id`.

### Resultado esperado
O operador/líder cadastra os agrupamentos vindos do CNC, vincula as peças com suas contagens, e a tela de produção exibe automaticamente os dados técnicos (material, espessura, tempos) junto com o progresso por agrupamento.

