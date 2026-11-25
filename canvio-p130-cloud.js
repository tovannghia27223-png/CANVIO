/* P130 · Đồng bộ đám mây Supabase, mã hóa đầu-cuối (không dùng thư viện ngoài, chỉ fetch + WebCrypto).
   - Đăng nhập email/mật khẩu qua Supabase Auth (GoTrue REST).
   - Cụm mật khẩu mã hóa riêng (PBKDF2-SHA256 → AES-GCM 256) không bao giờ rời máy; Supabase chỉ thấy bản mã.
   - Bảng cv_meta (muối + bản kiểm tra) và cv_documents (bản mã từng tài liệu), bảo vệ bằng RLS (xem supabase/canvio-schema.sql).
   - Đồng bộ "bản mới hơn thắng"; bản cục bộ bị thay được giữ lại trong versions của tài liệu; không xóa gì trên đám mây hay trên máy. */
(function () {
'use strict';
if (window.CVCloudP130) return;
var SCHEMA_SQL = "-- CANVIO P130 · Đồng bộ đám mây có mã hóa đầu-cuối. Chạy MỘT LẦN trong Supabase → SQL Editor.\n-- Máy chủ chỉ lưu dữ liệu ĐÃ MÃ HÓA bằng cụm mật khẩu của bạn; RLS bảo đảm mỗi tài khoản chỉ đọc/ghi dữ liệu của chính mình.\n\ncreate table if not exists public.cv_meta (\n  user_id    uuid primary key default auth.uid() references auth.users(id) on delete cascade,\n  salt       text  not null,\n  kdf_iter   int   not null default 600000,\n  check_enc  jsonb not null,\n  created_at timestamptz not null default now()\n);\n\ncreate table if not exists public.cv_documents (\n  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,\n  doc_key    text not null check (char_length(doc_key) between 1 and 300),\n  updated_at timestamptz not null,\n  enc        jsonb not null,\n  size_bytes int,\n  primary key (user_id, doc_key)\n);\n\nalter table public.cv_meta      enable row level security;\nalter table public.cv_documents enable row level security;\n\ndrop policy if exists \"cv_meta_own\"      on public.cv_meta;\ndrop policy if exists \"cv_documents_own\" on public.cv_documents;\n\ncreate policy \"cv_meta_own\" on public.cv_meta\n  for all to authenticated\n  using ((select auth.uid()) = user_id)\n  with check ((select auth.uid()) = user_id);\n\ncreate policy \"cv_documents_own\" on public.cv_documents\n  for all to authenticated\n  using ((select auth.uid()) = user_id)\n  with check ((select auth.uid()) = user_id);\n\n-- Người chưa đăng nhập (anon) không được chạm vào hai bảng này.\nrevoke all on public.cv_meta, public.cv_documents from anon;\ngrant select, insert, update, delete on public.cv_meta, public.cv_documents to authenticated;\n";
function b64(buf) { var u = buf instanceof Uint8Array ? buf : new Uint8Array(buf), s = '', i; for (i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); }
function unb64(s) { var bin = atob(s), u = new Uint8Array(bin.length), i; for (i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
function te(s) { return new TextEncoder().encode(s); }
function okUrl(u) { return /^https:\/\/[a-z0-9-]+\.supabase\.(co|in)\/?$/i.test(u) || /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/?$/i.test(u); }
function stream(bytes, T) { var s = new T('gzip'), w = s.writable.getWriter(); w.write(bytes); w.close(); return new Response(s.readable).arrayBuffer().then(function (a) { return new Uint8Array(a); }); }
function create(deps) {
  deps = deps || {};
  var F = deps.fetch || window.fetch.bind(window), St = deps.storage, C = deps.crypto || window.crypto, vault = deps.vault, iterDefault = deps.kdfIter || 600000;
  var CS = deps.CompressionStream || (typeof CompressionStream !== 'undefined' ? CompressionStream : null), DS = deps.DecompressionStream || (typeof DecompressionStream !== 'undefined' ? DecompressionStream : null);
  var CFG = 'canvio.p130.cfg', SES = 'canvio.p130.session', key = null, last = '';
  function jget(k) { try { return JSON.parse(St.getItem(k) || 'null'); } catch (e) { return null; } }
  function jset(k, v) { try { if (v == null) St.removeItem(k); else St.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function cfg() { var c = jget(CFG); return c && c.url ? c : { url: 'https://szdyeqzqyyxmenoiiqxe.supabase.co', anon: 'sb_publishable_FmLKzCWH4W83IJ2Zfzy8ZA_9qYzMYow' }; }
  function setCfg(url, anon) { url = String(url || '').trim().replace(/\/+$/, ''); anon = String(anon || '').trim(); if (!okUrl(url)) throw new Error('Địa chỉ Supabase phải dạng https://xxxx.supabase.co'); if (anon.length < 20 || /\s/.test(anon)) throw new Error('Khóa anon/publishable không hợp lệ.'); if (/service_role/i.test(anon) || (anon.split('.').length === 3 && /"role"\s*:\s*"service_role"/.test((function () { try { return atob(anon.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')); } catch (e) { return ''; } })()))) throw new Error('Đây là khóa service_role (bí mật). Chỉ dùng khóa anon/publishable.'); jset(CFG, { url: url, anon: anon }); return true; }
  function session() { return jget(SES); }
  function hdr(tok, extra) { var c = cfg(), h = { apikey: c.anon, 'Content-Type': 'application/json' }; h.Authorization = 'Bearer ' + (tok || c.anon); if (extra) Object.keys(extra).forEach(function (k) { h[k] = extra[k]; }); return h; }
  function errOf(r, body) { var m = body && (body.msg || body.message || body.error_description || body.error) || ('HTTP ' + r.status); return new Error(String(m).slice(0, 180)); }
  function raw(path, opt) { var c = cfg(); if (!c.url) return Promise.reject(new Error('Chưa nhập địa chỉ Supabase.')); return F(c.url + path, opt).then(function (r) { return r.text().then(function (t) { var b = null; try { b = t ? JSON.parse(t) : null; } catch (e) {} return { r: r, b: b }; }); }); }
  function saveSession(b) { if (!b || !b.access_token) return null; var s = { access_token: b.access_token, refresh_token: b.refresh_token, expires_at: Date.now() + (b.expires_in || 3600) * 1000 - 30000, user: { id: b.user && b.user.id, email: b.user && b.user.email } }; jset(SES, s); return s; }
  function signUp(email, pw) { return raw('/auth/v1/signup', { method: 'POST', headers: hdr(), body: JSON.stringify({ email: email, password: pw }) }).then(function (x) { if (!x.r.ok) throw errOf(x.r, x.b); var s = saveSession(x.b); return { session: s, needConfirm: !s }; }); }
  function signIn(email, pw) { return raw('/auth/v1/token?grant_type=password', { method: 'POST', headers: hdr(), body: JSON.stringify({ email: email, password: pw }) }).then(function (x) { if (!x.r.ok) throw errOf(x.r, x.b); return saveSession(x.b); }); }
  function refresh() { var s = session(); if (!s || !s.refresh_token) return Promise.reject(new Error('Hết phiên đăng nhập. Hãy đăng nhập lại.')); return raw('/auth/v1/token?grant_type=refresh_token', { method: 'POST', headers: hdr(), body: JSON.stringify({ refresh_token: s.refresh_token }) }).then(function (x) { if (!x.r.ok) { jset(SES, null); throw new Error('Hết phiên đăng nhập. Hãy đăng nhập lại.'); } return saveSession(x.b); }); }
  function token() { var s = session(); if (!s) return Promise.reject(new Error('Chưa đăng nhập.')); return s.expires_at > Date.now() ? Promise.resolve(s.access_token) : refresh().then(function (n) { return n.access_token; }); }
  function signOut() { var s = session(); key = null; jset(SES, null); if (!s) return Promise.resolve(); return raw('/auth/v1/logout', { method: 'POST', headers: hdr(s.access_token) }).catch(function () {}).then(function () {}); }
  function rest(path, method, body, prefer) { return token().then(function (t) { var h = hdr(t, prefer ? { Prefer: prefer } : null); return raw('/rest/v1/' + path, { method: method, headers: h, body: body == null ? undefined : JSON.stringify(body) }); }).then(function (x) { if (!x.r.ok) { var e = errOf(x.r, x.b); if (x.r.status === 404 || /relation .* does not exist|schema cache/i.test(e.message)) e = new Error('Chưa tạo bảng trên Supabase. Hãy chạy tệp SQL (nút "Sao chép SQL") trong SQL Editor.'); throw e; } return x.b; }); }
  function deriveKey(pass, saltB, iter) { return C.subtle.importKey('raw', te(pass.normalize('NFKC')), 'PBKDF2', false, ['deriveKey']).then(function (base) { return C.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: unb64(saltB), iterations: iter }, base, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']); }); }
  function encrypt(obj, k, aad) {
    var iv = C.getRandomValues(new Uint8Array(12)), plain = te(JSON.stringify(obj));
    var pre = CS ? stream(plain, CS).then(function (z) { return z.length < plain.length ? { z: 1, d: z } : { z: 0, d: plain }; }) : Promise.resolve({ z: 0, d: plain });
    return pre.then(function (p) { return C.subtle.encrypt({ name: 'AES-GCM', iv: iv, additionalData: te(aad) }, k, p.d).then(function (ct) { return { v: 1, z: p.z, iv: b64(iv), ct: b64(ct) }; }); });
  }
  function gunzip(bytes) { var s = new DS('gzip'), w = s.writable.getWriter(); w.write(bytes); w.close(); return new Response(s.readable).arrayBuffer().then(function (a) { return new Uint8Array(a); }); }
  function decrypt(enc, k, aad) {
    if (!enc || enc.v !== 1) return Promise.reject(new Error('Định dạng bản mã không hỗ trợ.'));
    return C.subtle.decrypt({ name: 'AES-GCM', iv: unb64(enc.iv), additionalData: te(aad) }, k, unb64(enc.ct)).then(function (pt) { var u = new Uint8Array(pt); return enc.z ? (DS ? gunzip(u) : Promise.reject(new Error('Trình duyệt không giải nén được.'))) : u; }).then(function (u) { return JSON.parse(new TextDecoder().decode(u)); }, function () { throw new Error('Giải mã thất bại: sai cụm mật khẩu hoặc dữ liệu bị sửa.'); });
  }
  function unlock(pass) {
    if (!pass || pass.length < 8) return Promise.reject(new Error('Cụm mật khẩu mã hóa cần ít nhất 8 ký tự.'));
    return rest('cv_meta?select=salt,kdf_iter,check_enc', 'GET').then(function (rows) {
      if (rows && rows.length) { var m = rows[0]; return deriveKey(pass, m.salt, m.kdf_iter).then(function (k) { return decrypt(m.check_enc, k, 'canvio:v1:check').then(function (o) { if (!o || o.ok !== 'CANVIO') throw new Error('Giải mã thất bại: sai cụm mật khẩu hoặc dữ liệu bị sửa.'); key = k; return { created: false }; }); }); }
      var salt = b64(C.getRandomValues(new Uint8Array(16)));
      return deriveKey(pass, salt, iterDefault).then(function (k) { return encrypt({ ok: 'CANVIO' }, k, 'canvio:v1:check').then(function (enc) { return rest('cv_meta', 'POST', { salt: salt, kdf_iter: iterDefault, check_enc: enc }, 'return=minimal').then(function () { key = k; return { created: true }; }); }); });
    });
  }
  function exportKey() { if (!key) return Promise.reject(new Error('Hãy mở khóa trước.')); return C.subtle.exportKey('raw', key).then(function (r) { var s = session(); return { format: 'CANVIO_P130_KEY', version: 1, note: 'Giữ kín tệp này. Ai có nó đọc được dữ liệu đám mây của bạn.', user: s && s.user && s.user.email, key: b64(r) }; }); }
  function importKey(obj) { if (!obj || obj.format !== 'CANVIO_P130_KEY' || !obj.key) return Promise.reject(new Error('Tệp khóa dự phòng không hợp lệ.')); return rest('cv_meta?select=check_enc', 'GET').then(function (rows) { if (!rows || !rows.length) throw new Error('Tài khoản này chưa có dữ liệu mã hóa.'); return C.subtle.importKey('raw', unb64(obj.key), 'AES-GCM', true, ['encrypt', 'decrypt']).then(function (k) { return decrypt(rows[0].check_enc, k, 'canvio:v1:check').then(function () { key = k; return true; }); }); }); }
  function ms(s) { var t = Date.parse(s); return isFinite(t) ? t : 0; }
  var UNITS = 'canvio.p130.units', BIG = 40 * 1024 * 1024;
  function hashOf(v) { return C.subtle.digest('SHA-256', te(JSON.stringify(v))).then(b64); }
  function syncUnits(res, remoteRows) {
    var got = deps.localUnits ? deps.localUnits() : null; if (!got) return Promise.resolve();
    return Promise.resolve(got).then(function (units) {
      var meta = jget(UNITS) || {}, remote = {}, now = Date.now(), chain = Promise.resolve();
      (remoteRows || []).forEach(function (r) { if (r.doc_key.slice(0, 2) === 'x:') remote[r.doc_key] = r; });
      Object.keys(units).concat(Object.keys(remote).filter(function (k) { return !units[k]; })).forEach(function (k) {
        chain = chain.then(function () {
          var u = units[k], r = remote[k], rt = r ? ms(r.updated_at) : -1, m = meta[k];
          function push(h, t) { return encrypt(u.value, key, 'canvio:v1:' + k).then(function (enc) { if (enc.ct.length > BIG) { res.skipped.push(k + ' (quá 40MB)'); return; } return rest('cv_documents?on_conflict=user_id,doc_key', 'POST', [{ doc_key: k, updated_at: new Date(t).toISOString(), enc: enc, size_bytes: enc.ct.length }], 'resolution=merge-duplicates,return=minimal').then(function () { meta[k] = { h: h, t: t, rs: t }; res.pushed++; }); }); }
          function fetchRemote() { return rest('cv_documents?select=enc,updated_at&doc_key=eq.' + encodeURIComponent(k), 'GET').then(function (rows) { if (!rows || !rows.length) return null; return decrypt(rows[0].enc, key, 'canvio:v1:' + k); }); }
          function pull(val) { return Promise.resolve(val !== undefined ? val : fetchRemote()).then(function (v) { if (v == null) return; if (u) { try { (deps.backup || function (kk, vv) { St.setItem('canvio.p130.bak.' + kk, JSON.stringify({ t: now, value: vv })); })(k, u.value); res.kept++; } catch (e) {} } return Promise.resolve(deps.applyUnit(k, v)).then(function () { return hashOf(v); }).then(function (h) { meta[k] = { h: h, t: rt, rs: rt }; res.pulled++; }); }); }
          if (!u) return pull().catch(function (e) { res.errors.push(k + ': ' + e.message); });
          return hashOf(u.value).then(function (h) {
            if (!r) return push(h, (m && m.h === h) ? m.t : (u.time || now));
            if (m && m.h === h) { if (rt === m.rs) { res.same++; return; } return pull(); }
            if (m) { if (m.dh !== h) { m.dh = h; m.dt = now; } if (rt === m.rs) return push(h, m.dt); return m.dt > rt ? push(h, m.dt) : pull(); }
            return fetchRemote().then(function (rv) { if (rv == null) return push(h, u.time || now); return hashOf(rv).then(function (rh) { if (rh === h) { meta[k] = { h: h, t: rt, rs: rt }; res.same++; return; } return (u.time || 0) > rt ? push(h, u.time) : pull(rv); }); });
          }).catch(function (e) { res.errors.push(k + ': ' + e.message); });
        });
      });
      return chain.then(function () { jset(UNITS, meta); });
    });
  }
  function sync() {
    if (!key) return Promise.reject(new Error('Hãy mở khóa bằng cụm mật khẩu trước.'));
    var res = { pushed: 0, pulled: 0, same: 0, kept: 0, skipped: [], errors: [] };
    return Promise.all([vault.list(), rest('cv_documents?select=doc_key,updated_at', 'GET')]).then(function (a) {
      var local = {}, remote = {}, remoteAll; (a[0] || []).forEach(function (r) { if (r && r.key) local[r.key] = r; }); (a[1] || []).forEach(function (r) { if (r.doc_key.slice(0, 2) !== 'x:') remote[r.doc_key] = r; }); remoteAll = a[1] || [];
      var keys = Object.keys(local).concat(Object.keys(remote).filter(function (k) { return !local[k]; })), chain = Promise.resolve();
      keys.forEach(function (k) {
        chain = chain.then(function () {
          var l = local[k], r = remote[k], lt = l ? ms(l.savedAt) : -1, rt = r ? ms(r.updated_at) : -1;
          if (l && r && Math.abs(lt - rt) < 1) { res.same++; return; }
          if (l && (!r || lt > rt)) {
            return encrypt(l, key, 'canvio:v1:' + k).then(function (enc) {
              var size = enc.ct.length; if (size > 40 * 1024 * 1024) { res.skipped.push(k + ' (quá 40MB)'); return; }
              return rest('cv_documents?on_conflict=user_id,doc_key', 'POST', [{ doc_key: k, updated_at: new Date(lt).toISOString(), enc: enc, size_bytes: size }], 'resolution=merge-duplicates,return=minimal').then(function () { res.pushed++; });
            }).catch(function (e) { res.errors.push(k + ': ' + e.message); });
          }
          return rest('cv_documents?select=enc,updated_at&doc_key=eq.' + encodeURIComponent(k), 'GET').then(function (rows) {
            if (!rows || !rows.length) return;
            return decrypt(rows[0].enc, key, 'canvio:v1:' + k).then(function (rec) {
              if (!rec || rec.key !== k) throw new Error('bản ghi không khớp khóa');
              if (l && l.state !== undefined) { var v = (Array.isArray(rec.versions) ? rec.versions : []).filter(function (x) { return x && x.pinned; }).slice(-20).concat((Array.isArray(rec.versions) ? rec.versions : []).filter(function (x) { return x && !x.pinned; }).slice(-2)); v.push({ savedAt: l.savedAt, reason: 'trước-khi-đồng-bộ', state: l.state }); rec.versions = v; res.kept++; }
              return vault.put(rec).then(function () { res.pulled++; });
            });
          }).catch(function (e) { res.errors.push(k + ': ' + e.message); });
        });
      });
      return chain.then(function () { return syncUnits(res, remoteAll); });
    }).then(function () { last = new Date().toISOString(); return res; });
  }
  return { cfg: cfg, setCfg: setCfg, session: session, signUp: signUp, signIn: signIn, signOut: signOut, unlock: unlock, sync: sync, exportKey: exportKey, importKey: importKey, isUnlocked: function () { return !!key; }, lastSync: function () { return last; }, _encrypt: encrypt, _decrypt: decrypt, _deriveKey: deriveKey };
}
var api = { version: '130.1.0', create: create, schemaSql: SCHEMA_SQL, okUrl: okUrl };
window.CVCloudP130 = api;
if (typeof document === 'undefined' || !document.getElementById) return;
/* ---- Giao diện trong trang "Dự án của tôi" ---- */
function idbVault() {
  function open() { return new Promise(function (ok, no) { var q = indexedDB.open('CANVIO_PROJECT_VAULT_18_7', 1); q.onupgradeneeded = function () { if (!q.result.objectStoreNames.contains('documents')) q.result.createObjectStore('documents', { keyPath: 'key' }); }; q.onsuccess = function () { ok(q.result); }; q.onerror = function () { no(q.error); }; }); }
  return {
    list: function () { var p = window.CANVIOPersistentProjects; return p && p.list ? p.list() : open().then(function (d) { return new Promise(function (ok, no) { var r = d.transaction('documents').objectStore('documents').getAll(); r.onsuccess = function () { ok(r.result || []); }; r.onerror = function () { no(r.error); }; }); }); },
    put: function (rec) { return open().then(function (d) { return new Promise(function (ok, no) { var tx = d.transaction('documents', 'readwrite'); tx.objectStore('documents').put(rec); tx.oncomplete = ok; tx.onerror = tx.onabort = function () { no(tx.error); }; }); }); }
  };
}
var client = null, timer = null, OPT = 'canvio.p130.opt';
function opt() { try { return Object.assign({ extra: true, secrets: false }, JSON.parse(localStorage.getItem(OPT) || '{}')); } catch (e) { return { extra: true, secrets: false }; } }
var SKIP = /^(canvio\.p130|canvio_selftest|canvio16:|canvio10:rail|canvio18:google-font-catalog|canvio18\.7:(last|autoOpen)|canvio13\.autorestore|canvio5:media_video_project_v1$)/, SECRET = /key|token|secret|session|password/i;
function lsGet(lk) { try { if (lk.indexOf('canvio5:') === 0 && window.LS) return window.LS.get(lk.slice(8), undefined); var raw = localStorage.getItem(lk); if (raw == null) return undefined; try { return JSON.parse(raw); } catch (e) { return { __raw: raw }; } } catch (e) { return undefined; } }
function lsSet(lk, v) { if (lk.indexOf('canvio5:') === 0 && window.LS) return window.LS.set(lk.slice(8), v); localStorage.setItem(lk, v && v.__raw !== undefined ? v.__raw : JSON.stringify(v)); }
function tOf(o) { var t = o && (o.updatedAt || o.savedAt || o.at || o.modified); t = typeof t === 'number' ? t : Date.parse(t); return isFinite(t) ? t : 0; }
function isColl(v) { return Array.isArray(v) && v.length && v.every(function (x) { return x && typeof x === 'object' && !Array.isArray(x) && (typeof x.id === 'string' || typeof x.id === 'number'); }); }
function localUnits() {
  var o = opt(); if (!o.extra) return null; var out = {}, i, lk, v;
  for (i = 0; i < localStorage.length; i++) { lk = localStorage.key(i); if (!/^canvio/.test(lk) || SKIP.test(lk) || (!o.secrets && SECRET.test(lk))) continue; v = lsGet(lk); if (v === undefined || v === null) continue;
    if (isColl(v)) v.forEach(function (it) { out['x:i|' + lk + '|' + it.id] = { value: it, time: tOf(it) }; }); else out['x:k|' + lk] = { value: v, time: 0 }; }
  return out;
}
var applyChain = Promise.resolve();
function applyUnit(dk, val) { return applyChain = applyChain.then(function () { var p = dk.split('|'); if (p[0] === 'x:k') { lsSet(p[1], val); return; } var arr = lsGet(p[1]); arr = Array.isArray(arr) ? arr.slice() : []; var idx = -1; arr.forEach(function (x, n) { if (x && String(x.id) === p.slice(2).join('|')) idx = n; }); if (idx >= 0) arr[idx] = val; else arr.push(val); lsSet(p[1], arr); }); }
function getClient() { if (!client) { client = create({ storage: window.localStorage, vault: idbVault(), localUnits: localUnits, applyUnit: applyUnit }); api.client = client; } return client; }
function mount() {
  var page = document.getElementById('page-projectVault'); if (!page || page.querySelector('#cv130-card')) return !!(page && page.querySelector('#cv130-card'));
  var c = getClient(), card = document.createElement('div'); card.className = 'card'; card.id = 'cv130-card'; card.style.cssText = 'margin:0 0 14px;padding:14px';
  card.innerHTML = '<h3 style="margin:0 0 4px">Đồng bộ đám mây (Supabase, mã hóa)</h3><p class="tiny" style="margin:0 0 10px">Dự án được mã hóa bằng cụm mật khẩu của bạn ngay trên máy; Supabase chỉ lưu bản mã. Quên cụm mật khẩu và mất tệp khóa dự phòng thì không khôi phục được.</p>'
    + '<div id="cv130-setup" style="display:grid;gap:6px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))"><input class="input" id="cv130-url" placeholder="https://xxxx.supabase.co" aria-label="Địa chỉ Supabase" spellcheck="false"><input class="input" id="cv130-anon" placeholder="Khóa anon / publishable" aria-label="Khóa anon" spellcheck="false"><input class="input" id="cv130-email" type="email" placeholder="Email" aria-label="Email" autocomplete="username"><input class="input" id="cv130-pw" type="password" placeholder="Mật khẩu đăng nhập" aria-label="Mật khẩu đăng nhập" autocomplete="current-password"></div>'
    + '<div class="row" style="gap:6px;margin-top:8px;flex-wrap:wrap"><button class="btn btn-soft sm" id="cv130-in" type="button">Đăng nhập</button><button class="btn btn-ghost sm" id="cv130-up" type="button">Tạo tài khoản</button><button class="btn btn-ghost sm" id="cv130-out" type="button">Đăng xuất</button><button class="btn btn-ghost sm" id="cv130-sql" type="button">Sao chép SQL thiết lập</button></div>'
    + '<div class="row" style="gap:6px;margin-top:8px;flex-wrap:wrap"><input class="input" id="cv130-pass" type="password" placeholder="Cụm mật khẩu mã hóa (≥ 8 ký tự)" aria-label="Cụm mật khẩu mã hóa" autocomplete="new-password" style="min-width:240px"><button class="btn btn-soft sm" id="cv130-unlock" type="button">Mở khóa</button><button class="btn sm" id="cv130-sync" type="button">Đồng bộ ngay</button><button class="btn btn-ghost sm" id="cv130-key" type="button">Tải khóa dự phòng</button></div>'
    + '<div style="display:grid;gap:4px;margin-top:8px"><label class="tiny" style="display:inline-flex;gap:6px;align-items:center"><input type="checkbox" id="cv130-extra"> Gồm cả tài nguyên, ghi chú, thương hiệu, cài đặt và dữ liệu quan trọng khác (chỉ thêm/cập nhật, không đồng bộ việc xóa)</label><label class="tiny" style="display:inline-flex;gap:6px;align-items:center"><input type="checkbox" id="cv130-secrets"> Gồm cả khóa API/mã truy cập đã lưu trong CANVIO (vẫn được mã hóa; mặc định tắt)</label></div><label class="tiny" style="display:inline-flex;gap:6px;align-items:center;margin-top:8px"><input type="checkbox" id="cv130-auto"> Tự đồng bộ mỗi 2 phút khi đã mở khóa</label><div class="tiny" id="cv130-st" role="status" aria-live="polite" style="margin-top:8px"></div>';
  var host = page.querySelector('.pageHead, .head, h1, h2'); if (host && host.parentNode) host.parentNode.insertBefore(card, host.nextSibling); else page.insertBefore(card, page.firstChild);
  var $ = function (s) { return card.querySelector(s); }, st = $('#cv130-st');
  function say(t, bad) { st.textContent = t; st.style.color = bad ? '#b4233b' : ''; }
  function refreshState() { var s = c.session(), cf = c.cfg(); $('#cv130-url').value = cf.url || ''; $('#cv130-anon').value = cf.anon || ''; if (s) { $('#cv130-email').value = (s.user && s.user.email) || ''; say('Đã đăng nhập: ' + ((s.user && s.user.email) || '') + (c.isUnlocked() ? ' · đã mở khóa mã hóa' : ' · nhập cụm mật khẩu và bấm Mở khóa')); } else say('Chưa đăng nhập. Nhập địa chỉ + khóa anon từ Supabase → Project Settings → API.'); }
  function run(btn, fn) { btn.disabled = true; return Promise.resolve().then(fn).catch(function (e) { say(String(e && e.message || e), true); }).then(function () { btn.disabled = false; }); }
  function conf() { c.setCfg($('#cv130-url').value, $('#cv130-anon').value); }
  $('#cv130-in').addEventListener('click', function () { run(this, function () { conf(); return c.signIn($('#cv130-email').value.trim(), $('#cv130-pw').value).then(function () { $('#cv130-pw').value = ''; refreshState(); }); }); });
  $('#cv130-up').addEventListener('click', function () { run(this, function () { conf(); return c.signUp($('#cv130-email').value.trim(), $('#cv130-pw').value).then(function (r) { $('#cv130-pw').value = ''; if (r.needConfirm) say('Đã tạo tài khoản. Mở email xác nhận rồi bấm Đăng nhập (hoặc tắt "Confirm email" trong Supabase → Authentication).'); else refreshState(); }); }); });
  $('#cv130-out').addEventListener('click', function () { run(this, function () { return c.signOut().then(refreshState); }); });
  $('#cv130-sql').addEventListener('click', function () { var t = api.schemaSql; try { navigator.clipboard.writeText(t).then(function () { say('Đã sao chép SQL. Dán vào Supabase → SQL Editor → Run (chỉ cần làm một lần).'); }, function () { say('Không sao chép được. Mở tệp supabase/canvio-schema.sql trong kho mã.', true); }); } catch (e) { say('Không sao chép được. Mở tệp supabase/canvio-schema.sql.', true); } });
  $('#cv130-unlock').addEventListener('click', function () { run(this, function () { return c.unlock($('#cv130-pass').value).then(function (r) { $('#cv130-pass').value = ''; refreshState(); if (r.created) say('Đã tạo khóa mã hóa mới. Hãy bấm "Tải khóa dự phòng" và cất tệp ở nơi an toàn.'); }); }); });
  $('#cv130-sync').addEventListener('click', function () { run(this, function () { say('Đang đồng bộ…'); return c.sync().then(function (r) { try { if (window.CANVIOPersistentProjects && CANVIOPersistentProjects.render) CANVIOPersistentProjects.render(); if (window.CV && CV.assets && CV.assets.render) CV.assets.render(); } catch (e) {} say('Xong: gửi lên ' + r.pushed + ', tải về ' + r.pulled + ', đã giống nhau ' + r.same + (r.kept ? ', giữ lại ' + r.kept + ' bản cục bộ cũ' : '') + (r.skipped.length ? ', bỏ qua ' + r.skipped.length : '') + (r.errors.length ? '. Lỗi: ' + r.errors[0] : '.') + (r.pulled ? ' Tải lại trang để áp dụng dữ liệu mới.' : ''), r.errors.length > 0); }); }); });
  $('#cv130-key').addEventListener('click', function () { run(this, function () { return c.exportKey().then(function (o) { var b = new Blob([JSON.stringify(o, null, 1)], { type: 'application/json' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'canvio-khoa-du-phong.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500); say('Đã tải khóa dự phòng. Cất kín, không chia sẻ.'); }); }); });
  $('#cv130-auto').addEventListener('change', function () { if (timer) { clearInterval(timer); timer = null; } if (this.checked) { timer = setInterval(function () { if (c.isUnlocked()) c.sync().then(function () { try { CANVIOPersistentProjects.render(); } catch (e) {} }).catch(function () {}); }, 120000); say('Đã bật tự đồng bộ (khi đang mở khóa).'); } });
  function saveOpt() { try { localStorage.setItem(OPT, JSON.stringify({ extra: $('#cv130-extra').checked, secrets: $('#cv130-secrets').checked })); } catch (e) {} }
  $('#cv130-extra').checked = opt().extra; $('#cv130-secrets').checked = opt().secrets; $('#cv130-extra').addEventListener('change', saveOpt); $('#cv130-secrets').addEventListener('change', saveOpt);
  refreshState(); return true;
}
function ready() { try { if (!mount() && window.MutationObserver) { var mo = new MutationObserver(function () { if (mount()) mo.disconnect(); }); mo.observe(document.body, { childList: true, subtree: true }); setTimeout(function () { mo.disconnect(); }, 30000); } } catch (e) {} }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true }); else ready();
})();
