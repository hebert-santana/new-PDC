// server.js
import express from 'express';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const app = express();
app.use(express.json());

/* ============================================================================
   Gate simples para /influencers.html
   ============================================================================ */
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
   Site/painel estático
   ============================================================================ */
app.use(express.static('public', { extensions: ['html'] }));

/* ============================================================================
   Paths e utilidades de JSON
   ============================================================================ */
const DATA_DIR = path.join(process.cwd(), 'public', 'assets', 'data');
const LINEUPS  = path.join(DATA_DIR, 'lineups.json');
const TEAM_UPD = path.join(DATA_DIR, 'team-updates.json');

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

/* ============================================================================
   Health
   ============================================================================ */
app.get('/api/ping', (_req,res) => res.json({ ok:true }));

/* ============================================================================
   GET lineups
   ============================================================================ */
app.get('/api/lineups', async (_req,res) => {
  const cur = await readJsonSafe(LINEUPS);
  res.json(cur);
});

/* ============================================================================
   POST lineups + marca update por time
   ============================================================================ */
app.post('/api/lineups', async (req, res) => {
  const { merge, teams, rodada, jogos } = req.body || {};

  // modo A: merge por time
  if (teams && typeof teams === 'object') {
    const nowISO = new Date().toISOString();

    // 1) atualizar lineups.json
    const cur = await readJsonSafe(LINEUPS);
    cur.teams = { ...(merge ? (cur.teams || {}) : {}), ...teams };
    cur.updated_at = nowISO;
    await writeJsonAtomic(LINEUPS, cur);

    // 2) atualizar team-updates.json apenas para as chaves recebidas
    const keys = Object.keys(teams);
    const upd  = await readJsonSafe(TEAM_UPD);
    upd.version = 1; upd.tz = '-03:00'; upd.teams = upd.teams || {};
    for (const k of keys) {
      const prev = upd.teams[k] || {};
      upd.teams[k] = { ...prev, last_update: nowISO };
    }
    await writeJsonAtomic(TEAM_UPD, upd);

    return res.json({ ok:true, changed: keys, updated_at: nowISO });
  }

  // modo B: compat legado agregado
  if (Number.isInteger(rodada) && Array.isArray(jogos)) {
    const cur = await readJsonSafe(LINEUPS);
    cur.rodada = rodada;
    cur.jogos  = jogos;
    cur.updated_at = new Date().toISOString();
    await writeJsonAtomic(LINEUPS, cur);
    return res.json({ ok:true, updated_at: cur.updated_at });
  }

  return res.status(400).json({ ok:false, error:'payload inválido' });
});

/* ============================================================================
   NOVA ROTA — Atualizar horário manualmente via botão
   ============================================================================ */
app.post('/api/team-updates', async (req, res) => {
  try {
    const { teamKey, alert = "" } = req.body || {};
    if (!teamKey) return res.status(400).json({ error: 'teamKey required' });

    const nowISO = new Date().toISOString();
    const upd = await readJsonSafe(TEAM_UPD);

    upd.version = 1;
    upd.tz = '-03:00';
    upd.teams = upd.teams || {};

    const prev = upd.teams[teamKey] || {};
    upd.teams[teamKey] = { ...prev, last_update: nowISO, alert };

    await writeJsonAtomic(TEAM_UPD, upd);
    res.json({ ok: true, teamKey, last_update: nowISO });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err?.message || err) });
  }
});

/* ============================================================================
   NOVA ROTA — Proxy Cartola atletas/mercado → mapa { atleta_id: status_id }
   Cache em memória por 60s para reduzir chamadas e evitar CORS no browser.
   ============================================================================ */
const CARTOLA_URL = 'https://api.cartola.globo.com/atletas/mercado';
const CARTOLA_TTL_MS = 60_000;

let __cartolaCache = { ts: 0, payload: null };

async function fetchCartolaMercado() {
  const now = Date.now();
  if (__cartolaCache.payload && now - __cartolaCache.ts < CARTOLA_TTL_MS) {
    return __cartolaCache.payload;
  }

  const r = await fetch(CARTOLA_URL, {
    headers: {
      // Alguns endpoints são sensíveis a UA.
      'User-Agent': 'ProvaveisDoCartola/1.0 (+admin-panel)'
    }
  });

  if (!r.ok) {
    const errPayload = { error: `HTTP ${r.status}`, captured_at: new Date().toISOString() };
    __cartolaCache = { ts: now, payload: errPayload }; // evita tempestade de requests
    return errPayload;
  }

  const json = await r.json();
  const map = {};
  let total = 0;
  const by_status = {};

  for (const a of json.atletas || []) {
    map[a.atleta_id] = a.status_id;
    total++;
    by_status[a.status_id] = (by_status[a.status_id] || 0) + 1;
  }

  const payload = {
    captured_at: new Date().toISOString(),
    rodada: json.rodada || json.rodada_atual || null,
    total,
    by_status,
    map // { [atleta_id]: status_id }
  };

  __cartolaCache = { ts: now, payload };
  return payload;
}

app.get('/api/cartola-mercado', async (_req, res) => {
  try {
    const payload = await fetchCartolaMercado();
    // cache client-side curto também
    res.set('Cache-Control', 'public, max-age=30'); // opcional
    res.json(payload);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

/* ============================================================================
   Start
   ============================================================================ */
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`[painel] http://localhost:${PORT}`));
