"""
After build_models.py: make WebP thumbnails and write the web catalogue.

  python tools/fitting-room/postprocess.py --models apps/web/public/models \
      --catalog-out apps/web/src/shop/catalog3d.json

Needs Pillow.
"""
import argparse
import glob
import json
import os
import shutil

from PIL import Image

p = argparse.ArgumentParser()
p.add_argument("--models", required=True)
p.add_argument("--catalog-out", required=True)
args = p.parse_args()

models = os.path.abspath(args.models)
manifest = json.load(open(os.path.join(models, "manifest.json"), encoding="utf-8"))
src = os.path.join(models, "_thumbs_src")
thumbs = os.path.join(models, "thumbs")
os.makedirs(thumbs, exist_ok=True)

for png in glob.glob(os.path.join(src, "*.png")):
    iid = os.path.splitext(os.path.basename(png))[0]
    im = Image.open(png).convert("RGBA")
    # MakeHuman thumbs are dark-background renders; flatten onto white for the shop cards
    bg = Image.new("RGBA", im.size, (255, 255, 255, 255))
    bg.alpha_composite(im)
    bg.convert("RGB").resize((256, 256), Image.LANCZOS).save(os.path.join(thumbs, f"{iid}.webp"), "WEBP", quality=82)
shutil.rmtree(src, ignore_errors=True)

items = []
for iid, e in manifest["items"].items():
    files = e.get("files", {})
    if "female" not in files or "male" not in files:
        print("skip (not built for both bodies):", iid, e.get("error", ""))
        continue
    items.append({
        "id": iid,
        "name": e["name"],
        "slot": e["slot"],
        "kind": e["kind"],
        "tucked": bool(e.get("tucked")),
        "author": e.get("author", ""),
        "license": e.get("license", ""),
        "thumb": f"/models/thumbs/{iid}.webp" if os.path.exists(os.path.join(thumbs, f"{iid}.webp")) else "",
    })

with open(args.catalog_out, "w", encoding="utf-8") as f:
    json.dump({"bodies": manifest["bodies"], "items": items}, f, indent=1, ensure_ascii=False)
total = sum(os.path.getsize(x) for x in glob.glob(os.path.join(models, "**", "*"), recursive=True) if os.path.isfile(x))
print(f"{len(items)} garments, models folder {total / 1e6:.1f} MB -> {args.catalog_out}")
