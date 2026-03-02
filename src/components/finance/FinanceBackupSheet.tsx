import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

import { AppIcon } from '@/components/ui/app-icon';
import { FinanceSnapshot, AccountComparison } from '@/hooks/useFinanceBackup';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FinanceBackupSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  snapshots: FinanceSnapshot[];
  isLoading: boolean;
  isCreating: boolean;
  isRestoring: boolean;
  onFetch: () => Promise<void>;
  onCreate: (name: string) => Promise<void>;
  onCompare: (snapshot: FinanceSnapshot) => AccountComparison[];
  onRestore: (snapshot: FinanceSnapshot) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function FinanceBackupSheet({
  open,
  onOpenChange,
  snapshots,
  isLoading,
  isCreating,
  isRestoring,
  onFetch,
  onCreate,
  onCompare,
  onRestore,
  onDelete,
}: FinanceBackupSheetProps) {
  const [newName, setNewName] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [comparison, setComparison] = useState<AccountComparison[] | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<FinanceSnapshot | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      onFetch();
      setExpandedId(null);
      setComparison(null);
    }
  }, [open, onFetch]);

  const handleCreate = async () => {
    await onCreate(newName);
    setNewName('');
  };

  const handleExpand = (snapshot: FinanceSnapshot) => {
    if (expandedId === snapshot.id) {
      setExpandedId(null);
      setComparison(null);
    } else {
      setExpandedId(snapshot.id);
      setComparison(onCompare(snapshot));
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <AppIcon name="Archive" size={20} className="text-primary" />
              Backups Financeiros
            </SheetTitle>
          </SheetHeader>

          <div className="mt-4 space-y-4 overflow-y-auto max-h-[calc(85vh-120px)] pb-8">
            <div className="flex gap-2">
              <Input
                placeholder="Nome do backup (opcional)"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleCreate} disabled={isCreating} size="sm">
                {isCreating ? <AppIcon name="Progress_activity" size={16} className="animate-spin" /> : <AppIcon name="Plus" size={16} />}
                <span className="ml-1 hidden sm:inline">Criar</span>
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <AppIcon name="Progress_activity" size={24} className="animate-spin text-muted-foreground" />
              </div>
            ) : snapshots.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AppIcon name="Archive" size={40} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nenhum backup ainda</p>
                <p className="text-xs mt-1">Crie um backup para proteger seus dados</p>
              </div>
            ) : (
              <div className="space-y-2">
                {snapshots.map(snapshot => {
                  const txCount = (snapshot.transactions_data as any[])?.length || 0;
                  const isExpanded = expandedId === snapshot.id;

                  return (
                    <div key={snapshot.id} className="border rounded-xl overflow-hidden bg-card">
                      <button
                        onClick={() => handleExpand(snapshot)}
                        className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {snapshot.name || 'Backup sem nome'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(snapshot.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            {' · '}
                            {txCount} transaç{txCount === 1 ? 'ão' : 'ões'}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold">{formatCurrency(snapshot.total_balance)}</p>
                        </div>
                        <AppIcon name={isExpanded ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-muted-foreground shrink-0" />
                      </button>

                      {isExpanded && comparison && (
                        <div className="border-t px-3 py-3 space-y-3 bg-muted/30">
                          <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-2">
                            <AppIcon name="ArrowLeftRight" size={12} />
                            Comparação com estado atual
                          </div>

                          {comparison.map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <span className="truncate flex-1">{item.name}</span>
                              <div className="flex items-center gap-3 shrink-0 text-xs">
                                <span className="text-muted-foreground">{formatCurrency(item.snapshotBalance)}</span>
                                <span>→</span>
                                <span>{formatCurrency(item.currentBalance)}</span>
                                <span className={
                                  item.difference > 0
                                    ? 'text-success font-medium'
                                    : item.difference < 0
                                      ? 'text-red-500 font-medium'
                                      : 'text-muted-foreground'
                                }>
                                  {item.difference > 0 ? '+' : ''}{formatCurrency(item.difference)}
                                </span>
                              </div>
                            </div>
                          ))}

                          <div className="flex gap-2 pt-2 border-t">
                            <Button
                              variant="destructive"
                              size="sm"
                              className="flex-1"
                              onClick={() => setRestoreTarget(snapshot)}
                              disabled={isRestoring}
                            >
                              {isRestoring ? <AppIcon name="Progress_activity" size={16} className="animate-spin mr-1" /> : <AppIcon name="RefreshCw" size={16} className="mr-1" />}
                              Restaurar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteTarget(snapshot.id)}
                            >
                              <AppIcon name="Trash2" size={16} />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!restoreTarget} onOpenChange={open => !open && setRestoreTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar backup?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso vai substituir todas as transações do mês atual e restaurar os saldos ao estado do backup.
              Um backup automático do estado atual será criado antes da restauração.
              <br /><br />
              <strong>Esta ação não pode ser desfeita facilmente.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (restoreTarget) {
                  await onRestore(restoreTarget);
                  setRestoreTarget(null);
                  setExpandedId(null);
                  setComparison(null);
                }
              }}
            >
              Sim, restaurar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir backup?</AlertDialogTitle>
            <AlertDialogDescription>
              Este backup será excluído permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (deleteTarget) {
                  await onDelete(deleteTarget);
                  setDeleteTarget(null);
                  if (expandedId === deleteTarget) {
                    setExpandedId(null);
                    setComparison(null);
                  }
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
