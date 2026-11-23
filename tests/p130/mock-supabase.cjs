'use strict';
// Máy chủ Supabase giả (GoTrue + PostgREST tối thiểu, có RLS theo user) để kiểm thử P130.
const http = require('http');
function b64u(o) { return Buffer.from(JSON.stringify(o)).toString('base64url'); }
function start(opt) {
  opt = opt || {};
  const ANON = 'anon-' + 'x'.repeat(30), users = {}, tokens = {}, refresh = {}, meta = {}, docs = {}, log = [];
  let n = 0;
  const srv = http.createServer((req, res) => {
    let body = ''; req.on('data', d => body += d); req.on('end', () => {
      const u = new URL(req.url, 'http://x'), j = body ? JSON.parse(body) : null;
      const send = (c, o) => { res.writeHead(c, { 'content-type': 'application/json' }); res.end(o == null ? '' : JSON.stringify(o)); };
      log.push(req.method + ' ' + u.pathname + u.search);
      if (req.headers.apikey !== ANON) return send(401, { message: 'No API key' });
      const mkSession = (usr) => { const t = 'at' + (++n), r = 'rt' + n; tokens[t] = usr.id; refresh[r] = usr.id; return { access_token: t, refresh_token: r, expires_in: opt.expires || 3600, user: { id: usr.id, email: usr.email } }; };
      if (u.pathname === '/auth/v1/signup') { if (users[j.email]) return send(422, { msg: 'User already registered' }); const usr = users[j.email] = { id: 'u' + (++n), email: j.email, pw: j.password }; return opt.confirm ? send(200, { id: usr.id, email: usr.email }) : send(200, mkSession(usr)); }
      if (u.pathname === '/auth/v1/token') { const g = u.searchParams.get('grant_type'); if (g === 'password') { const usr = users[j.email]; if (!usr || usr.pw !== j.password) return send(400, { error_description: 'Invalid login credentials' }); return send(200, mkSession(usr)); } if (g === 'refresh_token') { const id = refresh[j.refresh_token]; if (!id) return send(400, { error_description: 'Invalid Refresh Token' }); const usr = Object.values(users).find(x => x.id === id); return send(200, mkSession(usr)); } }
      if (u.pathname === '/auth/v1/logout') return send(204, null);
      const m = (req.headers.authorization || '').match(/^Bearer (.+)$/), uid = m && tokens[m[1]];
      if (!uid) return send(401, { message: 'JWT expired or anon' }); // RLS: anon không có quyền
      if (u.pathname === '/rest/v1/cv_meta') {
        if (req.method === 'GET') return send(200, meta[uid] ? [meta[uid]] : []);
        if (req.method === 'POST') { if (meta[uid]) return send(409, { message: 'duplicate' }); meta[uid] = j; return send(201, null); }
      }
      if (u.pathname === '/rest/v1/cv_documents') {
        const mine = docs[uid] = docs[uid] || {};
        if (req.method === 'GET') { let rows = Object.keys(mine).map(k => Object.assign({ doc_key: k }, mine[k])); const f = u.searchParams.get('doc_key'); if (f) rows = rows.filter(r => 'eq.' + r.doc_key === f); const sel = (u.searchParams.get('select') || '*').split(','); return send(200, rows.map(r => sel[0] === '*' ? r : Object.fromEntries(sel.map(s => [s, r[s]])))); }
        if (req.method === 'POST') { if (u.searchParams.get('on_conflict') !== 'user_id,doc_key') return send(400, { message: 'on_conflict required' }); if ((req.headers.prefer || '').indexOf('merge-duplicates') < 0) return send(409, { message: 'dup' }); j.forEach(r => { mine[r.doc_key] = { updated_at: r.updated_at, enc: r.enc, size_bytes: r.size_bytes }; }); return send(201, null); }
      }
      send(404, { message: 'relation does not exist' });
    });
  });
  return new Promise(ok => srv.listen(0, '127.0.0.1', () => ok({ url: 'http://127.0.0.1:' + srv.address().port, anon: ANON, users, tokens, refresh, meta, docs, log, close: () => srv.close() })));
}
module.exports = { start };
