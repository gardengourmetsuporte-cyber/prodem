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
import { useQuery } from '@tanstack/react-query';
import { fetchSectorsData } from '@/hooks/checklists/useChecklistFetch';
import { ChecklistSector } from '@/types/database';

export default function ProductionPage() {
  const { isAdmin, user } = useAuth();
  const { activeUnitId } = useUnit();

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<ProductionPiece | null>(null);
  const [projectSheetOpen, setProjectSheetOpen] = useState(false);

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

  // Detect active (open) log from DB instead of local state
  const { data: activeLog = null, refetch: refetchActiveLog } = useQuery<{ id: string; piece_id: string; started_at: string } | null>({
    queryKey: ['active-production-log', selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId || !activeUnitId) return null;
      const { data, error } = await (supabase.from('production_logs') as any)
        .select('id, piece_id, started_at')
        .eq('project_id', selectedProjectId)
        .eq('unit_id', activeUnitId)
        .not('started_at', 'is', null)
        .is('finished_at', null)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data || null;
    },
    enabled: !!selectedProjectId && !!activeUnitId,
    refetchInterval: 5_000,
  });

  const activePieceId = activeLog?.piece_id || null;
  const activeStartedAt = activeLog?.started_at || null;
  const activeLogId = activeLog?.id || null;

  // Projects
  const { projects, createProject, updateProject, deleteProject, isLoading: projectsLoading } = useProductionProjects(activeUnitId);

  // Fetch checklist sectors for piece selection in OS creation
  const { data: sectors = [] } = useQuery<ChecklistSector[]>({
    queryKey: ['checklist-sectors', activeUnitId],
    queryFn: () => fetchSectorsData(activeUnitId),
    enabled: !!activeUnitId,
  });
  // Pieces for selected project
  const { pieces, isLoading: piecesLoading } = useProductionPieces(selectedProjectId, activeUnitId);

  // Logs & shipments for selected project
  const { progressMap: selectedProgressMap, addLog, updateLog } = useProductionLogs(selectedProjectId, activeUnitId);
  const { shipments, shippedByPiece, addShipment } = useProductionShipments(selectedProjectId, activeUnitId);

  // OS List needs ALL projects data (not only selected project)
  const { data: allPieces = [] } = useQuery<ProductionPiece[]>({
    queryKey: ['production-pieces-all', activeUnitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('production_pieces')
        .select('*')
        .eq('unit_id', activeUnitId!)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as ProductionPiece[];
    },
    enabled: !!activeUnitId,
    refetchInterval: 10_000,
  });

  const { data: allLogs = [] } = useQuery<any[]>({
    queryKey: ['production-logs-all', activeUnitId],
    queryFn: async () => {
      const { data, error } = await (supabase.from('production_logs') as any)
        .select('piece_id, quantity_done, started_at, finished_at')
        .eq('unit_id', activeUnitId!);
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeUnitId,
    refetchInterval: 10_000,
  });

  const osPiecesMap = useMemo(() => {
    const map = new Map<string, ProductionPiece[]>();
    allPieces.forEach((piece) => {
      const arr = map.get(piece.project_id) || [];
      arr.push(piece);
      map.set(piece.project_id, arr);
    });
    return map;
  }, [allPieces]);

  const osProgressMap = useMemo(() => {
    const map = new Map<string, { piece_id: string; total_done: number; in_progress: boolean; logs: any[] }>();
    allLogs.forEach((log: any) => {
      if (!map.has(log.piece_id)) {
        map.set(log.piece_id, { piece_id: log.piece_id, total_done: 0, in_progress: false, logs: [] });
      }
      const current = map.get(log.piece_id)!;
      current.total_done += Number(log.quantity_done || 0);
      if (log.started_at && !log.finished_at) current.in_progress = true;
      current.logs.push(log);
    });
    return map;
  }, [allLogs]);

  const selectedProject = projects.find(p => p.id === selectedProjectId) || null;

  const handleSelectProject = useCallback((id: string) => {
    setSelectedProjectId(id);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedProjectId(null);
  }, []);

  // Validate PIN against employees table
  const validatePin = useCallback(async (pin: string): Promise<boolean> => {
    if (pin.length !== 4 || !activeUnitId) return false;
    const { data, error } = await (supabase
      .from('employees') as any)
      .select('id, full_name')
      .eq('unit_id', activeUnitId)
      .eq('pin_code', pin)
      .eq('is_active', true)
      .limit(1);
    if (error || !data || data.length === 0) return false;
    return true;
  }, [activeUnitId]);

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

  // Handle FINISH piece — ask for PIN first (to identify who is finishing)
  const handleFinishPiece = useCallback((piece: ProductionPiece) => {
    if (activePieceId !== piece.id) return;
    setPinPiece(piece);
    setPinAction('finish');
    setPinError('');
    setPinOpen(true);
  }, [activePieceId]);

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
        const { error } = await (supabase.from('production_logs') as any).insert(logEntry).select('id').single();
        if (error) throw error;

        await refetchActiveLog();
        toast.success(`Tarefa iniciada: ${pinPiece.description}`);
      } catch (err: any) {
        toast.error(err.message || 'Erro ao iniciar');
      }
    }

    if (pinAction === 'finish' && pinPiece) {
      // Open the finish dialog with elapsed time
      const elapsed = activeStartedAt
        ? Math.floor((Date.now() - new Date(activeStartedAt).getTime()) / 1000)
        : 0;
      setFinishPiece(pinPiece);
      setFinishElapsed(elapsed);
      setFinishOpen(true);
    }
  }, [pinAction, pinPiece, activeUnitId, user, validatePin, activeStartedAt, refetchActiveLog]);

  // Finish confirmed with quantity
  const handleFinishConfirm = useCallback(async (quantity: number, machineRef?: string) => {
    if (!activeLogId || !finishPiece) return;

    const now = new Date().toISOString();
    try {
      await updateLog(activeLogId, {
        finished_at: now,
        finished_by: user?.id || null,
        quantity_done: quantity,
        machine_ref: machineRef || null,
      } as any);

      toast.success(`${quantity} unidades registradas!`);
      setFinishPiece(null);
      await refetchActiveLog();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao finalizar');
      throw err;
    }
  }, [activeLogId, finishPiece, updateLog, user, refetchActiveLog]);

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
              pieces={osPiecesMap}
              progressMap={osProgressMap as any}
              onSelect={handleSelectProject}
              onCreateProject={() => setProjectSheetOpen(true)}
              isAdmin={isAdmin}
            />
          ) : selectedProject ? (
            <ProductionCutTableNew
              project={selectedProject}
              pieces={pieces}
              progressMap={selectedProgressMap}
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
        progress={selectedPiece ? selectedProgressMap.get(selectedPiece.id) || null : null}
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
        sectors={sectors}
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
