import { useState, useMemo, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppIcon } from '@/components/ui/app-icon';
import { ProductionProject } from '@/hooks/useProductionProjects';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';

import { ChecklistSector } from '@/types/database';
import { ProductionOrderItem } from '@/hooks/useProductionOrders';

interface ProjectSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: ProductionProject[];
  sectors: ChecklistSector[];      // <-- added
  onCreateProject: (
    data: { project_number: string; description: string; client?: string; material?: string; thickness?: string; plate_size?: string },
    items?: { checklist_item_id: string; quantity_ordered: number }[]
  ) => Promise<string | undefined>; // <-- updated
  onUpdateProject: (
    id: string,
    data: Partial<Pick<ProductionProject, 'project_number' | 'description' | 'client' | 'status' | 'material' | 'thickness' | 'plate_size'>>,
    items?: { checklist_item_id: string; quantity_ordered: number }[]
  ) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
}

export function ProjectSheet({ open, onOpenChange, projects, sectors, onCreateProject, onUpdateProject, onDeleteProject }: ProjectSheetProps) {
  const { activeUnit } = useUnit();
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingProject, setEditingProject] = useState<ProductionProject | null>(null);
  const [projectNumber, setProjectNumber] = useState('');
  const [description, setDescription] = useState('');
  const [client, setClient] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [materialField, setMaterialField] = useState('');
  const [thicknessField, setThicknessField] = useState('');
  const [plateSizeField, setPlateSizeField] = useState('');

  // Dual step logic
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [planItems, setPlanItems] = useState<{ checklist_item_id: string; quantity_ordered: number }[]>([]);
  const [collapsedSectors, setCollapsedSectors] = useState<Set<string>>(new Set());

  // Generate available items
  const availableItems = useMemo(() => {
    const items: any[] = [];
    sectors.forEach((sector: any) => {
      if (sector.scope === 'bonus') return;
      sector.subcategories?.forEach((sub: any) => {
        sub.items?.forEach((item: any) => {
          if (!item.is_active || item.deleted_at) return;
          items.push({
            checklist_item_id: item.id,
            name: item.name,
            material_code: item.material_code || null,
            piece_dimensions: item.piece_dimensions || null,
            sectorName: sector.name,
            sectorColor: sector.color || '#64748b',
            subcategoryName: sub.name,
            quantity_ordered: 0,
          });
        });
      });
    });
    return items;
  }, [sectors]);

  // Expand sectors by default
  useEffect(() => {
    if (open) {
      setCollapsedSectors(new Set(availableItems.map(a => a.sectorName)));
    }
  }, [open, availableItems]);

  // Fetch customers for client picker
  const { data: customers = [] } = useQuery({
    queryKey: ['customers-list', activeUnit?.id],
    queryFn: async () => {
      if (!activeUnit?.id) return [];
      const { data, error } = await supabase
        .from('customers')
        .select('id, name')
        .eq('unit_id', activeUnit.id)
        .is('deleted_at' as any, null)
        .order('name')
        .limit(500);
      if (error) throw error;
      return data as { id: string; name: string }[];
    },
    enabled: !!activeUnit?.id && open,
  });

  const filteredCustomers = useMemo(() => {
    if (!clientSearch.trim()) return customers;
    const q = clientSearch.toLowerCase();
    return customers.filter(c => c.name.toLowerCase().includes(q));
  }, [customers, clientSearch]);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setProjectNumber('');
    setDescription('');
    setClient('');
    setClientSearch('');
    setShowClientDropdown(false);
    setMaterialField('');
    setThicknessField('');
    setPlateSizeField('');
    setEditingProject(null);
    setCurrentStep(1);
    setPlanItems([]);
  };

  const handleNextStep = async () => {
    if (!projectNumber.trim() || !description.trim()) {
      toast.error('Preencha número e descrição');
      return;
    }

    // If editing, try to grab existing items
    if (editingProject && planItems.length === 0) {
      setSaving(true);
      try {
        const { data: existing } = await supabase
          .from('production_order_items')
          .select('checklist_item_id, quantity_ordered')
          .eq('project_id', editingProject.id);

        if (existing) {
          setPlanItems(existing);
        }
      } catch (err) { }
      setSaving(false);
    }

    setCurrentStep(2);
  };

  const handleCreate = async () => {
    const activeItems = planItems.filter(p => p.quantity_ordered > 0);
    setSaving(true);
    try {
      await onCreateProject({
        project_number: projectNumber.trim(),
        description: description.trim(),
        client: client.trim() || undefined,
        material: materialField.trim() || undefined,
        thickness: thicknessField.trim() || undefined,
        plate_size: plateSizeField.trim() || undefined
      }, activeItems);
      toast.success('Projeto e Receita criados!');
      resetForm();
      setMode('list');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar projeto');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingProject) return;
    const activeItems = planItems.filter(p => p.quantity_ordered > 0);
    setSaving(true);
    try {
      await onUpdateProject(editingProject.id, {
        project_number: projectNumber.trim(),
        description: description.trim(),
        client: client.trim() || undefined,
        material: materialField.trim() || undefined,
        thickness: thicknessField.trim() || undefined,
        plate_size: plateSizeField.trim() || undefined,
      }, activeItems);
      toast.success('Projeto atualizado!');
      resetForm();
      setMode('list');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (project: ProductionProject) => {
    if (!confirm(`Arquivar projeto #${project.project_number}?`)) return;
    try {
      await onUpdateProject(project.id, { status: project.status === 'archived' ? 'active' : 'archived' });
      toast.success(project.status === 'archived' ? 'Projeto reativado' : 'Projeto arquivado');
    } catch (err: any) {
      toast.error(err.message || 'Erro');
    }
  };

  const handleDelete = async (project: ProductionProject) => {
    if (!confirm(`Excluir projeto #${project.project_number} permanentemente?`)) return;
    try {
      await onDeleteProject(project.id);
      toast.success('Projeto excluído');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir');
    }
  };

  const startEdit = (project: ProductionProject) => {
    setEditingProject(project);
    setProjectNumber(project.project_number);
    setDescription(project.description);
    setClient(project.client || '');
    setMaterialField((project as any).material || '');
    setThicknessField((project as any).thickness || '');
    setPlateSizeField((project as any).plate_size || '');
    setPlanItems([]);
    setCurrentStep(1);
    setMode('edit');
  };

  const updateQty = (itemId: string, qty: number) => {
    setPlanItems(prev => {
      const exists = prev.find(p => p.checklist_item_id === itemId);
      if (exists) {
        return prev.map(p => p.checklist_item_id === itemId ? { ...p, quantity_ordered: Math.max(0, qty) } : p);
      }
      return [...prev, { checklist_item_id: itemId, quantity_ordered: Math.max(0, qty) }];
    });
  };

  const toggleSector = (sectorName: string) => {
    setCollapsedSectors(prev => {
      const next = new Set(prev);
      if (next.has(sectorName)) next.delete(sectorName);
      else next.add(sectorName);
      return next;
    });
  };

  const groupedItems = useMemo(() => {
    const groups: any[] = [];
    const sectorMap = new Map<string, any>();
    availableItems.forEach(item => {
      let group = sectorMap.get(item.sectorName);
      if (!group) {
        group = { sectorName: item.sectorName, sectorColor: item.sectorColor, subcategories: [] };
        sectorMap.set(item.sectorName, group);
        groups.push(group);
      }
      let sub = group.subcategories.find((s: any) => s.name === item.subcategoryName);
      if (!sub) {
        sub = { name: item.subcategoryName, items: [] };
        group.subcategories.push(sub);
      }
      sub.items.push(item);
    });
    return groups;
  }, [availableItems]);

  const activeProjects = projects.filter(p => p.status === 'active');
  const archivedProjects = projects.filter(p => p.status === 'archived');

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setMode('list'); resetForm(); } }}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl flex flex-col p-0">
        <div className="px-6 pt-5 pb-3">
          <SheetHeader className="p-0">
            <SheetTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {mode !== 'list' && (
                  <button onClick={() => { if (currentStep === 2) setCurrentStep(1); else { setMode('list'); resetForm(); } }} className="p-1 rounded-lg hover:bg-secondary/60">
                    <AppIcon name="ArrowLeft" size={18} />
                  </button>
                )}
                {currentStep === 1 && <AppIcon name="Briefcase" size={20} className="text-primary" />}
                {currentStep === 2 && <AppIcon name="ListChecks" size={20} className="text-warning" />}
                <span>
                  {mode === 'list' ? 'Projetos / OS'
                    : currentStep === 1 ? (mode === 'create' ? 'Detalhes da OS' : 'Editar Detalhes')
                      : 'Receita (Peças)'}
                </span>
              </div>
              {mode === 'list' && (
                <Button size="sm" onClick={() => { resetForm(); setMode('create'); }}>
                  <AppIcon name="Plus" size={14} className="mr-1" /> Novo
                </Button>
              )}
            </SheetTitle>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {mode === 'list' ? (
            <div className="space-y-4">
              {activeProjects.length === 0 && archivedProjects.length === 0 && (
                <div className="text-center py-12 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                    <AppIcon name="Briefcase" size={28} className="text-primary" />
                  </div>
                  <p className="font-semibold text-foreground">Nenhum projeto cadastrado</p>
                  <p className="text-sm text-muted-foreground">Crie projetos para organizar seus pedidos de produção por OS/cliente.</p>
                </div>
              )}

              {activeProjects.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ativos</p>
                  {activeProjects.map(project => (
                    <div key={project.id} className="rounded-xl p-3 bg-card ring-1 ring-border/40 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-black text-primary">#{project.project_number}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{project.description}</p>
                        {project.client && (
                          <p className="text-[11px] text-muted-foreground truncate">{project.client}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => startEdit(project)} className="p-2 rounded-lg hover:bg-secondary/60 transition-colors">
                          <AppIcon name="Pencil" size={14} className="text-muted-foreground" />
                        </button>
                        <button onClick={() => handleArchive(project)} className="p-2 rounded-lg hover:bg-secondary/60 transition-colors">
                          <AppIcon name="Archive" size={14} className="text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {archivedProjects.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Arquivados</p>
                  {archivedProjects.map(project => (
                    <div key={project.id} className="rounded-xl p-3 bg-card/50 ring-1 ring-border/20 flex items-center gap-3 opacity-60">
                      <div className="w-10 h-10 rounded-xl bg-secondary/40 flex items-center justify-center shrink-0">
                        <span className="text-sm font-black text-muted-foreground">#{project.project_number}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{project.description}</p>
                        {project.client && <p className="text-[11px] text-muted-foreground truncate">{project.client}</p>}
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleArchive(project)} className="p-2 rounded-lg hover:bg-secondary/60 transition-colors" title="Reativar">
                          <AppIcon name="RotateCcw" size={14} className="text-muted-foreground" />
                        </button>
                        <button onClick={() => handleDelete(project)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors" title="Excluir">
                          <AppIcon name="Trash2" size={14} className="text-destructive" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : currentStep === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Número do Projeto / OS *</label>
                <Input
                  placeholder="Ex: 6421"
                  value={projectNumber}
                  onChange={e => setProjectNumber(e.target.value)}
                  className="text-lg font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Descrição *</label>
                <Input
                  placeholder="Ex: RACK BOOK ALTENADOR VW"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
              <div className="relative">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Cliente</label>
                <div className="relative">
                  <Input
                    placeholder="Buscar cliente..."
                    value={showClientDropdown ? clientSearch : client}
                    onChange={e => {
                      setClientSearch(e.target.value);
                      setClient(e.target.value);
                      setShowClientDropdown(true);
                    }}
                    onFocus={() => {
                      setClientSearch(client);
                      setShowClientDropdown(true);
                    }}
                    onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)}
                  />
                  {client && (
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-secondary/60"
                      onClick={() => { setClient(''); setClientSearch(''); }}
                    >
                      <AppIcon name="X" size={14} className="text-muted-foreground" />
                    </button>
                  )}
                </div>
                {showClientDropdown && filteredCustomers.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 max-h-40 overflow-y-auto rounded-xl border border-border bg-popover shadow-lg">
                    {filteredCustomers.slice(0, 20).map(c => (
                      <button
                        key={c.id}
                        type="button"
                        className={cn(
                          "w-full text-left px-3 py-2 text-sm hover:bg-secondary/60 transition-colors",
                          c.name === client && "bg-primary/10 font-semibold"
                        )}
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => {
                          setClient(c.name);
                          setClientSearch('');
                          setShowClientDropdown(false);
                        }}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="pt-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Dados Técnicos (opcional)</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Material</label>
                    <Input placeholder="Ex: Aço laminado a frio" value={materialField} onChange={e => setMaterialField(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Espessura</label>
                      <Input placeholder="Ex: 4,75 mm" value={thicknessField} onChange={e => setThicknessField(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Tamanho da Chapa</label>
                      <Input placeholder="Ex: 1200x3000 mm" value={plateSizeField} onChange={e => setPlateSizeField(e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
              <Button
                className="w-full"
                onClick={handleNextStep}
                disabled={saving || !projectNumber.trim() || !description.trim()}
              >
                Continuar para Receita <AppIcon name="ArrowRight" size={16} className="ml-1" />
              </Button>
            </div>
          ) : (
            <div className="pb-24">
              {groupedItems.map(group => {
                const isCollapsed = collapsedSectors.has(group.sectorName);
                const sectorQty = group.subcategories.reduce(
                  (acc: number, sub: any) => acc + sub.items.reduce((a: number, i: any) => {
                    const p = planItems.find(pi => pi.checklist_item_id === i.checklist_item_id);
                    return a + (p?.quantity_ordered || 0);
                  }, 0), 0
                );

                return (
                  <div key={group.sectorName}>
                    <button
                      onClick={() => toggleSector(group.sectorName)}
                      className="w-full flex items-center gap-3 py-4 px-2 hover:bg-white/5 transition-colors border-b border-border/10 last:border-0"
                    >
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: group.sectorColor }} />
                      <span className="text-base font-bold text-foreground flex-1 text-left">{group.sectorName}</span>
                      {sectorQty > 0 && <span className="text-[11px] font-black text-warning bg-warning/10 px-2 py-0.5 rounded-md">{sectorQty} pç</span>}
                      <AppIcon name="ChevronRight" size={16} className={cn("text-muted-foreground transition-transform duration-200", !isCollapsed && "rotate-90")} />
                    </button>

                    {!isCollapsed && (
                      <div className="pl-2 space-y-0.5 pb-2">
                        {group.subcategories.map((sub: any) => (
                          <div key={sub.name}>
                            {group.subcategories.length > 1 && (
                              <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider px-2 pt-1.5 pb-0.5">{sub.name}</p>
                            )}
                            {sub.items.map((item: any) => {
                              const planItem = planItems.find(p => p.checklist_item_id === item.checklist_item_id);
                              const qty = planItem?.quantity_ordered || 0;

                              return (
                                <div key={item.checklist_item_id} className={cn("flex flex-col gap-2 py-2.5 px-3 rounded-xl transition-all border border-border/10", qty > 0 ? "bg-primary/5 border-primary/20" : "")}>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-bold truncate leading-tight">{item.name}</p>
                                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                      {item.material_code && <span className="text-[10px] font-mono text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">{item.material_code}</span>}
                                      {item.piece_dimensions && <span className="text-[10px] text-muted-foreground/60">📐 {item.piece_dimensions}</span>}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 justify-end">
                                    <button onClick={() => updateQty(item.checklist_item_id, qty - 1)} className="w-8 h-8 rounded-lg bg-secondary/80 flex items-center justify-center active:scale-95 hover:bg-secondary">
                                      <AppIcon name="Minus" size={14} />
                                    </button>
                                    <input
                                      type="number"
                                      inputMode="numeric"
                                      value={qty}
                                      onChange={e => updateQty(item.checklist_item_id, parseInt(e.target.value) || 0)}
                                      className="w-14 h-8 text-center text-sm font-bold rounded-lg bg-background border border-border/60"
                                    />
                                    <button onClick={() => updateQty(item.checklist_item_id, qty + 1)} className="w-8 h-8 rounded-lg bg-secondary/80 flex items-center justify-center active:scale-95 hover:bg-secondary">
                                      <AppIcon name="Plus" size={14} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border/20">
                <Button onClick={mode === 'create' ? handleCreate : handleUpdate} disabled={saving} className="w-full h-12 text-base font-bold rounded-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  {saving ? 'Salvando...' : 'Salvar OS e Receita'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
