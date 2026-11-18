#!/usr/bin/env python3
"""Optional local LibreOffice Writer/Impress open-edit-save-reopen acceptance.
Uses the synthetic outputs produced by the P87/P88 Chromium smoke tests.
Does not claim Microsoft Office or Google Workspace compatibility.
"""
from __future__ import annotations
import json, os, shutil, socket, subprocess, sys, tempfile, time, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OFFICE = Path(__file__).resolve().parent
FIX = OFFICE / 'roundtrip'
REPORT = OFFICE / 'libreoffice-roundtrip-report.json'
MARKER_DOC = 'CANVIO Writer round-trip verified'
MARKER_PPT = 'P88 LO OK'
PORT = 2017

sys.path.insert(0, '/usr/lib/python3/dist-packages')
try:
    import uno
except Exception as exc:
    raise SystemExit(f'Python UNO binding unavailable: {exc}')


def prop(name, value):
    p = uno.createUnoStruct('com.sun.star.beans.PropertyValue')
    p.Name = name
    p.Value = value
    return p


def wait_for_desktop(resolver, ctx, timeout=20):
    end = time.time() + timeout
    last = None
    while time.time() < end:
        try:
            remote = resolver.resolve(f'uno:socket,host=127.0.0.1,port={PORT};urp;StarOffice.ComponentContext')
            desktop = remote.ServiceManager.createInstanceWithContext('com.sun.star.frame.Desktop', remote)
            return remote, desktop
        except Exception as e:
            last = e
            time.sleep(.25)
    raise RuntimeError(f'LibreOffice UNO connection timed out: {last}')


def load(desktop, path):
    url = uno.systemPathToFileUrl(str(path.resolve()))
    doc = desktop.loadComponentFromURL(url, '_blank', 0, (prop('Hidden', True), prop('ReadOnly', False), prop('UpdateDocMode', 3)))
    if doc is None:
        raise RuntimeError(f'LibreOffice failed to open {path.name}')
    return doc, url


def save(doc, url, filter_name):
    doc.storeAsURL(url, (prop('FilterName', filter_name), prop('Overwrite', True)))


def close(doc):
    try:
        doc.close(True)
    except Exception:
        doc.dispose()


def writer_roundtrip(desktop, path):
    doc, url = load(desktop, path)
    initial = doc.getText().getString()
    assert 'Nguyễn Thị An' in initial and 'Quản trị nhân lực' in initial, 'DOCX Vietnamese content missing after import'
    text = doc.getText()
    cursor = text.createTextCursor()
    cursor.gotoEnd(False)
    text.insertString(cursor, '\n' + MARKER_DOC, False)
    save(doc, url, 'Office Open XML Text')
    close(doc)
    reopened, _ = load(desktop, path)
    final = reopened.getText().getString()
    close(reopened)
    assert MARKER_DOC in final, 'DOCX marker not present after save and reopen'
    assert 'Nguyễn Thị An' in final, 'DOCX Vietnamese text lost after round-trip'
    return {'opened': True, 'edited': True, 'saved': True, 'reopened': True, 'markerPreserved': MARKER_DOC in final, 'vietnamesePreserved': 'Nguyễn Thị An' in final, 'textLength': len(final)}


