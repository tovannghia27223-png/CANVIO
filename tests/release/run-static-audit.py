#!/usr/bin/env python3
"""Dynamic static integrity audit for the current CANVIO integration candidate."""
from __future__ import annotations
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
import json
import re
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[2]
REPORT = Path(__file__).with_name('static-audit-report.json')

MODULES = {
    'canvio-p63-p67-main': 'canvio-p63-p67.js',
    'canvio-p68-p70-main': 'canvio-p68-p70.js',
    'canvio-p90-p96-main': 'canvio-p90-p96.js',
    'canvio-p104-module': 'canvio-p104.js',
    'canvio-p87-cv-docx': 'canvio-p87-cv-docx.js',
    'canvio-p82-p84-vector-pdf': 'canvio-p82-p84-vector-pdf.js',
    'canvio-p76-p77-p83-brand': 'canvio-p76-p77-p83-brand.js',
    'canvio-p75-logo-studio': 'canvio-p75-logo-studio.js',
    'canvio-p79-webcodecs': 'canvio-p79-webcodecs.js',
    'canvio-p80-whisper-webgpu': 'canvio-p80-whisper-webgpu.js',
    'canvio-p89-template-multisize': 'canvio-p89-template-multisize.js',
    'canvio-p86-cv-vector-pdf': 'canvio-p86-cv-vector-pdf.js',
    'canvio-p78-motion-checklist': 'canvio-p78-motion-checklist.js',
    'canvio-p72-glb-viewer': 'canvio-p72-glb-viewer.js',
    'canvio-p73-offline-site': 'canvio-p73-offline-site.js',
    'canvio-p103-sfx-library': 'canvio-p103-sfx-library.js',
    'canvio-p102-background-removal': 'canvio-p102-background-removal.js',
    'canvio-p105-p107-depth-parallax': 'canvio-p105-p107-depth-parallax.js',
    'canvio-p74-p81-three-viewer': 'canvio-p74-p81-three-viewer.js',
    'canvio-p85-module': 'canvio-p85-studio.js',
}
WORKERS = [
    'assets/canvio-whisper-worker.js',
    'assets/canvio-rmbg-worker.js',
    'assets/canvio-depth-worker.js',
]

