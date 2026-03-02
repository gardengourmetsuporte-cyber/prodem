import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { toast } from 'sonner';
import type { ManagerTask, TaskCategory } from '@/types/agenda';

interface ReorderUpdate {
  id: string;
  sort_order: number;
}

export function useAgenda() {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const queryClient = useQueryClient();
  const pendingDeleteRef = useRef<Map<string, { task: ManagerTask; timer: ReturnType<typeof setTimeout> }>>(new Map());

  const queryKey = ['manager-tasks', user?.id, activeUnitId];

  // Default task categories for new users
  const DEFAULT_TASK_CATEGORIES = useMemo(() => [
    { name: 'Produção', color: '#ef4444', icon: 'factory' },
    { name: 'Compras', color: '#f59e0b', icon: 'shopping_cart' },
    { name: 'Financeiro', color: '#22c55e', icon: 'payments' },
    { name: 'Manutenção', color: '#3b82f6', icon: 'build' },
    { name: 'RH / Equipe', color: '#8b5cf6', icon: 'groups' },
    { name: 'Qualidade', color: '#14b8a6', icon: 'verified' },
    { name: 'Clientes', color: '#ec4899', icon: 'person' },
    { name: 'Pessoal', color: '#64748b', icon: 'star' },
  ], []);

  const defaultsInitRef = useRef(false);

  // Fetch task categories
  const { data: categories = [] } = useQuery({
    queryKey: ['task-categories', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('task_categories' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order');
      
      if (error) throw error;
      return data as unknown as TaskCategory[];
    },
    enabled: !!user?.id,
  });

  // Auto-create default categories for new users
  useEffect(() => {
    if (!user?.id || defaultsInitRef.current || categories.length > 0) return;
    defaultsInitRef.current = true;
    
    const init = async () => {
      const rows = DEFAULT_TASK_CATEGORIES.map((cat, i) => ({
        user_id: user.id,
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
        sort_order: i,
      }));
      await supabase.from('task_categories' as any).insert(rows as any);
      queryClient.invalidateQueries({ queryKey: ['task-categories'] });
    };
    init();
  }, [user?.id, categories.length, DEFAULT_TASK_CATEGORIES, queryClient]);

  // Fetch all tasks for user
  const { data: allTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user?.id || !activeUnitId) return [];
      const { data, error } = await supabase
        .from('manager_tasks')
        .select('*, category:task_categories(*)')
        .eq('user_id', user.id)
        .eq('unit_id', activeUnitId)
        .order('sort_order', { ascending: true })
        .order('due_date', { ascending: true, nullsFirst: true });
      
      if (error) throw error;
      return data as ManagerTask[];
    },
    enabled: !!user?.id && !!activeUnitId,
  });

  // Build hierarchical tasks
  const tasks = useMemo(() => {
    const pendingIds = new Set(pendingDeleteRef.current.keys());
    const filtered = allTasks.filter(t => !pendingIds.has(t.id));
    const parentTasks = filtered.filter(t => !t.parent_id);
    const childMap = new Map<string, ManagerTask[]>();
    filtered.filter(t => t.parent_id).forEach(t => {
      const children = childMap.get(t.parent_id!) || [];
      children.push(t);
      childMap.set(t.parent_id!, children);
    });
    return parentTasks.map(t => ({
      ...t,
      subtasks: childMap.get(t.id) || [],
    }));
  }, [allTasks, pendingDeleteRef.current.size]);

  // Add task mutation
  const addTaskMutation = useMutation({
    mutationFn: async (task: { title: string; notes?: string; due_date?: string; due_time?: string; category_id?: string; parent_id?: string }) => {
      if (!user?.id || !activeUnitId) throw new Error('User not authenticated');
      const { error } = await supabase
        .from('manager_tasks')
        .insert({
          user_id: user.id,
          unit_id: activeUnitId,
          title: task.title,
          notes: task.notes || null,
          due_date: task.due_date || null,
          due_time: task.due_time || null,
          priority: 'medium',
          category_id: task.category_id || null,
          parent_id: task.parent_id || null,
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-tasks'] });
      toast.success('Lembrete criado!');
    },
    onError: () => {
      toast.error('Erro ao criar lembrete');
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, ...task }: { id: string; title: string; notes?: string; due_date?: string; due_time?: string; category_id?: string }) => {
      const { error } = await supabase
        .from('manager_tasks')
        .update({
          title: task.title,
          notes: task.notes || null,
          due_date: task.due_date || null,
          due_time: task.due_time || null,
          category_id: task.category_id || null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-tasks'] });
      toast.success('Lembrete atualizado!');
    },
    onError: () => {
      toast.error('Erro ao atualizar lembrete');
    },
  });

  // Toggle task completion with optimistic update
  const toggleTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const task = allTasks.find(t => t.id === taskId);
      if (!task) throw new Error('Task not found');
      
      const { error } = await supabase
        .from('manager_tasks')
        .update({
          is_completed: !task.is_completed,
          completed_at: !task.is_completed ? new Date().toISOString() : null,
        })
        .eq('id', taskId);
      if (error) throw error;
    },
    onMutate: async (taskId: string) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ManagerTask[]>(queryKey);
      queryClient.setQueryData<ManagerTask[]>(queryKey, (old) =>
        old?.map(t => t.id === taskId ? { ...t, is_completed: !t.is_completed, completed_at: !t.is_completed ? new Date().toISOString() : null } : t)
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-tasks'] });
    },
  });

  // Soft delete with undo — removes from UI immediately, deletes after 5s
  const deleteTask = useCallback((taskId: string) => {
    const task = allTasks.find(t => t.id === taskId);
    const taskTitle = task?.title || 'Lembrete';

    // Optimistic: hide from UI
    queryClient.setQueryData<ManagerTask[]>(queryKey, (old) =>
      old?.filter(t => t.id !== taskId && t.parent_id !== taskId)
    );

    const timer = setTimeout(async () => {
      pendingDeleteRef.current.delete(taskId);
      const { error } = await supabase
        .from('manager_tasks')
        .delete()
        .eq('id', taskId);
      if (error) {
        toast.error('Erro ao remover lembrete');
        queryClient.invalidateQueries({ queryKey: ['manager-tasks'] });
      }
    }, 5000);

    pendingDeleteRef.current.set(taskId, { task: task as ManagerTask, timer });

    toast(`"${taskTitle}" removido`, {
      action: {
        label: 'Desfazer',
        onClick: () => {
          const pending = pendingDeleteRef.current.get(taskId);
          if (pending) {
            clearTimeout(pending.timer);
            pendingDeleteRef.current.delete(taskId);
            queryClient.invalidateQueries({ queryKey: ['manager-tasks'] });
            toast.success('Lembrete restaurado!');
          }
        },
      },
      duration: 5000,
    });
  }, [allTasks, queryClient, queryKey]);

  // Cleanup pending deletes on unmount
  useEffect(() => {
    return () => {
      pendingDeleteRef.current.forEach(({ timer }) => clearTimeout(timer));
    };
  }, []);

  // Reorder tasks mutation with optimistic update
  const reorderTasksMutation = useMutation({
    mutationFn: async (updates: ReorderUpdate[]) => {
      const promises = updates.map(({ id, sort_order }) =>
        supabase
          .from('manager_tasks')
          .update({ sort_order })
          .eq('id', id)
      );
      const results = await Promise.all(promises);
      const error = results.find(r => r.error)?.error;
      if (error) throw error;
    },
    onMutate: async (updates: ReorderUpdate[]) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ManagerTask[]>(queryKey);
      queryClient.setQueryData<ManagerTask[]>(queryKey, (old) => {
        if (!old) return old;
        const orderMap = new Map(updates.map(u => [u.id, u.sort_order]));
        return old.map(t => {
          const newOrder = orderMap.get(t.id);
          return newOrder !== undefined ? { ...t, sort_order: newOrder } : t;
        }).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      });
      return { previous };
    },
    onError: (_err, _updates, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      toast.error('Erro ao reordenar');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-tasks'] });
    },
  });

  // Category mutations
  const addCategoryMutation = useMutation({
    mutationFn: async (category: { name: string; color: string; icon?: string }) => {
      if (!user?.id) throw new Error('User not authenticated');
      const { error } = await supabase
        .from('task_categories' as any)
        .insert({
          user_id: user.id,
          name: category.name,
          color: category.color,
          icon: category.icon || 'folder',
          sort_order: categories.length,
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-categories'] });
      toast.success('Categoria criada!');
    },
    onError: () => toast.error('Erro ao criar categoria'),
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, name, color, icon }: { id: string; name: string; color: string; icon?: string }) => {
      const updates: any = { name, color };
      if (icon !== undefined) updates.icon = icon;
      const { error } = await supabase
        .from('task_categories' as any)
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-categories'] });
      queryClient.invalidateQueries({ queryKey: ['manager-tasks'] });
      toast.success('Categoria atualizada!');
    },
    onError: () => toast.error('Erro ao atualizar categoria'),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await supabase
        .from('task_categories' as any)
        .delete()
        .eq('id', categoryId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-categories'] });
      toast.success('Categoria removida!');
    },
    onError: () => toast.error('Erro ao remover categoria'),
  });

  const reorderCategoriesMutation = useMutation({
    mutationFn: async (reorderedCategories: TaskCategory[]) => {
      const promises = reorderedCategories.map((cat, index) =>
        supabase
          .from('task_categories' as any)
          .update({ sort_order: index } as any)
          .eq('id', cat.id)
      );
      const results = await Promise.all(promises);
      const error = results.find(r => r.error)?.error;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-categories'] });
    },
  });

  return {
    tasks,
    allTasks,
    categories,
    isLoading: tasksLoading,
    addTask: addTaskMutation.mutate,
    updateTask: updateTaskMutation.mutate,
    toggleTask: toggleTaskMutation.mutate,
    deleteTask,
    addCategory: addCategoryMutation.mutate,
    updateCategory: updateCategoryMutation.mutate,
    deleteCategory: deleteCategoryMutation.mutate,
    reorderTasks: reorderTasksMutation.mutate,
    reorderCategories: reorderCategoriesMutation.mutate,
    isAddingTask: addTaskMutation.isPending,
    isUpdatingTask: updateTaskMutation.isPending,
  };
}
