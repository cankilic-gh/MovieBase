// Vercel serverless proxy for the TMDB API.
//
// Keeps the TMDB access token server-side: the browser never sees it in
// production. The client calls `/api/tmdb?path=/movie/now_playing&region=US`
// and this function forwards the request to https://api.themoviedb.org/3
// with a Bearer token from the server-only env var TMDB_ACCESS_TOKEN.
//
// Uses the Web-standard Request/Response signature so it type-checks with the
// DOM lib already configured (no @vercel/node dependency required).

// Run on Vercel's Edge runtime so the Web-standard Request/Response signature
// below is the actual invocation contract (the default Node runtime would
// expect an (req, res) handler instead).
export const config = { runtime: 'edge' };

const TMDB_BASE = 'https://api.themoviedb.org/3';

// Only allow read-only TMDB endpoints the app actually uses. Anything else is
// rejected so this proxy can't be turned into an open relay.
const ALLOWED_PATH = /^\/(?:trending|discover|movie|tv|search|watch)\b[a-zA-Z0-9/_-]*$/;

// Endpoints whose responses are cacheable at the edge for a while. Watch
// providers and now_playing change slowly, so cache them to cut TMDB load.
const isCacheable = (path: string): boolean =>
  path.includes('/watch/providers') ||
  path.includes('/now_playing') ||
  path.startsWith('/trending') ||
  path.startsWith('/discover');

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const rawPath = url.searchParams.get('path') || '';

  // Normalise: callers pass the TMDB path (e.g. "/movie/now_playing"). Strip
  // any accidental leading "3" or host, and cap the length.
  const path = rawPath.trim();

  if (!path || path.length > 256 || !path.startsWith('/') || !ALLOWED_PATH.test(path)) {
    return new Response(JSON.stringify({ error: 'Invalid or disallowed TMDB path' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = process.env.TMDB_ACCESS_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({ error: 'TMDB token not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Forward every query param except our own `path` so callers can pass
  // language, page, region, with_genres, query, etc.
  const forwarded = new URLSearchParams();
  url.searchParams.forEach((value, key) => {
    if (key !== 'path') forwarded.append(key, value);
  });

  const target = `${TMDB_BASE}${path}${forwarded.toString() ? `?${forwarded.toString()}` : ''}`;

  try {
    const upstream = await fetch(target, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const body = await upstream.text();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (upstream.ok && isCacheable(path)) {
      // Cache at the Vercel edge; allow stale while revalidating.
      headers['Cache-Control'] = 's-maxage=3600, stale-while-revalidate=86400';
    }

    return new Response(body, { status: upstream.status, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Upstream TMDB request failed' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
