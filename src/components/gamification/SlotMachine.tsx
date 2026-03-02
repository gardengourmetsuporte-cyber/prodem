import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { GamificationPrize } from '@/hooks/useGamification';
import { weightedRandom } from '@/hooks/useGamification';

interface SlotMachineProps {
  prizes: GamificationPrize[];
  onResult: (prize: GamificationPrize) => void;
  disabled?: boolean;
}

const SYMBOL_HEIGHT = 80; // px per symbol cell
const VISIBLE_ROWS = 3;
const REEL_REPEATS = 12; // how many times the symbol strip is repeated for long scroll
const SPIN_DURATIONS = [1500, 2500, 3500]; // ms per reel

export function SlotMachine({ prizes, onResult, disabled }: SlotMachineProps) {
  const [spinning, setSpinning] = useState(false);
  const [reelOffsets, setReelOffsets] = useState([0, 0, 0]);
  const [transitioning, setTransitioning] = useState([false, false, false]);
  const stoppedCount = useRef(0);
  const winnerRef = useRef<GamificationPrize | null>(null);

  // Build the symbol strip: all prize icons repeated
  const symbols = useMemo(() => {
    if (prizes.length === 0) return [];
    const icons = prizes.map(p => p.icon);
    const strip: string[] = [];
    for (let i = 0; i < REEL_REPEATS; i++) {
      strip.push(...icons);
    }
    return strip;
  }, [prizes]);

  const totalSymbols = symbols.length;

  // Get icons for "lose" scenario — pick 3 different icons
  const getLoseIcons = useCallback(() => {
    if (prizes.length < 2) return [0, 0, 0];
    const indices: number[] = [];
    const available = prizes.map((_, i) => i);
    for (let r = 0; r < 3; r++) {
      // pick randomly but try to make them different
      let pick: number;
      if (r === 0) {
        pick = available[Math.floor(Math.random() * available.length)];
      } else {
        const diff = available.filter(i => !indices.includes(i));
        pick = diff.length > 0
          ? diff[Math.floor(Math.random() * diff.length)]
          : available[Math.floor(Math.random() * available.length)];
      }
      indices.push(pick);
    }
    return indices;
  }, [prizes]);

  const spin = useCallback(() => {
    if (spinning || disabled || prizes.length === 0) return;

    const winner = weightedRandom(prizes);
    winnerRef.current = winner;
    stoppedCount.current = 0;

    setSpinning(true);

    const isWin = winner.type !== 'empty';
    const winnerIndex = prizes.findIndex(p => p.id === winner.id);
    const loseIndices = !isWin ? getLoseIcons() : [0, 0, 0];

    // For each reel, calculate the final offset to land the target symbol on the payline (middle row)
    const newOffsets = [0, 1, 2].map((reelIdx) => {
      const targetPrizeIndex = isWin ? winnerIndex : loseIndices[reelIdx];
      // We want to scroll many full cycles + land on the target
      const baseCycles = (8 + reelIdx * 2) * prizes.length; // more cycles for later reels
      const finalIndex = baseCycles + targetPrizeIndex;
      // The payline is the middle row, so offset = finalIndex * SYMBOL_HEIGHT
      return finalIndex * SYMBOL_HEIGHT;
    });

    // Start all reels spinning (remove transition first for instant reset position)
    setTransitioning([false, false, false]);
    setReelOffsets([0, 0, 0]);

    // Use requestAnimationFrame to ensure the reset is painted, then set targets with transition
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTransitioning([true, true, true]);
        setReelOffsets(newOffsets);
      });
    });
  }, [spinning, disabled, prizes, getLoseIcons]);

  // Handle reel stop events via transitionend
  const handleReelStop = useCallback((reelIndex: number) => {
    stoppedCount.current += 1;
    if (stoppedCount.current >= 3) {
      setSpinning(false);
      if (winnerRef.current) {
        onResult(winnerRef.current);
      }
    }
  }, [onResult]);

  if (prizes.length === 0) {
    return (
      <div className="flex items-center justify-center w-72 h-72 rounded-2xl bg-muted">
        <p className="text-muted-foreground text-sm">Nenhum prêmio configurado</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Machine frame */}
      <div
        className="relative rounded-2xl p-1"
        style={{
          background: 'linear-gradient(145deg, #d4a017, #b8860b, #d4a017)',
          boxShadow: '0 0 30px rgba(212, 160, 23, 0.4), inset 0 0 20px rgba(0,0,0,0.3)',
        }}
      >
        {/* Inner frame */}
        <div
          className="rounded-xl p-3"
          style={{
            background: 'linear-gradient(180deg, #8b0000, #5c0000, #3a0000)',
          }}
        >
          {/* Top decoration */}
          <div className="text-center mb-2">
            <span className="text-2xl font-black tracking-widest" style={{
              background: 'linear-gradient(180deg, #ffd700, #ffaa00)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: 'none',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
            }}>
              🎰 JACKPOT 🎰
            </span>
          </div>

          {/* Reels container */}
          <div className="relative">
            {/* Payline indicator left */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 z-20 -ml-1">
              <div className="w-2 h-2 rounded-full" style={{ background: '#ffd700', boxShadow: '0 0 8px #ffd700' }} />
            </div>
            {/* Payline indicator right */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 z-20 -mr-1">
              <div className="w-2 h-2 rounded-full" style={{ background: '#ffd700', boxShadow: '0 0 8px #ffd700' }} />
            </div>

            {/* Payline glow */}
            <div
              className="absolute left-0 right-0 z-10 pointer-events-none"
              style={{
                top: `${SYMBOL_HEIGHT}px`,
                height: `${SYMBOL_HEIGHT}px`,
                background: 'linear-gradient(180deg, transparent, rgba(255, 215, 0, 0.15), transparent)',
                borderTop: '2px solid rgba(255, 215, 0, 0.6)',
                borderBottom: '2px solid rgba(255, 215, 0, 0.6)',
              }}
            />

            {/* Top/bottom fade overlays */}
            <div
              className="absolute top-0 left-0 right-0 z-10 pointer-events-none rounded-t-lg"
              style={{
                height: `${SYMBOL_HEIGHT}px`,
                background: 'linear-gradient(180deg, rgba(90,0,0,0.85), transparent)',
              }}
            />
            <div
              className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none rounded-b-lg"
              style={{
                height: `${SYMBOL_HEIGHT}px`,
                background: 'linear-gradient(0deg, rgba(90,0,0,0.85), transparent)',
              }}
            />

            {/* Reels */}
            <div
              className="flex gap-1 rounded-lg overflow-hidden"
              style={{
                height: `${VISIBLE_ROWS * SYMBOL_HEIGHT}px`,
                background: 'linear-gradient(180deg, #1a0000, #2a0000)',
                border: '2px solid rgba(212, 160, 23, 0.4)',
              }}
            >
              {[0, 1, 2].map(reelIdx => (
                <Reel
                  key={reelIdx}
                  symbols={symbols}
                  prizes={prizes}
                  offset={reelOffsets[reelIdx]}
                  transitioning={transitioning[reelIdx]}
                  duration={SPIN_DURATIONS[reelIdx]}
                  reelIndex={reelIdx}
                  onStop={handleReelStop}
                />
              ))}
            </div>
          </div>

          {/* Bottom decoration */}
          <div className="flex justify-center gap-2 mt-2">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="w-3 h-3 rounded-full"
                style={{
                  background: spinning
                    ? `hsl(${(Date.now() / 10 + i * 120) % 360}, 100%, 50%)`
                    : '#ffd700',
                  boxShadow: '0 0 6px rgba(255, 215, 0, 0.5)',
                  transition: 'background 0.3s',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Spin button */}
      <button
        onClick={spin}
        disabled={spinning || disabled}
        className="relative px-10 py-4 rounded-full font-black text-xl uppercase tracking-wider text-white disabled:opacity-50 transition-all active:scale-95 hover:scale-105"
        style={{
          background: spinning
            ? 'linear-gradient(180deg, #666, #444)'
            : 'linear-gradient(180deg, hsl(25, 85%, 54%), hsl(25, 85%, 44%), hsl(25, 85%, 34%))',
          boxShadow: spinning
            ? '0 4px 15px rgba(0,0,0,0.3)'
            : '0 4px 20px hsla(25, 85%, 54%, 0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
        }}
      >
        {spinning ? '⏳ GIRANDO...' : '🎰 GIRAR'}
      </button>
    </div>
  );
}

/* ─── Single Reel ─── */

interface ReelProps {
  symbols: string[];
  prizes: GamificationPrize[];
  offset: number;
  transitioning: boolean;
  duration: number;
  reelIndex: number;
  onStop: (reelIndex: number) => void;
}

function Reel({ symbols, prizes, offset, transitioning, duration, reelIndex, onStop }: ReelProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const firedRef = useRef(false);

  // Reset fired flag when offset changes to 0 (new spin starting)
  useEffect(() => {
    if (offset === 0) {
      firedRef.current = false;
    }
  }, [offset]);

  const handleTransitionEnd = useCallback(() => {
    if (!firedRef.current) {
      firedRef.current = true;
      onStop(reelIndex);
    }
  }, [onStop, reelIndex]);

  // Build the visual strip with 1 extra symbol on each side for smooth display
  const displaySymbols = useMemo(() => {
    if (symbols.length === 0) return [];
    // We need enough symbols to cover the full scroll distance
    // Add extra at the end for the visible window
    return [...symbols, ...symbols.slice(0, VISIBLE_ROWS)];
  }, [symbols]);

  return (
    <div
      className="flex-1 overflow-hidden relative"
      style={{
        height: `${VISIBLE_ROWS * SYMBOL_HEIGHT}px`,
        borderRight: reelIndex < 2 ? '1px solid rgba(212, 160, 23, 0.3)' : undefined,
      }}
    >
      <div
        ref={stripRef}
        className="flex flex-col"
        onTransitionEnd={handleTransitionEnd}
        style={{
          transform: `translateY(-${offset}px)`,
          transition: transitioning
            ? `transform ${duration}ms cubic-bezier(0.15, 0.80, 0.20, 1.00)`
            : 'none',
        }}
      >
        {displaySymbols.map((icon, i) => (
          <div
            key={i}
            className="flex items-center justify-center shrink-0"
            style={{
              height: `${SYMBOL_HEIGHT}px`,
              width: '100%',
              fontSize: '40px',
              textShadow: '0 2px 8px rgba(0,0,0,0.5)',
            }}
          >
            {icon}
          </div>
        ))}
      </div>
    </div>
  );
}
