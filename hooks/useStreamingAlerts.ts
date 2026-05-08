import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Movie } from '../types';

export const useStreamingAlerts = (isLoggedIn: boolean) => {
  const [alertIds, setAlertIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isLoggedIn) {
      setAlertIds(new Set());
      return;
    }

    let isMounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (isMounted) setAlertIds(new Set());
        return;
      }
      const { data, error } = await supabase
        .from('streaming_alerts')
        .select('movie_id')
        .eq('user_id', user.id);
      if (error) {
        console.error('Failed to load alerts:', error);
        return;
      }
      if (isMounted) setAlertIds(new Set(data?.map((r) => r.movie_id) ?? []));
    };

    const subscribe = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isMounted) return;
      channel = supabase
        .channel(`streaming-alerts-${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'streaming_alerts', filter: `user_id=eq.${user.id}` },
          () => { if (isMounted) load(); },
        )
        .subscribe();
    };

    load().then(() => { if (isMounted) subscribe(); });

    return () => {
      isMounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [isLoggedIn]);

  const toggleAlert = async (movie: Movie, isOn: boolean): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Login required');

    if (isOn) {
      const { error } = await supabase
        .from('streaming_alerts')
        .delete()
        .eq('user_id', user.id)
        .eq('movie_id', movie.id);
      if (error) throw error;
      setAlertIds((prev) => {
        const next = new Set(prev);
        next.delete(movie.id);
        return next;
      });
      return false;
    } else {
      const { error } = await supabase.from('streaming_alerts').insert({
        user_id: user.id,
        movie_id: movie.id,
        media_type: movie.media_type === 'tv' ? 'tv' : 'movie',
        title: movie.title,
        poster_path: movie.poster_path,
        last_known_platform: movie.platform ?? null,
      });
      if (error) throw error;
      setAlertIds((prev) => new Set(prev).add(movie.id));
      return true;
    }
  };

  return {
    alertIds,
    hasAlert: (movieId: number) => alertIds.has(movieId),
    toggleAlert,
  };
};
