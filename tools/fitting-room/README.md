# Fitting room 3D models

The fitting room's mannequins and garments are built from MakeHuman assets with
Blender + MPFB2. Output goes to `apps/web/public/models/` and the shop reads
`apps/web/src/shop/catalog3d.json`.

## Rebuild or add garments

1. Install Blender 4.2+ and the MPFB extension (Extensions → MPFB, or
   `blender --command extension install-file -r user_default -e add-on-mpfb-*.zip`).
2. Download the MakeHuman asset pack zips you need into one folder
   (`makehuman_system_assets` is required; clothing packs from
   https://static.makehumancommunity.org/assets/assetpacks/index.html).
3. Add garments to `catalog.json`: `asset` is the clothes folder name inside the
   pack, `slot` is where it is worn (`top`, `outer`, `bottom`, `dress`, `shoes`,
   `hat`), `kind` is the shop category.
4. Build, then post-process:

   ```
   blender -b --python tools/fitting-room/build_models.py -- --packs <zip folder> --out apps/web/public/models --max-tex 768
   python tools/fitting-room/postprocess.py --models apps/web/public/models --catalog-out apps/web/src/shop/catalog3d.json
   ```

   Add `--only <asset>,<asset>` to rebuild just some garments.

Each garment becomes `<female|male>/<id>.glb` (Draco mesh, WebP textures),
fitted and posed on that body. Credits (author, licence) are read from each
asset and shown in the fitting room; CC-BY assets must keep that credit.