def impress_roundtrip(desktop, path):
    doc, url = load(desktop, path)
    pages = doc.getDrawPages()
    assert pages.getCount() >= 1, 'PPTX has no slide after import'
    page = pages.getByIndex(0)
    shape = doc.createInstance('com.sun.star.drawing.TextShape')
    point = uno.createUnoStruct('com.sun.star.awt.Point'); point.X = 15000; point.Y = 10500
    size = uno.createUnoStruct('com.sun.star.awt.Size'); size.Width = 8000; size.Height = 1000
    shape.setPosition(point); shape.setSize(size)
    page.add(shape)
    shape.setString(MARKER_PPT)
    assert shape.getString() == MARKER_PPT, 'Impress UNO TextShape edit was not applied before save'
    save(doc, url, 'Impress MS PowerPoint 2007 XML')
    close(doc)
    reopened, _ = load(desktop, path)
    pages2 = reopened.getDrawPages()
    assert pages2.getCount() >= 1, 'PPTX slide lost after round-trip'
    page2 = pages2.getByIndex(0)
    texts = []
    for i in range(page2.getCount()):
        obj = page2.getByIndex(i)
        try:
            value = obj.getString()
            if value:
                texts.append(value)
        except Exception:
            pass
    slide_count = pages2.getCount()
    close(reopened)
    assert any(MARKER_PPT in t for t in texts), 'PPTX edit marker not present after save/reopen'
    assert any('CANVIO' in t and 'Việt Nam' in t for t in texts), 'Original Vietnamese slide title lost after round-trip'
    return {'opened': True, 'edited': True, 'saved': True, 'reopened': True, 'markerPreserved': any(MARKER_PPT in t for t in texts), 'originalVietnameseTitlePreserved': any('CANVIO' in t and 'Việt Nam' in t for t in texts), 'slideCount': slide_count, 'textShapes': len(texts)}


def main():
    soffice = shutil.which('libreoffice') or shutil.which('soffice')
    if not soffice:
        raise SystemExit('LibreOffice not found')
    source_docx = ROOT / 'tests/p87/canvio-p87-synthetic-test.docx'
    source_pptx = ROOT / 'tests/p88/canvio-p88-synthetic-test.pptx'
    if not source_docx.exists() or not source_pptx.exists():
        raise SystemExit('Run P87/P88 browser smoke with CANVIO_KEEP_OFFICE_FIXTURES=1 before this optional round-trip.')
    # Start each run from clean browser-generated fixtures, avoiding cumulative QA marker edits.
    shutil.copy2(source_docx, FIX / 'CANVIO_P87_roundtrip.docx')
    shutil.copy2(source_pptx, FIX / 'CANVIO_P88_roundtrip.pptx')
    profile = Path(tempfile.mkdtemp(prefix='canvio-lo-profile-'))
    cmd = [soffice, '--headless', f'-env:UserInstallation={profile.as_uri()}', f'--accept=socket,host=127.0.0.1,port={PORT};urp;StarOffice.ServiceManager', '--norestore', '--nodefault', '--nofirststartwizard']
    process = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    results = {}
    try:
        local_ctx = uno.getComponentContext()
        resolver = local_ctx.ServiceManager.createInstanceWithContext('com.sun.star.bridge.UnoUrlResolver', local_ctx)
        remote, desktop = wait_for_desktop(resolver, local_ctx)
        lo_version = subprocess.check_output([soffice, '--version'], text=True).strip()
        results['LibreOffice'] = f'{lo_version}; Writer + Impress UNO'
        results['P87_DOCX_Writer_roundtrip'] = writer_roundtrip(desktop, FIX / 'CANVIO_P87_roundtrip.docx')
        results['P88_PPTX_Impress_roundtrip'] = impress_roundtrip(desktop, FIX / 'CANVIO_P88_roundtrip.pptx')
        results['status'] = 'PASS_LIBREOFFICE_OPEN_EDIT_SAVE_REOPEN_ONLY'
    finally:
        try:
            process.terminate(); process.wait(timeout=8)
        except Exception:
            process.kill()
        shutil.rmtree(profile, ignore_errors=True)
    # Validate saved Office ZIPs after the UNO round-trip.
    for name in ['CANVIO_P87_roundtrip.docx', 'CANVIO_P88_roundtrip.pptx']:
        path = FIX / name
        with zipfile.ZipFile(path) as z:
            bad = z.testzip()
            if bad: raise RuntimeError(f'{name} CRC error: {bad}')
            results.setdefault('post_save_zip_crc', {})[name] = 'PASS'
    REPORT.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(results, ensure_ascii=False, indent=2))

if __name__ == '__main__': main()
