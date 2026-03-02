

## Análise dos Documentos Reais da Prodem

Analisei as 5 fotos dos documentos reais:

1. **Ordem de Produção** (#1302, #1303) — Fichas individuais por peça com: projeto, cliente, código material, descrição, medida (mm), operação (METALEIRA, SERRA), campos para operador, hora, data, qtd produzida, qtd expedida
2. **Tabela de Cortes de Barras** (Projeto #6421 RACK BOOK ALTENADOR VW) — Lista master com: código material (MP013.0004, etc.), descrição, comprimento de corte (mm), qtd/rack, qtd total, processo (SERRA, METALEIRA, METALERADORA)
3. **Planilhas de acompanhamento** — Listas de materiais onde itens em produção são **grifados** e itens concluídos são **riscados**

### O que o sistema atual já faz bem
- Setores (= processos/operações)
- Items com dimensões e quantidades
- Status: not_started → in_progress → partial → complete
- Turnos 1 e 2 com fechamento

### O que precisa adaptar

**1. Reestruturar setores para refletir os processos reais**
- Renomear/criar setores: **SERRA**, **METALEIRA**, **METALERADORA**, **SOLDA**, **MONTAGEM**, **PINTURA**
- Os setores atuais genéricos (Laser, Dobra, Geral) serão substituídos pelos processos reais

**2. Importar itens reais da Tabela de Cortes**
- Cadastrar materiais reais como itens de checklist com os dados extraídos:
  - Ex: "BARRA REDONDA MECANICA 6000 MM - 1/2 POL." → Setor METALEIRA, medida 58mm, target 54 pç
  - Ex: "FERRO CHATO 6000 MM - 1 X 3/16 POL." → Setor METALERADORA, medida 328mm, target 54 pç
  - Ex: "TUBO IND. QUADRADO 6000 MM - 50 X 50 X 2,65 MM" → Setor SERRA, medida 953mm, target 54 pç

**3. Melhorar o visual de acompanhamento (grifo/risco)**
- Na ChecklistView, itens `in_progress` terão fundo **amarelo/âmbar** (simulando o grifo de marcador)
- Itens `complete` terão texto com ~~tachado~~ e opacidade reduzida (simulando o risco)
- Isso replica visualmente o que fazem no papel

**4. Adicionar campos do documento real ao ProductionPlanSheet**
- Exibir o **código do material** (novo campo) e **processo** (setor) em cada item
- Mostrar **comprimento de corte** junto das dimensões

### Plano de execução

**Passo 1 — Migração de banco**: Adicionar campo `material_code` à tabela `checklist_items` para armazenar códigos como MP013.0004

**Passo 2 — Atualizar setores existentes**: Via SQL, renomear e criar setores que correspondem aos processos reais da Prodem (SERRA, METALEIRA, METALERADORA) e reorganizar subcategorias por tipo de material (Barra Redonda, Ferro Chato, Tubo Quadrado, Tubo Redondo)

**Passo 3 — Importar itens reais**: Inserir os ~20 itens da Tabela de Cortes de Barras como checklist_items com nome, dimensões, código material e target quantity extraídos das fotos

**Passo 4 — Visual grifo/risco**: Alterar `ChecklistView.tsx` para:
- Items `in_progress`: borda esquerda amarela + fundo âmbar claro (efeito "grifado")
- Items `complete`: texto tachado + opacidade 50% (efeito "riscado")

**Passo 5 — ProductionPlanSheet**: Exibir código do material e processo ao lado do nome do item na tela de pedido

