# cdn_teste.py
# Gera public/assets/data/mercado.images.json apontando para o CDN
# Uso:
#   python cdn_teste.py \
#     --cdn https://cdn.provaveisdocartola.com.br \
#     --src public/assets/data/mercado.json \
#     --dst public/assets/data/mercado.images.json
#
# Opcional: manifest com ids ausentes para cair no escudo
#     --miss public/assets/data/cdn_missing_ids.json
#
# Onde:
#   - atletas: {CDN}/atletas/{atleta_id}.webp
#   - escudos: {CDN}/escudos/{clube_id}.jpeg

import json
from pathlib import Path
import argparse

def main():
    ap = argparse.ArgumentParser(description="Gera mercado.images.json apontando para CDN")
    ap.add_argument("--cdn", required=True, help="Base do CDN (ex.: https://cdn.provaveisdocartola.com.br)")
    ap.add_argument("--src", default="public/assets/data/mercado.json", help="Arquivo mercado.json de entrada")
    ap.add_argument("--dst", default="public/assets/data/mercado.images.json", help="Arquivo de saída")
    ap.add_argument("--miss", default=None, help="JSON com lista de atleta_id sem foto no CDN (fallback para escudo)")
    ap.add_argument("--ath-ext", default=".webp", help="Extensão padrão das fotos de atletas no CDN (ex.: .webp)")
    ap.add_argument("--badge-ext", default=".jpg", help="Extensão dos escudos no CDN (ex.: .jpg)")
    args = ap.parse_args()

    cdn_base = args.cdn.rstrip("/")
    src = Path(args.src)
    dst = Path(args.dst)

    # Lista opcional de ids sem foto, para forçar fallback (escudo do clube)
    missing_ids = set()
    if args.miss:
        miss_file = Path(args.miss)
        if miss_file.exists():
            try:
                data_miss = json.loads(miss_file.read_text(encoding="utf-8"))
                # aceita lista [123, 456] ou dict {"123": true, "456": true}
                if isinstance(data_miss, list):
                    missing_ids = {int(x) for x in data_miss if str(x).isdigit()}
                elif isinstance(data_miss, dict):
                    missing_ids = {int(k) for k, v in data_miss.items() if v}
            except Exception:
                missing_ids = set()

    data = json.loads(src.read_text(encoding="utf-8"))
    atletas = data.get("atletas", [])

    out = []
    forced_badge = 0

    for a in atletas:
        aid = a.get("atleta_id")
        cid = a.get("clube_id")
        if not isinstance(aid, int) or not isinstance(cid, int):
            continue

        if aid in missing_ids:
            foto = f"{cdn_base}/escudos/{cid}{args.badge_ext}"
            forced_badge += 1
        else:
            foto = f"{cdn_base}/atletas/{aid}{args.ath_ext}"

        out.append({
            "atleta_id": aid,
            "apelido_abreviado": a.get("apelido_abreviado"),
            "clube_id": cid,
            "foto": foto,
            "media_num": a.get("media_num"),
            "preco_num": a.get("preco_num"),
            "posicao_id": a.get("posicao_id"),
        })

    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"OK: {dst} ({len(out)} atletas). Fallbacks (escudo): {forced_badge}")

if __name__ == "__main__":
    main()
