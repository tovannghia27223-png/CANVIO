/* P133.6 · Kho Tài nguyên (Asset Library) không còn bị giới hạn bởi localStorage ~5MB.
   Giữ nguyên API đồng bộ LS.get/LS.set('assets'): dữ liệu lớn (dataURL) được lưu trong IndexedDB `CANVIO_ASSET_STORE`,
   localStorage chỉ giữ siêu dữ liệu + cờ store:1. Không làm mất dữ liệu: bản ghi mới giữ đủ trong localStorage cho tới khi IndexedDB
   xác nhận đã ghi (nếu localStorage đầy thì dùng bộ nhớ tạm + IndexedDB); tài nguyên cũ trong localStorage được tự chuyển sang IndexedDB. */
(function () {
'use strict';
if (window.CVAssetStoreP133) return;
var KEY = 'assets', LSKEY = 'canvio5:assets', DB = 'CANVIO_ASSET_STORE', ST = 'assets', MIN = 48 * 1024;
var cache = Object.create(null), persisted = Object.create(null), db = null, dbP = null, ready = false, pending = 0, lastError = '';
function openDb() {
  if (dbP) return dbP;
  dbP = new Promise(function (ok, no) {
    if (!window.indexedDB) { no(new Error('Không có IndexedDB')); return; }
    var q = indexedDB.open(DB, 1);
    q.onupgradeneeded = function () { if (!q.result.objectStoreNames.contains(ST)) q.result.createObjectStore(ST, { keyPath: 'id' }); };
    q.onsuccess = function () { db = q.result; ok(db); };
    q.onerror = function () { no(q.error || new Error('Không mở được kho tài nguyên')); };
  });
  return dbP;
}
function put(id, data) { return openDb().then(function (d) { return new Promise(function (ok, no) { var tx = d.transaction(ST, 'readwrite'); tx.objectStore(ST).put({ id: id, data: data, at: Date.now() }); tx.oncomplete = ok; tx.onerror = tx.onabort = function () { no(tx.error || new Error('Không ghi được tài nguyên')); }; }); }); }
function del(ids) { if (!ids.length) return Promise.resolve(); return openDb().then(function (d) { return new Promise(function (ok) { var tx = d.transaction(ST, 'readwrite'), os = tx.objectStore(ST); ids.forEach(function (i) { os.delete(i); }); tx.oncomplete = tx.onerror = tx.onabort = ok; }); }).catch(function () {}); }
function getAll() { return openDb().then(function (d) { return new Promise(function (ok, no) { var q = d.transaction(ST).objectStore(ST).getAll(); q.onsuccess = function () { ok(q.result || []); }; q.onerror = function () { no(q.error); }; }); }); }
function rawRead() { try { var r = localStorage.getItem(LSKEY); return r ? JSON.parse(r) : null; } catch (e) { return null; } }
function rawWrite(arr) { try { localStorage.setItem(LSKEY, JSON.stringify(arr)); return true; } catch (e) { return false; } }
function isBig(a) { return a && typeof a.data === 'string' && a.data.length >= MIN && /^data:/.test(a.data); }
function stripped(a) { var c = {}; Object.keys(a).forEach(function (k) { if (k !== 'data') c[k] = a[k]; }); c.store = 1; c.data = ''; return c; }
function hydrateList(arr) { return arr.map(function (a) { if (a && a.store === 1) { var c = {}; Object.keys(a).forEach(function (k) { c[k] = a[k]; }); c.data = cache[a.id] || ''; delete c.store; return c; } return a; }); }
function persistList(arr) {
  /* trả về mảng để ghi vào localStorage: mục lớn đã xác nhận trong IDB → bỏ data */
  return arr.map(function (a) { return isBig(a) && persisted[a.id] ? stripped(a) : a; });
}
function afterPut(arr) {
  var big = arr.filter(isBig);
  big.forEach(function (a) {
    cache[a.id] = a.data;
    if (persisted[a.id] === a.data.length) return;
    pending++;
    put(a.id, a.data).then(function () { persisted[a.id] = a.data.length; pending--; var cur = rawRead(); if (cur) rawWrite(cur.map(function (x) { return x && x.id === a.id && isBig(x) ? stripped(x) : x; })); }, function (e) { pending--; lastError = String(e && e.message || e).slice(0, 120); });
  });
  var keep = Object.create(null); arr.forEach(function (a) { if (a && a.id) keep[a.id] = 1; });
  var gone = Object.keys(cache).filter(function (i) { return !keep[i]; }); gone.forEach(function (i) { delete cache[i]; delete persisted[i]; });
  if (gone.length && ready) del(gone);
}
function install() {
  if (typeof LS === 'undefined' || !LS || LS.__cvAssetStore) return false;
  var rawGet = LS.get, rawSet = LS.set, rawDel = LS.del;
  LS.get = function (k, fb) { var v = rawGet.apply(LS, arguments); if (k === KEY && Array.isArray(v)) return hydrateList(v); return v; };
  LS.set = function (k, v) {
    if (k !== KEY || !Array.isArray(v)) return rawSet.apply(LS, arguments);
    var full = v;
    if (rawWrite(persistList(full))) { afterPut(full); return true; }
    /* localStorage đầy: giữ siêu dữ liệu, dữ liệu lớn vào bộ nhớ tạm + IndexedDB */
    var meta = full.map(function (a) { return isBig(a) ? stripped(a) : a; });
    if (rawWrite(meta)) { afterPut(full); return true; }
    return rawSet.apply(LS, arguments);
  };
  LS.del = function (k) { if (k === KEY) { var ids = Object.keys(cache); cache = Object.create(null); persisted = Object.create(null); if (ready) del(ids); } return rawDel.apply(LS, arguments); };
  LS.__cvAssetStore = true; return true;
}
function boot() {
  var cur = rawRead() || [];
  return openDb().then(getAll).then(function (rows) {
    rows.forEach(function (r) { if (r && r.id && typeof r.data === 'string') { cache[r.id] = r.data; persisted[r.id] = r.data.length; } });
    ready = true;
    /* chuyển tài nguyên cũ còn nằm trong localStorage sang IndexedDB */
    var legacy = cur.filter(isBig);
    legacy.forEach(function (a) { cache[a.id] = a.data; });
    var jobs = legacy.map(function (a) { return put(a.id, a.data).then(function () { persisted[a.id] = a.data.length; }); });
    return Promise.all(jobs).then(function () {
      if (legacy.length) { var now = rawRead() || []; rawWrite(now.map(function (x) { return isBig(x) && persisted[x.id] ? stripped(x) : x; })); }
      /* dọn bản ghi IDB không còn trong danh sách (an toàn: chỉ khi danh sách hợp lệ) */
      var ids = Object.create(null); (rawRead() || []).forEach(function (a) { if (a && a.id) ids[a.id] = 1; });
      var orphans = Object.keys(cache).filter(function (i) { return !ids[i]; });
      orphans.forEach(function (i) { delete cache[i]; delete persisted[i]; });
      return del(orphans).then(function () { try { if (window.CV && CV.assets && typeof CV.assets.render === 'function') CV.assets.render(); } catch (e) {} });
    });
  }).catch(function (e) { lastError = String(e && e.message || e).slice(0, 120); ready = false; });
}
var installed = install();
var booted = installed ? boot() : Promise.resolve();
window.CVAssetStoreP133 = { version: '133.6.0', installed: installed, ready: function () { return booted; }, status: function () { return { ready: ready, pending: pending, cached: Object.keys(cache).length, persisted: Object.keys(persisted).length, error: lastError }; }, isBig: isBig, stripped: stripped };
})();
