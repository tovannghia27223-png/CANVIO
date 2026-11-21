/* P124 · Responsive Auto Layout + reusable component variants for the existing Website Engine.
   Uses only CVWeb.addComponents() and CV.engines.web.save(); no second editor, project store or dependency. */
(function () {
'use strict';
if (window.CVAutoLayoutP124) return;

var VERSION = '124.1.0';
var VARIANTS = {
  surface: { background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: 'none' },
  outline: { background: 'transparent', border: '1px solid #94a3b8', boxShadow: 'none' },
  elevated: { background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 12px 32px rgba(15,23,42,.10)' },
  soft: { background: '#f1f5f9', border: '1px solid transparent', boxShadow: 'none' }
};
var KINDS = ['stack', 'row', 'grid', 'split', 'card'];

function clamp(value, min, max, fallback) {
  var n = Number(value);
  if (!isFinite(n)) n = fallback;
  return Math.max(min, Math.min(max, n));
}
function cleanText(value, fallback, max) {
  var s = String(value == null ? fallback : value).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
  return s.slice(0, max || 160);
}
function esc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function normalize(kind, options) {
  options = options || {};
  if (KINDS.indexOf(kind) < 0) throw new Error('Kiểu Auto Layout không hợp lệ.');
  var variant = Object.prototype.hasOwnProperty.call(VARIANTS, options.variant) ? options.variant : 'surface';
  return {
    kind: kind,
    variant: variant,
    gap: Math.round(clamp(options.gap, 8, 64, 20)),
    minWidth: Math.round(clamp(options.minWidth, 180, 480, kind === 'split' ? 352 : 240)),
    columns: Math.round(clamp(options.columns, 2, 6, 3)),
    title: cleanText(options.title, 'Tiêu đề thành phần', 120),
    description: cleanText(options.description, 'Mô tả ngắn — nhấp để chỉnh sửa nội dung.', 240)
  };
}
function cardMarkup(o, index) {
  var v = VARIANTS[o.variant];
  var style = 'min-width:0;padding:24px;border-radius:16px;background:' + v.background +
    ';border:' + v.border + ';box-shadow:' + v.boxShadow + ';';
  return '<article data-canvio-component="card" data-canvio-variant="' + o.variant + '" style="' + style + '">' +
    '<h3 data-canvio-component="heading" style="margin:0 0 10px;font-size:1.125rem;line-height:1.35;font-weight:700;">' +
    esc(o.title + (index > 0 ? ' ' + (index + 1) : '')) + '</h3>' +
    '<p data-canvio-component="body" style="margin:0;color:#475569;line-height:1.65;">' + esc(o.description) + '</p>' +
    '</article>';
}
function render(kind, options) {
  var o = normalize(kind, options), style, inner, i, children = [];
  if (kind === 'card') return cardMarkup(o, 0);
  if (kind === 'stack') {
    style = 'display:flex;flex-direction:column;gap:' + o.gap + 'px;width:100%;max-width:72rem;margin-inline:auto;padding:clamp(16px,3vw,32px);box-sizing:border-box;';
    inner = '<header><h2 style="margin:0 0 8px;font-size:clamp(1.35rem,2.5vw,2rem);line-height:1.2;">' + esc(o.title) +
      '</h2><p style="margin:0;color:#475569;line-height:1.65;">' + esc(o.description) + '</p></header>' +
      cardMarkup(o, 0);
  } else if (kind === 'row') {
    style = 'display:flex;flex-flow:row wrap;align-items:stretch;gap:' + o.gap + 'px;width:100%;max-width:72rem;margin-inline:auto;padding:clamp(16px,3vw,32px);box-sizing:border-box;';
    for (i = 0; i < 3; i++) children.push('<div style="flex:1 1 ' + o.minWidth + 'px;min-width:0;">' + cardMarkup(o, i) + '</div>');
    inner = children.join('');
  } else if (kind === 'grid') {
    style = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,' + o.minWidth + 'px),1fr));align-items:stretch;gap:' + o.gap + 'px;width:100%;max-width:72rem;margin-inline:auto;padding:clamp(16px,3vw,32px);box-sizing:border-box;';
    for (i = 0; i < o.columns; i++) children.push(cardMarkup(o, i));
    inner = children.join('');
  } else {
    style = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,' + Math.max(320, o.minWidth) + 'px),1fr));align-items:center;gap:' + (o.gap + 8) + 'px;width:100%;max-width:72rem;margin-inline:auto;padding:clamp(16px,3vw,32px);box-sizing:border-box;';
    inner = '<div style="min-width:0;"><p style="margin:0 0 8px;color:#64748b;font-size:.8rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">CANVIO · AUTO LAYOUT</p>' +
      '<h2 style="margin:0 0 12px;font-size:clamp(1.6rem,3vw,2.6rem);line-height:1.15;">' + esc(o.title) + '</h2>' +
      '<p style="margin:0;color:#475569;line-height:1.7;">' + esc(o.description) + '</p></div>' + cardMarkup(o, 0);
  }
  return '<section data-canvio-auto-layout="' + kind + '" data-canvio-layout-version="' + VERSION +
    '" style="' + style + '">' + inner + '</section>';
}
function inspect() {
  return {
    version: VERSION,
    layouts: [
      { id: 'stack', label: 'Stack · xếp dọc', description: 'Nội dung theo trục dọc, khoảng cách nhất quán.' },
      { id: 'row', label: 'Row · hàng linh hoạt', description: 'Flex wrap, tự xuống hàng khi thiếu không gian.' },
      { id: 'grid', label: 'Grid · lưới tự co giãn', description: 'CSS Grid auto-fit/minmax, tự đổi số cột.' },
      { id: 'split', label: 'Split · hai vùng', description: 'Hai vùng nội dung tự xếp lại trên màn hình hẹp.' },
      { id: 'card', label: 'Card · biến thể', description: 'Thành phần tái sử dụng với bốn biến thể bề mặt.' }
    ],
    variants: Object.keys(VARIANTS)
  };
}
async function insert(kind, options) {
  var markup;
  try { markup = render(kind, options); }
  catch (error) { return { ok: false, inserted: false, saved: false, error: error.message }; }
  if (!window.CVWeb || typeof window.CVWeb.addComponents !== 'function' ||
      !window.CV || !window.CV.engines || !window.CV.engines.web ||
      typeof window.CV.engines.web.save !== 'function') {
    return { ok: false, inserted: false, saved: false, error: 'Website Engine chưa sẵn sàng. Hãy mở Website Engine rồi thử lại.' };
  }
  try {
    var added = await Promise.resolve(window.CVWeb.addComponents(markup));
    if (added === false) return { ok: false, inserted: false, saved: false, error: 'Website Engine từ chối chèn thành phần.' };
  } catch (error) {
    return { ok: false, inserted: false, saved: false, error: 'Không thể chèn thành phần: ' + cleanText(error && error.message, 'lỗi editor', 120) };
  }
  try {
    var saved = await Promise.resolve(window.CV.engines.web.save());
    if (saved === false) return { ok: false, inserted: true, saved: false, error: 'Đã chèn vào phiên hiện tại nhưng Website Engine từ chối lưu. Hãy kiểm tra và dùng Hoàn tác nếu cần.' };
    return { ok: true, inserted: true, saved: true, error: '' };
  } catch (error) {
    return { ok: false, inserted: true, saved: false, error: 'Đã chèn vào phiên hiện tại nhưng lưu thất bại. Hãy kiểm tra editor và dùng Hoàn tác nếu cần.' };
  }
}
function make(tag, attrs, text) {
  var el = document.createElement(tag), k;
  Object.keys(attrs || {}).forEach(function (key) {
    if (key === 'style') el.style.cssText = attrs[key];
    else el.setAttribute(key, attrs[key]);
  });
  if (text != null) el.textContent = text;
  return el;
}
function mount() {
  if (!document || typeof document.getElementById !== 'function') return false;
  var host = document.getElementById('page-webEngine');
  if (!host || host.querySelector('[data-canvio-p124-panel]')) return false;
  var panel = make('section', {
    'data-canvio-p124-panel': '1',
    'aria-label': 'Auto Layout và Component',
    style: 'margin:16px 0;padding:16px;border:1px solid #cbd5e1;border-radius:14px;background:var(--surface,#fff);color:var(--text,#0f172a);'
  });
  var heading = make('h3', { style: 'margin:0 0 6px;font-size:16px;font-weight:700;' }, 'Auto Layout & Component');
  var help = make('p', { style: 'margin:0 0 12px;color:var(--muted,#64748b);font-size:13px;line-height:1.5;' },
    'Chèn bố cục responsive hoặc card biến thể vào Website Engine hiện tại. Nội dung sau khi chèn có thể chỉnh sửa trực tiếp trong GrapesJS.');
  var row = make('div', { style: 'display:flex;flex-wrap:wrap;gap:8px;align-items:center;' });
  var select = make('select', { 'aria-label': 'Biến thể component', style: 'min-height:36px;padding:6px 10px;border:1px solid #cbd5e1;border-radius:8px;background:transparent;color:inherit;' });
  inspect().variants.forEach(function (v) {
    var option = make('option', { value: v }, v.charAt(0).toUpperCase() + v.slice(1));
    select.appendChild(option);
  });
  var status = make('p', { role: 'status', 'aria-live': 'polite', style: 'margin:10px 0 0;font-size:12px;color:var(--muted,#64748b);' }, 'Chọn bố cục để chèn vào trang.');
  inspect().layouts.forEach(function (layout) {
    var button = make('button', {
      type: 'button',
      'data-p124-kind': layout.id,
      style: 'min-height:36px;padding:7px 12px;border:1px solid #cbd5e1;border-radius:8px;background:transparent;color:inherit;cursor:pointer;font:inherit;'
    }, layout.label);
    button.addEventListener('click', async function () {
      button.disabled = true;
      status.textContent = 'Đang chèn ' + layout.label + '…';
      var result = await insert(layout.id, { variant: select.value });
      status.textContent = result.ok ? 'Đã chèn và lưu thành công.' : result.error;
      button.disabled = false;
    });
    row.appendChild(button);
  });
  panel.appendChild(heading); panel.appendChild(help); row.appendChild(select); panel.appendChild(row); panel.appendChild(status);
  host.appendChild(panel);
  return true;
}
function start() {
  mount();
  if (typeof MutationObserver === 'function' && document && document.documentElement) {
    var observer = new MutationObserver(function () { mount(); });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
}
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading' && document.addEventListener) document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
}
var api = { version: VERSION, inspect: inspect, normalize: normalize, render: render, insert: insert, mount: mount };
api.tests = function () {
  var n = normalize('grid', { columns: 99, gap: 1, minWidth: 900, variant: 'unknown' });
  var g = render('grid', { columns: 4, minWidth: 260, gap: 24 });
  var s = render('split', { minWidth: 360 });
  var r = render('row', { minWidth: 220 });
  var c = render('card', { variant: 'elevated', title: '<script>alert(1)<' + '/script>' });
  return {
    rejectsUnknownLayout: (function () { try { normalize('unknown'); return false; } catch (e) { return true; } })(),
    clampsColumns: n.columns === 6,
    clampsGap: n.gap === 8,
    clampsMinWidth: n.minWidth === 480,
    rejectsUnknownVariant: n.variant === 'surface',
    gridUsesAutoFit: /repeat\(auto-fit,minmax/.test(g),
    splitUsesResponsiveGrid: /repeat\(auto-fit,minmax/.test(s),
    rowUsesFlexWrap: /flex-flow:row wrap/.test(r),
    cardVariantIsTagged: /data-canvio-variant="elevated"/.test(c),
    escapesUserText: !/<script>alert/.test(c) && /&lt;script&gt;/.test(c),
    boundsTextLength: normalize('card', { title: 'x'.repeat(200) }).title.length === 120,
    exposesFourVariants: inspect().variants.length === 4
  };
};
window.CVAutoLayoutP124 = api;
})();
