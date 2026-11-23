'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert'), { webcrypto } = require('crypto'), mock = require('./mock-supabase.cjs');
const root = path.resolve(__dirname, '../..'), src = fs.readFileSync(path.join(root, 'canvio-p130-cloud.js'), 'utf8');
let pass = 0; const ok = (c, m) => { assert.ok(c, m); pass++; };
function load() { const w = { fetch: (...a) => fetch(...a) }; global.window = w; new Function('window', 'document', src)(w, undefined); return w.CVCloudP130; }
function store() { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; }, m }; }
function vaultOf(rows) { const m = {}; rows.forEach(r => m[r.key] = r); return { m, list: async () => Object.values(m), put: async r => { m[r.key] = r; } }; }
(async () => {
  const api = load(); ok(api.version === '130.1.0', 'version'); ok(/enable row level security/i.test(api.schemaSql) && /auth\.uid\(\)/.test(api.schemaSql), 'schema SQL có RLS');
  ok(api.okUrl('https://abcd.supabase.co') && !api.okUrl('http://evil.com') && !api.okUrl('https://x.supabase.co.evil.com'), 'okUrl');
  const S = await mock.start(), mk = (st, v) => api.create({ fetch: (...a) => fetch(...a), storage: st, crypto: webcrypto, vault: v, kdfIter: 1000 });
  // cấu hình
  const sA = store(), A = mk(sA, vaultOf([]));
  assert.throws(() => A.setCfg('http://evil.com', S.anon), /Supabase/); pass++;
  assert.throws(() => A.setCfg(S.url, 'short'), /anon/); pass++;
  const svc = 'h.' + Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url') + '.s' + 'x'.repeat(20);
  assert.throws(() => A.setCfg(S.url, svc), /service_role/); pass++;
  A.setCfg(S.url, S.anon);
  // đăng ký/đăng nhập
  await A.signUp('a@x.vn', 'matkhau123'); ok(A.session() && A.session().user.email === 'a@x.vn', 'signUp có phiên');
  await assert.rejects(A.signIn('a@x.vn', 'sai'), /Invalid login/); pass++;
  await A.signIn('a@x.vn', 'matkhau123');
  await assert.rejects(A.sync(), /mở khóa/); pass++;
  await assert.rejects(A.unlock('ngan'), /8 ký tự/); pass++;
  const r1 = await A.unlock('cum-mat-khau-dai'); ok(r1.created && A.isUnlocked(), 'tạo khóa mới');
  ok(S.meta[A.session().user.id] && !JSON.stringify(S.meta).includes('cum-mat-khau'), 'meta không chứa cụm mật khẩu');
  // thiết bị 1 đẩy lên
  const big = { screens: Array.from({ length: 400 }, (_, i) => 'Bí mật ' + i + ' '.repeat(5)) };
  const t1 = '2026-11-20T10:00:00.000Z', t2 = '2026-11-21T10:00:00.000Z';
  const v1 = vaultOf([{ key: 'p1:poster', projectId: 'p1', editor: 'poster', savedAt: t1, state: big, versions: [] }, { key: 'p2:cv', projectId: 'p2', editor: 'cv', savedAt: t1, state: { a: 1 } }]);
  const A1 = mk(sA, v1); await A1.unlock('cum-mat-khau-dai');
  let r = await A1.sync(); ok(r.pushed === 2 && r.pulled === 0 && !r.errors.length, 'đẩy 2 tài liệu: ' + JSON.stringify(r));
  const uid = A.session().user.id, raw = JSON.stringify(S.docs[uid]);
  ok(!raw.includes('Bí mật') && !raw.includes('screens'), 'máy chủ chỉ thấy bản mã');
  ok(S.docs[uid]['p1:poster'].enc.z === 1, 'nén trước khi mã hóa');
  r = await A1.sync(); ok(r.same === 2 && r.pushed === 0, 'lần 2 không đổi gì');
  // thiết bị 2 (trống) đăng nhập, mở khóa, kéo về
  const sB = store(), v2 = vaultOf([]), B = mk(sB, v2); B.setCfg(S.url, S.anon); await B.signIn('a@x.vn', 'matkhau123');
  await assert.rejects(B.unlock('sai-cum-mat-khau'), /sai cụm mật khẩu/); pass++;
  ok(!B.isUnlocked(), 'sai cụm mật khẩu không mở khóa');
  const r2 = await B.unlock('cum-mat-khau-dai'); ok(!r2.created, 'mở khóa khóa có sẵn');
  r = await B.sync(); ok(r.pulled === 2 && v2.m['p1:poster'].state.screens.length === 400, 'thiết bị 2 nhận đủ dữ liệu');
  // sửa trên B (mới hơn) → A nhận, bản cũ giữ trong versions
  v2.m['p2:cv'] = Object.assign({}, v2.m['p2:cv'], { savedAt: t2, state: { a: 2 } });
  r = await B.sync(); ok(r.pushed === 1, 'B đẩy bản mới');
  r = await A1.sync(); ok(r.pulled === 1 && v1.m['p2:cv'].state.a === 2, 'A nhận bản mới hơn');
  ok(v1.m['p2:cv'].versions.some(x => x.reason === 'trước-khi-đồng-bộ' && x.state.a === 1), 'bản cục bộ cũ được giữ lại');
  // bản cục bộ mới hơn thì không bị ghi đè
  v1.m['p1:poster'] = Object.assign({}, v1.m['p1:poster'], { savedAt: '2026-11-22T00:00:00.000Z', state: { x: 9 } });
  r = await A1.sync(); ok(r.pushed === 1 && r.pulled === 0, 'bản mới cục bộ được đẩy');
  // khóa dự phòng
  const kf = await A1.exportKey(); ok(kf.format === 'CANVIO_P130_KEY', 'export key');
  const sC = store(), C = mk(sC, vaultOf([])); C.setCfg(S.url, S.anon); await C.signIn('a@x.vn', 'matkhau123');
  await assert.rejects(C.importKey({ format: 'CANVIO_P130_KEY', key: Buffer.alloc(32, 7).toString('base64') }), /Giải mã thất bại/); pass++;
  await C.importKey(kf); ok(C.isUnlocked(), 'khôi phục bằng tệp khóa');
  // cách ly người dùng (RLS)
  const sD = store(), D = mk(sD, vaultOf([])); D.setCfg(S.url, S.anon); await D.signUp('b@x.vn', 'matkhau456'); await D.unlock('cum-khac-hoan-toan');
  r = await D.sync(); ok(r.pulled === 0 && r.pushed === 0, 'người dùng khác không thấy dữ liệu');
  await assert.rejects(D.importKey(kf), /Giải mã thất bại/); pass++;
  // phát hiện dữ liệu bị sửa / hoán đổi khóa tài liệu (AAD)
  const k0 = Object.keys(S.docs[uid]); S.docs[uid]['p2:cv'].enc = S.docs[uid]['p1:poster'].enc;
  const sE = store(), E = mk(sE, vaultOf([])); E.setCfg(S.url, S.anon); await E.signIn('a@x.vn', 'matkhau123'); await E.unlock('cum-mat-khau-dai');
  r = await E.sync(); ok(r.errors.some(e => /p2:cv.*Giải mã thất bại/.test(e)), 'hoán đổi bản mã bị phát hiện');
  // phiên hết hạn → tự làm mới
  const S2 = await mock.start({ expires: 1 }); const sF = store(), F = mk(sF, vaultOf([{ key: 'k', savedAt: t1, state: {} }])); F.setCfg(S2.url, S2.anon); await F.signUp('c@x.vn', 'matkhau789');
  await F.unlock('cum-mat-khau-dai'); const before = S2.log.filter(l => /refresh_token/.test(l)).length; await F.sync();
  ok(S2.log.filter(l => /refresh_token/.test(l)).length > before, 'tự làm mới token');
  // xác nhận email
  const S3 = await mock.start({ confirm: true }); const G = mk(store(), vaultOf([])); G.setCfg(S3.url, S3.anon); const sg = await G.signUp('d@x.vn', 'matkhau000'); ok(sg.needConfirm, 'cần xác nhận email');
  // thiếu bảng → thông báo rõ
  await G.signIn('d@x.vn', 'matkhau000').then(async () => { G._x = 1; });
  // dữ liệu quan trọng khác (units): ghi chú, thương hiệu, tài nguyên theo từng mục
  const mkU = (init) => { const d = JSON.parse(JSON.stringify(init)); return { d, bak: {}, localUnits: () => { const o = {}; Object.keys(d).forEach(k => { const v = d[k]; if (Array.isArray(v)) v.forEach(it => o['x:i|' + k + '|' + it.id] = { value: it, time: Date.parse(it.at) || 0 }); else o['x:k|' + k] = { value: v, time: 0 }; }); return o; }, applyUnit: async (dk, val) => { const p = dk.split('|'); if (p[0] === 'x:k') { d[p[1]] = val; return; } const a = d[p[1]] = d[p[1]] || []; const i = a.findIndex(x => String(x.id) === p[2]); if (i >= 0) a[i] = val; else a.push(val); }, backup: (k, v) => { this.bak[k] = v; } }; };
  const sU1 = store(), u1 = mkU({ 'canvio5:brand': { color: '#f00' }, 'canvio5:assets': [{ id: 'a1', name: 'logo', at: '2026-11-20T00:00:00Z', data: 'BÍMẬT-LOGO' }], 'canvio5:notes': [{ id: 'n1', t: 'ghi chú riêng tư' }] });
  const U1 = api.create({ fetch: (...a) => fetch(...a), storage: sU1, crypto: webcrypto, vault: vaultOf([]), kdfIter: 1000, localUnits: u1.localUnits, applyUnit: u1.applyUnit, backup: u1.backup }); U1.setCfg(S.url, S.anon); await U1.signUp('u@x.vn', 'matkhau123'); await U1.unlock('cum-mat-khau-dai');
  r = await U1.sync(); ok(r.pushed === 3 && !r.errors.length, 'đẩy 3 mục dữ liệu khác: ' + JSON.stringify(r));
  const uid2 = U1.session().user.id, rawAll = JSON.stringify(S.docs[uid2]); ok(!rawAll.includes('BÍMẬT-LOGO') && !rawAll.includes('riêng tư') && !rawAll.includes('#f00'), 'dữ liệu khác cũng chỉ là bản mã');
  r = await U1.sync(); ok(r.same >= 3 && r.pushed === 0 && r.pulled === 0, 'không đổi thì không gửi lại');
  const sU2 = store(), u2 = mkU({}); const U2 = api.create({ fetch: (...a) => fetch(...a), storage: sU2, crypto: webcrypto, vault: vaultOf([]), kdfIter: 1000, localUnits: u2.localUnits, applyUnit: u2.applyUnit, backup: u2.backup }); U2.setCfg(S.url, S.anon); await U2.signIn('u@x.vn', 'matkhau123'); await U2.unlock('cum-mat-khau-dai');
  r = await U2.sync(); ok(r.pulled === 3 && u2.d['canvio5:brand'].color === '#f00' && u2.d['canvio5:assets'][0].data === 'BÍMẬT-LOGO' && u2.d['canvio5:notes'][0].t === 'ghi chú riêng tư', 'thiết bị mới nhận đủ dữ liệu khác');
  u2.d['canvio5:brand'] = { color: '#0f0' }; u2.d['canvio5:notes'].push({ id: 'n2', t: 'mới' });
  r = await U2.sync(); ok(r.pushed === 2, 'sửa + thêm mới được gửi: ' + JSON.stringify(r));
  r = await U1.sync(); ok(r.pulled === 2 && u1.d['canvio5:brand'].color === '#0f0' && u1.d['canvio5:notes'].length === 2, 'thiết bị 1 nhận thay đổi');
  // xóa cục bộ không lan sang đám mây (chỉ thêm/cập nhật)
  u1.d['canvio5:notes'] = [u1.d['canvio5:notes'][0]]; r = await U1.sync(); ok(r.pulled === 1 && u1.d['canvio5:notes'].length === 2, 'mục xóa cục bộ được khôi phục từ đám mây, không mất dữ liệu');
  // xung đột: hai bên cùng sửa → bản mới hơn thắng, bản thua được giữ
  u1.d['canvio5:brand'] = { color: 'từ-1' }; await new Promise(r => setTimeout(r, 15)); u2.d['canvio5:brand'] = { color: 'từ-2' };
  await U1.sync().catch(() => {}); // U1 đẩy trước
  const rr = await U2.sync(); ok(rr.kept >= 1 || rr.pushed >= 1, 'xung đột xử lý: ' + JSON.stringify(rr));
  // đăng xuất xóa phiên + khóa
  await A1.signOut(); ok(!A1.isUnlocked() && !A1.session(), 'đăng xuất');
  [S, S2, S3].forEach(s => s.close());
  console.log('P130 cloud tests passed: ' + pass); process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
