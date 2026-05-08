import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('PROJECT_URL')!;
const SERVICE_ROLE = Deno.env.get('SERVICE_ROLE_KEY')!;
const TMDB_TOKEN = Deno.env.get('TMDB_ACCESS_TOKEN')!;
const RESEND_KEY = Deno.env.get('RESEND_API_KEY')!;
const APP_URL = Deno.env.get('APP_URL') ?? 'https://moviebase.thegridbase.com';
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'MovieBase <onboarding@resend.dev>';
const CRON_SECRET = Deno.env.get('CRON_SECRET')!;
const UNSUBSCRIBE_SECRET = Deno.env.get('UNSUBSCRIBE_SECRET')!;
const FUNCTIONS_URL = Deno.env.get('FUNCTIONS_URL') ?? `${SUPABASE_URL}/functions/v1`;

const REGION = 'US';
const POSTER = 'https://image.tmdb.org/t/p/w200';

const PROVIDER_MAP: Record<number, string> = {
  8: 'Netflix', 9: 'Prime Video', 119: 'Prime Video', 337: 'Disney+',
  15: 'Hulu', 31: 'HBO Max', 1899: 'Max', 350: 'Apple TV+',
  531: 'Paramount+', 1770: 'Paramount+', 619: 'Starz', 626: 'Showtime',
  386: 'Peacock', 387: 'Peacock', 584: 'Discovery+', 283: 'Crunchyroll',
};

interface MovieDetail {
  id: number;
  media_type: 'movie' | 'tv';
  title: string;
  year: string;
  poster: string | null;
  score: string | null;
}

