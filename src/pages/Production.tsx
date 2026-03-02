import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { useProductionProjects } from '@/hooks/useProductionProjects';
import { useProductionPieces, ProductionPiece } from '@/hooks/useProductionPieces';
import { useProductionLogs } from '@/hooks/useProductionLogs';
import { useProductionShipments } from '@/hooks/useProductionShipments';
import { ProductionOSList } from '@/components/production/ProductionOSList';
import { ProductionCutTableNew } from '@/components/production/ProductionCutTableNew';
import { PieceSheet } from '@/components/production/PieceSheet';
import { ProjectSheet } from '@/components/production/ProjectSheet';
import { PinDialog } from '@/components/production/PinDialog';
import { FinishTaskDialog } from '@/components/production/FinishTaskDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ProductionPage() {
  const { isAdmin, user } = useAuth();
  const { activeUnitId } = useUnit();

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<ProductionPiece | null>(null);
  const [projectSheetOpen, setProjectSheetOpen] = useState(false);

  // Active task tracking
  const [activePieceId, setActivePieceId] = useState<string | null>(null);
  const [activeStartedAt, setActiveStartedAt] = useState<string | null>(null);
  const [activeLogId, setActiveLogId] = useState<string | null>(null);

  // PIN dialog
  const [pinOpen, setPinOpen] = useState(false);
  const [pinPiece, setPinPiece] = useState<ProductionPiece | null>(null);
  const [pinAction, setPinAction] = useState<'start' | 'finish'>('start');
  const [pinError, setPinError] = useState('');
  const [pinLoading, setPinLoading] = useState(false);

  // Finish dialog
  const [finishOpen, setFinishOpen] = useState(false);
  const [finishPiece, setFinishPiece] = useState<ProductionPiece | null>(null);
  const [finishElapsed, setFinishElapsed] = useState(0);

  // Projects
  const { projects, createProject, updateProject, deleteProject, isLoading: projectsLoading } = useProductionProjects(activeUnitId);

  // Pieces for selected project
  const { pieces, isLoading: piecesLoading } = useProductionPieces(selectedProjectId, activeUnitId);

  // Logs & shipments for selected project
  const { progressMap, addLog, updateLog } = useProductionLogs(selectedProjectId, activeUnitId);
  const { shipments, shippedByPiece, addShipment } = useProductionShipments(selectedProjectId, activeUnitId);

  // Build pieces map for OS list
  const piecesMap = useMemo(() => {
    const map = new Map<string, ProductionPiece[]>();
    if (selectedProjectId) {
      map.set(selectedProjectId, pieces);
    }
    return map;
  }, [selectedProjectId, pieces]);

  const selectedProject = projects.find(p => p.id === selectedProjectId) || null;

  const handleSelectProject = useCallback((id: string) => {
    setSelectedProjectId(id);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedProjectId(null);
    setActivePieceId(null);
    setActiveStartedAt(null);
    setActiveLogId(null);
  }, []);

  // Validate PIN - accepts any 4-digit code for now
  // TODO: validate against employee pin_code in profiles table
  const validatePin = useCallback(async (pin: string): Promise<boolean> => {
    // Accept any 4-digit PIN for now
    return pin.length === 4;
  }, []);

  // Handle START piece
  const handleStartPiece = useCallback((piece: ProductionPiece) => {
    if (activePieceId && activePieceId !== piece.id) {
      toast.error('Finalize a tarefa atual antes de iniciar outra');
      return;
    }
    setPinPiece(piece);
    setPinAction('start');
    setPinError('');
    setPinOpen(true);
  }, [activePieceId]);

  // Handle FINISH piece
  const handleFinishPiece = useCallback((piece: ProductionPiece) => {
    if (activePieceId !== piece.id) return;

    const elapsed = activeStartedAt
      ? Math.floor((Date.now() - new Date(activeStartedAt).getTime()) / 1000)
      : 0;

    setFinishPiece(piece);
    setFinishElapsed(elapsed);
    setFinishOpen(true);
  }, [activePieceId, activeStartedAt]);

  // PIN confirmed
  const handlePinConfirm = useCallback(async (pin: string) => {
    setPinLoading(true);
    setPinError('');

    const valid = await validatePin(pin);
    if (!valid) {
      setPinError('Senha incorreta');
      setPinLoading(false);
      return;
    }

    setPinLoading(false);
    setPinOpen(false);

    if (pinAction === 'start' && pinPiece) {
      // Create log entry with started_at, no finished_at
      const now = new Date().toISOString();
      try {
        const logEntry = {
          piece_id: pinPiece.id,
          project_id: pinPiece.project_id,
          unit_id: activeUnitId!,
          operation: pinPiece.process_type || 'PRODUÇÃO',
          started_at: now,
          finished_at: null,
          quantity_done: 0,
          operator_id: user?.id || null,
          machine_ref: null,
          date: format(new Date(), 'yyyy-MM-dd'),
        };
        const { data, error } = await (supabase.from('production_logs') as any).insert(logEntry).select('id').single();

        if (error) throw error;

        setActivePieceId(pinPiece.id);
        setActiveStartedAt(now);
        setActiveLogId(data?.id || null);
        toast.success(`Tarefa iniciada: ${pinPiece.description}`);
      } catch (err: any) {
        toast.error(err.message || 'Erro ao iniciar');
      }
    }
  }, [pinAction, pinPiece, activeUnitId, user, validatePin]);

  // Finish confirmed with quantity
  const handleFinishConfirm = useCallback(async (quantity: number, machineRef?: string) => {
    if (!activeLogId || !finishPiece) return;

    const now = new Date().toISOString();
    try {
      await updateLog(activeLogId, {
        finished_at: now,
        quantity_done: quantity,
        machine_ref: machineRef || null,
      } as any);

      toast.success(`${quantity} unidades registradas!`);
      setActivePieceId(null);
      setActiveStartedAt(null);
      setActiveLogId(null);
      setFinishPiece(null);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao finalizar');
      throw err;
    }
  }, [activeLogId, finishPiece, updateLog]);

  if (projectsLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background pb-24">
          <div className="px-4 py-4 space-y-4">
            <div className="h-10 rounded-lg bg-muted/20 animate-pulse" />
            {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl bg-muted/15 animate-pulse" />)}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24">
        <div className="px-4 py-4 lg:px-6 lg:max-w-4xl lg:mx-auto space-y-4">
          {!selectedProjectId ? (
            <ProductionOSList
              projects={projects}
              pieces={piecesMap}
              progressMap={progressMap}
              onSelect={handleSelectProject}
              onCreateProject={() => setProjectSheetOpen(true)}
              isAdmin={isAdmin}
            />
          ) : selectedProject ? (
            <ProductionCutTableNew
              project={selectedProject}
              pieces={pieces}
              progressMap={progressMap}
              shippedByPiece={shippedByPiece}
              onTapPiece={(p) => setSelectedPiece(p)}
              onStartPiece={handleStartPiece}
              onFinishPiece={handleFinishPiece}
              onBack={handleBack}
              onManageProject={() => setProjectSheetOpen(true)}
              isAdmin={isAdmin}
              activePieceId={activePieceId}
              activeStartedAt={activeStartedAt}
            />
          ) : null}
        </div>
      </div>

      {/* Piece detail sheet */}
      <PieceSheet
        open={!!selectedPiece}
        onOpenChange={(v) => { if (!v) setSelectedPiece(null); }}
        piece={selectedPiece}
        progress={selectedPiece ? progressMap.get(selectedPiece.id) || null : null}
        shipments={shipments}
        shippedTotal={selectedPiece ? (shippedByPiece.get(selectedPiece.id) || 0) : 0}
        userId={user?.id || ''}
        unitId={activeUnitId || ''}
        onAddLog={addLog}
        onAddShipment={addShipment}
      />

      {/* Project management */}
      <ProjectSheet
        open={projectSheetOpen}
        onOpenChange={setProjectSheetOpen}
        projects={projects}
        sectors={[]}
        onCreateProject={createProject}
        onUpdateProject={updateProject}
        onDeleteProject={deleteProject}
      />

      {/* PIN dialog */}
      <PinDialog
        open={pinOpen}
        onOpenChange={setPinOpen}
        onConfirm={handlePinConfirm}
        title="Senha do Operador"
        subtitle={pinPiece?.description}
        loading={pinLoading}
        error={pinError}
      />

      {/* Finish task dialog */}
      <FinishTaskDialog
        open={finishOpen}
        onOpenChange={setFinishOpen}
        piece={finishPiece}
        elapsedSeconds={finishElapsed}
        onFinish={handleFinishConfirm}
      />
    </AppLayout>
  );
}
