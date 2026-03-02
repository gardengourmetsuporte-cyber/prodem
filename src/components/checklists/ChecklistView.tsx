import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppIcon } from '@/components/ui/app-icon';
import { ICON_MAP } from '@/lib/iconMap';
import { ChecklistSector, ChecklistType, ChecklistCompletion, Profile } from '@/types/database';
import { cn } from '@/lib/utils';
import { useCoinAnimation } from '@/contexts/CoinAnimationContext';
import { useUnit } from '@/contexts/UnitContext';
// Inline expandable options — no Popover/Portal to avoid scroll issues
import { getPointsColors, getBonusPointsColors } from '@/lib/points';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface ChecklistViewProps {
  sectors: ChecklistSector[];
  checklistType: ChecklistType;
  date: string;
  completions: ChecklistCompletion[];
  allShiftCompletions?: { item_id: string; checklist_type: string; quantity_done: number; status: string; is_skipped: boolean }[];
  isItemCompleted: (itemId: string) => boolean;
  getItemStatus: (itemId: string) => string;
  onToggleItem: (itemId: string, points: number, completedByUserId?: string, isSkipped?: boolean, photoUrl?: string) => void;
  onStartProduction: (itemId: string, completedByUserId?: string) => Promise<void>;
  onFinishProduction: (itemId: string, quantityDone: number, points: number, completedByUserId?: string) => Promise<void>;
  onUpdateProductionQuantity?: (completionId: string, newQuantity: number) => Promise<void>;
  getCompletionProgress: (sectorId: string) => { completed: number; total: number };
  getCrossShiftItemProgress?: (itemId: string) => { targetQty: number; totalDone: number; remaining: number; isFullyComplete: boolean };
  currentUserId?: string;
  isAdmin: boolean;
  deadlinePassed?: boolean;
  onContestCompletion?: (completionId: string, reason: string) => Promise<void>;
  onSplitCompletion?: (itemId: string, date: string, checklistType: ChecklistType, userIds: string[]) => Promise<void>;
}

const isToday = (dateStr: string): boolean => {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  if (dateStr === todayStr) return true;
  if (now.getHours() < 2) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    return dateStr === yesterdayStr;
  }
  return false;
};

