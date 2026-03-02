import { useState, useMemo, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useProductionPage } from '@/hooks/useProductionPage';
import { ProductionProjectHero } from '@/components/production/ProductionProjectHero';
import { ProductionShiftPanel } from '@/components/production/ProductionShiftPanel';
import { ProductionCutTable } from '@/components/production/ProductionCutTable';
import { ProductionDateStrip } from '@/components/production/ProductionDateStrip';
import { ProductionItemSheet } from '@/components/production/ProductionItemSheet';
import { ProductionFinishDialog } from '@/components/production/ProductionFinishDialog';
import { ProductionPlanSheet } from '@/components/production/ProductionPlanSheet';
import { ProductionReportSheet } from '@/components/production/ProductionReportSheet';
import { ProjectSheet } from '@/components/production/ProjectSheet';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useFabAction } from '@/contexts/FabActionContext';

export default function ProductionPage() {
  const {
    isAdmin, user, activeUnitId,
    selectedDate, setSelectedDate, currentDate, days,
    currentShift, setCurrentShift,
    shift1, shift2, activeShift, checklistType,
    projects, activeProjects, activeProject,
    createProject, updateProject, deleteProject,
    projectProgress,
    sectors, completions, checklistsLoading,
    startProduction, finishProduction, updateProductionQuantity,
  } = useProductionPage();

  // Sheet states
  const [planSheetOpen, setPlanSheetOpen] = useState(false);
  const [reportSheetOpen, setReportSheetOpen] = useState(false);
  const [projectSheetOpen, setProjectSheetOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [finishingItemId, setFinishingItemId] = useState<string | null>(null);

  // FAB for admin settings
  useFabAction(isAdmin ? {
    icon: 'ClipboardList',
    label: 'Plano',
    onClick: () => setPlanSheetOpen(true),
  } : null, [isAdmin]);

  // Find item metadata from report
  const getItemFromReport = useCallback((itemId: string) => {
    return activeShift.report.find(r => r.checklist_item_id === itemId);
  }, [activeShift.report]);

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
    const item = getItemFromReport(finishingItemId);
    const points = item ? 1 : 1;
    try {
      await finishProduction(finishingItemId, checklistType, currentDate, quantity, points, undefined, machineRef);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao finalizar');
      throw err;
    }
  }, [finishingItemId, finishProduction, checklistType, currentDate, getItemFromReport]);

  const handleReopenShift = useCallback(async (shift: number) => {
    const hook = shift === 1 ? shift1 : shift2;
    if (hook.reopenOrder) {
      await hook.reopenOrder();
      toast.success(`Turno ${shift} reaberto`);
    }
  }, [shift1, shift2]);

  const finishingItemMeta = finishingItemId ? getItemMeta(finishingItemId) : null;
  const selectedItemMeta = selectedItemId ? getItemMeta(selectedItemId) : null;
  const selectedItemReport = selectedItemId ? getItemFromReport(selectedItemId) : null;

  if (checklistsLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background pb-24">
          <div className="px-4 py-4 space-y-4">
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-32 rounded-2xl" />
            <div className="grid grid-cols-2 gap-3">
              {[1, 2].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
            </div>
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24">
        <div className="px-4 py-3 lg:px-6 space-y-4 lg:max-w-4xl lg:mx-auto animate-fade-in">
          
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
          />

          {/* Shift Panel */}
          <ProductionShiftPanel
            shift1={{
              order: shift1.order,
              totals: shift1.totals,
              hasOrder: shift1.hasOrder,
            }}
            shift2={{
              order: shift2.order,
              totals: shift2.totals,
              hasOrder: shift2.hasOrder,
            }}
            currentShift={currentShift}
            onSelectShift={setCurrentShift}
            isAdmin={isAdmin}
            onCreatePlan={() => setPlanSheetOpen(true)}
            onViewReport={() => setReportSheetOpen(true)}
            onReopenShift={handleReopenShift}
          />

          {/* Cut Table (main production list) */}
          {activeShift.hasOrder && (
            <ProductionCutTable
              report={activeShift.report}
              orderItems={activeShift.orderItems}
              sectors={sectors}
              completions={completions}
              onStartItem={handleStartItem}
              onFinishItem={(itemId) => setFinishingItemId(itemId)}
              onTapItem={(itemId) => setSelectedItemId(itemId)}
              isAdmin={isAdmin}
              isClosed={activeShift.order?.status === 'closed'}
            />
          )}
        </div>
      </div>

      {/* Sheets */}
      <ProductionPlanSheet
        open={planSheetOpen}
        onOpenChange={setPlanSheetOpen}
        sectors={sectors}
        existingItems={activeShift.orderItems}
        date={selectedDate}
        onSave={activeShift.saveOrder}
        onPullPendingFromYesterday={activeShift.getPendingFromDate
          ? async () => {
            const yesterday = new Date(selectedDate);
            yesterday.setDate(yesterday.getDate() - 1);
            const dateStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
            return activeShift.getPendingFromDate(dateStr);
          }
          : async () => null
        }
        hasExistingPlan={activeShift.hasOrder}
        currentShift={currentShift}
        isShift1Closed={shift1.order?.status === 'closed'}
        onCloseShift={currentShift === 1 ? shift1.closeShiftAndCreateNext : undefined}
        onDeletePlan={activeShift.resetDayOrders}
        activeProjects={activeProjects}
        selectedProjectId={activeShift.order?.project_id}
      />

      <ProductionReportSheet
        open={reportSheetOpen}
        onOpenChange={setReportSheetOpen}
        report={activeShift.report}
        totals={activeShift.totals}
        order={activeShift.order}
        date={selectedDate}
        isAdmin={isAdmin}
        currentShift={currentShift}
        shift1Report={shift1.report}
        shift1Totals={shift1.totals}
        shift2Report={shift2.report}
        shift2Totals={shift2.totals}
        hasShift2={shift2.hasOrder}
        onEditPlan={() => { setReportSheetOpen(false); setPlanSheetOpen(true); }}
      />

      <ProjectSheet
        open={projectSheetOpen}
        onOpenChange={setProjectSheetOpen}
        projects={projects}
        onCreateProject={createProject}
        onUpdateProject={updateProject}
        onDeleteProject={deleteProject}
      />

      {/* Item detail sheet */}
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

      {/* Finish dialog */}
      <ProductionFinishDialog
        open={!!finishingItemId}
        onOpenChange={(v) => { if (!v) setFinishingItemId(null); }}
        itemName={finishingItemMeta?.name || ''}
        onFinish={handleFinishItem}
      />
    </AppLayout>
  );
}
