#!/usr/bin/env python3
"""P88 PPTX package/OOXML smoke for the existing Poster multi-page owner.
Uses an isolated about:blank fixture; it is not desktop PowerPoint/Google Slides acceptance.
"""
from __future__ import annotations
import base64
import json
import os
import re
import shutil
import tempfile
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
REPORT = Path(__file__).with_name('browser-smoke-report.json')
FIXTURE = Path(__file__).with_name('canvio-p88-synthetic-test.pptx')
EXPECTED_VERSION = '23.3.108-p85-studio-r2'
EXPECTED_TITLE = 'CANVIO 23.3.108 — Creative Runtime Lab · P85 Runtime Hardening r2'
# 2x2 PNG, embedded as data: URL so the smoke needs no remote image request.
PNG_1PX = 'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAALUlEQVR4nGN8HZDCQEvARFPTRy0YtWDUglELRi0YtWDUglELRi0YtWDUAioCADaEAd/p13lgAAAAAElFTkSuQmCC'
SHIM = r'''<script id="canvio-p88-test-storage-shim">(()=>{function make(){const m=new Map();return{get length(){return m.size},key(i){return Array.from(m.keys())[i]??null},getItem(k){return m.has(String(k))?m.get(String(k)):null},setItem(k,v){m.set(String(k),String(v))},removeItem(k){m.delete(String(k))},clear(){m.clear()}}}Object.defineProperty(window,'localStorage',{configurable:true,value:make()});Object.defineProperty(window,'sessionStorage',{configurable:true,value:make()});})();</script>'''
checks: list[dict] = []

def require(ok: bool, name: str, detail: str = '') -> None:
    if not ok:
        raise AssertionError(name + (': ' + detail if detail else ''))
    checks.append({'id': name, 'status': 'pass', 'detail': detail})
    print('PASS', name, detail)


