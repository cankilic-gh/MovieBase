import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

/**
 * Hook to fetch and manage user favorites
 * Optimizes by fetching all favorite IDs once
 */
export const useFavorites = (isLoggedIn: boolean) => {
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      setFavoriteIds(new Set());
      return;
    }

    const loadFavorites = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setFavoriteIds(new Set());
          return;
        }

        const { data, error } = await supabase
          .from('favorites')
          .select('movie_id')
          .eq('user_id', user.id);

        if (error) {
          console.error('Failed to load favorites:', error);
          setFavoriteIds(new Set());
          return;
        }

        const ids = new Set(data?.map(item => item.movie_id) || []);
        setFavoriteIds(ids);
      } catch (error) {
        console.error('Error loading favorites:', error);
        setFavoriteIds(new Set());
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();

    // Subscribe to favorites changes
    const channel = supabase
      .channel('favorites-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'favorites',
          filter: `user_id=eq.${(async () => {
            const { data: { user } } = await supabase.auth.getUser();
            return user?.id || '';
          })()}`,
        },
        () => {
          loadFavorites();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isLoggedIn]);

  const toggleFavorite = async (movieId: number, isFavorite: boolean): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      if (isFavorite) {
        // Remove
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('movie_id', movieId);

        if (error) throw error;
        setFavoriteIds(prev => {
          const next = new Set(prev);
          next.delete(movieId);
          return next;
        });
        return false;
      } else {
        // Add - we need movie data
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            movie_id: movieId,
          });

        if (error) throw error;
        setFavoriteIds(prev => new Set(prev).add(movieId));
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


