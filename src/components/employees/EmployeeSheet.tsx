import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useEmployees } from '@/hooks/useEmployees';
import { useUnit } from '@/contexts/UnitContext';
import { Employee } from '@/types/employee';
import { UserWithRole } from '@/hooks/useUsers';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { LoadingButton } from '@/components/ui/loading-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppIcon } from '@/components/ui/app-icon';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';

const PRODEM_DEPARTMENTS = [
  'Produção', 'Solda', 'Pintura', 'Montagem', 'Corte',
  'Almoxarifado', 'Engenharia', 'Qualidade', 'Administrativo', 'Expedição',
];

const PRODEM_ROLES = [
  'Operador de Produção', 'Soldador', 'Pintor', 'Montador',
  'Auxiliar de Produção', 'Líder de Produção', 'Almoxarife',
  'Engenheiro', 'Projetista', 'Analista de Qualidade',
  'Auxiliar Administrativo', 'Motorista', 'Estagiário',
];

interface FormData {
  full_name: string;
  cpf: string;
  role: string;
  department: string;
  admission_date: string;
  base_salary: number;
  is_active: boolean;
  notes: string;
  user_id: string;
  pin_code: string;
}

interface EmployeeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  availableUsers: UserWithRole[];
}

export function EmployeeSheet({ open, onOpenChange, employee, availableUsers }: EmployeeSheetProps) {
  const { addEmployee, updateEmployee, deleteEmployee } = useEmployees();
  const { activeUnitId } = useUnit();
  const [showDelete, setShowDelete] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: { full_name: '', cpf: '', role: '', department: '', admission_date: '', base_salary: 0, is_active: true, notes: '', user_id: '', pin_code: '' },
  });

  const selectedUserId = watch('user_id');
  const selectedDept = watch('department');
  const selectedRole = watch('role');

  useEffect(() => {
    if (employee) {
      reset({
        full_name: employee.full_name,
        cpf: employee.cpf || '',
        role: employee.role || '',
        department: employee.department || '',
        admission_date: employee.admission_date || '',
        base_salary: employee.base_salary,
        is_active: employee.is_active,
        notes: employee.notes || '',
        user_id: employee.user_id || '',
        pin_code: (employee as any).pin_code || '',
      });
    } else {
      reset({ full_name: '', cpf: '', role: '', department: '', admission_date: '', base_salary: 0, is_active: true, notes: '', user_id: '', pin_code: '' });
    }
  }, [employee, reset]);

  useEffect(() => {
    if (selectedUserId && !employee) {
      const user = availableUsers.find(u => u.user_id === selectedUserId);
      if (user) setValue('full_name', user.full_name);
    }
  }, [selectedUserId, availableUsers, setValue, employee]);

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        full_name: data.full_name,
        cpf: data.cpf || null,
        role: data.role || null,
        department: data.department || null,
        admission_date: data.admission_date || null,
        base_salary: data.base_salary,
        is_active: data.is_active,
        notes: data.notes || null,
        user_id: data.user_id || null,
        unit_id: activeUnitId || null,
        pin_code: data.pin_code || null,
      };
      if (employee) {
        await updateEmployee({ id: employee.id, ...payload });
      } else {
        await addEmployee(payload);
      }
      onOpenChange(false);
    } catch { /* handled in hook */ }
  };

  const handleDelete = async () => {
    if (employee) {
      await deleteEmployee(employee.id);
      setShowDelete(false);
      onOpenChange(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <AppIcon name="User" size={20} className="text-primary" />
              {employee ? 'Editar Colaborador' : 'Novo Colaborador'}
            </SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-6">
            {/* Vincular usuário */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Vincular ao sistema</Label>
              <Select value={selectedUserId} onValueChange={(v) => setValue('user_id', v === 'none' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Nenhum (opcional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {availableUsers.map((u) => (
                    <SelectItem key={u.user_id} value={u.user_id}>{u.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nome */}
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Nome completo *</Label>
              <Input id="full_name" {...register('full_name', { required: true })} placeholder="Nome do colaborador" />
            </div>

            {/* CPF */}
            <div className="space-y-1.5">
              <Label htmlFor="cpf">CPF</Label>
              <Input id="cpf" {...register('cpf')} placeholder="000.000.000-00" />
            </div>

            {/* Senha de Produção (PIN) */}
            <div className="space-y-1.5">
              <Label htmlFor="pin_code">Senha de Produção (4 dígitos)</Label>
              <Input
                id="pin_code"
                {...register('pin_code', { maxLength: 4 })}
                placeholder="Ex: 1234"
                maxLength={4}
                inputMode="numeric"
                pattern="[0-9]*"
                className="text-lg font-mono tracking-[0.5em] text-center"
              />
              <p className="text-[11px] text-muted-foreground">Senha usada para iniciar tarefas na produção</p>
            </div>

            {/* Setor (Department) */}
            <div className="space-y-1.5">
              <Label>Setor</Label>
              <Select value={selectedDept} onValueChange={(v) => setValue('department', v === 'custom' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Selecione o setor" /></SelectTrigger>
                <SelectContent>
                  {PRODEM_DEPARTMENTS.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                  <SelectItem value="custom">Outro...</SelectItem>
                </SelectContent>
              </Select>
              {selectedDept === '' && (
                <Input {...register('department')} placeholder="Digite o setor" className="mt-1" />
              )}
            </div>

            {/* Cargo */}
            <div className="space-y-1.5">
              <Label>Cargo</Label>
              <Select value={selectedRole} onValueChange={(v) => setValue('role', v === 'custom' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Selecione o cargo" /></SelectTrigger>
                <SelectContent>
                  {PRODEM_ROLES.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                  <SelectItem value="custom">Outro...</SelectItem>
                </SelectContent>
              </Select>
              {selectedRole === '' && (
                <Input {...register('role')} placeholder="Digite o cargo" className="mt-1" />
              )}
            </div>

            {/* Admissão */}
            <div className="space-y-1.5">
              <Label htmlFor="admission_date">Data de admissão</Label>
              <Input id="admission_date" type="date" {...register('admission_date')} />
            </div>

            {/* Salário */}
            <div className="space-y-1.5">
              <Label htmlFor="base_salary">Salário base (R$)</Label>
              <Input id="base_salary" type="number" step="0.01" min="0" {...register('base_salary', { valueAsNumber: true })} placeholder="0,00" />
            </div>

            {/* Ativo */}
            <div className="flex items-center justify-between py-1">
              <Label htmlFor="is_active">Colaborador ativo</Label>
              <Switch id="is_active" checked={watch('is_active')} onCheckedChange={(c) => setValue('is_active', c)} />
            </div>

            {/* Observações */}
            <div className="space-y-1.5">
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" {...register('notes')} placeholder="Anotações..." rows={2} />
            </div>

            <LoadingButton type="submit" className="w-full" loading={isSubmitting} loadingText="Salvando...">
              {employee ? 'Salvar alterações' : 'Cadastrar'}
            </LoadingButton>

            {employee && (
              <Button type="button" variant="ghost" className="w-full text-destructive" onClick={() => setShowDelete(true)}>
                <AppIcon name="Trash2" size={16} className="mr-2" />
                Excluir colaborador
              </Button>
            )}
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir colaborador?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
