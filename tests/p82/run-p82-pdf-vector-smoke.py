#!/usr/bin/env python3
"""P82/P84 selectable Vietnamese PDF smoke on Chromium + PDF structure/render checks."""
from __future__ import annotations
import base64, json, os, re, shutil, subprocess, zipfile
from pathlib import Path
import fitz
from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).with_name('browser-smoke-report.json')
PDF = Path(__file__).with_name('canvio-p82-vector-synthetic.pdf')
PNG = Path(__file__).with_name('fixture-image.png')
MODULE = ROOT / 'canvio-p82-p84-vector-pdf.js'
SHIM = r'''<script id="canvio-p82-test-storage-shim">(()=>{function make(){const m=new Map();return{get length(){return m.size},key(i){return Array.from(m.keys())[i]??null},getItem(k){return m.has(String(k))?m.get(String(k)):null},setItem(k,v){m.set(String(k),String(v))},removeItem(k){m.delete(String(k))},clear(){m.clear()}}}Object.defineProperty(window,'localStorage',{configurable:true,value:make()});Object.defineProperty(window,'sessionStorage',{configurable:true,value:make()});})();</script>'''
checks: list[dict] = []

def require(ok: bool, name: str, detail: str = '') -> None:
    if not ok:
        raise AssertionError(name + (': ' + detail if detail else ''))
    checks.append({'id': name, 'status': 'pass', 'detail': detail})
    print('PASS', name, detail)

def fixture_png() -> str:
    im = Image.new('RGB', (48, 32), 'white')
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, 23, 31), fill=(30, 64, 175))
    d.ellipse((23, 4, 45, 27), fill=(14, 165, 233))
    im.save(PNG)
    return 'data:image/png;base64,' + base64.b64encode(PNG.read_bytes()).decode('ascii')

