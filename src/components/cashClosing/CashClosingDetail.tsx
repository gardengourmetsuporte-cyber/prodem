import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { exportCashClosingPdf } from '@/lib/exportPdf';
import { ptBR } from 'date-fns/locale';
import { AppIcon } from '@/components/ui/app-icon';
 import { Button } from '@/components/ui/button';
 import { Card, CardContent } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { Textarea } from '@/components/ui/textarea';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
 } from '@/components/ui/alert-dialog';
 import { CashClosing, PAYMENT_METHODS } from '@/types/cashClosing';
 import { useCashClosing } from '@/hooks/useCashClosing';
 import { toast } from 'sonner';
 
 interface Props {
   closing: CashClosing;
   isAdmin: boolean;
   onClose: () => void;
 }
 
 export function CashClosingDetail({ closing, isAdmin, onClose }: Props) {
  const { approveClosing, markDivergent, deleteClosing, updateClosing } = useCashClosing();
    const [isApproving, setIsApproving] = useState(false);
    const [isMarkingDivergent, setIsMarkingDivergent] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDivergentDialog, setShowDivergentDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [divergentNotes, setDivergentNotes] = useState('');
    const [showReceipt, setShowReceipt] = useState(false);

   // Edit mode
   const [isEditing, setIsEditing] = useState(false);
   const [isSaving, setIsSaving] = useState(false);
   const [editDate, setEditDate] = useState(closing.date);
   const [editValues, setEditValues] = useState({
     cash_amount: closing.cash_amount,
     debit_amount: closing.debit_amount,
     credit_amount: closing.credit_amount,
     pix_amount: closing.pix_amount,
     meal_voucher_amount: closing.meal_voucher_amount,
     delivery_amount: closing.delivery_amount,
     signed_account_amount: closing.signed_account_amount,
   });

   const startEditing = () => {
     setEditDate(closing.date);
     setEditValues({
       cash_amount: closing.cash_amount,
       debit_amount: closing.debit_amount,
       credit_amount: closing.credit_amount,
       pix_amount: closing.pix_amount,
       meal_voucher_amount: closing.meal_voucher_amount,
       delivery_amount: closing.delivery_amount,
       signed_account_amount: closing.signed_account_amount,
     });
     setIsEditing(true);
   };

   const handleSaveEdit = async () => {
     setIsSaving(true);
     const success = await updateClosing(closing.id, {
       date: editDate,
       ...editValues,
     });
     setIsSaving(false);
     if (success) {
       setIsEditing(false);
       onClose();
     }
   };

   const updateEditValue = (key: string, value: string) => {
     const num = parseFloat(value.replace(',', '.')) || 0;
     setEditValues(prev => ({ ...prev, [key]: num }));
   };

   const getStatusConfig = (status: string) => {
     switch (status) {
       case 'approved':
         return { 
           icon: 'CheckCircle2', 
           label: 'Aprovado', 
           color: 'bg-success/10 text-success border-success/20' 
         };
       case 'divergent':
         return { 
           icon: 'AlertTriangle', 
           label: 'Divergente', 
           color: 'bg-destructive/10 text-destructive border-destructive/20' 
         };
       default:
         return { 
           icon: 'Clock', 
           label: 'Pendente', 
           color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' 
         };
     }
   };
 
   const getIcon = (iconName: string) => iconName;
 
   const handleApprove = async () => {
     setIsApproving(true);
     const success = await approveClosing(closing.id);
     setIsApproving(false);
     if (success) onClose();
   };
 
   const handleMarkDivergent = async () => {
     if (!divergentNotes.trim()) {
       toast.error('Informe o motivo da divergência');
       return;
     }
     setIsMarkingDivergent(true);
     const success = await markDivergent(closing.id, divergentNotes);
     setIsMarkingDivergent(false);
     setShowDivergentDialog(false);
     if (success) onClose();
   };
 
     const handleDelete = async () => {
       setIsDeleting(true);
       try {
         const success = await deleteClosing(closing.id);
         if (success) {
           setShowDeleteDialog(false);
           onClose();
         }
       } finally {
         setIsDeleting(false);
       }
     };
 
   const status = getStatusConfig(closing.status);

   // Allow edit/delete for admin OR for the user who created (only pending)
   const canEdit = closing.status === 'pending';
   const canDelete = isAdmin || closing.status === 'pending';
 
   return (
     <ScrollArea className="h-[calc(90vh-80px)] pr-4">
       <div className="space-y-4 pb-6 pt-4">
         {/* Status Badge + Actions */}
         <div className="flex items-center justify-between">
           <Badge 
             variant="outline" 
             className={`${status.color} text-sm px-3 py-1`}
           >
             <AppIcon name={status.icon} className="w-4 h-4 mr-1" />
             {status.label}
           </Badge>
           
            <div className="flex items-center gap-1">
              {canEdit && !isEditing && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-primary"
                  onClick={startEditing}
                >
                  <AppIcon name="Pencil" className="w-5 h-5" />
                </Button>
              )}
              {isEditing && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground"
                  onClick={() => setIsEditing(false)}
                >
                  <AppIcon name="X" className="w-5 h-5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground"
                onClick={() => exportCashClosingPdf(closing)}
              >
                <AppIcon name="Receipt" className="w-5 h-5" />
              </Button>
              {canDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <AppIcon name="Trash2" className="w-5 h-5" />
                </Button>
              )}
             </div>
          </div>
 
         {/* Info Card */}
         <Card className="card-unified">
           <CardContent className="p-4 space-y-3">
             <div className="flex items-center gap-3">
               <AppIcon name="User" className="w-5 h-5 text-muted-foreground" />
               <div>
                 <p className="text-sm text-muted-foreground">Responsável</p>
                 <p className="font-medium">{closing.profile?.full_name || 'Usuário'}</p>
               </div>
             </div>
             <div className="flex items-center gap-3">
               <AppIcon name="Calendar" className="w-5 h-5 text-muted-foreground" />
               <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Data</p>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="h-10 mt-1"
                    />
                  ) : (
                    <p className="font-medium">
                      {format(parseISO(closing.date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  )}
                </div>
             </div>
             <div className="flex items-center gap-3">
               <AppIcon name="Building2" className="w-5 h-5 text-muted-foreground" />
               <div>
                 <p className="text-sm text-muted-foreground">Unidade</p>
                 <p className="font-medium">{closing.unit_name}</p>
               </div>
             </div>
          </CardContent>
        </Card>

        {/* Payment Breakdown */}
        <Card className="card-unified">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold mb-2">Valores por Meio de Pagamento</h3>
            
            {PAYMENT_METHODS.map(method => {
              const Icon = getIcon(method.icon);
              const value = isEditing 
                ? (editValues[method.key as keyof typeof editValues] ?? 0)
                : (closing[method.key as keyof CashClosing] as number);
              if (!isEditing && value === 0) return null;
              
              return (
                <div key={method.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${method.color}20` }}
                    >
                      <AppIcon name={Icon} className="w-4 h-4" style={{ color: method.color }} />
                    </div>
                    <span className="text-sm">{method.label}</span>
                  </div>
                  {isEditing ? (
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      value={editValues[method.key as keyof typeof editValues] || ''}
                      onChange={(e) => updateEditValue(method.key, e.target.value)}
                      className="w-28 h-9 text-right"
                      placeholder="0,00"
                    />
                  ) : (
                    <span className="font-medium">
                      R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                </div>
              );
            })}

            {/* Total */}
            {(() => {
              const vals = isEditing ? editValues : {
                cash_amount: closing.cash_amount,
                debit_amount: closing.debit_amount,
                credit_amount: closing.credit_amount,
                pix_amount: closing.pix_amount,
                meal_voucher_amount: closing.meal_voucher_amount,
                delivery_amount: closing.delivery_amount,
                signed_account_amount: closing.signed_account_amount,
              };
              const rawTotal = Object.values(vals).reduce((s, v) => s + (v || 0), 0);
              return (
                <div className="border-t pt-3 mt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Total em Vendas</span>
                    <span className="text-xl font-bold text-primary">
                      R$ {rawTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              );
            })()}

            {!isEditing && closing.cash_difference !== 0 && (
              <div className="flex items-center justify-between text-amber-600 text-sm">
                <span>Diferença de caixa</span>
                <span className="font-medium">
                  R$ {closing.cash_difference.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Edit button */}
        {isEditing && (
          <Button
            onClick={handleSaveEdit}
            disabled={isSaving}
            className="w-full h-12"
          >
            {isSaving ? (
              <AppIcon name="Loader2" className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <AppIcon name="Save" className="w-4 h-4 mr-2" />
            )}
            Salvar Alterações
          </Button>
        )}
 
        {/* Expenses */}
        {closing.expenses && closing.expenses.length > 0 && (
          <Card className="card-unified">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <AppIcon name="Receipt" className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold">Gastos do Dia</h3>
              </div>
              
              {closing.expenses.map((expense, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{expense.description}</span>
                  <span className="font-medium text-destructive">
                    - R$ {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}

              <div className="border-t pt-2 mt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total de gastos</span>
                  <span className="font-medium text-destructive">
                    - R$ {closing.expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

         {/* Receipt */}
         <Card className="card-unified">
           <CardContent className="p-4">
             <div className="flex items-center justify-between mb-3">
               <div className="flex items-center gap-2">
                 <AppIcon name="FileImage" className="w-5 h-5 text-muted-foreground" />
                 <span className="font-medium">Comprovante PDV</span>
               </div>
              {closing.receipt_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReceipt(!showReceipt)}
                >
                  {showReceipt ? 'Ocultar' : 'Visualizar'}
                </Button>
              )}
             </div>
             
           {!closing.receipt_url && (
             <p className="text-sm text-muted-foreground">Nenhum comprovante anexado</p>
           )}
           
           {showReceipt && closing.receipt_url && (
              <img 
                src={closing.receipt_url} 
                alt="Comprovante" 
                className="w-full rounded-xl border"
                onError={(e) => {
                  const img = e.currentTarget;
                  // If public URL fails, try signed URL
                  if (!img.dataset.retried) {
                    img.dataset.retried = 'true';
                    // Extract path from public URL
                    const match = closing.receipt_url.match(/cash-receipts\/(.+)$/);
                    if (match) {
                      import('@/integrations/supabase/client').then(({ supabase }) => {
                        supabase.storage
                          .from('cash-receipts')
                          .createSignedUrl(match[1].split('?')[0], 3600)
                          .then(({ data }) => {
                            if (data?.signedUrl) {
                              img.src = data.signedUrl;
                            }
                          });
                      });
                    }
                  }
                }}
              />
            )}
           </CardContent>
         </Card>
 
         {/* Notes */}
         {closing.notes && (
           <Card className="card-unified">
             <CardContent className="p-4">
               <div className="flex items-center gap-2 mb-2">
                 <AppIcon name="MessageSquare" className="w-5 h-5 text-muted-foreground" />
                 <span className="font-medium">Observações</span>
               </div>
               <p className="text-sm text-muted-foreground">{closing.notes}</p>
             </CardContent>
           </Card>
         )}
 
         {/* Validation Notes (if divergent) */}
         {closing.status === 'divergent' && closing.validation_notes && (
           <Card className="card-unified border-destructive/50">
             <CardContent className="p-4">
               <div className="flex items-center gap-2 mb-2">
                 <AppIcon name="AlertTriangle" className="w-5 h-5 text-destructive" />
                 <span className="font-medium text-destructive">Motivo da Divergência</span>
               </div>
               <p className="text-sm">{closing.validation_notes}</p>
               {closing.validator_profile && (
                 <p className="text-xs text-muted-foreground mt-2">
                   Por {closing.validator_profile.full_name} em{' '}
                   {closing.validated_at && format(new Date(closing.validated_at), "dd/MM/yyyy 'às' HH:mm")}
                 </p>
               )}
             </CardContent>
           </Card>
         )}
 
         {/* Approved info */}
         {closing.status === 'approved' && closing.validator_profile && (
           <Card className="card-unified border-success/50">
             <CardContent className="p-4">
               <div className="flex items-center gap-2">
                 <AppIcon name="CheckCircle2" className="w-5 h-5 text-success" />
                 <div>
                   <span className="font-medium text-success">Aprovado</span>
                   <p className="text-xs text-muted-foreground">
                     Por {closing.validator_profile.full_name} em{' '}
                     {closing.validated_at && format(new Date(closing.validated_at), "dd/MM/yyyy 'às' HH:mm")}
                   </p>
                 </div>
               </div>
               {closing.financial_integrated && (
                 <p className="text-xs text-success mt-2">
                   ✓ Integrado ao módulo financeiro
                 </p>
               )}
             </CardContent>
           </Card>
         )}
 
         {/* Admin Actions */}
         {isAdmin && closing.status === 'pending' && !isEditing && (
           <div className="flex gap-3 pt-2">
             <Button
               variant="outline"
               className="flex-1 h-12 border-destructive text-destructive hover:bg-destructive/10"
               onClick={() => setShowDivergentDialog(true)}
             >
               <AppIcon name="AlertTriangle" className="w-4 h-4 mr-2" />
               Divergente
             </Button>
             <Button
               className="flex-1 h-12 bg-success hover:bg-success/90"
               onClick={handleApprove}
               disabled={isApproving}
             >
               {isApproving ? (
                 <AppIcon name="Loader2" className="w-4 h-4 mr-2 animate-spin" />
               ) : (
                 <AppIcon name="CheckCircle2" className="w-4 h-4 mr-2" />
               )}
               Aprovar
             </Button>
           </div>
         )}
       </div>
 
       {/* Divergent Dialog */}
       <AlertDialog open={showDivergentDialog} onOpenChange={setShowDivergentDialog}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Marcar como Divergente</AlertDialogTitle>
             <AlertDialogDescription>
               Informe o motivo da divergência. Esta informação será visível para o funcionário.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <div className="py-4">
             <Label>Motivo da divergência *</Label>
             <Textarea
               placeholder="Descreva o problema encontrado..."
               value={divergentNotes}
               onChange={(e) => setDivergentNotes(e.target.value)}
               rows={3}
               className="mt-2"
             />
           </div>
           <AlertDialogFooter>
             <AlertDialogCancel>Cancelar</AlertDialogCancel>
             <AlertDialogAction
               onClick={handleMarkDivergent}
               disabled={isMarkingDivergent || !divergentNotes.trim()}
               className="bg-destructive hover:bg-destructive/90"
             >
               {isMarkingDivergent ? (
                 <AppIcon name="Loader2" className="w-4 h-4 mr-2 animate-spin" />
               ) : null}
               Confirmar Divergência
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
 
       {/* Delete Dialog */}
       <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Excluir Fechamento</AlertDialogTitle>
             <AlertDialogDescription>
                Tem certeza que deseja excluir este fechamento? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete();
                }}
                disabled={isDeleting}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isDeleting && <AppIcon name="Loader2" className="w-4 h-4 mr-2 animate-spin" />}
                {isDeleting ? 'Excluindo...' : 'Excluir'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </ScrollArea>
    );
  }