def main() -> None:
    source = (ROOT / 'index.html').read_text(encoding='utf-8')
    source = re.sub(r'^(\s*<!doctype[^>]*>)', lambda m: m.group(1) + SHIM, source, count=1, flags=re.I)
    page_errors: list[str] = []
    console_errors: list[str] = []
    with sync_playwright() as p:
        executable = os.environ.get('CHROMIUM_EXECUTABLE_PATH') or shutil.which('chromium') or shutil.which('chromium-browser')
        browser = p.chromium.launch(headless=True, executable_path=executable, args=['--no-sandbox', '--disable-dev-shm-usage'])
        page = browser.new_page(viewport={'width': 1440, 'height': 1000}, accept_downloads=True)
        page.on('pageerror', lambda e: page_errors.append(str(e)))
        page.on('console', lambda m: console_errors.append(m.text[:500]) if m.type == 'error' else None)
        page.route('https://fonts.googleapis.com/**', lambda r: r.fulfill(status=200, content_type='text/css', body=''))
        page.route('https://fonts.gstatic.com/**', lambda r: r.fulfill(status=200, content_type='font/woff2', body=b''))
        page.set_content(source, wait_until='domcontentloaded', timeout=90000)
        page.wait_for_timeout(4500)
        version = page.evaluate('window.CANVIO_BUILD && CANVIO_BUILD.version')
        require(version == EXPECTED_VERSION, 'P88 latest candidate marker', str(version))
        require(page.title() == EXPECTED_TITLE, 'P88 candidate title remains stable', page.title())
        page.evaluate("CV.go('poster')")
        page.wait_for_timeout(500)
        require(page.locator('#cv-pptx2').count() == 1 and page.evaluate("typeof CVLot23.pptx === 'function'"), 'P88 uses the existing editable PPTX export action')
        seeded = page.evaluate('''(png) => {
          const d = JSON.parse(JSON.stringify(CV.poster.doc));
          d.id = 'p88-synthetic-document'; d.w = 960; d.h = 540;
          d.layers = [
            {id:'p88-title',type:'text',x:48,y:40,w:860,h:110,text:'CANVIO – Thuyết trình nhân sự Việt Nam',size:44,font:'Arial',weight:700,color:'#142d4e',align:'left'},
            {id:'p88-shape',type:'rect',x:48,y:180,w:350,h:190,bg:'#4f46e5',radius:12},
            {id:'p88-image',type:'image',src:'data:image/png;base64,'+png,x:480,y:180,w:250,h:190}
          ];
          CV.poster.setDoc(d);
          return {width:CV.poster.doc.w,height:CV.poster.doc.h,layers:CV.poster.doc.layers.length,pages:CVPages.pages.length};
        }''', PNG_1PX)
        require(seeded == {'width': 960, 'height': 540, 'layers': 3, 'pages': 1}, 'P88 seeds a 16:9 fixture through the canonical Poster owner', json.dumps(seeded))
        with page.expect_download(timeout=60000) as download_info:
            page.locator('#cv-pptx2').click()
        download = download_info.value
        with tempfile.TemporaryDirectory() as temp_dir:
            pptx_path = Path(temp_dir) / download.suggested_filename
            download.save_as(str(pptx_path))
            data = pptx_path.read_bytes()
            if os.environ.get('CANVIO_KEEP_OFFICE_FIXTURES'):
                shutil.copy2(pptx_path, FIXTURE)
            require(download.suggested_filename.endswith('.pptx') and data[:2] == b'PK', 'P88 downloadable PPTX is a ZIP-based Office package', f'{download.suggested_filename} · {len(data)} bytes')
            with zipfile.ZipFile(pptx_path) as archive:
                names = set(archive.namelist())
                require(archive.testzip() is None, 'P88 ZIP CRC and member integrity')
                required = {'[Content_Types].xml','_rels/.rels','ppt/presentation.xml','ppt/_rels/presentation.xml.rels','ppt/slides/slide1.xml','ppt/slides/_rels/slide1.xml.rels'}
                require(required.issubset(names), 'P88 contains core PowerPoint OOXML package parts', json.dumps(sorted(required - names)))
                xml_names = [n for n in names if n.endswith('.xml') or n.endswith('.rels')]
                roots = {n: ET.fromstring(archive.read(n)) for n in xml_names}
                slide = roots['ppt/slides/slide1.xml']
                ns = {
                    'p': 'http://schemas.openxmlformats.org/presentationml/2006/main',
                    'a': 'http://schemas.openxmlformats.org/drawingml/2006/main'
                }
                shapes = slide.findall('.//p:sp', ns)
                pics = slide.findall('.//p:pic', ns)
                texts = [node.text or '' for node in slide.findall('.//a:t', ns)]
                require(len(shapes) >= 2 and any('CANVIO' in t and 'Việt Nam' in t for t in texts), 'P88 keeps text as editable DrawingML text shapes', json.dumps({'shapes':len(shapes),'texts':texts}, ensure_ascii=False))
                require(len(pics) >= 1 and any(n.startswith('ppt/media/') for n in names), 'P88 keeps image content as a separate picture/media part', json.dumps({'pictures':len(pics),'media':[n for n in names if n.startswith('ppt/media/')]}))
                pres = roots['ppt/presentation.xml']
                size = pres.find('.//{http://schemas.openxmlformats.org/presentationml/2006/main}sldSz')
                require(size is not None and int(size.attrib['cx']) * 9 == int(size.attrib['cy']) * 16, 'P88 slide dimensions preserve the seeded 16:9 ratio', json.dumps(size.attrib if size is not None else {}))
                external = []
                for rel_name in [n for n in names if n.endswith('.rels')]:
                    rel_root = roots[rel_name]
                    external.extend([r.attrib for r in rel_root if r.attrib.get('TargetMode') == 'External'])
                require(not external, 'P88 package has no external linked relationship targets', json.dumps(external))
                require(len(xml_names) >= 8, 'P88 all discovered OOXML/XML parts parsed', f'{len(xml_names)} parts parsed')
        require(not page_errors, 'P88 browser has no uncaught application errors', json.dumps(page_errors[:5]))
        require(not console_errors, 'P88 browser has no console errors', json.dumps(console_errors[:5]))
        result = {
            'format':'CANVIO_P88_PPTX_OOXML_SMOKE', 'candidate':EXPECTED_VERSION,
            'browser':browser.version, 'origin':'about:blank', 'testOnlyStorageShim':True,
            'download':{'filename':download.suggested_filename,'bytes':len(data)},
            'checks':checks,'passed':len(checks),'total':len(checks),
            'status':'PASS_SYNTHETIC_OOXML_STRUCTURE_ONLY',
            'limitations':[
                'PPTX package was structurally parsed; it was not opened, edited, saved or re-opened in desktop PowerPoint, Keynote or Google Slides.',
                'Font substitution and slide rendering may differ across Office applications; no font embedding or font licensing verification is claimed.',
                'Complex animations/transitions and speaker notes are not accepted by this smoke.',
                'Test uses one synthetic 16:9 slide on about:blank with in-memory storage; not production project acceptance.'
            ]
        }
        REPORT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        browser.close()
    print(f'P88 PPTX OOXML smoke: {len(checks)}/{len(checks)} PASS')


if __name__ == '__main__':
    main()
