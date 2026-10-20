#!/usr/bin/env python3
"""Inventário das peças do gerador LPC para as páginas do laboratório "Roupas e acessórios" e
"Armas e acessórios" (mais asas, caudas, próteses e orelhas). Lê as definições do gerador, resolve a licença de cada peça e gera
uma miniatura (corpo + peça, de frente, quadro 1 da caminhada; peça só de ataque usa o quadro 1 do ataque; peça só feminina ou infantil usa esse corpo). Peça bloqueada pela licença não ganha miniatura.

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
# Asas, caudas, próteses e orelhas ficam em pastas de corpo e rosto do gerador: entram como "extras"
EXTRAS = ["body/wings", "body/tails", "body/prostheses", "head/appendages", "head/furry_ears"]
# Barbas, bigodes, rosto e corpo especial: "mods" (modificadores). O corpo base, a sombra e a cadeira de rodas ficam de fora
MODS = ["hair/beards", "hair/mustaches", "body/special", "body/lizard", "body/wounds"]
# Pastas de cabelo e rosto que já entram por outro caminho
SKIP_DIRS = {"hair": {"beards", "mustaches"}, "head": {"appendages", "furry_ears"}}
# Fonte -> nome da raiz na página. Fontes com prefixo dão ao grupo o nome da pasta.
SOURCES = [(r, r) for r in ROOTS] + [(e, "extras") for e in EXTRAS] + [(m, "mods") for m in MODS] + [("head", "mods"), ("hair", "hair")]
PREFIXED = set(EXTRAS) | set(MODS)
FRAME = 64
DOWN_ROW = 2


# Tamanho do quadro de cada animação especial; as demais usam 64 px
CUSTOM_FRAME = {"walk_128": 128, "slash_128": 128, "slash_reverse_oversize": 192, "tool_whip": 192}
# Corpo usado na miniatura: o primeiro que a peça tem
BODY_ORDER = ["male", "female", "teen", "child", "muscular", "pregnant"]
# Animações padrão, da preferida à última opção (peças só de ataque ainda ganham prévia)
STD_ANIMS = ["walk", "idle", "slash", "shoot", "thrust", "spellcast"]


def first_png(base: str) -> Path | None:
    """Primeiro arquivo `.png` direto em `spritesheets/<base>/`, ou `spritesheets/<base>.png`."""
    folder = Path("spritesheets", base)
    if folder.is_dir():
        files = sorted(folder.glob("*.png"))
        if files:
            return files[0]
    single = Path("spritesheets", base + ".png")
    return single if single.is_file() else None


def std_sheet(base: str) -> tuple[int, Path] | None:
    """Folha de uma camada padrão: (posição na lista de animações, arquivo). Menor = melhor."""
    for rank, anim in enumerate(STD_ANIMS):
        direct = Path("spritesheets", base, anim + ".png")
        if direct.is_file():
            return rank, direct
        folder = Path("spritesheets", base, anim)
        if folder.is_dir():
            files = sorted(folder.glob("*.png"))
            if files:
                return rank, files[0]
    return None


def frame(path: Path, size: int) -> Image.Image:
    """Primeiro quadro da linha "de frente" (linha 3 de 4) de uma folha com quadros `size` x `size`."""
    sheet = Image.open(path).convert("RGBA")
    return sheet.crop((0, DOWN_ROW * size, size, (DOWN_ROW + 1) * size))


def base_layers(body: str) -> list[tuple[int, Image.Image]]:
    layers = []
    for rel, z in ((f"body/bodies/{body}", 10), (f"head/heads/human/{body}", 100)):
        sheet = std_sheet(rel)
        if sheet:
            layers.append((z, frame(sheet[1], FRAME)))
    return layers


BASES = {body: base_layers(body) for body in BODY_ORDER}


def pick_layers(data: dict) -> tuple[str, list[tuple[int, int, Path]]]:
    """Camadas da miniatura: (zPos, tamanho do quadro, arquivo), todas da mesma animação."""
    raw = [v for k, v in data.items() if re.fullmatch(r"layer_\d+", k) and isinstance(v, dict)]
    bodies = [b for b in BODY_ORDER if any(v.get(b) for v in raw)]
    if not bodies:
        return "male", []
    body = bodies[0]
    found = []  # (qualidade, zPos, tamanho, arquivo)
    for v in raw:
        base = (v.get(body) or "").replace("${head}", body).rstrip("/")
        if not base:
            continue
        custom = v.get("custom_animation")
        if custom:
            path = first_png(base)
            if path:
                found.append((0 if custom == "walk_128" else 5, v.get("zPos", 0), CUSTOM_FRAME.get(custom, FRAME), path))
        else:
            sheet = std_sheet(base)
            if sheet:
                found.append((sheet[0], v.get("zPos", 0), FRAME, sheet[1]))
    if not found:
        return body, []
    best = min(f[0] for f in found)
    return body, [(z, size, path) for q, z, size, path in found if q == best]


items = []
OUT_THUMBS.mkdir(parents=True, exist_ok=True)

# Corpo base sem peça: fundo dos cartões de peça bloqueada pela licença (sem miniatura)
body_only = Image.new("RGBA", (FRAME, FRAME))
for _, image in sorted(BASES["male"], key=lambda t: t[0]):
    body_only.alpha_composite(image)
body_only.save(OUT_THUMBS / "_corpo.png", optimize=True)

for source, root in SOURCES:
    for dirpath, dirnames, files in os.walk(f"sheet_definitions/{source}"):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS.get(source, set())]
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
                # "OGA-BY 3.0+" vale como "3.0 ou mais nova": a versão 3.0 serve
                licenses = [l.removesuffix("+") for l in credit.get("licenses", [])]
                pick = next((a for a in ALLOWED if a in licenses), None)
                if pick:
                    used.append(pick)
                else:
                    ok = False
            body, sheets = pick_layers(data)
            walks = bool(sheets)
            thumb = None
            item_id = re.sub(r"[^a-z0-9]+", "-", path.removeprefix("sheet_definitions/").removesuffix(".json").lower()).strip("-")
            # Peça bloqueada pela licença não ganha miniatura: o arquivo não deve ser redistribuído
            if ok and walks:
                size = max(FRAME, *(s for _, s, _ in sheets))
                canvas = Image.new("RGBA", (size, size))
                offset = (size - FRAME) // 2
                layers = [(z, base_img, offset) for z, base_img in BASES[body]]
                layers += [(z, frame(f, s), (size - s) // 2) for z, s, f in sheets]
                for _, image, off in sorted(layers, key=lambda t: t[0]):
                    canvas.alpha_composite(image, (off, off))
                canvas.save(OUT_THUMBS / f"{item_id}.png", optimize=True)
                thumb = f"{item_id}.png"
            group = os.path.relpath(dirpath, f"sheet_definitions/{source}")
            if source in PREFIXED:
                group = os.path.basename(source) + ("" if group == "." else "/" + group)
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
