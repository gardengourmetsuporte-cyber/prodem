import { useState, useCallback, useMemo } from 'react';
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
import { AppIcon } from '@/components/ui/app-icon';

export default function ProductionPage() {
  const { isAdmin, user } = useAuth();
  const { activeUnitId } = useUnit();

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<ProductionPiece | null>(null);
  const [projectSheetOpen, setProjectSheetOpen] = useState(false);

  // Projects
  const { projects, createProject, updateProject, deleteProject, isLoading: projectsLoading } = useProductionProjects(activeUnitId);

  // Pieces for selected project
  const { pieces, isLoading: piecesLoading } = useProductionPieces(selectedProjectId, activeUnitId);

  // Logs & shipments for selected project
  const { progressMap, addLog } = useProductionLogs(selectedProjectId, activeUnitId);
  const { shipments, shippedByPiece, addShipment } = useProductionShipments(selectedProjectId, activeUnitId);

  // Build pieces map for OS list (only active projects)
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
  }, []);

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
            /* Tela 1: Lista de OS */
            <ProductionOSList
              projects={projects}
              pieces={piecesMap}
              progressMap={progressMap}
              onSelect={handleSelectProject}
              onCreateProject={() => setProjectSheetOpen(true)}
              isAdmin={isAdmin}
            />
          ) : selectedProject ? (
            /* Tela 2: Tabela de Cortes */
            <ProductionCutTableNew
              project={selectedProject}
              pieces={pieces}
              progressMap={progressMap}
              shippedByPiece={shippedByPiece}
              onTapPiece={(p) => setSelectedPiece(p)}
              onBack={handleBack}
              onManageProject={() => setProjectSheetOpen(true)}
              isAdmin={isAdmin}
            />
          ) : null}
        </div>
      </div>

      {/* Tela 3: Ficha da Peça */}
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

      <ProjectSheet
        open={projectSheetOpen}
        onOpenChange={setProjectSheetOpen}
        projects={projects}
        sectors={[]}
        onCreateProject={createProject}
        onUpdateProject={updateProject}
        onDeleteProject={deleteProject}
      />
    </AppLayout>
  );
}