const tmdb = async (path: string): Promise<any | null> => {
  try {
    const r = await fetch(`https://api.themoviedb.org/3${path}`, {
      headers: { Authorization: `Bearer ${TMDB_TOKEN}` },
    });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
};

const fetchPlatform = async (id: number, mediaType: 'movie' | 'tv'): Promise<string | null> => {
  const data = await tmdb(`/${mediaType}/${id}/watch/providers`);
  if (!data) return null;
  const us = data.results?.[REGION];
  const sub = us?.flatrate ?? us?.free ?? us?.ads;
  if (!sub?.length) return null;
  return PROVIDER_MAP[sub[0].provider_id] ?? sub[0].provider_name ?? null;
};

const enrich = async (movieId: number, mediaType: 'movie' | 'tv'): Promise<MovieDetail | null> => {
  const m = await tmdb(`/${mediaType}/${movieId}`);
  if (!m) return null;
  return {
    id: m.id,
    media_type: mediaType,
    title: m.title || m.name || 'Untitled',
    year: (m.release_date || m.first_air_date || '').slice(0, 4),
    poster: m.poster_path,
    score: typeof m.vote_average === 'number' ? m.vote_average.toFixed(1) : null,
  };
};

const escapeHtml = (s: string): string =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const dateLine = (): string =>
  new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

const sign = async (data: string, secret: string): Promise<string> => {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
};

interface Arrival extends MovieDetail { new_platform: string; }
interface Favorite extends MovieDetail { platform: string | null; }
interface Recommendation extends MovieDetail { because: string; }

const renderEmail = ({
  arrivals,
  favorites,
  recommendations,
  unsubscribeUrl,
}: {
  arrivals: Arrival[];
  favorites: Favorite[];
  recommendations: Recommendation[];
  unsubscribeUrl: string;
}): string => {
  const C = {
    bg: '#ffffff', cardBg: '#ffffff', border: '#e6e8ec',
    text: '#0f1116', textMuted: '#5a6072', textDim: '#9aa0ad',
    cyan: '#00838f', red: '#DC143C', blue: '#0066FF', purple: '#6d28d9',
  };

  const card = (item: MovieDetail & { subtitle?: string | null }, accent: string) => `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:10px 0">
      <tr>
        <td valign="top" style="width:88px;padding:0 16px 0 0">
          ${item.poster
            ? `<img src="${POSTER}${item.poster}" alt="" width="88" height="132" style="display:block;border-radius:8px;box-shadow:0 4px 14px rgba(15,17,22,0.12),0 1px 3px rgba(15,17,22,0.08)">`
            : `<div style="width:88px;height:132px;background:#f2f4f7;border:1px solid ${C.border};border-radius:8px"></div>`}
        </td>
        <td valign="top" style="padding:4px 0 0 0">
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${C.text};font-size:17px;font-weight:700;line-height:1.3;letter-spacing:-0.01em">${escapeHtml(item.title)}</div>
          ${item.subtitle
            ? `<div style="font-family:'Courier New',monospace;color:${accent};font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-top:8px">${escapeHtml(item.subtitle)}</div>`
            : ''}
          <div style="font-family:'Courier New',monospace;color:${C.textMuted};font-size:11px;letter-spacing:1px;margin-top:8px">
            ${item.year ? `<span>${item.year}</span>` : ''}
            ${item.year && item.score ? `<span style="color:${C.textDim};margin:0 8px">·</span>` : ''}
            ${item.score ? `<span style="color:${parseFloat(item.score) >= 7.5 ? C.red : C.blue};font-weight:700">★ ${item.score}</span>` : ''}
            ${item.media_type ? `<span style="color:${C.textDim};margin:0 8px">·</span><span>${item.media_type === 'tv' ? 'SERIES' : 'MOVIE'}</span>` : ''}
          </div>
        </td>
      </tr>
    </table>`;

  const heading = (caption: string, accent: string) => `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:40px 0 14px 0">
      <tr><td>
        <span style="display:inline-block;background:#0f1116;color:#ffffff;font-family:'Courier New',monospace;font-size:11px;font-weight:700;letter-spacing:2.5px;padding:8px 14px;border-radius:6px;text-transform:uppercase;line-height:1">
          <span style="color:${accent};margin-right:6px">///</span>${caption}
        </span>
      </td></tr>
    </table>`;

  const intro = (text: string) =>
    `<p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${C.textMuted};font-size:14px;line-height:1.55;margin:0 0 14px 0">${escapeHtml(text)}</p>`;

  const arrivalsBlock = arrivals.length ? `
    ${heading('Now streaming', C.cyan)}
    ${intro('Titles you tracked just landed on a streaming service.')}
    ${arrivals.map((a) => card({ ...a, subtitle: `→ ${a.new_platform}` }, C.cyan)).join('')}
  ` : '';

  const favoritesBlock = favorites.length ? `
    ${heading('From your list', C.red)}
    ${intro('A reminder of what you saved — pick something for the weekend.')}
    ${favorites.map((f) => card({ ...f, subtitle: f.platform ?? null }, C.red)).join('')}
  ` : '';

  const recsBlock = recommendations.length ? `
    ${heading('You might also like', C.purple)}
    ${intro("Picks from titles related to what you've already saved.")}
    ${recommendations.map((r) => card({ ...r, subtitle: `based on ${r.because}` }, C.purple)).join('')}
  ` : '';

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${C.bg};color:${C.text}">
  <div style="display:none;max-height:0;overflow:hidden">Friday digest</div>
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${C.bg}">
    <tr><td align="left" style="padding:40px 24px 40px 40px">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" align="left" style="max-width:560px;margin:0">
        <tr><td style="padding:0">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr><td style="padding-bottom:8px">
              <div style="font-family:'Bungee','Bebas Neue',Impact,sans-serif;font-size:36px;letter-spacing:-0.01em;line-height:1">
                <span style="color:${C.red}">MOVIE</span><span style="color:${C.blue}">BASE</span>
              </div>
              <div style="font-family:'Courier New',monospace;color:${C.cyan};font-size:11px;font-weight:700;letter-spacing:3px;margin-top:10px">/// FRIDAY DIGEST · ${dateLine().toUpperCase()}</div>
            </td></tr>
          </table>
          ${arrivalsBlock}${favoritesBlock}${recsBlock}
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:40px">
            <tr><td align="left">
              <a href="${APP_URL}" style="display:inline-block;padding:14px 28px;background:${C.text};border:1px solid ${C.text};color:#ffffff;text-decoration:none;font-family:'Courier New',monospace;font-weight:700;letter-spacing:2px;font-size:12px;border-radius:6px">OPEN MOVIEBASE →</a>
            </td></tr>
          </table>
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:40px;border-top:1px solid ${C.border};padding-top:20px">
            <tr><td>
              <p style="font-family:'Courier New',monospace;color:${C.textDim};font-size:10px;line-height:1.7;margin:0;letter-spacing:0.5px">
                You're getting this weekly digest because you signed up for MovieBase.<br>
                <a href="${unsubscribeUrl}" style="color:${C.textMuted};text-decoration:underline">Unsubscribe</a> · <span style="color:${C.textDim}">/// auto-generated · friday 18:00 UTC</span>
              </p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
};

const pickRandom = <T,>(arr: T[], n: number): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
};

