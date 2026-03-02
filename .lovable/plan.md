

## Plano: Refazer Dashboards com Foco em Produção em Tempo Real

### Contexto Atual
- 3 dashboards: **Admin**, **Líder**, **Operador** (Employee)
- Admin: hero financeiro + checklist genérico + orçamentos + gráficos + ranking
- Líder: KPI grid genérico + checklist + agenda + ranking
- Operador: hero gamificação/pontos + ranking + elos + medalhas + ponto eletrônico
- Já existe `useProductionOrders` com report completo (ordered/done/pending/percent por item + duração)

### Filosofia da Refatoração
O sistema é industrial (metalúrgica). O foco principal é **acompanhamento em tempo real da produção**. Cada nível vê o que precisa para agir.

---

### Nova Estrutura por Nível

#### 1. Operador (Employee)
**Objetivo**: Saber o que fazer agora e acompanhar seu progresso pessoal.

```text
┌─────────────────────────────┐
│ Bom dia, João               │
│ segunda, 2 de março         │
├─────────────────────────────┤
│ ▶ PONTO ELETRÔNICO          │  ← check-in/out compacto
├─────────────────────────────┤
│ 🏭 MINHA PRODUÇÃO HOJE      │
│ ┌─────────┐ ┌─────────┐    │
│ │ 12/20   │ │ 60%     │    │
│ │ peças   │ │ progr.  │    │
│ └─────────┘ └─────────┘    │
│ Lista dos itens do plano    │
│ com status por item         │
├─────────────────────────────┤
│ 🏆 Meu Score: 450 pts      │  ← card compacto de pontos
│ #3 no ranking               │
└─────────────────────────────┘
```

- Remove: elos, medalhas, tabs complexos do ranking (movidos para /ranking e /profile)
- Adiciona: widget de produção pessoal do dia baseado em `checklist_completions` filtrado por `completed_by = user.id`

#### 2. Líder
**Objetivo**: Visão geral da equipe e da produção do setor em tempo real.

```text
┌─────────────────────────────┐
│ Bom dia, Carlos   [Líder]   │
├─────────────────────────────┤
│ 🏭 PRODUÇÃO DO DIA          │
│ Progresso geral: 45/80 (56%)│
│ ████████░░░░░░ 56%          │
│                              │
│ Item A    ██████████ 100% ✓ │
│ Item B    ████░░░░░  40% ⏳ │
│ Item C    ░░░░░░░░░   0% ○ │
├─────────────────────────────┤
│ 👥 EQUIPE ATIVA             │
│ João: 12 peças (em prod.)   │
│ Maria: 8 peças (concluiu)   │
│ Pedro: — (não iniciou)      │
├─────────────────────────────┤
│ 📋 Agenda do setor          │
│ 🏆 Ranking da equipe        │
└─────────────────────────────┘
```

- Remove: KPI grid genérico
- Adiciona: widget de produção detalhado com progresso por item + status por funcionário

#### 3. Admin
**Objetivo**: Visão macro — produção, financeiro e alertas.

```text
┌─────────────────────────────┐
│ Bom dia, Admin              │
├─────────────────────────────┤
│ 🏭 PRODUÇÃO HOJE            │
│ ┌────┐ ┌────┐ ┌────┐       │
│ │ 45 │ │ 80 │ │56% │       │
│ │done│ │plan│ │prog│       │
│ └────┘ └────┘ └────┘       │
│ Barra de progresso geral    │
├─────────────────────────────┤
│ 💰 FINANCEIRO               │
│ Saldo: R$ 12.500            │
│ Pendências: R$ 3.200        │
├─────────────────────────────┤
│ ⚠️ ALERTAS                  │
│ 3 itens estoque crítico     │
│ 2 contas vencendo           │
│ 1 orçamento novo            │
├─────────────────────────────┤
│ 📊 Gráfico financeiro       │
│ ⚙️ Gerenciar tela inicial   │
└─────────────────────────────┘
```

- Produção sobe para primeira posição (acima de financeiro)
- Alertas consolidados em um único card compacto
- Mantém gerenciador de widgets

---

### Implementação Técnica

**Novo componente compartilhado**: `ProductionProgressWidget`
- Usa `useProductionOrders` existente
- Recebe prop `variant`: `'compact'` (operador), `'detailed'` (líder/admin)
- Mostra progresso geral + lista de itens com status (concluído/parcial/não iniciado)
- Cores: verde (100%), laranja (parcial), cinza (não iniciado)

**Novo componente**: `TeamActivityWidget` (só líder)
- Query em `checklist_completions` do dia filtrada por `unit_id`, agrupada por `completed_by`
- Junta com `profiles` para nome
- Mostra quem produziu o quê

**Novo componente**: `AlertsSummaryWidget` (só admin)
- Consolida estoque crítico, contas a vencer, orçamentos novos em um card único

**Arquivos a editar**:
1. Criar `src/components/dashboard/ProductionProgressWidget.tsx`
2. Criar `src/components/dashboard/TeamActivityWidget.tsx`
3. Criar `src/components/dashboard/AlertsSummaryWidget.tsx`
4. Reescrever `AdminDashboard.tsx` — produção primeiro, financeiro compacto, alertas
5. Reescrever `LiderDashboard.tsx` — produção detalhada + equipe ativa
6. Reescrever `EmployeeDashboard.tsx` — produção pessoal + ponto + score compacto

**Arquivos mantidos sem alteração**: `useProductionOrders.ts`, `useDashboardStats.ts`, `DashboardWidgetManager.tsx`

---

### Resumo
- Produção em tempo real vira a informação principal em todos os níveis
- Cada nível vê o recorte que faz sentido: pessoal (operador), setor (líder), empresa (admin)
- Gamificação e financeiro continuam acessíveis, mas em posição secundária
- Widgets existentes como ranking e agenda são reaproveitados, apenas reposicionados

