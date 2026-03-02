import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { AppIcon } from '@/components/ui/app-icon';

interface PinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (pin: string) => void;
  title?: string;
  subtitle?: string;
  loading?: boolean;
  error?: string;
}

export function PinDialog({ open, onOpenChange, onConfirm, title, subtitle, loading, error }: PinDialogProps) {
  const [pin, setPin] = useState(['', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (open) {
      setPin(['', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [open]);

  if (!open) return null;

  const handleDigit = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    if (value && index === 3) {
      const fullPin = newPin.join('');
      if (fullPin.length === 4) {
        onConfirm(fullPin);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-xs rounded-2xl border border-border/40 shadow-2xl p-6 space-y-5">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <AppIcon name="Lock" size={22} className="text-primary" />
          </div>
          <h3 className="text-sm font-black uppercase tracking-widest text-foreground">
            {title || 'Senha do Operador'}
          </h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>

        <div className="flex justify-center gap-3">
          {pin.map((digit, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el; }}
              type="tel"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleDigit(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              disabled={loading}
              className={cn(
                "w-12 h-14 text-center text-2xl font-black rounded-xl border-2 bg-background outline-none transition-all",
                "focus:border-primary focus:ring-2 focus:ring-primary/20",
                error ? "border-destructive" : "border-border/50",
                loading && "opacity-50"
              )}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-destructive text-center font-bold">{error}</p>
        )}

        {loading && (
          <p className="text-xs text-muted-foreground text-center animate-pulse">Verificando...</p>
        )}

        <button
          onClick={() => { setPin(['', '', '', '']); onOpenChange(false); }}
          className="w-full py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          disabled={loading}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
