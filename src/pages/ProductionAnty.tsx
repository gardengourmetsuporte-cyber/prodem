import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useProductionPage } from '@/hooks/useProductionPage';
import { useProductionGroupings } from '@/hooks/useProductionGroupings';
import { ProductionCutTable } from '@/components/production/ProductionCutTable';
import { ProductionAntySlipDialog } from '@/components/production/ProductionAntySlipDialog';
import { ProductionProjectHero } from '@/components/production/ProductionProjectHero';
import { ProductionDateStrip } from '@/components/production/ProductionDateStrip';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { ProjectSheet } from '@/components/production/ProjectSheet';
import { GroupingSheet } from '@/components/production/GroupingSheet';
import { toast } from 'sonner';

export default function ProductionAntyPage() {
    const {
        isAdmin, user, activeUnitId,
        selectedDate, setSelectedDate, currentDate, days, checklistType,
        projects, activeProjects, activeProject,
        selectedProjectId, setSelectedProjectId,
        projectProgress,
        production,
        sectors,
        startProduction, finishProduction, updateProductionQuantity,
    } = useProductionPage();

    const [projectSheetOpen, setProjectSheetOpen] = useState(false);
    const [groupingSheetOpen, setGroupingSheetOpen] = useState(false);
    const [currentView, setCurrentView] = useState<'home' | 'cut-table' | string>('home');
    const [finishingItemId, setFinishingItemId] = useState<string | null>(null);

    // Groupings for the active project
    const { groupingsWithItems, itemGroupingMap } = useProductionGroupings(activeProject?.id || null, activeUnitId);

    // Split report items into: In Groupings vs Not In Groupings (Linear)
    const { linearItems, groupedItemsMap } = useMemo(() => {
        const linear = [];
        const grouped = new Map<string, any[]>();

        groupingsWithItems.forEach(g => grouped.set(g.id, []));

        production.report.forEach(item => {
            const gMap = itemGroupingMap.get(item.checklist_item_id);
            if (gMap) {
                const grouping = groupingsWithItems.find(g => g.grouping_number === gMap.groupingNumber);
                if (grouping) grouped.get(grouping.id)?.push(item);
                else linear.push(item);
            } else {
                linear.push(item);
            }
        });

        return { linearItems: linear, groupedItemsMap: grouped };
    }, [production.report, groupingsWithItems, itemGroupingMap]);

    // Actions
    const handleStartItem = async (itemId: string) => {
        try {
            await startProduction(itemId, checklistType, currentDate);
            toast.success('Produção iniciada!');
        } catch (err: any) {
            toast.error(err.message || 'Erro ao iniciar');
        }
    };

    const handleFinishItem = async (quantity: number, machineRef?: string) => {
        if (!finishingItemId) return;
        try {
            await finishProduction(finishingItemId, checklistType, currentDate, quantity, 1, undefined, machineRef);
            toast.success('Apontamento salvo!');
        } catch (err: any) {
            toast.error(err.message || 'Erro ao finalizar');
            throw err;
        }
    };

    const finishingItemReport = useMemo(() => {
        if (!finishingItemId) return null;
        return production.report.find(r => r.checklist_item_id === finishingItemId) || null;
    }, [finishingItemId, production.report]);

    const finishingItemMeta = useMemo(() => {
        if (!finishingItemId) return { name: '', materialCode: '', dimensions: '' };
        let meta = { name: '', materialCode: '', dimensions: '' };
        sectors.forEach((sector: any) => {
            sector.subcategories?.forEach((sub: any) => {
                sub.items?.forEach((item: any) => {
                    if (item.id === finishingItemId) {
                        meta = {
                            name: item.name,
                            materialCode: item.material_code || '',
                            dimensions: item.piece_dimensions || '',
                        };
                    }
                });
            });
        });
        return meta;
    }, [finishingItemId, sectors]);

    // View Renderers
    const renderHome = () => (
        <div className="px-4 py-3 lg:px-6 space-y-4 lg:max-w-4xl lg:mx-auto">
            <ProductionDateStrip
                days={days}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
            />

            <ProductionProjectHero
                project={activeProject}
                progress={projectProgress}
                isAdmin={isAdmin}
                onManageProjects={() => setProjectSheetOpen(true)}
                activeProjects={activeProjects}
                selectedProjectId={selectedProjectId}
                onSelectProject={setSelectedProjectId}
                groupings={groupingsWithItems}
                onManageGroupings={() => {
                    if (!activeProject) {
                        toast.error('Crie um projeto/OS primeiro antes de adicionar agrupamentos');
                        return;
                    }
                    setGroupingSheetOpen(true);
                }}
            />

            {activeProject && (
                <div className="space-y-4 pt-4">
                    <div className="flex items-center gap-2 px-2">
                        <AppIcon name="FolderOpen" size={14} className="text-muted-foreground/50" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Índice de Documentos da OS
                        </span>
                    </div>

                    {linearItems.length > 0 && (
                        <button
                            onClick={() => setCurrentView('cut-table')}
                            className="w-full text-left bg-card rounded-[24px] p-5 border border-border/10 hover:border-warning/30 transition-all flex gap-4 group hover:bg-white/[0.02]"
                        >
                            <div className="w-14 h-16 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden group-hover:scale-105 transition-transform">
                                <div className="absolute top-0 left-0 right-0 h-3 bg-white/10" />
                                <AppIcon name="TableProperties" size={24} className="text-muted-foreground" />
                            </div>
                            <div className="flex-1 pt-1">
                                <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-1 block">Cortes Lineares (Tubos/Barras)</span>
                                <h3 className="text-lg font-bold text-foreground">Tabela de Cortes de Barras</h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs font-medium text-muted-foreground">{linearItems.length} peças totais</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-center h-full pt-4">
                                <AppIcon name="ChevronRight" size={24} className="text-muted-foreground/30 group-hover:text-warning transition-colors" />
                            </div>
                        </button>
                    )}

                    {groupingsWithItems.map(g => {
                        const itemsInThisGroup = groupedItemsMap.get(g.id) || [];
                        return (
                            <button
                                key={g.id}
                                onClick={() => setCurrentView(`agrupamento-${g.id}`)}
                                className="w-full text-left bg-card rounded-[24px] p-5 border border-border/10 hover:border-warning/30 transition-all flex gap-4 group hover:bg-white/[0.02]"
                            >
                                <div className="w-14 h-16 rounded-lg bg-background border border-warning/30 flex flex-col items-center justify-center shrink-0 shadow-sm relative overflow-hidden group-hover:scale-105 transition-transform">
                                    {g.image_url ? (
                                        <img src={g.image_url} alt="Plano" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-screen grayscale" />
                                    ) : (
                                        <AppIcon name="FileImage" size={24} className="text-warning/50 mb-1" />
                                    )}
                                    <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-background to-transparent" />
                                    <span className="text-[10px] font-black z-10 text-white bg-warning shadow-md px-1.5 py-0.5 rounded-sm absolute bottom-1">AG{g.grouping_number}</span>
                                </div>
                                <div className="flex-1 pt-1">
                                    <span className="text-[10px] uppercase font-black tracking-widest text-warning mb-1 block">Nesting Laser / Chapa</span>
                                    <h3 className="text-lg font-bold text-foreground truncate">Resultado do Agrupamento {g.grouping_number}</h3>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                                        {g.material && <span className="text-[11px] text-muted-foreground">{g.material}</span>}
                                        {g.thickness && <span className="text-[10px] font-mono px-1.5 py-0.5 bg-white/5 rounded text-foreground/70">{g.thickness}</span>}
                                        <span className="text-[11px] text-muted-foreground font-bold">{itemsInThisGroup.length} pcs</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-center h-full pt-4">
                                    <AppIcon name="ChevronRight" size={24} className="text-muted-foreground/30 group-hover:text-warning transition-colors" />
                                </div>
                            </button>
                        );
                    })}

                    {linearItems.length === 0 && groupingsWithItems.length === 0 && (
                        <div className="text-center py-16 space-y-3">
                            <div className="w-16 h-16 rounded-2xl bg-muted/10 flex items-center justify-center mx-auto industrial-border">
                                <AppIcon name="FolderOpen" size={32} className="text-muted-foreground/30" />
                            </div>
                            <p className="text-sm font-bold text-muted-foreground">Aguardando documentos de produção</p>
                            <p className="text-xs text-muted-foreground/60">A OS selecionada ainda não possui itens cadastrados</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    const renderCutTable = () => (
        <div className="px-4 py-3 lg:px-6 space-y-4 lg:max-w-6xl lg:mx-auto animate-in slide-in-from-right-8 duration-300">
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={() => setCurrentView('home')}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-card hover:bg-muted transition-colors border border-border/10"
                >
                    <AppIcon name="ArrowLeft" size={20} className="text-foreground" />
                </button>
                <div>
                    <h2 className="text-xl font-black uppercase text-foreground">Tabela de Cortes de Barras</h2>
                    <p className="text-[11px] tracking-widest text-muted-foreground uppercase font-bold">OS #{activeProject?.project_number} - {activeProject?.description}</p>
                </div>
            </div>

            <ProductionCutTable
                report={linearItems}
                orderItems={production.orderItems}
                sectors={sectors}
                onStartItem={handleStartItem}
                onFinishItem={(itemId) => setFinishingItemId(itemId)}
                onTapItem={() => { }}
                isAdmin={isAdmin}
                isClosed={false}
                itemGroupingMap={itemGroupingMap}
            />
        </div>
    );

    const renderGroupingView = (groupId: string) => {
        const grouping = groupingsWithItems.find(g => g.id === groupId);
        const items = groupedItemsMap.get(groupId) || [];

        if (!grouping) return null;

        return (
            <div className="px-4 py-3 lg:px-6 space-y-4 lg:max-w-6xl lg:mx-auto animate-in slide-in-from-right-8 duration-300">
                <div className="flex items-center gap-3 mb-4">
                    <button
                        onClick={() => setCurrentView('home')}
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-card hover:bg-muted transition-colors border border-border/10"
                    >
                        <AppIcon name="ArrowLeft" size={20} className="text-foreground" />
                    </button>
                    <div className="flex-1">
                        <h2 className="text-xl font-black uppercase text-foreground">Resultado do Agrupamento {grouping.grouping_number}</h2>
                        <p className="text-[11px] tracking-widest text-warning uppercase font-bold">Projeto OS #{activeProject?.project_number}</p>
                    </div>
                </div>

                {/* PDF / Paper Replica View */}
                <div className="bg-[#f0f0f0] text-black rounded-lg overflow-hidden shadow-xl p-6 font-sans">

                    <div className="text-center font-black text-2xl uppercase mb-6 tracking-wide">
                        Resultado do Agrupamento {grouping.grouping_number}
                    </div>

                    <p className="text-xs text-gray-600 font-mono mb-4 text-center">
                        C:\Users\engenharia\Desktop\VALEO - {activeProject?.project_number} - PROJETO - {grouping.total_pieces} UNDS
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-2 border-black p-4 bg-white shadow-[2px_2px_0_rgba(0,0,0,0.1)]">
                        {/* Spec Table */}
                        <div className="space-y-0.5 text-sm uppercase font-bold">
                            <div className="grid grid-cols-2 border-b border-gray-300 py-1.5">
                                <span className="text-gray-500">Material:</span>
                                <span>{grouping.material || '-'}</span>
                            </div>
                            <div className="grid grid-cols-2 border-b border-gray-300 py-1.5">
                                <span className="text-gray-500">TAMANHO DA PLACA:</span>
                                <span>{grouping.plate_size || '-'}</span>
                            </div>
                            <div className="grid grid-cols-2 border-b border-gray-300 py-1.5">
                                <span className="text-gray-500">ESPESSURA:</span>
                                <span>{grouping.thickness || '-'}</span>
                            </div>
                            <div className="grid grid-cols-2 border-b border-gray-300 py-1.5">
                                <span className="text-gray-500">TEMPO CORTE:</span>
                                <span>{grouping.cut_time || '-'}</span>
                            </div>
                        </div>

                        {/* Image Placeholder */}
                        <div className="border border-gray-300 bg-gray-50 flex items-center justify-center p-2 min-h-[150px]">
                            {grouping.image_url ? (
                                <img src={grouping.image_url} alt="Plano de Corte" className="max-w-full max-h-[300px] object-contain mix-blend-multiply" />
                            ) : (
                                <span className="text-gray-400 font-bold uppercase text-xs">Sem desenho anexado</span>
                            )}
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="mt-8">
                        <div className="flex justify-between items-end mb-2">
                            <h3 className="font-black text-lg uppercase">Lista de Peças</h3>
                            <span className="text-xs font-bold text-gray-500 uppercase">{items.length} peças neste layout</span>
                        </div>

                        <table className="w-full border-collapse border-2 border-black bg-white">
                            <thead>
                                <tr className="bg-gray-100 border-b-2 border-black text-[11px] font-black uppercase tracking-wider text-gray-700">
                                    <th className="py-2.5 px-3 border-r border-gray-300 text-center w-20">Miniatura</th>
                                    <th className="py-2.5 px-3 border-r border-gray-300 text-left">Nome da Peça</th>
                                    <th className="py-2.5 px-3 border-r border-gray-300 text-right">Tamanho</th>
                                    <th className="py-2.5 px-3 border-r border-gray-300 text-center w-24">Contagem</th>
                                    <th className="py-2.5 px-3 text-center w-20">Baixa</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm border-b border-gray-300">
                                {items.map(item => {
                                    const m = itemGroupingMap.get(item.checklist_item_id);
                                    const isComplete = item.status === 'complete';
                                    const isInProgress = item.status === 'in_progress';

                                    let itemName = '';
                                    let itemDimensions = '';
                                    sectors.forEach((sec: any) => sec.subcategories?.forEach((sub: any) => sub.items?.forEach((i: any) => {
                                        if (i.id === item.checklist_item_id) {
                                            itemName = i.name;
                                            itemDimensions = i.piece_dimensions || '';
                                        }
                                    })));

                                    return (
                                        <tr key={item.checklist_item_id} className={cn("border-b border-gray-200 hover:bg-gray-50 transition-colors", isComplete && "opacity-50 bg-gray-100")}>
                                            <td className="py-2 px-3 border-r border-gray-300 text-center">
                                                <div className="w-12 h-8 border border-gray-200 mx-auto bg-gray-50"></div> {/* Fake thumbnail */}
                                            </td>
                                            <td className="py-3 px-3 border-r border-gray-300 font-bold text-gray-800">{itemName || item.item_name}</td>
                                            <td className="py-3 px-3 border-r border-gray-300 text-right font-mono text-xs text-gray-600">{itemDimensions}</td>
                                            <td className="py-3 px-3 border-r border-gray-300 text-center font-black text-lg">{item.quantity_ordered}</td>
                                            <td className="py-2 px-3 text-center">
                                                {isComplete ? (
                                                    <div className="font-display text-blue-700 italic font-black text-lg transform -rotate-12">OK</div>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            if (!isInProgress) handleStartItem(item.checklist_item_id);
                                                            setFinishingItemId(item.checklist_item_id);
                                                        }}
                                                        className={cn(
                                                            "w-full py-1 text-[10px] font-black uppercase rounded border-2 transition-all",
                                                            isInProgress
                                                                ? "bg-yellow-100 border-yellow-500 text-yellow-700 animate-pulse"
                                                                : "bg-white border-black text-black hover:bg-black hover:text-white"
                                                        )}
                                                    >
                                                        {isInProgress ? 'Cortando' : 'Iniciar'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                </div>
            </div>
        );
    };

    return (
        <AppLayout>
            <div className="min-h-screen production-page-bg pb-24">
                {/* Header Bar */}
                <div className="production-header-bar px-4 py-3 flex items-center justify-between sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/10">
                    <div className="flex items-center gap-2">
                        <AppIcon name="Orbit" size={18} className="text-warning" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-warning">Versão Anty (Documentos Físicos)</span>
                    </div>
                </div>

                {currentView === 'home' && renderHome()}
                {currentView === 'cut-table' && renderCutTable()}
                {currentView.startsWith('agrupamento-') && renderGroupingView(currentView.replace('agrupamento-', ''))}

            </div>

            <ProductionAntySlipDialog
                open={!!finishingItemId}
                onOpenChange={(open) => { if (!open) setFinishingItemId(null); }}
                reportItem={finishingItemReport || null}
                itemName={finishingItemMeta.name}
                dimensions={finishingItemMeta.dimensions}
                materialCode={finishingItemMeta.materialCode}
                projectNumber={activeProject?.project_number || ''}
                projectName={activeProject?.description || ''}
                onFinish={handleFinishItem}
            />

            <ProjectSheet
                open={projectSheetOpen}
                onOpenChange={setProjectSheetOpen}
                projects={projects}
                sectors={sectors}
                onCreateProject={() => Promise.resolve('')}
                onUpdateProject={() => Promise.resolve()}
                onDeleteProject={() => Promise.resolve()}
            />

            <GroupingSheet
                open={groupingSheetOpen}
                onOpenChange={setGroupingSheetOpen}
                groupings={groupingsWithItems}
                onCreateGrouping={() => Promise.resolve({} as any)}
                onUpdateGrouping={() => Promise.resolve()}
                onDeleteGrouping={() => Promise.resolve()}
                onImageUpload={() => Promise.resolve()}
            />
        </AppLayout>
    );
}
