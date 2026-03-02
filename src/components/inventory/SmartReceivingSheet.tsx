import { useState, useRef, useEffect } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSmartReceiving, OcrResult, SmartReceivingItem } from '@/hooks/useSmartReceiving';
import { InventoryItem, Order } from '@/types/database';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface SmartReceivingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: Order | null;
  inventoryItems: InventoryItem[];
  onComplete?: () => void;
}

type Step = 'capture' | 'processing' | 'review' | 'confirm';

export function SmartReceivingSheet({
  open,
  onOpenChange,
  order,
  inventoryItems,
  onComplete,
}: SmartReceivingSheetProps) {
  const { processImage, uploadImage, createReceiving, confirmReceiving, isProcessing } = useSmartReceiving();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const boletoInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('capture');
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [boletoFile, setBoletoFile] = useState<File | null>(null);
  const [invoicePreview, setInvoicePreview] = useState<string | null>(null);
  const [boletoPreview, setBoletoPreview] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [receivingId, setReceivingId] = useState<string | null>(null);
  const [editedItems, setEditedItems] = useState<SmartReceivingItem[]>([]);
  const [createFinancial, setCreateFinancial] = useState(true);
  const [boletoAmount, setBoletoAmount] = useState('');
  const [boletoDueDate, setBoletoDueDate] = useState<Date>(addDays(new Date(), 30));
  const [showDueCalendar, setShowDueCalendar] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [expandedItems, setExpandedItems] = useState(true);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep('capture');
        setInvoiceFile(null);
        setBoletoFile(null);
        setInvoicePreview(null);
        setBoletoPreview(null);
        setOcrResult(null);
        setReceivingId(null);
        setEditedItems([]);
        setCreateFinancial(true);
        setBoletoAmount('');
        setBoletoDueDate(addDays(new Date(), 30));
      }, 300);
    }
  }, [open]);

  const handleFileCapture = (file: File, type: 'invoice' | 'boleto') => {
    const url = URL.createObjectURL(file);
    if (type === 'invoice') {
      setInvoiceFile(file);
      setInvoicePreview(url);
    } else {
      setBoletoFile(file);
      setBoletoPreview(url);
    }
  };

  const handleProcess = async () => {
    if (!invoiceFile && !boletoFile) {
      toast.error('Tire pelo menos uma foto');
      return;
    }

    setStep('processing');

    try {
      const fileToProcess = invoiceFile || boletoFile!;
      const items = inventoryItems.map(i => ({
        id: i.id,
        name: i.name,
        unit_type: i.unit_type,
        unit_price: i.unit_price,
      }));

      const result = await processImage(fileToProcess, items);
      setOcrResult(result);

      // Upload images to storage
      let invoiceUrl: string | null = null;
      let boletoUrl: string | null = null;

      if (invoiceFile) {
        try {
          invoiceUrl = await uploadImage(invoiceFile, 'invoice');
        } catch (e) {
          console.error('Failed to upload invoice image:', e);
        }
      }
      if (boletoFile) {
        try {
          boletoUrl = await uploadImage(boletoFile, 'boleto');
        } catch (e) {
          console.error('Failed to upload boleto image:', e);
        }
      }

      // Create receiving record
      const receiving = await createReceiving({
        ocrResult: result,
        invoiceImageUrl: invoiceUrl,
        boletoImageUrl: boletoUrl,
        orderId: order?.id || null,
        supplierId: order?.supplier_id || null,
        aiRawResponse: result,
      });

      setReceivingId(receiving.id);

      // Prepare editable items
      const items2: SmartReceivingItem[] = (result.items || []).map(item => ({
        raw_description: item.description,
        raw_quantity: item.quantity,
        raw_unit_type: item.unit_type || 'unidade',
        raw_unit_price: item.unit_price || 0,
        raw_total: item.total || 0,
        inventory_item_id: item.matched_item_id,
        matched_name: item.matched_name,
        confidence: item.confidence || 0,
        confirmed_quantity: item.quantity,
        confirmed_unit_price: item.unit_price || 0,
        is_confirmed: (item.confidence || 0) >= 0.5,
        is_new_item: !item.matched_item_id,
      }));

      setEditedItems(items2);

      // Pre-fill boleto data
      if (result.boleto_amount) {
        setBoletoAmount(String(result.boleto_amount));
      } else if (result.total_amount) {
        setBoletoAmount(String(result.total_amount));
      }
      if (result.boleto_due_date) {
        setBoletoDueDate(new Date(result.boleto_due_date + 'T12:00:00'));
      }

      setStep('review');
    } catch (error: any) {
      console.error('Smart receiving error:', error);
      toast.error(error.message || 'Erro ao processar imagem');
      setStep('capture');
    }
  };

  const handleConfirm = async () => {
    if (!receivingId) return;

    setIsConfirming(true);
    try {
      await confirmReceiving({
        receivingId,
        items: editedItems,
        createFinancialEntry: createFinancial,
        boletoAmount: createFinancial ? parseFloat(boletoAmount.replace(',', '.')) || undefined : undefined,
        boletoDueDate: createFinancial ? format(boletoDueDate, 'yyyy-MM-dd') : undefined,
      });

      setStep('confirm');
      onComplete?.();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao confirmar recebimento');
    } finally {
      setIsConfirming(false);
    }
  };

  const toggleItemConfirmed = (index: number) => {
    setEditedItems(prev => prev.map((item, i) =>
      i === index ? { ...item, is_confirmed: !item.is_confirmed } : item
    ));
  };

  const updateItemQuantity = (index: number, qty: number) => {
    setEditedItems(prev => prev.map((item, i) =>
      i === index ? { ...item, confirmed_quantity: qty } : item
    ));
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return <Badge className="bg-success/20 text-success text-[10px]">Alta</Badge>;
    if (confidence >= 0.5) return <Badge className="bg-warning/20 text-warning text-[10px]">Média</Badge>;
    return <Badge className="bg-destructive/20 text-destructive text-[10px]">Baixa</Badge>;
  };

  const confirmedCount = editedItems.filter(i => i.is_confirmed && i.inventory_item_id).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-8 max-h-[85vh] overflow-y-auto max-w-[calc(100vw)] sm:max-w-lg sm:mx-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <AppIcon name="auto_awesome" size={20} className="text-primary" />
            Recebimento Inteligente
            {order?.supplier?.name && (
              <span className="text-sm font-normal text-muted-foreground">
                — {order.supplier.name}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {/* Step: Capture */}
        {step === 'capture' && (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Fotografe a nota fiscal (DANFE) e/ou o boleto para processar automaticamente.
            </p>

            {/* Invoice capture */}
            <div className="space-y-2">
              <Label className="text-foreground font-medium">📄 Nota Fiscal (DANFE)</Label>
              {invoicePreview ? (
                <div className="relative rounded-xl overflow-hidden border">
                  <img src={invoicePreview} alt="Preview NF" className="w-full max-h-48 object-cover" />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={() => { setInvoiceFile(null); setInvoicePreview(null); }}
                  >
                    <AppIcon name="Close" size={16} />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full h-24 border-dashed flex flex-col gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <AppIcon name="PhotoCamera" size={24} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Tirar foto da nota</span>
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileCapture(file, 'invoice');
                  e.target.value = '';
                }}
              />
            </div>

            {/* Boleto capture */}
            <div className="space-y-2">
              <Label className="text-foreground font-medium">🏦 Boleto (opcional)</Label>
              {boletoPreview ? (
                <div className="relative rounded-xl overflow-hidden border">
                  <img src={boletoPreview} alt="Preview Boleto" className="w-full max-h-48 object-cover" />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={() => { setBoletoFile(null); setBoletoPreview(null); }}
                  >
                    <AppIcon name="Close" size={16} />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full h-16 border-dashed flex flex-col gap-1"
                  onClick={() => boletoInputRef.current?.click()}
                >
                  <AppIcon name="PhotoCamera" size={20} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Tirar foto do boleto</span>
                </Button>
              )}
              <input
                ref={boletoInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileCapture(file, 'boleto');
                  e.target.value = '';
                }}
              />
            </div>

            <Button
              onClick={handleProcess}
              disabled={!invoiceFile && !boletoFile}
              className="w-full h-12 gap-2"
            >
              <AppIcon name="auto_awesome" size={16} />
              Processar com IA
            </Button>
          </div>
        )}

        {/* Step: Processing */}
        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="relative">
              <AppIcon name="progress_activity" size={48} className="text-primary animate-spin" />
              <AppIcon name="auto_awesome" size={20} className="text-primary absolute -top-1 -right-1 animate-pulse" />
            </div>
            <p className="text-lg font-semibold">Processando...</p>
            <p className="text-sm text-muted-foreground text-center">
              A IA está lendo e interpretando a nota fiscal. Isso pode levar alguns segundos.
            </p>
            <Progress value={isProcessing ? 60 : 100} className="w-48 h-2" />
          </div>
        )}

        {/* Step: Review */}
        {step === 'review' && ocrResult && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Fornecedor</span>
                <span className="font-semibold">{ocrResult.supplier_name}</span>
              </div>
              {ocrResult.invoice_number && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Nº NF</span>
                  <span className="font-medium">{ocrResult.invoice_number}</span>
                </div>
              )}
              {ocrResult.invoice_date && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Data</span>
                  <span className="font-medium">
                    {format(new Date(ocrResult.invoice_date + 'T12:00:00'), 'dd/MM/yyyy')}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="font-bold text-lg">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ocrResult.total_amount)}
                </span>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <button
                className="flex items-center justify-between w-full"
                onClick={() => setExpandedItems(!expandedItems)}
              >
                <div className="flex items-center gap-2">
                  <AppIcon name="Package" size={16} className="text-primary" />
                  <span className="font-semibold">
                    Itens ({confirmedCount}/{editedItems.length})
                  </span>
                </div>
                {expandedItems ? <AppIcon name="ExpandLess" size={16} /> : <AppIcon name="ExpandMore" size={16} />}
              </button>

              {expandedItems && editedItems.map((item, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'p-3 rounded-xl border transition-colors',
                    item.is_confirmed ? 'bg-card' : 'bg-secondary/30 opacity-60'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={item.is_confirmed}
                      onCheckedChange={() => toggleItemConfirmed(idx)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">{item.raw_description}</span>
                        {item.inventory_item_id && getConfidenceBadge(item.confidence)}
                      </div>

                      {item.inventory_item_id ? (
                        <p className="text-xs text-success">
                          ✓ Vinculado: {item.matched_name}
                        </p>
                      ) : (
                        <p className="text-xs text-warning flex items-center gap-1">
                          <AppIcon name="Warning" size={12} />
                          Produto não encontrado no estoque
                        </p>
                      )}

                      {item.is_confirmed && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">Qtd:</span>
                          <Input
                            type="number"
                            min="0"
                            step="0.1"
                            value={item.confirmed_quantity ?? item.raw_quantity}
                            onChange={(e) => updateItemQuantity(idx, Number(e.target.value))}
                            className="w-20 h-8 text-center text-sm"
                          />
                          <span className="text-xs text-muted-foreground">{item.raw_unit_type}</span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            R$ {(item.confirmed_unit_price || item.raw_unit_price || 0).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial entry */}
            <div className="p-4 rounded-xl border space-y-3">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={createFinancial}
                  onCheckedChange={(v) => setCreateFinancial(!!v)}
                />
                <div>
                  <p className="font-medium text-sm">Criar lançamento financeiro</p>
                  <p className="text-xs text-muted-foreground">Registrar como conta a pagar</p>
                </div>
              </div>

              {createFinancial && (
                <div className="space-y-3 pl-7">
                  <div className="space-y-1">
                    <Label className="text-xs">Valor (R$)</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={boletoAmount}
                      onChange={(e) => setBoletoAmount(e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Vencimento</Label>
                    <Popover open={showDueCalendar} onOpenChange={setShowDueCalendar}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full h-10 justify-start text-sm">
                          {format(boletoDueDate, "dd/MM/yyyy", { locale: ptBR })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={boletoDueDate}
                          onSelect={(d) => {
                            if (d) setBoletoDueDate(d);
                            setShowDueCalendar(false);
                          }}
                          locale={ptBR}
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-2">
              <Button
                onClick={handleConfirm}
                disabled={isConfirming}
                className="w-full h-12 gap-2"
              >
                {isConfirming ? (
                  <AppIcon name="Progress_activity" size={16} className="animate-spin" />
                ) : (
                  <AppIcon name="Check" size={16} />
                )}
                {isConfirming ? 'Confirmando...' : 'Confirmar Recebimento'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  onOpenChange(false);
                }}
                className="w-full h-10 text-muted-foreground"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Step: Confirmed */}
        {step === 'confirm' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
              <AppIcon name="Check" size={32} className="text-success" />
            </div>
            <p className="text-lg font-semibold">Recebimento Confirmado!</p>
            <div className="text-sm text-muted-foreground text-center space-y-1">
              {confirmedCount > 0 && (
                <p>✓ {confirmedCount} item(ns) adicionados ao estoque</p>
              )}
              {createFinancial && (
                <p>✓ Lançamento financeiro criado</p>
              )}
            </div>
            <Button
              onClick={() => onOpenChange(false)}
              className="mt-4"
            >
              Fechar
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
