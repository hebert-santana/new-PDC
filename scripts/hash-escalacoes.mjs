// scripts/hash-escalacoes.mjs
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import fg from "fast-glob";

// === paths robustos (local + Vercel) ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// public/assets/img/escalacoes
const PUBLIC_DIR = path.resolve(__dirname, "..", "public");
const ESC_DIR = path.resolve(PUBLIC_DIR, "assets", "img", "escalacoes");

// glob POSIX (fast-glob prefere '/')
const GLOB = path.posix.join(ESC_DIR.replace(/\\/g, "/"), "*.png");

// destino do manifest
const MANIFEST_PATH = path.resolve(ESC_DIR, "manifest.json");

// hash do arquivo (md5 curto) — pode trocar por sha1 se preferir
async function hashFile(filePath) {
  const buf = await fs.readFile(filePath);
  return crypto.createHash("md5").update(buf).digest("hex").slice(0, 10);
}

async function main() {
  // garante que a pasta existe
  await fs.mkdir(ESC_DIR, { recursive: true });

  const files = await fg(GLOB, { onlyFiles: true });
  const entries = [];

  for (const file of files) {
    const hash = await hashFile(file);
    const base = path.basename(file);           // ex.: "palmeiras.png"
    const key = base.replace(/\.png$/i, "");    // ex.: "palmeiras"
    entries.push([key, hash]);
  }

  // ordena por nome pra ficar estável no git
  entries.sort((a, b) => a[0].localeCompare(b[0]));

  // monta objeto { "palmeiras": "abc123...", ... }
  const manifest = Object.fromEntries(entries);

  // grava bonito
  await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf8");

  console.log(
    `[hash-escalacoes] ${entries.length} arquivo(s) processado(s). Manifest salvo em: ${MANIFEST_PATH}`
  );
}

main().catch((err) => {
  console.error("[hash-escalacoes] ERRO:", err);
  process.exit(1);
});
