import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { ProductionPiece } from '@/hooks/useProductionPieces';
import { PieceProgress } from '@/hooks/useProductionLogs';
import { ProductionProject } from '@/hooks/useProductionProjects';

interface Props {
  project: ProductionProject;
  pieces: ProductionPiece[];
  progressMap: Map<string, PieceProgress>;
  shippedByPiece: Map<string, number>;
  onTapPiece: (piece: ProductionPiece) => void;
  onStartPiece: (piece: ProductionPiece) => void;
  onFinishPiece: (piece: ProductionPiece) => void;
  onBack: () => void;
  onManageProject: () => void;
  isAdmin: boolean;
  activePieceId?: string | null; // currently being worked on
  activeStartedAt?: string | null; // when work started
}

function ElapsedTimer({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = new Date(startedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  return (
    <span className="font-mono text-[10px] text-warning font-bold">
      {m}:{s.toString().padStart(2, '0')}
    </span>
  );
}

export function ProductionCutTableNew({
  project, pieces, progressMap, shippedByPiece,
  onTapPiece, onStartPiece, onFinishPiece, onBack, onManageProject, isAdmin,
  activePieceId, activeStartedAt,
}: Props) {
  const [processFilter, setProcessFilter] = useState<string | null>(null);

  const processes = useMemo(() => {
    const set = new Set<string>();
    pieces.forEach(p => { if (p.process_type) set.add(p.process_type); });
    return [...set].sort();
  }, [pieces]);

  const filteredPieces = useMemo(() => {
    if (!processFilter) return pieces;
    return pieces.filter(p => p.process_type === processFilter);
  }, [pieces, processFilter]);

  const totalOrdered = filteredPieces.reduce((s, p) => s + p.qty_total, 0);
  const totalDone = filteredPieces.reduce((s, p) => s + (progressMap.get(p.id)?.total_done || 0), 0);
  const totalShipped = filteredPieces.reduce((s, p) => s + (shippedByPiece.get(p.id) || 0), 0);
  const overallPercent = totalOrdered > 0 ? Math.min(100, Math.round((totalDone / totalOrdered) * 100)) : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-muted/20 transition-colors">
          <AppIcon name="ArrowLeft" size={20} className="text-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-primary">OS {project.project_number}</span>
            {project.client && <span className="text-xs text-muted-foreground">• {project.client}</span>}
          </div>
          <p className="text-sm font-bold text-foreground truncate">{project.description}</p>
        </div>
        {isAdmin && (
          <button onClick={onManageProject} className="p-2 rounded-lg hover:bg-muted/20 transition-colors">
            <AppIcon name="Settings" size={18} className="text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="p-3 rounded-xl bg-card border border-border/30 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-muted-foreground uppercase tracking-widest">Progresso</span>
          <div className="flex items-center gap-3 font-mono">
            <span className={cn("font-bold", overallPercent >= 100 ? "text-success" : "text-foreground")}>
              {totalDone}/{totalOrdered} PCS ({overallPercent}%)
            </span>
            {totalShipped > 0 && (
              <span className="text-muted-foreground">📦 {totalShipped} exp.</span>
            )}
          </div>
        </div>
        <div className="h-2 rounded-full bg-muted/20 overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", overallPercent >= 100 ? "bg-success" : "bg-primary")}
            style={{ width: `${overallPercent}%` }}
          />
        </div>
      </div>

      {/* Process filter */}
      {processes.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setProcessFilter(null)}
            className={cn(
              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap border transition-colors",
              !processFilter ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border/40"
            )}
          >
            Todos
          </button>
          {processes.map(proc => (
            <button
              key={proc}
              onClick={() => setProcessFilter(processFilter === proc ? null : proc)}
              className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap border transition-colors",
                processFilter === proc ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border/40"
              )}
            >
              {proc}
            </button>
          ))}
        </div>
      )}

      {/* Table header label */}
      <div className="flex items-center gap-2 px-1">
        <AppIcon name="TableProperties" size={14} className="text-muted-foreground/50" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
          TABELA DE CORTES DE BARRAS
        </span>
      </div>

      {/* Pieces list - card-based for mobile */}
      {filteredPieces.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <AppIcon name="Package" size={28} className="text-muted-foreground/30 mx-auto" />
          <p className="text-xs font-bold text-muted-foreground">Nenhuma peça cadastrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredPieces.map((piece) => {
            const prog = progressMap.get(piece.id);
            const done = prog?.total_done || 0;
            const isComplete = done >= piece.qty_total;
            const isActive = activePieceId === piece.id;
            const shipped = shippedByPiece.get(piece.id) || 0;
            const percent = piece.qty_total > 0 ? Math.round((done / piece.qty_total) * 100) : 0;

            return (
              <div
                key={piece.id}
                className={cn(
                  "p-3 rounded-xl border transition-all",
                  isActive
                    ? "bg-warning/5 border-warning/40 ring-1 ring-warning/20"
                    : isComplete
                    ? "bg-success/5 border-success/20 opacity-60"
                    : "bg-card border-border/30 hover:border-border/60",
                )}
              >
                {/* Top row: code + description + process */}
                <div className="flex items-start gap-2 mb-2" onClick={() => onTapPiece(piece)}>
                  <div className="flex-1 min-w-0 cursor-pointer">
                    <div className="flex items-center gap-2 mb-0.5">
                      {piece.material_code && (
                        <span className="text-[10px] font-mono text-primary/80">{piece.material_code}</span>
                      )}
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                        {piece.process_type}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-foreground leading-tight truncate">{piece.description}</p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground font-mono">
                      {piece.cut_length_mm && <span>{piece.cut_length_mm}mm</span>}
                      <span>Rack: {piece.qty_per_rack || '-'}</span>
                      <span className="font-bold text-foreground">Total: {piece.qty_total}</span>
                    </div>
                  </div>
                </div>

                {/* Progress + action row */}
                <div className="flex items-center gap-3">
                  {/* Mini progress */}
                  <div className="flex-1 space-y-1">
                    <div className="h-1.5 rounded-full bg-muted/20 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          isComplete ? "bg-success" : isActive ? "bg-warning" : "bg-primary"
                        )}
                        style={{ width: `${Math.min(100, percent)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className={cn(
                        "font-bold",
                        isComplete ? "text-success" : isActive ? "text-warning" : "text-muted-foreground"
                      )}>
                        {done}/{piece.qty_total}
                      </span>
                      {isActive && activeStartedAt && (
                        <ElapsedTimer startedAt={activeStartedAt} />
                      )}
                      {shipped > 0 && (
                        <span className="text-muted-foreground">📦 {shipped}</span>
                      )}
                    </div>
                  </div>

                  {/* Action button */}
                  {!isComplete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isActive) {
                          onFinishPiece(piece);
                        } else {
                          onStartPiece(piece);
                        }
                      }}
                      className={cn(
                        "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all",
                        isActive
                          ? "bg-success text-success-foreground border-success hover:bg-success/90"
                          : "bg-card text-muted-foreground border-border/50 hover:border-primary/50 hover:text-primary"
                      )}
                    >
                      {isActive ? (
                        <span className="flex items-center gap-1">
                          <AppIcon name="Square" size={10} />
                          PARAR
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <AppIcon name="Play" size={10} />
                          INICIAR
                        </span>
                      )}
                    </button>
                  )}

                  {isComplete && (
                    <span className="px-3 py-1.5 rounded-lg bg-success/20 text-success text-[10px] font-black">
                      ✓ OK
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
