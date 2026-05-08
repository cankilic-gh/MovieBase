import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('PROJECT_URL')!;
const SERVICE_ROLE = Deno.env.get('SERVICE_ROLE_KEY')!;
const UNSUBSCRIBE_SECRET = Deno.env.get('UNSUBSCRIBE_SECRET')!;
const APP_URL = Deno.env.get('APP_URL') ?? 'https://moviebase.thegridbase.com';

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

const constantTimeEq = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
};

const page = (status: number, title: string, body: string): Response =>
  new Response(
    `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} · MovieBase</title>
<style>
  body{margin:0;padding:0;background:#ffffff;color:#0f1116;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center}
  .wrap{max-width:480px;padding:48px 32px;text-align:center}
  .logo{font-family:'Bungee','Bebas Neue',Impact,sans-serif;font-size:36px;letter-spacing:-0.01em;line-height:1;margin-bottom:24px}
  .logo .a{color:#DC143C}.logo .b{color:#0066FF}
  .badge{display:inline-block;background:#0f1116;color:#fff;font-family:'Courier New',monospace;font-size:11px;font-weight:700;letter-spacing:2.5px;padding:8px 14px;border-radius:6px;text-transform:uppercase;margin-bottom:20px}
  .badge span{color:#00838f;margin-right:6px}
  h1{font-size:24px;font-weight:700;margin:0 0 12px;letter-spacing:-0.02em}
  p{color:#5a6072;font-size:15px;line-height:1.55;margin:0 0 28px}
  a.btn{display:inline-block;padding:14px 28px;background:#0f1116;color:#fff;text-decoration:none;font-family:'Courier New',monospace;font-weight:700;letter-spacing:2px;font-size:12px;border-radius:6px}
</style></head><body><div class="wrap">
  <div class="logo"><span class="a">MOVIE</span><span class="b">BASE</span></div>
  <div class="badge"><span>///</span>${title.toUpperCase()}</div>
  <h1>${title}</h1>
  ${body}
  <a href="${APP_URL}" class="btn">OPEN MOVIEBASE →</a>
</div></body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const userId = url.searchParams.get('uid');
  const token = url.searchParams.get('t');

  if (!userId || !token) {
    return page(400, 'Invalid link', '<p>This unsubscribe link is missing parameters.</p>');
  }

  const expected = await sign(userId, UNSUBSCRIBE_SECRET);
  if (!constantTimeEq(token, expected)) {
    return page(403, 'Invalid signature', '<p>This unsubscribe link is not valid. It may have been altered.</p>');
  }

  const sb = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { error } = await sb
    .from('unsubscribes')
    .upsert({ user_id: userId }, { onConflict: 'user_id' });

  if (error) {
    return page(500, 'Something went wrong', `<p>We could not process your request right now. Please try again later.</p><pre style="color:#999;font-size:11px">${error.message}</pre>`);
  }

  return page(
    200,
    "You're unsubscribed",
    `<p>You will no longer receive the weekly MovieBase digest. You can re-enable notifications anytime from inside the app.</p>`,
  );
});
