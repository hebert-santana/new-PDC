// server.js
import express from 'express';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const app = express();
app.use(express.json());

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

// start
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`[painel] http://localhost:${PORT}`));
