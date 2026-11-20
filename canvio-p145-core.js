/* P145 core (thêm mới, không sửa kho cũ): manifest giấy phép + credit + cổng chất lượng (P145.1/.9), liên kết nhạc + cue sheet (P145.4b),
   kiểm font tiếng Việt (P141/P145.7), data merge CSV (P137), xuất JSONL phong cách (P128.3).
   Không tải/ghi âm nhạc; link nhạc chỉ là ghi chú + cue sheet. Chế độ mặc định: dùng cá nhân (không chặn); công tắc "đăng công khai" siết cảnh báo. */
(function () {
'use strict';
if (window.CVContentCoreP145) return;
var LIC = {
  'cc0': { label: 'CC0', attr: false, commercial: true, share: false },
  'mit': { label: 'MIT / ISC', attr: true, commercial: true, share: false },
  'apache-2.0': { label: 'Apache-2.0', attr: true, commercial: true, share: false },
  'ofl': { label: 'SIL OFL (font)', attr: false, commercial: true, share: false },
  'cc-by': { label: 'CC-BY', attr: true, commercial: true, share: false },
  'cc-by-sa': { label: 'CC-BY-SA', attr: true, commercial: true, share: true },
  'cc-by-nc': { label: 'CC-BY-NC', attr: true, commercial: false, share: false },
  'site-free': { label: 'Giấy phép kho miễn phí (Pexels/Pixabay/Unsplash...)', attr: false, commercial: true, share: false },
  'own': { label: 'Tự tạo / của tôi', attr: false, commercial: true, share: false },
  'personal': { label: 'Chỉ dùng cá nhân', attr: false, commercial: false, share: false },
  'unknown': { label: 'Chưa rõ', attr: false, commercial: false, share: false }
};
var KEY_META = 'canvio145:meta', KEY_MUSIC = 'canvio145:music', KEY_PUB = 'canvio145:public';
function lsGet(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function safeUrl(u) { try { var x = new URL(String(u || '').trim()); return x.protocol === 'https:' || x.protocol === 'http:' ? x.href : ''; } catch (e) { return ''; } }
/* ---- P145.1 license report ---- */
function licenseReport(assets, meta, publicMode) {
  meta = meta || {};
  var rows = (assets || []).map(function (a) {
    var m = meta[a.id] || {}, lid = LIC[m.license] ? m.license : 'unknown', L = LIC[lid], issues = [];
    if (lid === 'unknown') issues.push('chưa rõ giấy phép');
    if (L.attr && !(m.author || m.source)) issues.push('cần ghi nguồn/tác giả');
    if (publicMode && !L.commercial) issues.push('không dùng được khi đăng công khai/kiếm tiền');
    if (publicMode && L.share) issues.push('CC-BY-SA: sản phẩm dẫn xuất phải chia sẻ cùng giấy phép');
    var level = !issues.length ? 'ok' : (publicMode && (!L.commercial) ? 'block' : 'warn');
    return { id: a.id, name: a.name || a.id, license: lid, licenseLabel: L.label, source: m.source || '', author: m.author || '', url: safeUrl(m.url), needsCredit: !!L.attr, level: level, issues: issues };
  });
  return { rows: rows, counts: rows.reduce(function (c, r) { c[r.level]++; return c; }, { ok: 0, warn: 0, block: 0 }), publicMode: !!publicMode };
}
function creditLines(report) {
  return report.rows.filter(function (r) { return r.needsCredit; }).map(function (r) { return '"' + r.name + '"' + (r.author ? ' — ' + r.author : '') + (r.source ? ' (' + r.source + ')' : '') + ' · ' + r.licenseLabel + (r.url ? ' · ' + r.url : ''); });
}
function reportText(report) {
  var out = ['BÁO CÁO GIẤY PHÉP · chế độ ' + (report.publicMode ? 'ĐĂNG CÔNG KHAI/KIẾM TIỀN' : 'DÙNG CÁ NHÂN'), 'OK ' + report.counts.ok + ' · Cảnh báo ' + report.counts.warn + ' · Chặn ' + report.counts.block, ''];
  report.rows.forEach(function (r) { out.push((r.level === 'ok' ? '[OK] ' : r.level === 'warn' ? '[!] ' : '[X] ') + r.name + ' — ' + r.licenseLabel + (r.issues.length ? ' — ' + r.issues.join('; ') : '')); });
  var c = creditLines(report); if (c.length) { out.push('', 'CREDIT (dán vào mô tả khi đăng):'); out = out.concat(c); }
  return out.join('\n');
}
/* ---- P145.9 quality gate ---- */
function qualityGate(asset, meta, seenHashes) {
  var m = meta || {}, issues = [], a = asset || {};
  if (!LIC[m.license] || m.license === 'unknown') issues.push('thiếu giấy phép');
  if (!m.source && !m.author && m.license !== 'own') issues.push('thiếu nguồn');
  if (!a.name) issues.push('thiếu tên');
  if (a.size != null && !(a.size > 0)) issues.push('tệp rỗng');
  if (a.size > 25 * 1048576) issues.push('tệp quá lớn (>25 MB)');
  if (a.hash && seenHashes && seenHashes.indexOf(a.hash) >= 0) issues.push('trùng nội dung');
  return { pass: !issues.length, issues: issues };
}
function sha256Hex(str) {
  if (!window.crypto || !crypto.subtle) return Promise.resolve('');
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(str))).then(function (b) { return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); });
}
/* ---- P145.4b music links (note + cue sheet only) ---- */
function parseMusicLink(u) {
  var url = safeUrl(u); if (!url) return null;
  var h = new URL(url).hostname.replace(/^www\./, ''), p = 'other', embed = false;
  if (/(^|\.)youtube\.com$|^youtu\.be$/.test(h)) { p = h === 'music.youtube.com' ? 'youtube-music' : 'youtube'; embed = true; }
  else if (/(^|\.)soundcloud\.com$/.test(h)) { p = 'soundcloud'; embed = true; }
  else if (/(^|\.)spotify\.com$/.test(h)) { p = 'spotify'; embed = true; }
  else if (/(^|\.)bandcamp\.com$/.test(h)) p = 'bandcamp';
  return { url: url, platform: p, embedSupported: embed, note: embed ? 'Nghe thử cần mạng, có thể bị trình duyệt chặn tự phát; xuất video KHÔNG chứa tiếng từ link.' : 'Mở tab mới để nghe; xuất video không chứa tiếng từ link.' };
}
function normMusic(t) {
  var l = parseMusicLink(t && t.url); if (!l) return null;
  var num = function (v, d) { v = Number(v); return isFinite(v) && v >= 0 ? v : d; }, s = num(t.start, 0), e = num(t.end, s + 30);
  return { id: t.id || 'mu' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), url: l.url, platform: l.platform, title: String(t.title || '').slice(0, 120), artist: String(t.artist || '').slice(0, 120), bpm: num(t.bpm, 0), start: s, end: Math.max(s, e), videoAt: num(t.videoAt, 0), note: String(t.note || '').slice(0, 200) };
}
function tc(sec) { sec = Math.max(0, Number(sec) || 0); var m = Math.floor(sec / 60), s = Math.floor(sec % 60); return ('0' + m).slice(-2) + ':' + ('0' + s).slice(-2); }
function cueSheet(tracks) {
  var t = (tracks || []).map(normMusic).filter(Boolean).sort(function (a, b) { return a.videoAt - b.videoAt; });
  var lines = ['CUE SHEET (thêm nhạc bằng thư viện của nền tảng đăng: TikTok, Reels, Shorts, CapCut)', 'Video xuất không chứa tiếng từ các liên kết này.', ''];
  t.forEach(function (x, i) { lines.push((i + 1) + '. Video ' + tc(x.videoAt) + ' → ' + (x.title || 'Không tên') + (x.artist ? ' — ' + x.artist : '') + ' · đoạn ' + tc(x.start) + '–' + tc(x.end) + (x.bpm ? ' · ' + x.bpm + ' BPM' : '') + ' · ' + x.platform + '\n   ' + x.url + (x.note ? '\n   Ghi chú: ' + x.note : '')); });
  return lines.join('\n');
}
/* ---- P141 / P145.7 Vietnamese glyph check ---- */
var VI = 'ăâđêôơưĂÂĐÊÔƠƯàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵÀÁẢÃẠẰẮẲẴẶẦẤẨẪẬÈÉẺẼẸỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌỒỐỔỖỘỜỚỞỠỢÙÚỦŨỤỪỨỬỮỰỲÝỶỸỴ';
function fontVietCoverage(family) {
  var fam = String(family || '').replace(/["'\;{}<>]/g, '').slice(0, 80); if (!fam) return null;
  var c = document.createElement('canvas'); c.width = c.height = 48; var x = c.getContext('2d', { willReadFrequently: true });
  function sig(font, ch) { x.clearRect(0, 0, 48, 48); x.font = font; x.textBaseline = 'top'; x.fillStyle = '#000'; x.fillText(ch, 4, 4); var d = x.getImageData(0, 0, 48, 48).data, s = 0; for (var i = 3; i < d.length; i += 4) s = (s * 31 + d[i]) | 0; return s; }
  var missing = [], chars = Array.from(VI);
  chars.forEach(function (ch) { var a = sig('28px "' + fam + '", serif', ch), b = sig('28px "' + fam + '", sans-serif', ch); if (a !== b) missing.push(ch); });
  return { family: fam, total: chars.length, missing: missing, covered: chars.length - missing.length, ok: missing.length === 0 };
}
/* ---- P137 CSV data merge ---- */
function parseCsv(text, maxRows) {
  var rows = [], row = [], f = '', q = false, s = String(text || '').replace(/^\uFEFF/, ''), i, ch;
  for (i = 0; i < s.length; i++) {
    ch = s[i];
    if (q) { if (ch === '"') { if (s[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',' || ch === ';' || ch === '\t') { row.push(f); f = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && s[i + 1] === '\n') i++; row.push(f); f = ''; if (row.some(function (v) { return v !== ''; })) rows.push(row); row = []; if (rows.length > (maxRows || 2000)) break; }
    else f += ch;
  }
  if (f !== '' || row.length) { row.push(f); if (row.some(function (v) { return v !== ''; })) rows.push(row); }
  if (rows.length < 2) return { headers: rows[0] || [], records: [] };
  var h = rows[0].map(function (v) { return v.trim(); });
  return { headers: h, records: rows.slice(1).map(function (r) { var o = {}; h.forEach(function (k, j) { if (k) o[k] = r[j] == null ? '' : r[j]; }); return o; }) };
}
function mergeTemplate(tpl, records, opts) {
  var html = !(opts && opts.plain), missing = {}, out = (records || []).map(function (rec) { return String(tpl || '').replace(/\{\{\s*([^{}\s]+)\s*\}\}/g, function (m, k) { if (!Object.prototype.hasOwnProperty.call(rec, k)) { missing[k] = 1; return m; } return html ? esc(rec[k]) : String(rec[k]); }); });
  return { outputs: out, missingFields: Object.keys(missing) };
}
/* ---- P128.3 JSONL style dataset ---- */
function toJsonl(pairs, system) {
  return (pairs || []).filter(function (p) { return p && String(p.prompt || '').trim() && String(p.response || '').trim(); }).map(function (p) {
    var m = []; if (system) m.push({ role: 'system', content: String(system) });
    m.push({ role: 'user', content: String(p.prompt) }, { role: 'assistant', content: String(p.response) });
    return JSON.stringify({ messages: m });
  }).join('\n');
}
/* ---- UI ---- */
function dl(name, text, type) { var b = new Blob([text], { type: type || 'text/plain' }), u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000); }
function assetsNow() { try { return window.CV && CV.assets && CV.assets.list ? CV.assets.list() || [] : []; } catch (e) { return []; } }
function mount() {
  var page = document.querySelector('#page-assets'); if (!page || page.querySelector('#cv145-card')) return false;
  var card = document.createElement('div'); card.className = 'card'; card.id = 'cv145-card'; card.style.marginTop = '12px';
  card.innerHTML = '<div class="cardTop"><h3>Content Factory · giấy phép, nhạc, font, dữ liệu (P145)</h3><span class="sub">Mặc định dùng cá nhân: chỉ cảnh báo, không chặn</span></div>' +
    '<div class="row" style="gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px"><b class="tiny">Giấy phép</b><select class="input" id="cv145-asset" style="max-width:220px" aria-label="Tài nguyên"></select><select class="input" id="cv145-lic" style="max-width:220px" aria-label="Giấy phép">' + Object.keys(LIC).map(function (k) { return '<option value="' + k + '">' + LIC[k].label + '</option>'; }).join('') + '</select><input class="input" id="cv145-src" placeholder="Nguồn / tác giả" style="max-width:200px"><button type="button" class="btn btn-soft sm" id="cv145-save">Lưu</button><label class="tiny"><input type="checkbox" id="cv145-pub"> Đăng công khai / kiếm tiền</label><button type="button" class="btn btn-ghost sm" id="cv145-report">Tải báo cáo + credit</button></div>' +
    '<div class="row" style="gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px"><b class="tiny">Nhạc giữ chỗ</b><input class="input" id="cv145-mu-url" placeholder="Dán link YouTube / SoundCloud / Spotify…" style="min-width:220px"><input class="input" id="cv145-mu-title" placeholder="Tên bài" style="max-width:140px"><input class="input" id="cv145-mu-bpm" placeholder="BPM" style="max-width:64px"><input class="input" id="cv145-mu-at" placeholder="Vào ở giây" style="max-width:84px"><button type="button" class="btn btn-soft sm" id="cv145-mu-add">Thêm</button><button type="button" class="btn btn-ghost sm" id="cv145-mu-cue">Tải cue sheet</button></div>' +
    '<div class="row" style="gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px"><b class="tiny">Font tiếng Việt</b><input class="input" id="cv145-font" placeholder="Tên font, ví dụ Be Vietnam Pro" style="max-width:240px"><button type="button" class="btn btn-soft sm" id="cv145-font-run">Kiểm dấu</button></div>' +
    '<div class="row" style="gap:8px;flex-wrap:wrap;align-items:flex-start;margin-bottom:8px"><b class="tiny">Data merge</b><textarea class="input" id="cv145-csv" rows="3" placeholder="CSV: ten,chuc_vu&#10;An,Designer" style="min-width:220px"></textarea><textarea class="input" id="cv145-tpl" rows="3" placeholder="Mẫu HTML: &lt;h2&gt;{{ten}}&lt;/h2&gt;" style="min-width:220px"></textarea><button type="button" class="btn btn-soft sm" id="cv145-merge">Gộp &amp; tải HTML</button></div>' +
    '<div class="tiny" id="cv145-out" role="status" aria-live="polite">Chọn tài nguyên để gắn giấy phép.</div>';
  var tgt = page.querySelector('.card'); tgt && tgt.parentNode ? tgt.parentNode.appendChild(card) : page.appendChild(card);
  var $ = function (s) { return card.querySelector(s); }, out = function (t) { $('#cv145-out').textContent = t; };
  function fill() { var sel = $('#cv145-asset'), keep = sel.value, L = assetsNow(); sel.innerHTML = L.length ? L.map(function (a) { return '<option value="' + esc(a.id) + '">' + esc(a.name || a.id) + '</option>'; }).join('') : '<option value="">(chưa có tài nguyên)</option>'; if (keep) sel.value = keep; sync(); }
  function sync() { var m = lsGet(KEY_META, {})[$('#cv145-asset').value] || {}; $('#cv145-lic').value = LIC[m.license] ? m.license : 'unknown'; $('#cv145-src').value = m.source || m.author || ''; }
  $('#cv145-pub').checked = lsGet(KEY_PUB, '0') === '1';
  $('#cv145-asset').addEventListener('change', sync); $('#cv145-asset').addEventListener('focus', fill);
  $('#cv145-pub').addEventListener('change', function () { lsSet(KEY_PUB, this.checked ? '1' : '0'); out(this.checked ? 'Đã bật chế độ đăng công khai: báo cáo sẽ chặn/cảnh báo giấy phép phi thương mại.' : 'Chế độ dùng cá nhân: chỉ cảnh báo.'); });
  $('#cv145-save').addEventListener('click', function () { var id = $('#cv145-asset').value; if (!id) { out('Chưa có tài nguyên. Tải lên một tệp trước.'); return; } var m = lsGet(KEY_META, {}); m[id] = { license: $('#cv145-lic').value, source: $('#cv145-src').value.slice(0, 160) }; out(lsSet(KEY_META, m) ? 'Đã lưu giấy phép.' : 'Không lưu được (bộ nhớ đầy?).'); });
  $('#cv145-report').addEventListener('click', function () { var r = licenseReport(assetsNow(), lsGet(KEY_META, {}), $('#cv145-pub').checked); dl('bao-cao-giay-phep.txt', reportText(r)); out('OK ' + r.counts.ok + ' · cảnh báo ' + r.counts.warn + ' · chặn ' + r.counts.block + '. Đã tải báo cáo.'); });
  $('#cv145-mu-add').addEventListener('click', function () { var t = normMusic({ url: $('#cv145-mu-url').value, title: $('#cv145-mu-title').value, bpm: $('#cv145-mu-bpm').value, videoAt: $('#cv145-mu-at').value }); if (!t) { out('Link không hợp lệ (cần http/https).'); return; } var L = lsGet(KEY_MUSIC, []); L.push(t); lsSet(KEY_MUSIC, L.slice(-50)); var info = parseMusicLink(t.url); out('Đã thêm (' + t.platform + '). ' + info.note); $('#cv145-mu-url').value = ''; });
  $('#cv145-mu-cue').addEventListener('click', function () { var L = lsGet(KEY_MUSIC, []); if (!L.length) { out('Chưa có bài nào.'); return; } dl('cue-sheet.txt', cueSheet(L)); out('Đã tải cue sheet (' + L.length + ' bài).'); });
  $('#cv145-font-run').addEventListener('click', function () { var r = fontVietCoverage($('#cv145-font').value); if (!r) { out('Nhập tên font.'); return; } out(r.ok ? r.family + ': hiện đủ ' + r.total + ' ký tự có dấu (kiểm bằng canvas, cần font đã nạp).' : r.family + ': thiếu ' + r.missing.length + '/' + r.total + ' ký tự (' + r.missing.slice(0, 12).join(' ') + (r.missing.length > 12 ? '…' : '') + '). Font có thể chưa nạp hoặc không hỗ trợ tiếng Việt.'); });
  $('#cv145-merge').addEventListener('click', function () { var c = parseCsv($('#cv145-csv').value, 500); if (!c.records.length) { out('CSV cần dòng tiêu đề và ít nhất 1 dòng dữ liệu.'); return; } var m = mergeTemplate($('#cv145-tpl').value, c.records); dl('data-merge.html', '<!DOCTYPE html><meta charset="utf-8"><title>Data merge</title>' + m.outputs.map(function (h) { return '<section style="page-break-after:always">' + h + '</section>'; }).join('\n')); out('Đã gộp ' + m.outputs.length + ' bản' + (m.missingFields.length ? '. Trường không có trong CSV: ' + m.missingFields.join(', ') : '.')); });
  fill(); return true;
}
function ready() { try { mount(); var p = document.querySelector('#page-assets'); if (p && !p.__cv145Obs && window.MutationObserver) { p.__cv145Obs = new MutationObserver(function () { if (!p.querySelector('#cv145-card')) mount(); }); p.__cv145Obs.observe(p, { childList: true }); } } catch (e) {} }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true }); else ready();
function tests() {
  var a = [{ id: '1', name: 'a.png' }, { id: '2', name: 'b.mp3' }, { id: '3', name: 'c.svg' }, { id: '4', name: 'd.png' }];
  var meta = { '1': { license: 'cc0' }, '2': { license: 'cc-by-nc', author: 'X' }, '3': { license: 'cc-by' }, '4': { license: 'bogus' } };
  var pers = licenseReport(a, meta, false), pub = licenseReport(a, meta, true);
  var csv = parseCsv('\uFEFFten,mo ta\r\n"An, B","nói ""hi"""\nChi;x\n\n'), mg = mergeTemplate('<b>{{ten}}</b>{{zz}}', [{ ten: '<i>x</i>' }]);
  var jl = toJsonl([{ prompt: 'a', response: 'b' }, { prompt: '', response: 'c' }, null], 'sys').split('\n');
  var mu = parseMusicLink('https://music.youtube.com/watch?v=abc'), cue = cueSheet([{ url: 'https://soundcloud.com/x/y', title: 'T', videoAt: 12, start: 5, end: 20, bpm: 120 }, { url: 'javascript:alert(1)' }, { url: 'https://youtu.be/q', videoAt: 2 }]);
  return {
    personalModeNeverBlocks: pers.counts.block === 0 && pers.rows[1].level === 'ok',
    publicModeBlocksNC: pub.rows[1].level === 'block' && pub.counts.block === 2,
    unknownLicenseWarns: pers.rows[3].level === 'warn' && pers.rows[3].license === 'unknown',
    attributionRequiredWithoutAuthorWarns: pers.rows[2].level === 'warn' && pers.rows[0].level === 'ok',
    creditLinesOnlyForAttr: creditLines(pers).length === 2 && /X/.test(creditLines(pers)[0]),
    reportMentionsMode: /DÙNG CÁ NHÂN/.test(reportText(pers)) && /ĐĂNG CÔNG KHAI/.test(reportText(pub)),
    gateFlags: qualityGate({ name: 'a', size: 5, hash: 'h' }, { license: 'cc0', source: 's' }, ['h']).issues.join() === 'trùng nội dung' && qualityGate({ name: 'a', size: 5 }, {}, []).pass === false && qualityGate({ name: 'a', size: 5 }, { license: 'own' }, []).pass === true,
    musicParse: mu.platform === 'youtube-music' && mu.embedSupported === true && parseMusicLink('javascript:alert(1)') === null && parseMusicLink('ftp://x.y/z') === null && parseMusicLink('https://example.org/a').platform === 'other',
    cueSheetOrdersAndRejectsUnsafe: cue.indexOf('javascript:') < 0 && cue.indexOf('1. Video 00:02') > 0 && cue.indexOf('2. Video 00:12') > 0 && /không chứa/.test(cue),
    csvParsing: csv.headers.join('|') === 'ten|mo ta' && csv.records.length === 2 && csv.records[0].ten === 'An, B' && csv.records[0]['mo ta'] === 'nói "hi"' && csv.records[1].ten === 'Chi',
    mergeEscapesAndReportsMissing: mg.outputs[0] === '<b>&lt;i&gt;x&lt;/i&gt;</b>{{zz}}' && mg.missingFields[0] === 'zz',
    jsonlValid: jl.length === 1 && JSON.parse(jl[0]).messages.length === 3 && JSON.parse(jl[0]).messages[0].role === 'system',
    badInputSafe: licenseReport(null, null).rows.length === 0 && cueSheet(null).indexOf('CUE SHEET') === 0 && parseCsv(null).records.length === 0 && toJsonl(null) === ''
  };
}
window.CVContentCoreP145 = { version: '145.1.0', LICENSES: LIC, licenseReport: licenseReport, creditLines: creditLines, reportText: reportText, qualityGate: qualityGate, sha256Hex: sha256Hex, parseMusicLink: parseMusicLink, cueSheet: cueSheet, fontVietCoverage: fontVietCoverage, parseCsv: parseCsv, mergeTemplate: mergeTemplate, toJsonl: toJsonl, mount: mount, tests: tests };
})();
