// server.js
import 'dotenv/config';
import express from 'express';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ============================================================================
   Rotas do ADMIN (arquivos fora do /public)
   ========================================================================== */
const ROOT_DIR       = process.cwd();
const ADMIN_HTML     = path.join(ROOT_DIR, 'admin.html');
const ADMIN_MI_HTML  = path.join(ROOT_DIR, 'admin-mais-indicados.html');

/* ============================================================================
   Gate simples só para /influencers.html
   ========================================================================== */
function getCookie(req, name){
  const c = req.headers.cookie || "";
  const m = c.match(new RegExp('(?:^|; )'+name+'=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}

function isTokenValid(tok) {
  try {
    const json = Buffer.from(tok, 'base64').toString('utf8');
    const { exp } = JSON.parse(json);
    return typeof exp === 'number' && Date.now() < exp;
  } catch {
    return false;
  }
}

app.use((req,res,next)=>{
  if (req.path === '/influencers.html') {
    const tok = getCookie(req,'influ_auth');
    if (!tok || !isTokenValid(tok)) {
      const nextUrl = encodeURIComponent(req.originalUrl || '/influencers.html');
      return res.redirect(302, `/login.html?next=${nextUrl}`);
    }
  }
  next();
});

/* ============================================================================
   Rotas para servir os arquivos admin fora do /public (SEM LOGIN)
   ========================================================================== */
app.get('/admin.html', (_req, res) => res.sendFile(ADMIN_HTML));
app.get('/admin-mais-indicados.html', (_req, res) => res.sendFile(ADMIN_MI_HTML));

/* ============================================================================
   Servir arquivos do site (públicos)
   ========================================================================== */
app.use(express.static('public', { extensions: ['html'] }));

/* ============================================================================
   Paths e utilidades de JSON
   ========================================================================== */
const DATA_DIR         = path.join(ROOT_DIR, 'public', 'assets', 'data');
const LINEUPS          = path.join(DATA_DIR, 'lineups.json');
const LINEUPS_VERSION  = path.join(DATA_DIR, 'lineups.version.json');
const TEAM_UPD         = path.join(DATA_DIR, 'team-updates.json');
const MAIS_INDICADOS   = path.join(DATA_DIR, 'mais-indicados.json');

const PRIVATE_DIR        = path.join(ROOT_DIR, 'data-privado');
const INFLUENCERS_FILE   = path.join(PRIVATE_DIR, 'influencers-email.json');

const INFLU_PASS = process.env.INFLU_PASS;

async function readJsonSafe(p, fallback = { version:1, tz:'-03:00', teams:{} }) {
  try { return JSON.parse(await fs.readFile(p, 'utf8')); }
  catch { return structuredClone(fallback); }
}

async function writeJsonAtomic(p, obj) {
  await fs.mkdir(path.dirname(p), { recursive: true });
  const tmp = p + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(obj, null, 2));
  await fs.rename(tmp, p);
}

function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

async function isAllowedInfluencer(email) {
  const fallback = { emails: [] };
  const data = await readJsonSafe(INFLUENCERS_FILE, fallback);
  const list = (data.emails || []).map(normalizeEmail);
  return list.includes(normalizeEmail(email));
}

/* ============================================================================
   Login influenciadores
   ========================================================================== */
app.post('/login', async (req, res) => {
  try {
    const { email, password, next } = req.body || {};

    if (!email || !password) return res.redirect('/login.html?error=1');
    if (!INFLU_PASS || password !== INFLU_PASS) return res.redirect('/login.html?error=1');

    const allowed = await isAllowedInfluencer(email);
    if (!allowed) return res.redirect('/login.html?error=2');

    const expMs = Date.now() + 24 * 60 * 60 * 1000;

    const token = Buffer.from(JSON.stringify({
      email: normalizeEmail(email),
      exp: expMs
    }), 'utf8').toString('base64');

    const parts = [
      `influ_auth=${encodeURIComponent(token)}`,
      'Path=/',
      'HttpOnly',
      'SameSite=Lax',
      `Max-Age=${24*60*60}`
    ];
    if (process.env.NODE_ENV === 'production') parts.push('Secure');

    res.setHeader('Set-Cookie', parts.join('; '));

    const safeNext =
      typeof next === 'string' && next.startsWith('/') && !next.startsWith('//')
      ? next
      : '/influencers.html';

    return res.redirect(safeNext);

  } catch (e) {
    console.error('Erro no login:', e);
    return res.redirect('/login.html?error=3');
  }
});

/* ============================================================================
   Health
   ========================================================================== */
app.get('/api/ping', (_req,res) => res.json({ ok:true }));

/* ============================================================================
   GET lineups
   ========================================================================== */
app.get('/api/lineups', async (_req,res) => {
  const cur = await readJsonSafe(LINEUPS);
  res.json(cur);
});



/* ============================================================================
   POST lineups — VERSÃO FINAL (com version bump + version.json)
   ========================================================================== */
app.post('/api/lineups', async (req, res) => {
  const { merge, teams, rodada, jogos } = req.body || {};

  try {
    let cur = await readJsonSafe(LINEUPS);
    const nowISO = new Date().toISOString();

    if (!cur || typeof cur !== 'object')
      cur = { version:1, tz:'-03:00', teams:{} };

    cur.teams   = cur.teams || {};
    cur.tz      = cur.tz || '-03:00';
    cur.version = Number.isFinite(+cur.version) ? +cur.version : 1;

    let touched = false;

    // ===== Atualizou times =====
    if (teams && typeof teams === 'object') {
      cur.teams = { ...(merge ? (cur.teams || {}) : {}), ...teams };
      touched = true;

      const keys = Object.keys(teams);
      const upd = await readJsonSafe(TEAM_UPD);
      upd.version = 1;
      upd.tz = '-03:00';
      upd.teams = upd.teams || {};

      for (const k of keys) {
        const prev = upd.teams[k] || {};
        upd.teams[k] = { ...prev, last_update: nowISO };
      }

      await writeJsonAtomic(TEAM_UPD, upd);
    }

    // ===== Atualizou rodada/jogos =====
    if (Number.isInteger(rodada) && Array.isArray(jogos)) {
      cur.rodada = rodada;
      cur.jogos  = jogos;
      touched = true;
    }

    if (!touched) {
      return res.status(400).json({ ok:false, error:'payload inválido' });
    }

    // ===== BUMP DE VERSÃO =====
    cur.version = cur.version + 1;
    cur.updated_at = nowISO;

    await writeJsonAtomic(LINEUPS, cur);
    await writeJsonAtomic(LINEUPS_VERSION, { version: cur.version });

    return res.json({
      ok:true,
      version: cur.version,
      updated_at: cur.updated_at
    });

  } catch (err) {
    console.error('Erro em POST /api/lineups', err);
    return res.status(500).json({ ok:false, error:'erro interno' });
  }
});


/* ============================================================================
   GET mais-indicados
   ========================================================================== */
app.get('/api/mais-indicados', async (_req, res) => {
  const fallback = {
    comingSoon: true,
    message: 'O levantamento das indicações está em andamento!',
    hideWhenSoon: false,
    useSkeleton: true,
    rodada: null,
    time: {},
    banco: []
  };

  try {
    const cur = await readJsonSafe(MAIS_INDICADOS, fallback);
    res.json(cur);
  } catch (err) {
    console.error('Erro ao ler mais-indicados.json:', err);
    res.status(500).json({ error: 'Erro ao ler mais-indicados.json' });
  }
});

/* ============================================================================
   POST mais-indicados
   ========================================================================== */
app.post('/api/mais-indicados', async (req, res) => {
  try {
    const body = req.body || {};
    if (!body || typeof body !== 'object' || Array.isArray(body))
      return res.status(400).json({ ok:false, error:'JSON inválido no body' });

    body.atualizado_em = new Date().toISOString();

    await fs.mkdir(DATA_DIR, { recursive:true });
    await fs.writeFile(MAIS_INDICADOS, JSON.stringify(body, null, 2), 'utf8');

    return res.json({ ok:true, atualizado_em: body.atualizado_em });
  } catch (err) {
    console.error('Erro ao salvar mais-indicados.json:', err);
    return res.status(500).json({ ok:false, error:String(err?.message || err) });
  }
});

/* ============================================================================
   POST team-updates
   ========================================================================== */
app.post('/api/team-updates', async (req, res) => {
  try {
    const { teamKey, alert = "" } = req.body || {};
    if (!teamKey) return res.status(400).json({ error:'teamKey required' });

    const nowISO = new Date().toISOString();
    const upd = await readJsonSafe(TEAM_UPD);

    upd.version = 1;
    upd.tz = '-03:00';
    upd.teams = upd.teams || {};

    const prev = upd.teams[teamKey] || {};
    upd.teams[teamKey] = { ...prev, last_update: nowISO, alert };

    await writeJsonAtomic(TEAM_UPD, upd);

    res.json({ ok:true, teamKey, last_update: nowISO });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error:String(err?.message || err) });
  }
});

