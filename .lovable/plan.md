

## Análise: Sistema Atual vs Método Manual da Prodem

### O que a Prodem faz no papel

Baseado nos 5 documentos:

1. **Tabela de Cortes de Barras** (documento master): Lista todos os materiais de um projeto com código, descrição, medida de corte, qtd/rack, qtd total e processo (SERRA, METALEIRA, METALERADORA)
2. **Ordens de Produção** (fichas individuais #1302, #1303): Uma ficha por peça com campos para cada operação: hora inicial/final, data, qtd produzida, operador, qtd expedida, ref máquina
3. **Planilhas de acompanhamento**: Itens **grifados** (marca-texto amarelo/verde) = em produção; itens **riscados** = concluídos

### O que o sistema atual já suporta bem

| Funcionalidade | Status |
|---|---|
| Setores = Processos (SERRA, METALEIRA, METALERADORA, Solda, Montagem, Pintura) | ✅ Funcionando — 6 setores criados |
| Items com material_code, piece_dimensions, target_quantity | ✅ ~30 itens reais importados |
| Pedido de Produção (seleção de itens + quantidades por turno) | ✅ ProductionPlanSheet |
| Turnos 1 e 2 com fechamento e herança de pendentes | ✅ useProductionOrders |
| Acompanhamento: Iniciar produção (Play), Finalizar (qtd), status in_progress/partial/complete | ✅ ChecklistView |
| Visual de grifo (amarelo brilhante para in_progress) | ✅ Implementado |
| Visual de risco (line-through + opacity para complete) | ✅ Implementado |
| Relatório por turno com totais pedido/produzido/pendente | ✅ ProductionReport |
| Progress bar por item e por turno | ✅ Funcionando |
| Timer ao vivo durante produção | ✅ Implementado |

### O que falta adaptar

**1. Conceito de "Projeto" / Ordem de Serviço**
O papel mostra que tudo gira em torno de um **Projeto** (ex: #6421 RACK BOOK ALTENADOR VW, Cliente: VALEO). O sistema atual não tem esse conceito — os pedidos são por data, sem vínculo a um projeto/cliente. Precisamos:
- Nova tabela `production_projects` (numero_projeto, descricao, cliente, status)
- Vincular `production_orders` a um projeto
- Card no topo mostrando "Projeto #6421 — RACK BOOK ALTENADOR VW — VALEO"

**2. Múltiplas operações por peça (Ordem de Produção)**
No papel, uma mesma peça passa por **várias operações em sequência** (ex: METALEIRA → depois outra operação). O sistema atual trata cada item como uma tarefa única num setor. Para replicar:
- Adicionar campo `operations` ou criar registros de "etapas" por item
- Ou manter como está (cada medida de corte já está no setor correto) — **o sistema já modela isso corretamente** pois cada registro de item é "material X na medida Y no processo Z"

**3. Campos da Ordem de Produção não capturados**
- **Operador** por operação: O sistema já registra `completed_by` (quem finalizou)
- **Hora Inicial/Final**: O sistema já tem `started_at` e `finished_at` ✅
- **Ref. Máquina**: Não existe campo para isso
- **Qtd. Expedida**: Não existe — é um conceito de logística pós-produção
- **Roteiro**: Não existe — número sequencial da rota de fabricação

**4. Duplicatas de setores**
Há 3 setores "SERRA" duplicados no banco. Precisa limpar.

### Plano de implementação

**Passo 1 — Limpar duplicatas de SERRA**
Migrar itens dos setores SERRA duplicados para um único e deletar os vazios.

**Passo 2 — Adicionar tabela `production_projects`**
```sql
CREATE TABLE production_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES units(id),
  project_number TEXT NOT NULL,
  description TEXT NOT NULL,
  client TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);
```
Vincular `production_orders.project_id` a esta tabela.

**Passo 3 — Criar projeto real de exemplo**
Inserir Projeto #6421 — RACK BOOK ALTENADOR VW — VALEO como dados reais.

**Passo 4 — UI do Projeto no topo da página de produção**
Card com número do projeto, descrição e cliente acima dos cards de turno.

**Passo 5 — Adicionar campo `machine_ref` na completion** (opcional)
Para registrar a referência da máquina usada (campo "REF MÁQUINA" do papel).

### Conclusão

O sistema já cobre **~85% do fluxo manual**. Os gaps principais são:
- Falta o conceito de **Projeto/OS** que agrupa tudo
- Falta campo **Ref. Máquina** (baixa prioridade)
- Falta **Expedição** (fase posterior, pode ser implementada depois)
- Duplicatas de SERRA precisam ser limpas

A adaptação é relativamente pequena — o modelo de dados atual (setores → subcategorias → itens com material_code, medidas e quantidades + completions com started_at/finished_at/quantity_done) já replica fielmente o que fazem no papel.

