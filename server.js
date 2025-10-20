// server.js
import express from 'express';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const app = express();
app.use(express.json());

// Sirva o painel e os assets locais
app.use(express.static('public', { extensions: ['html'] }));

const DATA_DIR = path.join(process.cwd(), 'public', 'assets', 'data');
const LINEUPS = path.join(DATA_DIR, 'lineups.json');

async function readJsonSafe(p) {
  try { return JSON.parse(await fs.readFile(p,'utf8')); }
  catch { return { updated_at:null, rodada:null, jogos:[] }; }
}

app.get('/api/lineups', async (req,res) => {
  const cur = await readJsonSafe(LINEUPS);
  res.json(cur);
});

app.post("/api/lineups", async (req, res) => {
  // aceita dois formatos:
  // A) { merge:true, teams:{ "corinthians_v2": {...} } }
  // B) { rodada, jogos }  // formato agregado
  const body = req.body || {};

  await fs.mkdir(DATA_DIR, { recursive: true });
  let cur = { version: 1, tz: "-03:00", teams: {} };
  try {
    cur = JSON.parse(await fs.readFile(LINEUPS, "utf8"));
  } catch {}

  if (body.teams && typeof body.teams === "object") {
    cur.teams = { ...(cur.teams || {}), ...body.teams };
  } else if (Number.isInteger(body.rodada) && Array.isArray(body.jogos)) {
    // mantém compatibilidade com formato antigo
    cur.rodada = body.rodada;
    cur.jogos = body.jogos;
  } else {
    return res.status(400).json({ ok: false, error: "payload inválido" });
  }

  cur.updated_at = new Date().toISOString();
  await fs.writeFile(LINEUPS, JSON.stringify(cur, null, 2));
  res.json({ ok: true, updated_at: cur.updated_at });
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`[painel] http://localhost:${PORT}`));
