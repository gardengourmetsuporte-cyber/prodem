import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useProductionPage } from '@/hooks/useProductionPage';
import { useProductionGroupings } from '@/hooks/useProductionGroupings';
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
        selectedDate, setSelectedDate, days,
        projects, activeProjects, activeProject,
        selectedProjectId, setSelectedProjectId,
        projectProgress,
        production,
        sectors,
    } = useProductionPage();

    const [projectSheetOpen, setProjectSheetOpen] = useState(false);
    const [groupingSheetOpen, setGroupingSheetOpen] = useState(false);

    // Groupings for the active project
    const { groupingsWithItems, itemGroupingMap } = useProductionGroupings(activeProject?.id || null, activeUnitId);

    // Split report items into: In Groupings vs Not In Groupings (Linear)
    const { linearItems, groupedItemsMap } = useMemo(() => {
        const linear = [];
        const grouped = new Map<string, any[]>();

        // Initialize grouped arrays
        groupingsWithItems.forEach(g => grouped.set(g.id, []));

        production.report.forEach(item => {
            const gMap = itemGroupingMap.get(item.checklist_item_id);
            if (gMap) {
                // Find which grouping it belongs to
                const grouping = groupingsWithItems.find(g => g.grouping_number === gMap.groupingNumber);
                if (grouping) {
                    grouped.get(grouping.id)?.push(item);
                } else {
                    linear.push(item);
                }
            } else {
                linear.push(item);
            }
        });

        return { linearItems: linear, groupedItemsMap: grouped };
    }, [production.report, groupingsWithItems, itemGroupingMap]);

    return (
        <AppLayout>
            <div className="min-h-screen production-page-bg pb-24">
                {/* Header Bar */}
                <div className="production-header-bar px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AppIcon name="Orbit" size={18} className="text-warning" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-warning">Versão Anty (Nova Lógica)</span>
                    </div>
                </div>

                <div className="px-4 py-3 lg:px-6 space-y-4 lg:max-w-4xl lg:mx-auto">
                    {/* Date Strip */}
                    <ProductionDateStrip
                        days={days}
                        selectedDate={selectedDate}
                        onSelectDate={setSelectedDate}
                    />

                    {/* Project Hero Card */}
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

                    {/* DOCUMENT FOLDERS SECTION */}
                    {activeProject && (
                        <div className="space-y-4 pt-4">
                            <div className="flex items-center gap-2 px-2">
                                <AppIcon name="FolderOpen" size={14} className="text-muted-foreground/50" />
                                <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                                    Documentos da OS
                                </span>
                            </div>

                            {/* Tabela de Cortes (Linear Items) */}
                            {linearItems.length > 0 && (
                                <button
                                    onClick={() => alert('Abriria a Tabela de Cortes nova')}
                                    className="w-full text-left bg-card rounded-[24px] p-5 border border-border/10 hover:border-warning/30 transition-all flex gap-4 group"
                                >
                                    <div className="w-14 h-16 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden group-hover:scale-105 transition-transform">
                                        <div className="absolute top-0 left-0 right-0 h-3 bg-white/10" />
                                        <AppIcon name="TableProperties" size={24} className="text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 pt-1">
                                        <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-1 block">Itens Individuais / Lineares</span>
                                        <h3 className="text-lg font-bold text-foreground">Tabela de Cortes de Barras</h3>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-xs text-muted-foreground">{linearItems.length} peças totais</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-center h-full pt-4">
                                        <AppIcon name="ChevronRight" size={24} className="text-muted-foreground/30 group-hover:text-warning transition-colors" />
                                    </div>
                                </button>
                            )}

                            {/* Resultados do Agrupamento (Nesting) */}
                            {groupingsWithItems.map(g => {
                                const itemsInThisGroup = groupedItemsMap.get(g.id) || [];
                                return (
                                    <button
                                        key={g.id}
                                        onClick={() => alert(`Abriria o PDF de Agrupamento ${g.grouping_number}`)}
                                        className="w-full text-left bg-card rounded-[24px] p-5 border border-border/10 hover:border-warning/30 transition-all flex gap-4 group"
                                    >
                                        <div className="w-14 h-16 rounded-lg bg-card border border-warning/20 flex flex-col items-center justify-center shrink-0 shadow-sm relative overflow-hidden group-hover:scale-105 transition-transform">
                                            {g.image_url ? (
                                                <img src={g.image_url} alt="Plano" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                                            ) : (
                                                <AppIcon name="FileImage" size={24} className="text-warning/50 mb-1" />
                                            )}
                                            <span className="text-[9px] font-black z-10 text-warning bg-card/80 px-1 rounded">AG{g.grouping_number}</span>
                                        </div>
                                        <div className="flex-1 pt-1">
                                            <span className="text-[10px] uppercase font-black tracking-widest text-warning mb-1 block">Nesting Laser / Chapa</span>
                                            <h3 className="text-lg font-bold text-foreground truncate">Resultado do Agrupamento {g.grouping_number}</h3>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                                                {g.material && <span className="text-xs text-muted-foreground">{g.material}</span>}
                                                {g.thickness && <span className="text-[10px] font-mono px-1.5 py-0.5 bg-white/5 rounded text-foreground/70">{g.thickness}</span>}
                                                <span className="text-xs text-muted-foreground">{itemsInThisGroup.length} pcs</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-center h-full pt-4">
                                            <AppIcon name="ChevronRight" size={24} className="text-muted-foreground/30 group-hover:text-warning transition-colors" />
                                        </div>
                                    </button>
                                );
                            })}

                            {linearItems.length === 0 && groupingsWithItems.length === 0 && (
                                <div className="text-center py-12 border border-dashed border-border/40 rounded-[24px]">
                                    <AppIcon name="FolderOpen" size={32} className="mx-auto text-muted-foreground/30 mb-3" />
                                    <p className="text-sm font-bold text-muted-foreground">Nenhuma folha gerada</p>
                                    <p className="text-xs text-muted-foreground/60">A OS não possui itens ou agrupamentos cadastrados.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <ProjectSheet
                open={projectSheetOpen}
                onOpenChange={setProjectSheetOpen}
                projects={projects}
                sectors={sectors}
                onCreateProject={() => { }}
                onUpdateProject={() => { }}
                onDeleteProject={() => { }}
            />
        </AppLayout>
    );
}
