import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppIcon } from '@/components/ui/app-icon';
import { GroupingWithItems, ProductionGrouping } from '@/hooks/useProductionGroupings';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FieldRowProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}

function FieldRow({ label, value, onChange, placeholder }: FieldRowProps) {
  return (
    <div>
      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">{label}</label>
      <Input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="h-10 text-sm" />
    </div>
  );
}

interface GroupingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupings: GroupingWithItems[];
  onCreateGrouping: (data: any) => Promise<ProductionGrouping>;
  onUpdateGrouping: (id: string, data: any) => Promise<void>;
  onDeleteGrouping: (id: string) => Promise<void>;
}

export function GroupingSheet({ open, onOpenChange, groupings, onCreateGrouping, onUpdateGrouping, onDeleteGrouping }: GroupingSheetProps) {
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [groupingNumber, setGroupingNumber] = useState('');
  const [material, setMaterial] = useState('');
  const [plateSize, setPlateSize] = useState('');
  const [thickness, setThickness] = useState('');
  const [totalCutLength, setTotalCutLength] = useState('');
  const [processingTime, setProcessingTime] = useState('');
  const [cutTime, setCutTime] = useState('');
  const [movementTime, setMovementTime] = useState('');
  const [perforationTime, setPerforationTime] = useState('');
  const [totalPieces, setTotalPieces] = useState('');
  const [uniquePieces, setUniquePieces] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setGroupingNumber('');
    setMaterial('');
    setPlateSize('');
    setThickness('');
    setTotalCutLength('');
    setProcessingTime('');
    setCutTime('');
    setMovementTime('');
    setPerforationTime('');
    setTotalPieces('');
    setUniquePieces('');
    setNotes('');
    setEditingId(null);
  };

  const loadGrouping = (g: ProductionGrouping) => {
    setGroupingNumber(String(g.grouping_number));
    setMaterial(g.material || '');
    setPlateSize(g.plate_size || '');
    setThickness(g.thickness || '');
    setTotalCutLength(g.total_cut_length || '');
    setProcessingTime(g.processing_time || '');
    setCutTime(g.cut_time || '');
    setMovementTime(g.movement_time || '');
    setPerforationTime(g.perforation_time || '');
    setTotalPieces(String(g.total_pieces || ''));
    setUniquePieces(String(g.unique_pieces || ''));
    setNotes(g.notes || '');
    setEditingId(g.id);
  };

  const getFormData = () => ({
    grouping_number: parseInt(groupingNumber) || (groupings.length + 1),
    material: material.trim() || undefined,
    plate_size: plateSize.trim() || undefined,
    thickness: thickness.trim() || undefined,
    total_cut_length: totalCutLength.trim() || undefined,
    processing_time: processingTime.trim() || undefined,
    cut_time: cutTime.trim() || undefined,
    movement_time: movementTime.trim() || undefined,
    perforation_time: perforationTime.trim() || undefined,
    total_pieces: parseInt(totalPieces) || 0,
    unique_pieces: parseInt(uniquePieces) || 0,
    notes: notes.trim() || undefined,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      if (mode === 'edit' && editingId) {
        await onUpdateGrouping(editingId, getFormData());
        toast.success('Agrupamento atualizado!');
      } else {
        await onCreateGrouping(getFormData());
        toast.success('Agrupamento criado!');
      }
      resetForm();
      setMode('list');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir agrupamento permanentemente?')) return;
    try {
      await onDeleteGrouping(id);
      toast.success('Agrupamento excluído');
    } catch (err: any) {
      toast.error(err.message || 'Erro');
    }
  };


  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setMode('list'); resetForm(); } }}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl flex flex-col p-0">
        <div className="px-6 pt-5 pb-3">
          <SheetHeader className="p-0">
            <SheetTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {mode !== 'list' && (
                  <button onClick={() => { setMode('list'); resetForm(); }} className="p-1 rounded-lg hover:bg-secondary/60">
                    <AppIcon name="ArrowLeft" size={18} />
                  </button>
                )}
                <AppIcon name="Layers" size={20} className="text-warning" />
                <span>{mode === 'create' ? 'Novo Agrupamento' : mode === 'edit' ? 'Editar Agrupamento' : 'Agrupamentos CNC'}</span>
              </div>
              {mode === 'list' && (
                <Button size="sm" onClick={() => { resetForm(); setGroupingNumber(String(groupings.length + 1)); setMode('create'); }}>
                  <AppIcon name="Plus" size={14} className="mr-1" /> Novo
                </Button>
              )}
            </SheetTitle>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {mode === 'list' ? (
            <div className="space-y-3">
              {groupings.length === 0 && (
                <div className="text-center py-12 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-warning/10 flex items-center justify-center mx-auto">
                    <AppIcon name="Layers" size={28} className="text-warning" />
                  </div>
                  <p className="font-semibold text-foreground">Nenhum agrupamento cadastrado</p>
                  <p className="text-sm text-muted-foreground">Cadastre os agrupamentos CNC com material, espessura e tempos planejados.</p>
                </div>
              )}

              {groupings.map(g => (
                <div key={g.id} className="rounded-xl p-4 industrial-card space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-warning/15 flex items-center justify-center ring-1 ring-warning/30">
                        <span className="text-xs font-black text-warning">{g.grouping_number}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">Agrupamento {g.grouping_number}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {g.total_pieces} peças · {g.unique_pieces} únicas
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { loadGrouping(g); setMode('edit'); }} className="p-2 rounded-lg hover:bg-secondary/60">
                        <AppIcon name="Pencil" size={14} className="text-muted-foreground" />
                      </button>
                      <button onClick={() => handleDelete(g.id)} className="p-2 rounded-lg hover:bg-destructive/10">
                        <AppIcon name="Trash2" size={14} className="text-destructive" />
                      </button>
                    </div>
                  </div>

                  {/* Technical specs */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                    {g.material && (
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Material:</span>
                        <span className="font-bold text-foreground">{g.material}</span>
                      </div>
                    )}
                    {g.thickness && (
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Espessura:</span>
                        <span className="font-bold text-foreground">{g.thickness}</span>
                      </div>
                    )}
                    {g.plate_size && (
                      <div className="flex items-center gap-1 col-span-2">
                        <span className="text-muted-foreground">Chapa:</span>
                        <span className="font-bold text-foreground">{g.plate_size}</span>
                      </div>
                    )}
                  </div>

                  {/* Times */}
                  {(g.processing_time || g.cut_time || g.movement_time) && (
                    <div className="flex items-center gap-3 text-[9px] font-mono pt-1 border-t border-border/10">
                      {g.processing_time && (
                        <span className="text-muted-foreground">⏱ Proc: <b className="text-foreground">{g.processing_time}</b></span>
                      )}
                      {g.cut_time && (
                        <span className="text-muted-foreground">✂ Corte: <b className="text-foreground">{g.cut_time}</b></span>
                      )}
                      {g.movement_time && (
                        <span className="text-muted-foreground">↔ Mov: <b className="text-foreground">{g.movement_time}</b></span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FieldRow label="Nº Agrupamento" value={groupingNumber} onChange={setGroupingNumber} placeholder="1" />
                <FieldRow label="Espessura" value={thickness} onChange={setThickness} placeholder="4,75 mm" />
              </div>
              <FieldRow label="Material" value={material} onChange={setMaterial} placeholder="Aço laminado a frio" />
              <FieldRow label="Tamanho da Chapa" value={plateSize} onChange={setPlateSize} placeholder="1200,00 x 3000,00 mm" />
              <FieldRow label="Comprimento total de corte" value={totalCutLength} onChange={setTotalCutLength} placeholder="137595,56 mm" />

              <div className="pt-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Tempos Planejados</p>
                <div className="grid grid-cols-2 gap-3">
                  <FieldRow label="Processamento" value={processingTime} onChange={setProcessingTime} placeholder="36min24,6s" />
                  <FieldRow label="Corte" value={cutTime} onChange={setCutTime} placeholder="27min1s" />
                  <FieldRow label="Movimento" value={movementTime} onChange={setMovementTime} placeholder="9min11s" />
                  <FieldRow label="Perfuração" value={perforationTime} onChange={setPerforationTime} placeholder="0s" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <FieldRow label="Total de peças" value={totalPieces} onChange={setTotalPieces} placeholder="98" />
                <FieldRow label="Peças únicas" value={uniquePieces} onChange={setUniquePieces} placeholder="11" />
              </div>
              <FieldRow label="Observações" value={notes} onChange={setNotes} placeholder="Notas adicionais..." />

              <Button
                className="w-full mt-4"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Salvando...' : mode === 'edit' ? 'Salvar alterações' : 'Criar Agrupamento'}
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
