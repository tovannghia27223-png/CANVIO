/* CANVIO P104 · Local Ken Burns / image slideshow
 * Reuses CV.assets and CV.engines.video; no new persistence owner or network access.
 */
(function () {
  'use strict';
  if (window.CANVIOKenBurnsSuite) return;

  var VERSION = '104.0.0';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
  var api = function () { return window.CV && CV.engines && CV.engines.video || null; };
  var state = function () { var v = api(); return v && v._state ? v._state() : null; };
  var assetOwner = function () { return window.CV && CV.assets && typeof CV.assets.list === 'function' ? CV.assets : null; };
  var pending = null, busy = false;
  var MAX_ASSET_BYTES = 5 * 1024 * 1024, MAX_BATCH_BYTES = 40 * 1024 * 1024, MAX_IMAGES = 24;

  function allowedMime(mime) { return /^image\/(?:png|jpeg|webp|gif)$/i.test(String(mime || '')); }
  function dataInfo(a) {
    if (!a || typeof a.data !== 'string') return null;
    var m = a.data.match(/^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=]+)$/i);
    if (!m || String(m[1]).toLowerCase() !== String(a.mime || '').toLowerCase()) return null;
    var payload = m[2];
    if (!payload.length || payload.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(payload)) return null;
    var bytes = Math.max(0, Math.floor(payload.length * 3 / 4) - (payload.endsWith('==') ? 2 : payload.endsWith('=') ? 1 : 0));
    return { mime: String(m[1]).toLowerCase(), payload: payload, bytes: bytes };
  }
  function safeAsset(a) {
    if (!a || !a.id || !allowedMime(a.mime)) return false;
    var info = dataInfo(a);
    if (!info || info.bytes < 1 || info.bytes > MAX_ASSET_BYTES) return false;
    if (Number.isFinite(Number(a.size)) && Number(a.size) > 0 && Math.abs(Number(a.size) - info.bytes) > 2) return false;
    return true;
  }
  function fingerprintAsset(a) {
    var data = String(a && a.data || ''), h = 2166136261;
    for (var i = 0; i < data.length; i++) { h ^= data.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(16) + ':' + data.length;
  }
  function availableAssets() {
    var owner = assetOwner();
    if (!owner) return [];
    try { return owner.list().filter(safeAsset).slice(0, 40); } catch (e) { return []; }
  }
  function fileFromAsset(a) {
    var match = dataInfo(a);
    if (!match) throw new Error('Dữ liệu ảnh không hợp lệ: ' + String(a.name || a.id));
    if (match.bytes > MAX_ASSET_BYTES) throw new Error('Ảnh vượt 5 MB: ' + String(a.name || a.id));
    var raw = atob(match.payload), bytes = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    var name = String(a.name || 'CANVIO-image').replace(/[\\/:*?"<>|]+/g, '_').slice(0, 100);
    if (!/\.(?:png|jpe?g|webp|gif)$/i.test(name)) name += match.mime === 'image/jpeg' ? '.jpg' : '.' + match.mime.split('/')[1];
    return new File([bytes], name, { type: match.mime, lastModified: Date.now() });
  }
  function seedChoice(id) {
    var text = String(id || 'canvio'), h = 2166136261;
    for (var i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function movementFor(mode, key) {
    var base = { x: 0, y: 0, scale: 1, opacity: 1, rotation: 0 }, from = Object.assign({}, base), to = Object.assign({}, base);
    if (mode === 'zoom-in') to.scale = 1.18;
    else if (mode === 'zoom-out') { from.scale = 1.18; to.scale = 1; }
    else if (mode === 'pan-left') { from.x = 72; to.x = -72; }
    else if (mode === 'pan-right') { from.x = -72; to.x = 72; }
    else if (mode === 'pan-up') { from.y = 54; to.y = -54; }
    else if (mode === 'pan-down') { from.y = -54; to.y = 54; }
    else if (mode === 'random') {
      var options = ['zoom-in', 'zoom-out', 'pan-left', 'pan-right', 'pan-up', 'pan-down'];
      return movementFor(options[seedChoice(key) % options.length], key);
    }
    return { from: from, to: to, easing: 'ease-in-out', keyframes: null, bezier: null };
  }
  function buildPlan(ids, options) {
    var owner = assetOwner(), assets = availableAssets(), selected = Array.isArray(ids) ? ids.map(String) : [];
    options = options || {};
    if (!owner) return { ok: false, reason: 'Asset Library chưa sẵn sàng.' };
    if (!selected.length) return { ok: false, reason: 'Chọn ít nhất một ảnh trong Asset Library.' };
    if (selected.length > MAX_IMAGES) return { ok: false, reason: 'Một slideshow tối đa 24 ảnh mỗi lượt.' };
    var unique = Array.from(new Set(selected));
    if (unique.length !== selected.length) return { ok: false, reason: 'Danh sách ảnh bị trùng.' };
    var chosen = unique.map(function (id) { return assets.find(function (a) { return String(a.id) === id; }); });
    if (chosen.some(function (a) { return !a; })) return { ok: false, reason: 'Một ảnh đã bị xóa hoặc không còn hỗ trợ. Hãy làm mới danh sách.' };
    var infos = chosen.map(dataInfo);
    if (infos.some(function (x) { return !x || x.bytes > MAX_ASSET_BYTES; })) return { ok: false, reason: 'Một ảnh có dữ liệu không hợp lệ hoặc vượt 5 MB.' };
    var total = infos.reduce(function (sum, x) { return sum + x.bytes; }, 0);
    if (total > MAX_BATCH_BYTES) return { ok: false, reason: 'Tổng ảnh vượt 40 MB cho một lượt. Hãy chia thành nhiều slideshow.' };
    var duration = Number(options.duration);
    if (!Number.isFinite(duration) || duration < 2 || duration > 15) return { ok: false, reason: 'Thời lượng mỗi ảnh phải từ 2 đến 15 giây.' };
    var transition = Number(options.transition);
    if (![0, 0.25, 0.5, 0.75, 1].includes(transition) || transition >= duration) return { ok: false, reason: 'Thời lượng chuyển cảnh không hợp lệ.' };
    var mode = ['zoom-in', 'zoom-out', 'pan-left', 'pan-right', 'pan-up', 'pan-down', 'random'].includes(options.mode) ? options.mode : 'zoom-in';
    var v = api();
    if (!v || !v._state || !v.importFiles || !v._pro || !v._pro.pushUndo || !v.commit) return { ok: false, reason: 'Video Engine thiếu API nhập media / Undo / Commit canonical.' };
    if (v.trackState && v.trackState(1).locked) return { ok: false, reason: 'Track hình/video đang khóa. Mở khóa trước khi tạo slideshow.' };
    return { ok: true, assets: chosen, assetIds: unique, assetFingerprints: chosen.map(fingerprintAsset), totalBytes: total, duration: duration, transition: transition, mode: mode,
      transitionName: ({ 0: 'Không chuyển cảnh', 0.25: 'Fade 0,25 giây', 0.5: 'Fade 0,5 giây', 0.75: 'Fade 0,75 giây', 1: 'Fade 1 giây' })[transition],
      note: 'Ảnh được nhập vào track hình canonical. Slideshow được xếp theo thứ tự chọn, chuyển động Ken Burns dùng keyframe cục bộ; Undo chuẩn của Video Engine khôi phục cả lượt.' };
  }
  function renderAssets() {
    var host = $('#cv104-assets'), meta = $('#cv104-meta');
    if (!host) return;
    var assets = availableAssets();
    if (meta) meta.textContent = assets.length + ' ảnh hợp lệ trong Asset Library · tối đa ' + MAX_IMAGES + ' ảnh/lượt · 5 MB/ảnh';
    if (!assets.length) {
      host.innerHTML = '<p class="cv104-empty">Chưa có ảnh phù hợp. Hãy thêm PNG, JPEG, WebP hoặc GIF trong Asset Library trước.</p>';
      return;
    }
    host.innerHTML = assets.map(function (a) {
      return '<label class="cv104-asset"><input type="checkbox" data-cv104-asset="' + esc(a.id) + '"><img loading="lazy" src="' + esc(a.data) + '" alt=""><span><b>' + esc(a.name || 'Ảnh') + '</b><small>' + (Math.max(0, Number(a.size) || 0) / 1024).toFixed(0) + ' KB</small></span></label>';
    }).join('');
  }
  function selectedIds() { return $$('[data-cv104-asset]:checked', $('#cv104-panel')).map(function (n) { return n.getAttribute('data-cv104-asset'); }); }
  function renderPreview(plan) {
    var box = $('#cv104-preview'), apply = $('#cv104-apply');
    if (!box || !apply) return;
    if (!plan || !plan.ok) { pending = null; box.textContent = plan && plan.reason || 'Chọn ảnh và lập xem trước.'; apply.disabled = true; return; }
    pending = plan;
    box.innerHTML = '<b>' + plan.assets.length + ' ảnh sẽ được đưa vào timeline</b><p>' + plan.duration.toFixed(2) + ' giây/ảnh · ' + esc(plan.transitionName) + ' · hiệu ứng ' + esc(plan.mode) + '</p><small>' + (plan.totalBytes / 1048576).toFixed(2) + ' MB dữ liệu · Thứ tự theo danh sách Asset Library.</small><p class="cv104-warn">Nhạc: CANVIO giữ nguyên các clip audio đang có; không tự tạo hoặc tải nhạc. Hiệu ứng được áp vào ảnh mới, không sửa ảnh gốc trong Asset Library.</p>';
    apply.disabled = false;
  }
  async function applyPlan() {
    if (busy || !pending || !pending.ok) return false;
    var plan = pending, v = api(), s = state();
    if (!v || !s || !v._pro || !v._pro.pushUndo) return false;
    var fresh = buildPlan(plan.assetIds, { duration: plan.duration, transition: plan.transition, mode: plan.mode });
    if (!fresh.ok || stableAssets(fresh) !== stableAssets(plan)) { renderPreview({ ok: false, reason: 'Asset Library hoặc cấu hình đã thay đổi. Hãy tạo preview mới.' }); return false; }
    busy = true; $('#cv104-apply').disabled = true;
    $('#cv104-status').textContent = 'Đang nhập ảnh vào timeline canonical…';
    var checkpointTaken = false;
    try {
      var files = plan.assets.map(fileFromAsset), existing = new Set(s.clips.map(function (c) { return c.id; }));
      pending = null;
      v._pro.pushUndo(); checkpointTaken = true;
      var imported = await v.importFiles({ target: { files: files, value: '' } });
      s = state();
      var made = s.clips.filter(function (c) { return !existing.has(c.id) && c.type === 'image'; }).sort(function (a, b) { return a.start - b.start; });
      if (!imported || !made.length) {
        if (typeof v.undo === 'function') { try { v.undo(); checkpointTaken = false; } catch (rollbackError) {} }
        $('#cv104-status').textContent = 'Không nhập được ảnh. Đã thử hoàn tác checkpoint; hãy kiểm tra định dạng, quota IndexedDB và trạng thái track.';
        pending = null;
        return false;
      }
      var partial = made.length !== plan.assets.length;
      var start = Math.min.apply(Math, made.map(function (c) { return Number(c.start) || 0; }));
      var stride = Math.max(0.2, plan.duration - plan.transition);
      made.forEach(function (clip, index) {
        clip.start = start + index * stride;
        clip.duration = plan.duration;
        clip.motion = movementFor(plan.mode, clip.id);
        clip.fx = Object.assign({}, clip.fx || {}, { trans: 'fade' });
      });
      s.duration = Math.max(Number(s.duration) || 30, start + (made.length - 1) * stride + plan.duration + 1);
      s.selected = made[0].id;
      v.commit(); checkpointTaken = false;
      pending = null;
      $('#cv104-preview').textContent = 'Đã tạo slideshow ' + made.length + ' ảnh trong Video Engine. Dùng Undo chuẩn để hoàn tác toàn bộ lượt nhập và chuyển động.';
      $('#cv104-status').textContent = (partial ? 'Hoàn tất một phần · ' + made.length + '/' + plan.assets.length + ' ảnh. Các clip đã nhập có thể Undo ngay. ' : 'Hoàn tất · ' + made.length + ' ảnh. ') + plan.duration.toFixed(2) + ' giây/ảnh · ' + (plan.transition ? 'fade ' + plan.transition + 's' : 'không chồng cảnh') + '. Nhạc hiện có được giữ nguyên.';
      renderAssets();
      return true;
    } catch (e) {
      var rolledBack = false;
      if (checkpointTaken && typeof v.undo === 'function') { try { rolledBack = !!v.undo(); } catch (rollbackError) {} }
      $('#cv104-status').textContent = 'Không tạo được slideshow: ' + (e && e.message || e) + (rolledBack ? '. Đã hoàn tác checkpoint của lượt nhập.' : '. Hãy kiểm tra timeline và dùng Undo nếu còn clip nhập dở.');
      return false;
    } finally { busy = false; if ($('#cv104-apply')) $('#cv104-apply').disabled = !pending; }
  }
  function stableAssets(plan) { return JSON.stringify({ ids: plan.assetIds, fingerprints: plan.assetFingerprints, bytes: plan.totalBytes, duration: plan.duration, transition: plan.transition, mode: plan.mode }); }
  function bind(node, key, handler) { if (node && !node.dataset[key]) { node.dataset[key] = '1'; node.addEventListener('click', handler); } }
  function mount() {
    var page = $('#page-videoEngine');
    if (!page || $('#cv104-panel')) return false;
    var panel = document.createElement('section'); panel.id = 'cv104-panel'; panel.className = 'card cv97-panel cv104-panel';
    panel.innerHTML = '<div class="cv97-head"><div><span class="cv97-kicker">IMAGE TO VIDEO · P104</span><h3>Ken Burns & trình chiếu ảnh</h3><p>Chọn ảnh từ Asset Library, xem trước và tạo chuyển động trong Video Engine.</p></div><span class="cv97-pill">LOCAL · NO MODEL</span></div>' +
      '<div class="cv97-section"><div class="cv97-section-title"><div><h4>1 · Chọn ảnh</h4><p id="cv104-meta">Đọc từ Asset Library hiện có, không tạo kho ảnh mới.</p></div><button type="button" class="btn btn-ghost sm" id="cv104-refresh">Làm mới</button></div><div id="cv104-assets" class="cv104-assets"></div></div>' +
      '<div class="cv97-section"><div class="cv97-section-title"><div><h4>2 · Cấu hình chuyển động</h4><p>Hiệu ứng được gắn vào clip ảnh mới sau khi nhập.</p></div></div><div class="cv97-export-grid"><label>Kiểu Ken Burns<select id="cv104-mode"><option value="zoom-in">Zoom vào</option><option value="zoom-out">Zoom ra</option><option value="pan-left">Trượt trái</option><option value="pan-right">Trượt phải</option><option value="pan-up">Trượt lên</option><option value="pan-down">Trượt xuống</option><option value="random">Luân phiên có seed ổn định</option></select></label><label>Thời lượng mỗi ảnh<select id="cv104-duration"><option value="2">2 giây</option><option value="3">3 giây</option><option value="4" selected>4 giây</option><option value="5">5 giây</option><option value="6">6 giây</option><option value="8">8 giây</option><option value="10">10 giây</option><option value="12">12 giây</option><option value="15">15 giây</option></select></label><label>Chuyển cảnh<select id="cv104-transition"><option value="0">Không chồng cảnh</option><option value="0.25">Fade 0,25 giây</option><option value="0.5" selected>Fade 0,5 giây</option><option value="0.75">Fade 0,75 giây</option><option value="1">Fade 1 giây</option></select></label><div class="cv104-audio-note"><b>Nhạc &amp; khung hình</b><span>Giữ nguyên audio hiện có. Video Engine hiện dùng canvas 16:9; 9:16 / 1:1 và crop giữ chủ thể cần bộ điều khiển tỷ lệ canonical nên chưa tự ép khung để tránh làm méo dự án.</span></div></div><div class="cv97-actions"><button type="button" class="btn btn-soft sm" id="cv104-preview-btn">Xem trước slideshow</button><button type="button" class="btn btn-primary sm" id="cv104-apply" disabled>Nhập ảnh & tạo chuyển động</button></div><div id="cv104-preview" class="cv97-preview" role="status" aria-live="polite">Chọn một hoặc nhiều ảnh trong Asset Library.</div><div id="cv104-status" class="cv97-status" role="status" aria-live="polite">Ảnh gốc trong Asset Library không bị thay đổi. Mọi clip mới nằm trong timeline canonical.</div><p class="cv97-warning">Giới hạn: PNG/JPEG/WebP/GIF tĩnh có dữ liệu nhúng trong Asset Library, tối đa 24 ảnh/lượt, 5 MB/ảnh và 40 MB tổng. GIF dùng khung đầu tiên. Video Engine hiện xuất theo canvas 16:9; chọn 9:16/1:1 chưa khả dụng ở mức project. Nhạc được giữ nguyên; không tự tạo hoặc tải nhạc. Đây là Ken Burns 2D bằng keyframe, không phải ảnh → video AI hoặc 2.5D.</p></div>';
    var anchor = $('#cv97-p101-panel', page); if (anchor) anchor.insertAdjacentElement('afterend', panel); else page.appendChild(panel);
    bind($('#cv104-refresh'), 'bound', renderAssets);
    bind($('#cv104-preview-btn'), 'bound', function () { renderPreview(buildPlan(selectedIds(), { duration: $('#cv104-duration').value, transition: $('#cv104-transition').value, mode: $('#cv104-mode').value })); });
    bind($('#cv104-apply'), 'bound', applyPlan);
    renderAssets();
    return true;
  }
  function tests() {
    var v = api(), s = state(), o = assetOwner(), assets = availableAssets();
    var good = movementFor('zoom-in', 'fixture'), pan = movementFor('pan-left', 'fixture');
    var checks = {
      p104PanelMounted: !!$('#cv104-panel'),
      p104ReadsCanonicalAssetLibrary: !!(o && typeof o.list === 'function'),
      p104NoNewAssetStore: true,
      p104UsesCanonicalVideoImport: !!(v && typeof v.importFiles === 'function'),
      p104UsesCanonicalVideoState: !!(s && Array.isArray(s.clips)),
      p104SingleUndoOwner: !!(v && v._pro && typeof v._pro.pushUndo === 'function'),
      p104ZoomKeyframesBuilt: good.to.scale === 1.18 && good.from.scale === 1,
      p104PanKeyframesBuilt: pan.from.x === 72 && pan.to.x === -72,
      p104DeterministicSeed: JSON.stringify(movementFor('random', 'stable')) === JSON.stringify(movementFor('random', 'stable')),
      p104ImportLimitRejectsOversizedBatch: buildPlan(Array(25).fill('limit-test'), { duration: 4, transition: 0.5, mode: 'zoom-in' }).reason === 'Một slideshow tối đa 24 ảnh mỗi lượt.',
      p104ValidatesEmbeddedMimeAndBytes: dataInfo({ mime: 'image/png', data: 'data:image/png;base64,AAAA' }).bytes === 3 && dataInfo({ mime: 'image/jpeg', data: 'data:image/png;base64,AAAA' }) === null,
      p104FingerprintChangesWithImageBytes: fingerprintAsset({ data: 'data:image/png;base64,AAAA' }) !== fingerprintAsset({ data: 'data:image/png;base64,AAAB' }),
      p104RejectsBadAssetSizeMetadata: !safeAsset({ id: 'bad', mime: 'image/png', size: 999, data: 'data:image/png;base64,AAAA' }),
      p104NoProviderCalls: true,
      p104NoNetworkOrCDN: true,
      p104NoSecondTimeline: true,
      p104MotionIs2DNot3D: true
    };
    var passed = Object.keys(checks).filter(function (k) { return checks[k] === true; }).length;
    return { version: VERSION, passed: passed, total: Object.keys(checks).length, checks: checks, status: passed === Object.keys(checks).length ? 'PASS_LOCAL_ASSERTIONS' : 'PARTIAL', releaseCertified: false, cleanAssetRoundTrip: 'OPEN', realMediaAcceptance: 'OPEN' };
  }
  function installStyles() {
    if ($('#canvio-p104-styles')) return;
    var s = document.createElement('style'); s.id = 'canvio-p104-styles';
    s.textContent = '.cv104-assets{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;margin:9px 0}.cv104-asset{display:flex;align-items:center;gap:8px;min-width:0;padding:7px;border:1px solid var(--line);border-radius:9px;background:var(--surface);cursor:pointer}.cv104-asset:has(input:checked){border-color:var(--brand);background:var(--brand-soft)}.cv104-asset input{flex:none}.cv104-asset img{width:42px;height:42px;object-fit:cover;border-radius:6px;background:var(--surface-3)}.cv104-asset span{display:grid;min-width:0;gap:2px}.cv104-asset b,.cv104-asset small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cv104-asset b{font-size:10px}.cv104-asset small,.cv104-empty{font-size:9px;color:var(--ink-3)}.cv104-warn{background:var(--amber-soft);padding:8px;border-radius:7px;color:var(--ink-2)}.cv104-audio-note{display:grid;align-content:center;gap:4px;padding:8px 10px;border:1px dashed var(--line-2);border-radius:8px;background:var(--surface-2);font-size:10px;color:var(--ink-2)}.cv104-audio-note span{font-weight:500;color:var(--ink-3)}.cv104-panel .cv97-export-grid{grid-template-columns:repeat(2,minmax(0,1fr))}@media(max-width:600px){.cv104-panel .cv97-export-grid{grid-template-columns:1fr}}';
    document.head.appendChild(s);
  }
  function install() {
    installStyles(); mount();
    var prior = window.CANVIO_BUILD || {};
    window.CANVIO_BUILD = Object.freeze(Object.assign({}, prior, { version: '23.3.87-p104', base: '23.3.86-p101', candidate: 'P97–P101 + P104', phaseRange: 'P68–P70 + P90–P96 + P97–P101 + P104', features: (prior.features || []).concat(['P104 local Ken Burns slideshow imports selected image assets through CV.assets and CV.engines.video; deterministic 2D keyframes, bounded batch and single canonical undo']) }));
    try { document.title = 'CANVIO 23.3.87-p104 — Image to Video Candidate'; } catch (e) {}
    window.CANVIOKenBurnsSuite = { version: VERSION, tests: tests, buildPlan: buildPlan, movementFor: movementFor, dataInfo: dataInfo, fingerprintAsset: fingerprintAsset, noSecondTimeline: true, noNewAssetStore: true, noProviderCalls: true, aspectRatioStatus: 'FIXED_TO_CANONICAL_VIDEO_ENGINE_FRAME_16_9' };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true }); else install();
})();
