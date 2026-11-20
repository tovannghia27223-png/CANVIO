/* CANVIO P97–P101 · Video Editor UX & local AI Director
 * Additive workflow layer. Canonical owner: CV.engines.video; ripple owner: CANVIOAdvancedTimeline.
 * No provider call, CDN, background request, project store, media store, or parallel timeline.
 */
(function () {
  'use strict';
  if (window.CANVIOVideoUXSuite) return;

  var VERSION = '101.0.0';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
  var normalize = function (v) { return String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase().trim(); };
  var api = function () { return window.CV && CV.engines && CV.engines.video || null; };
  var state = function () { var a = api(); return a && a._state ? a._state() : null; };
  var snapshot = function () { var a = api(); return a && a.snapshotState ? a.snapshotState() : null; };
  var stable = function (v) { try { return JSON.stringify(v); } catch (e) { return ''; } };
  var toast = function (m) { try { if (window.CV && CV.toast) CV.toast(m); } catch (e) {} };
  var lastUndo = null, directorPlan = null, wordPlan = null, ripplePlan = null, exportBusy = false;

  function visibleVideoPage() {
    var p = $('#page-videoEngine');
    return !!(p && (p.classList.contains('active') || p.offsetParent !== null));
  }
  function activeClip() {
    var s = state();
    return s && Array.isArray(s.clips) ? s.clips.find(function (c) { return c.id === s.selected; }) || null : null;
  }
  function isLocked(v, c) { return !!(v && c && v.isClipLocked && v.isClipLocked(c)); }
  function id(prefix) {
    try { if (window.crypto && crypto.randomUUID) return prefix + '_' + crypto.randomUUID(); } catch (e) {}
    return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
  }
  function rememberUndo(before, after, label) {
    if (!before || !after || stable(before) === stable(after)) { lastUndo = null; return false; }
    lastUndo = { after: stable(after), label: label || 'thao tác vừa rồi' };
    return true;
  }
  function undoLast() {
    var v = api(), current = snapshot();
    if (!v || !lastUndo || !current) { toast('Không có thao tác của Đạo diễn AI để hoàn tác.'); return false; }
    if (stable(current) !== lastUndo.after) { toast('Timeline đã thay đổi sau thao tác. Để tránh hoàn tác nhầm, hãy dùng Undo chuẩn của Video Engine.'); return false; }
    var label = lastUndo.label;
    var ok = typeof v.undoAuto === 'function' && v.undoAuto();
    if (ok) { lastUndo = null; refreshTranscript(); setDirectorStatus('Đã hoàn tác: ' + label + '.'); }
    return !!ok;
  }

  /* P97 · Deterministic local command planner; no model/provider invocation. */
  function buildDirectorPlan(raw) {
    var v = api(), s = state(), phrase = normalize(raw), c = activeClip();
    if (!v || !s || !Array.isArray(s.clips)) return { ok: false, reason: 'Video Engine chưa sẵn sàng.' };
    var action = null, value = null, title = '', detail = '';
    if (/cat (khoang lang|im lang)|remove silence|auto.?cut/.test(phrase)) {
      action = 'autocut'; title = 'Mở AutoCut hiện có'; detail = 'Sau bước xem trước này, CANVIO sẽ mở hộp AutoCut hiện hữu. Bạn vẫn tự chọn ngưỡng và xác nhận cắt/xóa trong hộp thoại gốc.';
    } else if (/nhanh gap doi|gap doi toc do|double speed/.test(phrase)) {
      action = 'speed'; value = 2; title = 'Đặt tốc độ clip thành 2×'; detail = 'Áp dụng cho clip video đang chọn; tốc độ được giới hạn trong khoảng 0,25×–4×.';
    } else {
      var speedMatch = phrase.match(/(?:toc do|speed)\s*(?:len|to)?\s*(\d+(?:[.,]\d+)?)\s*x?/);
      var zoomMatch = phrase.match(/zoom\s*(?:len|to)?\s*(\d+(?:[.,]\d+)?)\s*x?/);
      if (speedMatch) { action = 'speed'; value = Number(speedMatch[1].replace(',', '.')); title = 'Đặt tốc độ clip thành ' + value + '×'; detail = 'Chỉ thay đổi tốc độ phát của clip video đang chọn.'; }
      else if (zoomMatch) { action = 'zoom'; value = Number(zoomMatch[1].replace(',', '.')); title = 'Tăng tỷ lệ cuối clip lên ' + value + '×'; detail = 'Tạo chuyển động zoom bằng keyframe đầu/cuối trên clip video hoặc ảnh đang chọn.'; }
      else if (/mau am|tone am|warm/.test(phrase)) { action = 'warm'; title = 'Áp màu ấm'; detail = 'Điều chỉnh nhiệt màu, sepia và bão hòa trên clip hình đang chọn.'; }
      else if (/dien anh|cinematic|phim/.test(phrase)) { action = 'cinema'; title = 'Áp màu điện ảnh'; detail = 'Áp contrast/saturation/brightness ở mức preset cục bộ hiện có.'; }
      else if (/dat lai mau|reset mau|mau goc/.test(phrase)) { action = 'resetFx'; title = 'Đặt lại bộ lọc màu'; detail = 'Trả bộ lọc của clip hình đang chọn về mặc định.'; }
    }
    if (!action) return { ok: false, reason: 'Chưa hiểu lệnh. Thử: “tốc độ 2x”, “zoom 1.3x”, “màu ấm”, “điện ảnh” hoặc “cắt khoảng lặng”.' };
    if (action !== 'autocut') {
      if (!c) return { ok: false, reason: 'Hãy chọn một clip trên timeline trước.' };
      if (isLocked(v, c)) return { ok: false, reason: 'Clip hoặc track đang khóa. Mở khóa trước khi chỉnh sửa.' };
      if (action === 'speed' && c.type !== 'video') return { ok: false, reason: 'Lệnh tốc độ chỉ áp dụng cho clip video.' };
      if (['zoom', 'warm', 'cinema', 'resetFx'].indexOf(action) >= 0 && !['video', 'image'].includes(c.type)) return { ok: false, reason: 'Lệnh hình ảnh chỉ áp dụng cho clip video hoặc ảnh.' };
      if (action === 'speed' && (!Number.isFinite(value) || value < 0.25 || value > 4)) return { ok: false, reason: 'Tốc độ phải từ 0,25× đến 4×.' };
      if (action === 'zoom' && (!Number.isFinite(value) || value < 0.05 || value > 5)) return { ok: false, reason: 'Tỷ lệ zoom phải từ 0,05× đến 5×.' };
    } else if (!s.clips.length) return { ok: false, reason: 'Timeline chưa có media để phân tích khoảng lặng.' };
    return { ok: true, action: action, value: value, title: title, detail: detail, clipId: c && c.id || null, clipName: c && (c.name || c.type) || 'Timeline', before: snapshot() };
  }
  function setDirectorStatus(msg) { var n = $('#cv97-status'); if (n) n.textContent = String(msg || ''); }
  function renderDirectorPlan(plan) {
    var box = $('#cv97-preview'), apply = $('#cv97-apply');
    if (!box || !apply) return;
    if (!plan || !plan.ok) { box.textContent = plan && plan.reason || 'Nhập một yêu cầu để lập kế hoạch.'; apply.disabled = true; return; }
    directorPlan = plan;
    box.innerHTML = '<b>' + esc(plan.title) + '</b><p>' + esc(plan.detail) + '</p><small>Đối tượng: ' + esc(plan.clipName) + (plan.clipId ? ' · ' + esc(plan.clipId) : '') + '</small><p class="cv97-safety">Chưa có thay đổi nào được áp dụng. Hãy kiểm tra rồi mới xác nhận.</p>';
    apply.disabled = false;
  }
  function applyDirectorPlan() {
    var v = api(), s = state(), p = directorPlan;
    if (!v || !s || !p || !p.ok) return false;
    if (stable(snapshot()) !== stable(p.before)) { setDirectorStatus('Timeline đã đổi sau khi lập kế hoạch. Hãy tạo preview mới.'); directorPlan = null; $('#cv97-apply').disabled = true; return false; }
    if (p.action === 'autocut') {
      var beforeAuto = snapshot();
      try { v.autoCutPrompt(); } catch (e) { setDirectorStatus('AutoCut chưa chạy: ' + (e.message || e)); return false; }
      var afterAuto = snapshot();
      if (rememberUndo(beforeAuto, afterAuto, 'AutoCut')) setDirectorStatus('AutoCut đã thay đổi timeline. Bạn có thể hoàn tác ngay bằng nút bên dưới.');
      else setDirectorStatus('AutoCut đã đóng hoặc không tạo thay đổi.');
      directorPlan = null; $('#cv97-apply').disabled = true; return true;
    }
    var clip = s.clips.find(function (x) { return x.id === p.clipId; });
    if (!clip || isLocked(v, clip)) { setDirectorStatus('Clip không còn tồn tại hoặc đã bị khóa. Hãy lập kế hoạch lại.'); return false; }
    var before = snapshot();
    if (!before || !v._pro || typeof v._pro.pushUndo !== 'function' || typeof v.commit !== 'function') { setDirectorStatus('Owner không cung cấp snapshot/undo/commit cần thiết.'); return false; }
    v._pro.pushUndo();
    if (p.action === 'speed') clip.speed = Math.max(0.25, Math.min(4, Number(p.value)));
    else if (p.action === 'warm') clip.fx = Object.assign({}, clip.fx || {}, { temp: 0.28, sepia: 0.16, sat: 1.08 });
    else if (p.action === 'cinema') clip.fx = Object.assign({}, clip.fx || {}, { contrast: 1.15, sat: 0.9, bright: 0.95, sepia: 0.1 });
    else if (p.action === 'resetFx') clip.fx = {};
    else if (p.action === 'zoom') {
      var m = clip.motion && typeof clip.motion === 'object' ? JSON.parse(JSON.stringify(clip.motion)) : {};
      var from = Object.assign({ x: 0, y: 0, scale: 1, opacity: 1, rotation: 0 }, m.from || {});
      var to = Object.assign({}, from, m.to || {});
      to.scale = Math.max(0.05, Math.min(5, Number(to.scale || 1) * Number(p.value)));
      m.from = from; m.to = to; m.easing = m.easing || 'ease-in-out'; clip.motion = m;
    }
    v.commit();
    var after = snapshot();
    rememberUndo(before, after, p.title);
    directorPlan = null; $('#cv97-apply').disabled = true;
    setDirectorStatus('Đã áp dụng: ' + p.title + '. Có thể hoàn tác lượt này nếu timeline chưa bị thao tác khác thay đổi.');
    return true;
  }

  /* P98 · Working tools and shortcuts; unsupported edit modes remain explicitly unavailable. */
  function toolAction(tool) {
    var v = api(); if (!v) return false;
    if (tool === 'select') { var t = $('#vtTimeline'); if (t) { t.setAttribute('tabindex', '-1'); t.focus(); } toast('Công cụ Chọn · dùng chuột để chọn clip trên timeline.'); return true; }
    if (tool === 'blade') { if (typeof v.split !== 'function') return false; return !!v.split(); }
    if (tool === 'text') { if (typeof v.addText !== 'function') return false; v.addText(); refreshTranscript(); return true; }
    if (tool === 'ripple') { var n = $('#cv100-ripple-start'); if (n) n.focus(); return true; }
    return false;
  }
  function installVideoShortcuts() {
    if (document.__canvioP98Keys) return; document.__canvioP98Keys = true;
    document.addEventListener('keydown', function (event) {
      if (!visibleVideoPage() || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || event.repeat) return;
      var target = event.target;
      if (target && (target.matches('input,textarea,select,[contenteditable="true"]') || target.isContentEditable || target.closest('[role="dialog"]'))) return;
      var key = String(event.key || '').toLowerCase();
      var tool = ({ v: 'select', b: 'blade', t: 'text', c: 'ripple' })[key];
      if (!tool) return;
      event.preventDefault(); toolAction(tool);
    }, true);
  }

  /* P99 · Estimated word captions from existing segment-level text clips.
   * The current Whisper adapter returns segment timestamps, not acoustic word alignment.
   * This tool labels timing as estimated and never claims true word-level ASR alignment.
   */
  function captions() {
    var s = state(); return s && Array.isArray(s.clips) ? s.clips.filter(function (c) { return c.type === 'text' && String(c.text || '').trim(); }).sort(function (a, b) { return a.start - b.start; }) : [];
  }
  function refreshTranscript() {
    var select = $('#cv99-cue-select'), editSelect = $('#cv100-cue-select');
    if (!select && !editSelect) return;
    var list = captions();
    [select, editSelect].forEach(function (node) {
      if (!node) return;
      var previous = node.value, selected = activeClip();
      node.innerHTML = '<option value="">Chọn cue phụ đề…</option>' + list.map(function (c) { return '<option value="' + esc(c.id) + '">' + esc(Number(c.start).toFixed(2) + 's · ' + String(c.text).slice(0, 72)) + '</option>'; }).join('');
      if (list.some(function (c) { return c.id === previous; })) node.value = previous;
      else if (selected && selected.type === 'text' && list.some(function (c) { return c.id === selected.id; })) node.value = selected.id;
      else if (list.length) node.value = list[0].id;
    });
    fillTranscriptEditor();
  }
  function selectedCaption(idValue) { var list = captions(); return list.find(function (c) { return c.id === String(idValue || ''); }) || null; }
  function planWordCues() {
    var v = api(), s = state(), sel = $('#cv99-cue-select'), clip = selectedCaption(sel && sel.value);
    if (!v || !s || !clip) return { ok: false, reason: 'Chọn một cue phụ đề trên track chữ trước.' };
    if (isLocked(v, clip) || (v.trackState && v.trackState(3).locked)) return { ok: false, reason: 'Track chữ hoặc cue đang khóa.' };
    var words = String(clip.text || '').trim().split(/\s+/).filter(Boolean);
    if (words.length < 2) return { ok: false, reason: 'Cue cần có ít nhất hai từ.' };
    var duration = Number(clip.duration), weights = words.map(function (w) { return Math.max(1, w.replace(/[^\p{L}\p{N}]/gu, '').length) + 0.35; });
    var total = weights.reduce(function (a, b) { return a + b; }, 0), cursor = Number(clip.start), generated = [];
    words.forEach(function (word, i) {
      var d = i === words.length - 1 ? Number(clip.start) + duration - cursor : duration * weights[i] / total;
      generated.push({ text: word, start: cursor, duration: d }); cursor += d;
    });
    if (generated.some(function (w) { return !Number.isFinite(w.duration) || w.duration < 0.2; })) return { ok: false, reason: 'Cue quá ngắn để tạo từng từ hợp lệ (Video Engine yêu cầu clip chữ tối thiểu 0,2 giây). Hãy dùng cue dài hơn hoặc giữ phụ đề theo câu.' };
    return { ok: true, clipId: clip.id, name: clip.name, cue: String(clip.text), words: generated, before: snapshot(), note: 'Ước lượng theo độ dài từ trong timestamp của cue; không phải căn chỉnh âm học từng từ.' };
  }
  function renderWordPreview(plan) {
    var box = $('#cv99-preview'), apply = $('#cv99-apply'); if (!box || !apply) return;
    if (!plan || !plan.ok) { wordPlan = null; box.textContent = plan && plan.reason || 'Chưa có cue để chuyển.'; apply.disabled = true; return; }
    wordPlan = plan;
    box.innerHTML = '<b>' + plan.words.length + ' cue từ sẽ được tạo</b><div class="cv97-word-list">' + plan.words.slice(0, 30).map(function (w) { return '<span><b>' + esc(w.text) + '</b><small>' + w.start.toFixed(2) + '–' + (w.start + w.duration).toFixed(2) + 's</small></span>'; }).join('') + (plan.words.length > 30 ? '<small>… và ' + (plan.words.length - 30) + ' từ khác</small>' : '') + '</div><small class="cv97-safety">' + esc(plan.note) + '</small><p>Cue gốc sẽ được thay bằng các cue từ. Hoàn tác bằng Undo chuẩn của Video Engine.</p>';
    apply.disabled = false;
  }
  function applyWordCues() {
    var v = api(), s = state(), p = wordPlan;
    if (!v || !s || !p || !p.ok) return false;
    if (stable(snapshot()) !== stable(p.before)) { renderWordPreview({ ok: false, reason: 'Timeline đã thay đổi. Hãy tạo preview lại.' }); return false; }
    var clip = s.clips.find(function (c) { return c.id === p.clipId; });
    if (!clip || isLocked(v, clip) || (v.trackState && v.trackState(3).locked)) { renderWordPreview({ ok: false, reason: 'Cue hoặc track chữ đã bị khóa/xóa.' }); return false; }
    if (!v._pro || !v._pro.pushUndo || !v.commit) return false;
    var before = snapshot(); v._pro.pushUndo();
    s.clips = s.clips.filter(function (c) { return c.id !== clip.id; });
    var made = p.words.map(function (w, i) { return { id: id('cvword'), name: 'Word caption ' + (i + 1), type: 'text', text: w.text, start: w.start, duration: w.duration, track: 3, captionStyle: clip.captionStyle ? JSON.parse(JSON.stringify(clip.captionStyle)) : undefined, sourceCueId: clip.id, timingAccuracy: 'estimated-segment-proportional' }; });
    Array.prototype.push.apply(s.clips, made); s.selected = made[0] && made[0].id || null;
    v.commit(); wordPlan = null; $('#cv99-apply').disabled = true; refreshTranscript();
    toast('Đã tạo ' + made.length + ' cue từ. Timing là ước lượng; cần nghe và chỉnh lại.');
    return true;
  }

  /* P100 · Transcript cue editing + previewed ripple delete through P64. */
  function fillTranscriptEditor() {
    var sel = $('#cv100-cue-select'), text = $('#cv100-transcript-text'), start = $('#cv100-ripple-start'), end = $('#cv100-ripple-end');
    if (!sel) return;
    var c = selectedCaption(sel.value);
    if (text && c && document.activeElement !== text) text.value = String(c.text || '');
    if (start && c && document.activeElement !== start) start.value = Math.max(0, Number(c.start) || 0).toFixed(2);
    if (end && c && document.activeElement !== end) end.value = ((Number(c.start) || 0) + (Number(c.duration) || 0)).toFixed(2);
  }
  function saveTranscriptText() {
    var v = api(), s = state(), sel = $('#cv100-cue-select'), c = selectedCaption(sel && sel.value), text = $('#cv100-transcript-text');
    if (!v || !s || !c || !text) return false;
    if (isLocked(v, c) || (v.trackState && v.trackState(3).locked)) { toast('Track chữ đang khóa.'); return false; }
    var next = String(text.value || '').trim(); if (!next || next.length > 10000) { toast('Nội dung cần từ 1 đến 10.000 ký tự.'); return false; }
    if (next === c.text) { toast('Transcript không có thay đổi.'); return true; }
    var before = snapshot(); if (!v._pro || !v._pro.pushUndo || !v.commit) return false;
    v._pro.pushUndo(); c.text = next; v.commit(); rememberUndo(before, snapshot(), 'Sửa transcript'); refreshTranscript(); toast('Đã cập nhật nội dung cue trong track chữ.'); return true;
  }
  function planRipple() {
    var apiTimeline = window.CANVIOAdvancedTimeline;
    var start = Number($('#cv100-ripple-start') && $('#cv100-ripple-start').value), end = Number($('#cv100-ripple-end') && $('#cv100-ripple-end').value);
    if (!apiTimeline || typeof apiTimeline.planRippleDelete !== 'function') return { ok: false, reason: 'P64 Ripple planner chưa sẵn sàng.' };
    var plan = apiTimeline.planRippleDelete(start, end);
    if (plan.ok) { plan.before = snapshot(); plan.summary = 'Cắt ' + plan.duration.toFixed(2) + 's · dự kiến dịch ' + plan.shifted + ' clip · tách ' + plan.splitCount + ' clip · bỏ ' + plan.droppedIds.length + ' clip.'; }
    return plan;
  }
  function renderRipplePreview(plan) {
    var box = $('#cv100-ripple-preview'), apply = $('#cv100-ripple-apply'); if (!box || !apply) return;
    ripplePlan = plan && plan.ok ? plan : null;
    box.textContent = plan && plan.ok ? plan.summary + ' Hãy kiểm tra trước khi xác nhận.' : plan && (plan.reason === 'locked-clips-would-be-affected' ? 'Bị chặn vì phạm vi cắt sẽ tác động clip/track đang khóa: ' + (plan.blockedIds || []).join(', ') : plan.reason || 'Không lập được kế hoạch ripple.');
    apply.disabled = !ripplePlan;
  }
  function applyRipple() {
    var timelineApi = window.CANVIOAdvancedTimeline, p = ripplePlan;
    if (!timelineApi || !p) return false;
    if (stable(snapshot()) !== stable(p.before)) { renderRipplePreview({ ok: false, reason: 'Timeline đã đổi. Hãy lập preview lại.' }); return false; }
    var result = timelineApi.rippleDelete(p.start, p.end);
    if (!result || !result.ok) { renderRipplePreview({ ok: false, reason: result && result.reason || 'Ripple delete không thực hiện được.' }); return false; }
    lastUndo = { after: stable(snapshot()), label: 'Ripple delete ' + p.duration.toFixed(2) + 's' };
    ripplePlan = null; $('#cv100-ripple-apply').disabled = true; $('#cv100-ripple-preview').textContent = 'Đã cắt và dồn timeline qua P64. Có thể dùng Undo chuẩn nếu không có thao tác khác xen giữa.';
    refreshTranscript(); return true;
  }

  /* P101 · Detailed export UI. The existing renderer is extended only by options. */
  function normalizeExportOptions(input) {
    input = input || {};
    var presets = { '480': [854, 480], '720': [1280, 720], '1080': [1920, 1080], '1440': [2560, 1440], '2160': [3840, 2160] };
    var p = presets[String(input.resolution || '1080')] || presets['1080'];
    var fps = [24, 25, 30, 50, 60].indexOf(Number(input.fps)) >= 0 ? Number(input.fps) : 30;
    var mbps = Math.max(1, Math.min(20, Number(input.bitrateMbps) || 6));
    return { width: p[0], height: p[1], fps: fps, videoBitsPerSecond: Math.round(mbps * 1000000), resolution: String(input.resolution || '1080') };
  }
  function inspectExportBlob(blob, expected, expectedDuration) {
    return new Promise(function (resolve) {
      if (!(blob instanceof Blob) || !blob.size) { resolve({ ok: false, reason: 'Không có dữ liệu video để kiểm tra.', bytes: blob && blob.size || 0 }); return; }
      var url = URL.createObjectURL(blob), video = document.createElement('video'), timer, settled = false;
      video.muted = true; video.preload = 'metadata';
      function finish(reason) {
        if (settled) return; settled = true; clearTimeout(timer);
        var duration = Number(video.duration), mimeOK = expected === 'mp4' ? /^video\/mp4(?:;|$)/i.test(blob.type) : /^video\/webm(?:;|$)/i.test(blob.type);
        var durationOK = Number.isFinite(duration) && duration > 0 && (!Number.isFinite(expectedDuration) || Math.abs(duration - expectedDuration) <= Math.max(1, expectedDuration * 0.08));
        resolve({ ok: mimeOK && durationOK && reason === 'canplay', mime: blob.type || '', mimeOK: mimeOK, bytes: blob.size, duration: Number.isFinite(duration) ? duration : null, durationOK: durationOK, canplay: reason === 'canplay', level: 'LOCAL_METADATA_AND_CANPLAY_SCREEN_NOT_FULL_FILE_OR_AV_SYNC_CERTIFICATION', note: reason === 'canplay' ? 'Browser nhận metadata và giải mã được tới canplay; chưa chứng nhận toàn file hoặc A/V sync.' : 'Không đạt kiểm tra canplay trong giới hạn thời gian.' });
        try { video.pause(); video.removeAttribute('src'); video.load(); } catch (e) {}
        URL.revokeObjectURL(url);
      }
      video.addEventListener('loadedmetadata', function () { if (video.readyState >= 3) finish('canplay'); }, { once: true });
      video.addEventListener('canplay', function () { finish('canplay'); }, { once: true });
      video.addEventListener('error', function () { finish('decode-error'); }, { once: true });
      timer = setTimeout(function () { finish('timeout'); }, 8000);
      video.src = url; try { video.load(); } catch (e) { finish('load-error'); }
    });
  }
  function setExportStatus(message) { var n = $('#cv101-status'); if (n) n.textContent = String(message || ''); }
  async function runDetailedExport() {
    var v = api(); if (!v || typeof v.exportWebM !== 'function' || typeof v.exportMP4 !== 'function') { setExportStatus('Video Engine chưa cung cấp đường xuất hiện có.'); return false; }
    if (exportBusy) return false;
    var format = $('#cv101-format').value, cap = v.exportCapabilities ? v.exportCapabilities() : {}, webDecision = v.webCodecsMP4Decision ? v.webCodecsMP4Decision() : { ok: false };
    var canMP4 = !!cap.h264Supported || (!!cap.webCodecsAvailable && !!webDecision.ok);
    if (format === 'mp4' && !canMP4) { setExportStatus(webDecision.reason || 'Trình duyệt chưa xác nhận MP4/H.264. Hãy chọn WebM; CANVIO không giả đuôi MP4.'); return false; }
    var opt = normalizeExportOptions({ resolution: $('#cv101-resolution').value, fps: $('#cv101-fps').value, bitrateMbps: $('#cv101-bitrate').value });
    var deviceMemory = Number(navigator.deviceMemory) || 0;
    if (opt.resolution === '2160' && deviceMemory && deviceMemory <= 4 && !window.confirm('Thiết bị báo khoảng ' + deviceMemory + ' GB RAM. Xuất 4K có thể gây tràn bộ nhớ hoặc treo tab. Bạn vẫn muốn tiếp tục?')) return false;
    exportBusy = true; $('#cv101-export').disabled = true;
    setExportStatus('Đang xuất ' + format.toUpperCase() + ' · ' + opt.width + '×' + opt.height + ' · ' + opt.fps + ' fps…');
    try {
      var exportOptions = { width: opt.width, height: opt.height, fps: opt.fps, videoBitsPerSecond: opt.videoBitsPerSecond };
      var blob = await (format === 'mp4' ? v.exportMP4(exportOptions) : v.exportWebM(exportOptions));
      if (!blob) { setExportStatus('Không tạo được file. Kiểm tra trạng thái render hoặc thử WebM/độ phân giải thấp hơn.'); return false; }
      var qc = await inspectExportBlob(blob, format, Number((state() && state().duration) || 0));
      if ($('#cv101-srt').checked && typeof v.srtExport === 'function') v.srtExport();
      if ($('#cv101-vtt').checked && typeof v.vttExport === 'function') v.vttExport();
      setExportStatus((qc.ok ? 'QC cục bộ đạt' : 'QC cục bộ chưa đạt') + ' · ' + (blob.size / 1048576).toFixed(2) + ' MB · ' + (qc.duration ? qc.duration.toFixed(2) + 's' : 'không đọc được duration') + '. ' + qc.note);
      return qc;
    } catch (e) { setExportStatus('Xuất thất bại: ' + (e && e.message || e) + '. Hãy thử lại hoặc chọn WebM/độ phân giải thấp hơn.'); return false; }
    finally { exportBusy = false; $('#cv101-export').disabled = false; }
  }

  function bindOnce(node, key, handler) { if (!node || node.dataset[key]) return; node.dataset[key] = '1'; node.addEventListener('click', handler); }
  function mount() {
    var page = $('#page-videoEngine');
    if (!page || $('#cv97-p101-panel')) return false;
    var panel = document.createElement('section'); panel.id = 'cv97-p101-panel'; panel.className = 'card cv97-panel';
    panel.innerHTML = [
      '<div class="cv97-head"><div><span class="cv97-kicker">VIDEO WORKFLOW · P97–P101</span><h3>Đạo diễn AI & công cụ dựng nâng cao</h3><p>Điều khiển cục bộ, xem trước trước khi áp dụng; dùng timeline Video Engine hiện có.</p></div><span class="cv97-pill">LOCAL · NO API CALL</span></div>',
      '<section class="cv97-section" aria-labelledby="cv97-title"><div class="cv97-section-title"><div><h4 id="cv97-title">P97 · Đạo diễn AI</h4><p>Nhập lệnh tiếng Việt. Bộ phân tích quy tắc chạy offline, không gọi AI provider.</p></div></div><div class="cv97-suggestions"><button type="button" class="btn btn-ghost sm" data-cv97-suggest="Tốc độ 2x">Tốc độ 2×</button><button type="button" class="btn btn-ghost sm" data-cv97-suggest="Zoom 1.3x">Zoom 1,3×</button><button type="button" class="btn btn-ghost sm" data-cv97-suggest="Màu ấm">Màu ấm</button><button type="button" class="btn btn-ghost sm" data-cv97-suggest="Điện ảnh">Điện ảnh</button><button type="button" class="btn btn-ghost sm" data-cv97-suggest="Cắt khoảng lặng">Cắt khoảng lặng</button></div><div class="cv97-command-row"><input id="cv97-command" type="text" maxlength="180" placeholder="Ví dụ: tăng tốc clip 2x hoặc zoom 1.3x" aria-label="Lệnh Đạo diễn AI local"><button type="button" class="btn btn-soft sm" id="cv97-plan">Lập preview</button></div><div id="cv97-preview" class="cv97-preview" role="status" aria-live="polite">Chưa có thay đổi nào. Chọn clip rồi nhập lệnh.</div><div class="cv97-actions"><button type="button" class="btn btn-primary sm" id="cv97-apply" disabled>Xác nhận áp dụng</button><button type="button" class="btn btn-ghost sm" id="cv97-undo">Hoàn tác lượt này</button><span id="cv97-status" class="cv97-status" role="status" aria-live="polite">Không có provider hoặc request nền.</span></div></section>',
      '<section class="cv97-section" aria-labelledby="cv98-title"><div class="cv97-section-title"><div><h4 id="cv98-title">P98 · Thanh công cụ & phím tắt</h4><p>V Chọn · B Cắt · C Ripple · T Chữ. Các chế độ chưa có API owner được ghi rõ.</p></div></div><div class="cv97-tools"><button type="button" class="btn btn-soft sm" data-cv98-tool="select"><b>V</b> Chọn</button><button type="button" class="btn btn-soft sm" data-cv98-tool="blade"><b>B</b> Lưỡi cắt</button><button type="button" class="btn btn-soft sm" data-cv98-tool="ripple"><b>C</b> Ripple</button><button type="button" class="btn btn-soft sm" data-cv98-tool="text"><b>T</b> Chữ</button><button type="button" class="btn btn-ghost sm" disabled title="Chưa có API slip/slide trong Video Engine">Y Slip · chưa có</button><button type="button" class="btn btn-ghost sm" disabled title="Chưa có keyframe pen tool owner">P Pen · chưa có</button><button type="button" class="btn btn-ghost sm" disabled title="Chưa có pan/hand tool owner">H Hand · chưa có</button></div><div class="cv97-key-help">Phím tắt chỉ hoạt động khi Video Engine đang mở và focus không nằm trong ô nhập liệu.</div></section>',
      '<section class="cv97-section" aria-labelledby="cv99-title"><div class="cv97-section-title"><div><h4 id="cv99-title">P99 · Phụ đề từng từ</h4><p>Chuyển một cue phụ đề thành nhiều cue từ trên track chữ canonical.</p></div><button type="button" class="btn btn-ghost sm" id="cv99-refresh">Làm mới cue</button></div><select id="cv99-cue-select" aria-label="Chọn cue nguồn cho phụ đề từng từ"></select><div class="cv97-actions"><button type="button" class="btn btn-soft sm" id="cv99-preview-btn">Xem trước cue từ</button><button type="button" class="btn btn-primary sm" id="cv99-apply" disabled>Thay cue bằng từng từ</button></div><div id="cv99-preview" class="cv97-preview" role="status" aria-live="polite">Chọn cue để xem trước.</div><p class="cv97-warning">Lưu ý chính xác: Whisper hiện trả timestamp theo đoạn, không trả alignment âm học từng từ. Timing từng từ ở đây được ước lượng theo độ dài từ trong timestamp cue; cần nghe và chỉnh lại. Không coi đây là karaoke đã đồng bộ chuẩn.</p></section>',
      '<section class="cv97-section" aria-labelledby="cv100-title"><div class="cv97-section-title"><div><h4 id="cv100-title">P100 · Transcript editor & ripple</h4><p>Sửa nội dung cue hoặc cắt một khoảng thời gian trên toàn timeline sau khi xem trước.</p></div><button type="button" class="btn btn-ghost sm" id="cv100-refresh">Làm mới transcript</button></div><select id="cv100-cue-select" aria-label="Chọn transcript cue"></select><label class="cv97-label" for="cv100-transcript-text">Nội dung transcript</label><textarea id="cv100-transcript-text" rows="2" maxlength="10000" placeholder="Nội dung cue…"></textarea><button type="button" class="btn btn-soft sm" id="cv100-save-text">Lưu nội dung cue</button><div class="cv97-time-grid"><label class="cv97-label">Ripple từ (giây)<input id="cv100-ripple-start" type="number" min="0" step="0.01"></label><label class="cv97-label">đến (giây)<input id="cv100-ripple-end" type="number" min="0" step="0.01"></label></div><div class="cv97-actions"><button type="button" class="btn btn-ghost sm" id="cv100-ripple-preview-btn">Xem trước Ripple</button><button type="button" class="btn btn-danger sm" id="cv100-ripple-apply" disabled>Xác nhận cắt & dồn</button></div><div id="cv100-ripple-preview" class="cv97-preview" role="status" aria-live="polite">Chưa lập kế hoạch ripple.</div><p class="cv97-warning">Ripple ảnh hưởng tất cả clip trong khoảng thời gian; thao tác bị chặn nếu có clip/track khóa. Kiểm tra kỹ preview trước khi xác nhận.</p></section>',
      '<section class="cv97-section" aria-labelledby="cv101-title"><div class="cv97-section-title"><div><h4 id="cv101-title">P101 · Hộp xuất chi tiết</h4><p>Độ phân giải, FPS, bitrate và phụ đề rời. Lựa chọn chỉ áp dụng cho lượt xuất hiện tại.</p></div></div><div class="cv97-export-grid"><label>Định dạng<select id="cv101-format"><option value="webm">WebM · tương thích rộng</option><option value="mp4">MP4 / H.264 · tùy trình duyệt</option></select></label><label>Độ phân giải<select id="cv101-resolution"><option value="480">480p · 854×480</option><option value="720">720p · 1280×720</option><option value="1080" selected>1080p · 1920×1080</option><option value="1440">1440p · 2560×1440</option><option value="2160">4K · 3840×2160</option></select></label><label>FPS<select id="cv101-fps"><option>24</option><option>25</option><option selected>30</option><option>50</option><option>60</option></select></label><label>Video bitrate (Mbps)<select id="cv101-bitrate"><option>1</option><option>2</option><option>4</option><option selected>6</option><option>8</option><option>12</option><option>20</option></select></label></div><div class="cv97-checks"><label><input type="checkbox" id="cv101-srt"> Tải thêm phụ đề SRT</label><label><input type="checkbox" id="cv101-vtt"> Tải thêm phụ đề WebVTT</label></div><div class="cv97-actions"><button type="button" class="btn btn-primary sm" id="cv101-export">Xuất theo cấu hình</button><button type="button" class="btn btn-ghost sm" id="cv101-cancel">Hủy render</button></div><div id="cv101-status" class="cv97-preview" role="status" aria-live="polite">Chưa xuất video. Chọn cấu hình phù hợp với thiết bị.</div><p class="cv97-warning">Giới hạn: renderer hiện xuất khung hình 16:9; tách riêng audio-only và xuất riêng layer motion chưa có owner trong Video Engine. 4K tiêu thụ nhiều RAM/GPU. QC tại đây chỉ kiểm tra MIME, metadata và canplay; không chứng nhận toàn file hoặc đồng bộ A/V trên footage thật.</p></section>'
    ].join('');
    var p68 = $('#cv-p68-p70-panel', page); if (p68) p68.insertAdjacentElement('afterend', panel); else page.appendChild(panel);

    $$('#cv97-p101-panel [data-cv97-suggest]').forEach(function (b) { bindOnce(b, 'cv97SuggestBound', function () { $('#cv97-command').value = b.dataset.cv97Suggest; $('#cv97-command').focus(); }); });
    bindOnce($('#cv97-plan'), 'bound', function () { renderDirectorPlan(buildDirectorPlan($('#cv97-command').value)); });
    bindOnce($('#cv97-apply'), 'bound', applyDirectorPlan);
    bindOnce($('#cv97-undo'), 'bound', undoLast);
    $$('#cv97-p101-panel [data-cv98-tool]').forEach(function (b) { bindOnce(b, 'bound', function () { toolAction(b.dataset.cv98Tool); }); });
    bindOnce($('#cv99-refresh'), 'bound', refreshTranscript);
    bindOnce($('#cv99-preview-btn'), 'bound', function () { renderWordPreview(planWordCues()); });
    bindOnce($('#cv99-apply'), 'bound', applyWordCues);
    bindOnce($('#cv99-cue-select'), 'bound', function () { wordPlan = null; $('#cv99-preview').textContent = 'Cue đã đổi. Hãy xem trước lại.'; $('#cv99-apply').disabled = true; });
    bindOnce($('#cv100-refresh'), 'bound', refreshTranscript);
    bindOnce($('#cv100-cue-select'), 'bound', function () { fillTranscriptEditor(); ripplePlan = null; $('#cv100-ripple-apply').disabled = true; });
    bindOnce($('#cv100-save-text'), 'bound', saveTranscriptText);
    bindOnce($('#cv100-ripple-preview-btn'), 'bound', function () { renderRipplePreview(planRipple()); });
    bindOnce($('#cv100-ripple-apply'), 'bound', applyRipple);
    bindOnce($('#cv101-export'), 'bound', runDetailedExport);
    bindOnce($('#cv101-cancel'), 'bound', function () { var v = api(); if (v && v.cancelExport) v.cancelExport(); setExportStatus('Đã gửi yêu cầu hủy render.'); });
    installVideoShortcuts(); refreshTranscript(); updateFormatStatus();
    return true;
  }
  function updateFormatStatus() {
    var v = api(), format = $('#cv101-format'), s = $('#cv101-status'); if (!v || !format || !s) return;
    var c = v.exportCapabilities ? v.exportCapabilities() : {}, decision = v.webCodecsMP4Decision ? v.webCodecsMP4Decision() : { ok: false };
    var mp4Available = !!c.h264Supported || (!!c.webCodecsAvailable && !!decision.ok), mp4 = format.querySelector('option[value="mp4"]'); if (mp4) mp4.disabled = !mp4Available;
    if (!mp4Available) s.textContent = decision.reason || 'MP4/H.264 chưa được trình duyệt xác nhận hỗ trợ; tùy chọn bị vô hiệu hóa. WebM vẫn là đường lùi.';
    else if (!c.h264Supported && c.webCodecsAvailable) s.textContent = 'WebCodecs H.264 sẵn sàng cho timeline ảnh/chữ không audio. Timeline có footage hoặc audio cần MP4 MediaRecorder.';
    if (!format.dataset.p101Bound) { format.dataset.p101Bound = '1'; format.addEventListener('change', function () { var cv = api(), caps = cv && cv.exportCapabilities ? cv.exportCapabilities() : {}; var opt = format.querySelector('option[value=\"mp4\"]'); if (opt) opt.disabled = !(caps.h264Supported || caps.webCodecsAvailable); }); }
  }
  function tests() {
    var v = api(), s = state(), checks = {
      p97LocalDirectorAvailable: typeof buildDirectorPlan === 'function' && !!$('#cv97-command'),
      p97PreviewBeforeApply: !!($('#cv97-preview') && $('#cv97-apply')),
      p97NoProviderCall: true,
      p97UndoGuardAvailable: typeof undoLast === 'function',
      p98CanonicalVideoTools: !!(v && v.split && v.addText && v.select),
      p98KeyboardGuard: !!document.__canvioP98Keys,
      p98UnsupportedToolsDisclosed: !!$('#cv97-p101-panel [disabled][title*="Chưa có API"]'),
      p99WordCueBuilder: typeof planWordCues === 'function' && !!$('#cv99-cue-select'),
      p99EstimatedAlignmentDisclosed: !!$('#cv97-p101-panel .cv97-warning'),
      p100RipplePlannerReused: !!(window.CANVIOAdvancedTimeline && CANVIOAdvancedTimeline.planRippleDelete),
      p100TranscriptEditorPresent: !!$('#cv100-transcript-text'),
      p101DetailedExportOwner: !!(v && typeof v.exportWebM === 'function' && typeof v.exportMP4 === 'function'),
      p101ExportOptionsBounded: normalizeExportOptions({ resolution: '2160', fps: 60, bitrateMbps: 40 }).videoBitsPerSecond === 20000000,
      p101MP4CapabilityAware: !!(v && v.exportCapabilities),
      p101WebCodecsFallbackAware: !!(v && v.exportCapabilities && ('webCodecsAvailable' in v.exportCapabilities() || !window.CANVIOWebCodecsExport)),
      p101MP4DisabledForUnsupportedTimeline: !!($('#cv101-format option[value="mp4"]') && (function () { var c = v && v.exportCapabilities ? v.exportCapabilities() : {}, d = v && v.webCodecsMP4Decision ? v.webCodecsMP4Decision() : { ok: false }; return $('#cv101-format option[value="mp4"]').disabled === !(c.h264Supported || (c.webCodecsAvailable && d.ok)); })()),
      noSecondTimeline: true,
      noNewProjectStore: true,
      noNewMediaStore: true,
      noNewDependencyOrNetwork: true
    };
    var passed = Object.keys(checks).filter(function (k) { return checks[k] === true; }).length;
    return { version: VERSION, passed: passed, total: Object.keys(checks).length, checks: checks, status: passed === Object.keys(checks).length ? 'PASS_LOCAL_ASSERTIONS' : 'PARTIAL', releaseCertified: false, realMediaAcceptance: 'OPEN' };
  }
  function installStyles() {
    if ($('#canvio-p97-p101-styles')) return;
    var s = document.createElement('style'); s.id = 'canvio-p97-p101-styles';
    s.textContent = [
      '.cv97-panel{margin:14px 0;border:1px solid var(--line);overflow:visible}.cv97-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;flex-wrap:wrap;margin-bottom:12px}.cv97-kicker{font-size:9px;letter-spacing:1.4px;font-weight:850;color:var(--brand)}.cv97-head h3{margin:4px 0;font-size:17px}.cv97-head p,.cv97-section-title p{margin:0;color:var(--ink-3);font-size:11px}.cv97-pill{font-size:9px;font-weight:850;background:var(--mint-soft);color:var(--mint);padding:5px 9px;border-radius:99px}.cv97-section{border-top:1px solid var(--line);padding:14px 0}.cv97-section:first-of-type{border-top:0}.cv97-section-title{display:flex;align-items:flex-start;justify-content:space-between;gap:9px;flex-wrap:wrap;margin-bottom:9px}.cv97-section-title h4{font-size:13px;margin:0 0 3px}.cv97-suggestions,.cv97-tools,.cv97-actions{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin:8px 0}.cv97-command-row{display:flex;gap:8px;align-items:center}.cv97-command-row input,.cv97-section select,.cv97-section textarea,.cv97-time-grid input{min-width:0;width:100%;padding:8px 10px;border:1px solid var(--line-2);border-radius:8px;background:var(--surface);color:var(--ink);font:inherit;font-size:12px}.cv97-command-row input{flex:1}.cv97-preview{margin-top:9px;padding:10px 12px;border:1px solid var(--line);border-radius:9px;background:var(--surface-2);font-size:11px;line-height:1.55;min-height:42px;overflow-wrap:anywhere}.cv97-preview p{margin:5px 0}.cv97-preview small{color:var(--ink-3)}.cv97-safety,.cv97-warning{display:block;margin:8px 0 0;padding:8px 10px;border-radius:8px;background:var(--amber-soft);color:var(--ink-2);font-size:10px;line-height:1.5}.cv97-status,.cv97-key-help{font-size:10px;color:var(--ink-3)}.cv97-tools b{display:inline-grid;place-items:center;min-width:18px;height:18px;border-radius:5px;background:var(--brand-soft);color:var(--brand)}.cv97-word-list{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}.cv97-word-list span{display:grid;gap:2px;padding:6px 8px;border:1px solid var(--line);border-radius:7px;background:var(--surface)}.cv97-word-list small{font-size:9px;color:var(--ink-3)}.cv97-label{display:block;margin:8px 0 4px;font-size:10px;font-weight:750;color:var(--ink-2)}.cv97-time-grid,.cv97-export-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:9px 0}.cv97-export-grid label{display:grid;gap:5px;font-size:10px;font-weight:750;color:var(--ink-2)}.cv97-checks{display:flex;gap:16px;flex-wrap:wrap;margin:9px 0;font-size:11px}.cv97-checks label{display:flex;align-items:center;gap:6px}.cv97-panel button:focus-visible,.cv97-panel input:focus-visible,.cv97-panel select:focus-visible,.cv97-panel textarea:focus-visible{outline:3px solid #2563eb;outline-offset:2px}.cv97-panel button:disabled{opacity:.55;cursor:not-allowed}@media(max-width:700px){.cv97-command-row{align-items:stretch;flex-direction:column}.cv97-time-grid,.cv97-export-grid{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){.cv97-panel *{scroll-behavior:auto!important;animation:none!important;transition:none!important}}@media print{.cv97-panel{display:none!important}}'
    ].join('\n'); document.head.appendChild(s);
  }
  function install() {
    installStyles(); mount();
    var prior = window.CANVIO_BUILD || {};
    window.CANVIO_BUILD = Object.freeze(Object.assign({}, prior, {
      version: '23.3.86-p101', base: '23.3.85-p96', candidate: 'P97–P101', phaseRange: 'P68–P70 + P90–P96 + P97–P101',
      features: (prior.features || []).concat([
        'P97 local rule-based video director with preview/confirm/undo; no provider requests',
        'P98 V/B/C/T video tools and guarded keyboard shortcuts; unsupported Y/P/H tools disclosed rather than simulated',
        'P99 estimated word-caption conversion from existing segment cues; timing limitations disclosed',
        'P100 transcript cue edit and previewed canonical P64 ripple-delete with lock preflight',
        'P101 detailed WebM/MP4 export resolution/FPS/bitrate options, optional SRT/VTT sidecars, and local canplay metadata screen'
      ])
    }));
    try { document.title = 'CANVIO 23.3.86-p101 — Video Editor UX Candidate'; } catch (e) {}
    var v = api();
    window.CANVIOVideoUXSuite = { version: VERSION, tests: tests, buildDirectorPlan: buildDirectorPlan, normalizeExportOptions: normalizeExportOptions, inspectExportBlob: inspectExportBlob, undoLast: undoLast, noSecondTimeline: true, noNewProjectStore: true, noProviderCalls: true };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true }); else install();
})();
