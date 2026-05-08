import { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { Movie } from '../types';

/**
 * Hook to fetch and manage user favorites
 * Optimizes by fetching all favorite IDs once
 */
export const useFavorites = (isLoggedIn: boolean) => {
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      setFavoriteIds(new Set());
      userIdRef.current = null;
      return;
    }

    let isMounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const loadFavorites = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (isMounted) {
            setFavoriteIds(new Set());
            userIdRef.current = null;
          }
          return;
        }

        userIdRef.current = user.id;

        const { data, error } = await supabase
          .from('favorites')
          .select('movie_id')
          .eq('user_id', user.id);

        if (error) {
          console.error('Failed to load favorites:', error);
          if (isMounted) setFavoriteIds(new Set());
          return;
        }

        if (isMounted) {
          const ids = new Set(data?.map(item => item.movie_id) || []);
          setFavoriteIds(ids);
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
        if (isMounted) setFavoriteIds(new Set());
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isMounted) return;

      channel = supabase
        .channel(`favorites-changes-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'favorites',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            if (isMounted) loadFavorites();
          }
        )
        .subscribe();
    };

    loadFavorites().then(() => {
      if (isMounted) setupSubscription();
    });

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [isLoggedIn]);

  const toggleFavorite = async (movie: Movie, isFavorite: boolean): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('movie_id', movie.id);

        if (error) throw error;
        setFavoriteIds(prev => {
          const next = new Set(prev);
          next.delete(movie.id);
          return next;
        });
        return false;
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            movie_id: movie.id,
            movie_data: movie,
          });

        if (error) throw error;
        setFavoriteIds(prev => new Set(prev).add(movie.id));
        return true;
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      throw error;
    }
  };

  return {
    favoriteIds,
    isFavorite: (movieId: number) => favoriteIds.has(movieId),
    toggleFavorite,
    loading,
  };
};


