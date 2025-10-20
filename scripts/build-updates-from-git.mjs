// Gera public/data/team-updates.json lendo o último commit de cada imagem via Git.
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const IMG_DIR   = "public/assets/img/escalacoes";
const JSON_PATH = "public/data/team-updates.json";

function gitLastCommitISO(filePath){
  try {
    // %cI = data ISO do commit
    const iso = execSync(`git log -1 --format=%cI -- "${filePath}"`, {encoding:"utf8"}).trim();
    return iso || null;
  } catch { return null; }
}

function listImages(dir){
  return fs.readdirSync(dir)
    .filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f))
    .map(f => path.join(dir, f));
}

const teams = {};
for (const abs of listImages(IMG_DIR)) {
  const file = path.basename(abs);               // ex.: "ceara.png"
  const slug = file.replace(/\.(png|jpg|jpeg|webp)$/i, "");
  const iso  = gitLastCommitISO(abs);
  // fallback mtime local se repositório shallow sem histórico (raro)
  let last_update = iso;
  if (!last_update) {
    const st = fs.statSync(abs);
    const d  = new Date(st.mtime);
    const offMin = -d.getTimezoneOffset();
    const sign   = offMin >= 0 ? "+" : "-";
    const oh     = String(Math.floor(Math.abs(offMin)/60)).padStart(2,"0");
    const om     = String(Math.abs(offMin)%60).padStart(2,"0");
    last_update  = d.toISOString().replace("Z", `${sign}${oh}:${om}`);
  }
  teams[slug] = { last_update, alert: "" };
}

fs.mkdirSync(path.dirname(JSON_PATH), { recursive: true });
fs.writeFileSync(JSON_PATH, JSON.stringify({ version:1, tz:"-03:00", teams }, null, 2) + "\n", "utf8");
console.log(`OK: ${JSON_PATH} (${Object.keys(teams).length} times)`);
