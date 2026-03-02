

## Problema: Teclado some ao digitar

O componente `FieldRow` está definido **dentro** do corpo do componente `GroupingSheet` (linha ~113). Isso faz com que, a cada keystroke, o React crie uma nova referência de componente, desmonte o input anterior e monte um novo — causando perda de foco e o teclado sumindo.

## Solução

Mover o `FieldRow` para **fora** do componente `GroupingSheet`, como um componente separado no mesmo arquivo. Isso mantém a referência estável entre renders.

```typescript
// ANTES (dentro do componente):
const FieldRow = ({ label, value, onChange, placeholder }) => (...)

// DEPOIS (fora do componente, no topo do arquivo):
function FieldRow({ label, value, onChange, placeholder }: { ... }) { return (...) }
```

Alteração de 1 arquivo: `src/components/production/GroupingSheet.tsx`.

