/* P127.5 · Mẫu dàn dựng (Short/Reel, YouTube dài, Recap sự kiện, Video vui).
   Additive: chỉ THÊM clip chữ placeholder trên track 3 (không xoá clip hiện có, không đụng track khóa) và nâng duration nếu cần.
   Media do người dùng tự thêm; mẫu chỉ cho khung nhịp + chữ gợi ý. Có undo qua pushUndo của engine. */
(function () {
'use strict';
if (window.CVTemplatesP127) return;
var TPL = {
  short: { label: 'Short / Reel 9:16', dur: 30, note: 'Xuất dọc 9:16; hook trong 2 giây đầu; nhạc −14 LUFS.', cues: [[0, 2.5, 'HOOK: câu gây tò mò'], [2.5, 8, 'Ý chính 1'], [10.5, 8, 'Ý chính 2'], [18.5, 7, 'Ý chính 3 / kết quả'], [25.5, 4.5, 'Theo dõi để xem tiếp!']] },
  youtube: { label: 'YouTube dài 16:9', dur: 180, note: 'Xuất ngang 16:9; mở đầu ≤ 15 giây, chương rõ ràng, kết có lời kêu gọi.', cues: [[0, 6, 'Hook: vấn đề + lời hứa'], [6, 9, 'Giới thiệu kênh / chủ đề'], [15, 50, 'Chương 1'], [65, 50, 'Chương 2'], [115, 50, 'Chương 3'], [165, 15, 'Tổng kết + đăng ký + video tiếp theo']] },
  recap: { label: 'Recap sự kiện', dur: 60, note: 'Cắt theo nhịp nhạc; ưu tiên cảnh đông vui, tên sự kiện ở đầu và cuối.', cues: [[0, 4, 'TÊN SỰ KIỆN · Ngày · Địa điểm'], [4, 14, 'Không khí / đón khách'], [18, 18, 'Khoảnh khắc nổi bật'], [36, 14, 'Phát biểu / tiết mục'], [50, 10, 'Cảm ơn · hẹn gặp lại']] },
  funny: { label: 'Video vui', dur: 30, note: 'Nhịp nhanh, mỗi cảnh ≤ 3 giây, chữ to, âm thanh nhấn ở cú twist.', cues: [[0, 3, 'Setup: chuyện gì đang xảy ra?'], [3, 8, 'Diễn biến'], [11, 3, 'TWIST!'], [14, 8, 'Phản ứng'], [22, 8, 'Kết bất ngờ / lặp lại']] }
};
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function plan(key, offset) {
  var t = TPL[key]; if (!t) return null;
  var off = Math.max(0, Number(offset) || 0);
  return { key: key, label: t.label, duration: off + t.dur, note: t.note, clips: t.cues.map(function (c, i) { return { name: 'Mẫu ' + (i + 1), type: 'text', text: c[2], start: off + c[0], duration: c[1], track: 3 }; }) };
}
function apply(key, st, api) {
  var p = plan(key); if (!p) return { ok: false, reason: 'Mẫu không tồn tại.' };
  if (!st || !Array.isArray(st.clips)) return { ok: false, reason: 'Mở Video Engine trước.' };
  if (api && api.trackState && api.trackState(3).locked) return { ok: false, reason: 'Track chữ đang khóa. Mở khóa rồi thử lại.' };
  var tail = st.clips.filter(function (c) { return c.track === 3; }).reduce(function (m, c) { return Math.max(m, (c.start || 0) + (c.duration || 0)); }, 0);
  p = plan(key, tail > 0 ? Math.ceil(tail) : 0);
  try { if (api && api._pro && api._pro.pushUndo) api._pro.pushUndo(); } catch (e) {}
  var uid = function (i) { return 'vt' + Date.now().toString(36) + i + Math.random().toString(36).slice(2, 5); };
  p.clips.forEach(function (c, i) { c.id = uid(i); st.clips.push(c); });
  if (p.duration > st.duration) st.duration = p.duration;
  st.selected = p.clips[0].id;
  try { api && api.commit && api.commit(); } catch (e) {}
  return { ok: true, added: p.clips.length, note: p.note, label: p.label };
}
function mount() {
  var page = document.querySelector('#page-videoEngine'), card = page && page.querySelector('#cv127-quality');
  if (!card || card.querySelector('#cv127t-row')) return false;
  var row = document.createElement('div'); row.id = 'cv127t-row'; row.className = 'row'; row.style.cssText = 'margin-top:10px;align-items:center;flex-wrap:wrap;gap:8px';
  row.innerHTML = '<b class="tiny">Mẫu dàn dựng (P127.5)</b>' + Object.keys(TPL).map(function (k) { return '<button type="button" class="btn btn-soft sm" data-cv127t="' + k + '">' + TPL[k].label + '</button>'; }).join('') + '<span class="tiny" id="cv127t-out" role="status" aria-live="polite">Thêm các khung chữ gợi ý lên track chữ; không xoá clip đang có.</span>';
  card.insertBefore(row, card.querySelector('#cv127q-list'));
  row.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-cv127t]'); if (!b) return;
    var out = row.querySelector('#cv127t-out'), v = window.CV && CV.engines && CV.engines.video, s = v && v._state && v._state();
    var r = apply(b.getAttribute('data-cv127t'), s, v);
    out.textContent = r.ok ? 'Đã thêm ' + r.added + ' khung "' + r.label + '". ' + r.note : r.reason;
  });
  return true;
}
function ready() { try { mount(); var p = document.querySelector('#page-videoEngine'); if (p && !p.__cv127tObs && window.MutationObserver) { p.__cv127tObs = new MutationObserver(function () { if (!p.querySelector('#cv127t-row')) mount(); }); p.__cv127tObs.observe(p, { childList: true, subtree: true }); } } catch (e) {} }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true }); else ready();
function tests() {
  var keys = Object.keys(TPL), okShape = keys.every(function (k) { var p = plan(k); return p.clips.length >= 5 && p.clips.every(function (c) { return c.duration > 0 && c.start >= 0 && c.start + c.duration <= p.duration + 1e-9 && c.track === 3; }); });
  var noOverlap = keys.every(function (k) { var c = plan(k).clips; for (var i = 1; i < c.length; i++) if (c[i].start < c[i - 1].start + c[i - 1].duration - 1e-9) return false; return true; });
  var st = { clips: [{ id: 'a', type: 'video', track: 1, start: 0, duration: 10 }, { id: 't', type: 'text', track: 3, start: 0, duration: 4 }], duration: 30, selected: null }, calls = 0;
  var api = { trackState: function () { return { locked: false }; }, commit: function () { calls++; }, _pro: { pushUndo: function () { calls += 10; } } };
  var r = apply('short', st, api), callsAfterFirst = calls, before = st.clips.slice(0, 2);
  var lockedSt = { clips: [], duration: 30 }, lk = apply('short', lockedSt, { trackState: function () { return { locked: true }; } });
  var big = { clips: [], duration: 30 }; apply('youtube', big, api);
  var ids = st.clips.map(function (c) { return c.id; });
  return {
    allTemplatesWellFormed: okShape, noOverlapInTemplate: noOverlap,
    appliesAdditively: r.ok && st.clips.length === 2 + TPL.short.cues.length && before[0].id === 'a' && before[1].id === 't',
    appendsAfterExistingText: st.clips[2].start >= 4, undoAndCommitCalled: callsAfterFirst === 11,
    lockedTrackRefused: lk.ok === false && lockedSt.clips.length === 0,
    durationGrows: big.duration >= 180, uniqueIds: new Set(ids).size === ids.length,
    badInputSafe: apply('nope', st, api).ok === false && apply('short', null, api).ok === false && plan('x') === null
  };
}
window.CVTemplatesP127 = { version: '127.5.0', templates: clone(TPL), plan: plan, apply: apply, mount: mount, tests: tests };
})();
