/* P128.2/P128.4 · Bộ điều phối tác vụ AI: chữ/caption/brief -> nhà cung cấp cục bộ (Ollama/LM Studio, qua CVAIProviderAdapter có sẵn) rồi dự phòng Gemini (có cache); ảnh/video -> chỉ chạy nếu người dùng đã đăng ký bộ xử lý (ví dụ ComfyUI), nếu chưa thì báo "chưa cấu hình".
   Mỗi hành động: tối đa 1 lần gọi cho mỗi tầng, tự rơi sang tầng kế khi lỗi/quá giờ, đo độ trễ từng tầng. Không tự gọi nền, không lưu khóa; cấu hình thứ tự tầng chỉ là tiện ích giao diện (localStorage). Không đánh giá chất lượng câu trả lời: chỉ đo độ trễ và tỉ lệ lỗi. Cấu hình provider vẫn ở API Hub/Local AI Studio hiện có (P128.1 gộp, không làm lại). */
(function () {
'use strict';
if (window.CVOrchestratorP128) return;
var KEY = 'canvio128:tiers', ORDERS = { 'local-first': ['local', 'gemini'], 'gemini-first': ['gemini', 'local'], 'local-only': ['local'], 'gemini-only': ['gemini'] }, TEXT = { text: 1, caption: 1, brief: 1 };
var stats = {}, cache = new Map(), handlers = {}, MAXC = 50, TIMEOUT = 45000;
function now() { return (window.performance && performance.now) ? performance.now() : Date.now(); }
function hash(s) { var h = 5381, i; for (i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
function order() { var v = 'local-first'; try { v = localStorage.getItem(KEY) || v; } catch (e) {} return ORDERS[v] ? v : 'local-first'; }
function setOrder(v) { if (!ORDERS[v]) throw new Error('Thứ tự tầng không hợp lệ.'); try { localStorage.setItem(KEY, v); } catch (e) {} return v; }
function st(t) { return stats[t] || (stats[t] = { calls: 0, ok: 0, fail: 0, avgMs: 0, lastMs: 0, lastError: '' }); }
function record(t, ok, ms, err) { var s = st(t); s.calls++; if (ok) { s.ok++; s.avgMs = s.ok === 1 ? ms : Math.round(s.avgMs * 0.7 + ms * 0.3); } else { s.fail++; s.lastError = String(err || '').slice(0, 140); } s.lastMs = Math.round(ms); }
function register(kind, tier, fn) { if (typeof fn !== 'function') throw new Error('Bộ xử lý phải là hàm.'); (handlers[kind] = handlers[kind] || {})[tier] = fn; }
function textRunner(tier) { return function (task) { var A = window.CVAIProviderAdapter; if (!A || !A.call) return Promise.reject(new Error('Chưa có bộ điều hợp AI.')); return A.call(task.prompt, { provider: tier, maxTokens: task.maxTokens }); }; }
function withTimeout(p, ms) { var t; return Promise.race([Promise.resolve(p), new Promise(function (_, no) { t = setTimeout(function () { no(new Error('Quá thời gian ' + Math.round(ms / 1000) + ' giây')); }, ms); })]).then(function (v) { clearTimeout(t); return v; }, function (e) { clearTimeout(t); throw e; }); }
function run(task) {
  task = task || {}; var kind = String(task.kind || 'text'), prompt = String(task.prompt || '').trim();
  if (!prompt) return Promise.reject(new Error('Nhập nội dung tác vụ.'));
  if (prompt.length > 20000) return Promise.reject(new Error('Nội dung quá dài (>20000 ký tự).'));
  var tiers = (task.tiers && task.tiers.length ? task.tiers : ORDERS[order()]).slice(0, 4), ck = kind + '|' + tiers.join(',') + '|' + hash(prompt) + '|' + prompt.length, tried = [];
  if (task.cache !== false && cache.has(ck)) { var c = cache.get(ck); return Promise.resolve({ ok: true, kind: kind, tier: c.tier, text: c.text, ms: 0, cached: true, tried: [] }); }
  var runnable = tiers.filter(function (t) { return (handlers[kind] && handlers[kind][t]) || (TEXT[kind] && (t === 'local' || t === 'gemini')); });
  if (!runnable.length) return Promise.resolve({ ok: false, kind: kind, status: 'unconfigured', message: TEXT[kind] ? 'Tầng được chọn không hỗ trợ tác vụ này.' : 'Chưa cấu hình bộ xử lý cho "' + kind + '" (ví dụ ComfyUI cục bộ). Chưa có kết quả.', tried: [] });
  var i = 0; function next() {
    if (i >= runnable.length) return Promise.resolve({ ok: false, kind: kind, status: 'failed', message: 'Mọi tầng đều lỗi: ' + tried.map(function (x) { return x.tier + ' (' + x.error + ')'; }).join('; '), tried: tried });
    var tier = runnable[i++], fn = (handlers[kind] && handlers[kind][tier]) || textRunner(tier), t0 = now(), p;
    try { p = withTimeout(fn({ kind: kind, prompt: prompt, maxTokens: task.maxTokens }), task.timeoutMs || TIMEOUT); } catch (e) { p = Promise.reject(e); }
    return p.then(function (out) { var ms = now() - t0, txt = typeof out === 'string' ? out : (out == null ? '' : out); if (typeof txt === 'string' && !txt.trim()) { record(tier, false, ms, 'Trả về rỗng'); tried.push({ tier: tier, error: 'Trả về rỗng' }); return next(); } record(tier, true, ms); if (task.cache !== false && typeof txt === 'string') { if (cache.size >= MAXC) cache.delete(cache.keys().next().value); cache.set(ck, { tier: tier, text: txt }); } return { ok: true, kind: kind, tier: tier, text: txt, ms: Math.round(ms), cached: false, tried: tried }; }, function (e) { var ms = now() - t0, m = String(e && e.message || e).slice(0, 140); record(tier, false, ms, m); tried.push({ tier: tier, error: m }); return next(); });
  }
  return next();
}
function mount() {
  var page = document.getElementById('page-platform'); if (!page || page.querySelector('#cv128-card')) return false;
  var anchor = page.querySelector('#cv11Provider'); anchor = anchor && anchor.closest('.card'); if (!anchor) return false;
  var card = document.createElement('div'); card.className = 'card'; card.id = 'cv128-card'; card.style.marginTop = '14px';
  card.innerHTML = '<div class="cardTop"><h3>Điều phối tác vụ AI (P128)</h3><span class="sub">cục bộ trước, Gemini dự phòng</span></div><div class="row" style="gap:8px;flex-wrap:wrap;align-items:center"><select class="input" id="cv128-order" aria-label="Thứ tự tầng"><option value="local-first">Cục bộ → Gemini</option><option value="gemini-first">Gemini → Cục bộ</option><option value="local-only">Chỉ cục bộ</option><option value="gemini-only">Chỉ Gemini</option></select><select class="input" id="cv128-kind" aria-label="Loại tác vụ"><option value="text">Viết chữ / brief</option><option value="caption">Caption</option><option value="image">Ảnh (cần ComfyUI)</option></select></div><textarea class="input" id="cv128-prompt" rows="3" maxlength="20000" placeholder="Nhập tác vụ…" style="margin-top:8px;width:100%" aria-label="Nội dung tác vụ"></textarea><div class="row" style="gap:8px;margin-top:6px"><button type="button" class="btn btn-soft sm" id="cv128-run">Chạy một lần</button></div><pre id="cv128-res" class="tiny" style="white-space:pre-wrap;margin-top:6px" role="status" aria-live="polite">Mỗi tầng chỉ gọi tối đa 1 lần cho mỗi hành động; kết quả giống nhau được dùng lại từ bộ nhớ đệm.</pre><div class="tiny" id="cv128-stats"></div>';
  anchor.parentNode.insertBefore(card, anchor.nextSibling);
  var $ = function (s) { return card.querySelector(s); }; $('#cv128-order').value = order();
  $('#cv128-order').addEventListener('change', function () { try { setOrder(this.value); } catch (e) {} });
  function drawStats() { var t = Object.keys(stats); $('#cv128-stats').textContent = t.length ? t.map(function (k) { var s = stats[k]; return k + ': ' + s.ok + '/' + s.calls + ' OK · TB ' + s.avgMs + ' ms · gần nhất ' + s.lastMs + ' ms' + (s.lastError ? ' · lỗi: ' + s.lastError : ''); }).join('  |  ') : ''; }
  $('#cv128-run').addEventListener('click', function () { var b = this, res = $('#cv128-res'); b.disabled = true; res.textContent = 'Đang chạy…'; run({ kind: $('#cv128-kind').value, prompt: $('#cv128-prompt').value }).then(function (r) { res.textContent = r.ok ? '[' + r.tier + (r.cached ? ', từ bộ nhớ đệm' : ', ' + r.ms + ' ms') + ']\n' + String(r.text).slice(0, 4000) : r.message; }, function (e) { res.textContent = String(e && e.message || e); }).then(function () { b.disabled = false; drawStats(); }); });
  return true;
}
function ready() { try { mount(); } catch (e) {} }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true }); else ready();
window.CVOrchestratorP128 = { version: '128.2.0', run: run, register: register, order: order, setOrder: setOrder, stats: function () { return JSON.parse(JSON.stringify(stats)); }, clearCache: function () { cache.clear(); }, reset: function () { stats = {}; cache.clear(); handlers = {}; }, mount: mount, ORDERS: ORDERS };
})();
