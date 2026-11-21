/* P133 (phần bền vững) · Kho tệp OPFS (rơi về IndexedDB nếu trình duyệt không có), tự lưu bản phục hồi cho mọi engine có snapshotState/restoreState,
   phát hiện phiên trước đóng đột ngột và đề nghị khôi phục, thẻ "Bộ nhớ & phục hồi" ở Cài đặt.
   Không thay Project Vault: bản phục hồi chỉ là lưới an toàn (mỗi engine giữ 1 bản mới nhất, ≤ 8 MB). Chưa làm: proxy 4K, Web Worker/OffscreenCanvas, tách tài sản lớn khỏi IndexedDB hiện có. */
(function () {
'use strict';
if (window.CVResilienceP133) return;
var DIR = 'canvio133', IDB = 'CANVIO_133', MAX_SNAP = 8 * 1048576, BEAT_MS = 30000, STALE_MS = 90000, PREFIX = 'canvio133:s:';
function safeName(n) { n = String(n || '').replace(/[^A-Za-z0-9._-]/g, '_').replace(/^\.+/, '_').slice(0, 80); if (!n) throw new Error('Tên tệp không hợp lệ.'); return n; }
/* ---- storage backends ---- */
function memBackend() { var m = new Map(); return { kind: 'memory', put: function (n, b) { m.set(n, b); return Promise.resolve(); }, get: function (n) { return Promise.resolve(m.has(n) ? m.get(n) : null); }, list: function () { return Promise.resolve(Array.from(m.keys()).map(function (k) { var v = m.get(k); return { name: k, size: v.size || String(v).length }; })); }, remove: function (n) { m.delete(n); return Promise.resolve(); } }; }
function opfsBackend() {
  var root = null;
  function dir() { if (root) return Promise.resolve(root); return navigator.storage.getDirectory().then(function (r) { return r.getDirectoryHandle(DIR, { create: true }); }).then(function (d) { root = d; return d; }); }
  return { kind: 'opfs',
    put: function (n, b) { return dir().then(function (d) { return d.getFileHandle(n, { create: true }); }).then(function (h) { return h.createWritable(); }).then(function (w) { return w.write(b).then(function () { return w.close(); }); }); },
    get: function (n) { return dir().then(function (d) { return d.getFileHandle(n); }).then(function (h) { return h.getFile(); }).catch(function (e) { if (e && e.name === 'NotFoundError') return null; throw e; }); },
    list: function () { return dir().then(function (d) { var out = [], it = d.entries(); return (function next() { return it.next().then(function (r) { if (r.done) return out; if (r.value[1].kind === 'file') return r.value[1].getFile().then(function (f) { out.push({ name: r.value[0], size: f.size, at: f.lastModified }); return next(); }); return next(); }); })(); }); },
    remove: function (n) { return dir().then(function (d) { return d.removeEntry(n); }).catch(function (e) { if (!e || e.name !== 'NotFoundError') throw e; }); } };
}
function idbBackend() {
  var dbp = null;
  function db() { if (dbp) return dbp; dbp = new Promise(function (ok, no) { var r = indexedDB.open(IDB, 1); r.onupgradeneeded = function () { r.result.createObjectStore('files'); }; r.onsuccess = function () { ok(r.result); }; r.onerror = function () { no(r.error); }; }); return dbp; }
  function tx(mode, fn) { return db().then(function (d) { return new Promise(function (ok, no) { var t = d.transaction('files', mode), res = fn(t.objectStore('files')); t.oncomplete = function () { ok(res && res.result); }; t.onerror = t.onabort = function () { no(t.error); }; }); }); }
  return { kind: 'indexeddb', put: function (n, b) { return tx('readwrite', function (s) { return s.put({ blob: b, at: Date.now() }, n); }); }, get: function (n) { return tx('readonly', function (s) { return s.get(n); }).then(function (r) { return r ? r.blob : null; }); },
    list: function () { return tx('readonly', function (s) { return s.getAll(); }).then(function (a) { return db().then(function (d) { return new Promise(function (ok) { var out = [], t = d.transaction('files'), c = t.objectStore('files').openCursor(); c.onsuccess = function () { var cur = c.result; if (cur) { out.push({ name: cur.key, size: (cur.value.blob && cur.value.blob.size) || 0, at: cur.value.at }); cur.continue(); } }; t.oncomplete = function () { ok(out); }; }); }); }); },
    remove: function (n) { return tx('readwrite', function (s) { return s.delete(n); }); } };
}
function pickBackend() { try { if (navigator.storage && typeof navigator.storage.getDirectory === 'function' && window.FileSystemFileHandle && FileSystemFileHandle.prototype.createWritable) return opfsBackend(); } catch (e) {} return idbBackend(); }
var backend = null; function be() { return backend || (backend = pickBackend()); }
function useBackend(b) { backend = b; }
var store = {
  put: function (n, data) { n = safeName(n); var b = data instanceof Blob ? data : new Blob([String(data)], { type: 'text/plain' }); return be().put(n, b).then(function () { return { name: n, size: b.size }; }); },
  get: function (n) { return be().get(safeName(n)); }, getText: function (n) { return be().get(safeName(n)).then(function (b) { return b ? (b.text ? b.text() : String(b)) : null; }); },
  list: function () { return be().list(); }, remove: function (n) { return be().remove(safeName(n)); }, kind: function () { return be().kind; }
};
function usage() { if (!navigator.storage || !navigator.storage.estimate) return Promise.resolve({ usage: 0, quota: 0, known: false }); return navigator.storage.estimate().then(function (e) { return { usage: e.usage || 0, quota: e.quota || 0, known: true }; }).catch(function () { return { usage: 0, quota: 0, known: false }; }); }
/* ---- recovery ---- */
function hash(s) { var h = 5381, i, n = s.length, step = Math.max(1, Math.floor(n / 4000)); for (i = 0; i < n; i += step) h = ((h << 5) + h + s.charCodeAt(i)) | 0; for (i = Math.max(0, n - 64); i < n; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return n + ':' + h; }
function engineNames() { var e = window.CV && CV.engines; return e ? Object.keys(e).filter(function (k) { return e[k] && typeof e[k].snapshotState === 'function' && typeof e[k].restoreState === 'function'; }) : []; }
var lastHash = {}, sid = 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
function sessKey() { return PREFIX + sid; }
function setSess(clean) { try { localStorage.setItem(sessKey(), JSON.stringify({ id: sid, clean: !!clean, beat: Date.now() })); } catch (e) {} }
function snapshotNow() {
  var names = engineNames(), jobs = [], saved = [];
  names.forEach(function (k) {
    var raw; try { raw = CV.engines[k].snapshotState(); } catch (e) { return; }
    if (raw == null) return; if (typeof raw !== 'string') { try { raw = JSON.stringify(raw); } catch (e) { return; } }
    if (!raw || raw.length > MAX_SNAP || raw === '{}' || raw === 'null') return;
    var h = hash(raw); if (lastHash[k] === h) return;
    jobs.push(store.put('recovery-' + k + '.json', JSON.stringify({ engine: k, at: Date.now(), session: sid, data: raw })).then(function () { lastHash[k] = h; saved.push(k); }).catch(function () {}));
  });
  return Promise.all(jobs).then(function () { setSess(false); return saved; });
}
function crashedSessions(entries, now, mine) {
  var out = []; (entries || []).forEach(function (e) { if (!e || e.id === mine) return; if (e.clean === false && now - (e.beat || 0) > STALE_MS) out.push(e); }); return out;
}
function scanPrev() { var out = [], i, k, v; try { for (i = 0; i < localStorage.length; i++) { k = localStorage.key(i); if (k && k.indexOf(PREFIX) === 0) { try { v = JSON.parse(localStorage.getItem(k)); if (v && v.id) out.push(v); } catch (e) {} } } } catch (e) {} return out; }
function cleanupOld(now) { try { for (var i = localStorage.length - 1; i >= 0; i--) { var k = localStorage.key(i); if (k && k.indexOf(PREFIX) === 0 && k !== sessKey()) { var v = JSON.parse(localStorage.getItem(k) || '{}'); if (v.clean !== false || now - (v.beat || 0) > 7 * 86400000) localStorage.removeItem(k); } } } catch (e) {} }
function recoveries() {
  return store.list().then(function (L) { return Promise.all(L.filter(function (f) { return /^recovery-.+\.json$/.test(f.name); }).map(function (f) { return store.getText(f.name).then(function (t) { try { var o = JSON.parse(t); return o && o.engine && o.data ? { engine: o.engine, at: o.at, name: f.name, size: f.size } : null; } catch (e) { return null; } }); })); }).then(function (a) { return a.filter(Boolean).sort(function (x, y) { return y.at - x.at; }); });
}
function restore(engine) {
  engine = String(engine || ''); if (engineNames().indexOf(engine) < 0) return Promise.reject(new Error('Engine không hỗ trợ khôi phục.'));
  return store.getText('recovery-' + engine + '.json').then(function (t) { if (!t) throw new Error('Không có bản phục hồi.'); var o = JSON.parse(t); var ok = CV.engines[engine].restoreState(o.data); if (ok === false) throw new Error('Engine từ chối dữ liệu.'); return true; });
}
function fmtTime(t) { var d = new Date(t); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
var LABEL = { video: 'Video', web: 'Website', design: 'Thiết kế', poster: 'Poster', image: 'Ảnh', canvas: 'Canvas' };
function banner(list) {
  if (!list.length || document.getElementById('cv133-banner')) return;
  var b = document.createElement('div'); b.id = 'cv133-banner'; b.setAttribute('role', 'alertdialog'); b.setAttribute('aria-label', 'Khôi phục phiên trước');
  b.style.cssText = 'position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:2147483000;max-width:min(640px,94vw);background:#0f172a;color:#f8fafc;border-radius:14px;padding:12px 14px;box-shadow:0 10px 30px rgba(0,0,0,.35);font:14px system-ui,sans-serif;display:flex;gap:10px;flex-wrap:wrap;align-items:center';
  b.innerHTML = '<span><b>Phiên trước đóng đột ngột.</b> Khôi phục bản tự lưu?</span>' + list.slice(0, 6).map(function (r) { return '<button type="button" data-eng="' + r.engine.replace(/[^a-z0-9_-]/gi, '') + '" style="background:#2563eb;color:#fff;border:0;border-radius:8px;padding:6px 10px;cursor:pointer">' + (LABEL[r.engine] || r.engine) + ' · ' + fmtTime(r.at) + '</button>'; }).join('') + '<button type="button" data-skip="1" style="background:transparent;color:#cbd5e1;border:1px solid #475569;border-radius:8px;padding:6px 10px;cursor:pointer">Bỏ qua</button><span id="cv133-msg" role="status" aria-live="polite" style="flex-basis:100%;font-size:12px;color:#cbd5e1"></span>';
  document.body.appendChild(b);
  b.addEventListener('click', function (e) { var t = e.target.closest('button'); if (!t) return; if (t.dataset.skip) { b.remove(); return; } restore(t.dataset.eng).then(function () { b.querySelector('#cv133-msg').textContent = 'Đã khôi phục ' + (LABEL[t.dataset.eng] || t.dataset.eng) + '.'; t.disabled = true; }).catch(function (err) { b.querySelector('#cv133-msg').textContent = String(err.message || err).slice(0, 100); }); });
}
function mountSettings() {
  var page = document.querySelector('#page-settings'); if (!page || page.querySelector('#cv133-card')) return false;
  var card = document.createElement('div'); card.className = 'card'; card.id = 'cv133-card'; card.style.marginTop = '12px';
  card.innerHTML = '<div class="cardTop"><h3>Bộ nhớ &amp; phục hồi (P133)</h3><span class="sub">Tự lưu mỗi 30 giây</span></div><div class="tiny" id="cv133-info" role="status" aria-live="polite">Đang kiểm tra…</div><div class="row" style="gap:8px;margin-top:8px;flex-wrap:wrap"><button type="button" class="btn btn-soft sm" id="cv133-now">Lưu bản phục hồi ngay</button><button type="button" class="btn btn-ghost sm" id="cv133-persist">Xin lưu trữ bền vững</button><button type="button" class="btn btn-ghost sm" id="cv133-clear">Xoá bản phục hồi</button></div>';
  page.appendChild(card);
  var info = card.querySelector('#cv133-info'), mb = function (n) { return (n / 1048576).toFixed(n > 1e8 ? 0 : 1) + ' MB'; };
  function refresh() { Promise.all([usage(), recoveries()]).then(function (r) { info.textContent = 'Kho tệp: ' + store.kind().toUpperCase() + (r[0].known ? ' · đã dùng ' + mb(r[0].usage) + ' / ' + mb(r[0].quota) : '') + ' · bản phục hồi: ' + (r[1].length ? r[1].map(function (x) { return (LABEL[x.engine] || x.engine) + ' ' + fmtTime(x.at); }).join(', ') : 'chưa có') + '.'; }).catch(function () { info.textContent = 'Không đọc được kho tệp.'; }); }
  card.querySelector('#cv133-now').addEventListener('click', function () { snapshotNow().then(function (s) { refresh(); info.textContent += s.length ? ' Đã lưu: ' + s.join(', ') + '.' : ' Không có gì thay đổi để lưu.'; }); });
  card.querySelector('#cv133-persist').addEventListener('click', function () { (navigator.storage && navigator.storage.persist ? navigator.storage.persist() : Promise.resolve(false)).then(function (ok) { info.textContent = ok ? 'Trình duyệt đã cấp lưu trữ bền vững.' : 'Trình duyệt chưa cấp (tuỳ trình duyệt/độ dùng).'; }); });
  card.querySelector('#cv133-clear').addEventListener('click', function () { recoveries().then(function (L) { return Promise.all(L.map(function (x) { return store.remove(x.name); })); }).then(function () { lastHash = {}; refresh(); }); });
  refresh(); return true;
}
var started = false;
function start() {
  if (started) return; started = true;
  var prev = crashedSessions(scanPrev(), Date.now(), sid);
  if (prev.length) recoveries().then(banner).catch(function () {});
  cleanupOld(Date.now()); setSess(false);
  setInterval(function () { if (document.hidden) { setSess(false); return; } (window.requestIdleCallback || function (f) { setTimeout(f, 50); })(function () { snapshotNow(); }); }, BEAT_MS);
  var clean = function () { try { snapshotNow(); } catch (e) {} setSess(true); };
  addEventListener('pagehide', clean); document.addEventListener('visibilitychange', function () { if (document.hidden) snapshotNow(); });
  try { mountSettings(); var p = document.querySelector('#page-settings'); if (p && window.MutationObserver) new MutationObserver(function () { if (!p.querySelector('#cv133-card')) mountSettings(); }).observe(p, { childList: true }); } catch (e) {}
}
function ready() { try { setTimeout(start, 2500); } catch (e) {} }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true }); else ready();
function tests() {
  var mb = memBackend(), saved = backend; backend = mb; var res = {};
  var p = store.put('a b/../x.json', 'hola').then(function (r) { res.nameSanitized = r.name === 'a_b_.._x.json' && r.size === 4; return store.getText(r.name); }).then(function (t) { res.roundTrip = t === 'hola'; return store.list(); }).then(function (L) { res.listed = L.length === 1; return store.remove('a_b_.._x.json'); }).then(function () { return store.get('a_b_.._x.json'); }).then(function (g) { res.removed = g === null; }).catch(function () { res.storeError = true; }).then(function () { backend = saved; });
  var now = 1e6, sess = [{ id: 'm', clean: false, beat: now - 999999 }, { id: 'a', clean: false, beat: now - 120000 }, { id: 'b', clean: false, beat: now - 10000 }, { id: 'c', clean: true, beat: now - 999999 }, null];
  var cr = crashedSessions(sess, now, 'm'), thrown = 0; try { safeName(''); } catch (e) { thrown++; } 
  var out = {
    sessionDetectsOnlyStaleUncleanOthers: cr.length === 1 && cr[0].id === 'a',
    hashStableAndSensitive: hash('abc') === hash('abc') && hash('abc') !== hash('abd') && hash('x'.repeat(50000) + 'a') !== hash('x'.repeat(50000) + 'b'),
    emptyNameRejected: thrown === 1, safeNameStrips: safeName('../../etc/passwd').indexOf('/') < 0 && safeName('.hidden')[0] !== '.',
    banner: typeof banner === 'function'
  };
  return p.then(function () { for (var k in res) out[k] = res[k]; return out; });
}
window.CVResilienceP133 = { version: '133.1.0', store: store, usage: usage, snapshotNow: snapshotNow, recoveries: recoveries, restore: restore, engineNames: engineNames, crashedSessions: crashedSessions, start: start, mountSettings: mountSettings, tests: tests, _useBackend: useBackend, _mem: memBackend };
})();
