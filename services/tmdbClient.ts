// Central TMDB request helper.
//
// Security model:
//   - In DEV (import.meta.env.DEV) we call TMDB directly with the access token
//     so local development works without the serverless function running.
//   - In PROD we call our own /api/tmdb proxy, which injects the token
//     server-side. The token reference is guarded by `if (import.meta.env.DEV)`
//     so Vite tree-shakes VITE_TMDB_ACCESS_TOKEN out of the production bundle.

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

/**
 * Fetch a TMDB endpoint.
 * @param path TMDB path beginning with "/" (e.g. "/movie/now_playing").
 * @param params Query params to append (excluding the leading "?").
 */
export const tmdbFetch = async (
  path: string,
  params?: Record<string, string | number | undefined>,
): Promise<Response> => {
  const query = new URLSearchParams();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    }
  }

  if (import.meta.env.DEV) {
    // Direct call to TMDB in development. The token reference lives ONLY inside
    // this DEV branch so Vite drops it (and the env var) from the prod bundle.
    const token = import.meta.env.VITE_TMDB_ACCESS_TOKEN || '';
    const qs = query.toString();
    return fetch(`${TMDB_BASE_URL}${path}${qs ? `?${qs}` : ''}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  // Production: route through the serverless proxy. The proxy adds the token.
  query.append('path', path);
  return fetch(`/api/tmdb?${query.toString()}`, {
    headers: { 'Content-Type': 'application/json' },
  });
};
