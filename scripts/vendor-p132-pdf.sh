#!/usr/bin/env bash
# Provision a pinned, same-origin PDF.js runtime. No runtime CDN requests.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="6.5.438"
TMP="$(mktemp -d)"
STAGE="$ROOT/assets/.pdfjs-staging-$$"
DEST="$ROOT/assets/vendor/pdfjs"
cleanup(){ rm -rf "$TMP" "$STAGE"; }
trap cleanup EXIT

mkdir -p "$TMP/npm" "$STAGE"
npm pack "pdfjs-dist@$VERSION" --silent --pack-destination "$TMP/npm" >/dev/null
TARBALL="$(find "$TMP/npm" -maxdepth 1 -name 'pdfjs-dist-*.tgz' -print -quit)"
test -n "$TARBALL"
tar -xzf "$TARBALL" -C "$TMP"
PKG="$TMP/package"

test -s "$PKG/build/pdf.mjs"
test -s "$PKG/build/pdf.worker.mjs"
test -s "$PKG/LICENSE"
test -d "$PKG/cmaps"
test -d "$PKG/standard_fonts"

cp "$PKG/build/pdf.mjs" "$STAGE/pdf.mjs"
cp "$PKG/build/pdf.worker.mjs" "$STAGE/pdf.worker.mjs"
cp "$PKG/LICENSE" "$STAGE/LICENSE.txt"
cp -R "$PKG/cmaps" "$STAGE/cmaps"
cp -R "$PKG/standard_fonts" "$STAGE/standard_fonts"

cat > "$STAGE/NOTICE.md" <<NOTICE
# PDF.js runtime

- Package: pdfjs-dist
- Pinned version: $VERSION
- License: Apache-2.0
- Runtime: locally hosted, same-origin lazy-loaded files
- Upstream: https://github.com/mozilla/pdf.js
- This package is provisioned by scripts/vendor-p132-pdf.sh. Do not edit generated runtime files by hand.
NOTICE

node - "$STAGE" "$VERSION" <<'NODE'
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=process.argv[2],version=process.argv[3],files=[];
function walk(dir){
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    const full=path.join(dir,ent.name);
    if(ent.isDirectory())walk(full);
    else{
      const data=fs.readFileSync(full);
      files.push({path:path.relative(root,full).split(path.sep).join('/'),bytes:data.length,sha256:crypto.createHash('sha256').update(data).digest('hex')});
    }
  }
}
walk(root);files.sort((a,b)=>a.path.localeCompare(b.path));
const manifest={format:'CANVIO_PDFJS_VENDOR_MANIFEST',version,package:'pdfjs-dist',license:'Apache-2.0',runtime:'same-origin-lazy-loaded',hashAlgorithm:'SHA-256',files};
fs.writeFileSync(path.join(root,'PDFJS-VENDOR-MANIFEST.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('PDF.js',version,'vendored:',files.length,'files');
NODE

mkdir -p "$(dirname "$DEST")"
rm -rf "$DEST.previous"
if test -d "$DEST"; then mv "$DEST" "$DEST.previous"; fi
if mv "$STAGE" "$DEST"; then rm -rf "$DEST.previous"; else
  rm -rf "$DEST"
  if test -d "$DEST.previous"; then mv "$DEST.previous" "$DEST"; fi
  exit 1
fi
echo "PDF.js $VERSION staged and activated at assets/vendor/pdfjs"