Deno.serve(async (req) => {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${CRON_SECRET}`) {
    return new Response('unauthorized', { status: 401 });
  }

  const sb = createClient(SUPABASE_URL, SERVICE_ROLE);

  const { data: unsubRows } = await sb.from('unsubscribes').select('user_id');
  const unsubscribed = new Set((unsubRows ?? []).map((r) => r.user_id));

  const { data: favRows } = await sb.from('favorites').select('user_id, movie_id');
  const { data: alertRows } = await sb
    .from('streaming_alerts')
    .select('user_id, movie_id, media_type, title, poster_path')
    .is('notified_at', null);

  const userIds = new Set<string>();
  for (const f of favRows ?? []) if (!unsubscribed.has(f.user_id)) userIds.add(f.user_id);
  for (const a of alertRows ?? []) if (!unsubscribed.has(a.user_id)) userIds.add(a.user_id);

  const result = {
    users_considered: userIds.size,
    emails_sent: 0,
    arrivals_marked: 0,
    skipped_empty: 0,
    errors: [] as string[],
  };

  for (const userId of userIds) {
    const userRes = await sb.auth.admin.getUserById(userId);
    const email = userRes.data?.user?.email;
    if (!email) {
      result.errors.push(`no email: ${userId}`);
      continue;
    }

    const userAlerts = (alertRows ?? []).filter((a) => a.user_id === userId);
    const arrivals: Arrival[] = [];
    const arrivalIds: Array<{ user_id: string; movie_id: number; new_platform: string }> = [];

    for (const a of userAlerts) {
      const platform = await fetchPlatform(a.movie_id, a.media_type as 'movie' | 'tv');
      if (platform) {
        arrivals.push({
          id: a.movie_id,
          media_type: a.media_type as 'movie' | 'tv',
          title: a.title,
          year: '',
          poster: a.poster_path,
          score: null,
          new_platform: platform,
        });
        arrivalIds.push({ user_id: a.user_id, movie_id: a.movie_id, new_platform: platform });
      }
    }

    const userFavs = (favRows ?? []).filter((f) => f.user_id === userId).map((f) => f.movie_id);
    const favSample = pickRandom(userFavs, 4);
    const favorites: Favorite[] = [];
    for (const movieId of favSample) {
      const detail = await enrich(movieId, 'movie');
      if (!detail) continue;
      const platform = await fetchPlatform(movieId, 'movie');
      favorites.push({ ...detail, platform });
    }

    const recommendations: Recommendation[] = [];
    if (favorites.length > 0) {
      const base = favorites[Math.floor(Math.random() * favorites.length)];
      const recData = await tmdb(`/${base.media_type}/${base.id}/recommendations`);
      const candidates = (recData?.results ?? []).slice(0, 6);
      const knownIds = new Set([...userFavs, ...arrivals.map((a) => a.id)]);
      for (const c of candidates) {
        if (knownIds.has(c.id)) continue;
        const detail = await enrich(c.id, base.media_type);
        if (detail) {
          recommendations.push({ ...detail, because: base.title });
          if (recommendations.length >= 3) break;
        }
      }
    }

    if (!arrivals.length && !favorites.length && !recommendations.length) {
      result.skipped_empty++;
      continue;
    }

    const unsubToken = await sign(userId, UNSUBSCRIBE_SECRET);
    const unsubscribeUrl = `${FUNCTIONS_URL}/unsubscribe?uid=${encodeURIComponent(userId)}&t=${unsubToken}`;

    const html = renderEmail({ arrivals, favorites, recommendations, unsubscribeUrl });
    const subject = arrivals.length
      ? `🎬 ${arrivals.length} now streaming · Your Friday MovieBase digest`
      : `Your Friday MovieBase digest · ${dateLine()}`;

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to: email, subject, html }),
    });

    if (!r.ok) {
      const txt = await r.text();
      result.errors.push(`resend ${userId}: ${r.status} ${txt.slice(0, 200)}`);
      continue;
    }
    result.emails_sent++;

    for (const a of arrivalIds) {
      const { error: updErr } = await sb
        .from('streaming_alerts')
        .update({ notified_at: new Date().toISOString(), last_known_platform: a.new_platform })
        .eq('user_id', a.user_id)
        .eq('movie_id', a.movie_id);
      if (updErr) result.errors.push(`update: ${updErr.message}`);
      else result.arrivals_marked++;
    }
  }

  return new Response(JSON.stringify(result, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
});