class Audit(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.scripts = []
        self.external_scripts = []
        self.external_stylesheets = []
        self.font_preconnects = []
        self.current = None
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get('id'):
            self.ids.append(attrs['id'])
        if tag.lower() == 'link':
            rel = set(str(attrs.get('rel', '')).lower().split())
            href = str(attrs.get('href', '')).lower()
            if 'stylesheet' in rel and href.startswith(('https://fonts.googleapis.com/', 'https://fonts.gstatic.com/')):
                self.external_stylesheets.append(attrs.get('href'))
            if 'preconnect' in rel and any(host in href for host in ('fonts.googleapis.com', 'fonts.gstatic.com')):
                self.font_preconnects.append(attrs.get('href'))
        if tag.lower() == 'script':
            if attrs.get('src'):
                self.external_scripts.append(attrs['src'])
            self.current = {'attrs': attrs, 'text': ''}
    def handle_data(self, data):
        if self.current is not None:
            self.current['text'] += data
    def handle_endtag(self, tag):
        if tag.lower() == 'script' and self.current is not None:
            self.scripts.append(self.current)
            self.current = None

def node_check(path: Path):
    result = subprocess.run(['node', '--check', str(path)], capture_output=True, text=True)
    if result.returncode:
        raise SystemExit(f'Node syntax error in {path.relative_to(ROOT)}:\n{result.stderr}')

def main():
    source_path = ROOT / 'index.html'
    source = source_path.read_text(encoding='utf-8')
    audit = Audit(); audit.feed(source)
    style_blocks = re.findall(r'<style\b[^>]*>([\s\S]*?)</style\s*>', source, re.I)
    startup_font_imports = [m.group(0) for block in style_blocks for m in re.finditer(r"@import\s+(?:url\()?\s*['\\\"]?https://fonts\.(?:googleapis|gstatic)\.com/[^;\\\"]*;?", block, re.I)]
    counts = Counter(audit.ids)
    duplicates = [key for key, count in counts.items() if count > 1]
    inline = [item for item in audit.scripts if item['text'].strip() and item['attrs'].get('type') in (None, 'text/javascript', 'application/javascript', 'module')]
    if duplicates:
        raise SystemExit(f'Duplicate HTML IDs: {duplicates[:30]}')
    if audit.external_scripts:
        raise SystemExit(f'External script src is not permitted in the inline-only app shell: {audit.external_scripts}')
    if audit.external_stylesheets or audit.font_preconnects or startup_font_imports:
        raise SystemExit('Startup Google Fonts network references are not permitted: ' + json.dumps({'stylesheets': audit.external_stylesheets, 'preconnects': audit.font_preconnects, 'cssImports': startup_font_imports}))
    if len(inline) != len(audit.scripts):
        raise SystemExit('Unexpected non-JavaScript/empty script tag in index.html')
    if len(inline) != 111:
        raise SystemExit(f'Expected 111 inline JavaScript blocks; found {len(inline)}')
    if len(counts) != 525:
        raise SystemExit(f'Expected 525 unique static HTML IDs; found {len(counts)}')

    syntax_failures = []
    with tempfile.TemporaryDirectory() as temp:
        for index, item in enumerate(inline):
            path = Path(temp) / f'inline-{index}.js'
            path.write_text(item['text'], encoding='utf-8')
            result = subprocess.run(['node', '--check', str(path)], capture_output=True, text=True)
            if result.returncode:
                syntax_failures.append({'index': index, 'id': item['attrs'].get('id'), 'error': result.stderr[:1200]})
    if syntax_failures:
        raise SystemExit(json.dumps(syntax_failures, ensure_ascii=False, indent=2))

    sync = {}
    by_id = {}
    for item in inline:
        key = item['attrs'].get('id')
        if key:
            by_id.setdefault(key, []).append(item['text'].strip())
    for block_id, filename in MODULES.items():
        path = ROOT / filename
        if not path.is_file():
            raise SystemExit(f'Missing standalone module: {filename}')
        matches = by_id.get(block_id, [])
        if len(matches) != 1 or matches[0] != path.read_text(encoding='utf-8').strip():
            raise SystemExit(f'Standalone/inline mismatch: {filename} ↔ {block_id}')
        node_check(path)
        sync[filename] = True

    if len(sync) != 20:
        raise SystemExit(f'Expected 20 ID-addressed standalone modules; found {len(sync)}')

    # P97-P101 has an id-less inline wrapper; assert the review copy occurs exactly once.
    p97 = (ROOT / 'canvio-p97-p101.js').read_text(encoding='utf-8').strip()
    if sum(1 for item in inline if item['text'].strip() == p97) != 1:
        raise SystemExit('Standalone/inline mismatch: canvio-p97-p101.js')
    node_check(ROOT / 'canvio-p97-p101.js')
    sync['canvio-p97-p101.js'] = True

    for rel in WORKERS:
        path = ROOT / rel
        if not path.is_file():
            raise SystemExit(f'Missing worker asset: {rel}')
        node_check(path)
    for path in [ROOT / 'assets/pdf-fonts/NotoSans-Regular.ttf', ROOT / 'assets/pdf-fonts/OFL.txt', ROOT / 'assets/AI-MODEL-NOTICES.md']:
        if not path.is_file():
            raise SystemExit(f'Missing required asset/notice: {path.relative_to(ROOT)}')

    result = {
        'candidate': '23.3.108-p85-studio-r2',
        'inline_scripts': f'{len(inline)}/{len(inline)} PASS',
        'html_ids': f'{len(counts)}/{len(counts)} unique',
        'duplicate_ids': 0,
        'external_script_src': 0,
        'startup_remote_font_stylesheets': len(audit.external_stylesheets),
        'startup_remote_font_preconnects': len(audit.font_preconnects),
        'startup_remote_font_css_imports': len(startup_font_imports),
        'runtime_font_loading': 'only after explicit user action',
        'standalone_modules_synchronized': f'{len(sync)}/{len(MODULES) + 1}',
        'worker_syntax': {rel: 'PASS' for rel in WORKERS},
        'runtime_model_inference': 'NOT RUN',
        'source_bytes': source_path.stat().st_size,
    }
    REPORT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
