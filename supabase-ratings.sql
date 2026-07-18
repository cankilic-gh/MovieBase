-- ============================================
-- TITLE RATINGS CACHE (IMDb + Rotten Tomatoes via OMDb)
-- ============================================
-- Run this SQL in Supabase SQL Editor.
-- Shared, anonymous cache of PUBLIC ratings data so each title is looked up
-- on OMDb only once for the whole user base (free tier: 1,000 req/day).
-- ============================================

CREATE TABLE IF NOT EXISTS public.title_ratings (
    tmdb_id INTEGER NOT NULL,
    media_type TEXT NOT NULL DEFAULT 'movie' CHECK (media_type IN ('movie', 'tv')),
    imdb_id TEXT,
    imdb_rating REAL,
    rt_score INTEGER,
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    PRIMARY KEY (tmdb_id, media_type)
);

ALTER TABLE public.title_ratings ENABLE ROW LEVEL SECURITY;

-- Public cache: anyone can read; anyone can write (data is public + non-personal).
CREATE POLICY "Anyone can read ratings"
    ON public.title_ratings FOR SELECT
    USING (true);

CREATE POLICY "Anyone can insert ratings"
    ON public.title_ratings FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Anyone can update ratings"
    ON public.title_ratings FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE INDEX IF NOT EXISTS title_ratings_fetched_at_idx ON public.title_ratings (fetched_at);
