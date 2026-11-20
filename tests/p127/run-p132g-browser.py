#!/usr/bin/env python3
"""P132 real-Chrome test: verify GIF/APNG via ffprobe and animated WebP via RIFF chunk inspection plus Chromium native decode."""
import json, os, sys, threading, http.server, socketserver, functools, shutil, subprocess, tempfile
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CHROME = os.environ.get('CHROME_BIN') or shutil.which('google-chrome') or shutil.which('chromium')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
httpd = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); httpd.daemon_threads = True
threading.Thread(target=httpd.serve_forever, daemon=True).start()
url = 'http://127.0.0.1:%d/index.html' % httpd.server_address[1]
c = {}; errs = []; tmp = tempfile.mkdtemp()
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, headless=True, args=['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1'])
    ctx = b.new_context(viewport={'width': 1200, 'height': 800}, reduced_motion='reduce', accept_downloads=True)
    page = ctx.new_page(); page.on('pageerror', lambda e: errs.append(str(e)[:200]))
    page.goto(url, wait_until='commit', timeout=60000)
    page.wait_for_function('!!(window.CV && CV.go && window.CVGifP132)', timeout=90000, polling=500)
    page.evaluate("CV.go('videoEngine')"); page.wait_for_timeout(1500)
    expected_height = page.evaluate("Math.max(1, Math.round(200 * document.getElementById('vtCanvas').height / document.getElementById('vtCanvas').width))")
    c['buttonMounted'] = page.evaluate("!!document.getElementById('cv132-gif')")
    page.evaluate("var s=CV.engines.video._state();s.duration=2;CV.engines.video.commit&&0"); 
    page.fill('#cv132-fps', '5'); page.fill('#cv132-w', '200')
    with page.expect_download(timeout=60000) as d: page.click('#cv132-gif')
    pth = os.path.join(tmp, 'o.gif'); d.value.save_as(pth)
    c['statusOk'] = page.evaluate("/Đã xuất GIF 10 khung/.test(document.getElementById('cv132-out').textContent)")
    c['buttonReenabled'] = page.evaluate("!document.getElementById('cv132-gif').disabled")
    r = subprocess.run(['ffprobe', '-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=codec_name,width,nb_read_frames', '-of', 'json', pth], capture_output=True, text=True)
    info = json.loads(r.stdout or '{}').get('streams', [{}])[0]
    c['ffprobeDecodes'] = info.get('codec_name') == 'gif' and info.get('width') == 200 and int(info.get('nb_read_frames', 0)) == 10
    c['headerIsGif89a'] = open(pth, 'rb').read(6) == b'GIF89a'
    with page.expect_download(timeout=60000) as d2: page.click('#cv132-apng')
    apng = os.path.join(tmp, 'o.apng'); d2.value.save_as(apng)
    c['apngStatusOk'] = page.evaluate("/Đã xuất APNG 10 khung/.test(document.getElementById('cv132-out').textContent)")
    c['apngButtonReenabled'] = page.evaluate("!document.getElementById('cv132-apng').disabled")
    ar = subprocess.run(['ffprobe', '-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=codec_name,width,nb_read_frames', '-of', 'json', apng], capture_output=True, text=True)
    ainfo = json.loads(ar.stdout or '{}').get('streams', [{}])[0]
    c['ffprobeDecodesApng'] = ainfo.get('codec_name') == 'apng' and ainfo.get('width') == 200 and int(ainfo.get('nb_read_frames', 0)) == 10
    c['headerIsPng'] = open(apng, 'rb').read(8) == bytes([137,80,78,71,13,10,26,10])
    c['apngAnimationControlPresent'] = b'acTL' in open(apng, 'rb').read()
    with page.expect_download(timeout=60000) as d3: page.click('#cv132-webp')
    webp = os.path.join(tmp, 'o.webp'); d3.value.save_as(webp)
    c['webpStatusOk'] = page.evaluate("/Đã xuất WEBP 10 khung/.test(document.getElementById('cv132-out').textContent)")
    c['webpButtonReenabled'] = page.evaluate("!document.getElementById('cv132-webp').disabled")
    wdata = open(webp, 'rb').read()
    c['webpRiffHeader'] = len(wdata) > 32 and wdata[:4] == b'RIFF' and wdata[8:12] == b'WEBP'
    pos = 12; anmf = 0; frame_info = []; structure_ok = True; tags = []; vp8x = None; has_anim = False
    riff_size_ok = int.from_bytes(wdata[4:8], 'little') == len(wdata) - 8 if len(wdata) >= 8 else False
    while pos < len(wdata):
        if pos + 8 > len(wdata): structure_ok = False; break
        tag = wdata[pos:pos + 4]; size = int.from_bytes(wdata[pos + 4:pos + 8], 'little')
        data_start = pos + 8; end = data_start + size
        if end > len(wdata): structure_ok = False; break
        data = wdata[data_start:end]; tags.append(tag.decode('ascii', errors='replace'))
        if tag == b'VP8X':
            if size != 10: structure_ok = False
            else:
                vp8x = {'flags': data[0], 'width': 1 + int.from_bytes(data[4:7], 'little'), 'height': 1 + int.from_bytes(data[7:10], 'little')}
        elif tag == b'ANIM':
            has_anim = size == 6
            if not has_anim: structure_ok = False
        elif tag == b'ANMF':
            anmf += 1
            if size < 16: structure_ok = False
            else:
                fw = 1 + int.from_bytes(data[6:9], 'little'); fh = 1 + int.from_bytes(data[9:12], 'little')
                delay = int.from_bytes(data[12:15], 'little')
                subpos = 16; sub_tags = []
                while subpos < len(data):
                    if subpos + 8 > len(data): structure_ok = False; break
                    subtag = data[subpos:subpos + 4]; subsize = int.from_bytes(data[subpos + 4:subpos + 8], 'little')
                    subend = subpos + 8 + subsize
                    if subend > len(data): structure_ok = False; break
                    sub_tags.append(subtag.decode('ascii', errors='replace'))
                    subpos = subend + (subsize & 1)
                if subpos != len(data): structure_ok = False
                frame_info.append({'width':fw,'height':fh,'durationMs':delay,'subchunks':sub_tags,'hasImage':('VP8 ' in sub_tags or 'VP8L' in sub_tags)})
        pos = end + (size & 1)
    c['webpRiffSizeValid'] = riff_size_ok
    c['webpChunkStructureValid'] = structure_ok and pos == len(wdata)
    c['webpAnimationFlag'] = bool(vp8x and (vp8x['flags'] & 2)) and has_anim
    c['webpCanvasDimensions'] = bool(vp8x and vp8x['width'] == 200 and vp8x['height'] == expected_height)
    c['webpFrameCount'] = anmf == 10 and len(frame_info) == 10
    c['webpFramesHaveValidImagePayload'] = len(frame_info) == 10 and all(f['hasImage'] and f['width'] == 200 and f['height'] == expected_height and f['durationMs'] > 0 for f in frame_info)
    import base64
    encoded = base64.b64encode(wdata).decode('ascii')
    decoded = page.evaluate("""async b64 => { try { const raw=Uint8Array.from(atob(b64),c=>c.charCodeAt(0)); const bmp=await createImageBitmap(new Blob([raw],{type:'image/webp'})); const r={ok:true,width:bmp.width,height:bmp.height}; bmp.close(); return r; } catch(e) { return {ok:false,error:String(e)}; } }""", encoded)
    c['webpChromiumDecoder'] = decoded.get('ok') is True and decoded.get('width') == 200 and decoded.get('height') == 200
    wr = subprocess.run(['ffprobe', '-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=codec_name,width,nb_read_frames', '-of', 'json', webp], capture_output=True, text=True)
    winfo = json.loads(wr.stdout or '{}').get('streams', [{}])[0]
    info['apng'] = ainfo; info['webp'] = {'riffTags':tags,'frames':frame_info,'chromiumDecode':decoded,'ffprobeInfo':winfo,'ffprobeStderr':wr.stderr[:500]}
    b.close()
res = {'checks': c, 'ffprobe': info, 'pageErrors': errs, 'failed': [k for k, v in c.items() if not v]}
print(json.dumps(res, ensure_ascii=False, indent=1)); sys.exit(1 if res['failed'] or errs else 0)
