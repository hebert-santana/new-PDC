// scripts/build-updates-from-files.mjs
import fs from "fs";
import path from "path";

// Caminho das imagens de escalações
const IMG_DIR   = "public/assets/img/escalacoes";
// Caminho de saída do JSON
const JSON_PATH = "public/data/team-updates.json";

// Função que formata a data/hora no padrão ISO com fuso local (-03:00)
function toLocalISO(d) {
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, "0");
  const dd   = String(d.getDate()).padStart(2, "0");
  const hh   = String(d.getHours()).padStart(2, "0");
  const mi   = String(d.getMinutes()).padStart(2, "0");
  const ss   = String(d.getSeconds()).padStart(2, "0");

  const offMin = -d.getTimezoneOffset();
  const sign   = offMin >= 0 ? "+" : "-";
  const oh     = String(Math.floor(Math.abs(offMin) / 60)).padStart(2, "0");
  const om     = String(Math.abs(offMin) % 60).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}${sign}${oh}:${om}`;
}

// Monta o objeto com last_update por time
const teams = {};
for (const f of fs.readdirSync(IMG_DIR)) {
  if (!/\.(png|jpg|jpeg|webp)$/i.test(f)) continue;
  const slug = f.replace(/\.(png|jpg|jpeg|webp)$/i, "");
  const stat = fs.statSync(path.join(IMG_DIR, f));
  teams[slug] = { last_update: toLocalISO(stat.mtime), alert: "" };
}

// Cria pasta /public/data se não existir
fs.mkdirSync(path.dirname(JSON_PATH), { recursive: true });

// Escreve o JSON final
fs.writeFileSync(
  JSON_PATH,
  JSON.stringify({ version: 1, tz: "-03:00", teams }, null, 2) + "\n",
  "utf8"
);

console.log(`✅ Gerado ${JSON_PATH} com ${Object.keys(teams).length} times.`);
