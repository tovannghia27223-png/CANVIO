#!/usr/bin/env bash
# Provision pinned, open-source P85 runtimes into same-origin assets/p85.
# Every heavy runtime is loaded only after an explicit user action in CANVIO.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="$(mktemp -d)"
DEST="$ROOT/assets/p85"
STAGE="$ROOT/assets/.p85-staging-$$"
cleanup(){ rm -rf "$TMP" "$STAGE"; }
trap cleanup EXIT

THREE_VERSION="0.187.0"
BVH_VERSION="0.9.18"
PATHTRACER_VERSION="0.0.28"
POSTPROCESSING_VERSION="6.39.6"
OPENCV_VERSION="5.0.0-release.1"
DOTLOTTIE_VERSION="0.83.2"
RIVE_VERSION="2.51.0"
ESBUILD_VERSION="0.28.2"
TRANSFORMERS_VERSION="3.8.1"

mkdir -p "$TMP/npm"
npm install --prefix "$TMP/npm" --no-save --no-package-lock --ignore-scripts --no-audit --no-fund \
  "three@$THREE_VERSION" \
  "three-mesh-bvh@$BVH_VERSION" \
  "three-gpu-pathtracer@$PATHTRACER_VERSION" \
  "postprocessing@$POSTPROCESSING_VERSION" \
  "@techstark/opencv-js@$OPENCV_VERSION" \
  "@lottiefiles/dotlottie-web@$DOTLOTTIE_VERSION" \
  "@rive-app/canvas@$RIVE_VERSION" \
  "@huggingface/transformers@$TRANSFORMERS_VERSION" \
  "esbuild@$ESBUILD_VERSION"

# Preserve the project-maintained AI notice across deterministic vendor refreshes.
if test -s "$DEST/AI-MODEL-NOTICES.md"; then cp "$DEST/AI-MODEL-NOTICES.md" "$TMP/AI-MODEL-NOTICES.md"; fi
rm -rf "$STAGE"
mkdir -p "$STAGE/opencv" "$STAGE/dotlottie" "$STAGE/rive" "$STAGE/transformers" "$STAGE/licenses"
if test -s "$TMP/AI-MODEL-NOTICES.md"; then cp "$TMP/AI-MODEL-NOTICES.md" "$STAGE/AI-MODEL-NOTICES.md"; fi
NODE_MODULES="$TMP/npm/node_modules"

# One local ESM renderer bundle contains WebGL postprocessing and experimental WebGPU path tracing.
"$NODE_MODULES/.bin/esbuild" "$ROOT/scripts/p85-renderers.entry.mjs" \
  --bundle --format=esm --platform=browser --target=es2022 --minify \
  --outfile="$STAGE/p85-renderers.js" --legal-comments=none

# OpenCV.js ships as a CommonJS/UMD Emscripten entry. Wrap/bundle it as a same-origin ESM
# module so the CANVIO player can await the exported module consistently in Chromium/Firefox.
"$NODE_MODULES/.bin/esbuild" "$ROOT/scripts/p85-opencv.entry.mjs" \
  --bundle --format=esm --platform=browser --target=es2022 --minify \
  --outfile="$STAGE/opencv/opencv.js" --legal-comments=inline
test "$(wc -c < "$STAGE/opencv/opencv.js")" -gt 1000000

# dotLottie requires its matching WASM runtime; no CDN or remote fallback is allowed.
DOT="$NODE_MODULES/@lottiefiles/dotlottie-web"
test -s "$DOT/dist/index.js"
test -s "$DOT/dist/dotlottie-player.wasm"
# Bundle the package's ESM graph to one same-origin file; wasm stays separately pinned.
"$NODE_MODULES/.bin/esbuild" "$DOT/dist/index.js" \
  --bundle --format=esm --platform=browser --target=es2022 --minify \
  --outfile="$STAGE/dotlottie/index.js" --legal-comments=inline
cp "$DOT/dist/dotlottie-player.wasm" "$STAGE/dotlottie/"
if test -s "$DOT/dist/dotlottie.worker.js"; then cp "$DOT/dist/dotlottie.worker.js" "$STAGE/dotlottie/"; fi

# Rive canvas renderer and matching WASM build.
RIVE="$NODE_MODULES/@rive-app/canvas"
test -s "$RIVE/rive.js"
test -s "$RIVE/rive.wasm"
cp "$RIVE/rive.js" "$STAGE/rive/"
cp "$RIVE/rive.wasm" "$STAGE/rive/"
if test -s "$RIVE/rive_fallback.wasm"; then cp "$RIVE/rive_fallback.wasm" "$STAGE/rive/"; fi

# Transformers.js 3.8.1 is bundled locally; model weights remain browser-downloaded
# from their Apache-2.0 Hugging Face model cards after the user starts an AI action.
TRANSFORMERS="$NODE_MODULES/@huggingface/transformers"
test -s "$TRANSFORMERS/dist/transformers.min.js"
cp "$TRANSFORMERS/dist/transformers.min.js" "$STAGE/transformers/transformers.min.js"
# ONNX Runtime Web selects one of these files for WASM execution depending on SIMD/JSEP support.
for f in "$TRANSFORMERS"/dist/ort-wasm*; do
  test -s "$f" || continue
  cp "$f" "$STAGE/transformers/"
done
for f in "$NODE_MODULES/onnxruntime-web/dist"/ort-wasm*; do
  test -s "$f" || continue
  cp "$f" "$STAGE/transformers/"
