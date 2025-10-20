# build_mercado_images.py
import json
from pathlib import Path

# caminhos do projeto
SRC = Path("public/data/mercado.json")
DST = Path("public/data/mercado.images.json")

# onde estão as imagens físicas
ATH_DIR = Path("public/assets/img/atletas")           # ex.: public/assets/img/atletas/39148.jpeg
ESC_DIR = Path("public/assets/img/escudos/cartola")   # ex.: public/assets/img/escudos/cartola/282.jpeg

# URL pública correspondente (saída do JSON)
ATH_URL = "/assets/img/atletas"           # ex.: /assets/img/atletas/39148.jpeg
ESC_URL = "/assets/img/escudos/cartola"   # ex.: /assets/img/escudos/cartola/282.jpeg

# ordem de tentativa para atletas
EXTS = [".jpeg", ".jpg", ".png", ".webp"]

def athlete_url_or_badge(atleta_id: int, clube_id: int) -> str:
    # tenta achar a foto do atleta por extensão
    for ext in EXTS:
        p = ATH_DIR / f"{atleta_id}{ext}"
        if p.exists():
            return f"{ATH_URL}/{atleta_id}{ext}"
    # fallback: escudo do clube em JPEG
    return f"{ESC_URL}/{clube_id}.jpeg"

def main():
    data = json.loads(SRC.read_text(encoding="utf-8"))
    atletas = data.get("atletas", [])

    out = []
    miss = 0

    for a in atletas:
        aid = a.get("atleta_id")
        cid = a.get("clube_id")
        if not isinstance(aid, int) or not isinstance(cid, int):
            continue

        foto = athlete_url_or_badge(aid, cid)
        if not foto.startswith(ATH_URL):  # usou fallback
            miss += 1

        out.append({
            "atleta_id": aid,
            "apelido_abreviado": a.get("apelido_abreviado"),
            "clube_id": cid,
            "foto": foto,
            "media_num": a.get("media_num"),
            "preco_num": a.get("preco_num"),
            "posicao_id": a.get("posicao_id"),
        })

    DST.parent.mkdir(parents=True, exist_ok=True)
    DST.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Gerado {DST} com {len(out)} atletas. Fallbacks (escudo): {miss}")

if __name__ == "__main__":
    main()
