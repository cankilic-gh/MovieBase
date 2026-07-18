// External ratings (IMDb + Rotten Tomatoes) via OMDb, with a Supabase cache.
//
// Flow per title: Supabase cache hit? done. Otherwise TMDB /external_ids gives
// the imdb_id, OMDb gives the ratings, and the result is upserted into
// Supabase so the whole user base shares one lookup per title (OMDb free tier
// is 1,000 req/day).
//
// Degrades gracefully at every step: no Supabase table, missing imdb_id, an
// inactive OMDb key — the app simply shows no external badges for that title.

import { TitleRatings, Movie } from '../types';
import { tmdbFetch } from './tmdbClient';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const TABLE = 'title_ratings';
// Re-fetch cached rows older than this (ratings drift slowly).
const TTL_DAYS = 30;
// Parallel OMDb lookups per batch — keep gentle.
const CONCURRENCY = 4;
// Hard cap of fresh OMDb lookups per page-load session (protects the daily quota).
const SESSION_LOOKUP_CAP = 80;

const memory = new Map<string, TitleRatings | null>(); // key -> ratings (null = known-missing)
let omdbDisabled = false; // flipped when the key is invalid/limited — stop hammering
let sessionLookups = 0;

const keyOf = (movie: Pick<Movie, 'id' | 'media_type'>): string =>
  `${movie.media_type === 'tv' ? 'tv' : 'movie'}:${movie.id}`;

const isDev = import.meta.env.DEV;

const omdbFetch = async (imdbId: string): Promise<Record<string, unknown> | null> => {
  try {
    const res = isDev
      ? await fetch(
          `https://www.omdbapi.com/?i=${imdbId}&apikey=${import.meta.env.VITE_OMDB_API_KEY || ''}`,
        )
      : await fetch(`/api/omdb?i=${imdbId}`);
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, unknown>;
    if (data.Response === 'False') {
      const err = String(data.Error ?? '');
      // Invalid key / exhausted quota → give up for this session.
      if (/api key|limit/i.test(err)) omdbDisabled = true;
      return null;
    }
    return data;
  } catch {
    return null;
  }
};

const parseRatings = (imdbId: string, data: Record<string, unknown>): TitleRatings => {
  const imdbRaw = data.imdbRating;
  const imdb =
    typeof imdbRaw === 'string' && imdbRaw !== 'N/A' && !Number.isNaN(Number(imdbRaw))
      ? Number(imdbRaw)
      : null;

  let rt: number | null = null;
  if (Array.isArray(data.Ratings)) {
    const entry = (data.Ratings as { Source?: string; Value?: string }[]).find(
      (r) => r.Source === 'Rotten Tomatoes',
    );
    const pct = entry?.Value?.match(/(\d+)\s*%/);
    if (pct) rt = Number(pct[1]);
  }

  return { imdbId, imdb, rt };
};

/** TMDB external_ids → imdb id (movies and TV both). */
const fetchImdbId = async (movie: Movie): Promise<string | null> => {
  try {
    const type = movie.media_type === 'tv' ? 'tv' : 'movie';
    const res = await tmdbFetch(`/${type}/${movie.id}/external_ids`);
    if (!res.ok) return null;
    const data = (await res.json()) as { imdb_id?: string | null };
    return data.imdb_id && /^tt\d+$/.test(data.imdb_id) ? data.imdb_id : null;
  } catch {
    return null;
  }
};

interface CacheRow {
  tmdb_id: number;
  media_type: string;
  imdb_id: string | null;
  imdb_rating: number | null;
  rt_score: number | null;
  fetched_at: string;
}

const fromRow = (row: CacheRow): TitleRatings => ({
  imdbId: row.imdb_id,
  imdb: row.imdb_rating,
  rt: row.rt_score,
});

const isFresh = (row: CacheRow): boolean => {
  const age = Date.now() - new Date(row.fetched_at).getTime();
  return age < TTL_DAYS * 24 * 3600 * 1000;
};

/** Best-effort shared cache read; returns hits keyed by our session key. */
const readCache = async (movies: Movie[]): Promise<Map<string, TitleRatings>> => {
  const hits = new Map<string, TitleRatings>();
  if (!isSupabaseConfigured) return hits;
  try {
    const ids = [...new Set(movies.map((m) => m.id))];
    const { data, error } = await supabase
      .from(TABLE)
      .select('tmdb_id, media_type, imdb_id, imdb_rating, rt_score, fetched_at')
      .in('tmdb_id', ids);
    if (error || !data) return hits;
    for (const row of data as CacheRow[]) {
      if (!isFresh(row)) continue;
      hits.set(`${row.media_type}:${row.tmdb_id}`, fromRow(row));
    }
  } catch {
    /* cache table missing or unreachable — fine */
  }
  return hits;
};

const writeCache = async (movie: Movie, ratings: TitleRatings): Promise<void> => {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.from(TABLE).upsert(
      {
        tmdb_id: movie.id,
        media_type: movie.media_type === 'tv' ? 'tv' : 'movie',
        imdb_id: ratings.imdbId,
        imdb_rating: ratings.imdb,
        rt_score: ratings.rt,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: 'tmdb_id,media_type' },
    );
  } catch {
    /* best-effort */
  }
};

const lookupFresh = async (movie: Movie): Promise<TitleRatings | null> => {
  if (omdbDisabled || sessionLookups >= SESSION_LOOKUP_CAP) return null;
  sessionLookups++;

  const imdbId = await fetchImdbId(movie);
  if (!imdbId) return null;

  const data = await omdbFetch(imdbId);
  if (!data) return null;

  const ratings = parseRatings(imdbId, data);
  void writeCache(movie, ratings);
  return ratings;
};

/**
 * Resolve external ratings for a list of titles. Returns a map keyed by
 * `${mediaType}:${tmdbId}` containing only the titles that have ratings.
 * Safe to call repeatedly — already-resolved titles are served from memory.
 */
export const getRatings = async (
  movies: Movie[],
): Promise<Map<string, TitleRatings>> => {
  const result = new Map<string, TitleRatings>();
  const unresolved: Movie[] = [];

  for (const movie of movies) {
    const key = keyOf(movie);
    if (memory.has(key)) {
      const cached = memory.get(key);
      if (cached) result.set(key, cached);
    } else {
      unresolved.push(movie);
    }
  }
  if (unresolved.length === 0) return result;

  // 1) Shared Supabase cache.
  const cacheHits = await readCache(unresolved);
  const misses: Movie[] = [];
  for (const movie of unresolved) {
    const key = keyOf(movie);
    const hit = cacheHits.get(key);
    if (hit) {
      memory.set(key, hit);
      result.set(key, hit);
    } else {
      misses.push(movie);
    }
  }

  // 2) Fresh lookups (TMDB external_ids + OMDb), small concurrent batches.
  for (let i = 0; i < misses.length; i += CONCURRENCY) {
    if (omdbDisabled) break;
    const batch = misses.slice(i, i + CONCURRENCY);
    const settled = await Promise.all(batch.map((m) => lookupFresh(m)));
    settled.forEach((ratings, idx) => {
      const key = keyOf(batch[idx]);
      memory.set(key, ratings); // null too: don't retry this session
      if (ratings) result.set(key, ratings);
    });
  }

  return result;
};

export const ratingsKey = keyOf;
