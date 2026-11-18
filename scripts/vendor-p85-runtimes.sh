#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="$(mktemp -d)"
DEST="$ROOT/assets/p85"
STAGE="$ROOT/assets/.p85-staging-$$"
cleanup(){ if test -L "$ROOT/node_modules" && test "$(readlink "$ROOT/node_modules")" = "$TMP/npm/node_modules"; then rm "$ROOT/node_modules"; fi; rm -rf "$TMP" "$STAGE"; }
trap cleanup EXIT
THREE_VERSION="0.187.0"; BVH_VERSION="0.9.18"; PATHTRACER_VERSION="0.0.28"; POSTPROCESSING_VERSION="6.39.6"
OPENCV_VERSION="5.0.0-release.1"; DOTLOTTIE_VERSION="0.83.2"; RIVE_VERSION="2.51.0"; ESBUILD_VERSION="0.28.2"; TRANSFORMERS_VERSION="3.8.1"
mkdir -p "$TMP/npm"
npm install --prefix "$TMP/npm" --no-save --no-package-lock --ignore-scripts --no-audit --no-fund \
 "three@$THREE_VERSION" "three-mesh-bvh@$BVH_VERSION" "three-gpu-pathtracer@$PATHTRACER_VERSION" \
 "postprocessing@$POSTPROCESSING_VERSION" "@techstark/opencv-js@$OPENCV_VERSION" \
 "@lottiefiles/dotlottie-web@$DOTLOTTIE_VERSION" "@rive-app/canvas@$RIVE_VERSION" \
 "@huggingface/transformers@$TRANSFORMERS_VERSION" "esbuild@$ESBUILD_VERSION"
if test -s "$DEST/AI-MODEL-NOTICES.md"; then cp "$DEST/AI-MODEL-NOTICES.md" "$TMP/AI-MODEL-NOTICES.md"; fi
rm -rf "$STAGE"; mkdir -p "$STAGE/opencv" "$STAGE/dotlottie" "$STAGE/rive" "$STAGE/transformers" "$STAGE/licenses"
if test -s "$TMP/AI-MODEL-NOTICES.md"; then cp "$TMP/AI-MODEL-NOTICES.md" "$STAGE/AI-MODEL-NOTICES.md"; fi
NODE_MODULES="$TMP/npm/node_modules"
if test -e "$ROOT/node_modules" || test -L "$ROOT/node_modules"; then echo "Refusing to overwrite existing $ROOT/node_modules" >&2; exit 1; fi
ln -s "$NODE_MODULES" "$ROOT/node_modules"
"$NODE_MODULES/.bin/esbuild" "$ROOT/scripts/p85-renderers.entry.mjs" --bundle --format=esm --platform=browser --target=es2022 --minify --outfile="$STAGE/p85-renderers.js" --legal-comments=none
"$NODE_MODULES/.bin/esbuild" "$ROOT/scripts/p85-opencv.entry.mjs" --bundle --format=esm --platform=browser --target=es2022 --minify --external:fs --external:crypto --outfile="$STAGE/opencv/opencv.js" --legal-comments=inline
test "$(wc -c < "$STAGE/opencv/opencv.js")" -gt 1000000
DOT="$NODE_MODULES/@lottiefiles/dotlottie-web"
test -s "$DOT/dist/index.js"; test -s "$DOT/dist/dotlottie-player.wasm"
"$NODE_MODULES/.bin/esbuild" "$DOT/dist/index.js" --bundle --format=esm --platform=browser --target=es2022 --minify --outfile="$STAGE/dotlottie/index.js" --legal-comments=inline
cp "$DOT/dist/dotlottie-player.wasm" "$STAGE/dotlottie/"
if test -s "$DOT/dist/dotlottie.worker.js"; then cp "$DOT/dist/dotlottie.worker.js" "$STAGE/dotlottie/"; fi
RIVE="$NODE_MODULES/@rive-app/canvas"
test -s "$RIVE/rive.js"; test -s "$RIVE/rive.wasm"; cp "$RIVE/rive.js" "$STAGE/rive/"; cp "$RIVE/rive.wasm" "$STAGE/rive/"
if test -s "$RIVE/rive_fallback.wasm"; then cp "$RIVE/rive_fallback.wasm" "$STAGE/rive/"; fi
TRANSFORMERS="$NODE_MODULES/@huggingface/transformers"
test -s "$TRANSFORMERS/dist/transformers.min.js"; cp "$TRANSFORMERS/dist/transformers.min.js" "$STAGE/transformers/transformers.min.js"
for f in "$TRANSFORMERS"/dist/ort-wasm* "$NODE_MODULES/onnxruntime-web/dist"/ort-wasm*; do test -s "$f" || continue; cp "$f" "$STAGE/transformers/"; done
test -n "$(find "$STAGE/transformers" -maxdepth 1 -type f -name 'ort-wasm*.wasm' -print -quit)"
test -n "$(find "$STAGE/transformers" -maxdepth 1 -type f -name 'ort-wasm*.mjs' -print -quit)"
copy_license(){
  local src="$1" dest="$2" found="" package_dir=""
  if test -s "$src"; then cp "$src" "$STAGE/licenses/$dest"; return 0; fi
  package_dir="$(dirname "$src")"
  found="$(find "$package_dir" -maxdepth 5 -type f \\( -iname 'LICENSE' -o -iname 'LICENSE.md' -o -iname 'LICENSE.txt' -o -iname 'COPYING' \\) -print -quit 2>/dev/null || true)"
  if test -n "$found" && test -s "$found"; then cp "$found" "$STAGE/licenses/$dest"; return 0; fi
  echo "Missing license file for vendored package: $package_dir" >&2
  return 1
}
copy_license "$NODE_MODULES/three/LICENSE" "THREE-MIT.txt"
copy_license "$NODE_MODULES/three-mesh-bvh/LICENSE" "THREE-MESH-BVH-MIT.txt"
copy_license "$NODE_MODULES/three-gpu-pathtracer/LICENSE" "THREE-GPU-PATHTRACER-MIT.txt"
copy_license "$NODE_MODULES/postprocessing/LICENSE.md" "POSTPROCESSING-ZLIB.txt"
copy_license "$NODE_MODULES/@techstark/opencv-js/LICENSE" "OPENCV-APACHE-2.0.txt"
copy_license "$DOT/LICENSE" "DOTLOTTIE-MIT.txt"
RIVE_LICENSE="$(find "$RIVE" -maxdepth 3 -type f \( -iname 'LICENSE' -o -iname 'LICENSE.md' -o -iname 'LICENSE.txt' -o -iname 'COPYING' \) -print -quit)"
if test -n "$RIVE_LICENSE"; then
  cp "$RIVE_LICENSE" "$STAGE/licenses/RIVE-LICENSE.txt"
