/* P170 · Kho lưu trữ kép: một nút lưu đồng thời vào THƯ MỤC TRÊN MÁY (bản chính) và Supabase Storage (bản sao lưu mã hóa).
   - Không tạo kho dữ liệu mới: đọc/ghi Thư viện ảnh (CV.assets), dự án đang mở (CVCreativeCore) và dùng khóa mã hóa của P130.
   - Máy: File System Access API (Chrome/Edge). Thư mục CANVIO/{manifest.json, projects/, assets/}. Tên tệp tài nguyên = <sha8>-<tên>.
   - Cloud: mỗi tài nguyên được mã hóa AES-GCM (khóa P130) rồi tải lên bucket riêng tư `cv-assets/<uid>/...`; danh mục `manifest.enc` cũng mã hóa.
   - Hai bên độc lập: một bên lỗi không làm hỏng bên kia; tài nguyên trùng nội dung (SHA-256) không được lưu lại. */
(function () {
'use strict';
if (window.CVStorageHubP170) return;
var BUCKET = 'cv-assets', DBN = 'CANVIO_P170', MAXBODY = 48 * 1024 * 1024;
var SQL = "-- CANVIO P170 · Kho tài nguyên mã hóa (Supabase Storage). Chạy MỘT LẦN trong SQL Editor, sau khi đã chạy SQL của P130.\n"
  + "insert into storage.buckets (id, name, public, file_size_limit)\nvalues ('cv-assets', 'cv-assets', false, 52428800)\non conflict (id) do update set public = false, file_size_limit = 52428800;\n\n"
  + "drop policy if exists \"cv_assets_select_own\" on storage.objects;\ndrop policy if exists \"cv_assets_insert_own\" on storage.objects;\ndrop policy if exists \"cv_assets_update_own\" on storage.objects;\ndrop policy if exists \"cv_assets_delete_own\" on storage.objects;\n\n"
  + "create policy \"cv_assets_select_own\" on storage.objects for select to authenticated\n  using (bucket_id = 'cv-assets' and (storage.foldername(name))[1] = (select auth.uid())::text);\n"
  + "create policy \"cv_assets_insert_own\" on storage.objects for insert to authenticated\n  with check (bucket_id = 'cv-assets' and (storage.foldername(name))[1] = (select auth.uid())::text);\n"
  + "create policy \"cv_assets_update_own\" on storage.objects for update to authenticated\n  using (bucket_id = 'cv-assets' and (storage.foldername(name))[1] = (select auth.uid())::text)\n  with check (bucket_id = 'cv-assets' and (storage.foldername(name))[1] = (select auth.uid())::text);\n"
  + "create policy \"cv_assets_delete_own\" on storage.objects for delete to authenticated\n  using (bucket_id = 'cv-assets' and (storage.foldername(name))[1] = (select auth.uid())::text);\n";

function safeName(n) { var s = String(n == null ? '' : n).replace(/[\\\/:*?"<>|\u0000-\u001f]/g, '_').replace(/^\.+/, '').replace(/\s+/g, ' ').trim().slice(0, 80); return s || 'tep'; }
function hex(buf) { var u = new Uint8Array(buf), s = '', i; for (i = 0; i < u.length; i++) s += (u[i] < 16 ? '0' : '') + u[i].toString(16); return s; }
function sha256(bytes) { return crypto.subtle.digest('SHA-256', bytes).then(hex); }
function parseDataUrl(d) {
  var m = /^data:([^;,]*)((?:;[^;,]*)*?),([\s\S]*)$/.exec(String(d || '')); if (!m) return null;
  var b64 = /;base64/i.test(m[2]), u;
  try {
    if (b64) { var bin = atob(m[3]); u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); }
    else u = new TextEncoder().encode(decodeURIComponent(m[3]));
  } catch (e) { return null; }
  return { mime: m[1] || 'application/octet-stream', bytes: u };
}
function toDataUrl(bytes, mime) { var s = '', i; for (i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return 'data:' + (mime || 'application/octet-stream') + ';base64,' + btoa(s); }
function rand(n) { var u = crypto.getRandomValues(new Uint8Array(n)); return hex(u); }
function missing(items, knownShas) { var k = {}; (knownShas || []).forEach(function (s) { k[s] = 1; }); return (items || []).filter(function (it) { return it && it.sha && !k[it.sha]; }); }

var shaCache = {};
function describe(list) {
  var out = [], skipped = 0, seen = {}, chain = Promise.resolve();
  (list || []).forEach(function (a) {
    chain = chain.then(function () {
      var p = a && typeof a.data === 'string' && /^data:/.test(a.data) ? parseDataUrl(a.data) : null;
      if (!p) { skipped++; return; }
      var ck = a.id + ':' + a.data.length, got = shaCache[ck];
      return (got ? Promise.resolve(got) : sha256(p.bytes).then(function (h) { shaCache[ck] = h; return h; })).then(function (h) {
        if (seen[h]) return; seen[h] = 1;
        out.push({ id: String(a.id), name: String(a.name || 'tep'), mime: a.mime || p.mime, size: p.bytes.length, cat: a.cat || '', at: a.at || '', sha: h, _bytes: p.bytes, _data: a.data });
      });
    });
  });
  return chain.then(function () { return { items: out, skipped: skipped }; });
}
function pub(it) { return { id: it.id, name: it.name, mime: it.mime, size: it.size, cat: it.cat, at: it.at, sha: it.sha }; }
function localAssets() { try { return (window.CV && CV.assets && CV.assets.list && CV.assets.list()) || []; } catch (e) { return []; } }
function addLocal(name, mime, bytes) { return CV.assets.addBlob(new File([bytes], name, { type: mime || 'application/octet-stream' })); }

/* ---------- trạng thái + tay cầm thư mục (IndexedDB) ---------- */
function idb() { return new Promise(function (ok, no) { var q = indexedDB.open(DBN, 1); q.onupgradeneeded = function () { q.result.createObjectStore('kv'); }; q.onsuccess = function () { ok(q.result); }; q.onerror = function () { no(q.error); }; }); }
function kvGet(k) { return idb().then(function (d) { return new Promise(function (ok, no) { var r = d.transaction('kv').objectStore('kv').get(k); r.onsuccess = function () { ok(r.result); }; r.onerror = function () { no(r.error); }; }); }); }
function kvSet(k, v) { return idb().then(function (d) { return new Promise(function (ok, no) { var t = d.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = function () { ok(); }; t.onerror = function () { no(t.error); }; }); }); }
var mem = null;
function supported() { return typeof window.showDirectoryPicker === 'function'; }
function pickFolder() {
  if (!supported()) return Promise.reject(new Error('Trình duyệt này không hỗ trợ chọn thư mục. Hãy dùng Chrome hoặc Edge trên máy tính.'));
  return window.showDirectoryPicker({ id: 'canvio-storage', mode: 'readwrite' }).then(function (h) { mem = h; return kvSet('folder', h).then(function () { return h; }, function () { return h; }); });
}
function folder(ask) {
  return (mem ? Promise.resolve(mem) : kvGet('folder')).then(function (h) {
    if (!h) return { handle: null, state: 'none' };
    var opt = { mode: 'readwrite' };
    return Promise.resolve(h.queryPermission ? h.queryPermission(opt) : 'granted').then(function (p) {
      if (p === 'granted') return { handle: h, state: 'granted' };
      if (!ask) return { handle: h, state: 'prompt' };
      return Promise.resolve(h.requestPermission(opt)).then(function (r) { return { handle: h, state: r === 'granted' ? 'granted' : 'denied' }; });
    });
  });
}
function sub(h, name) { return h.getDirectoryHandle(name, { create: true }); }
function writeFile(dir, name, data) { return dir.getFileHandle(name, { create: true }).then(function (f) { return f.createWritable(); }).then(function (w) { return w.write(data).then(function () { return w.close(); }); }); }
function readFile(dir, name) { return dir.getFileHandle(name).then(function (f) { return f.getFile(); }); }
function names(dir) { var out = []; var it = dir.entries(); return (function step() { return Promise.resolve(it.next()).then(function (r) { if (r.done) return out; out.push(r.value[0]); return step(); }); })(); }

/* ---------- máy tính ---------- */
function saveLocal(ask) {
  return folder(ask).then(function (f) {
    if (!f.handle) throw new Error('Chưa chọn thư mục trên máy.');
    if (f.state !== 'granted') throw new Error(f.state === 'denied' ? 'Bạn đã từ chối quyền ghi thư mục.' : 'Cần cấp lại quyền ghi thư mục: bấm "Lưu cả máy và cloud" một lần.');
    return describe(localAssets()).then(function (d) {
      return sub(f.handle, 'CANVIO').then(function (root) {
        return Promise.all([sub(root, 'assets'), sub(root, 'projects')]).then(function (dd) {
          var ad = dd[0], pd = dd[1], res = { saved: 0, kept: 0, skipped: d.skipped, project: '' };
          return names(ad).then(function (have) {
            var set = {}; have.forEach(function (n) { set[n] = 1; }); var chain = Promise.resolve();
            d.items.forEach(function (it) {
              var fn = it.sha.slice(0, 12) + '-' + safeName(it.name);
              chain = chain.then(function () { if (set[fn]) { res.kept++; return; } return writeFile(ad, fn, it._bytes).then(function () { res.saved++; }); });
            });
            return chain;
          }).then(function () {
            var p = null; try { var C = window.CVCreativeCore, a = C && C.active; p = typeof a === 'function' ? a.call(C) : a; } catch (e) {}
            if (!p) return;
            var id = safeName(p.id || p.name || 'du-an'); res.project = String(p.name || p.id || '');
            return writeFile(pd, id + '.json', JSON.stringify(p, null, 1));
          }).then(function () {
            return writeFile(root, 'manifest.json', JSON.stringify({ canvio: 'p170-manifest', version: 1, savedAt: new Date().toISOString(), assets: d.items.map(function (it) { var m = pub(it); m.file = it.sha.slice(0, 12) + '-' + safeName(it.name); return m; }) }, null, 1));
          }).then(function () { return res; });
        });
      });
    });
  });
}
function restoreLocal(ask) {
  return folder(ask).then(function (f) {
    if (!f.handle || f.state !== 'granted') throw new Error('Chưa có quyền đọc thư mục trên máy.');
    return f.handle.getDirectoryHandle('CANVIO').then(function (root) {
      return Promise.all([readFile(root, 'manifest.json').then(function (x) { return x.text(); }), root.getDirectoryHandle('assets')]).then(function (a) {
        var man = JSON.parse(a[0]); if (!man || man.canvio !== 'p170-manifest') throw new Error('Thư mục không có bản lưu CANVIO hợp lệ.');
        return describe(localAssets()).then(function (d) {
          var todo = missing(man.assets, d.items.map(function (i) { return i.sha; })), res = { restored: 0, failed: 0, already: (man.assets || []).length - todo.length }, chain = Promise.resolve();
          todo.forEach(function (m) {
            chain = chain.then(function () {
              return readFile(a[1], m.file).then(function (fl) { return fl.arrayBuffer(); }).then(function (buf) {
                var u = new Uint8Array(buf); return sha256(u).then(function (h) { if (h !== m.sha) { res.failed++; return; } return addLocal(m.name, m.mime, u).then(function () { res.restored++; }); });
              }).catch(function () { res.failed++; });
            });
          });
          return chain.then(function () { return res; });
        });
      });
    });
  });
}

/* ---------- cloud ---------- */
function client() { var P = window.CVCloudP130, c = P && P.client; if (!c || !c.isUnlocked || !c.isUnlocked() || !c._key) throw new Error('Hãy đăng nhập và mở khóa ở thẻ "Đồng bộ đám mây" trước.'); return c; }
function sreq(c, method, path, body, extra) {
  var cf = c.cfg(); return c._token().then(function (t) { var h = { apikey: cf.anon, Authorization: 'Bearer ' + t }; if (extra) Object.keys(extra).forEach(function (k) { h[k] = extra[k]; }); return fetch(cf.url + '/storage/v1/object/' + path, { method: method, headers: h, body: body }); });
}
function uidOf(c) { var s = c.session(); return s && s.user && s.user.id; }
function getEnc(c, path, aad) {
  return sreq(c, 'GET', 'authenticated/' + BUCKET + '/' + path).then(function (r) {
    if (r.status === 404 || r.status === 400) return null;
    if (!r.ok) throw new Error('Supabase Storage trả lỗi ' + r.status + (r.status === 401 || r.status === 403 ? ' (kiểm tra đã chạy SQL kho tài nguyên chưa)' : ''));
    return r.text().then(function (t) { return c._decrypt(JSON.parse(t), c._key(), aad); });
  });
}
function putEnc(c, path, obj, aad) {
  return c._encrypt(obj, c._key(), aad).then(function (enc) {
    var body = JSON.stringify(enc); if (body.length > MAXBODY) return { tooBig: true };
    return sreq(c, 'POST', BUCKET + '/' + path, body, { 'x-upsert': 'true', 'Content-Type': 'application/octet-stream' }).then(function (r) {
      if (!r.ok) return r.text().then(function (t) { throw new Error('Tải lên thất bại (' + r.status + ')' + (/bucket/i.test(t) ? ': chưa có bucket cv-assets, hãy chạy SQL kho tài nguyên' : (r.status === 403 || r.status === 401 ? ': thiếu quyền, hãy chạy SQL kho tài nguyên' : ''))); });
      return { ok: true };
    });
  });
}
function readCloudManifest(c, uid) {
  return getEnc(c, uid + '/manifest.enc', MAN).then(function (man) {
    if (!man) return { assets: [] };
    if (!Array.isArray(man.assets)) throw new Error('Danh mục cloud không hợp lệ.');
    return man;
  });
}
function listCloudAssets() {
  var c; try { c = client(); } catch (e) { return Promise.reject(e); }
  var uid = uidOf(c); if (!uid) return Promise.reject(new Error('Chưa đăng nhập.'));
  return readCloudManifest(c, uid).then(function (man) {
    return man.assets.map(function (it) { return pub(it); });
  });
}
function deleteCloudAsset(sha) {
  var c; try { c = client(); } catch (e) { return Promise.reject(e); }
  var uid = uidOf(c);
  if (!uid) return Promise.reject(new Error('Chưa đăng nhập.'));
  sha = String(sha || '');
  if (!/^[a-f0-9]{64}$/i.test(sha)) return Promise.reject(new Error('Mã tài nguyên không hợp lệ.'));
  return readCloudManifest(c, uid).then(function (man) {
    var item = man.assets.find(function (it) { return it && it.sha === sha; });
    if (!item) throw new Error('Không tìm thấy tài nguyên trong danh mục cloud của tài khoản này.');
    var prefix = uid + '/a-';
    if (typeof item.path !== 'string' || item.path.slice(0, prefix.length) !== prefix || !/^a-[a-f0-9]{24}$/i.test(item.path.slice(uid.length + 1))) {
      throw new Error('Đường dẫn tài nguyên không thuộc định dạng lưu trữ P170 của tài khoản này; đã chặn xóa.');
    }
    return sreq(c, 'DELETE', BUCKET, JSON.stringify({ prefixes: [item.path] }), { 'Content-Type': 'application/json' }).then(function (r) {
      if (!r.ok) return r.text().then(function (t) { throw new Error('Xóa tài nguyên cloud thất bại (' + r.status + ')' + (t ? ': ' + t.slice(0, 180) : '')); });
      man.assets = man.assets.filter(function (it) { return it !== item && it.sha !== sha; });
      return putEnc(c, uid + '/manifest.enc', { assets: man.assets, at: new Date().toISOString() }, MAN).then(function () {
        return { deleted: true, manifestUpdated: true, asset: pub(item), remaining: man.assets.length };
      }, function (e) {
        return { deleted: true, manifestUpdated: false, asset: pub(item), remaining: man.assets.length, warning: 'Đối tượng đã xóa khỏi Storage nhưng chưa cập nhật được manifest mã hóa: ' + (e && e.message || e) };
      });
    });
  });
}
var MAN = 'canvio:v1:asset-manifest';
function saveCloud() {
  var c; try { c = client(); } catch (e) { return Promise.reject(e); }
  var uid = uidOf(c); if (!uid) return Promise.reject(new Error('Chưa đăng nhập.'));
  return Promise.all([describe(localAssets()), getEnc(c, uid + '/manifest.enc', MAN)]).then(function (a) {
    var d = a[0], man = a[1] && Array.isArray(a[1].assets) ? a[1] : { assets: [] }, have = {}; man.assets.forEach(function (m) { have[m.sha] = 1; });
    var res = { uploaded: 0, already: 0, tooBig: [], skipped: d.skipped }, chain = Promise.resolve();
    d.items.forEach(function (it) {
      chain = chain.then(function () {
        if (have[it.sha]) { res.already++; return; }
        var p = uid + '/a-' + rand(12); return putEnc(c, p, { m: it.mime, d: it._data }, 'canvio:v1:asset:' + p).then(function (r) {
          if (r.tooBig) { res.tooBig.push(it.name); return; } var m = pub(it); m.path = p; man.assets.push(m); have[it.sha] = 1; res.uploaded++;
        });
      });
    });
    return chain.then(function () { if (!res.uploaded) return res; return putEnc(c, uid + '/manifest.enc', { assets: man.assets, at: new Date().toISOString() }, MAN).then(function () { return res; }); });
  });
}
function restoreCloud() {
  var c; try { c = client(); } catch (e) { return Promise.reject(e); }
  var uid = uidOf(c);
  return Promise.all([getEnc(c, uid + '/manifest.enc', MAN), describe(localAssets())]).then(function (a) {
    var man = a[0]; if (!man || !Array.isArray(man.assets)) return { restored: 0, failed: 0, already: 0, empty: true };
    var todo = missing(man.assets, a[1].items.map(function (i) { return i.sha; })), res = { restored: 0, failed: 0, already: man.assets.length - todo.length }, chain = Promise.resolve();
    todo.forEach(function (m) {
      chain = chain.then(function () {
        return getEnc(c, m.path, 'canvio:v1:asset:' + m.path).then(function (o) {
          var p = o && parseDataUrl(o.d); if (!p) { res.failed++; return; }
          return sha256(p.bytes).then(function (h) { if (h !== m.sha) { res.failed++; return; } return addLocal(m.name, m.mime, p.bytes).then(function () { res.restored++; }); });
        }).catch(function () { res.failed++; });
      });
    });
    return chain.then(function () { return res; });
  });
}

/* ---------- lưu cả hai ---------- */
function saveBoth(ask) {
  var out = { local: null, cloud: null };
  return saveLocal(ask).then(function (r) { out.local = { ok: true, r: r }; }, function (e) { out.local = { ok: false, error: e.message }; })
    .then(function () { return saveCloud(); }).then(function (r) { out.cloud = { ok: true, r: r }; }, function (e) { out.cloud = { ok: false, error: e.message }; })
    .then(function () { out.at = new Date().toISOString(); kvSet('last', { at: out.at, local: out.local.ok, cloud: out.cloud.ok }).catch(function () {}); return out; });
}
function summary(o) {
  function side(n, s, f) { return s.ok ? n + ': ' + f(s.r) : n + ' lỗi: ' + s.error; }
  return [side('Máy', o.local, function (r) { return r.saved + ' mới, ' + r.kept + ' đã có' + (r.project ? ', dự án “' + r.project + '”' : ''); }),
    side('Cloud', o.cloud, function (r) { return r.uploaded + ' mới, ' + r.already + ' đã có' + (r.tooBig.length ? ', ' + r.tooBig.length + ' tệp quá lớn nên không lên cloud' : ''); })].join(' · ');
}

var api = { version: '170.1.0', sql: SQL, bucket: BUCKET, supported: supported, safeName: safeName, parseDataUrl: parseDataUrl, toDataUrl: toDataUrl, sha256: sha256, missing: missing, describe: describe,
  pickFolder: pickFolder, folderState: function () { return folder(false); }, saveLocal: saveLocal, restoreLocal: restoreLocal, saveCloud: saveCloud, restoreCloud: restoreCloud, listCloudAssets: listCloudAssets, deleteCloudAsset: deleteCloudAsset, saveBoth: saveBoth, summary: summary, _setHandle: function (h) { mem = h; } };
window.CVStorageHubP170 = api;

/* ---------- giao diện: ngay dưới thẻ Đồng bộ đám mây ---------- */
function mount() {
  var page = document.getElementById('page-projectVault'); if (!page) return false;
  if (page.querySelector('#cv170-card')) return true;
  var after = page.querySelector('#cv130-card'); if (!after) return false;
  var card = document.createElement('div'); card.className = 'card'; card.id = 'cv170-card'; card.style.cssText = 'margin:0 0 14px;padding:14px';
  card.innerHTML = '<h3 style="margin:0 0 4px">Lưu trữ kép: máy tính + cloud</h3><p class="tiny" style="margin:0 0 10px">Một nút lưu tài nguyên và dự án đang mở vào thư mục trên máy (bản chính) và lên Supabase (bản sao lưu đã mã hóa). Tệp trùng nội dung không lưu lại.</p>'
    + '<div class="row" style="gap:6px;flex-wrap:wrap"><button class="btn btn-primary sm" id="cv170-both" type="button">Lưu cả máy và cloud</button><button class="btn btn-soft sm" id="cv170-pick" type="button">Chọn thư mục trên máy</button><button class="btn btn-ghost sm" id="cv170-local" type="button">Chỉ lưu máy</button><button class="btn btn-ghost sm" id="cv170-cloud" type="button">Chỉ lưu cloud</button></div>'
    + '<div class="row" style="gap:6px;flex-wrap:wrap;margin-top:8px"><button class="btn btn-ghost sm" id="cv170-rlocal" type="button">Khôi phục tài nguyên từ máy</button><button class="btn btn-ghost sm" id="cv170-rcloud" type="button">Khôi phục từ cloud</button><button class="btn btn-ghost sm" id="cv170-sql" type="button">Sao chép SQL kho tài nguyên</button></div>'
    + '<div class="row" style="gap:6px;flex-wrap:wrap;margin-top:8px"><button class="btn btn-ghost sm" id="cv170-cloud-list" type="button">Tải danh sách cloud</button><select class="input sm" id="cv170-cloud-assets" aria-label="Chọn tài nguyên cloud" style="min-width:190px;max-width:100%"><option value="">Chọn tài nguyên cloud…</option></select><button class="btn btn-ghost sm" id="cv170-cloud-delete" type="button">Xóa tài nguyên đã chọn</button></div>'
    + '<div id="cv170-info" class="tiny" style="margin-top:8px"></div><div id="cv170-msg" class="tiny" role="status" aria-live="polite" style="margin-top:4px"></div>';
  after.insertAdjacentElement('afterend', card);
  var $ = function (s) { return card.querySelector(s); }, msg = $('#cv170-msg');
  function say(t, bad) { msg.textContent = t; msg.style.color = bad ? '#b4233b' : ''; }
  function info() {
    Promise.all([folder(false).catch(function () { return { state: 'none' }; }), kvGet('last').catch(function () { return null; })]).then(function (a) {
      var fs = a[0].state === 'none' ? (supported() ? 'chưa chọn thư mục' : 'trình duyệt không hỗ trợ chọn thư mục') : (a[0].state === 'granted' ? 'đã chọn thư mục «' + (a[0].handle.name || '') + '»' : 'đã chọn «' + (a[0].handle.name || '') + '», cần cấp lại quyền khi lưu');
      $('#cv170-info').textContent = 'Máy: ' + fs + ' · Tài nguyên trong thư viện: ' + localAssets().length + (a[1] ? ' · Lần lưu cuối: ' + new Date(a[1].at).toLocaleString('vi-VN') : '');
    });
  }
  function run(btn, fn, label) { btn.disabled = true; say(label + '…'); Promise.resolve().then(fn).then(function (t) { say(t); info(); }, function (e) { say(e.message || String(e), true); }).then(function () { btn.disabled = false; }); }
  $('#cv170-pick').addEventListener('click', function () { var b = this; b.disabled = true; pickFolder().then(function (h) { say('Đã chọn thư mục «' + h.name + '».'); info(); }, function (e) { if (e && e.name !== 'AbortError') say(e.message, true); }).then(function () { b.disabled = false; }); });
  $('#cv170-both').addEventListener('click', function () { run(this, function () { return folder(true).catch(function () {}).then(function () { return saveBoth(false); }).then(summary); }, 'Đang lưu'); });
  $('#cv170-local').addEventListener('click', function () { run(this, function () { return saveLocal(true).then(function (r) { return 'Máy: ' + r.saved + ' mới, ' + r.kept + ' đã có.'; }); }, 'Đang lưu vào máy'); });
  $('#cv170-cloud').addEventListener('click', function () { run(this, function () { return saveCloud().then(function (r) { return 'Cloud: ' + r.uploaded + ' mới, ' + r.already + ' đã có' + (r.tooBig.length ? ', ' + r.tooBig.length + ' tệp quá lớn' : '') + '.'; }); }, 'Đang đẩy lên cloud'); });
  $('#cv170-rlocal').addEventListener('click', function () { run(this, function () { return restoreLocal(true).then(function (r) { return 'Đã khôi phục ' + r.restored + ' tài nguyên từ máy (' + r.already + ' đã có' + (r.failed ? ', ' + r.failed + ' lỗi' : '') + ').'; }); }, 'Đang khôi phục'); });
  $('#cv170-rcloud').addEventListener('click', function () { run(this, function () { return restoreCloud().then(function (r) { return r.empty ? 'Cloud chưa có bản lưu tài nguyên.' : 'Đã khôi phục ' + r.restored + ' tài nguyên từ cloud (' + r.already + ' đã có' + (r.failed ? ', ' + r.failed + ' lỗi' : '') + ').'; }); }, 'Đang khôi phục'); });
  $('#cv170-sql').addEventListener('click', function () { try { navigator.clipboard.writeText(SQL).then(function () { say('Đã sao chép SQL. Dán vào Supabase → SQL Editor rồi bấm Run.'); }, function () { say('Không sao chép được, hãy cho phép clipboard.', true); }); } catch (e) { say('Không sao chép được.', true); } });
  $('#cv170-cloud-list').addEventListener('click', function () {
    run(this, function () {
      return listCloudAssets().then(function (items) {
        var sel = $('#cv170-cloud-assets'); sel.innerHTML = '';
        var first = document.createElement('option'); first.value = '';
        first.textContent = items.length ? 'Chọn tài nguyên cloud…' : 'Cloud chưa có tài nguyên';
        sel.appendChild(first);
        items.forEach(function (it) {
          var opt = document.createElement('option'); opt.value = it.sha;
          opt.textContent = it.name + ' · ' + it.size + ' B'; sel.appendChild(opt);
        });
        return 'Đã tải ' + items.length + ' tài nguyên cloud.';
      });
    }, 'Đang tải danh sách cloud');
  });
  $('#cv170-cloud-delete').addEventListener('click', function () {
    var sel = $('#cv170-cloud-assets'), sha = sel.value;
    if (!sha) { say('Hãy tải danh sách và chọn tài nguyên cần xóa.', true); return; }
    var name = sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].textContent : 'tài nguyên đã chọn';
    if (!window.confirm('Xóa vĩnh viễn ' + name + ' khỏi cloud? Bản trong Asset Library và bản lưu trên máy không bị xóa.')) return;
    run(this, function () {
      return deleteCloudAsset(sha).then(function (r) {
        if (!r.deleted) throw new Error('Cloud chưa xác nhận xóa tài nguyên.');
        if (r.manifestUpdated) {
          sel.remove(sel.selectedIndex); sel.value = '';
          return 'Đã xóa ' + name + ' khỏi cloud. Còn ' + r.remaining + ' tài nguyên.';
        }
        throw new Error(r.warning || 'Đã xóa đối tượng nhưng manifest chưa cập nhật; hãy tải lại danh sách và kiểm tra.');
      });
    }, 'Đang xóa tài nguyên cloud');
  });
  info(); return true;
}
function ready() { try { if (!mount() && window.MutationObserver) { var mo = new MutationObserver(function () { if (mount()) mo.disconnect(); }); mo.observe(document.body, { childList: true, subtree: true }); setTimeout(function () { mo.disconnect(); }, 30000); } } catch (e) {} }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true }); else ready();
})();
