import { AppIcon } from '@/components/ui/app-icon';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuditLogs, getActionLabel } from '@/hooks/useAuditLogs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const ACTION_ICONS: Record<string, { icon: string; bg: string; text: string }> = {
  stock_entrada: { icon: 'ArrowDownToLine', bg: 'bg-success/12', text: 'text-success' },
  stock_saida: { icon: 'ArrowUpFromLine', bg: 'bg-red-500/12', text: 'text-red-600 dark:text-red-400' },
  transaction_created: { icon: 'Plus', bg: 'bg-cyan-500/12', text: 'text-cyan-600 dark:text-cyan-400' },
  transaction_deleted: { icon: 'Trash2', bg: 'bg-red-500/12', text: 'text-red-600 dark:text-red-400' },
  cash_closing_created: { icon: 'Receipt', bg: 'bg-amber-500/12', text: 'text-amber-600 dark:text-amber-400' },
  cash_closing_updated: { icon: 'RefreshCw', bg: 'bg-amber-500/12', text: 'text-amber-600 dark:text-amber-400' },
  checklist_completed: { icon: 'CheckCircle', bg: 'bg-primary/12', text: 'text-primary' },
  user_unit_added: { icon: 'UserPlus', bg: 'bg-blue-500/12', text: 'text-blue-600 dark:text-blue-400' },
  user_unit_updated: { icon: 'UserCog', bg: 'bg-blue-500/12', text: 'text-blue-600 dark:text-blue-400' },
  user_unit_removed: { icon: 'UserMinus', bg: 'bg-red-500/12', text: 'text-red-600 dark:text-red-400' },
  access_level_updated: { icon: 'Shield', bg: 'bg-violet-500/12', text: 'text-violet-600 dark:text-violet-400' },
  access_level_deleted: { icon: 'ShieldOff', bg: 'bg-red-500/12', text: 'text-red-600 dark:text-red-400' },
  employee_created: { icon: 'UserPlus', bg: 'bg-success/12', text: 'text-success' },
  employee_updated: { icon: 'UserCog', bg: 'bg-amber-500/12', text: 'text-amber-600 dark:text-amber-400' },
  employee_deleted: { icon: 'UserMinus', bg: 'bg-red-500/12', text: 'text-red-600 dark:text-red-400' },
  customer_deleted: { icon: 'UserX', bg: 'bg-red-500/12', text: 'text-red-600 dark:text-red-400' },
  finance_account_created: { icon: 'Wallet', bg: 'bg-success/12', text: 'text-success' },
  finance_account_updated: { icon: 'Wallet', bg: 'bg-amber-500/12', text: 'text-amber-600 dark:text-amber-400' },
  finance_account_deleted: { icon: 'Wallet', bg: 'bg-red-500/12', text: 'text-red-600 dark:text-red-400' },
  user_login: { icon: 'LogIn', bg: 'bg-sky-500/12', text: 'text-sky-600 dark:text-sky-400' },
};

function exportCSV(logs: any[]) {
  const headers = ['Data', 'Ação', 'Usuário', 'Detalhes', 'Valores Anteriores'];
  const rows = logs.map(l => [
    format(new Date(l.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
    getActionLabel(l.action),
    l.user_name || '',
    JSON.stringify(l.details || {}),
    JSON.stringify(l.old_values || {}),
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success('Logs exportados com sucesso');
}

export function AuditLogSettings() {
  const { logs, isLoading, page, setPage, hasMore, actionFilter, setActionFilter, actionOptions } = useAuditLogs();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Registro automático de ações críticas no sistema.</p>
        <button
          onClick={() => exportCSV(logs)}
          disabled={logs.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-40"
        >
          <AppIcon name="Download" size={14} />
          Exportar CSV
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setActionFilter('all')}
          className={cn(
            "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
            actionFilter === 'all'
              ? "bg-primary/15 border-primary/30 text-primary"
              : "bg-card border-border/50 text-muted-foreground hover:bg-secondary"
          )}
        >
          Todos
        </button>
        {actionOptions.map(o => (
          <button
            key={o.key}
            onClick={() => setActionFilter(o.key)}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
              actionFilter === o.key
                ? "bg-primary/15 border-primary/30 text-primary"
                : "bg-card border-border/50 text-muted-foreground hover:bg-secondary"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* Log list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-8">
          <AppIcon name="FileSearch" size={36} className="mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum registro encontrado</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {logs.map(log => {
            const cfg = ACTION_ICONS[log.action] || { icon: 'Activity', bg: 'bg-cyan-500/12', text: 'text-cyan-600 dark:text-cyan-400' };
            const details = log.details || {};
            let detailText = '';
            if (details.item_name) detailText = details.item_name;
            else if (details.description) detailText = details.description as string;
            if (details.amount) detailText += ` • R$ ${Number(details.amount).toFixed(2)}`;
            if (details.quantity) detailText += ` • Qtd: ${details.quantity}`;

            return (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
                <div
                  className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5", cfg.bg, cfg.text)}
                >
                  <AppIcon name={cfg.icon} size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">{getActionLabel(log.action)}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{detailText || '—'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground/60">{log.user_name}</span>
                    <span className="text-[10px] text-muted-foreground/40">•</span>
                    <span className="text-[10px] text-muted-foreground/60">
                      {format(new Date(log.created_at), "dd/MM HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => setPage(Math.max(0, page - 1))}
          disabled={page === 0}
          className="text-xs font-medium text-primary disabled:text-muted-foreground/30 transition-colors"
        >
          ← Anterior
        </button>
        <span className="text-[10px] text-muted-foreground">Página {page + 1}</span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={!hasMore}
          className="text-xs font-medium text-primary disabled:text-muted-foreground/30 transition-colors"
        >
          Próxima →
        </button>
      </div>
    </div>
  );
}
