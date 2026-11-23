/* P132.1 — PDF page import for Pixel Atelier.
 * Renders one selected PDF page through same-origin, locally pinned PDF.js and
 * hands a PNG File to the existing #pxFile input / CVNativeEngines.pixel owner.
 * It does not create a second canvas editor, project store or remote dependency.
 */
(function (root) {
'use strict';
if (root.CVPdfImportP132) return;
var doc = root.document;
var VERSION = '132.1.0';
var MAX_FILE_BYTES = 30 * 1024 * 1024;
var MAX_PAGES = 500;
var MAX_SIDE = 4096;
var MAX_PIXELS = 16000000;
var DEFAULT_SCALE = 1.5;
var pdfjsPromise = null;
var pdfDoc = null;
var activeFile = null;
var panel = null;
var statusNode = null;
var importButton = null;
var fileInput = null;
var pageInput = null;
var pagesNode = null;
var busy = false;
var jobId = 0;

function validateFile(file) {
  if (!file || typeof file !== 'object') return { ok: false, error: 'Chọn một tệp PDF trước.' };
  var name = String(file.name || '').toLowerCase();
  var type = String(file.type || '').toLowerCase();
  if (type !== 'application/pdf' && !/\.pdf$/.test(name)) return { ok: false, error: 'Chỉ nhận tệp PDF.' };
  var size = Number(file.size);
  if (!(size > 0)) return { ok: false, error: 'Tệp PDF đang rỗng.' };
  if (size > MAX_FILE_BYTES) return { ok: false, error: 'PDF vượt giới hạn 30 MB để tránh treo trình duyệt.' };
  return { ok: true, error: '' };
}
function hasPdfHeader(buffer) {
  if (!buffer) return false;
  var bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  var limit = Math.min(bytes.length - 4, 1024);
  for (var i = 0; i <= limit; i++) {
    if (bytes[i] === 37 && bytes[i + 1] === 80 && bytes[i + 2] === 68 && bytes[i + 3] === 70 && bytes[i + 4] === 45) return true;
  }
  return false;
}
function clampPageNumber(value, total) {
  var n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > total) return null;
  return n;
}
function fitSize(width, height, scale) {
  width = Number(width); height = Number(height); scale = Number(scale) || DEFAULT_SCALE;
  if (!(width > 0 && height > 0 && isFinite(width) && isFinite(height))) return null;
  scale = Math.max(0.5, Math.min(2, scale));
  var factor = Math.min(scale, MAX_SIDE / width, MAX_SIDE / height, Math.sqrt(MAX_PIXELS / (width * height)));
  if (!(factor > 0)) return null;
  var w = Math.max(1, Math.floor(width * factor));
  var h = Math.max(1, Math.floor(height * factor));
  if (w > MAX_SIDE || h > MAX_SIDE || w * h > MAX_PIXELS) return null;
  return { width: w, height: h, scale: factor };
}
function setStatus(message, isError) {
  if (!statusNode) return;
  statusNode.textContent = String(message || '');
  statusNode.setAttribute('data-state', isError ? 'error' : 'info');
}
function setBusy(value) {
  busy = !!value;
  if (importButton) importButton.disabled = busy || !pdfDoc;
  if (fileInput) fileInput.disabled = busy;
}
function destroyDocument() {
  var old = pdfDoc;
  pdfDoc = null;
  activeFile = null;
  if (importButton) importButton.disabled = true;
  if (!old || typeof old.destroy !== 'function') return Promise.resolve();
  try { return Promise.resolve(old.destroy()).catch(function () {}); }
  catch (e) { return Promise.resolve(); }
}
function loadPdfJs() {
  if (pdfjsPromise) return pdfjsPromise;
  var moduleUrl = new URL('./assets/vendor/pdfjs/pdf.mjs', doc.baseURI).href;
  var workerUrl = new URL('./assets/vendor/pdfjs/pdf.worker.mjs', doc.baseURI).href;
  pdfjsPromise = import(moduleUrl).then(function (pdfjs) {
    if (!pdfjs || typeof pdfjs.getDocument !== 'function' || !pdfjs.GlobalWorkerOptions) throw new Error('PDF.js local runtime không hợp lệ.');
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    return pdfjs;
  }).catch(function (error) {
    pdfjsPromise = null;
    throw error;
  });
  return pdfjsPromise;
}
function openPdf(file) {
  var check = validateFile(file);
  if (!check.ok) return Promise.reject(new Error(check.error));
  var thisJob = ++jobId;
  setBusy(true);
  setStatus('Đang kiểm tra PDF và nạp bộ đọc cục bộ…');
  return destroyDocument().then(function () {
    if (thisJob !== jobId) throw new Error('Đã thay tệp PDF trong lúc đang mở.');
    return file.arrayBuffer();
  }).then(function (buffer) {
    if (!hasPdfHeader(buffer)) throw new Error('Không tìm thấy chữ ký PDF hợp lệ.');
    return loadPdfJs().then(function (pdfjs) {
      return pdfjs.getDocument({
        data: new Uint8Array(buffer),
        isEvalSupported: false,
        enableXfa: false,
        disableAutoFetch: true,
        disableStream: true,
        cMapUrl: new URL('./assets/vendor/pdfjs/cmaps/', doc.baseURI).href,
        cMapPacked: true,
        standardFontDataUrl: new URL('./assets/vendor/pdfjs/standard_fonts/', doc.baseURI).href,
        useWorkerFetch: false,
        useWasm: false,
        verbosity: 0
      }).promise;
    });
  }).then(function (loaded) {
    if (thisJob !== jobId) {
      if (loaded && loaded.destroy) loaded.destroy();
      throw new Error('Đã thay tệp PDF trong lúc đang mở.');
    }
    if (!loaded.numPages || loaded.numPages > MAX_PAGES) {
      if (loaded.destroy) loaded.destroy();
      throw new Error('PDF phải có từ 1 đến 500 trang trong một lần nhập.');
    }
    pdfDoc = loaded;
    activeFile = file;
    if (pageInput) { pageInput.min = '1'; pageInput.max = String(loaded.numPages); pageInput.value = '1'; }
    if (pagesNode) pagesNode.textContent = loaded.numPages + ' trang';
    if (importButton) importButton.disabled = false;
    setStatus('Đã đọc PDF · chọn trang cần đưa vào Pixel Atelier.');
    return { ok: true, pages: loaded.numPages };
  }).catch(function (error) {
    if (thisJob === jobId) {
      pdfDoc = null; activeFile = null;
      if (pagesNode) pagesNode.textContent = 'Chưa mở PDF';
      setStatus(error && error.name === 'PasswordException' ? 'PDF có mật khẩu; luồng nhập hiện chưa hỗ trợ mật khẩu.' : (error && error.message || 'Không mở được PDF.'), true);
    }
    throw error;
  }).finally(function () { if (thisJob === jobId) setBusy(false); });
}
function safeBaseName(name) {
  var base = String(name || 'document').replace(/\.pdf$/i, '').replace(/[^A-Za-z0-9._-]+/g, '_').replace(/^[_\-.]+|[_\-.]+$/g, '').slice(0, 60);
  return base || 'document';
}
function sendPngToPixel(blob, pageNumber, fileName) {
  var target = doc.getElementById('pxFile');
  if (!target || !root.CVNativeEngines || !root.CVNativeEngines.pixel) throw new Error('Pixel Atelier chưa sẵn sàng. Hãy mở Pixel Atelier rồi thử lại.');
  if (!root.DataTransfer || !root.File) throw new Error('Trình duyệt này chưa hỗ trợ đưa ảnh vào Pixel Atelier tự động.');
  var file = new root.File([blob], safeBaseName(fileName) + '-page-' + pageNumber + '.png', { type: 'image/png', lastModified: Date.now() });
  var transfer = new root.DataTransfer();
  transfer.items.add(file);
  target.value = '';
  target.files = transfer.files;
  target.dispatchEvent(new root.Event('change', { bubbles: true }));
  return file;
}
function importPage() {
  if (busy || !pdfDoc || !activeFile) return Promise.reject(new Error('Hãy chọn và mở một tệp PDF hợp lệ trước.'));
  var pageNumber = clampPageNumber(pageInput && pageInput.value, pdfDoc.numPages);
  if (!pageNumber) return Promise.reject(new Error('Số trang không hợp lệ.'));
  var thisJob = jobId;
  setBusy(true);
  setStatus('Đang raster hóa trang ' + pageNumber + '/' + pdfDoc.numPages + '…');
  var renderCanvas = doc.createElement('canvas');
  return pdfDoc.getPage(pageNumber).then(function (page) {
    if (thisJob !== jobId || pdfDoc === null) throw new Error('Tài liệu PDF đã được thay thế.');
    var base = page.getViewport({ scale: 1 });
    var fitted = fitSize(base.width, base.height, DEFAULT_SCALE);
    if (!fitted) throw new Error('Kích thước trang PDF vượt giới hạn an toàn.');
    var viewport = page.getViewport({ scale: fitted.scale });
    renderCanvas.width = fitted.width;
    renderCanvas.height = fitted.height;
    var ctx = renderCanvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Không tạo được vùng raster cho trang PDF.');
    return page.render({ canvasContext: ctx, viewport: viewport, background: '#ffffff' }).promise.then(function () {
      page.cleanup();
      return new Promise(function (resolve, reject) {
        renderCanvas.toBlob(function (blob) {
          if (!blob || !blob.size) { reject(new Error('Không tạo được ảnh PNG từ trang PDF.')); return; }
          resolve({ blob: blob, width: fitted.width, height: fitted.height });
        }, 'image/png');
      });
    });
  }).then(function (result) {
    if (thisJob !== jobId || pdfDoc === null) throw new Error('Tài liệu PDF đã được thay thế.');
    var file = sendPngToPixel(result.blob, pageNumber, activeFile.name);
    setStatus('Đã đưa trang ' + pageNumber + ' vào Pixel Atelier (' + result.width + ' × ' + result.height + ' PNG). Chữ PDF đã được raster hóa.');
    return { ok: true, page: pageNumber, width: result.width, height: result.height, fileName: file.name, bytes: file.size };
  }).catch(function (error) {
    setStatus(error && error.message || 'Không nhập được trang PDF.', true);
    throw error;
  }).finally(function () {
    renderCanvas.width = 0; renderCanvas.height = 0;
    setBusy(false);
  });
}
function mount() {
  if (!doc || !doc.getElementById || panel) return !!panel;
  var page = doc.getElementById('page-pixelStudio');
  if (!page || !doc.getElementById('pxFile')) return false;
  panel = doc.createElement('section');
  panel.id = 'cv132pdf-panel';
  panel.className = 'cv132pdf';
  panel.setAttribute('aria-labelledby', 'cv132pdf-title');
  panel.innerHTML = '<div class="cv132pdf-head"><div><span class="cv132pdf-kicker">P132.1 · LOCAL PDF</span><h3 id="cv132pdf-title">Nhập trang PDF</h3><p>Mỗi trang được raster hóa thành PNG và mở bằng Pixel Atelier hiện có. Nội dung chữ trong trang không còn chỉnh sửa như text/vector.</p></div><span class="cv132pdf-pages" id="cv132pdf-pages">Chưa mở PDF</span></div>' +
    '<div class="cv132pdf-row"><label for="cv132pdf-file">Tệp PDF (tối đa 30 MB)</label><input id="cv132pdf-file" type="file" accept=".pdf,application/pdf"></div>' +
    '<div class="cv132pdf-actions"><label for="cv132pdf-page">Trang</label><input id="cv132pdf-page" type="number" min="1" value="1" disabled><button type="button" id="cv132pdf-import" disabled>Nhập trang vào Pixel Atelier</button></div>' +
    '<p class="cv132pdf-status" id="cv132pdf-status" role="status" aria-live="polite">PDF.js được nạp cục bộ khi bạn chọn tệp. Không gửi PDF lên máy chủ.</p>' +
    '<small class="cv132pdf-foot">Giới hạn: PDF tối đa 30 MB, 500 trang; mỗi lần nhập một trang, tối đa 4096 px cạnh dài và 16 megapixel.</small>';
  var style = doc.createElement('style');
  style.id = 'canvio-lot132pdf-css';
  style.textContent = '.cv132pdf{margin:16px 0;padding:16px;border:1px solid var(--border,#dce3ee);border-radius:14px;background:var(--card,#fff);color:var(--text,#182230)}.cv132pdf-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap}.cv132pdf-kicker{font-size:10px;font-weight:800;letter-spacing:.12em;color:var(--brand,#1769e0)}.cv132pdf h3{font-size:17px;margin:4px 0}.cv132pdf p,.cv132pdf small{font-size:12px;line-height:1.5;color:var(--muted,#657184);margin:5px 0}.cv132pdf-pages{font-size:11px;border-radius:999px;padding:6px 10px;background:var(--surface,#f2f5fa)}.cv132pdf-row,.cv132pdf-actions{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-top:12px}.cv132pdf label{font-size:12px;font-weight:700}.cv132pdf input{max-width:100%;border:1px solid var(--border,#dce3ee);border-radius:8px;padding:7px 9px;background:var(--input,#fff);color:inherit}.cv132pdf #cv132pdf-page{width:84px}.cv132pdf button{border:1px solid var(--border,#dce3ee);border-radius:9px;padding:8px 12px;background:var(--brand,#1769e0);color:#fff;font-size:12px;font-weight:700}.cv132pdf button:disabled{opacity:.45;cursor:not-allowed}.cv132pdf button:focus-visible,.cv132pdf input:focus-visible{outline:2px solid var(--brand,#1769e0);outline-offset:2px}.cv132pdf-status[data-state=error]{color:#b42318}.cv132pdf-foot{display:block;margin-top:9px}@media(max-width:640px){.cv132pdf-actions button{width:100%}}@media(prefers-reduced-motion:reduce){.cv132pdf *{scroll-behavior:auto!important;transition:none!important}}';
  if (!doc.getElementById(style.id)) doc.head.appendChild(style);
  var after = doc.getElementById('cv135-panel') || page.querySelector('.ne-note') || null;
  if (after && after.parentNode === page) page.insertBefore(panel, after);
  else page.appendChild(panel);
  statusNode = panel.querySelector('#cv132pdf-status');
  fileInput = panel.querySelector('#cv132pdf-file');
  pageInput = panel.querySelector('#cv132pdf-page');
  pagesNode = panel.querySelector('#cv132pdf-pages');
  importButton = panel.querySelector('#cv132pdf-import');
  fileInput.addEventListener('change', function () {
    var file = fileInput.files && fileInput.files[0];
    if (!file) return;
    openPdf(file).catch(function () {});
  });
  importButton.addEventListener('click', function () { importPage().catch(function () {}); });
  pageInput.addEventListener('change', function () {
    var n = clampPageNumber(pageInput.value, pdfDoc && pdfDoc.numPages || 0);
    setStatus(n ? 'Sẵn sàng nhập trang ' + n + '.' : 'Số trang nằm ngoài tài liệu.', !n);
  });
  root.addEventListener('pagehide', function () { jobId++; destroyDocument(); }, { once: true });
  return true;
}
function tests() {
  var oversized = validateFile({ name: 'large.pdf', type: 'application/pdf', size: MAX_FILE_BYTES + 1 });
  var wrong = validateFile({ name: 'photo.png', type: 'image/png', size: 10 });
  var valid = validateFile({ name: 'document.PDF', type: 'application/pdf', size: 120 });
  var goodHeader = hasPdfHeader(new Uint8Array([0, 1, 37, 80, 68, 70, 45, 49, 46, 55]));
  var badHeader = hasPdfHeader(new Uint8Array([80, 78, 71, 13, 10, 26, 10]));
  var fitted = fitSize(20000, 10000, 2);
  return {
    acceptsPdf: valid.ok,
    rejectsNonPdf: !wrong.ok,
    rejectsEmpty: !validateFile({ name: 'empty.pdf', type: 'application/pdf', size: 0 }).ok,
    enforcesThirtyMiBBound: !oversized.ok,
    validatesPdfMagic: goodHeader && !badHeader,
    rejectsInvalidPage: clampPageNumber(0, 2) === null && clampPageNumber(3, 2) === null,
    acceptsValidPage: clampPageNumber(2, 2) === 2,
    clampsLargeCanvasSide: !!fitted && fitted.width <= MAX_SIDE && fitted.height <= MAX_SIDE,
    clampsCanvasPixelBudget: !!fitted && fitted.width * fitted.height <= MAX_PIXELS,
    scaleIsBounded: fitSize(200, 100, 9).scale <= 2,
    apiDeclaresExistingPixelHandoff: typeof sendPngToPixel === 'function'
  };
}
var api = {
  version: VERSION,
  limits: { fileBytes: MAX_FILE_BYTES, pages: MAX_PAGES, maxSide: MAX_SIDE, maxPixels: MAX_PIXELS },
  validateFile: validateFile,
  hasPdfHeader: hasPdfHeader,
  clampPageNumber: clampPageNumber,
  fitSize: fitSize,
  mount: mount,
  tests: tests,
  openPdf: openPdf,
  importPage: importPage
};
root.CVPdfImportP132 = api;
if (doc) {
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
}
})(window);
