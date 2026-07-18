// Vercel serverless proxy for the OMDb API (IMDb + Rotten Tomatoes ratings).
//
// Keeps the OMDb key server-side: the client calls `/api/omdb?i=tt3896198`
// and this function forwards to https://www.omdbapi.com with the key from the
// server-only env var OMDB_API_KEY.
//
// Ratings drift slowly, so responses are cached hard at the edge to stay well
// inside OMDb's 1,000 requests/day free tier.

export const config = { runtime: 'edge' };

const OMDB_BASE = 'https://www.omdbapi.com/';

// Only lookups by IMDb id are allowed (tt + digits) — no open relay.
const IMDB_ID = /^tt\d{6,10}$/;

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const imdbId = url.searchParams.get('i') ?? '';

  if (!IMDB_ID.test(imdbId)) {
    return new Response(JSON.stringify({ error: 'Invalid or missing imdb id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const key = process.env.OMDB_API_KEY;
  if (!key) {
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const upstream = await fetch(`${OMDB_BASE}?i=${imdbId}&apikey=${key}`, {
    headers: { Accept: 'application/json' },
  });
  const body = await upstream.text();

  return new Response(body, {
    status: upstream.status,
    headers: {
      'Content-Type': 'application/json',
      // Cache a week at the edge; ratings don't move fast.
      'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
