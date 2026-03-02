import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { useCashClosing } from '@/hooks/useCashClosing';
import { PAYMENT_METHODS } from '@/types/cashClosing';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { AppIcon } from '@/components/ui/app-icon';

const DRAFT_KEY = 'cash_closing_draft';

interface DraftData {
  selectedDate: string;
  initialCash: number;
  cashCounted: number;
  debitAmount: number;
  creditAmount: number;
  pixAmount: number;
  mealVoucherAmount: number;
  deliveryAmount: number;
  signedAccountAmount: number;
  cashDifference: number;
  notes: string;
  expenses: ExpenseItem[];
  savedAt: number;
}

function loadDraft(): DraftData | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft: DraftData = JSON.parse(raw);
    // Expire drafts older than 24h
    if (Date.now() - draft.savedAt > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(DRAFT_KEY);
      return null;
    }
    return draft;
  } catch { return null; }
}

function saveDraft(data: Omit<DraftData, 'savedAt'>) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...data, savedAt: Date.now() }));
  } catch {}
}

export function clearCashClosingDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

interface Props {
  onSuccess: () => void;
}

interface ExpenseItem {
  description: string;
  amount: number;
}

function DateInline({ selectedDate, onSelect, todayDate, minAllowedDate }: {
  selectedDate: Date; onSelect: (d: Date) => void; todayDate: Date; minAllowedDate: Date;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button variant="outline" size="sm" className="gap-2 font-medium" onClick={() => setOpen(!open)}>
        <AppIcon name="CalendarIcon" className="w-4 h-4" />
        {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
      </Button>
      {open && (
        <div className="mt-2 rounded-xl border bg-card p-2">
          <Calendar mode="single" selected={selectedDate} onSelect={(d) => { if (d) { onSelect(d); setOpen(false); } }} locale={ptBR} disabled={(date) => date > todayDate || date < minAllowedDate} className="p-3 pointer-events-auto" />
          <p className="text-xs text-muted-foreground px-3 pb-2">Disponível até 3 dias anteriores.</p>
        </div>
      )}
    </div>
  );
}

export function CashClosingForm({ onSuccess }: Props) {
  const { profile, isAdmin } = useAuth();
  const { uploadReceipt, createClosing, checkChecklistCompleted } = useCashClosing();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  
  const now = new Date();
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const minAllowedDate = subDays(todayDate, 3);
  const currentHour = now.getHours();
  const defaultDate = currentHour < 6 ? subDays(todayDate, 1) : todayDate;

  const draft = useRef(loadDraft()).current;
  
  const [selectedDate, setSelectedDate] = useState<Date>(
    draft ? new Date(draft.selectedDate + 'T12:00:00') : defaultDate
  );
  const operationalDate = format(selectedDate, 'yyyy-MM-dd');
  
  const [initialCash, setInitialCash] = useState(draft?.initialCash ?? 0);
  const [cashCounted, setCashCounted] = useState(draft?.cashCounted ?? 0);
  const [debitAmount, setDebitAmount] = useState(draft?.debitAmount ?? 0);
  const [creditAmount, setCreditAmount] = useState(draft?.creditAmount ?? 0);
  const [pixAmount, setPixAmount] = useState(draft?.pixAmount ?? 0);
  const [mealVoucherAmount, setMealVoucherAmount] = useState(draft?.mealVoucherAmount ?? 0);
  const [deliveryAmount, setDeliveryAmount] = useState(draft?.deliveryAmount ?? 0);
  const [signedAccountAmount, setSignedAccountAmount] = useState(draft?.signedAccountAmount ?? 0);
  const [cashDifference, setCashDifference] = useState(draft?.cashDifference ?? 0);
  const [notes, setNotes] = useState(draft?.notes ?? '');
  
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checklistStatus, setChecklistStatus] = useState<'checking' | 'completed' | 'incomplete' | null>(null);
  const [expenses, setExpenses] = useState<ExpenseItem[]>(draft?.expenses ?? []);
  const [newExpense, setNewExpense] = useState<ExpenseItem>({ description: '', amount: 0 });

  // Show toast if draft was restored
  const draftNotified = useRef(false);
  useEffect(() => {
    if (draft && !draftNotified.current) {
      draftNotified.current = true;
      toast.info('Rascunho restaurado', { description: 'Seu fechamento anterior foi recuperado.' });
    }
  }, [draft]);

  // Auto-save draft debounced to avoid jank during typing
  const draftTimerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      saveDraft({
        selectedDate: operationalDate,
        initialCash,
        cashCounted,
        debitAmount,
        creditAmount,
        pixAmount,
        mealVoucherAmount,
        deliveryAmount,
        signedAccountAmount,
        cashDifference,
        notes,
        expenses,
      });
    }, 500);
    return () => { if (draftTimerRef.current) clearTimeout(draftTimerRef.current); };
  }, [operationalDate, initialCash, cashCounted, debitAmount, creditAmount, pixAmount, mealVoucherAmount, deliveryAmount, signedAccountAmount, cashDifference, notes, expenses]);

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Cálculos conforme regra da unidade:
  // Dinheiro vendido = Dinheiro contado + Gastos - Caixa inicial
  const cashSold = cashCounted + totalExpenses - initialCash;
  // Total esperado no caixa = Caixa inicial + Dinheiro vendido - Gastos (= cashCounted)
  const expectedCashInDrawer = initialCash + cashSold - totalExpenses;
  // Total de vendas = todos os meios
  const totalPayments = cashSold + debitAmount + creditAmount + pixAmount + mealVoucherAmount + deliveryAmount + signedAccountAmount;

  const paymentValues: Record<string, { value: number; setter: (v: number) => void }> = {
    cash_amount: { value: cashCounted, setter: setCashCounted },
    debit_amount: { value: debitAmount, setter: setDebitAmount },
    credit_amount: { value: creditAmount, setter: setCreditAmount },
    pix_amount: { value: pixAmount, setter: setPixAmount },
    meal_voucher_amount: { value: mealVoucherAmount, setter: setMealVoucherAmount },
    delivery_amount: { value: deliveryAmount, setter: setDeliveryAmount },
    signed_account_amount: { value: signedAccountAmount, setter: setSignedAccountAmount },
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleValueChange = (key: string, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value) || 0;
    paymentValues[key]?.setter(numValue);
  };

  const addExpense = () => {
    if (!newExpense.description.trim()) {
      toast.error('Informe a descrição do gasto');
      return;
    }
    if (newExpense.amount <= 0) {
      toast.error('Informe o valor do gasto');
      return;
    }
    setExpenses(prev => [...prev, { ...newExpense }]);
    setNewExpense({ description: '', amount: 0 });
  };

  const removeExpense = (index: number) => {
    setExpenses(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Checklist check removed — allow submission regardless of checklist status
    setChecklistStatus('completed');

    if (totalPayments <= 0) {
      toast.error('Informe pelo menos um valor de pagamento');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload receipt if provided
      let receiptUrl = '';
      if (receiptFile) {
        const uploadedUrl = await uploadReceipt(receiptFile);
        if (uploadedUrl) {
          receiptUrl = uploadedUrl;
        }
      }

      // Create closing
      const success = await createClosing({
        date: operationalDate,
        unit_name: 'Principal',
        initial_cash: initialCash,
        cash_amount: cashSold, // Salvar o dinheiro vendido (calculado)
        debit_amount: debitAmount,
        credit_amount: creditAmount,
        pix_amount: pixAmount,
        meal_voucher_amount: mealVoucherAmount,
        delivery_amount: deliveryAmount,
        signed_account_amount: signedAccountAmount,
        cash_difference: cashDifference,
        receipt_url: receiptUrl,
        notes: notes,
        expenses: expenses,
      });

      if (success) {
        clearCashClosingDraft();
        onSuccess();
      } else {
        toast.error('Não foi possível salvar o fechamento. Seus dados estão preservados, tente novamente.');
      }
    } catch (err) {
      console.error('Cash closing submit error:', err);
      toast.error('Erro inesperado ao enviar. Seus dados estão preservados, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getIcon = (iconName: string) => iconName;

  return (
    <div className="space-y-4 pb-6">
      {/* Header Info with Date Selector */}
      <Card className="card-unified">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Data operacional:</span>
              <DateInline
                selectedDate={selectedDate}
                onSelect={setSelectedDate}
                todayDate={todayDate}
                minAllowedDate={minAllowedDate}
              />
            </div>
            <div>
              <span className="text-muted-foreground">Responsável:</span>
              <span className="ml-2 font-medium">{profile?.full_name || 'Usuário'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Turno / Shift info */}
      <Card className="card-unified border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-primary/15">
              <AppIcon name="Factory" className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Fechamento Industrial</p>
              <p className="text-xs text-muted-foreground">Registre os recebimentos e despesas operacionais do dia</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Values */}
      {/* Initial Cash */}
      <Card className="card-unified">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AppIcon name="Wallet" className="w-4 h-4" />
            Caixa Inicial
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-warning/10">
              <AppIcon name="Wallet" className="w-5 h-5 text-warning" />
            </div>
            <Label className="flex-1 text-sm font-medium">Saldo inicial do caixa</Label>
            <div className="relative w-32">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                className="pl-10 text-right h-11"
                value={initialCash || ''}
                onChange={(e) => setInitialCash(parseFloat(e.target.value) || 0)}
                placeholder="0,00"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Valor em dinheiro disponível no início do expediente
          </p>
        </CardContent>
      </Card>

      {/* Cash Counted (physical money at closing) */}
      <Card className="card-unified">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AppIcon name="Banknote" className="w-4 h-4" />
            Dinheiro Contado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: '#22c55e20' }}
            >
              <AppIcon name="Banknote" className="w-5 h-5" style={{ color: '#22c55e' }} />
            </div>
            <Label className="flex-1 text-sm font-medium">Valor contado (notas + moedas)</Label>
            <div className="relative w-32">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                className="pl-10 text-right h-11"
                value={cashCounted || ''}
                onChange={(e) => setCashCounted(parseFloat(e.target.value) || 0)}
                placeholder="0,00"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Valor físico em dinheiro contado no fim do expediente
          </p>
        </CardContent>
      </Card>

      {/* Recebimentos do dia */}
      <Card className="card-unified">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recebimentos do Dia</CardTitle>
          <p className="text-xs text-muted-foreground">Valores recebidos de clientes por forma de pagamento</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {PAYMENT_METHODS.filter(m => m.key !== 'cash_amount').map(method => {
            const Icon = getIcon(method.icon);
            const { value } = paymentValues[method.key] || { value: 0 };
            if (!paymentValues[method.key]) return null;
            return (
              <div key={method.key} className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${method.color}20` }}
                >
                  <AppIcon name={Icon} className="w-5 h-5" style={{ color: method.color }} />
                </div>
                <Label className="flex-1 text-sm font-medium">{method.label}</Label>
                <div className="relative w-32">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    className="pl-10 text-right h-11"
                    value={value || ''}
                    onChange={(e) => handleValueChange(method.key, e.target.value)}
                    placeholder="0,00"
                  />
                </div>
              </div>
            );
          })}

        </CardContent>
      </Card>

      {/* Expenses Section */}
      <Card className="card-unified">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AppIcon name="Receipt" className="w-4 h-4" />
            Despesas Operacionais (opcional)
          </CardTitle>
          <p className="text-xs text-muted-foreground">Compras de material, manutenção, combustível, etc.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Existing expenses */}
          {expenses.map((expense, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
              <span className="flex-1 text-sm">{expense.description}</span>
              <span className="font-medium text-destructive">
                - R$ {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => removeExpense(index)}
              >
                <AppIcon name="Trash2" className="w-4 h-4" />
              </Button>
            </div>
          ))}

          {/* Add new expense */}
          <div className="flex gap-2">
            <Input
              placeholder="Descrição (ex: Eletrodo, Disco de corte)"
              value={newExpense.description}
              onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
              className="flex-1"
            />
            <div className="relative w-28">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                className="pl-8 text-right"
                value={newExpense.amount || ''}
                onChange={(e) => setNewExpense(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                placeholder="0,00"
              />
            </div>
            <Button
              variant="secondary"
              size="icon"
              onClick={addExpense}
              className="shrink-0"
            >
              <AppIcon name="Plus" className="w-4 h-4" />
            </Button>
          </div>

          {expenses.length > 0 && (
            <div className="border-t pt-2 mt-2 flex justify-between text-sm">
              <span className="text-muted-foreground">Total de gastos:</span>
              <span className="font-medium text-destructive">
                - R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calculated Sales Summary */}
      <Card className="card-unified bg-success/5 border-success/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">📊 Resumo do Dia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Dinheiro recebido */}
          <div className="bg-background/50 rounded-lg p-3 space-y-1">
            <div className="text-xs text-muted-foreground">Dinheiro Recebido (calculado)</div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Contado ({cashCounted.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) + Despesas ({totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) − Inicial ({initialCash.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
              </span>
              <span className="text-lg font-bold text-success">
                R$ {cashSold.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="border-t pt-2 mt-2 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">+ Boleto</span>
              <span>R$ {debitAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">+ Transferência / TED</span>
              <span>R$ {creditAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">+ Pix</span>
              <span>R$ {pixAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">+ Cheque</span>
              <span>R$ {mealVoucherAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">+ Cartão</span>
              <span>R$ {deliveryAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">+ Faturado (a prazo)</span>
              <span>R$ {signedAccountAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="border-t pt-3 mt-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-lg">Total Recebido</span>
              <span className="text-2xl font-bold text-primary">
                R$ {totalPayments.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="border-t pt-3 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Saldo esperado no caixa</span>
              <span className="font-semibold text-primary">
                R$ {expectedCashInDrawer.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cash Difference (optional) */}
      <Card className="card-unified">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Label className="flex-1 text-sm">Diferença de Caixa (se houver)</Label>
            <div className="relative w-32">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                className="pl-10 text-right h-11"
                value={cashDifference || ''}
                onChange={(e) => setCashDifference(parseFloat(e.target.value) || 0)}
                placeholder="0,00"
              />
            </div>
          </div>
          {cashDifference !== 0 && (
            <p className="text-xs text-warning mt-2 flex items-center gap-1">
              <AppIcon name="AlertCircle" className="w-3 h-3" />
              {cashDifference > 0 ? 'Sobra' : 'Falta'} no caixa será registrada
            </p>
          )}
        </CardContent>
      </Card>

      {/* Receipt Upload */}
      <Card className="card-unified">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AppIcon name="Upload" className="w-4 h-4" />
            Comprovante / NF (opcional)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          
          {receiptPreview ? (
            <div className="relative">
              <img 
                src={receiptPreview} 
                alt="Comprovante" 
                className="w-full h-48 object-cover rounded-xl"
              />
              <div className="absolute bottom-2 right-2 flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <AppIcon name="Camera" className="w-4 h-4 mr-1" />
                  Câmera
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => galleryInputRef.current?.click()}
                >
                  <AppIcon name="Upload" className="w-4 h-4 mr-1" />
                  Galeria
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-32 border-dashed flex flex-col gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <AppIcon name="Camera" className="w-7 h-7 text-muted-foreground" />
                <span className="text-muted-foreground text-sm">Câmera</span>
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-32 border-dashed flex flex-col gap-2"
                onClick={() => galleryInputRef.current?.click()}
              >
                <AppIcon name="Upload" className="w-7 h-7 text-muted-foreground" />
                <span className="text-muted-foreground text-sm">Galeria / Arquivo</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="card-unified">
        <CardContent className="p-4">
          <Label className="text-sm mb-2 block">Observações (opcional)</Label>
          <Textarea
            placeholder="Alguma observação sobre o fechamento..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </CardContent>
      </Card>


      {/* Submit Button */}
      <Button
        className="w-full h-14 text-lg font-semibold"
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <AppIcon name="Loader2" className="w-5 h-5 mr-2 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <AppIcon name="CheckCircle2" className="w-5 h-5 mr-2" />
            Enviar Fechamento
          </>
        )}
      </Button>
    </div>
  );
}