/* P127.4 + P127.6 · Edit quality gate and CMX3600 EDL export. Read-only analysis of the canonical timeline; never edits clips. */
(function () {
'use strict';
if (window.CVEditQualityP127) return;
var READ_CPS = 17, MIN_SHOT = 0.4, MAX_STILL = 8, MAX_SHOT = 15, MAX_GAP = 0.25, MIN_TEXT = 1.2, MAX_TEXT_CHARS = 120;
function num(v, d) { v = Number(v); return isFinite(v) ? v : d; }
function norm(state) {
  return (state && Array.isArray(state.clips) ? state.clips : []).map(function (c) {
    return { id: String(c.id), name: String(c.name || ''), type: String(c.type || ''), start: Math.max(0, num(c.start, 0)), duration: Math.max(0, num(c.duration, 0)), track: num(c.track, 0), text: c.type === 'text' ? String(c.text == null ? '' : c.text) : '' };
  });
}
function add(list, id, level, label, detail, clips) { list.push({ id: id, level: level, label: label, detail: detail, clips: (clips || []).slice(0, 8) }); }
function analyze(state) {
  var clips = norm(state), checks = [], vis = clips.filter(function (c) { return c.type === 'video' || c.type === 'image'; }).sort(function (a, b) { return a.start - b.start; });
  var texts = clips.filter(function (c) { return c.type === 'text'; }), audio = clips.filter(function (c) { return c.type === 'audio' || c.type === 'video'; });
  var end = clips.reduce(function (m, c) { return Math.max(m, c.start + c.duration); }, 0);
  if (!clips.length) { add(checks, 'empty', 'fail', 'Timeline trống', 'Chưa có clip để kiểm tra.'); return summarize(checks, { clips: 0, duration: 0 }); }
  var bad = clips.filter(function (c) { return c.duration <= 0; });
  add(checks, 'duration', bad.length ? 'fail' : 'pass', 'Mọi clip có thời lượng > 0', bad.length ? bad.length + ' clip có thời lượng 0' : 'Hợp lệ', bad.map(function (c) { return c.id; }));
  var flick = vis.filter(function (c) { return c.duration > 0 && c.duration < MIN_SHOT; });
  add(checks, 'flicker', flick.length ? 'warn' : 'pass', 'Cảnh không quá ngắn (≥ ' + MIN_SHOT + ' s)', flick.length ? flick.length + ' cảnh nhấp nháy, khó nhìn' : 'Nhịp cắt ổn', flick.map(function (c) { return c.id; }));
  var long = vis.filter(function (c) { return c.duration > (c.type === 'image' ? MAX_STILL : MAX_SHOT); });
  add(checks, 'long-shot', long.length ? 'warn' : 'pass', 'Cảnh không quá dài (ảnh ≤ ' + MAX_STILL + ' s, video ≤ ' + MAX_SHOT + ' s)', long.length ? long.length + ' cảnh dễ gây nhàm, cân nhắc cắt hoặc thêm zoom' : 'Nhịp cắt ổn', long.map(function (c) { return c.id; }));
  var gaps = [], cover = 0;
  vis.forEach(function (c) { if (c.start - cover > MAX_GAP) gaps.push({ at: cover, len: c.start - cover, id: c.id }); cover = Math.max(cover, c.start + c.duration); });
  add(checks, 'gaps', gaps.length ? 'warn' : 'pass', 'Không có khoảng đen giữa các cảnh', gaps.length ? gaps.length + ' khoảng trống (đầu tiên ở ' + gaps[0].at.toFixed(2) + ' s, dài ' + gaps[0].len.toFixed(2) + ' s)' : 'Liền mạch', gaps.map(function (g) { return g.id; }));
  var fast = texts.filter(function (t) { var chars = t.text.replace(/\s+/g, ' ').trim().length; return chars && t.duration < Math.max(MIN_TEXT, chars / READ_CPS); });
  add(checks, 'text-speed', fast.length ? 'warn' : 'pass', 'Chữ đủ thời gian đọc (≤ ' + READ_CPS + ' ký tự/giây)', fast.length ? fast.length + ' dòng chữ hiện quá nhanh' : 'Đọc kịp', fast.map(function (c) { return c.id; }));
  var wall = texts.filter(function (t) { return t.text.trim().length > MAX_TEXT_CHARS; });
  add(checks, 'text-length', wall.length ? 'warn' : 'pass', 'Mỗi dòng chữ ≤ ' + MAX_TEXT_CHARS + ' ký tự', wall.length ? wall.length + ' dòng quá dài, nên tách' : 'Gọn', wall.map(function (c) { return c.id; }));
  var empty = texts.filter(function (t) { return !t.text.trim(); });
  add(checks, 'text-empty', empty.length ? 'fail' : 'pass', 'Không có track chữ rỗng', empty.length ? empty.length + ' clip chữ rỗng' : 'Hợp lệ', empty.map(function (c) { return c.id; }));
  var overlap = 0, ids = [];
  texts.slice().sort(function (a, b) { return a.start - b.start; }).forEach(function (t, i, a) { if (i && t.start < a[i - 1].start + a[i - 1].duration - 0.05) { overlap++; ids.push(t.id); } });
  add(checks, 'text-overlap', overlap ? 'warn' : 'pass', 'Chữ không chồng lên nhau', overlap ? overlap + ' cặp chữ chồng thời gian' : 'Gọn', ids);
  add(checks, 'sound', audio.length ? 'pass' : 'warn', 'Có âm thanh', audio.length ? 'Có ' + audio.length + ' clip âm thanh/video' : 'Chưa có nhạc hoặc tiếng nền');
  add(checks, 'length', end > 600 ? 'warn' : 'pass', 'Tổng thời lượng hợp lý', end.toFixed(1) + ' s' + (end > 600 ? ' (> 10 phút, xuất có thể nặng)' : ''));
  return summarize(checks, { clips: clips.length, duration: Math.round(end * 100) / 100 });
}
function summarize(checks, meta) {
  var status = checks.some(function (c) { return c.level === 'fail'; }) ? 'fail' : (checks.some(function (c) { return c.level === 'warn'; }) ? 'warn' : 'pass');
  return { format: 'CANVIO_EDIT_QUALITY', version: 1, status: status, meta: meta, checks: checks, note: 'Cổng chất lượng chỉ đọc timeline; chưa đo bố cục (headroom/safe area), tương phản chữ hay LUFS.' };
}
function tc(sec, fps) { var f = Math.round(Math.max(0, sec) * fps), s = Math.floor(f / fps), ff = f % fps, h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60; function p(n) { return (n < 10 ? '0' : '') + n; } return p(h) + ':' + p(m) + ':' + p(s % 60) + ':' + p(ff); }
function toEdl(state, opts) {
  var fps = Math.min(60, Math.max(1, Math.round(num(opts && opts.fps, 30)))), title = String((opts && opts.title) || 'CANVIO').replace(/[^\w .-]/g, '').slice(0, 60) || 'CANVIO';
  var vis = norm(state).filter(function (c) { return (c.type === 'video' || c.type === 'image') && c.duration > 0; }).sort(function (a, b) { return a.start - b.start; });
  var trimIn = {}; ((state && state.clips) || []).forEach(function (c) { trimIn[String(c.id)] = Math.max(0, num(c.trimIn, 0)); });
  var lines = ['TITLE: ' + title, 'FCM: NON-DROP FRAME', ''];
  vis.forEach(function (c, i) {
    var src = trimIn[c.id] || 0, n = String(i + 1); while (n.length < 3) n = '0' + n;
    lines.push(n + '  AX       V     C        ' + tc(src, fps) + ' ' + tc(src + c.duration, fps) + ' ' + tc(c.start, fps) + ' ' + tc(c.start + c.duration, fps));
    lines.push('* FROM CLIP NAME: ' + (c.name.replace(/[\r\n]+/g, ' ').slice(0, 80) || c.id));
  });
  return { edl: lines.join('\n') + '\n', events: vis.length, fps: fps };
}
function download(name, text, type) { var u = URL.createObjectURL(new Blob([text], { type: type })), a = document.createElement('a'); a.href = u; a.download = name; a.click(); setTimeout(function () { URL.revokeObjectURL(u); }, 30000); }
function mount() {
  var page = document.querySelector('#page-videoEngine');
  if (!page || page.querySelector('#cv127-quality')) return false;
  var anchor = page.querySelector('#cv127-edit-plan'); if (!anchor) return false;
  var card = document.createElement('section'); card.id = 'cv127-quality'; card.className = 'card'; card.style.marginTop = '12px';
  card.innerHTML = '<div class="cardTop"><div><h3>Cổng chất lượng dựng · P127.4</h3><span class="sub">Kiểm nhịp cắt, khoảng đen, thời gian đọc chữ · xuất EDL</span></div><span class="badgeSoft">CHỈ ĐỌC</span></div><div class="row"><button type="button" class="btn btn-primary sm" id="cv127q-run">Kiểm tra chất lượng</button><button type="button" class="btn btn-soft sm" id="cv127q-edl">Xuất EDL (Premiere/Resolve)</button></div><ul id="cv127q-list" class="tiny" style="list-style:none;padding:0;margin:10px 0 0;display:grid;gap:4px"></ul><div class="tiny" id="cv127q-status" role="status" aria-live="polite" style="margin-top:8px">Chưa kiểm tra.</div>';
  anchor.insertAdjacentElement('afterend', card);
  function st() { var a = window.CV && CV.engines && CV.engines.video; return a && a._state && a._state(); }
  var color = { pass: '#07603f', warn: '#7a4b00', fail: '#9a1030' }, tag = { pass: 'Đạt', warn: 'Lưu ý', fail: 'Lỗi' };
  card.querySelector('#cv127q-run').addEventListener('click', function () {
    var s = st(), box = card.querySelector('#cv127q-status'), ul = card.querySelector('#cv127q-list'); if (!s) { box.textContent = 'Mở Video Engine trước.'; return; }
    var r = analyze(s); ul.textContent = '';
    r.checks.forEach(function (c) { var li = document.createElement('li'); li.style.color = color[c.level]; var b = document.createElement('b'); b.textContent = tag[c.level] + ' · ' + c.label; li.appendChild(b); li.appendChild(document.createTextNode(' — ' + c.detail)); ul.appendChild(li); });
    box.textContent = (r.status === 'pass' ? 'Đạt cổng chất lượng' : r.status === 'warn' ? 'Có lưu ý cần xem' : 'Có lỗi cần sửa') + ' · ' + r.meta.clips + ' clip · ' + r.meta.duration + ' s. ' + r.note;
  });
  card.querySelector('#cv127q-edl').addEventListener('click', function () {
    var s = st(), box = card.querySelector('#cv127q-status'); if (!s) { box.textContent = 'Mở Video Engine trước.'; return; }
    var e = toEdl(s); if (!e.events) { box.textContent = 'Chưa có clip video/ảnh để xuất EDL.'; return; }
    download('canvio-timeline.edl', e.edl, 'text/plain'); box.textContent = 'Đã tải EDL ' + e.events + ' sự kiện @' + e.fps + 'fps (chỉ mốc cắt hình; âm thanh/chữ dùng SRT).';
  });
  return true;
}
function ready() { try { mount(); var p = document.querySelector('#page-videoEngine'); if (p && !p.__cv127qObs && window.MutationObserver) { p.__cv127qObs = new MutationObserver(function () { if (!p.querySelector('#cv127-quality')) mount(); }); p.__cv127qObs.observe(p, { childList: true, subtree: true }); } } catch (e) {} }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true }); else ready();
function tests() {
  var good = { clips: [{ id: 'a', type: 'video', start: 0, duration: 4, track: 1, trimIn: 1 }, { id: 'b', type: 'image', start: 4, duration: 3, track: 1 }, { id: 't', type: 'text', text: 'Xin chào', start: 0, duration: 3, track: 3 }, { id: 'm', type: 'audio', start: 0, duration: 7, track: 2 }] };
  var bad = { clips: [{ id: 'a', type: 'video', start: 0, duration: 0.2, track: 1 }, { id: 'b', type: 'image', start: 3, duration: 12, track: 1 }, { id: 't', type: 'text', text: 'x'.repeat(200), start: 3, duration: 1, track: 3 }, { id: 'e', type: 'text', text: ' ', start: 3.5, duration: 2, track: 3 }] };
  var g = analyze(good), b = analyze(bad), ids = function (r, lvl) { return r.checks.filter(function (c) { return c.level === lvl; }).map(function (c) { return c.id; }); };
  var e = toEdl(good, { fps: 30, title: 'T' });
  return {
    goodPasses: g.status === 'pass',
    badFlagsFlicker: ids(b, 'warn').indexOf('flicker') >= 0,
    badFlagsGap: ids(b, 'warn').indexOf('gaps') >= 0,
    badFlagsLongStill: ids(b, 'warn').indexOf('long-shot') >= 0,
    badFlagsFastText: ids(b, 'warn').indexOf('text-speed') >= 0,
    badFlagsEmptyText: ids(b, 'fail').indexOf('text-empty') >= 0,
    emptyTimelineFails: analyze({ clips: [] }).status === 'fail',
    ignoresGarbageInput: analyze(null).status === 'fail' && analyze({ clips: [{ id: 1, start: 'x', duration: NaN }] }).status === 'fail',
    edlTimecodes: e.events === 2 && /001  AX       V     C        00:00:01:00 00:00:05:00 00:00:00:00 00:00:04:00/.test(e.edl) && /002 /.test(e.edl),
    edlSkipsTextAudio: e.edl.indexOf('* FROM CLIP NAME: t') < 0,
    edlFpsClamped: toEdl(good, { fps: 999 }).fps === 60
  };
}
window.CVEditQualityP127 = { version: '127.4.0', analyze: analyze, toEdl: toEdl, mount: mount, tests: tests };
})();
