// server.js
import express from 'express';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const app = express();
app.use(express.json());

// gate para /influencers.html
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
      const nextUrl = encodeURIComponent(req.originalUrl||'/influencers.html');
      return res.redirect(`/login.html?next=${nextUrl}`);
    }
  }
  next();
});


// site/painel estático
app.use(express.static('public', { extensions: ['html'] }));

// paths
const DATA_DIR = path.join(process.cwd(), 'public', 'assets', 'data');
const LINEUPS  = path.join(DATA_DIR, 'lineups.json');
const TEAM_UPD = path.join(DATA_DIR, 'team-updates.json');

// utils
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

// health
app.get('/api/ping', (_req,res) => res.json({ ok:true }));

// GET lineups
app.get('/api/lineups', async (_req,res) => {
  const cur = await readJsonSafe(LINEUPS);
  res.json(cur);
});

// POST lineups + marca update por time
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


// NOVA ROTA — Atualizar horário manualmente via botão
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


// start
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`[painel] http://localhost:${PORT}`));
