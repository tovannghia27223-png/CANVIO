#!/usr/bin/env bash
# Provision pinned, free Three.js r187 + GLTF compression decoders locally.
# Run once before offline/static deployment: bash scripts/vendor-three-r187.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMMIT="7e89746a687bb88271253698fa108b1dd59825d0"
DRACO_LICENSE_REF="1.5.9"
BASIS_LICENSE_COMMIT="073eb6a0a34a23d77e75e54f41dcd9653a52da83"
MESHOPT_LICENSE_COMMIT="f0a684f11ead064e176775c9b796f82a55910e92"
REPO="https://github.com/mrdoob/three.js.git"
TMP="$(mktemp -d)"
DEST="$ROOT/assets/three"
STAGE="$ROOT/assets/.three-staging-$$"
cleanup(){ rm -rf "$TMP" "$STAGE"; }
trap cleanup EXIT

git init -q "$TMP/repo"
git -C "$TMP/repo" remote add origin "$REPO"
git -C "$TMP/repo" -c protocol.version=2 fetch --quiet --filter=blob:none --depth=1 origin refs/tags/r187
git -C "$TMP/repo" checkout --quiet --detach "$COMMIT"
git -C "$TMP/repo" sparse-checkout init --no-cone
cat > "$TMP/repo/.git/info/sparse-checkout" <<'PATHS'
/build/three.module.js
/build/three.core.js
/LICENSE
/examples/jsm/loaders/GLTFLoader.js
/examples/jsm/loaders/DRACOLoader.js
/examples/jsm/loaders/KTX2Loader.js
/examples/jsm/controls/OrbitControls.js
/examples/jsm/utils/BufferGeometryUtils.js
/examples/jsm/utils/SkeletonUtils.js
/examples/jsm/utils/WorkerPool.js
/examples/jsm/math/ColorSpaces.js
/examples/jsm/libs/meshopt_decoder.module.js
/examples/jsm/libs/ktx-parse.module.js
/examples/jsm/libs/zstddec.module.js
/examples/jsm/libs/draco/README.md
/examples/jsm/libs/draco/draco_decoder.js
/examples/jsm/libs/draco/draco_decoder.wasm
/examples/jsm/libs/draco/draco_wasm_wrapper.js
/examples/jsm/libs/draco/gltf/draco_decoder.js
/examples/jsm/libs/draco/gltf/draco_decoder.wasm
/examples/jsm/libs/draco/gltf/draco_wasm_wrapper.js
/examples/jsm/libs/basis/README.md
/examples/jsm/libs/basis/basis_transcoder.js
/examples/jsm/libs/basis/basis_transcoder.wasm
PATHS
# Reapply the exact sparse allowlist after writing it; without this step the checkout
# can remain empty/default-sparse and silently omit runtime/decoder files.
git -C "$TMP/repo" sparse-checkout reapply
actual="$(git -C "$TMP/repo" rev-parse HEAD)"
test "$actual" = "$COMMIT" || { echo "Unexpected Three.js commit: $actual" >&2; exit 1; }
rm -rf "$STAGE"
mkdir -p "$STAGE"
while IFS= read -r rel; do
  [[ -z "$rel" ]] && continue
  src="$TMP/repo/$rel"
  test -s "$src" || { echo "Missing pinned upstream file: $rel" >&2; exit 1; }
  mkdir -p "$STAGE/$(dirname "$rel")"
  cp "$src" "$STAGE/$rel"
done < "$TMP/repo/.git/info/sparse-checkout"
# Preserve complete upstream license texts for every included runtime/decoder.
mkdir -p "$STAGE/licenses"
curl --fail --location --silent --show-error --retry 3 --output "$STAGE/licenses/THREE-LICENSE-MIT.txt" "https://raw.githubusercontent.com/mrdoob/three.js/$COMMIT/LICENSE"
curl --fail --location --silent --show-error --retry 3 --output "$STAGE/licenses/DRACO-LICENSE-APACHE-2.0.txt" "https://raw.githubusercontent.com/google/draco/$DRACO_LICENSE_REF/LICENSE"
curl --fail --location --silent --show-error --retry 3 --output "$STAGE/licenses/BASIS-UNIVERSAL-LICENSE-APACHE-2.0.txt" "https://raw.githubusercontent.com/BinomialLLC/basis_universal/$BASIS_LICENSE_COMMIT/LICENSE"
curl --fail --location --silent --show-error --retry 3 --output "$STAGE/licenses/MESHOPT-LICENSE-MIT.txt" "https://raw.githubusercontent.com/zeux/meshoptimizer/$MESHOPT_LICENSE_COMMIT/LICENSE.md"
for license in "$STAGE"/licenses/*.txt; do test -s "$license"; done
# Rewrite every shipped examples/jsm bare package import to the local pinned build.
# These selected addon files are exactly three path segments below assets/three.
find "$STAGE/examples/jsm/loaders" "$STAGE/examples/jsm/controls" "$STAGE/examples/jsm/utils" "$STAGE/examples/jsm/math" -type f -name '*.js' -print0 | while IFS= read -r -d '' file; do
  sed -i -e "s/from 'three'/from '..\/..\/..\/build\/three.module.js'/g" -e 's/from "three"/from "..\/..\/..\/build\/three.module.js"/g' "$file"
done
if grep -R -nE "from ['\"]three['\"]" "$STAGE/examples/jsm"; then
  echo 'Unexpected bare three import remains in vendored addons.' >&2; exit 1
fi
cat > "$STAGE/THREE-VENDOR-NOTICE.md" <<NOTICE
# CANVIO local 3D runtime notice

- Three.js revision: r187
- Upstream commit: $COMMIT
- Source: https://github.com/mrdoob/three.js
- Three.js revision: r187; upstream commit: $COMMIT; license text: licenses/THREE-LICENSE-MIT.txt.
- Included addons: GLTFLoader, DRACOLoader, KTX2Loader, OrbitControls, BufferGeometryUtils, SkeletonUtils, WorkerPool and ColorSpaces.
- Included decoder licenses: Draco Apache-2.0 (`licenses/DRACO-LICENSE-APACHE-2.0.txt`); Basis Universal Apache-2.0 (`licenses/BASIS-UNIVERSAL-LICENSE-APACHE-2.0.txt`); Meshopt MIT (`licenses/MESHOPT-LICENSE-MIT.txt`).
- KTX parsing and Zstandard support are included from the pinned Three.js r187 source tree and covered by its vendor license notices.
- All runtime files are served from the same origin under assets/three. CANVIO does not load Three.js or decoders from a CDN.
NOTICE
node - "$STAGE" "$COMMIT" <<'NODE'
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=process.argv[2],commit=process.argv[3],files=[];
function walk(dir){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,ent.name);if(ent.isDirectory())walk(p);else if(ent.name!=='THREE-VENDOR-MANIFEST.json'){const b=fs.readFileSync(p);files.push({path:path.relative(root,p).split(path.sep).join('/'),bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')});}}}
walk(root);files.sort((a,b)=>a.path.localeCompare(b.path));
const manifest={format:'CANVIO_THREE_VENDOR_MANIFEST',revision:'r187',commit,license:'MIT plus upstream notices for decoder components',files};
fs.writeFileSync(path.join(root,'THREE-VENDOR-MANIFEST.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`Three.js r187 vendored: ${files.length} files; ${files.reduce((n,x)=>n+x.bytes,0)} bytes; commit ${commit}`);
NODE

# Commit only after every upstream file, license, import rewrite and SHA manifest passed.
bash "$ROOT/scripts/activate-vendor-tree.sh" "$STAGE" "$DEST"
