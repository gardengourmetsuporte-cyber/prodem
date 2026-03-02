import { useState, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useProductionPage } from '@/hooks/useProductionPage';
import { useProductionGroupings } from '@/hooks/useProductionGroupings';
import { ProductionProjectHero } from '@/components/production/ProductionProjectHero';
import { ProductionShiftPanel } from '@/components/production/ProductionShiftPanel';
import { ProductionCutTable } from '@/components/production/ProductionCutTable';
import { ProductionDateStrip } from '@/components/production/ProductionDateStrip';
import { ProductionItemSheet } from '@/components/production/ProductionItemSheet';
import { ProductionFinishDialog } from '@/components/production/ProductionFinishDialog';
import { ProductionReportSheet } from '@/components/production/ProductionReportSheet';
import { ProjectSheet } from '@/components/production/ProjectSheet';
import { GroupingSheet } from '@/components/production/GroupingSheet';
import { ProductionOrdersHistory } from '@/components/production/ProductionOrdersHistory';
import { AppIcon } from '@/components/ui/app-icon';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useFabAction } from '@/contexts/FabActionContext';

export default function ProductionPage() {
  const {
    isAdmin, user, activeUnitId,
    selectedDate, setSelectedDate, currentDate, days,
    checklistType,
    projects, activeProjects, allActiveProjects, activeProject,
    selectedProjectId, setSelectedProjectId,
    createProject, updateProject, deleteProject,
    projectProgress,
    production,
    sectors, checklistsLoading,
    startProduction, finishProduction, updateProductionQuantity,
  } = useProductionPage();

  const [reportSheetShift, setReportSheetShift] = useState<number | null>(null);
  const [projectSheetOpen, setProjectSheetOpen] = useState(false);
  const [groupingSheetOpen, setGroupingSheetOpen] = useState(false);
  const [historySheetOpen, setHistorySheetOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [finishingItemId, setFinishingItemId] = useState<string | null>(null);

  // Groupings
  const {
    groupingsWithItems,
    itemGroupingMap,
    createGrouping,
    updateGrouping,
    deleteGrouping,
  } = useProductionGroupings(activeProject?.id || null, activeUnitId);

  const getItemFromReport = useCallback((itemId: string) => {
    return production.report.find(r => r.checklist_item_id === itemId);
  }, [production.report]);

  const getItemMeta = useCallback((itemId: string) => {
    let meta = { name: 'Item', materialCode: '', dimensions: '' };
    sectors.forEach((sector: any) => {
      sector.subcategories?.forEach((sub: any) => {
        sub.items?.forEach((item: any) => {
          if (item.id === itemId) {
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
  }, [sectors]);

  const handleQuickComplete = useCallback(async (itemId: string, quantity: number) => {
    try {
      await finishProduction(itemId, checklistType, currentDate, quantity, 1, undefined, undefined);
      toast.success('Peça concluída!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao finalizar');
    }
  }, [finishProduction, checklistType, currentDate]);

  const handleStartItem = useCallback(async (itemId: string) => {
    try {
      await startProduction(itemId, checklistType, currentDate);
      toast.success('Produção iniciada!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao iniciar');
    }
  }, [startProduction, checklistType, currentDate]);

  const handleFinishItem = useCallback(async (quantity: number, machineRef?: string) => {
    if (!finishingItemId) return;
    try {
      await finishProduction(finishingItemId, checklistType, currentDate, quantity, 1, undefined, machineRef);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao finalizar');
      throw err;
    }
  }, [finishingItemId, finishProduction, checklistType, currentDate]);

  const handleGroupingImageUpload = useCallback(async (groupingId: string, file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${groupingId}-${Math.random()}.${fileExt}`;
      const filePath = `groupings/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('production')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('production')
        .getPublicUrl(filePath);

      await updateGrouping(groupingId, { image_url: publicUrl });
      toast.success('Plano de corte anexado com sucesso!');
    } catch (err: any) {
      console.error('Error uploading image:', err);
      toast.error('Erro ao enviar a imagem. Tente novamente.');
    }
  }, [updateGrouping]);

  const finishingItemMeta = finishingItemId ? getItemMeta(finishingItemId) : null;
  const finishingItemReport = finishingItemId ? getItemFromReport(finishingItemId) : null;
  const selectedItemMeta = selectedItemId ? getItemMeta(selectedItemId) : null;
  const selectedItemReport = selectedItemId ? getItemFromReport(selectedItemId) : null;

  if (checklistsLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background pb-24">
          <div className="px-4 py-4 space-y-4">
            {/* Industrial loading skeleton */}
            <div className="h-10 rounded-lg bg-muted/20 animate-pulse" />
            <div className="h-40 rounded-2xl bg-muted/15 animate-pulse industrial-border" />
            <div className="grid grid-cols-2 gap-3">
              {[1, 2].map(i => <div key={i} className="h-32 rounded-2xl bg-muted/15 animate-pulse" />)}
            </div>
            {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-lg bg-muted/10 animate-pulse" />)}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen production-page-bg pb-24">
        {/* Header Bar */}
        <div className="production-header-bar px-4 py-3 flex items-center justify-end gap-3">
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
            onViewHistory={() => setHistorySheetOpen(true)}
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

          {/* Cut Table — Industrial Production List */}
          {production.orderItems.length > 0 && (
            <ProductionCutTable
              report={production.report}
              orderItems={production.orderItems}
              sectors={sectors}
              onStartItem={handleStartItem}
              onFinishItem={(itemId) => setFinishingItemId(itemId)}
              onQuickComplete={handleQuickComplete}
              onTapItem={(itemId) => setSelectedItemId(itemId)}
              isAdmin={isAdmin}
              isClosed={false}
              itemGroupingMap={itemGroupingMap}
            />
          )}

          {/* Empty state when no plan */}
          {production.orderItems.length === 0 && !isAdmin && (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-muted/10 flex items-center justify-center mx-auto industrial-border">
                <AppIcon name="Factory" size={32} className="text-muted-foreground/30" />
              </div>
              <p className="text-sm font-bold text-muted-foreground">Aguardando receita de produção</p>
              <p className="text-xs text-muted-foreground/60">A OS selecionada ainda não possui itens cadastrados</p>
            </div>
          )}
        </div>
      </div>

      {/* Sheets */}





      <ProjectSheet
        open={projectSheetOpen}
        onOpenChange={setProjectSheetOpen}
        projects={projects}
        sectors={sectors}
        onCreateProject={createProject}
        onUpdateProject={updateProject}
        onDeleteProject={deleteProject}
      />

      <GroupingSheet
        open={groupingSheetOpen}
        onOpenChange={setGroupingSheetOpen}
        groupings={groupingsWithItems}
        onCreateGrouping={createGrouping}
        onUpdateGrouping={updateGrouping}
        onDeleteGrouping={deleteGrouping}
        onImageUpload={handleGroupingImageUpload}
      />

      <ProductionItemSheet
        open={!!selectedItemId}
        onOpenChange={(v) => { if (!v) setSelectedItemId(null); }}
        itemId={selectedItemId}
        itemName={selectedItemMeta?.name || ''}
        materialCode={selectedItemMeta?.materialCode}
        dimensions={selectedItemMeta?.dimensions}
        quantityOrdered={selectedItemReport?.quantity_ordered || 0}
        quantityDone={selectedItemReport?.quantity_done || 0}
        date={currentDate}
        unitId={activeUnitId}
        checklistType={checklistType}
      />

      <ProductionFinishDialog
        open={!!finishingItemId}
        onOpenChange={(v) => { if (!v) setFinishingItemId(null); }}
        itemName={finishingItemMeta?.name || ''}
        quantityOrdered={finishingItemReport?.quantity_ordered}
        quantityDone={finishingItemReport?.quantity_done}
        onFinish={handleFinishItem}
      />

      <ProductionOrdersHistory
        open={historySheetOpen}
        onOpenChange={setHistorySheetOpen}
        projects={projects}
        unitId={activeUnitId}
        onNavigateToDate={(date, projectId) => {
          setSelectedDate(date);
          setSelectedProjectId(projectId);
          setHistorySheetOpen(false);
        }}
      />
    </AppLayout>
  );
}
