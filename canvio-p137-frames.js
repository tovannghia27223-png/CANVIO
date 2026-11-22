/* P137.7 · Khung chữ liên kết trong Designer (Konva): chữ tràn khỏi khung này tự chảy sang khung kế tiếp.
   Không thay engine Konva: chỉ dùng các nút Text có sẵn. Mỗi khung giữ thuộc tính cvChain / cvChainIdx / cvChainSep (cách ngắt ở cuối khung);
   phần tràn khỏi khung cuối nằm ở cvChainTail để không mất chữ. Gỡ liên kết giữ nguyên chữ đang hiển thị. */
(function () {
'use strict';
if (window.CVFramesP137) return;
function wrapLines(text, width, measure) {
  var lines = [], paras = String(text == null ? '' : text).split('\n');
  paras.forEach(function (para) {
    var words = para.split(/ +/).filter(function (w) { return w !== ''; }), cur = '';
    if (!words.length) { lines.push({ t: '', end: true }); return; }
    words.forEach(function (w) {
      var tryLine = cur ? cur + ' ' + w : w;
      if (cur && measure(tryLine) > width) { lines.push({ t: cur, end: false }); cur = w; } else cur = tryLine;
    });
    lines.push({ t: cur, end: true });
  });
  return lines;
}
function joinLines(ls) { var s = ''; ls.forEach(function (l, i) { s += l.t; if (i < ls.length - 1) s += l.end ? '\n' : ' '; }); return s; }
/* frames: [{ width, lines }] → { chunks: [{ text, sep }], tail: { text } | null } */
function splitText(text, frames, measure) {
  var all = wrapLines(text, frames.length ? frames[0].width : 0, measure), pos = 0, chunks = [];
  frames.forEach(function (f, i) {
    if (i > 0 && f.width !== frames[0].width) all = all.slice(0, pos).concat(wrapLines(joinLines(all.slice(pos)), f.width, measure));
    var cap = Math.max(1, Math.floor(f.lines)), part = all.slice(pos, pos + cap);
    pos += part.length;
    chunks.push({ text: joinLines(part), sep: part.length && part[part.length - 1].end ? '\n' : ' ' });
  });
  var rest = all.slice(pos);
  return { chunks: chunks, tail: rest.length ? { text: joinLines(rest) } : null };
}
function stage() { var K = window.Konva; if (!K || !K.stages) return null; for (var i = 0; i < K.stages.length; i++) if (K.stages[i].container && K.stages[i].container().id === 'konvaStage') return K.stages[i]; return null; }
function layerOf(st) { return st && st.getLayers && st.getLayers()[0]; }
function selectedText() { var l = layerOf(stage()); if (!l) return null; var tr = l.findOne('Transformer'), n = tr && tr.nodes && tr.nodes()[0]; return n && n.getClassName() === 'Text' ? n : null; }
function chainNodes(layer, id) { return layer.find('Text').filter(function (n) { return n.getAttr('cvChain') === id; }).sort(function (a, b) { return (a.getAttr('cvChainIdx') || 0) - (b.getAttr('cvChainIdx') || 0); }); }
function metrics(n) {
  var K = window.Konva, tmp = new K.Text({ fontSize: n.fontSize(), fontFamily: n.fontFamily(), fontStyle: n.fontStyle(), letterSpacing: n.letterSpacing ? n.letterSpacing() : 0 });
  var pad = n.padding ? n.padding() : 0, lh = (n.lineHeight ? n.lineHeight() : 1) * n.fontSize();
  return { width: Math.max(10, n.width() - 2 * pad - 1), lines: Math.max(1, Math.floor((n.height() - 2 * pad) / lh)), measure: function (s) { return tmp.measureSize(s).width; } };
}
function sourceOf(nodes) {
  var s = '';
  nodes.forEach(function (n, i) { s += n.text(); if (i < nodes.length - 1) s += n.getAttr('cvChainSep') || ' '; });
  var tail = nodes[nodes.length - 1].getAttr('cvChainTail');
  if (tail) s += (nodes[nodes.length - 1].getAttr('cvChainSep') || ' ') + tail;
  return s;
}
function reflow(layer, id, source) {
  var nodes = chainNodes(layer, id); if (!nodes.length) return null;
  var src = source != null ? source : sourceOf(nodes), m0 = metrics(nodes[0]);
  var frames = nodes.map(function (n) { var m = metrics(n); return { width: m.width, lines: m.lines }; });
  var r = splitText(src, frames, m0.measure);
  nodes.forEach(function (n, i) { n.text(r.chunks[i].text); n.setAttr('cvChainSep', r.chunks[i].sep); n.setAttr('cvChainTail', i === nodes.length - 1 && r.tail ? r.tail.text : ''); });
  layer.draw();
  return { frames: nodes.length, overflow: !!r.tail, tailLines: r.tail ? r.tail.text.split(/\n| /).length : 0 };
}
function uid() { return 'ch_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
function addFrame() {
  var st = stage(), layer = layerOf(st), n = selectedText();
  if (!layer || !n) return { ok: false, error: 'Chọn một khung chữ trước.' };
  var K = window.Konva, id = n.getAttr('cvChain'), nodes;
  if (!id) {
    id = uid(); var lh = (n.lineHeight ? n.lineHeight() : 1) * n.fontSize(), h = n.height();
    if (!(h > 0)) h = lh * 3;
    n.setAttrs({ cvChain: id, cvChainIdx: 0, height: Math.max(lh * 2, Math.round(h / 2)), wrap: 'word' });
  }
  nodes = chainNodes(layer, id); var last = nodes[nodes.length - 1];
  var copy = last.clone({ id: undefined, x: last.x(), y: Math.min(last.y() + last.height() + 24, Math.max(0, st.height() - last.height() - 8)), text: '', cvChain: id, cvChainIdx: nodes.length, cvChainSep: ' ', cvChainTail: '' });
  if (Math.abs(copy.y() - last.y()) < 4) copy.x(Math.min(st.width() - last.width() - 4, last.x() + last.width() + 20)), copy.y(last.y());
  copy.setAttr('cvChainTail', last.getAttr('cvChainTail') || ''); last.setAttr('cvChainTail', '');
  layer.add(copy);
  var info = reflow(layer, id);
  return { ok: true, chain: id, frames: info.frames, overflow: info.overflow, node: copy };
}
function reflowSelected() {
  var layer = layerOf(stage()), n = selectedText(); if (!layer || !n || !n.getAttr('cvChain')) return { ok: false, error: 'Chọn một khung chữ đã liên kết.' };
  var info = reflow(layer, n.getAttr('cvChain')); return { ok: true, frames: info.frames, overflow: info.overflow };
}
function unlinkSelected() {
  var layer = layerOf(stage()), n = selectedText(); if (!layer || !n || !n.getAttr('cvChain')) return { ok: false, error: 'Chọn một khung chữ đã liên kết.' };
  var id = n.getAttr('cvChain'), nodes = chainNodes(layer, id);
  nodes.forEach(function (x) { x.setAttrs({ cvChain: undefined, cvChainIdx: undefined, cvChainSep: undefined, cvChainTail: undefined }); });
  layer.draw(); return { ok: true, frames: nodes.length };
}
function mount() {
  var page = document.getElementById('page-designEngine'), bar = page && page.querySelector('.engine-toolbar'); if (!bar || page.querySelector('#cv137f-row')) return false;
  var row = document.createElement('div'); row.id = 'cv137f-row'; row.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:8px';
  row.innerHTML = '<b class="tiny">Khung chữ liên kết</b><button type="button" class="btn btn-soft sm" id="cv137f-add" title="Thêm khung chữ kế tiếp; chữ tràn sẽ chảy sang">Thêm khung kế tiếp</button><button type="button" class="btn btn-ghost sm" id="cv137f-flow">Chảy lại chữ</button><button type="button" class="btn btn-ghost sm" id="cv137f-unlink">Gỡ liên kết</button><span class="tiny" id="cv137f-out" role="status" aria-live="polite"></span>';
  bar.appendChild(row);
  var out = row.querySelector('#cv137f-out');
  function show(r, ok) { out.textContent = r.ok ? ok(r) : r.error; }
  row.querySelector('#cv137f-add').addEventListener('click', function () { show(addFrame(), function (r) { return 'Chuỗi có ' + r.frames + ' khung' + (r.overflow ? ' · chữ vẫn tràn khỏi khung cuối' : '') + '.'; }); });
  row.querySelector('#cv137f-flow').addEventListener('click', function () { show(reflowSelected(), function (r) { return 'Đã chảy lại qua ' + r.frames + ' khung' + (r.overflow ? ' · còn chữ tràn' : '') + '.'; }); });
  row.querySelector('#cv137f-unlink').addEventListener('click', function () { show(unlinkSelected(), function (r) { return 'Đã gỡ liên kết ' + r.frames + ' khung; chữ giữ nguyên.'; }); });
  return true;
}
function ready() { try { mount(); var p = document.getElementById('page-designEngine'); if (p && !p.__cv137f && window.MutationObserver) { p.__cv137f = true; new MutationObserver(function () { if (!p.querySelector('#cv137f-row')) mount(); }).observe(p, { childList: true, subtree: true }); } } catch (e) {} }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true }); else ready();
window.CVFramesP137 = { version: '137.7.0', splitText: splitText, wrapLines: wrapLines, addFrame: addFrame, reflowSelected: reflowSelected, unlinkSelected: unlinkSelected, mount: mount };
})();
