import { useState, useMemo } from 'react';
import { formatCurrency } from '@/lib/format';
import { Employee } from '@/types/employee';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/app-icon';
import { DefaultAvatar } from '@/components/profile/DefaultAvatar';
import { useFabAction } from '@/contexts/FabActionContext';
import { cn } from '@/lib/utils';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface EmployeeListProps {
  employees: Employee[];
  isLoading: boolean;
  onEdit: (employee: Employee) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onToggleActive: (employee: Employee) => void;
  isAdmin: boolean;
}

export function EmployeeList({ employees, isLoading, onEdit, onNew, onDelete, onToggleActive, isAdmin }: EmployeeListProps) {
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  useFabAction({
    icon: 'Plus',
    label: 'Novo funcionário',
    onClick: onNew,
  }, [onNew]);

  const filtered = useMemo(() => {
    return employees.filter(emp => {
      const q = search.toLowerCase();
      const matchesSearch = !q || emp.full_name.toLowerCase().includes(q) ||
        emp.role?.toLowerCase().includes(q) ||
        emp.department?.toLowerCase().includes(q);
      const matchesStatus = showInactive ? true : emp.is_active;
      return matchesSearch && matchesStatus;
    });
  }, [employees, search, showInactive]);

  // Group by department
  const grouped = useMemo(() => {
    const map = new Map<string, Employee[]>();
    filtered.forEach(emp => {
      const dept = emp.department || 'Sem setor';
      if (!map.has(dept)) map.set(dept, []);
      map.get(dept)!.push(emp);
    });
    // Sort departments alphabetically, "Sem setor" last
    return Array.from(map.entries()).sort((a, b) => {
      if (a[0] === 'Sem setor') return 1;
      if (b[0] === 'Sem setor') return -1;
      return a[0].localeCompare(b[0]);
    });
  }, [filtered]);

  const activeCount = employees.filter(e => e.is_active).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Carregando equipe...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header stats */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Equipe</h1>
          <p className="text-sm text-muted-foreground">{activeCount} colaboradores ativos</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <AppIcon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, cargo ou setor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Button
          variant={showInactive ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setShowInactive(!showInactive)}
          className="text-xs"
        >
          <AppIcon name="Eye" size={14} className="mr-1" />
          {showInactive ? 'Ocultando inativos' : 'Mostrar inativos'}
        </Button>
      </div>

      {/* Grouped list */}
      <div className="space-y-5">
        {grouped.map(([dept, emps]) => (
          <div key={dept}>
            <div className="flex items-center gap-2 mb-2 px-1">
              <AppIcon name="Building2" size={14} className="text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{dept}</span>
              <span className="text-[10px] text-muted-foreground/60">({emps.length})</span>
            </div>

            <div className="space-y-1.5">
              {emps.map((emp) => {
                const avatarUrl = (emp as any).avatar_url as string | null;
                return (
                  <div
                    key={emp.id}
                    className={cn(
                      "card-unified-interactive p-3.5 flex items-center gap-3",
                      !emp.is_active && "opacity-50"
                    )}
                    onClick={() => isAdmin ? onEdit(emp) : undefined}
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={emp.full_name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="shrink-0">
                        <DefaultAvatar name={emp.full_name} size={40} userId={emp.user_id || undefined} />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm truncate">{emp.full_name}</span>
                        {!emp.is_active && (
                          <Badge variant="secondary" className="text-[9px] px-1 py-0">Inativo</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {emp.role || 'Sem cargo definido'}
                      </p>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs text-muted-foreground hidden sm:block">
                          {formatCurrency(emp.base_salary)}
                        </span>
                        <AppIcon name="ChevronRight" size={16} className="text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <AppIcon name="Users" size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum colaborador encontrado</p>
          {isAdmin && (
            <Button variant="outline" size="sm" className="mt-3" onClick={onNew}>
              <AppIcon name="Plus" size={14} className="mr-1" />
              Cadastrar primeiro colaborador
            </Button>
          )}
        </div>
      )}

      {/* Delete dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir funcionário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteId) { onDelete(deleteId); setDeleteId(null); } }}
              className="bg-destructive text-destructive-foreground"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
