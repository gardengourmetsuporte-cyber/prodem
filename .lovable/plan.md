

## Problema

Atualmente, o sistema rastreia tarefas em andamento **apenas na memória do cliente** (`activePieceId`, `activeStartedAt`, `activeLogId` são `useState` locais). Isso significa:

1. Se o operador do Turno 1 inicia uma tarefa e fecha o app, o estado se perde
2. O operador do Turno 2 não consegue ver que há uma tarefa em andamento nem finalizá-la
3. Não há registro de **quem** iniciou vs **quem** finalizou

## Solução

Mudar de estado local para **estado persistido no banco**, usando o registro `production_logs` que já existe (tem `started_at`, `finished_at`, `operator_id`).

### 1. Adicionar coluna `finished_by` na tabela `production_logs`
- Nova coluna `finished_by UUID` (quem finalizou, pode ser diferente de `operator_id` que iniciou)
- Migração SQL simples

### 2. Detectar tarefas em andamento a partir do banco
- Ao abrir uma OS, consultar `production_logs` onde `started_at IS NOT NULL AND finished_at IS NULL` para aquela OS
- Se existir um log aberto, automaticamente mostrar aquela peça como "ativa" com o timer rodando desde `started_at`
- Qualquer operador pode ver e continuar

### 3. Fluxo de troca de turno
- **Turno 1 - Operador A** clica INICIAR → digita PIN → cria log com `operator_id = A`, `started_at = now()`
- **Turno 2 - Operador B** abre o app → sistema detecta log aberto → mostra peça como ativa com timer desde `started_at`
- **Operador B** clica PARAR → digita PIN → sistema valida PIN, grava `finished_at`, `finished_by = B`, `quantity_done`

### 4. Mudanças nos componentes

**`Production.tsx`**:
- Remover estado local `activePieceId/activeStartedAt/activeLogId`
- Adicionar query para detectar log aberto (`started_at NOT NULL, finished_at IS NULL`) no projeto selecionado
- Ao clicar PARAR, pedir PIN novamente (para identificar quem finalizou)

**`FinishTaskDialog.tsx`**:
- Sem mudanças visuais significativas

**`PinDialog`**:
- Reutilizado tanto para INICIAR quanto para FINALIZAR (já funciona assim)

**`ProductionCutTableNew.tsx`**:
- Sem mudanças — já recebe `activePieceId` e `activeStartedAt` como props

### 5. Resumo técnico

```text
production_logs
├── operator_id    → quem INICIOU (Turno 1)
├── finished_by    → quem FINALIZOU (Turno 2)  ← NOVO
├── started_at     → timestamp início
└── finished_at    → timestamp fim

Fluxo:
  App abre → SELECT * FROM production_logs 
             WHERE project_id = X 
             AND finished_at IS NULL 
             AND started_at IS NOT NULL
           → Se encontrar: ativa peça automaticamente
           → Qualquer operador pode finalizar com seu PIN
```

