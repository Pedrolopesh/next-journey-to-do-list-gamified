#!/usr/bin/env python3
"""Inventário das peças do gerador LPC para as páginas do laboratório "Roupas e acessórios" e
"Armas e acessórios". Lê as definições do gerador, resolve a licença de cada peça e gera
uma miniatura (corpo masculino + peça, de frente, quadro 1 da caminhada).

Uso (precisa do Pillow): LPC_GENERATOR=/caminho/Universal-LPC-Spritesheet-Character-Generator \
  python3 scripts/inventario-lpc.py
Gera lab/inventario-lpc.json e lab/inventory/<id>.png. Só dado de laboratório: nada disso
entra no pacote do banner nem do app.
"""
import json
import os
import re
import sys
from pathlib import Path

from PIL import Image

SRC = os.environ.get("LPC_GENERATOR")
if not SRC or not Path(SRC, "sheet_definitions").is_dir():
    sys.exit("Defina LPC_GENERATOR com a pasta do Universal-LPC-Spritesheet-Character-Generator")
os.chdir(SRC)

ROOT = Path(__file__).resolve().parent.parent
OUT_JSON = ROOT / "lab/inventario-lpc.json"
OUT_THUMBS = ROOT / "lab/inventory"
# Mesma regra do importador do personagem: só CC0, OGA-BY e CC-BY entram; CC-BY-SA e GPL ficam fora
ALLOWED = ["CC0", "OGA-BY 4.0", "OGA-BY 3.0", "CC-BY 4.0", "CC-BY 3.0"]
ROOTS = ["headwear", "arms", "torso", "legs", "feet", "weapons", "tools"]
FRAME = 64
DOWN_ROW = 2


def walk_sheet(base: str) -> Path | None:
    """Folha da caminhada: `<base>/walk.png`, ou o primeiro arquivo de `<base>/walk/`."""
    direct = Path("spritesheets", base, "walk.png")
    if direct.is_file():
        return direct
    folder = Path("spritesheets", base, "walk")
    if folder.is_dir():
        files = sorted(folder.glob("*.png"))
        if files:
            return files[0]
    return None


def frame(path: Path) -> Image.Image:
    sheet = Image.open(path).convert("RGBA")
    return sheet.crop((0, DOWN_ROW * FRAME, FRAME, (DOWN_ROW + 1) * FRAME))


def base_layers() -> list[tuple[int, Image.Image]]:
    layers = []
    for rel, z in (("body/bodies/male", 10), ("head/heads/human/male", 100)):
        sheet = walk_sheet(rel)
        if sheet:
            layers.append((z, frame(sheet)))
    return layers


BASE = base_layers()
items = []
OUT_THUMBS.mkdir(parents=True, exist_ok=True)

for root in ROOTS:
    for dirpath, _, files in os.walk(f"sheet_definitions/{root}"):
        for name in sorted(files):
            if not name.endswith(".json") or name.startswith("meta"):
                continue
            path = os.path.join(dirpath, name)
            data = json.load(open(path))
            if not isinstance(data, dict) or "layer_1" not in data:
                continue
            credits = data.get("credits", [])
            used = []
            ok = bool(credits)
            for credit in credits:
                pick = next((a for a in ALLOWED if a in credit.get("licenses", [])), None)
                if pick:
                    used.append(pick)
                else:
                    ok = False
            layers = [
                (v.get("zPos", 0), v["male"])
                for k, v in data.items()
                if re.fullmatch(r"layer_\d+", k)
                and isinstance(v, dict)
                and v.get("male")
                and "custom_animation" not in v
            ]
            sheets = [(z, walk_sheet(b.replace("${head}", "male").rstrip("/"))) for z, b in layers]
            sheets = [(z, s) for z, s in sheets if s]
            walks = bool(sheets)
            thumb = None
            item_id = re.sub(r"[^a-z0-9]+", "-", path.removeprefix("sheet_definitions/").removesuffix(".json").lower()).strip("-")
            if ok and walks:
                canvas = Image.new("RGBA", (FRAME, FRAME))
                for _, image in sorted(BASE + [(z, frame(s)) for z, s in sheets], key=lambda t: t[0]):
                    canvas.alpha_composite(image)
                canvas.save(OUT_THUMBS / f"{item_id}.png", optimize=True)
                thumb = f"{item_id}.png"
            group = os.path.relpath(dirpath, f"sheet_definitions/{root}")
            items.append(
                {
                    "id": item_id,
                    "root": root,
                    "group": "" if group == "." else group,
                    "name": data.get("name", name),
                    "free": ok,
                    "walk": walks,
                    "license": sorted(set(used)) if ok else sorted({l for c in credits for l in c.get("licenses", [])}),
                    "authors": sorted({a for c in credits for a in c.get("authors", [])}),
                    "thumb": thumb,
                }
            )

items.sort(key=lambda i: (i["root"], i["group"], i["name"]))
OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
OUT_JSON.write_text(json.dumps(items, ensure_ascii=False, separators=(",", ":")))
print(len(items), "peças;", sum(1 for i in items if i["thumb"]), "miniaturas")
