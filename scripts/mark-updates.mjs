// scripts/mark-updates.mjs
import fs from "fs";
import { execSync } from "child_process";

// ONDE SALVAR O JSON (serve em /data/team-updates.json)
const JSON_PATH = "public/data/team-updates.json";

// ONDE ESTÃO AS IMAGENS VERSIONADAS NO GIT
const IMG_DIR   = "public/assets/img/escalacoes";   // <— ajuste principal

function nowISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  const hh   = String(d.getHours()).padStart(2, '0');
  const mi   = String(d.getMinutes()).padStart(2, '0');
  const ss   = String(d.getSeconds()).padStart(2, '0');
  const offMin = -d.getTimezoneOffset();
  const sign   = offMin >= 0 ? '+' : '-';
  const ohh    = String(Math.floor(Math.abs(offMin) / 60)).padStart(2, '0');
  const omm    = String(Math.abs(offMin) % 60).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}${sign}${ohh}:${omm}`;
}

// somente arquivos adicionados/modificados e já “staged”
const changed = execSync('git diff --name-only --cached --diff-filter=AM', { encoding: "utf8" })
  .split("\n")
  .map(s => s.trim())
  .filter(Boolean)
  .filter(p => p.startsWith(`${IMG_DIR}/`))
  .filter(p => /\.(jpg|jpeg|png|webp)$/i.test(p));

if (!changed.length) process.exit(0);

let data;
try {
  data = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
} catch {
  data = { version: 1, tz: "-03:00", teams: {} };
}
if (!data.teams) data.teams = {};

let touched = 0;
for (const p of changed) {
  const file = p.split("/").pop();                // ex.: "fluminense.png"
  const slug = file.replace(/\.(jpg|jpeg|png|webp)$/i, "");
  if (!slug) continue;
  if (!data.teams[slug]) data.teams[slug] = { last_update: "" };
  data.teams[slug].last_update = nowISO();
  touched++;
}

if (touched) {
  fs.mkdirSync("public/data", { recursive: true });
  fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + "\n", "utf8");
  execSync(`git add ${JSON_PATH}`);
  console.log(`Atualizados ${touched} time(s) em ${JSON_PATH}.`);
}
