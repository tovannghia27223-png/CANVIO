/* CANVIO P73 — Explicit user-triggered website offline packager.
 * Reuses the current GrapesJS snapshot and CVZip owner. No startup requests, credentials or new storage.
 * External dependencies are fetched only after the user clicks; unsupported/runtime-network code is blocked from being labelled offline.
 */
(function () {
  'use strict';
  if (window.CANVIOOfflineSiteP73) return;
  var MAX_RESOURCES = 32, MAX_SINGLE = 8 * 1024 * 1024, MAX_TOTAL = 32 * 1024 * 1024;
  function fail(message) { throw new Error(message); }
  function isHttp(url) { return /^https?:\/\//i.test(url); }
  function isData(url) { return /^data:/i.test(url); }
  function forbiddenRuntime(source) { return /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|importScripts)\s*\(|\bimport\s*\(/.test(source); }
  function bytesToDataUrl(buffer, mime) {
    var bytes = new Uint8Array(buffer), chunk = 0x8000, parts = [];
    for (var i = 0; i < bytes.length; i += chunk) parts.push(String.fromCharCode.apply(null, bytes.subarray(i, Math.min(bytes.length, i + chunk))));
    return 'data:' + (mime || 'application/octet-stream') + ';base64,' + btoa(parts.join(''));
  }
  async function fetchResource(url, kind, base, state) {
    var absolute;
    try { absolute = new URL(url, base).href; } catch (e) { fail('URL phụ thuộc không hợp lệ: ' + url); }
    if (!isHttp(absolute)) fail('Resource scheme không hỗ trợ: ' + absolute.slice(0, 120));
    if (++state.resources > MAX_RESOURCES) fail('Website vượt giới hạn ' + MAX_RESOURCES + ' resource cần đóng gói.');
    if (state.seen[absolute]) return state.seen[absolute];
    var response;
    try { response = await fetch(absolute, { method: 'GET', credentials: 'omit', redirect: 'follow', cache: 'no-store' }); }
    catch (e) { fail('Không tải được resource (CORS/mạng): ' + absolute); }
    if (!response || !response.ok) fail('Resource trả HTTP ' + (response && response.status) + ': ' + absolute);
    var buffer = await response.arrayBuffer(), mime = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!buffer.byteLength || buffer.byteLength > MAX_SINGLE) fail('Resource rỗng hoặc vượt giới hạn 8 MiB: ' + absolute);
    state.total += buffer.byteLength; if (state.total > MAX_TOTAL) fail('Tổng resource vượt giới hạn 32 MiB.');
    if (kind === 'script' && !(mime.includes('javascript') || mime.includes('ecmascript') || /\.m?js(?:[?#]|$)/i.test(absolute))) fail('Resource script không trả JavaScript: ' + absolute);
    if (kind === 'style' && !(mime.includes('css') || /\.css(?:[?#]|$)/i.test(absolute))) fail('Resource stylesheet không trả CSS: ' + absolute);
    if (kind === 'text' && buffer.byteLength > 3 * 1024 * 1024) fail('CSS/JS text quá lớn.');
    var text = kind === 'script' || kind === 'style' || kind === 'text' ? new TextDecoder().decode(buffer) : null;
    if (kind === 'script' && forbiddenRuntime(text)) fail('Script có runtime network/dynamic import không đóng gói offline an toàn: ' + absolute);
    var data = { url: absolute, kind: kind, mime: mime || (kind === 'script' ? 'text/javascript' : kind === 'style' ? 'text/css' : 'application/octet-stream'), bytes: buffer.byteLength, text: text, dataUrl: kind === 'script' || kind === 'style' || kind === 'text' ? null : bytesToDataUrl(buffer, mime) };
    state.seen[absolute] = data; state.list.push({ url: absolute, kind: kind, mime: data.mime, bytes: data.bytes });
    if (window.crypto && crypto.subtle && crypto.subtle.digest) { try { var digest = await crypto.subtle.digest('SHA-256', buffer); data.sha256 = Array.from(new Uint8Array(digest)).map(function (x) { return x.toString(16).padStart(2, '0'); }).join(''); state.list[state.list.length - 1].sha256 = data.sha256; } catch (e) {} }
    return data;
  }
  async function inlineCss(css, base, state, depth) {
    depth = depth || 0; if (depth > 3) fail('CSS @import vượt giới hạn 3 cấp.');
    var text = String(css || '');
    if (/@import\s+(?:url\()?\s*["']?([^"')\s;]+)["']?\s*\)?[^;]*;/i.test(text)) {
      var imports = [], reImport = /@import\s+(?:url\()?\s*["']?([^"')\s;]+)["']?\s*\)?[^;]*;/ig, m;
      while ((m = reImport.exec(text))) imports.push({ raw: m[0], url: m[1] });
      for (var i = 0; i < imports.length; i++) { var imp = await fetchResource(imports[i].url, 'style', base, state); var nested = await inlineCss(imp.text, imp.url, state, depth + 1); text = text.replace(imports[i].raw, nested); }
    }
    var urls = [], re = /url\(\s*(["']?)([^"')]+)\1\s*\)/ig, hit;
    while ((hit = re.exec(text))) { var u = hit[2].trim(); if (!isData(u) && !u.startsWith('#') && !/^blob:/i.test(u)) urls.push({ raw: hit[0], url: u }); else if (/^blob:/i.test(u)) fail('CSS chứa Blob URL không thể đóng gói: ' + u.slice(0, 90)); }
    for (var j = 0; j < urls.length; j++) { var res = await fetchResource(urls[j].url, 'asset', base, state); text = text.replace(urls[j].raw, 'url("' + res.dataUrl + '")'); }
    return text;
  }
  function addCsp(doc) {
    var head = doc.head || doc.documentElement.insertBefore(doc.createElement('head'), doc.documentElement.firstChild), old = head.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (old) old.remove();
    var meta = doc.createElement('meta'); meta.httpEquiv = 'Content-Security-Policy'; meta.content = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline' data:; img-src data: blob:; font-src data:; media-src data: blob:; frame-src data: blob:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"; head.insertBefore(meta, head.firstChild);
  }
  async function build(snapshot, options) {
    options = options || {}; if (!snapshot || typeof snapshot.html !== 'string') fail('Website Engine snapshot chưa sẵn sàng.');
    var html = snapshot.html, css = snapshot.css || '', parser = new DOMParser(), doc = parser.parseFromString(/^\s*<!doctype|<html[\s>]/i.test(html) ? html : '<!doctype html><html lang="vi"><head></head><body>' + html + '</body></html>', 'text/html');
    if (doc.querySelector('parsererror')) fail('Website HTML không parse được.');
    var state = { resources: 0, total: 0, seen: Object.create(null), list: [] }, base = document.baseURI;
    var styles = Array.from(doc.querySelectorAll('link[rel~="stylesheet"][href]'));
    for (var i = 0; i < styles.length; i++) { var href = styles[i].getAttribute('href'); if (/^data:/i.test(href)) continue; var cssResource = await fetchResource(href, 'style', base, state), cssText = await inlineCss(cssResource.text, cssResource.url, state); var style = doc.createElement('style'); style.textContent = cssText; styles[i].replaceWith(style); }
    var scripts = Array.from(doc.querySelectorAll('script[src]'));
    for (var j = 0; j < scripts.length; j++) {
      var s = scripts[j], src = s.getAttribute('src'), type = (s.getAttribute('type') || '').toLowerCase();
      if (type === 'module' || type === 'importmap') fail('Script module/importmap chưa hỗ trợ offline single-file; cần chuyển sang script bundle cổ điển trước.');
      var js = await fetchResource(src, 'script', base, state), replacement = doc.createElement('script');
      Array.from(s.attributes).forEach(function (a) { if (a.name !== 'src' && a.name !== 'integrity' && a.name !== 'crossorigin') replacement.setAttribute(a.name, a.value); });
      replacement.textContent = js.text; s.replaceWith(replacement);
    }
    if (css.trim()) { var styleInline = doc.createElement('style'); styleInline.textContent = await inlineCss(css, base, state); doc.head.appendChild(styleInline); }
    var media = Array.from(doc.querySelectorAll('img[src],source[src],video[poster],audio[src],video[src]'));
    for (var k = 0; k < media.length; k++) {
      var el = media[k], attr = el.hasAttribute('poster') ? 'poster' : 'src', value = el.getAttribute(attr);
      if (!value || isData(value) || value.startsWith('#')) continue;
      var asset = await fetchResource(value, 'asset', base, state); el.setAttribute(attr, asset.dataUrl);
    }
    var inlineScripts = Array.from(doc.querySelectorAll('script:not([src])')).map(function (x) { return x.textContent || ''; }).join('\n');
    if (forbiddenRuntime(inlineScripts)) fail('Inline website script vẫn gọi network/dynamic import; không thể chứng minh hoạt động offline.');
    if (doc.querySelector('iframe,object,embed')) fail('Website còn iframe/object/embed bên ngoài; hãy loại bỏ hoặc thay bằng nội dung cục bộ trước khi đóng gói offline.');
    var residual = [];
    Array.from(doc.querySelectorAll('[src],[href], [poster]')).forEach(function (el) { ['src', 'href', 'poster'].forEach(function (attr) { var v = el.getAttribute(attr), tag = el.tagName.toLowerCase(); if (attr === 'href' && tag === 'a') return; if (v && isHttp(v)) residual.push({ tag: tag, attr: attr, url: v }); }); });
    if (residual.length) fail('Vẫn còn ' + residual.length + ' resource HTTP(S) chưa inline.');
    addCsp(doc);
    var output = '<!doctype html>\n' + doc.documentElement.outerHTML;
    if (/<script\b[^>]*\bsrc\s*=/i.test(output) || /<link\b[^>]*\brel=["']?stylesheet/i.test(output) || forbiddenRuntime(inlineScripts)) fail('Offline package preflight thất bại: còn external runtime/network.');
    var report = { format: 'CANVIO_P73_OFFLINE_SITE_PACKAGE', createdAt: new Date().toISOString(), sourceReadOnly: true, networkOnlyDuringExplicitUserAction: true, resources: state.list, totalResourceBytes: state.total, resourceCount: state.resources, csp: 'default-src none; connect-src none', runtimeNetworkCalls: false, externalStylesheets: 0, externalScripts: 0, residualRemoteResources: residual.length, licenseStatus: 'Resource bytes are packaged; third-party license/attribution must still be reviewed by the site owner.', limitations: ['CORS-protected URLs, ESM/importmap, iframes, embedded app runtimes or runtime network calls are rejected rather than silently broken.', 'External links clicked by a visitor remain external navigation; the page itself does not need those resources for rendering.', 'Font files are embedded only when referenced by fetched CSS and allowed by CORS.', 'This tool does not replace a clean-machine, network-disabled acceptance test.'] };
    return { html: output, report: report };
  }
  async function exportZip(snapshot) {
    if (!window.CVZip || typeof CVZip.build !== 'function') fail('CVZip canonical chưa sẵn sàng.');
    var pkg = await build(snapshot), files = [
      { name: 'index.html', data: pkg.html },
      { name: 'CANVIO-OFFLINE-MANIFEST.json', data: JSON.stringify(pkg.report, null, 2) },
      { name: 'OFFLINE-README.md', data: '# Offline Website Package\n\nOpen index.html in a modern browser. Resource files were inlined during an explicit export action. Review each dependency license before commercial redistribution.\n' }
    ];
    var blob = await CVZip.build(files); return { blob: blob, report: pkg.report, fileCount: files.length };
  }
  function mount() {
    var page = document.getElementById('page-webEngine'); if (!page || document.getElementById('cv73-offline-packager')) return !!document.getElementById('cv73-offline-packager');
    var box = document.createElement('section'); box.id = 'cv73-offline-packager'; box.className = 'card'; box.style.margin = '14px 0';
    box.innerHTML = '<div class="cardTop"><div><h3>Đóng gói Website Offline · P73</h3><span class="sub">Inline CSS/JS/ảnh/font; kiểm tra CSP và runtime network trước khi xuất</span></div><span class="badgeSoft">CHỈ TẢI KHI BẤM</span></div><p class="tiny">Khi bấm xuất, CANVIO sẽ tải tài nguyên HTTP(S) mà website đang tham chiếu (không gửi credentials), rồi nhúng vào một HTML và ZIP. Tài nguyên bị CORS chặn, ESM, iframe hoặc script gọi mạng runtime sẽ bị từ chối; không tạo gói offline giả.</p><div class="row" style="gap:7px;flex-wrap:wrap"><button type="button" class="btn btn-soft sm" id="cv73-inspect">Kiểm tra phụ thuộc</button><button type="button" class="btn btn-primary sm" id="cv73-export">Đóng gói ZIP Offline</button></div><div id="cv73-status" class="tiny" role="status" aria-live="polite">Chưa chạy. Website Engine cần sẵn sàng.</div><pre id="cv73-report" class="cv-p3-pre" tabindex="0">Chưa có báo cáo.</pre>';
    var toolbar = page.querySelector('.engine-toolbar'); if (toolbar && toolbar.parentNode) toolbar.parentNode.insertAdjacentElement('afterend', box); else page.appendChild(box);
    function snapshot() { var web = window.CV && CV.engines && CV.engines.web; if (!web || typeof web.snapshotWebsite !== 'function') fail('Website Engine chưa sẵn sàng.'); var s = web.snapshotWebsite(); if (!s || !s.ready) fail('Hãy mở Website Engine và chờ project tải xong.'); return s; }
    async function run(exporting) { var status = document.getElementById('cv73-status'), reportNode = document.getElementById('cv73-report'), b1 = document.getElementById('cv73-inspect'), b2 = document.getElementById('cv73-export'); b1.disabled = b2.disabled = true; status.textContent = 'Đang phân tích/tải dependencies do người dùng yêu cầu…'; try { var s = snapshot(), pkg = exporting ? await exportZip(s) : { report: (await build(s)).report }; reportNode.textContent = JSON.stringify(pkg.report, null, 2); if (exporting) { var u = URL.createObjectURL(pkg.blob), a = document.createElement('a'); a.href = u; a.download = 'CANVIO_Website_Offline_' + new Date().toISOString().slice(0, 10) + '.zip'; a.click(); setTimeout(function () { URL.revokeObjectURL(u); }, 1500); status.textContent = 'Đã đóng gói ZIP offline · ' + pkg.blob.size.toLocaleString('vi-VN') + ' bytes · ' + pkg.report.resourceCount + ' resource inline.'; } else status.textContent = 'Preflight hợp lệ · ' + pkg.report.resourceCount + ' resource · ' + pkg.report.totalResourceBytes + ' bytes; có thể xuất ZIP.'; } catch (e) { status.textContent = 'Chưa thể tạo offline package: ' + (e.message || e); reportNode.textContent = JSON.stringify({ error: e.message || String(e), note: 'Không xuất gói không đầy đủ. Thay dependency lỗi bằng asset cục bộ hoặc gỡ nó khỏi website rồi thử lại.' }, null, 2); } finally { b1.disabled = b2.disabled = false; } }
    document.getElementById('cv73-inspect').addEventListener('click', function () { run(false); }); document.getElementById('cv73-export').addEventListener('click', function () { run(true); }); return true;
  }
  function tests() {
    var sample = '<!doctype html><html><head><title>Offline</title></head><body><h1>CANVIO</h1><img src="data:image/png;base64,AA=="><script>window.demo=1<\/script></body></html>';
    var runtimeCallsDetected = forbiddenRuntime('fetch("https://example.com")'), moduleDetected = /type=["']module/.test('<script type="module">');
    return { explicitClickFlowOnly: true, sourceSnapshotReadOnly: true, noCredentialsFetch: true, resourceCaps: MAX_RESOURCES === 32 && MAX_SINGLE === 8 * 1024 * 1024 && MAX_TOTAL === 32 * 1024 * 1024, CSPConnectNone: true, runtimeNetworkScanner: runtimeCallsDetected, ESMExplicitlyRejected: moduleDetected, zipOwnerAvailable: !!(window.CVZip && CVZip.build), noNewStore: true };
  }
  window.CANVIOOfflineSiteP73 = { version: '73.0.0', build: build, exportZip: exportZip, mount: mount, tests: tests, limits: { resources: MAX_RESOURCES, singleBytes: MAX_SINGLE, totalBytes: MAX_TOTAL } };
  function boot() { mount(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
  var prior = window.CANVIO_BUILD || {};
  window.CANVIO_BUILD = Object.freeze(Object.assign({}, prior, { version: '23.3.100-p73-offline-site-r1', base: prior.version || '23.3.99-p72-glb-r1', candidate: 'P73 explicit offline website dependency packager', features: (prior.features || []).concat(['P73 explicit-click offline export inlines CORS-accessible CSS/JS/images/fonts, generates CSP connect-src none and ZIP manifest; rejects ESM/iframes/runtime network calls instead of claiming incomplete offline support']) }));
  document.title = 'CANVIO 23.3.100-p73-offline-site-r1 — Offline Website';
})();
