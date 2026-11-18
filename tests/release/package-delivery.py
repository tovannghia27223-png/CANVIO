#!/usr/bin/env python3
"""Create a deterministic CANVIO delivery ZIP from the verified manifest."""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / 'CANVIO_MANIFEST.json'
EXCLUDED = {'.git', 'node_modules', '.venv', '__pycache__', '.pytest_cache', '.mypy_cache'}

def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', required=True, help='Output ZIP path')
    args = parser.parse_args()
    output = Path(args.output).resolve()
    if not MANIFEST.is_file():
        raise SystemExit('CANVIO_MANIFEST.json is missing; run build-manifest.py first.')
    subprocess.run([sys.executable, str(ROOT / 'tests/release/verify-manifest.py')], cwd=ROOT, check=True)
    data = json.loads(MANIFEST.read_text(encoding='utf-8'))
    names = ['CANVIO_MANIFEST.json'] + sorted(item['path'] for item in data['files'])
    if len(names) != len(set(names)):
        raise SystemExit('Duplicate file paths in delivery set.')
    output.parent.mkdir(parents=True, exist_ok=True)
    if output.exists():
        output.unlink()
    total_bytes = 0
    with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9, strict_timestamps=True) as archive:
        for rel in names:
            path = (ROOT / rel).resolve()
            if ROOT.resolve() not in path.parents or not path.is_file():
                raise SystemExit(f'Invalid/missing package path: {rel}')
            if any(part in EXCLUDED for part in Path(rel).parts) or path.suffix == '.pyc':
                raise SystemExit(f'Generated/cache file must not enter delivery manifest: {rel}')
            info = zipfile.ZipInfo(rel, date_time=(2026, 11, 18, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = (0o100644 & 0xFFFF) << 16
            info.create_system = 3
            raw = path.read_bytes()
            archive.writestr(info, raw, compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
            total_bytes += len(raw)
    with zipfile.ZipFile(output, 'r') as archive:
        bad = archive.testzip()
        if bad:
            raise SystemExit(f'ZIP CRC failure: {bad}')
        if len(archive.namelist()) != len(names):
            raise SystemExit('ZIP entry count differs from delivery set.')
    digest = sha256(output)
    sidecar = output.with_suffix(output.suffix + '.sha256')
    sidecar.write_text(f'{digest}  {output.name}\n', encoding='utf-8')
    print(json.dumps({
        'status': 'PASS', 'zip': str(output), 'zipSha256': digest,
        'entries': len(names), 'sourceBytes': total_bytes,
        'zipBytes': output.stat().st_size, 'crc': 'PASS',
        'sidecar': str(sidecar)
    }, indent=2))

if __name__ == '__main__':
    main()
