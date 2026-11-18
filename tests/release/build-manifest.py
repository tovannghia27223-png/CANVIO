#!/usr/bin/env python3
"""Build a deterministic SHA-256 manifest for a CANVIO delivery directory."""
from __future__ import annotations
import argparse, hashlib, json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / 'CANVIO_MANIFEST.json'

def sha(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('--candidate', default='23.3.108-p85-studio-r2')
    ap.add_argument('--base', default='23.3.107-p107-preset-v2-r2')
    ap.add_argument('--release-base', default='23.3.84-p70')
    args = ap.parse_args()
    index = ROOT / 'index.html'
    files = []
    for path in sorted(ROOT.rglob('*')):
        if not path.is_file() or path == MANIFEST:
            continue
        rel = path.relative_to(ROOT).as_posix()
        files.append({'path': rel, 'bytes': path.stat().st_size, 'sha256': sha(path)})
    data = {
        'format': 'CANVIO_DELIVERY_MANIFEST',
        'schemaVersion': 1,
        'application': 'CANVIO',
        'candidate': args.candidate,
        'phaseSuite': '70.0.0',
        'base': args.base,
        'releaseBase': args.release_base,
        'phaseRange': 'P68-P70 inherited; P71-P84 integrated or bounded as listed in Roadmap; P85 Creative Runtime Lab integrated with hosted vendor provisioning; runtime/hardware acceptance pending; P86-P107 integrated or bounded as listed in Roadmap; P108 not specified',
        'generatedAt': '2026-11-18',
        'hashAlgorithm': 'SHA-256',
        'indexSha256': sha(index),
        'indexBytes': index.stat().st_size,
        'fileCount': len(files),
        'files': files,
    }
    MANIFEST.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'candidate': args.candidate, 'indexSha256': data['indexSha256'], 'indexBytes': data['indexBytes'], 'fileCount': len(files)}, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
