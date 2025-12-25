-- ============================================
-- SUPABASE FAVORITES TABLE SETUP
-- ============================================
-- Run this SQL in Supabase SQL Editor
-- ============================================

-- Create favorites table
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    movie_id INTEGER NOT NULL,
    movie_title TEXT,
    movie_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(user_id, movie_id)
);

-- Enable Row Level Security
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Policy: Users can only see their own favorites
CREATE POLICY "Users can view own favorites"
    ON public.favorites
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can only insert their own favorites
CREATE POLICY "Users can insert own favorites"
    ON public.favorites
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own favorites
CREATE POLICY "Users can delete own favorites"
    ON public.favorites
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS favorites_user_id_idx ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS favorites_movie_id_idx ON public.favorites(movie_id);
CREATE INDEX IF NOT EXISTS favorites_user_movie_idx ON public.favorites(user_id, movie_id);

