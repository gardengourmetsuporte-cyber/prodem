import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDashboardStats } from './useDashboardStats';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
}

const OLD_HISTORY_KEY = 'prodem_copilot_history';
const MAX_HISTORY = 20;
const CONVERSATION_KEY = 'prodem_copilot_conversation_id';

export interface CopilotContextStats {
  pendingExpensesCount: number;
  pendingExpensesTotal: number;
  lowStockCount: number;
  pendingTasksCount: number;
  upcomingInvoicesCount: number;
  checklistPct: number;
}

export function useManagementAI() {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Array<{ id: string; title: string; created_at: string }>>([]);
  const [contextStats, setContextStats] = useState<CopilotContextStats | null>(null);
  const { stats } = useDashboardStats();
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const greetedRef = useRef(false);
  const contextCacheRef = useRef<{ data: any; timestamp: number } | null>(null);
  const loadedRef = useRef(false);
  const CONTEXT_TTL = 5 * 60 * 1000;

  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = format(now, 'EEEE', { locale: ptBR });
  const timeOfDay = hour < 12 ? 'manhã' : hour < 18 ? 'tarde' : 'noite';

  // Load conversation list
  const loadConversations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('copilot_conversations')
      .select('id, title, created_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(30);
    setConversations(data || []);
  }, [user]);

  // Load messages for a conversation
  const loadConversationMessages = useCallback(async (convId: string) => {
    const { data } = await supabase
      .from('copilot_messages')
      .select('role, content, image_url')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .limit(MAX_HISTORY);

    const msgs: AIMessage[] = (data || []).map((m: any) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
      imageUrl: m.image_url || undefined,
    }));
    setMessages(msgs);
    if (msgs.length > 0) {
      setHasGreeted(true);
      greetedRef.current = true;
    }
  }, []);

  // Initialize: load last conversation or migrate from localStorage
  useEffect(() => {
    if (!user || loadedRef.current) return;
    loadedRef.current = true;

    const init = async () => {
      await loadConversations();

      // Check for stored conversation id
      const storedId = localStorage.getItem(CONVERSATION_KEY);
      if (storedId) {
        setConversationId(storedId);
        await loadConversationMessages(storedId);
        return;
      }

      // Migrate from old localStorage history
      try {
        const oldHistory = localStorage.getItem(OLD_HISTORY_KEY);
        if (oldHistory) {
          const oldMessages: AIMessage[] = JSON.parse(oldHistory);
          if (oldMessages.length > 0) {
            // Create a new conversation and migrate messages
            const { data: conv } = await supabase
              .from('copilot_conversations')
              .insert({ user_id: user.id, unit_id: activeUnitId, title: 'Conversa migrada' })
              .select('id')
              .single();

            if (conv) {
              const rows = oldMessages.map((m) => ({
                conversation_id: conv.id,
                role: m.role,
                content: m.content,
                image_url: m.imageUrl || null,
              }));
              await supabase.from('copilot_messages').insert(rows);
              setConversationId(conv.id);
              localStorage.setItem(CONVERSATION_KEY, conv.id);
              setMessages(oldMessages);
              setHasGreeted(true);
              greetedRef.current = true;
            }
            localStorage.removeItem(OLD_HISTORY_KEY);
            await loadConversations();
          }
        }
      } catch (err) {
        console.error('Copilot migration failed:', err);
      }
    };
    init();
  }, [user, activeUnitId, loadConversations, loadConversationMessages]);

  // Populate contextStats immediately from dashboardStats (available via React Query)
  useEffect(() => {
    if (!stats) return;
    setContextStats(prev => ({
      pendingExpensesCount: stats.pendingExpenses ?? 0,
      pendingExpensesTotal: 0,
      lowStockCount: stats.criticalItems ?? 0,
      pendingTasksCount: prev?.pendingTasksCount ?? 0,
      upcomingInvoicesCount: prev?.upcomingInvoicesCount ?? 0,
      checklistPct: prev?.checklistPct ?? 0,
    }));
  }, [stats]);

  // Save a message to the database
  const saveMessage = useCallback(async (convId: string, msg: AIMessage) => {
    await supabase.from('copilot_messages').insert({
      conversation_id: convId,
      role: msg.role,
      content: msg.content,
      image_url: msg.imageUrl || null,
    });
  }, []);

  // Ensure a conversation exists, create if needed
  const ensureConversation = useCallback(async (): Promise<string> => {
    if (conversationId) return conversationId;
    if (!user) throw new Error('User not authenticated');

    const { data: conv } = await supabase
      .from('copilot_conversations')
      .insert({ user_id: user.id, unit_id: activeUnitId, title: 'Nova conversa' })
      .select('id')
      .single();

    if (!conv) throw new Error('Failed to create conversation');
    setConversationId(conv.id);
    localStorage.setItem(CONVERSATION_KEY, conv.id);
    await loadConversations();
    return conv.id;
  }, [conversationId, user, activeUnitId, loadConversations]);

  // Switch to a different conversation
  const switchConversation = useCallback(async (convId: string) => {
    setConversationId(convId);
    localStorage.setItem(CONVERSATION_KEY, convId);
    setHasGreeted(false);
    greetedRef.current = false;
    await loadConversationMessages(convId);
  }, [loadConversationMessages]);

  // Start a new conversation
  const newConversation = useCallback(() => {
    setConversationId(null);
    localStorage.removeItem(CONVERSATION_KEY);
    setMessages([]);
    setHasGreeted(false);
    greetedRef.current = false;
  }, []);

  // Fetch rich context via edge function (single request replaces 19 parallel queries)
  const fetchFullContext = useCallback(async () => {
    if (!user || !activeUnitId) return {};

    const now = Date.now();
    if (contextCacheRef.current && (now - contextCacheRef.current.timestamp) < CONTEXT_TTL) {
      return contextCacheRef.current.data;
    }

    try {
      const { data, error } = await supabase.functions.invoke('copilot-context', {
        body: { unit_id: activeUnitId },
      });

      if (error) throw error;

      const contextData = {
        ...data.context,
        pendingRedemptions: stats.pendingRedemptions,
        dayOfWeek,
        timeOfDay,
      };

      contextCacheRef.current = { data: contextData, timestamp: Date.now() };

      if (data.contextStats) {
        setContextStats(data.contextStats);
      }

      return contextData;
    } catch (err) {
      console.error('Error fetching AI context:', err);
      return {
        criticalStockCount: stats.criticalItems,
        pendingRedemptions: stats.pendingRedemptions,
        dayOfWeek,
        timeOfDay,
      };
    }
  }, [user, activeUnitId, stats, dayOfWeek, timeOfDay]);

  // Enrich contextStats in background with full data
  useEffect(() => {
    if (!user || !activeUnitId) return;
    fetchFullContext().catch(() => {});
  }, [user, activeUnitId, fetchFullContext]);

  const sendMessage = useCallback(async (question?: string, imageBase64?: string) => {
    setIsLoading(true);

    let updatedMessages = [...messages];
    let convId: string;

    try {
      convId = await ensureConversation();
    } catch {
      setIsLoading(false);
      return;
    }

    if (question) {
      const userMsg: AIMessage = { role: 'user', content: question, imageUrl: imageBase64 };
      updatedMessages = [...updatedMessages, userMsg];
      setMessages(updatedMessages);
      // Save user message to DB
      await saveMessage(convId, userMsg);

      // Auto-title: use first user message as conversation title
      if (updatedMessages.filter(m => m.role === 'user').length === 1) {
        const title = question.slice(0, 80);
        await supabase.from('copilot_conversations').update({ title }).eq('id', convId);
        await loadConversations();
      }
    }

    try {
      const context = await fetchFullContext();

      const { data, error } = await supabase.functions.invoke('management-ai', {
        body: {
          messages: question ? updatedMessages.map(m => ({ role: m.role, content: m.content, imageUrl: m.imageUrl })) : [],
          context,
          user_id: user?.id || null,
          unit_id: activeUnitId || null,
          image: imageBase64 || null,
        },
      });

      if (error) throw error;

      const response = data?.suggestion || 'Não consegui gerar uma resposta no momento.';

      if (data?.action_executed) {
        setIsExecuting(true);
        contextCacheRef.current = null;
      }

      const assistantMsg: AIMessage = { role: 'assistant', content: response };
      setMessages(prev => [...prev, assistantMsg]);
      // Save assistant message to DB
      await saveMessage(convId, assistantMsg);

      if (!question) {
        setHasGreeted(true);
        greetedRef.current = true;
      }
    } catch (err: any) {
      const errorMsg = err?.message?.includes('429')
        ? 'Muitas requisições. Tente novamente em alguns minutos.'
        : 'Erro ao consultar o assistente. Tente novamente.';
      const errAIMsg: AIMessage = { role: 'assistant', content: errorMsg };
      setMessages(prev => [...prev, errAIMsg]);
      await saveMessage(convId, errAIMsg);
    } finally {
      setIsLoading(false);
      setIsExecuting(false);
    }
  }, [messages, fetchFullContext, user, activeUnitId, ensureConversation, saveMessage, loadConversations]);

  const clearHistory = useCallback(async () => {
    // Delete current conversation from DB
    if (conversationId) {
      await supabase.from('copilot_conversations').delete().eq('id', conversationId);
    }
    setMessages([]);
    setConversationId(null);
    localStorage.removeItem(CONVERSATION_KEY);
    localStorage.removeItem(OLD_HISTORY_KEY);
    setHasGreeted(false);
    greetedRef.current = false;
    await loadConversations();
  }, [conversationId, loadConversations]);

  return {
    messages,
    isLoading,
    isExecuting,
    hasGreeted,
    sendMessage,
    clearHistory,
    conversations,
    conversationId,
    switchConversation,
    newConversation,
    contextStats,
  };
}