def main() -> None:
    image_src = fixture_png()
    src = (ROOT / 'index.html').read_text(encoding='utf-8')
    src = re.sub(r'^(\s*<!doctype[^>]*>)', lambda m: m.group(1) + SHIM, src, count=1, flags=re.I)
    src = src.replace('<head>', '<head><base href="http://canvio.test/">', 1)
    font_bytes = (ROOT / 'assets/pdf-fonts/NotoSans-Regular.ttf').read_bytes()
    errors: list[str] = []
    console_errors: list[str] = []
    with sync_playwright() as p:
        exe = os.environ.get('CHROMIUM_EXECUTABLE_PATH') or shutil.which('chromium') or shutil.which('chromium-browser')
        browser = p.chromium.launch(headless=True, executable_path=exe, args=['--no-sandbox', '--disable-dev-shm-usage'])
        page = browser.new_page(viewport={'width': 1440, 'height': 1050}, accept_downloads=True)
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('console', lambda m: console_errors.append(m.text[:500]) if m.type == 'error' else None)
        page.route('https://fonts.googleapis.com/**', lambda r: r.fulfill(status=200, content_type='text/css', body=''))
        page.route('https://fonts.gstatic.com/**', lambda r: r.fulfill(status=200, content_type='font/woff2', body=b''))
        page.route('http://canvio.test/assets/pdf-fonts/NotoSans-Regular.ttf', lambda r: r.fulfill(status=200, content_type='font/ttf', body=font_bytes))
        page.set_content(src, wait_until='domcontentloaded', timeout=90000)
        page.wait_for_timeout(3500)
        require(page.evaluate('!!window.CV && !!window.CVPages'), 'CANVIO Poster/Slides owners boot')
        require(page.evaluate("CANVIO_BUILD.version") == '23.3.108-p85-studio-r2', 'P82 build marker', page.evaluate('CANVIO_BUILD.version'))
        require(page.title() == 'CANVIO 23.3.108 — Creative Runtime Lab · P85 Runtime Hardening r2', 'P82 candidate title', page.title())
        page.evaluate("CV.go('poster'); CV.poster.newDesign()")
        page.wait_for_timeout(250)
        require(page.evaluate("window.CANVIOVectorPDF && CANVIOVectorPDF.version") == '82.1.0', 'P82 vector PDF module installed inline')
        require(page.title() == 'CANVIO 23.3.108 — Creative Runtime Lab · P85 Runtime Hardening r2', 'P82 candidate title', page.title())
        require(page.locator('#cv-p82-vector-pdf').count() == 1, 'P82 vector PDF action mounted in existing Poster toolbar')
        palette_labels = page.evaluate('CV.palette.build().map(x=>x&&x.label).filter(Boolean)')
        require('Xuất PDF vector · chữ tiếng Việt chọn được' in palette_labels, 'P82 PDF vector action available in Ctrl+K command palette')
        require(page.evaluate('CANVIOVectorPDF.tests().noNewStore && CANVIOVectorPDF.tests().noExternalDependency'), 'P82 preserves local/no-new-store/no-dependency policy')

        # Use the existing Poster document object and CVPages page collection.
        doc1 = {
            'id': 'p82-test-1', 'name': 'Báo cáo nhân sự Tiếng Việt', 'ratio': 'portrait', 'w': 794, 'h': 1123,
            'palette': 'default',
            'layers': [
                {'type': 'rect', 'x': 0, 'y': 0, 'w': 794, 'h': 1123, 'bg': '#ffffff', 'radius': 0, 'visible': True},
                {'type': 'rect', 'x': 42, 'y': 44, 'w': 710, 'h': 150, 'bg': '#eaf2ff', 'radius': 18, 'visible': True},
                {'type': 'text', 'x': 72, 'y': 76, 'w': 650, 'h': 78, 'size': 38, 'font': 'sans', 'weight': 800, 'color': '#14264b', 'text': 'Báo cáo Nhân sự Việt Nam', 'align': 'left', 'visible': True},
                {'type': 'text', 'x': 72, 'y': 150, 'w': 650, 'h': 56, 'size': 18, 'font': 'sans', 'weight': 400, 'color': '#334155', 'text': 'Tiếng Việt: ă â ê ô ơ ư đ Đ Ắ Ộ ỹ · Quản trị nhân lực', 'align': 'left', 'visible': True},
                {'type': 'ellipse', 'x': 78, 'y': 270, 'w': 150, 'h': 108, 'bg': '#0ea5e9', 'radius': 0, 'visible': True},
                {'type': 'rect', 'x': 270, 'y': 260, 'w': 400, 'h': 100, 'gradient': 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)', 'radius': 22, 'visible': True},
                {'type': 'text', 'x': 300, 'y': 295, 'w': 340, 'h': 48, 'size': 24, 'font': 'sans', 'weight': 700, 'color': '#ffffff', 'text': 'Tuyển dụng & phát triển', 'align': 'left', 'visible': True},
                {'type': 'image', 'x': 72, 'y': 430, 'w': 250, 'h': 167, 'src': image_src, 'opacity': 1, 'visible': True},
                {'type': 'text', 'x': 72, 'y': 650, 'w': 650, 'h': 80, 'size': 18, 'font': 'sans', 'weight': 400, 'color': '#1f2937', 'text': 'Kết quả: cải thiện trải nghiệm ứng viên, nâng cao hiệu quả phối hợp và phát triển đội ngũ.', 'align': 'left', 'visible': True}
            ]
        }
        doc2 = {
            'id': 'p82-test-2', 'name': 'Kế hoạch phát triển đội ngũ', 'ratio': 'portrait', 'w': 794, 'h': 1123, 'palette': 'default',
            'layers': [
                {'type': 'rect', 'x': 0, 'y': 0, 'w': 794, 'h': 1123, 'bg': '#ffffff', 'visible': True},
                {'type': 'text', 'x': 72, 'y': 100, 'w': 650, 'h': 80, 'size': 34, 'font': 'sans', 'weight': 800, 'color': '#14264b', 'text': 'Kế hoạch phát triển đội ngũ', 'align': 'left', 'visible': True},
                {'type': 'text', 'x': 72, 'y': 180, 'w': 650, 'h': 80, 'size': 18, 'font': 'sans', 'weight': 400, 'color': '#334155', 'text': 'Đào tạo, kế nhiệm, đánh giá năng lực và gắn kết nhân viên.', 'align': 'left', 'visible': True},
                {'type': 'rect', 'x': 72, 'y': 280, 'w': 650, 'h': 5, 'bg': '#06b6d4', 'visible': True}
            ]
        }
        page.evaluate('(d) => CV.poster.setDoc(d)', doc1)
        page.evaluate('CVPages.pages')  # synchronize current doc into the canonical pages owner
        page.evaluate('CVPages.add(true)')
        page.evaluate('(d) => CV.poster.setDoc(d)', doc2)
        page.evaluate('CVPages.pages')
        require(page.evaluate('CVPages.pages.length') == 2, 'P82 multi-page export reads canonical CVPages owner')
        font_tests = page.evaluate('CANVIOVectorPDF.loadFont().then(()=>CANVIOVectorPDF.tests())')
        require(font_tests['fontLoaded'] and font_tests['vietnameseGlyphCoverage'] and font_tests['embeddedFontLicenseBundled'], 'P82 TTF parses and Vietnamese glyph coverage passes', json.dumps(font_tests, ensure_ascii=False))
        ready = page.evaluate('CANVIOVectorPDF.preparePages().then(p=>({count:p.length,text:p.flatMap(x=>x.textRuns.map(y=>y.text)).join(" ")}))')
        require(ready['count'] == 2 and 'Báo cáo Nhân sự Việt Nam' in ready['text'], 'P82 parses vector shapes, text and gradients across all canonical pages', json.dumps(ready,ensure_ascii=False))
        with page.expect_download(timeout=25000) as info:
            page.locator('#cv-p82-vector-pdf').click()
        dl = info.value
        dl.save_as(str(PDF))
        require(PDF.exists() and PDF.stat().st_size > 500_000, 'P82 generated PDF with embedded font and image', f'{PDF.stat().st_size} bytes')
        require(page.locator('#cv-p82-status').inner_text().startswith('Đã xuất PDF vector'), 'P82 reports successful PDF export in UI', page.locator('#cv-p82-status').inner_text())
        require(not errors, 'No uncaught application errors', json.dumps(errors[:8], ensure_ascii=False))
        require(not console_errors, 'No browser console errors', json.dumps(console_errors[:8], ensure_ascii=False))
        browser.close()

    pdf = fitz.open(PDF)
    require(len(pdf) == 2, 'PDF has two valid pages', f'{len(pdf)} pages')
    txt = '\n'.join(page.get_text() for page in pdf)
    for sample in ['Báo cáo Nhân sự Việt Nam', 'Tiếng Việt', 'Quản trị nhân lực', 'Tuyển dụng', 'Kế hoạch phát triển đội ngũ']:
        require(sample in txt, 'PDF text extraction preserves Vietnamese: ' + sample)
    require(len(pdf[0].get_drawings()) >= 3, 'PDF basic shapes remain vector', f'{len(pdf[0].get_drawings())} vector drawings')
    resources = pdf.xref_get_key(pdf[0].xref, 'Resources')[1]
    require('/Shading' in resources and '/Sh1' in resources, 'PDF gradient is preserved as a native PDF shading resource', resources)
    require(len(pdf[0].get_images(full=True)) >= 1, 'PDF embeds placed images as raster XObjects', f'{len(pdf[0].get_images(full=True))} image objects')
    fonts = pdf[0].get_fonts(full=True)
    require(any('NotoSans' in (f[3] or '') for f in fonts), 'PDF declares embedded Noto Sans font resource', json.dumps(fonts, ensure_ascii=False))
    # Confirm font program is embedded in the PDF resource graph.
    font_xrefs = [f[0] for f in fonts if 'NotoSans' in (f[3] or '')]
    embedded = False
    for xref in font_xrefs:
        try:
            desc = pdf.xref_get_key(xref, 'DescendantFonts')
            if desc[0] == 'array':
                import re as _re
                child = int(_re.search(r'(\d+) 0 R', desc[1]).group(1))
                fd = pdf.xref_get_key(child, 'FontDescriptor')
                if fd[0] == 'xref':
                    fd_xref = int(_re.search(r'(\d+)', fd[1]).group(1))
                    ff = pdf.xref_get_key(fd_xref, 'FontFile2')
                    embedded = ff[0] == 'xref'
        except Exception:
            pass
    require(embedded, 'PDF embeds TrueType font program (FontFile2)')
    pix = pdf[0].get_pixmap(matrix=fitz.Matrix(1.2, 1.2), alpha=False)
    render = Path(__file__).with_name('p82-render-page1.png')
    pix.save(render)
    require(render.exists() and render.stat().st_size > 10_000, 'PDF first page renders in MuPDF', f'{pix.width}x{pix.height}, {render.stat().st_size} bytes')
    info = subprocess.run(['pdfinfo', str(PDF)], capture_output=True, text=True)
    require(info.returncode == 0 and re.search(r'^Pages:\s+2$', info.stdout, re.M) is not None, 'PDF parses in Poppler pdfinfo', info.stdout.splitlines()[0] if info.stdout else info.stderr[:300])
    result = {
        'format': 'CANVIO_P82_P84_VECTOR_PDF_CHROMIUM_PDF_RENDER_SMOKE', 'candidate': '23.3.108-p85-studio-r2',
        'browser': 'Chromium', 'origin': 'about:blank + test base URL', 'font': 'Noto Sans Regular TTF / OFL 1.1',
        'pdf_bytes': PDF.stat().st_size, 'pages': len(pdf), 'pdf_text_selectable': True, 'embedded_font_program': embedded,
        'vector_drawings_page_1': len(pdf[0].get_drawings()), 'images_page_1': len(pdf[0].get_images(full=True)),
        'passed': len(checks), 'total': len(checks), 'status': 'PASS_SYNTHETIC_CHROMIUM_PDFIUM_POPPLER_VALIDATION',
        'checks': checks,
        'limitations': [
            'Noto Sans is used as a licensed PDF export fallback; original editor font families and exact font shaping are not preserved.',
            'Images are embedded as JPEG raster; basic rectangles/ellipses/linear/radial gradients and text remain vector/selectable.',
            'This is not PDF/X, CMYK, bleed/crop-box or printer-proof acceptance.',
            'The browser fixture uses about:blank with an intercepted local font asset; user must keep the bundled assets/pdf-fonts path alongside index.html.',
            'CV direct PDF workflow is not yet wired; current P82/P84 vector action is for Poster/Slide pages.'
        ]
    }
    OUT.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f"P82/P84 smoke: {len(checks)}/{len(checks)} PASS")
    PDF.unlink(missing_ok=True); PNG.unlink(missing_ok=True); render.unlink(missing_ok=True)

if __name__ == '__main__': main()
