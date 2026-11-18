#!/usr/bin/env python3
"""Verify the CANVIO manifest against every packaged file except itself."""
from __future__ import annotations
import hashlib, json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / 'CANVIO_MANIFEST.json'
def sha(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as f:
        for block in iter(lambda: f.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()
def main() -> None:
    data = json.loads(MANIFEST.read_text(encoding='utf-8'))
    entries = data.get('files')
    if not isinstance(entries, list): raise SystemExit('Manifest files[] missing')
    seen = set(); errors = []
    for item in entries:
        rel = item.get('path')
        if not rel or rel in seen: errors.append(f'duplicate/empty path: {rel!r}'); continue
        seen.add(rel)
        path = (ROOT / rel).resolve()
        if ROOT.resolve() not in path.parents: errors.append(f'path escapes package: {rel}'); continue
        if not path.is_file(): errors.append(f'missing: {rel}'); continue
        if path.stat().st_size != item.get('bytes'): errors.append(f'byte mismatch: {rel}')
        if sha(path) != item.get('sha256'): errors.append(f'SHA-256 mismatch: {rel}')
    index = ROOT / 'index.html'
    if sha(index) != data.get('indexSha256'): errors.append('indexSha256 mismatch')
    if index.stat().st_size != data.get('indexBytes'): errors.append('indexBytes mismatch')
    actual = {p.relative_to(ROOT).as_posix() for p in ROOT.rglob('*') if p.is_file() and p != MANIFEST}
    if actual != seen:
        errors.extend(f'unmanifested: {x}' for x in sorted(actual-seen))
        errors.extend(f'not found in package: {x}' for x in sorted(seen-actual))
    if len(entries) != data.get('fileCount'): errors.append('fileCount mismatch')
    if errors:
        print('\n'.join(errors), file=sys.stderr); raise SystemExit(1)
    print(f"MANIFEST PASS: {len(entries)}/{len(entries)} files verified; index {data['indexSha256']}")
if __name__ == '__main__': main()