/* ============================================================================
   Proxy Cartola Mercado
   ========================================================================== */
const CARTOLA_URL = 'https://api.cartola.globo.com/atletas/mercado';
const CARTOLA_TTL_MS = 60_000;

let __cartolaCache = { ts: 0, payload: null };

async function fetchCartolaMercado() {
  const now = Date.now();

  if (__cartolaCache.payload && now - __cartolaCache.ts < CARTOLA_TTL_MS)
    return __cartolaCache.payload;

  const r = await fetch(CARTOLA_URL, {
    headers: { 'User-Agent': 'ProvaveisDoCartola/1.0 (+admin-panel)' }
  });

  if (!r.ok) {
    const errPayload = { error:`HTTP ${r.status}`, captured_at:new Date().toISOString() };
    __cartolaCache = { ts:now, payload:errPayload };
    return errPayload;
  }

  const json = await r.json();

  const map = {};
  let total = 0;
  const by_status = {};

  for (const a of json.atletas || []) {
    map[a.atleta_id] = a.status_id;
    total++;
    by_status[a.status_id] = (by_status[a.status_id]||0) + 1;
  }

  const payload = {
    captured_at: new Date().toISOString(),
    rodada: json.rodada || json.rodada_atual || null,
    total,
    by_status,
    map
  };

  __cartolaCache = { ts:now, payload };
  return payload;
}

app.get('/api/cartola-mercado', async (_req, res) => {
  try {
    const payload = await fetchCartolaMercado();
    res.set('Cache-Control', 'public, max-age=30');
    res.json(payload);
  } catch (e) {
    res.status(500).json({ error:String(e) });
  }
});

/* ============================================================================
   Start
   ========================================================================== */
const PORT = process.env.PORT || 3001;
app.listen(PORT, () =>
  console.log(`[painel] http://localhost:${PORT}`)
);
