import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { AppIcon } from '@/components/ui/app-icon';
import { Skeleton } from '@/components/ui/skeleton';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function QuoteRequestsWidget() {
  const { activeUnitId } = useUnit();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['quote-requests-dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quote_requests' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5) as any;
      if (error) throw error;
      return data as Array<{
        id: string;
        name: string;
        company: string | null;
        phone: string | null;
        description: string;
        status: string;
        created_at: string;
      }>;
    },
    staleTime: 30_000,
  });

  if (isLoading) return <Skeleton className="h-32 w-full rounded-2xl" />;
  if (!requests || requests.length === 0) {
    return (
      <div className="card-surface p-6 text-center">
        <AppIcon name="Inbox" size={28} className="mx-auto text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">Nenhum orçamento recebido ainda</p>
      </div>
    );
  }

  const newCount = requests.filter(r => r.status === 'novo').length;

  return (
    <div className="space-y-2">
      {newCount > 0 && (
        <div className="flex items-center gap-2 px-1">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-xs font-semibold text-orange-400">{newCount} novo{newCount > 1 ? 's' : ''}</span>
        </div>
      )}
      {requests.map(req => (
        <div key={req.id} className="card-surface p-3.5 flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            req.status === 'novo' ? 'bg-orange-500/10' : 'bg-muted'
          }`}>
            <AppIcon 
              name={req.status === 'novo' ? 'FileText' : 'CheckCircle'} 
              size={16} 
              className={req.status === 'novo' ? 'text-orange-400' : 'text-muted-foreground'} 
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground truncate">{req.name}</p>
              {req.status === 'novo' && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-500/15 text-orange-400 shrink-0">NOVO</span>
              )}
            </div>
            {req.company && <p className="text-[11px] text-muted-foreground">{req.company}</p>}
            <p className="text-xs text-muted-foreground/70 truncate mt-0.5">{req.description}</p>
            <p className="text-[10px] text-muted-foreground/50 mt-1">
              {formatDistanceToNow(new Date(req.created_at), { addSuffix: true, locale: ptBR })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