else
  RIVE_LICENSE_ID="$(node -e "const p=require(process.argv[1]);process.stdout.write(String(p.license||''))" "$RIVE/package.json")"
  case "$RIVE_LICENSE_ID" in
    MIT)
      cat > "$STAGE/licenses/RIVE-MIT.txt" <<'RIVE_MIT'
MIT License

Copyright (c) 2020-2021 Rive

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
RIVE_MIT
      ;;
    *)
      echo "Cannot verify Rive license text or SPDX identifier: $RIVE_LICENSE_ID" >&2
      exit 1
      ;;
  esac
fi
copy_license "$TRANSFORMERS/LICENSE" "TRANSFORMERS-APACHE-2.0.txt"
cat > "$STAGE/P85-VENDOR-NOTICE.md" <<NOTICE
# CANVIO P85 local runtime notice
All runtimes are local and lazy-loaded after user action. No CDN fallback.
| Component | Version | License |
|---|---:|---|
| Three.js | $THREE_VERSION | MIT |
| three-mesh-bvh | $BVH_VERSION | MIT |
| three-gpu-pathtracer | $PATHTRACER_VERSION | MIT |
| postprocessing | $POSTPROCESSING_VERSION | Zlib |
| OpenCV.js | $OPENCV_VERSION | Apache-2.0 |
| dotLottie | $DOTLOTTIE_VERSION | MIT |
| Rive Canvas | $RIVE_VERSION | MIT |
| Transformers.js | $TRANSFORMERS_VERSION | Apache-2.0 |
Model weights remain explicit first-use downloads from Apache-2.0 model repositories. WebGPU path tracing is experimental. Rive is a runtime/player and does not bypass upstream free-plan attribution or export limits.
NOTICE
node - "$STAGE" "$THREE_VERSION" "$BVH_VERSION" "$PATHTRACER_VERSION" "$POSTPROCESSING_VERSION" "$OPENCV_VERSION" "$DOTLOTTIE_VERSION" "$RIVE_VERSION" "$ESBUILD_VERSION" "$TRANSFORMERS_VERSION" <<'NODE'
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const [root,three,bvh,tracer,post,opencv,dotlottie,rive,esbuild,transformers]=process.argv.slice(2),files=[];
function walk(dir){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const abs=path.join(dir,ent.name);if(ent.isDirectory())walk(abs);else if(ent.name!=='P85-VENDOR-MANIFEST.json'){const buf=fs.readFileSync(abs);files.push({path:path.relative(root,abs).split(path.sep).join('/'),bytes:buf.length,sha256:crypto.createHash('sha256').update(buf).digest('hex')});}}}
walk(root);files.sort((a,b)=>a.path.localeCompare(b.path));
const manifest={format:'CANVIO_P85_VENDOR_MANIFEST',schemaVersion:1,generatedAt:new Date().toISOString(),packages:{three:{version:three,license:'MIT'},threeMeshBvh:{version:bvh,license:'MIT'},threeGpuPathtracer:{version:tracer,license:'MIT',requiresWebGPU:true,experimental:true},postprocessing:{version:post,license:'Zlib'},opencv:{version:opencv,license:'Apache-2.0'},dotLottie:{version:dotlottie,license:'MIT'},rive:{version:rive,license:'MIT'},transformers:{version:transformers,license:'Apache-2.0',modelsDownloaded:false},esbuild:{version:esbuild}},files};
fs.writeFileSync(path.join(root,'P85-VENDOR-MANIFEST.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('P85 local runtimes provisioned: '+files.length+' files; '+files.reduce((n,x)=>n+x.bytes,0)+' bytes');
NODE
node - "$STAGE/P85-VENDOR-MANIFEST.json" <<'NODE'
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const file=process.argv[2],manifest=JSON.parse(fs.readFileSync(file,'utf8')),root=path.dirname(file);
for(const e of manifest.files){const b=fs.readFileSync(path.join(root,e.path));if(b.length!==e.bytes||crypto.createHash('sha256').update(b).digest('hex')!==e.sha256)throw new Error('P85 manifest mismatch: '+e.path);}
console.log('P85 vendor manifest SHA-256 verified: '+manifest.files.length+' files');
NODE
bash "$ROOT/scripts/activate-vendor-tree.sh" "$STAGE" "$DEST"
