import { useState, useEffect, useRef } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useManagementAI } from '@/hooks/useManagementAI';
import { cn } from '@/lib/utils';
import mascotImg from '@/assets/prodem-logo.png';

export function AICopilotWidget() {
  const { messages, isLoading, isExecuting, hasGreeted, sendMessage, clearHistory } = useManagementAI();
  const [question, setQuestion] = useState('');
  const [expanded, setExpanded] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-greet on mount
  useEffect(() => {
    if (!hasGreeted && messages.length === 0) {
      sendMessage();
    }
  }, []);

  // Scroll only within messages container
  useEffect(() => {
    if (expanded && messagesContainerRef.current) {
      const el = messagesContainerRef.current;
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, expanded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;
    sendMessage(question.trim());
    setQuestion('');
    setExpanded(true);
  };

  const lastAssistantMsg = messages.filter(m => m.role === 'assistant').at(-1);

  return (
    <div className="col-span-2 rounded-2xl bg-card overflow-hidden animate-slide-up stagger-2 relative">
      {/* Subtle glow */}
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-10 blur-2xl pointer-events-none bg-primary" />

      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <img src={mascotImg} alt="Prodem Copiloto" className="w-9 h-9 rounded-xl object-cover" />
          <div>
            <span className="text-sm font-bold text-foreground leading-none">Copiloto IA</span>
            <span className="text-[10px] text-muted-foreground block mt-0.5">Seu assistente de gestão</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {messages.length > 2 && (
            <span className="text-[9px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full">
              {messages.length} msgs
            </span>
          )}
          <AppIcon
            name={expanded ? "ChevronUp" : "ChevronDown"}
            size={16}
            className="text-muted-foreground"
          />
        </div>
      </button>

      {/* Collapsed: show last message preview */}
      {!expanded && lastAssistantMsg && (
        <div className="px-4 pb-3">
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {lastAssistantMsg.content}
          </p>
        </div>
      )}

      {/* Loading state for initial greeting */}
      {!expanded && !lastAssistantMsg && isLoading && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-[10px] text-muted-foreground">Analisando seu dia...</span>
          </div>
        </div>
      )}

      {/* Expanded: full chat */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Messages */}
          <div ref={messagesContainerRef} className="max-h-64 overflow-y-auto space-y-2 scrollbar-thin">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "text-xs leading-relaxed rounded-2xl px-3 py-2",
                  msg.role === 'assistant'
                    ? "bg-secondary/50 text-foreground mr-6"
                    : "bg-primary/15 text-primary ml-6 text-right"
                )}
              >
                {msg.content}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-1 px-3 py-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="Pergunte algo..."
              className="h-9 text-xs rounded-full"
              disabled={isLoading}
            />
            <Button type="submit" size="sm" className="h-9 w-9 p-0 rounded-full shrink-0" disabled={isLoading || !question.trim()}>
              <AppIcon name="Send" size={14} />
            </Button>
          </form>

          {/* Clear history */}
          {messages.length > 4 && (
            <button
              onClick={clearHistory}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors mx-auto block"
            >
              Limpar histórico
            </button>
          )}
        </div>
      )}
    </div>
  );
}
