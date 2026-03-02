

## Seletor de Projeto na Tela de Produção

Atualmente o sistema pega automaticamente `activeProjects[0]`. Vou adicionar um seletor para alternar entre projetos.

### Alterações

**1. `src/hooks/useProductionPage.ts`**
- Adicionar estado `selectedProjectId` com controle manual
- Substituir `activeProject = activeProjects[0]` por seleção baseada no `selectedProjectId`
- Expor `setSelectedProjectId` no retorno

**2. `src/components/production/ProductionProjectHero.tsx`**
- Quando houver mais de 1 projeto ativo, renderizar chips/tabs horizontais acima do hero card para alternar entre projetos (ex: `#OS001`, `#OS002`)
- Chip selecionado fica destacado com estilo warning/ativo
- Manter o botão "Cadastrar OS" para admin

**3. `src/pages/Production.tsx`**
- Passar `setSelectedProjectId` e `activeProjects` para o `ProductionProjectHero`

O seletor aparecerá como uma fila horizontal de chips com o número da OS, no estilo industrial já usado no app.

