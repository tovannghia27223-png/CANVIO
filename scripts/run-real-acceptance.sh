#!/usr/bin/env bash
# CANVIO — one-command runtime acceptance for a machine WITH internet (Node >= 22, Python 3, Chrome/Chromium).
# Runs only what a networked machine can truly verify: vendor provisioning, manifests, runtime smokes.
# It never fabricates results: any failing step is recorded as FAIL, skipped steps as NOT_RUN.
# Usage:  bash scripts/run-real-acceptance.sh        (from the repo root)
set -uo pipefail
cd "$(dirname "$0")/.."
OUT=evidence/real-acceptance; mkdir -p "$OUT"; REPORT="$OUT/run-$(date +%Y%m%d-%H%M%S).tsv"
: > "$REPORT"
step() { # step <name> <command...>
  local n="$1"; shift
  if "$@" >"$OUT/$n.log" 2>&1; then echo -e "$n\tPASS" | tee -a "$REPORT"
  else echo -e "$n\tFAIL (see $OUT/$n.log)" | tee -a "$REPORT"; fi
}
skip() { echo -e "$1\tNOT_RUN ($2)" | tee -a "$REPORT"; }

step 00-network        bash -c 'node -e "fetch(\"https://registry.npmjs.org/three/0.187.0\").then(r=>{if(!r.ok)process.exit(1)})"'
step 00b-pins-exist   bash -c 'set -e; for p in three@0.187.0 three-mesh-bvh@0.9.18 three-gpu-pathtracer@0.0.28 postprocessing@6.39.6 @techstark/opencv-js@5.0.0-release.1 @lottiefiles/dotlottie-web@0.83.2 @rive-app/canvas@2.51.0 @huggingface/transformers@3.8.1 esbuild@0.28.2; do v=$(npm view "$p" version 2>/dev/null) || { echo "MISSING PIN: $p"; bad=1; }; done; [ -z "${bad:-}" ]'
step 01-vendor-three   bash scripts/vendor-three-r187.sh
step 02-vendor-p85     bash scripts/vendor-p85-runtimes.sh
[ -s assets/three/THREE-VENDOR-MANIFEST.json ] || skip 03-p74-smoke "vendor manifest missing"
[ -s assets/p85/P85-VENDOR-MANIFEST.json ]     || skip 04-p85-smoke "vendor manifest missing"
if python3 -c "import playwright" 2>/dev/null; then
  [ -s assets/three/THREE-VENDOR-MANIFEST.json ] && step 03-p74-smoke python3 tests/p74-p81/run-p74-p81-browser-smoke.py
  [ -s assets/p85/P85-VENDOR-MANIFEST.json ]     && step 04-p85-smoke python3 tests/p85/run-p85-vendor-runtime-smoke.py
else skip 03-04-browser-smokes "pip install playwright && playwright install chromium"; fi
step 05-p74-contract   node tests/p74-p81/run-p74-p81-contract-tests.cjs
step 06-p85-contract   node tests/p85/run-p85-contract-tests.cjs
step 07-worker-contract node tests/p102-p105/run-worker-contract-tests.cjs
step 08-p107-zip       node tests/p102-p105/run-p107-portable-preset-tests.cjs
step 09-static-audit   python3 -I tests/release/run-static-audit.py
step 10-manifest       python3 tests/release/build-manifest.py

# Gates that need hardware / people — listed so they are never silently counted as passed.
skip 11-p80-p102-p105-inference "open index.html over https/localhost, click each model loader, test fixtures per CANVIO_REAL_ACCEPTANCE_RUNBOOK.md"
skip 12-p106-physical-gpu       "open on a machine with a real GPU; check chrome://gpu is not SwiftShader"
skip 13-p107-two-devices        "export ZIP on device A, import on device B (runbook section 4)"
skip 14-p70-fourteen-gates      "manual evidence; releaseCertified stays false until attached"
echo; echo "Report: $REPORT"; cat "$REPORT"
