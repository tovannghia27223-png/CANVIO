/* P124 · Responsive Auto Layout + reusable component variants for the existing Website Engine.
   Uses only CVWeb.addComponents() and CV.engines.web.save(); no second editor, project store or dependency. */
(function () {
'use strict';
if (window.CVAutoLayoutP124) return;

var VERSION = '124.2.0';
var INSTANCE = 0;
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
  var mobileBreakpoint = Math.round(clamp(options.mobileBreakpoint, 320, 767, 640));
  var tabletBreakpoint = Math.round(clamp(options.tabletBreakpoint, 768, 1280, 960));
  return {
    kind: kind,
    variant: variant,
    gap: Math.round(clamp(options.gap, 8, 64, 20)),
    minWidth: Math.round(clamp(options.minWidth, 180, 480, kind === 'split' ? 352 : 240)),
    columns: Math.round(clamp(options.columns, 2, 6, 3)),
    mobileColumns: Math.round(clamp(options.mobileColumns, 1, 2, 1)),
    tabletColumns: Math.round(clamp(options.tabletColumns, 1, 4, 2)),
    desktopColumns: Math.round(clamp(options.desktopColumns, 2, 6, clamp(options.columns, 2, 6, 3))),
    mobileBreakpoint: mobileBreakpoint,
    tabletBreakpoint: Math.max(mobileBreakpoint + 1, tabletBreakpoint),
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
  var o = normalize(kind, options), style, inner, i, children = [], instance = 'cv-p124-layout-' + (++INSTANCE), rules = [];
  if (kind === 'card') return cardMarkup(o, 0);
  if (kind === 'stack') {
    style = 'display:flex;flex-direction:column;gap:' + o.gap + 'px;width:100%;max-width:72rem;margin-inline:auto;padding:clamp(16px,3vw,32px);box-sizing:border-box;';
    inner = '<header><h2 style="margin:0 0 8px;font-size:clamp(1.35rem,2.5vw,2rem);line-height:1.2;">' + esc(o.title) +
      '</h2><p style="margin:0;color:#475569;line-height:1.65;">' + esc(o.description) + '</p></header>' +
      cardMarkup(o, 0);
  } else if (kind === 'row') {
    style = 'display:flex;flex-direction:row;flex-wrap:wrap;align-items:stretch;gap:' + o.gap + 'px;width:100%;max-width:72rem;margin-inline:auto;padding:clamp(16px,3vw,32px);box-sizing:border-box;';
    for (i = 0; i < 3; i++) children.push('<div style="flex:1 1 ' + o.minWidth + 'px;min-width:0;">' + cardMarkup(o, i) + '</div>');
    inner = children.join('');
    rules.push('.' + instance + '{flex-direction:row;}');
    rules.push('@media(max-width:' + o.mobileBreakpoint + 'px){.' + instance + '{flex-direction:column;}}');
  } else if (kind === 'grid') {
    style = 'display:grid;align-items:stretch;gap:' + o.gap + 'px;width:100%;max-width:72rem;margin-inline:auto;padding:clamp(16px,3vw,32px);box-sizing:border-box;';
    for (i = 0; i < o.desktopColumns; i++) children.push(cardMarkup(o, i));
    inner = children.join('');
    rules.push('.' + instance + '{grid-template-columns:repeat(' + o.desktopColumns + ',minmax(0,1fr));}');
    rules.push('@media(max-width:' + o.tabletBreakpoint + 'px){.' + instance + '{grid-template-columns:repeat(' + o.tabletColumns + ',minmax(0,1fr));}}');
    rules.push('@media(max-width:' + o.mobileBreakpoint + 'px){.' + instance + '{grid-template-columns:repeat(' + o.mobileColumns + ',minmax(0,1fr));}}');
  } else {
    style = 'display:grid;align-items:center;gap:' + (o.gap + 8) + 'px;width:100%;max-width:72rem;margin-inline:auto;padding:clamp(16px,3vw,32px);box-sizing:border-box;';
    inner = '<div style="min-width:0;"><p style="margin:0 0 8px;color:#64748b;font-size:.8rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">CANVIO · AUTO LAYOUT</p>' +
      '<h2 style="margin:0 0 12px;font-size:clamp(1.6rem,3vw,2.6rem);line-height:1.15;">' + esc(o.title) + '</h2>' +
      '<p style="margin:0;color:#475569;line-height:1.7;">' + esc(o.description) + '</p></div>' + cardMarkup(o, 0);
    rules.push('.' + instance + '{grid-template-columns:repeat(2,minmax(0,1fr));}');
    rules.push('@media(max-width:' + o.tabletBreakpoint + 'px){.' + instance + '{grid-template-columns:repeat(' + Math.min(2, o.tabletColumns) + ',minmax(0,1fr));}}');
    rules.push('@media(max-width:' + o.mobileBreakpoint + 'px){.' + instance + '{grid-template-columns:repeat(1,minmax(0,1fr));}}');
  }
  var css = rules.length ? '<style data-canvio-p124-breakpoints="' + instance + '">' + rules.join('') + '</style>' : '';
  return css + '<section class="cv-p124-layout ' + instance + '" data-canvio-auto-layout="' + kind + '" data-canvio-layout-version="' + VERSION +
    '" data-canvio-layout-instance="' + instance + '" style="' + style + '">' + inner + '</section>';
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
    variants: Object.keys(VARIANTS),
    breakpointControls: ['mobileBreakpoint', 'tabletBreakpoint', 'mobileColumns', 'tabletColumns', 'desktopColumns']
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
    'Chọn bố cục, biến thể và breakpoint. Thành phần được chèn vào Website Engine hiện tại; có thể chỉnh sửa tiếp trong GrapesJS.');
  var row = make('div', { style: 'display:flex;flex-wrap:wrap;gap:8px;align-items:center;' });
  var select = make('select', { 'aria-label': 'Biến thể component', style: 'min-height:36px;padding:6px 10px;border:1px solid #cbd5e1;border-radius:8px;background:transparent;color:inherit;' });
  inspect().variants.forEach(function (v) {
    var option = make('option', { value: v }, v.charAt(0).toUpperCase() + v.slice(1));
    select.appendChild(option);
  });
  function field(labelText, attrs, initial) {
    var label = make('label', { style: 'display:flex;flex-direction:column;gap:4px;min-width:112px;font-size:11px;color:var(--muted,#64748b);font-weight:600;' }, labelText);
    var input = make('input', attrs);
    input.value = String(initial);
    label.appendChild(input);
    return { label: label, input: input };
  }
  var settings = make('div', { style: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(112px,1fr));gap:8px;margin:12px 0;' });
  var title = field('Tiêu đề', { id: 'cv-p124-title', type: 'text', maxlength: '120', 'aria-label': 'Tiêu đề thành phần', style: 'width:100%;min-height:34px;box-sizing:border-box;padding:6px 8px;border:1px solid #cbd5e1;border-radius:8px;background:transparent;color:inherit;' }, 'Tiêu đề thành phần');
  var description = field('Mô tả', { id: 'cv-p124-description', type: 'text', maxlength: '240', 'aria-label': 'Mô tả thành phần', style: 'width:100%;min-height:34px;box-sizing:border-box;padding:6px 8px;border:1px solid #cbd5e1;border-radius:8px;background:transparent;color:inherit;' }, 'Mô tả ngắn — nhấp để chỉnh sửa nội dung.');
  var gap = field('Khoảng cách (px)', { id: 'cv-p124-gap', type: 'number', min: '8', max: '64', step: '1', 'aria-label': 'Khoảng cách' }, 20);
  var minWidth = field('Rộng tối thiểu (px)', { id: 'cv-p124-minwidth', type: 'number', min: '180', max: '480', step: '10', 'aria-label': 'Chiều rộng tối thiểu' }, 240);
  var mobileBreakpoint = field('Mobile tối đa (px)', { id: 'cv-p124-break-mobile', type: 'number', min: '320', max: '767', step: '1', 'aria-label': 'Breakpoint mobile' }, 640);
  var tabletBreakpoint = field('Tablet tối đa (px)', { id: 'cv-p124-break-tablet', type: 'number', min: '768', max: '1280', step: '1', 'aria-label': 'Breakpoint tablet' }, 960);
  var mobileColumns = field('Cột mobile', { id: 'cv-p124-cols-mobile', type: 'number', min: '1', max: '2', step: '1', 'aria-label': 'Số cột mobile' }, 1);
  var tabletColumns = field('Cột tablet', { id: 'cv-p124-cols-tablet', type: 'number', min: '1', max: '4', step: '1', 'aria-label': 'Số cột tablet' }, 2);
  var desktopColumns = field('Cột desktop', { id: 'cv-p124-cols-desktop', type: 'number', min: '2', max: '6', step: '1', 'aria-label': 'Số cột desktop' }, 3);
  [title, description, gap, minWidth, mobileBreakpoint, tabletBreakpoint, mobileColumns, tabletColumns, desktopColumns].forEach(function (f) { settings.appendChild(f.label); });
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
      var result = await insert(layout.id, {
        variant: select.value, title: title.input.value, description: description.input.value,
        gap: gap.input.value, minWidth: minWidth.input.value,
        mobileBreakpoint: mobileBreakpoint.input.value, tabletBreakpoint: tabletBreakpoint.input.value,
        mobileColumns: mobileColumns.input.value, tabletColumns: tabletColumns.input.value, desktopColumns: desktopColumns.input.value
      });
      status.textContent = result.ok ? 'Đã chèn và lưu thành công.' : result.error;
      button.disabled = false;
    });
    row.appendChild(button);
  });
  panel.appendChild(heading); panel.appendChild(help); row.appendChild(select); panel.appendChild(row); panel.appendChild(settings); panel.appendChild(status);
  host.appendChild(panel);
  return true;
}
function hasPanel() {
  var host = document && typeof document.getElementById === 'function' ? document.getElementById('page-webEngine') : null;
  return !!(host && host.querySelector && host.querySelector('[data-canvio-p124-panel]'));
}
function start() {
  if (mount() || hasPanel()) return;
  if (typeof MutationObserver === 'function' && document && document.documentElement) {
    var observer = new MutationObserver(function () {
      if (mount() || hasPanel()) observer.disconnect();
    });
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
    gridUsesConfiguredColumns: g.indexOf('grid-template-columns:repeat(4,minmax(0,1fr))') >= 0,
    splitUsesResponsiveGrid: s.indexOf('grid-template-columns:repeat(2,minmax(0,1fr))') >= 0 && s.indexOf('@media(max-width:640px)') >= 0,
    rowUsesFlexWrap: /flex-wrap:wrap/.test(r),
    cardVariantIsTagged: /data-canvio-variant="elevated"/.test(c),
    escapesUserText: !/<script>alert/.test(c) && /&lt;script&gt;/.test(c),
    boundsTextLength: normalize('card', { title: 'x'.repeat(200) }).title.length === 120,
    exposesFourVariants: inspect().variants.length === 4,
    clampsMobileColumns: normalize('grid', { mobileColumns: 9 }).mobileColumns === 2,
    breakpointsOrdered: normalize('grid', { mobileBreakpoint: 760, tabletBreakpoint: 768 }).tabletBreakpoint > normalize('grid', { mobileBreakpoint: 760, tabletBreakpoint: 768 }).mobileBreakpoint,
    responsiveRulesAreScoped: /data-canvio-p124-breakpoints/.test(g) && /cv-p124-layout-/.test(g),
    exposesBreakpointControls: inspect().breakpointControls.length === 5
  };
};
window.CVAutoLayoutP124 = api;
})();