/** Format elapsed milliseconds as "Xh Ymin" or "Xmin Ys" */
function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes.toString().padStart(2, '0')}min`;
  if (minutes > 0) return `${minutes}min ${seconds.toString().padStart(2, '0')}s`;
  return `${seconds}s`;
}

// Fallback icon based on sector name when icon field is null
const sectorNameIconMap: Record<string, string> = {
  'cozinha': 'restaurant',
  'salão': 'storefront',
  'salao': 'storefront',
  'caixa': 'payments',
  'banheiro': 'bathtub',
  'banheiros': 'bathtub',
  'geral': 'checklist',
  'produção': 'precision_manufacturing',
  'producao': 'precision_manufacturing',
  'estoque': 'inventory_2',
  'limpeza': 'cleaning_services',
  'atendimento': 'support_agent',
};

function getSectorIcon(sector: { icon?: string | null; name: string }): string {
  // If icon is set and not the generic 'Folder', use it
  if (sector.icon && sector.icon !== 'Folder') return sector.icon;
  // Fallback: match by sector name
  const key = sector.name.toLowerCase().trim();
  return sectorNameIconMap[key] || 'folder';
}

export function ChecklistView({
  sectors,
  checklistType,
  date,
  completions,
  allShiftCompletions,
  isItemCompleted,
  getItemStatus,
  onToggleItem,
  onStartProduction,
  onFinishProduction,
  onUpdateProductionQuantity,
  getCompletionProgress,
  getCrossShiftItemProgress,
  onContestCompletion,
  onSplitCompletion,
  currentUserId,
  isAdmin,
  deadlinePassed = false,
}: ChecklistViewProps) {
  const { triggerCoin } = useCoinAnimation();
  const { activeUnitId } = useUnit();
  const [expandedSectors, setExpandedSectors] = useState<Set<string>>(new Set());
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Pick<Profile, 'user_id' | 'full_name'>[]>([]);
  const [optimisticToggles, setOptimisticToggles] = useState<Set<string>>(new Set());
  const [recentlyCompleted, setRecentlyCompleted] = useState<Set<string>>(new Set());
  // Contestation state
  const [expandedPeopleFor, setExpandedPeopleFor] = useState<string | null>(null);
  const [contestingItemId, setContestingItemId] = useState<string | null>(null);
  const [contestReason, setContestReason] = useState('');
  const [contestLoading, setContestLoading] = useState(false);
  // Split state
  const [splittingItemId, setSplittingItemId] = useState<string | null>(null);
  const [splitSelectedUsers, setSplitSelectedUsers] = useState<Set<string>>(new Set());
  const [splitLoading, setSplitLoading] = useState(false);
  // Photo capture state
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [pendingPhotoAction, setPendingPhotoAction] = useState<{
    itemId: string; points: number; configuredPoints: number;
    completedByUserId?: string; buttonElement?: HTMLElement;
  } | null>(null);
  // Photo viewer
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState<string | null>(null);
  // Production finish state
  const [finishingItemId, setFinishingItemId] = useState<string | null>(null);
  const [finishQuantity, setFinishQuantity] = useState('');
  const [finishLoading, setFinishLoading] = useState(false);
  const [startingItemId, setStartingItemId] = useState<string | null>(null);
  // Update production quantity state
  const [updatingQtyItemId, setUpdatingQtyItemId] = useState<string | null>(null);
  const [updateQtyValue, setUpdateQtyValue] = useState('');
  const [updateQtyLoading, setUpdateQtyLoading] = useState(false);
  // Live timer tick for in-progress production items
  const [timerTick, setTimerTick] = useState(0);

  // Tick every second for live timers
  useEffect(() => {
    const hasInProgress = completions.some(c => (c as any).status === 'in_progress' && (c as any).started_at);
    if (!hasInProgress) return;
    const interval = setInterval(() => setTimerTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [completions]);

  useEffect(() => {
    if (!activeUnitId) return;
    
    // Step 1: get user_ids for this unit
    supabase
      .from('user_units')
      .select('user_id')
      .eq('unit_id', activeUnitId)
      .then(({ data: unitMembers }) => {
        if (!unitMembers || unitMembers.length === 0) {
          setProfiles([]);
          return;
        }
        const userIds = unitMembers.map(m => m.user_id);
        // Step 2: fetch only profiles belonging to this unit
        supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds)
          .order('full_name')
          .then(({ data }) => {
            if (data) setProfiles(data);
          });
      });
  }, [activeUnitId]);

  // Reset collapsed state when sectors change (keep collapsed)
  // No need to auto-expand

  // Clear optimistic toggles when completions update — only if there are pending toggles
  useEffect(() => {
    setOptimisticToggles(prev => prev.size > 0 ? new Set() : prev);
  }, [completions]);

  const toggleSector = (sectorId: string) => {
    setExpandedSectors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectorId)) newSet.delete(sectorId);
      else newSet.add(sectorId);
      return newSet;
    });
  };

  const toggleSubcategory = (subcategoryId: string) => {
    setExpandedSubcategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subcategoryId)) newSet.delete(subcategoryId);
      else newSet.add(subcategoryId);
      return newSet;
    });
  };

  const getTypeLabel = (type: ChecklistType) => {
    switch (type) {
      case 'abertura': return 'Turno 1';
      case 'fechamento': return 'Turno 2';
      case 'bonus': return 'Bônus';
      default: return 'Turno 1';
    }
  };

  const isBonus = checklistType === 'bonus';
  const getItemPointsColors = isBonus ? getBonusPointsColors : getPointsColors;

  const isTodayDate = isToday(date);

  const canToggleItem = (completion: ChecklistCompletion | undefined, completed: boolean) => {
    if (isAdmin) {
      if (completed) return true;
      return true; // admins can always toggle
    }
    if (!isTodayDate) return false;
    // After deadline, non-admins cannot toggle uncompleted items
    if (deadlinePassed && !completed) return false;
    if (!completed) return true;
    if (completion?.completed_by === currentUserId) return true;
    return false;
  };

  // Optimistic item completed check
  const isItemCompletedOptimistic = useCallback((itemId: string) => {
    if (optimisticToggles.has(itemId)) {
      // Optimistic toggle inverts the real state
      return !isItemCompleted(itemId);
    }
    return isItemCompleted(itemId);
  }, [isItemCompleted, optimisticToggles]);

  const handleComplete = (itemId: string, points: number, configuredPoints: number, completedByUserId?: string, buttonElement?: HTMLElement, isSkipped?: boolean) => {
    // Check if item requires photo and is not being unchecked or skipped
    if (!isSkipped) {
      const itemRequiresPhoto = sectors.some(s => 
        s.subcategories?.some(sub => 
          sub.items?.some(i => i.id === itemId && (i as any).requires_photo === true)
        )
      );
      if (itemRequiresPhoto) {
        // Open photo capture sheet
        setPendingPhotoAction({ itemId, points, configuredPoints, completedByUserId, buttonElement });
        setPhotoSheetOpen(true);
        setPhotoPreview(null);
        setPhotoFile(null);
        return;
      }
    }

    executeComplete(itemId, points, configuredPoints, completedByUserId, buttonElement, isSkipped);
  };

  const executeComplete = (itemId: string, points: number, configuredPoints: number, completedByUserId?: string, buttonElement?: HTMLElement, isSkipped?: boolean, photoUrl?: string) => {
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(10);

    // Optimistic toggle
    setOptimisticToggles(prev => {
      const next = new Set(prev);
      next.add(itemId);
      return next;
    });

    // Burst animation for completion (not for skip)
    if (points > 0 && !isSkipped) {
      setRecentlyCompleted(prev => {
        const next = new Set(prev);
        next.add(itemId);
        return next;
      });
      setTimeout(() => {
        setRecentlyCompleted(prev => {
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
      }, 600);
    }

    if (points > 0 && !isSkipped && buttonElement) {
      const rect = buttonElement.getBoundingClientRect();
      const coinCount = isBonus ? Math.min(points, 5) : points;
      for (let i = 0; i < coinCount; i++) {
        setTimeout(() => {
          triggerCoin(rect.right - 40 + (i * 10), rect.top + rect.height / 2, configuredPoints);
        }, i * 100);
      }
    }
    onToggleItem(itemId, isSkipped ? 0 : points, completedByUserId, isSkipped, photoUrl);
    setOpenPopover(null);
    setExpandedPeopleFor(null);
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handlePhotoConfirm = async () => {
    if (!photoFile || !pendingPhotoAction) return;
    setPhotoUploading(true);
    try {
      const ext = photoFile.name.split('.').pop() || 'jpg';
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('checklist-photos')
        .upload(path, photoFile);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('checklist-photos')
        .getPublicUrl(path);

      const { itemId, points, configuredPoints, completedByUserId, buttonElement } = pendingPhotoAction;
      setPhotoSheetOpen(false);
      executeComplete(itemId, points, configuredPoints, completedByUserId, buttonElement, false, urlData.publicUrl);
      setPendingPhotoAction(null);
      setPhotoPreview(null);
      setPhotoFile(null);
    } catch (err: any) {
      console.error('Photo upload error:', err);
      toast.error('Erro ao enviar foto');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSplit = async (itemId: string, completion: any, configuredPoints: number) => {
    if (!onSplitCompletion || splitSelectedUsers.size < 2) return;
    setSplitLoading(true);
    try {
      await onSplitCompletion(itemId, date, checklistType, Array.from(splitSelectedUsers));
      setSplittingItemId(null);
      setSplitSelectedUsers(new Set());
      toast.success('Pontos divididos com sucesso!');
    } catch (err: any) {
      console.error('Split error:', err);
      toast.error(err.message || 'Erro ao dividir pontos');
    } finally {
      setSplitLoading(false);
    }
  };

  const getItemCompletionCount = useCallback((itemId: string) => {
    return completions.filter(c => c.item_id === itemId && !c.is_skipped).length;
  }, [completions]);

  const handleContest = async (completionId: string) => {
    if (!onContestCompletion || !contestReason.trim()) return;
    setContestLoading(true);
    try {
      await onContestCompletion(completionId, contestReason);
      setContestingItemId(null);
      setContestReason('');
    } catch (err: any) {
      console.error('Contest error:', err);
      toast.error('Erro ao contestar item');
    } finally {
      setContestLoading(false);
    }
  };

  const filteredSectors = sectors.filter(sector => {
    const isBonus = checklistType === 'bonus';
    const hasActiveItems = sector.subcategories?.some(sub =>
      sub.items?.some(i => i.is_active && (isBonus ? (i as any).checklist_type === 'bonus' : (i as any).checklist_type !== 'bonus'))
    );
    return hasActiveItems;
  });

  const deadlineBannerText = deadlinePassed
    ? '⏰ Prazo encerrado — itens pendentes marcados como "não concluído"'
    : null;

  return (
    <div className="space-y-5">
      {/* Deadline banner */}
      {deadlineBannerText && !isAdmin && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
          <AppIcon name="Clock" className="w-4 h-4 shrink-0" />
          <span>{deadlineBannerText}</span>
        </div>
      )}

      {/* Sectors */}
      {filteredSectors.length === 0 && (
        <div className="card-command p-8 text-center">
          <p className="text-muted-foreground text-sm">
            Nenhuma tarefa configurada para {getTypeLabel(checklistType)}.
          </p>
        </div>
      )}
      {filteredSectors.map((sector, sectorIndex) => {
        const isExpanded = expandedSectors.has(sector.id);
        const progress = getCompletionProgress(sector.id);
        const sectorComplete = progress.total > 0 && progress.completed === progress.total;

        return (
          <div 
            key={sector.id} 
            className="space-y-2 animate-fade-in"
            style={{ animationDelay: `${sectorIndex * 80}ms` }}
          >
            {/* Sector Header */}
            <button
              onClick={() => toggleSector(sector.id)}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-xl transition-all duration-300",
                sectorComplete 
                  ? "card-command-success ring-1 ring-success/20" 
                  : "card-command hover:shadow-lg"
              )}
            >
              <div className="flex items-stretch gap-3">
                {/* Lateral color bar */}
                <div
                  className="w-[3px] rounded-full shrink-0 transition-colors duration-500"
                  style={{ backgroundColor: sectorComplete ? 'hsl(var(--success))' : sector.color }}
                />
                {/* Monochrome icon */}
                <div className="shrink-0">
                  {sectorComplete ? (
                    <AppIcon name="check_circle" size={22} fill={1} className="text-success animate-scale-in" />
                  ) : (
                    <AppIcon name={getSectorIcon(sector)} size={22} fill={0} className="text-muted-foreground" />
                  )}
                </div>
                <div className="text-left">
                  <p className={cn(
                    "font-semibold transition-colors duration-300",
                    sectorComplete ? "text-success" : "text-foreground"
                  )}>
                    {sector.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {progress.completed}/{progress.total} concluídos
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-12 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-500",
                      sectorComplete ? "bg-success" : "bg-primary"
                    )}
                    style={{ width: `${progress.total > 0 ? (progress.completed / progress.total) * 100 : 0}%` }}
                  />
                </div>
                <div className={cn(
                  "transition-transform duration-300",
                  isExpanded ? "rotate-0" : "-rotate-90"
                )}>
                  <AppIcon name="ChevronDown" className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            </button>

            {/* Items — animated collapse */}
            <div className={cn(
              "overflow-hidden transition-all duration-300 ease-out",
              isExpanded ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"
            )}>
              {isBonus ? (
                /* BONUS: Flat list - items directly under sector, no subcategory headers */
                <div className="ml-4 space-y-1.5 pt-1 pb-2">
                  {sector.subcategories?.flatMap(sub => 
                    (sub.items || []).filter(i => i.is_active && (isBonus ? (i as any).checklist_type === 'bonus' : (i as any).checklist_type !== 'bonus'))
                  ).map((item, itemIndex) => {
                    const completed = isItemCompletedOptimistic(item.id);
                    const completion = completions.find(c => c.item_id === item.id);
                    const canToggle = canToggleItem(completion, completed);
                    const isLockedByOther = completed && !canToggle;
                    const wasAwardedPoints = completion?.awarded_points !== false;
                    const wasSkipped = completion?.is_skipped === true;
                    const pointsAwarded = completion?.points_awarded ?? item.points;
                    const configuredPoints = item.points ?? 1;
                    const isJustCompleted = recentlyCompleted.has(item.id);

                    if (completed) {
                      const isContested = (completion as any)?.is_contested === true;
                      const contestedReason = (completion as any)?.contested_reason;
                      return (
                        <div key={item.id} className="space-y-1.5">
                          <button
                            onClick={() => {
                              if (isContested) return;
                              const isOwnCompletion = completion?.completed_by === currentUserId;
                              if (isAdmin || isOwnCompletion) {
                                setOpenPopover(openPopover === item.id ? null : item.id);
                                setContestingItemId(null);
                                setContestReason('');
                                setSplittingItemId(null);
                                return;
                              }
                              if (!canToggle) return;
                              setOptimisticToggles(prev => { const next = new Set(prev); next.add(item.id); return next; });
                              onToggleItem(item.id, 0);
                            }}
                            disabled={isContested ? true : (isAdmin || completion?.completed_by === currentUserId) ? false : !canToggle}
                            className={cn(
                              "w-full flex items-start gap-3 p-3 rounded-xl transition-all duration-300",
                              isContested
                                ? "bg-gradient-to-r from-amber-500/15 to-amber-500/5 border-2 border-amber-500/30"
                                : !canToggle && !isAdmin && "cursor-not-allowed opacity-80",
                              !isContested && (canToggle || isAdmin) && "active:scale-[0.97] hover:shadow-md",
                              !isContested && wasSkipped
                                ? "bg-gradient-to-r from-destructive/15 to-destructive/5 border-2 border-destructive/30"
                                : !isContested && "bg-gradient-to-r from-success/15 to-success/5 border-2 border-success/30",
                              isJustCompleted && "animate-scale-in",
                              openPopover === item.id && !isContested && "ring-2 ring-primary/30"
                            )}
                            style={{ animationDelay: `${itemIndex * 40}ms` }}
                          >
                            <div className={cn(
                              "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white shadow-md transition-all duration-300 mt-0.5",
                              isContested ? "bg-amber-500 shadow-amber-500/30"
                                : wasSkipped ? "bg-destructive shadow-destructive/30" : "bg-success shadow-success/30",
                              isJustCompleted && "scale-125"
                            )}>
                              {isContested ? <AppIcon name="AlertTriangle" className="w-4 h-4" /> : wasSkipped ? <AppIcon name="X" className="w-4 h-4" /> : <AppIcon name="Check" className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <div className="flex items-start justify-between gap-2">
                                <p className={cn("font-medium line-through text-sm leading-tight", isContested ? "text-amber-600 dark:text-amber-400" : wasSkipped ? "text-destructive" : "text-success")}>{item.name}</p>
                                <div className={cn(
                                  "flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 border transition-all duration-300",
                                  isContested ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                    : wasSkipped ? "bg-destructive/10 text-destructive border-destructive/20"
                                    : !wasAwardedPoints ? "bg-primary/10 text-primary border-primary/20" : "border-border"
                                )}
                                style={!isContested && !wasSkipped && wasAwardedPoints && pointsAwarded > 0 ? {
                                  backgroundColor: getItemPointsColors(pointsAwarded).bg,
                                  color: getItemPointsColors(pointsAwarded).color,
                                  borderColor: getItemPointsColors(pointsAwarded).border,
                                } : undefined}>
                                  {isContested ? (<><AppIcon name="AlertTriangle" className="w-3 h-3" /><span>contestado</span></>)
                                    : wasSkipped ? (<><AppIcon name="X" className="w-3 h-3" /><span>não concluído</span></>) 
                                    : !wasAwardedPoints ? (<><AppIcon name="RefreshCw" className="w-3 h-3" /><span>pronto</span></>) 
                                    : (<div className="flex items-center gap-0.5"><AppIcon name="Zap" className="w-3 h-3" style={{ color: getItemPointsColors(pointsAwarded).color }} /><span className="ml-0.5">+{pointsAwarded}</span></div>)}
                                </div>
                              </div>
                              {isContested && contestedReason && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Contestado: {contestedReason}</p>
                              )}
                              {item.description && !isContested && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>}
                              {completion && (
                                <div className="flex items-center gap-1 mt-1 text-[11px] text-muted-foreground flex-wrap">
                                  <AppIcon name="User" className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{completion.profile?.full_name || 'Usuário'} · {format(new Date(completion.completed_at), 'HH:mm')}</span>
                                  {isContested && <span className="text-amber-600 dark:text-amber-400">(contestado)</span>}
                                  {!isContested && !wasSkipped && !wasAwardedPoints && <span className="text-primary">(já pronto)</span>}
                                  {(() => { const count = getItemCompletionCount(item.id); return count > 1 ? <span className="text-primary">👥 {count}</span> : null; })()}
                                  {(completion as any)?.photo_url && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setViewingPhotoUrl((completion as any).photo_url); }}
                                      className="flex items-center gap-0.5 text-primary hover:underline"
                                    >
                                      <AppIcon name="Camera" className="w-3 h-3" />
                                      <span>foto</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </button>
                          {/* Inline panel for completed items (admin or own completion) */}
                          {(isAdmin || completion?.completed_by === currentUserId) && openPopover === item.id && !isContested && completion && (
                            <div className="mt-2 rounded-xl border bg-card p-4 shadow-lg animate-fade-in space-y-3">
                              {/* Desmarcar */}
                              {canToggle && (
                                <button
                                  onClick={() => {
                                    setOptimisticToggles(prev => { const next = new Set(prev); next.add(item.id); return next; });
                                    onToggleItem(item.id, 0);
                                    setOpenPopover(null);
                                  }}
                                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary text-left transition-all duration-200 active:scale-[0.97]"
                                >
                                  <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
                                    <AppIcon name="Undo2" className="w-5 h-5 text-muted-foreground" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-foreground">Desmarcar item</p>
                                    <p className="text-xs text-muted-foreground">Reverter a conclusão</p>
                                  </div>
                                </button>
                              )}
                              {/* Contestar — admin only */}
                              {isAdmin && !wasSkipped && (
                                <>
                                  <div className="border-t border-border" />
                                  {contestingItemId === item.id ? (
                                    <div className="space-y-2 animate-fade-in">
                                      <div className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
                                        <AppIcon name="AlertTriangle" className="w-4 h-4" />
                                        <span>Motivo da contestação</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="text"
                                          value={contestReason}
                                          onChange={(e) => setContestReason(e.target.value)}
                                          placeholder="Descreva o motivo..."
                                          className="flex-1 bg-transparent border border-amber-500/30 rounded-lg px-3 py-2 outline-none text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-amber-500/30"
                                          autoFocus
                                          onKeyDown={(e) => { if (e.key === 'Enter' && contestReason.trim()) handleContest(completion.id); if (e.key === 'Escape') { setContestingItemId(null); setContestReason(''); } }}
                                        />
                                        <button
                                          onClick={() => handleContest(completion.id)}
                                          disabled={!contestReason.trim() || contestLoading}
                                          className="p-2 rounded-lg bg-amber-500 text-white disabled:opacity-50 hover:bg-amber-600 transition-colors"
                                        >
                                          <AppIcon name="Send" className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => { setContestingItemId(null); setContestReason(''); }} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                                          <AppIcon name="X" className="w-4 h-4 text-muted-foreground" />
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => { setContestingItemId(item.id); setContestReason(''); }}
                                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 hover:bg-amber-500/10 text-left transition-all duration-200 border border-amber-500/20 active:scale-[0.97]"
                                    >
                                      <div className="w-10 h-10 bg-amber-500/15 rounded-xl flex items-center justify-center">
                                        <AppIcon name="AlertTriangle" className="w-5 h-5 text-amber-500" />
                                      </div>
                                      <div>
                                        <p className="font-semibold text-amber-600 dark:text-amber-400">Contestar</p>
                                        <p className="text-xs text-muted-foreground">Registrar que não foi feito</p>
                                      </div>
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div key={item.id}>
                        <button
                          disabled={!canToggle}
                          onClick={() => canToggle && setOpenPopover(openPopover === item.id ? null : item.id)}
                          className={cn(
                            "w-full flex items-start gap-4 p-4 rounded-xl transition-all duration-200",
                            !canToggle && "cursor-not-allowed opacity-80",
                            canToggle && "active:scale-[0.97] hover:shadow-md hover:border-primary/40",
                            "card-base border-2",
                            openPopover === item.id && "border-primary/50 shadow-md"
                          )}
                          style={{ animationDelay: `${itemIndex * 40}ms` }}
                        >
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border-2 border-muted-foreground/30 bg-background transition-all duration-300 hover:border-primary/50 hover:bg-primary/5" />
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-1.5">
                              <p className="font-medium text-foreground">{item.name}</p>
                              {(item as any).requires_photo && <AppIcon name="Camera" className="w-3.5 h-3.5 text-primary shrink-0" />}
                            </div>
                            {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                          </div>
                          {configuredPoints > 0 ? (
                            <div className={cn("flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shrink-0 border transition-all duration-200 animate-pulse")}
                              style={{
                                backgroundColor: getItemPointsColors(configuredPoints).bg,
                                color: getItemPointsColors(configuredPoints).color,
                                borderColor: getItemPointsColors(configuredPoints).border,
                                boxShadow: `0 0 12px ${getItemPointsColors(configuredPoints).glow}`,
                              }}>
                              <AppIcon name="Zap" className="w-3 h-3" />
                              <span>+{configuredPoints}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shrink-0 bg-muted text-muted-foreground"><span>sem pts</span></div>
                          )}
                        </button>
                        {openPopover === item.id && (
                          <div className="mt-2 rounded-xl border bg-card p-4 shadow-lg animate-fade-in space-y-3">
                            {isAdmin && profiles.length > 0 && (
                              <>
                                <button
                                  onClick={() => setExpandedPeopleFor(expandedPeopleFor === item.id ? null : item.id)}
                                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-primary/5 hover:bg-primary/10 text-left transition-all duration-200 border border-primary/20 active:scale-[0.97]"
                                >
                                  <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center">
                                    <AppIcon name="Users" className="w-5 h-5 text-primary" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-semibold text-foreground">Quem realizou?</p>
                                    <p className="text-xs text-muted-foreground">Selecione quem fez</p>
                                  </div>
                                  <AppIcon name="ChevronDown" className={cn("w-5 h-5 text-muted-foreground transition-transform duration-200", expandedPeopleFor === item.id && "rotate-180")} />
                                </button>
                                <div className={cn("overflow-hidden transition-all duration-300 ease-out", expandedPeopleFor === item.id ? "max-h-64 opacity-100" : "max-h-0 opacity-0")}>
                                  <div className="max-h-48 overflow-y-auto space-y-1 pt-1">
                                    {profiles.map((profile) => (
                                      <button key={profile.user_id} onClick={(e) => handleComplete(item.id, configuredPoints, configuredPoints, profile.user_id, e.currentTarget)}
                                        className={cn("w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all duration-200 text-sm",
                                          profile.user_id === currentUserId ? "bg-primary/10 hover:bg-primary/20 text-primary font-medium" : "hover:bg-secondary text-foreground")}>
                                        <AppIcon name="User" className="w-4 h-4 shrink-0" /><span className="truncate">{profile.full_name}</span>
                                        {profile.user_id === currentUserId && <span className="text-xs text-muted-foreground ml-auto">(eu)</span>}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div className="border-t border-border" />
                              </>
                            )}
                            {!isAdmin && (
                              <>
                                <button onClick={(e) => handleComplete(item.id, configuredPoints, configuredPoints, undefined, e.currentTarget)}
                                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-success/10 hover:bg-success/20 text-left transition-all duration-200 border-2 border-success/30 active:scale-[0.97]">
                                  <div className="w-10 h-10 bg-success rounded-xl flex items-center justify-center shadow-lg shadow-success/20"><AppIcon name="Check" className="w-5 h-5 text-success-foreground" /></div>
                                  <div className="flex-1"><p className="font-semibold text-success">Concluí agora</p>
                                    {configuredPoints > 0 ? (
                                      <div className="flex items-center gap-0.5 mt-0.5"><AppIcon name="Zap" className="w-3 h-3" style={{ color: getItemPointsColors(configuredPoints).color }} />
                                        <span className="text-xs font-bold ml-0.5" style={{ color: getItemPointsColors(configuredPoints).color }}>+{configuredPoints}</span></div>
                                    ) : (<span className="text-xs text-muted-foreground">Tarefa sem pontos</span>)}
                                  </div>
                                </button>
                                <div className="border-t border-border" />
                                <button onClick={(e) => handleComplete(item.id, 0, configuredPoints, undefined, e.currentTarget, true)}
                                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-destructive/5 hover:bg-destructive/10 text-left transition-all duration-200 border border-destructive/20 active:scale-[0.97]">
                                  <div className="w-10 h-10 bg-destructive/15 rounded-xl flex items-center justify-center"><AppIcon name="X" className="w-5 h-5 text-destructive" /></div>
                                  <div><p className="font-semibold text-destructive">Não concluído</p><p className="text-xs text-muted-foreground">Sem pontos</p></div>
                                </button>
                                {configuredPoints > 0 && (
                                  <>
                                    <div className="border-t border-border" />
                                    <button onClick={(e) => handleComplete(item.id, 0, configuredPoints, undefined, e.currentTarget)}
                                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary text-left transition-all duration-200 active:scale-[0.97]">
                                      <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center"><AppIcon name="RefreshCw" className="w-5 h-5 text-muted-foreground" /></div>
                                      <div><p className="font-semibold text-foreground">Já estava pronto</p><p className="text-xs text-muted-foreground">Sem pontos</p></div>
                                    </button>
                                  </>
                                )}
                              </>
                            )}
                            {isAdmin && configuredPoints > 0 && (
                              <button onClick={(e) => handleComplete(item.id, 0, configuredPoints, currentUserId, e.currentTarget)}
                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary text-left transition-all duration-200 active:scale-[0.97]">
                                <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center"><AppIcon name="RefreshCw" className="w-5 h-5 text-muted-foreground" /></div>
                                <div><p className="font-semibold text-foreground">Já estava pronto</p><p className="text-xs text-muted-foreground">Sem pontos (eu marquei)</p></div>
                              </button>
                            )}
                            {isAdmin && (
                              <>
                                <div className="border-t border-border" />
                                <button onClick={(e) => handleComplete(item.id, 0, configuredPoints, currentUserId, e.currentTarget, true)}
                                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-destructive/5 hover:bg-destructive/10 text-left transition-all duration-200 border border-destructive/20 active:scale-[0.97]">
                                  <div className="w-10 h-10 bg-destructive/15 rounded-xl flex items-center justify-center"><AppIcon name="X" className="w-5 h-5 text-destructive" /></div>
                                  <div><p className="font-semibold text-destructive">Não concluído</p><p className="text-xs text-muted-foreground">Sem pontos</p></div>
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* STANDARD: Sector > Subcategory > Items */
                sector.subcategories?.map((subcategory, subIndex) => {
                  const isSubExpanded = expandedSubcategories.has(subcategory.id);
                  const activeItems = subcategory.items?.filter(i => i.is_active && (i as any).checklist_type !== 'bonus') || [];
                  const completedItems = activeItems.filter(i => isItemCompletedOptimistic(i.id));
                  const subComplete = activeItems.length > 0 && completedItems.length === activeItems.length;

                  if (activeItems.length === 0) return null;

                  return (
                    <div key={subcategory.id} className="ml-2 space-y-1 mb-2 animate-fade-in" style={{ animationDelay: `${subIndex * 50}ms` }}>
                      <button onClick={() => toggleSubcategory(subcategory.id)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-300 border",
                          subComplete 
                            ? "border-success/20 bg-success/5" 
                            : "border-border/50 bg-card/50 hover:bg-card hover:border-border"
                        )}>
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            "w-6 h-6 rounded-md flex items-center justify-center transition-all duration-300",
                            subComplete ? "bg-success/15" : "bg-muted/50"
                          )}>
                            {subComplete 
                              ? <AppIcon name="Check" className="w-3.5 h-3.5 text-success animate-scale-in" /> 
                              : <AppIcon name="ChevronRight" className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform duration-300", isSubExpanded && "rotate-90")} />
                            }
                          </div>
                          <span className={cn("font-medium text-sm transition-colors duration-300", subComplete ? "text-success" : "text-foreground")}>{subcategory.name}</span>
                          <span className={cn(
                            "text-[11px] px-1.5 py-0.5 rounded-md font-medium",
                            subComplete ? "bg-success/10 text-success" : "bg-muted/50 text-muted-foreground"
                          )}>{completedItems.length}/{activeItems.length}</span>
                        </div>
                        <AppIcon name="ChevronDown" className={cn("w-4 h-4 text-muted-foreground transition-transform duration-300", isSubExpanded ? "rotate-0" : "-rotate-90")} />
                      </button>

                      <div className={cn("overflow-hidden transition-all duration-300 ease-out", isSubExpanded ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0")}>
                        <div className="ml-4 space-y-1.5 pt-1">
                          {activeItems.map((item, itemIndex) => {
                            const completed = isItemCompletedOptimistic(item.id);
                            const completion = completions.find(c => c.item_id === item.id);
                            const canToggle = canToggleItem(completion, completed);
                            const isLockedByOther = completed && !canToggle;
                            const wasAwardedPoints = completion?.awarded_points !== false;
                            const wasSkipped = completion?.is_skipped === true;
                            const pointsAwarded = completion?.points_awarded ?? item.points;
                            const configuredPoints = item.points ?? 1;
                            const isJustCompleted = recentlyCompleted.has(item.id);

                            if (completed) {
                              const isContested = (completion as any)?.is_contested === true;
                              const contestedReason = (completion as any)?.contested_reason;
                              
                              // Detect partial production completion
                              const csProgress = getCrossShiftItemProgress ? getCrossShiftItemProgress(item.id) : null;
                              const prodDone = csProgress?.totalDone || (completion as any)?.quantity_done || 0;
                              const prodTarget = csProgress?.targetQty || (item as any).target_quantity || 0;
                              const isPartialProduction = prodTarget > 0 && prodDone < prodTarget && !wasSkipped && !isContested;
                              
                              return (
                                <div key={item.id} className="space-y-1.5">
                                  <button
                                    onClick={() => {
                                      if (isContested) return;
                                      // Allow ANY user to interact with partial production items
                                      if (isPartialProduction) {
                                        setOpenPopover(openPopover === item.id ? null : item.id);
                                        setContestingItemId(null);
                                        setContestReason('');
                                        setSplittingItemId(null);
                                        return;
                                      }
                                      const isOwnCompletion = completion?.completed_by === currentUserId;
                                      if (isAdmin || isOwnCompletion) {
                                        setOpenPopover(openPopover === item.id ? null : item.id);
                                        setContestingItemId(null);
                                        setContestReason('');
                                        setSplittingItemId(null);
                                        return;
                                      }
                                      if (!canToggle) return;
                                      setOptimisticToggles(prev => { const next = new Set(prev); next.add(item.id); return next; });
                                      onToggleItem(item.id, 0);
                                    }}
                                    disabled={isContested ? true : isPartialProduction ? false : (isAdmin || completion?.completed_by === currentUserId) ? false : !canToggle}
                                    className={cn(
                                      "w-full flex items-start gap-3 p-3 rounded-xl transition-all duration-300",
                                      isContested
                                        ? "bg-gradient-to-r from-amber-500/15 to-amber-500/5 border-2 border-amber-500/30"
                                        : isPartialProduction
                                        ? "bg-gradient-to-r from-orange-500/15 to-orange-500/5 border-2 border-orange-500/30"
                                        : !canToggle && !isAdmin && "cursor-not-allowed opacity-80",
                                      !isContested && !isPartialProduction && (canToggle || isAdmin) && "active:scale-[0.97] hover:shadow-md",
                                      isPartialProduction && "active:scale-[0.97] hover:shadow-md",
                                      !isContested && !isPartialProduction && wasSkipped
                                        ? "bg-gradient-to-r from-destructive/15 to-destructive/5 border-2 border-destructive/30"
                                        : !isContested && !isPartialProduction && "bg-gradient-to-r from-success/15 to-success/5 border-2 border-success/30",
                                      isJustCompleted && "animate-scale-in",
                                      openPopover === item.id && !isContested && "ring-2 ring-primary/30"
                                    )}
                                    style={{ animationDelay: `${itemIndex * 40}ms` }}
                                  >
                                    <div className={cn(
                                      "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white shadow-md transition-all duration-300 mt-0.5",
                                      isContested ? "bg-amber-500 shadow-amber-500/30"
                                        : isPartialProduction ? "bg-orange-500 shadow-orange-500/30"
                                        : wasSkipped ? "bg-destructive shadow-destructive/30" : "bg-success shadow-success/30",
                                      isJustCompleted && "scale-125"
                                    )}>
                                      {isContested ? <AppIcon name="AlertTriangle" className="w-4 h-4" /> 
                                        : isPartialProduction ? <AppIcon name="Clock" className="w-4 h-4" />
                                        : wasSkipped ? <AppIcon name="X" className="w-4 h-4" /> 
                                        : <AppIcon name="Check" className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                          <p className={cn("font-medium text-sm leading-tight", 
                                            isPartialProduction ? "text-orange-500 dark:text-orange-400" 
                                            : isContested ? "text-amber-600 dark:text-amber-400" 
                                            : wasSkipped ? "text-destructive line-through" 
                                            : "text-success line-through"
                                          )}>{item.name}</p>
                                          {(item as any).piece_dimensions && (item as any).piece_dimensions !== item.name && (
                                            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">📐 {(item as any).piece_dimensions}</p>
                                          )}
                                        </div>
                                        <div className={cn(
                                          "flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 border transition-all duration-300",
                                          isPartialProduction ? "bg-orange-500/10 text-orange-500 dark:text-orange-400 border-orange-500/20"
                                            : isContested ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                            : wasSkipped ? "bg-destructive/10 text-destructive border-destructive/20"
                                            : !wasAwardedPoints ? "bg-primary/10 text-primary border-primary/20" : "border-border"
                                        )}
                                        style={!isPartialProduction && !isContested && !wasSkipped && wasAwardedPoints && pointsAwarded > 0 ? {
                                          backgroundColor: getItemPointsColors(pointsAwarded).bg,
                                          color: getItemPointsColors(pointsAwarded).color,
                                          borderColor: getItemPointsColors(pointsAwarded).border,
                                        } : undefined}>
                                          {isPartialProduction ? (<><AppIcon name="Clock" className="w-3 h-3" /><span>parcial ({prodDone}/{prodTarget})</span></>)
                                            : isContested ? (<><AppIcon name="AlertTriangle" className="w-3 h-3" /><span>contestado</span></>)
                                            : wasSkipped ? (<><AppIcon name="X" className="w-3 h-3" /><span>não concluído</span></>) 
                                            : !wasAwardedPoints ? (<><AppIcon name="RefreshCw" className="w-3 h-3" /><span>pronto</span></>) 
                                            : (<div className="flex items-center gap-0.5">
                                                {pointsAwarded > 0 && !isBonus && (() => {
                                                  const colors = getItemPointsColors(pointsAwarded);
                                                  return <AppIcon name="Star" className="w-3 h-3" style={{ color: colors.color, fill: colors.color }} />;
                                                })()}
                                                {isBonus && <AppIcon name="Zap" className="w-3 h-3" style={{ color: getItemPointsColors(pointsAwarded).color }} />}
                                                <span className="ml-0.5">+{pointsAwarded}</span>
                                              </div>)}
                                        </div>
                                      </div>
                                      {/* Production metrics row */}
                                      {(item as any).target_quantity > 0 && (() => {
                                        const cs = getCrossShiftItemProgress ? getCrossShiftItemProgress(item.id) : null;
                                        const done = cs?.totalDone || (completion as any)?.quantity_done || 0;
                                        const target = cs?.targetQty || (item as any).target_quantity;
                                        const startedAt = (completion as any)?.started_at;
                                        const finishedAt = (completion as any)?.finished_at;
                                        const duration = startedAt && finishedAt ? new Date(finishedAt).getTime() - new Date(startedAt).getTime() : null;
                                        const progressPct = target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0;
                                        return (
                                          <div className="mt-2 space-y-1.5">
                                            <div className="flex items-center gap-2 text-[11px] flex-wrap">
                                              <span className={cn("font-semibold", isPartialProduction ? "text-orange-500 dark:text-orange-400" : "text-success")}>
                                                {isPartialProduction ? `⏳ ${done}/${target} peças` : `✓ ${done}/${target} peças`}
                                              </span>
                                              {isPartialProduction && (
                                                <span className="text-orange-500/80 dark:text-orange-400/80">
                                                  ({target - done} restantes)
                                                </span>
                                              )}
                                              {duration && duration > 0 && (
                                                <span className="font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-muted/50">
                                                  ⏱ {formatDuration(duration)}
                                                </span>
                                              )}
                                            </div>
                                            <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                                              <div className={cn("h-full rounded-full transition-all duration-700", 
                                                progressPct >= 100 ? "bg-success" : isPartialProduction ? "bg-orange-500" : "bg-primary")}
                                                style={{ width: `${progressPct}%` }} />
                                            </div>
                                          </div>
                                        );
                                      })()}
                                      {isContested && contestedReason && (
                                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Contestado: {contestedReason}</p>
                                      )}
                                      {item.description && !isContested && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.description}</p>}
                                      {completion && (
                                        <div className="flex items-center gap-1 mt-1.5 text-[11px] text-muted-foreground flex-wrap">
                                          <AppIcon name="User" className="w-3 h-3 shrink-0" />
                                          <span className="truncate">{completion.profile?.full_name || 'Usuário'} · {format(new Date(completion.completed_at), 'HH:mm')}</span>
                                          {isContested && <span className="text-amber-600 dark:text-amber-400">(contestado)</span>}
                                          {!isContested && !wasSkipped && !wasAwardedPoints && <span className="text-primary">(já pronto)</span>}
                                          {(() => { const count = getItemCompletionCount(item.id); return count > 1 ? <span className="text-primary">👥 {count}</span> : null; })()}
                                          {(completion as any)?.photo_url && (
                                            <button
                                              onClick={(e) => { e.stopPropagation(); setViewingPhotoUrl((completion as any).photo_url); }}
                                              className="flex items-center gap-0.5 text-primary hover:underline"
                                            >
                                              <AppIcon name="Camera" className="w-3 h-3" />
                                              <span>foto</span>
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </button>
                                  {/* Inline panel for completed items (admin or own completion) */}
                                  {((isAdmin || completion?.completed_by === currentUserId || isPartialProduction) && openPopover === item.id && !isContested && completion) && (
                                    <div className="mt-2 rounded-xl border bg-card p-4 shadow-lg animate-fade-in space-y-3">
                                      {/* Continue production — available to ANY user for partial items */}
                                      {isPartialProduction && isTodayDate && completion?.completed_by !== currentUserId && (
                                        <>
                                          <button
                                            onClick={async () => {
                                              setStartingItemId(item.id);
                                              try {
                                                await onStartProduction(item.id, currentUserId);
                                                setOpenPopover(null);
                                              } catch (err: any) {
                                                toast.error(err.message || 'Erro ao iniciar');
                                              } finally {
                                                setStartingItemId(null);
                                              }
                                            }}
                                            disabled={startingItemId === item.id}
                                            className="w-full flex items-center gap-3 p-3 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-left transition-all duration-200 border-2 border-orange-500/30 active:scale-[0.97]"
                                          >
                                            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                                              <AppIcon name="Play" className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                              <p className="font-semibold text-orange-500 dark:text-orange-400">
                                                {startingItemId === item.id ? 'Iniciando...' : 'Continuar produção'}
                                              </p>
                                              <p className="text-xs text-muted-foreground">
                                                Faltam {prodTarget - prodDone} peças
                                              </p>
                                            </div>
                                          </button>
                                          <div className="border-t border-border" />
                                        </>
                                      )}
                                      {canToggle && (
                                        <button
                                          onClick={() => {
                                            setOptimisticToggles(prev => { const next = new Set(prev); next.add(item.id); return next; });
                                            onToggleItem(item.id, 0);
                                            setOpenPopover(null);
                                          }}
                                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary text-left transition-all duration-200 active:scale-[0.97]"
                                        >
                                          <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
                                            <AppIcon name="Undo2" className="w-5 h-5 text-muted-foreground" />
                                          </div>
                                          <div>
                                            <p className="font-semibold text-foreground">Desmarcar item</p>
                                            <p className="text-xs text-muted-foreground">Reverter a conclusão</p>
                                          </div>
                                        </button>
                                      )}
                                      {/* Update production quantity for industrial items */}
                                      {!wasSkipped && (item as any).target_quantity > 0 && onUpdateProductionQuantity && (completion as any)?.quantity_done != null && (
                                        <>
                                          <div className="border-t border-border" />
                                          {updatingQtyItemId === item.id ? (
                                            <div className="space-y-3 animate-fade-in">
                                               <div className="flex items-center gap-2 text-sm font-medium text-primary">
                                                <AppIcon name="Pencil" className="w-4 h-4" />
                                                <span>Atualizar quantidade ({(completion as any).quantity_done} atual, máx: {(item as any).target_quantity})</span>
                                              </div>
                                              <input
                                                type="number"
                                                inputMode="numeric"
                                                value={updateQtyValue}
                                                onChange={(e) => {
                                                  const val = e.target.value;
                                                  const num = parseInt(val) || 0;
                                                  const maxQty = (item as any).target_quantity || 0;
                                                  if (maxQty > 0 && num > maxQty) {
                                                    setUpdateQtyValue(String(maxQty));
                                                  } else {
                                                    setUpdateQtyValue(val);
                                                  }
                                                }}
                                                max={(item as any).target_quantity || undefined}
                                                placeholder={`Ex: ${Math.min((completion as any).quantity_done + 5, (item as any).target_quantity || 999)}`}
                                                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-lg font-bold outline-none text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter') {
                                                    let qty = parseInt(updateQtyValue) || 0;
                                                    const maxQty = (item as any).target_quantity || 0;
                                                    if (maxQty > 0 && qty > maxQty) qty = maxQty;
                                                    if (qty > 0) {
                                                      setUpdateQtyLoading(true);
                                                      onUpdateProductionQuantity(completion.id, qty)
                                                        .then(() => { setUpdatingQtyItemId(null); setUpdateQtyValue(''); toast.success('Quantidade atualizada!'); })
                                                        .catch((err: any) => toast.error(err.message))
                                                        .finally(() => setUpdateQtyLoading(false));
                                                    }
                                                  }
                                                  if (e.key === 'Escape') { setUpdatingQtyItemId(null); setUpdateQtyValue(''); }
                                                }}
                                              />
                                              <div className="flex gap-2">
                                                <button
                                                  onClick={() => {
                                                    let qty = parseInt(updateQtyValue) || 0;
                                                    if (qty <= 0) { toast.error('Informe a quantidade'); return; }
                                                    const maxQty = (item as any).target_quantity || 0;
                                                    if (maxQty > 0 && qty > maxQty) qty = maxQty;
                                                    onUpdateProductionQuantity(completion.id, qty)
                                                      .then(() => { setUpdatingQtyItemId(null); setUpdateQtyValue(''); toast.success('Quantidade atualizada!'); })
                                                      .catch((err: any) => toast.error(err.message))
                                                      .finally(() => setUpdateQtyLoading(false));
                                                  }}
                                                  disabled={updateQtyLoading || !updateQtyValue}
                                                  className="flex-1 p-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50 hover:bg-primary/90 transition-colors"
                                                >
                                                  {updateQtyLoading ? 'Salvando...' : '✓ Confirmar'}
                                                </button>
                                                <button
                                                  onClick={() => { setUpdatingQtyItemId(null); setUpdateQtyValue(''); }}
                                                  className="p-3 rounded-xl hover:bg-secondary transition-colors"
                                                >
                                                  <AppIcon name="X" className="w-5 h-5 text-muted-foreground" />
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            <button
                                              onClick={() => { setUpdatingQtyItemId(item.id); setUpdateQtyValue(String((completion as any).quantity_done || '')); }}
                                              className="w-full flex items-center gap-3 p-3 rounded-xl bg-primary/5 hover:bg-primary/10 text-left transition-all duration-200 border border-primary/20 active:scale-[0.97]"
                                            >
                                              <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center">
                                                <AppIcon name="Pencil" className="w-5 h-5 text-primary" />
                                              </div>
                                              <div>
                                                <p className="font-semibold text-primary">Atualizar produção</p>
                                                <p className="text-xs text-muted-foreground">Alterar quantidade produzida</p>
                                              </div>
                                            </button>
                                          )}
                                        </>
                                      )}
                                      {isAdmin && !wasSkipped && (
                                        <>
                                          <div className="border-t border-border" />
                                          {contestingItemId === item.id ? (
                                            <div className="space-y-2 animate-fade-in">
                                              <div className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
                                                <AppIcon name="AlertTriangle" className="w-4 h-4" />
                                                <span>Motivo da contestação</span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <input
                                                  type="text"
                                                  value={contestReason}
                                                  onChange={(e) => setContestReason(e.target.value)}
                                                  placeholder="Descreva o motivo..."
                                                  className="flex-1 bg-transparent border border-amber-500/30 rounded-lg px-3 py-2 outline-none text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-amber-500/30"
                                                  autoFocus
                                                  onKeyDown={(e) => { if (e.key === 'Enter' && contestReason.trim()) handleContest(completion.id); if (e.key === 'Escape') { setContestingItemId(null); setContestReason(''); } }}
                                                />
                                                <button
                                                  onClick={() => handleContest(completion.id)}
                                                  disabled={!contestReason.trim() || contestLoading}
                                                  className="p-2 rounded-lg bg-amber-500 text-white disabled:opacity-50 hover:bg-amber-600 transition-colors"
                                                >
                                                  <AppIcon name="Send" className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => { setContestingItemId(null); setContestReason(''); }} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                                                  <AppIcon name="X" className="w-4 h-4 text-muted-foreground" />
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            <button
                                              onClick={() => { setContestingItemId(item.id); setContestReason(''); }}
                                              className="w-full flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 hover:bg-amber-500/10 text-left transition-all duration-200 border border-amber-500/20 active:scale-[0.97]"
                                            >
                                              <div className="w-10 h-10 bg-amber-500/15 rounded-xl flex items-center justify-center">
                                                <AppIcon name="AlertTriangle" className="w-5 h-5 text-amber-500" />
                                              </div>
                                              <div>
                                                <p className="font-semibold text-amber-600 dark:text-amber-400">Contestar</p>
                                                <p className="text-xs text-muted-foreground">Registrar que não foi feito</p>
                                              </div>
                                            </button>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            }

                            // Industrial: calculate quantity progress (cross-shift)
                            const crossShift = getCrossShiftItemProgress ? getCrossShiftItemProgress(item.id) : null;
                            const targetQty = crossShift?.targetQty || (item as any).target_quantity || 0;
                            const dimensions = (item as any).piece_dimensions || '';
                            const totalDone = crossShift?.totalDone || completions.filter(c => c.item_id === item.id && !c.is_skipped).reduce((sum, c) => sum + ((c as any).quantity_done || 0), 0);
                            const remaining = crossShift?.remaining ?? Math.max(0, targetQty - totalDone);
                            const hasIndustrialData = targetQty > 0;
                            const progressPercent = targetQty > 0 ? Math.min(100, Math.round((totalDone / targetQty) * 100)) : 0;

                            // Check if item is in_progress
                            const itemStatus = getItemStatus(item.id);
                            const isInProgress = itemStatus === 'in_progress';
                            const inProgressCompletion = isInProgress ? completions.find(c => c.item_id === item.id) : null;

                            // ── IN PROGRESS STATE ──
                            if (isInProgress) {
                              return (
                                <div key={item.id} className="space-y-2">
                                  <div
                                    className={cn(
                                      "w-full flex flex-col gap-3 p-4 rounded-xl transition-all duration-300",
                                      "bg-gradient-to-r from-amber-500/15 to-amber-500/5 border-2 border-amber-500/40",
                                      "shadow-[0_0_16px_rgba(245,158,11,0.15)]"
                                    )}
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-amber-500 shadow-md shadow-amber-500/30">
                                        <AppIcon name="Play" className="w-4 h-4 text-white" />
                                      </div>
                                      <div className="flex-1 text-left">
                                        <div className="flex items-center gap-1.5">
                                          <p className="font-semibold text-amber-600 dark:text-amber-400">{item.name}</p>
                                        </div>
                                        {dimensions && dimensions !== item.name && <p className="text-xs text-primary font-mono mt-0.5">📐 {dimensions}</p>}
                                        {item.description && <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>}
                                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse">
                                            ⚙️ Em Produção
                                          </span>
                                          {inProgressCompletion && (
                                            <span className="text-[11px] text-muted-foreground">
                                              por {profiles.find(p => p.user_id === inProgressCompletion.completed_by)?.full_name || 'Usuário'} · {format(new Date(inProgressCompletion.completed_at), 'HH:mm')}
                                            </span>
                                          )}
                                          {/* Live timer */}
                                          {(() => {
                                            const startedAt = (inProgressCompletion as any)?.started_at;
                                            if (!startedAt) return null;
                                            const elapsed = Date.now() - new Date(startedAt).getTime();
                                            return (
                                              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                                ⏱ {formatDuration(elapsed)}
                                              </span>
                                            );
                                          })()}
                                        </div>
                                      </div>
                                      {configuredPoints > 0 && (
                                        <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shrink-0 border"
                                          style={{
                                            backgroundColor: getItemPointsColors(configuredPoints).bg,
                                            color: getItemPointsColors(configuredPoints).color,
                                            borderColor: getItemPointsColors(configuredPoints).border,
                                          }}>
                                          <AppIcon name="Star" className="w-3 h-3" style={{ color: getItemPointsColors(configuredPoints).color, fill: getItemPointsColors(configuredPoints).color }} />
                                          <span>+{configuredPoints}</span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Industrial progress bar */}
                                    {hasIndustrialData && (
                                      <div className="w-full space-y-1 pl-11">
                                        <div className="flex items-center justify-between text-[11px]">
                                          <span className="text-muted-foreground">{totalDone}/{targetQty} feitas</span>
                                          <span className={cn("font-bold", remaining === 0 ? "text-success" : "text-muted-foreground")}>
                                            {remaining > 0 ? `${remaining} restantes` : '✓ Completo'}
                                          </span>
                                        </div>
                                        <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                                          <div className={cn("h-full rounded-full transition-all duration-700 ease-out", progressPercent === 100 ? "bg-success" : progressPercent > 50 ? "bg-primary" : "bg-amber-500")}
                                            style={{ width: `${progressPercent}%` }} />
                                        </div>
                                      </div>
                                    )}

                                    {/* Finish production section */}
                                    {finishingItemId === item.id ? (
                                      <div className="space-y-3 pt-2 pl-11 animate-fade-in">
                                        <div className="flex items-center gap-2 text-sm font-medium text-success">
                                          <AppIcon name="CheckCircle" className="w-4 h-4" />
                                          <span>Finalizar produção</span>
                                        </div>
                                        <div>
                                          <label className="text-xs text-muted-foreground mb-1 block">
                                            Quantidade produzida {remaining > 0 && <span className="text-primary">(máx: {remaining})</span>}
                                          </label>
                                          <input
                                            type="number"
                                            inputMode="numeric"
                                            value={finishQuantity}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              const num = parseInt(val) || 0;
                                              if (remaining > 0 && num > remaining) {
                                                setFinishQuantity(String(remaining));
                                              } else {
                                                setFinishQuantity(val);
                                              }
                                            }}
                                            max={remaining > 0 ? remaining : undefined}
                                            placeholder={`Ex: ${Math.min(25, remaining > 0 ? remaining : 25)}`}
                                            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-lg font-bold outline-none text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-success/40"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                let qty = parseInt(finishQuantity) || 0;
                                                if (remaining > 0 && qty > remaining) qty = remaining;
                                                if (qty > 0) {
                                                  setFinishLoading(true);
                                                  onFinishProduction(item.id, qty, configuredPoints, inProgressCompletion?.completed_by)
                                                    .then(() => { setFinishingItemId(null); setFinishQuantity(''); })
                                                    .catch((err: any) => toast.error(err.message))
                                                    .finally(() => setFinishLoading(false));
                                                }
                                              }
                                              if (e.key === 'Escape') { setFinishingItemId(null); setFinishQuantity(''); }
                                            }}
                                          />
                                        </div>
                                        <div className="flex gap-2">
                                          <button
                                            onClick={() => {
                                              let qty = parseInt(finishQuantity) || 0;
                                              if (qty <= 0) { toast.error('Informe a quantidade'); return; }
                                              if (remaining > 0 && qty > remaining) qty = remaining;
                                              setFinishLoading(true);
                                              onFinishProduction(item.id, qty, configuredPoints, inProgressCompletion?.completed_by)
                                                .then(() => { setFinishingItemId(null); setFinishQuantity(''); })
                                                .catch((err: any) => toast.error(err.message))
                                                .finally(() => setFinishLoading(false));
                                            }}
                                            disabled={finishLoading || !finishQuantity}
                                            className="flex-1 p-3 rounded-xl bg-success text-success-foreground text-sm font-bold disabled:opacity-50 hover:bg-success/90 transition-colors shadow-lg shadow-success/20"
                                          >
                                            {finishLoading ? 'Finalizando...' : '✓ Confirmar'}
                                          </button>
                                          <button
                                            onClick={() => { setFinishingItemId(null); setFinishQuantity(''); }}
                                            className="p-3 rounded-xl hover:bg-secondary transition-colors"
                                          >
                                            <AppIcon name="X" className="w-5 h-5 text-muted-foreground" />
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex gap-2 pt-1 pl-11">
                                        <button
                                          onClick={() => { setFinishingItemId(item.id); setFinishQuantity(''); setOpenPopover(null); }}
                                          className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-success/15 hover:bg-success/25 text-success font-semibold text-sm transition-all duration-200 border border-success/30 active:scale-[0.97]"
                                        >
                                          <AppIcon name="CheckCircle" className="w-5 h-5" />
                                          Finalizar Produção
                                        </button>
                                        {(isAdmin || inProgressCompletion?.completed_by === currentUserId) && (
                                          <button
                                            onClick={() => {
                                              // Cancel production = delete the completion
                                              onToggleItem(item.id, 0);
                                              setOpenPopover(null);
                                            }}
                                            className="p-3 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors border border-destructive/20"
                                            title="Cancelar produção"
                                          >
                                            <AppIcon name="X" className="w-5 h-5" />
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            }

                            // ── PENDING STATE (not started) ──
                            return (
                              <div key={item.id}>
                                <button
                                  disabled={!canToggle}
                                  onClick={() => canToggle && setOpenPopover(openPopover === item.id ? null : item.id)}
                                  className={cn(
                                    "w-full flex flex-col gap-2 p-3 rounded-xl transition-all duration-200",
                                    !canToggle && "cursor-not-allowed opacity-80",
                                    canToggle && "active:scale-[0.97] hover:shadow-md hover:border-primary/40",
                                    "card-base border-2",
                                    openPopover === item.id && "border-primary/50 shadow-md"
                                  )}
                                  style={{ animationDelay: `${itemIndex * 40}ms` }}
                                >
                                  <div className="flex items-start gap-3 w-full">
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border-2 border-muted-foreground/30 bg-background transition-all duration-300 hover:border-primary/50 hover:bg-primary/5 mt-0.5" />
                                    <div className="flex-1 text-left">
                                      <div className="flex items-center gap-1.5">
                                        <p className="font-medium text-foreground">{item.name}</p>
                                        {(item as any).requires_photo && <AppIcon name="Camera" className="w-3.5 h-3.5 text-primary shrink-0" />}
                                      </div>
                                      {dimensions && dimensions !== item.name && <p className="text-xs text-primary font-mono mt-0.5">📐 {dimensions}</p>}
                                      {item.description && <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>}
                                    </div>
                                    {configuredPoints > 0 ? (
                                      <div className={cn("flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shrink-0 border transition-all duration-200", isBonus && "animate-pulse")}
                                        style={{
                                          backgroundColor: getItemPointsColors(configuredPoints).bg,
                                          color: getItemPointsColors(configuredPoints).color,
                                          borderColor: getItemPointsColors(configuredPoints).border,
                                          boxShadow: isBonus ? `0 0 12px ${getItemPointsColors(configuredPoints).glow}` : undefined,
                                        }}>
                                        {isBonus ? <AppIcon name="Zap" className="w-3 h-3" /> : <AppIcon name="Star" className="w-3 h-3" style={{ color: getItemPointsColors(configuredPoints).color, fill: getItemPointsColors(configuredPoints).color }} />}
                                        <span>+{configuredPoints}</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shrink-0 bg-muted text-muted-foreground"><span>sem pts</span></div>
                                    )}
                                  </div>
                                  {/* Industrial progress bar */}
                                  {hasIndustrialData && (
                                    <div className="w-full space-y-1 pl-11">
                                      <div className="flex items-center justify-between text-[11px]">
                                        <span className="text-muted-foreground">{totalDone}/{targetQty} feitas</span>
                                        <span className={cn("font-bold", remaining === 0 ? "text-success" : remaining <= targetQty * 0.3 ? "text-primary" : "text-muted-foreground")}>
                                          {remaining > 0 ? `${remaining} restantes` : '✓ Completo'}
                                        </span>
                                      </div>
                                      <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                                        <div className={cn("h-full rounded-full transition-all duration-700 ease-out", progressPercent === 100 ? "bg-success" : progressPercent > 50 ? "bg-primary" : "bg-amber-500")}
                                          style={{ width: `${progressPercent}%` }} />
                                      </div>
                                    </div>
                                  )}
                                </button>
                                {openPopover === item.id && (
                                  <div className="mt-2 rounded-xl border bg-card p-4 shadow-lg animate-fade-in space-y-3">
                                    {/* Iniciar Produção — primary action */}
                                    {isAdmin && profiles.length > 0 ? (
                                      <>
                                        {/* Admin: select who starts */}
                                        <button
                                          onClick={() => setExpandedPeopleFor(expandedPeopleFor === item.id ? null : item.id)}
                                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 text-left transition-all duration-200 border border-amber-500/30 active:scale-[0.97]"
                                        >
                                          <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                                            <AppIcon name="Play" className="w-5 h-5 text-amber-500" />
                                          </div>
                                          <div className="flex-1">
                                            <p className="font-semibold text-amber-600 dark:text-amber-400">Iniciar Produção</p>
                                            <p className="text-xs text-muted-foreground">Selecione quem vai produzir</p>
                                          </div>
                                          <AppIcon name="ChevronDown" className={cn("w-5 h-5 text-muted-foreground transition-transform duration-200", expandedPeopleFor === item.id && "rotate-180")} />
                                        </button>
                                        <div className={cn("overflow-hidden transition-all duration-300 ease-out", expandedPeopleFor === item.id ? "max-h-64 opacity-100" : "max-h-0 opacity-0")}>
                                          <div className="max-h-48 overflow-y-auto space-y-1 pt-1">
                                            {profiles.map((profile) => (
                                              <button key={profile.user_id}
                                                onClick={async () => {
                                                  setStartingItemId(item.id);
                                                  try {
                                                    await onStartProduction(item.id, profile.user_id);
                                                    setOpenPopover(null);
                                                    setExpandedPeopleFor(null);
                                                  } catch (err: any) {
                                                    toast.error(err.message);
                                                  } finally {
                                                    setStartingItemId(null);
                                                  }
                                                }}
                                                disabled={startingItemId === item.id}
                                                className={cn("w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all duration-200 text-sm",
                                                  profile.user_id === currentUserId ? "bg-primary/10 hover:bg-primary/20 text-primary font-medium" : "hover:bg-secondary text-foreground")}>
                                                <AppIcon name="User" className="w-4 h-4 shrink-0" />
                                                <span className="truncate">{profile.full_name}</span>
                                                {profile.user_id === currentUserId && <span className="text-xs text-muted-foreground ml-auto">(eu)</span>}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                        <div className="border-t border-border" />
                                      </>
                                    ) : (
                                      <>
                                        {/* Employee: start production directly */}
                                        <button
                                          onClick={async () => {
                                            setStartingItemId(item.id);
                                            try {
                                              await onStartProduction(item.id);
                                              setOpenPopover(null);
                                            } catch (err: any) {
                                              toast.error(err.message);
                                            } finally {
                                              setStartingItemId(null);
                                            }
                                          }}
                                          disabled={startingItemId === item.id}
                                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-left transition-all duration-200 border-2 border-amber-500/30 active:scale-[0.97]"
                                        >
                                          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                                            <AppIcon name="Play" className="w-5 h-5 text-white" />
                                          </div>
                                          <div className="flex-1">
                                            <p className="font-semibold text-amber-600 dark:text-amber-400">
                                              {startingItemId === item.id ? 'Iniciando...' : 'Iniciar Produção'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Marcar que comecei esta tarefa</p>
                                          </div>
                                        </button>
                                        <div className="border-t border-border" />
                                      </>
                                    )}

                                    {/* Quick complete — only for non-industrial (simple) tasks */}
                                    {!hasIndustrialData && (
                                      <button onClick={(e) => handleComplete(item.id, configuredPoints, configuredPoints, isAdmin ? currentUserId : undefined, e.currentTarget)}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-success/10 hover:bg-success/20 text-left transition-all duration-200 border border-success/30 active:scale-[0.97]">
                                        <div className="w-10 h-10 bg-success rounded-xl flex items-center justify-center shadow-lg shadow-success/20"><AppIcon name="Check" className="w-5 h-5 text-success-foreground" /></div>
                                        <div className="flex-1"><p className="font-semibold text-success">Concluir direto</p>
                                          <p className="text-xs text-muted-foreground">Já terminei (sem iniciar)</p>
                                        </div>
                                      </button>
                                    )}

                                    <div className="border-t border-border" />
                                    <button onClick={(e) => handleComplete(item.id, 0, configuredPoints, isAdmin ? currentUserId : undefined, e.currentTarget, true)}
                                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-destructive/5 hover:bg-destructive/10 text-left transition-all duration-200 border border-destructive/20 active:scale-[0.97]">
                                      <div className="w-10 h-10 bg-destructive/15 rounded-xl flex items-center justify-center"><AppIcon name="X" className="w-5 h-5 text-destructive" /></div>
                                      <div><p className="font-semibold text-destructive">Não concluído</p><p className="text-xs text-muted-foreground">Sem pontos</p></div>
                                    </button>

                                    {/* "Já estava pronto" — only for non-industrial (simple) tasks */}
                                    {!hasIndustrialData && configuredPoints > 0 && (
                                      <>
                                        <div className="border-t border-border" />
                                        <button onClick={(e) => handleComplete(item.id, 0, configuredPoints, isAdmin ? currentUserId : undefined, e.currentTarget)}
                                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary text-left transition-all duration-200 active:scale-[0.97]">
                                          <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center"><AppIcon name="RefreshCw" className="w-5 h-5 text-muted-foreground" /></div>
                                          <div><p className="font-semibold text-foreground">Já estava pronto</p><p className="text-xs text-muted-foreground">Sem pontos</p></div>
                                        </button>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}

      {sectors.length === 0 && (
        <div className="text-center py-12 text-muted-foreground animate-fade-in">
          <AppIcon name="Folder" size={48} fill={0} className="mx-auto mb-3 opacity-50" />
          <p className="font-medium">Nenhum setor configurado</p>
          <p className="text-sm mt-1">Adicione setores nas configurações</p>
        </div>
      )}

      {/* Photo Capture Sheet */}
      <Sheet open={photoSheetOpen} onOpenChange={(open) => {
        if (!open) { setPhotoSheetOpen(false); setPendingPhotoAction(null); setPhotoPreview(null); setPhotoFile(null); }
      }}>
        <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-8">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <AppIcon name="Camera" className="w-5 h-5 text-primary" />
              Foto de confirmação
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Esta tarefa exige uma foto de confirmação. Tire uma foto ou selecione da galeria.
            </p>
            {photoPreview ? (
              <div className="relative">
                <img src={photoPreview} alt="Preview" className="w-full max-h-64 object-cover rounded-xl border" />
                <button
                  onClick={() => { setPhotoPreview(null); setPhotoFile(null); }}
                  className="absolute top-2 right-2 w-8 h-8 bg-background/80 backdrop-blur rounded-full flex items-center justify-center"
                >
                  <AppIcon name="X" className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors">
                <AppIcon name="Camera" className="w-10 h-10 text-primary" />
                <span className="text-sm font-medium text-primary">Tirar foto ou escolher</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoCapture}
                />
              </label>
            )}
            <Button
              onClick={handlePhotoConfirm}
              disabled={!photoFile || photoUploading}
              className="w-full h-12"
            >
              {photoUploading ? 'Enviando...' : 'Confirmar e concluir'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Photo Viewer */}
      <Sheet open={!!viewingPhotoUrl} onOpenChange={(open) => { if (!open) setViewingPhotoUrl(null); }}>
        <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-8">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <AppIcon name="Image" className="w-5 h-5 text-primary" />
              Foto de confirmação
            </SheetTitle>
          </SheetHeader>
          {viewingPhotoUrl && (
            <img src={viewingPhotoUrl} alt="Foto de confirmação" className="w-full max-h-[70vh] object-contain rounded-xl" />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
