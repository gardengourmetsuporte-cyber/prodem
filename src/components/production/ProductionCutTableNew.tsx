import { useState, useMemo } from 'react';
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
  onBack: () => void;
  onManageProject: () => void;
  isAdmin: boolean;
}

export function ProductionCutTableNew({
  project, pieces, progressMap, shippedByPiece,
  onTapPiece, onBack, onManageProject, isAdmin,
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

      {/* Table */}
      {filteredPieces.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <AppIcon name="Package" size={28} className="text-muted-foreground/30 mx-auto" />
          <p className="text-xs font-bold text-muted-foreground">Nenhuma peça cadastrada</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/40 bg-card/60">
          <table className="w-full text-left font-sans whitespace-nowrap border-collapse">
            <thead>
              <tr className="bg-muted/40 border-b border-border/50 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                <th className="px-3 py-2.5 border-r border-border/20">Cód.</th>
                <th className="px-3 py-2.5 border-r border-border/20 min-w-[160px]">Descrição</th>
                <th className="px-3 py-2.5 border-r border-border/20 text-center">mm</th>
                <th className="px-3 py-2.5 border-r border-border/20 text-center">Rack</th>
                <th className="px-3 py-2.5 border-r border-border/20 text-center">Total</th>
                <th className="px-3 py-2.5 border-r border-border/20">Proc.</th>
                <th className="px-3 py-2.5 text-center">Feito</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20 text-[12px]">
              {filteredPieces.map((piece, idx) => {
                const prog = progressMap.get(piece.id);
                const done = prog?.total_done || 0;
                const isComplete = done >= piece.qty_total;
                const isInProgress = prog?.in_progress || false;
                const shipped = shippedByPiece.get(piece.id) || 0;

                return (
                  <tr
                    key={piece.id}
                    onClick={() => onTapPiece(piece)}
                    className={cn(
                      "transition-colors hover:bg-white/[0.04] cursor-pointer",
                      idx % 2 === 0 ? "bg-card" : "bg-card/40",
                      isComplete && "opacity-40"
                    )}
                  >
                    <td className="px-3 py-2.5 border-r border-border/10 font-mono text-muted-foreground/80 text-[11px]">
                      {piece.material_code || '-'}
                    </td>
                    <td className="px-3 py-2.5 border-r border-border/10 font-bold text-foreground truncate max-w-[200px]">
                      {piece.description}
                    </td>
                    <td className="px-3 py-2.5 border-r border-border/10 text-center font-mono text-foreground/80">
                      {piece.cut_length_mm || '-'}
                    </td>
                    <td className="px-3 py-2.5 border-r border-border/10 text-center font-mono text-muted-foreground">
                      {piece.qty_per_rack || '-'}
                    </td>
                    <td className="px-3 py-2.5 border-r border-border/10 text-center font-black text-sm text-foreground">
                      {piece.qty_total}
                    </td>
                    <td className="px-3 py-2.5 border-r border-border/10 text-muted-foreground uppercase tracking-widest text-[9px] font-black">
                      {piece.process_type}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {isComplete ? (
                        <span className="inline-block px-2 py-0.5 rounded bg-success/20 text-success text-[10px] font-black">
                          {done}/{piece.qty_total}
                        </span>
                      ) : isInProgress ? (
                        <span className="inline-block px-2 py-0.5 rounded bg-warning/20 text-warning text-[10px] font-black animate-pulse">
                          {done}/{piece.qty_total}
                        </span>
                      ) : done > 0 ? (
                        <span className="inline-block px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-black">
                          {done}/{piece.qty_total}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40 text-[10px] font-mono">0/{piece.qty_total}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