done
test -s "$STAGE/transformers/transformers.min.js"
test -n "$(find "$STAGE/transformers" -maxdepth 1 -type f -name 'ort-wasm*.wasm' -print -quit)"
test -n "$(find "$STAGE/transformers" -maxdepth 1 -type f -name 'ort-wasm*.mjs' -print -quit)"

# Retain full license/notice texts with the generated static package.
copy_license(){
  local src="$1" dest="$2"
  if test -s "$src"; then cp "$src" "$STAGE/licenses/$dest"; else echo "Missing license: $src" >&2; exit 1; fi
}
copy_license "$NODE_MODULES/three/LICENSE" "THREE-MIT.txt"
copy_license "$NODE_MODULES/three-mesh-bvh/LICENSE" "THREE-MESH-BVH-MIT.txt"
copy_license "$NODE_MODULES/three-gpu-pathtracer/LICENSE" "THREE-GPU-PATHTRACER-MIT.txt"
copy_license "$NODE_MODULES/postprocessing/LICENSE.md" "POSTPROCESSING-ZLIB.txt"
copy_license "$NODE_MODULES/@techstark/opencv-js/LICENSE" "OPENCV-APACHE-2.0.txt"
copy_license "$DOT/LICENSE" "DOTLOTTIE-MIT.txt"
copy_license "$RIVE/LICENSE" "RIVE-MIT.txt"
copy_license "$TRANSFORMERS/LICENSE" "TRANSFORMERS-APACHE-2.0.txt"

cat > "$STAGE/P85-VENDOR-NOTICE.md" <<NOTICE
# CANVIO P85 local runtime notice

All runtime files below are provisioned at build time, served same-origin, and loaded only after an explicit user action. No CDN fallback is enabled.

| Component | Pinned version | License |
|---|---:|---|
| Three.js | $THREE_VERSION | MIT |
| three-mesh-bvh | $BVH_VERSION | MIT |
| three-gpu-pathtracer | $PATHTRACER_VERSION | MIT |
| postprocessing | $POSTPROCESSING_VERSION | Zlib |
| @techstark/opencv-js | $OPENCV_VERSION | Apache-2.0 |
| @lottiefiles/dotlottie-web | $DOTLOTTIE_VERSION | MIT |
| @rive-app/canvas | $RIVE_VERSION | MIT |
| @huggingface/transformers | $TRANSFORMERS_VERSION | Apache-2.0 |

Transformers.js is self-hosted with ONNX Runtime WASM assets. Model weights remain remote and are downloaded from their model repositories only after a user explicitly runs the feature; current P102/P105/P80 model cards declare Apache-2.0.
Path tracing requires WebGPU and is experimental in three-gpu-pathtracer 0.0.28. The viewer falls back to the regular WebGL postprocessing workflow when WebGPU is unavailable; it never pretends to path trace on a WebGL renderer.
OpenCV optical-flow tracking is an explicit video-frame operation and can be computationally heavy. Users can stop it at any time.
Rive is a runtime/player, not an animation authoring editor. Exported assets may carry attribution/branding imposed by the upstream author's free export plan; CANVIO does not remove or bypass it.
NOTICE

node - "$STAGE" "$THREE_VERSION" "$BVH_VERSION" "$PATHTRACER_VERSION" "$POSTPROCESSING_VERSION" "$OPENCV_VERSION" "$DOTLOTTIE_VERSION" "$RIVE_VERSION" "$ESBUILD_VERSION" "$TRANSFORMERS_VERSION" <<'NODE'
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const [root, three, bvh, tracer, post, opencv, dotlottie, rive, esbuild, transformers] = process.argv.slice(2);
const files=[];
function walk(dir){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const abs=path.join(dir,ent.name);if(ent.isDirectory())walk(abs);else if(ent.name!=='P85-VENDOR-MANIFEST.json'){const buf=fs.readFileSync(abs);files.push({path:path.relative(root,abs).split(path.sep).join('/'),bytes:buf.length,sha256:crypto.createHash('sha256').update(buf).digest('hex')});}}}
walk(root);files.sort((a,b)=>a.path.localeCompare(b.path));
const manifest={format:'CANVIO_P85_VENDOR_MANIFEST',schemaVersion:1,generatedAt:new Date().toISOString(),packages:{three:{version:three,license:'MIT'},threeMeshBvh:{version:bvh,license:'MIT'},threeGpuPathtracer:{version:tracer,license:'MIT',requiresWebGPU:true,experimental:true},postprocessing:{version:post,license:'Zlib'},opencv:{version:opencv,license:'Apache-2.0'},dotLottie:{version:dotlottie,license:'MIT'},rive:{version:rive,license:'MIT'},transformers:{version:transformers,license:'Apache-2.0',modelsDownloaded:false},esbuild:{version:esbuild}},files};
fs.writeFileSync(path.join(root,'P85-VENDOR-MANIFEST.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`P85 local runtimes provisioned: ${files.length} files / ${files.reduce((n,x)=>n+x.bytes,0)} bytes`);
NODE

node - "$STAGE/P85-VENDOR-MANIFEST.json" <<'NODE'
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const file=process.argv[2],manifest=JSON.parse(fs.readFileSync(file,'utf8')),root=path.dirname(file);
for(const e of manifest.files){const b=fs.readFileSync(path.join(root,e.path));if(b.length!==e.bytes||crypto.createHash('sha256').update(b).digest('hex')!==e.sha256)throw new Error('P85 manifest mismatch: '+e.path)}
console.log('P85 vendor manifest SHA-256 verified:',manifest.files.length,'files');
NODE

# Activate only a complete, SHA-verified vendor tree; preserve the last good tree on failure.
bash "$ROOT/scripts/activate-vendor-tree.sh" "$STAGE" "$DEST"
