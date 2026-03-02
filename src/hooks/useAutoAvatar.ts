import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Automatically generates an AI avatar for the current user
 * if they don't have one set yet. Runs once per session.
 */
export function useAutoAvatar() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (!user || !profile) return;
    if (profile.avatar_url) return; // Already has avatar
    if (attemptedRef.current) return; // Already tried this session

    attemptedRef.current = true;

    const generate = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        const response = await supabase.functions.invoke('generate-avatar', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (response.error) {
          console.error('Auto-avatar generation failed:', response.error);
          return;
        }

        const avatarUrl = response.data?.avatar_url;
        if (avatarUrl) {
          // Invalidate profile queries so the new avatar shows up
          queryClient.invalidateQueries({ queryKey: ['profile'] });
          toast.success('Avatar gerado automaticamente! 🎨');
        }
      } catch (err) {
        console.error('Auto-avatar error:', err);
      }
    };

    // Small delay to not block initial load
    const timer = setTimeout(generate, 3000);
    return () => clearTimeout(timer);
  }, [user?.id, profile?.avatar_url]);
}
