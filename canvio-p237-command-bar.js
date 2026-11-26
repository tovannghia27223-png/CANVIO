/* Canonical embedded lot: canvio-lot237. */
/* P237: Vietnamese commands inside the existing Ctrl+K palette. Every action calls the editor's own
 * method or button, so history, autosave and exports keep their current owners. Anything that does not
 * match a rule falls through to the existing natural-language box (CVCmd). */
(function (w, d) {
  'use strict';
  if (!w || !d || w.CVCommandP237) return;
  var KEY = 'canvio.p237.recent', COMMANDS = [], installed = false;

  function norm(t) {
    return String(t == null ? '' : t).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd')
      .toLowerCase().replace(/\s+/g, ' ').trim();
  }
  function clean(t) {
    return norm(t).replace(/^(hay |giup toi |cho toi |toi muon )+/, '').replace(/( di| nhe| giup toi)+$/, '');
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function byId(id) { return d.getElementById(id); }
  function current() { var p = d.querySelector('.page.active'); return p ? p.id.replace(/^page-/, '') : ''; }
  function sleep(ms) { return new Promise(function (r) { w.setTimeout(r, ms); }); }
  function ok(msg) { return { ok: true, msg: msg }; }
  function no(msg) { return { ok: false, msg: msg }; }
  function waitFor(test) {
    return new Promise(function (resolve) {
      var n = 0; (function tick() { var v; try { v = test(); } catch (e) { v = false; } if (v) return resolve(v); if (++n > 60) return resolve(false); w.setTimeout(tick, 100); })();
    });
  }
  async function open(id) {
    if (!byId('page-' + id)) return false;
    if (current() !== id) { w.CV.go(id); await sleep(250); }
    return current() === id;
  }
  function add(id, label, examples, pattern, run) { COMMANDS.push({ id: id, label: label, examples: examples, pattern: pattern, run: run }); }

  /* ---------- navigation ---------- */
  [['home', 'Trang chủ', 'trang chu|home'], ['poster', 'Poster Studio', 'poster( studio)?'],
    ['videoEngine', 'Video Engine', 'video( engine)?|dung video'], ['pixelStudio', 'Pixel Atelier', 'pixel( atelier)?|sua anh'],
    ['colorStudio', 'Luma Develop', 'luma( develop)?|chinh mau anh'], ['clarityLab', 'Clarity Lab', 'clarity( lab)?|lam net( anh)?'],
    ['layoutFoundry', 'Dàn trang', 'dan trang|layout( foundry)?'], ['assets', 'Tài nguyên', 'tai nguyen|kho anh|assets?'],
    ['templates', 'Thư viện mẫu', '(thu vien )?mau|templates?'], ['settings', 'Cài đặt', 'cai dat|settings?'],
    ['autodesign', 'Auto Design', 'auto design|tao website'], ['cvstudio', 'CV Studio', 'cv( studio)?'],
    ['export', 'Trung tâm xuất', 'trung tam xuat'], ['motion', 'Motion Lab', 'motion( lab)?|chuyen dong']
  ].forEach(function (p) {
    add('go-' + p[0], 'Mở ' + p[1], ['mở ' + p[1]], new RegExp('^(mo|vao|chuyen (sang|den|toi)) (' + p[2] + ')$'), async function () {
      return await open(p[0]) ? ok('Đã mở ' + p[1]) : no('Chưa mở được ' + p[1]);
    });
  });

  /* ---------- poster ---------- */
  function poster() { return w.CV && w.CV.poster; }
  async function onPoster() { return await open('poster') && !!(await waitFor(function () { return poster() && poster().doc; })); }
  function addLayer(type, name) {
    return async function () {
      if (!await onPoster()) return no('Poster Studio chưa sẵn sàng');
      var n = poster().doc.layers.length; poster().add(type);
      return poster().doc.layers.length === n + 1 ? ok('Đã thêm ' + name) : no('Chưa thêm được ' + name);
    };
  }
  add('p-text', 'Thêm chữ vào poster', ['thêm chữ', 'thêm tiêu đề'], /^(them|chen) (chu|tieu de|van ban|text)( (vao )?poster)?$/, addLayer('text', 'lớp chữ'));
  add('p-rect', 'Thêm khối chữ nhật', ['thêm khối', 'thêm hình chữ nhật'], /^(them|chen|ve) (khoi|hinh chu nhat|hinh vuong)$/, addLayer('rect', 'khối'));
  add('p-ellipse', 'Thêm hình tròn', ['thêm hình tròn'], /^(them|chen|ve) (hinh )?tron$/, addLayer('ellipse', 'hình tròn'));
  add('p-badge', 'Thêm nút kêu gọi', ['thêm nhãn', 'thêm nút'], /^(them|chen) (nhan|nut|cta|nut keu goi)$/, addLayer('badge', 'nhãn'));
  add('p-line', 'Thêm đường kẻ', ['thêm đường kẻ'], /^(them|chen|ke) (duong( ke)?|gach)$/, addLayer('line', 'đường kẻ'));
  add('p-image', 'Chèn ảnh vào poster', ['thêm ảnh'], /^(them|chen|tai) (anh|hinh anh)( len)?( (vao )?poster)?$/, async function () {
    if (!await onPoster()) return no('Poster Studio chưa sẵn sàng');
    var input = byId('posterImgInput'); if (!input) return no('Không thấy nút chọn ảnh');
    input.click(); return ok('Hãy chọn ảnh trong hộp thoại');
  });
  [['portrait', '4:5', '4 ?[:x] ?5|doc'], ['square', '1:1', '1 ?[:x] ?1|vuong'], ['landscape', '3:2', '3 ?[:x] ?2|ngang'], ['a4', 'A4', 'a4'], ['story', '9:16', '9 ?[:x] ?16|story']
  ].forEach(function (r) {
    add('p-ratio-' + r[0], 'Đổi khổ poster sang ' + r[1], ['đổi sang ' + r[1]], new RegExp('^((doi|chuyen)( (kho|ti le|ty le|kich thuoc))?( (sang|thanh))?|kho|ti le|ty le) (' + r[2] + ')$'), async function () {
      if (!await onPoster()) return no('Poster Studio chưa sẵn sàng');
      if (poster().doc.ratio === r[0]) return ok('Poster đã ở khổ ' + r[1]);
      poster().setRatio(r[0]); var sel = byId('posterRatio'); if (sel) sel.value = r[0];
      return poster().doc.ratio === r[0] ? ok('Đã đổi sang ' + r[1]) : no('Chưa đổi được khổ');
    });
  });
  function onSelected(id, label, examples, pattern, method, done) {
    add(id, label, examples, pattern, async function () {
      if (!await onPoster()) return no('Poster Studio chưa sẵn sàng');
      if (!poster().selected) return no('Hãy chọn một đối tượng trên poster trước');
      poster()[method](); return ok(done);
    });
  }
  onSelected('p-dup', 'Nhân bản đối tượng đang chọn', ['nhân bản'], /^(nhan ban|nhan doi|duplicate)( doi tuong| lop)?$/, 'duplicate', 'Đã nhân bản');
  onSelected('p-del', 'Xoá đối tượng đang chọn', ['xoá đối tượng'], /^(xoa|bo) (doi tuong|lop|lop dang chon)$/, 'remove', 'Đã xoá. Gõ “hoàn tác” để lấy lại');
  onSelected('p-front', 'Đưa lên trước', ['đưa lên trước'], /^(dua )?len (tren( cung)?|truoc|dau)$/, 'front', 'Đã đưa lên trước');
  onSelected('p-back', 'Đưa xuống sau', ['đưa xuống sau'], /^(dua )?(xuong|ra) (duoi( cung)?|sau|cuoi)$/, 'back', 'Đã đưa xuống sau');
  function posterCall(id, label, examples, pattern, fn, done) {
    add(id, label, examples, pattern, async function () {
      if (!await onPoster()) return no('Poster Studio chưa sẵn sàng');
      fn(poster()); return ok(done);
    });
  }
  posterCall('p-grid', 'Bật hoặc tắt lưới', ['bật lưới', 'tắt lưới'], /^(bat\/tat |bat |tat )?luoi$/, function (p) { p.toggleGrid(); }, 'Đã đổi trạng thái lưới');
  posterCall('p-snap', 'Bật hoặc tắt căn lề', ['căn lề'], /^(bat |tat )?(can le|snap)$/, function (p) { p.toggleSnap(); }, 'Đã đổi trạng thái căn lề');
  posterCall('p-zin', 'Phóng to khung', ['phóng to'], /^(phong to|zoom in)( khung)?$/, function (p) { p.zoom(0.1); }, 'Đã phóng to');
  posterCall('p-zout', 'Thu nhỏ khung', ['thu nhỏ'], /^(thu nho|zoom out)( khung)?$/, function (p) { p.zoom(-0.1); }, 'Đã thu nhỏ');
  posterCall('p-fit', 'Vừa khung nhìn', ['vừa khung'], /^(vua khung|vua man hinh|fit)$/, function (p) { p.zoomFit(); }, 'Đã chỉnh vừa khung');
  posterCall('p-qa', 'Kiểm tra chất lượng poster', ['kiểm tra poster'], /^(kiem tra|soat)( (chat luong|poster|thiet ke))$/, function (p) { p.qa(); }, 'Đã kiểm tra thiết kế');
  add('p-new', 'Tạo thiết kế poster mới', ['poster mới'], /^((tao )?(poster|thiet ke) moi|tao poster)$/, async function () {
    if (!await onPoster()) return no('Poster Studio chưa sẵn sàng');
    if (!w.confirm('Tạo thiết kế mới sẽ thay khung đang mở. Tiếp tục?')) return no('Đã huỷ, thiết kế được giữ nguyên');
    poster().newDesign(); return ok('Đã tạo thiết kế mới');
  });

  /* ---------- exports: press the editor's own button ---------- */
  function press(selector, textPattern) {
    var page = byId('page-' + current()); if (!page) return false;
    var list = Array.prototype.slice.call(page.querySelectorAll(selector));
    var b = textPattern ? list.find(function (n) { return textPattern.test(norm(n.textContent)); }) : list[0];
    if (!b || b.disabled) return false; b.click(); return true;
  }
  var PREFIX = { pixelStudio: 'px', colorStudio: 'cl', clarityLab: 'cy', layoutFoundry: 'lf' };
  add('x-png', 'Xuất PNG', ['xuất PNG'], /^(xuat|tai)( (file|anh))? png$/, async function () {
    var c = current();
    if (PREFIX[c] && c !== 'layoutFoundry') return press('[data-' + PREFIX[c] + '="export"]') ? ok('Đã gọi xuất PNG') : no('Hãy mở ảnh trước khi xuất');
    if (!await onPoster()) return no('Poster Studio chưa sẵn sàng');
    return press('button', /^(⇧ ?)?(xuat )?png$/) ? ok('Đã gọi xuất PNG') : no('Không thấy nút Xuất PNG');
  });
  add('x-svg', 'Xuất SVG poster', ['xuất SVG'], /^(xuat|tai)( file)? svg$/, async function () {
    if (!await onPoster()) return no('Poster Studio chưa sẵn sàng');
    return press('button', /^(⇧ ?)?(xuat )?svg$/) ? ok('Đã gọi xuất SVG') : no('Không thấy nút Xuất SVG');
  });
  add('x-pdf', 'Xuất PDF', ['xuất PDF'], /^(xuat|tai|in)( file)? pdf$/, async function () {
    if (current() === 'layoutFoundry') return press('[data-lf="pdf"]') ? ok('Đã mở xuất PDF') : no('Không thấy nút PDF');
    if (!await onPoster()) return no('Poster Studio chưa sẵn sàng');
    return press('button', /pdf/) ? ok('Đã gọi xuất PDF') : no('Không thấy nút Xuất PDF');
  });

  /* ---------- video ---------- */
  function video() { return w.CV && w.CV.engines && w.CV.engines.video; }
  async function onVideo() { return await open('videoEngine') && !!(await waitFor(function () { return video() && video()._state; })); }
  function videoCall(id, label, examples, pattern, method, done) {
    add(id, label, examples, pattern, async function () {
      if (!await onVideo() || typeof video()[method] !== 'function') return no('Video Engine chưa sẵn sàng');
      var r = await video()[method](); return r === false ? no('Chưa thực hiện được. Hãy xem thông báo trong Video Engine') : ok(done);
    });
  }
  videoCall('v-text', 'Thêm chữ vào video', ['thêm chữ vào video'], /^(them|chen) (chu|track chu|text) (vao )?video$/, 'addText', 'Đã thêm clip chữ');
  videoCall('v-play', 'Phát video', ['phát video'], /^(phat|chay|play)( video)?$/, 'play', 'Đang phát');
  videoCall('v-pause', 'Dừng video', ['dừng video'], /^(dung|tam dung|pause|stop)( video| phat)$|^(tam dung|pause)$/, 'pause', 'Đã dừng');
  videoCall('v-split', 'Tách clip đang chọn', ['tách clip'], /^(tach|cat|chia) (clip|doan)$/, 'split', 'Đã tách clip');
  videoCall('v-remove', 'Xoá clip đang chọn', ['xoá clip'], /^(xoa|bo) clip( dang chon)?$/, 'remove', 'Đã xoá clip. Gõ “hoàn tác” để lấy lại');
  videoCall('v-webm', 'Xuất video WebM', ['xuất WebM'], /^(xuat|tai) (video )?webm$/, 'exportWebM', 'Đã bắt đầu xuất WebM');
  videoCall('v-mp4', 'Xuất video MP4', ['xuất MP4'], /^(xuat|tai) (video )?mp4$/, 'exportMP4', 'Đã bắt đầu xuất MP4');
  videoCall('v-srt', 'Xuất phụ đề SRT', ['xuất SRT'], /^(xuat|tai) (phu de|srt|phu de srt)$/, 'srtExport', 'Đã xuất phụ đề');

  /* ---------- image and document editors ---------- */
  [['i-rotate', 'pixelStudio', 'rotate', 'Xoay ảnh 90°', ['xoay ảnh'], /^xoay( anh)?( 90( do)?)?$/],
    ['i-flip', 'pixelStudio', 'flip', 'Lật ảnh ngang', ['lật ảnh'], /^lat( anh)?( ngang)?$/],
    ['i-auto', 'colorStudio', 'auto', 'Tự chỉnh màu ảnh', ['tự chỉnh màu'], /^(tu dong |tu )(chinh|can) mau( anh)?$/],
    ['i-removebg', 'clarityLab', 'removeBg', 'Tách nền theo màu', ['tách nền'], /^(tach|xoa) (nen|phong)( anh)?$/],
    ['l-page', 'layoutFoundry', 'page', 'Thêm trang tài liệu', ['thêm trang'], /^(them|tao) trang( moi)?$/],
    ['l-heading', 'layoutFoundry', 'heading', 'Thêm tiêu đề tài liệu', ['thêm tiêu đề trang'], /^(them|chen) tieu de (trang|tai lieu)$/],
    ['l-table', 'layoutFoundry', 'table', 'Thêm bảng', ['thêm bảng'], /^(them|chen) bang$/]
  ].forEach(function (c) {
    add(c[0], c[3], c[4], c[5], async function () {
      var sel = '[data-' + PREFIX[c[1]] + '="' + c[2] + '"]';
      if (!await open(c[1]) || !await waitFor(function () { return byId('page-' + c[1]).querySelector(sel); })) return no('Công cụ chưa sẵn sàng');
      return press(sel) ? ok('Đã chạy: ' + c[3]) : no('Hãy mở ảnh hoặc tài liệu trước');
    });
  });

  /* ---------- everywhere ---------- */
  function historyStep(redo) {
    return async function () {
      var c = current(), done = false;
      if (c === 'poster' && poster()) { poster().history[redo ? 'redo' : 'undo'](); done = true; }
      else if (c === 'videoEngine' && video()) done = video()[redo ? 'redo' : 'undo']() !== false;
      else if (c === 'pixelStudio') done = press('[data-px="' + (redo ? 'redo' : 'undo') + '"]');
      return done ? ok(redo ? 'Đã làm lại' : 'Đã hoàn tác') : no('Trang này không có bước nào để ' + (redo ? 'làm lại' : 'hoàn tác'));
    };
  }
  add('g-undo', 'Hoàn tác', ['hoàn tác'], /^(hoan tac|undo|quay lai buoc truoc)$/, historyStep(false));
  add('g-redo', 'Làm lại', ['làm lại'], /^(lam lai|redo)$/, historyStep(true));
  add('g-save', 'Lưu dự án', ['lưu'], /^(luu|save)( du an| lai)?$/, async function () {
    var c = current();
    if (c === 'videoEngine' && video()) { video().save(); return ok('Đã lưu video'); }
    if (PREFIX[c]) return press('[data-' + PREFIX[c] + '="asset"]') ? ok('Đã lưu vào Tài nguyên') : no('Chưa có gì để lưu');
    if (w.CV.project && w.CV.project.save) { w.CV.project.save(true); return ok('Đã lưu dự án'); }
    return no('Chưa có dự án để lưu');
  });
  add('g-theme', 'Đổi giao diện sáng / tối', ['giao diện tối'], /^((doi |bat )?(giao dien|che do) (sang|toi|sang toi)|doi theme)$/, async function (text) {
    var b = byId('l38-theme'); if (!b) return no('Không thấy nút đổi giao diện');
    var root = d.documentElement, want = / toi$/.test(text) && !/sang toi$/.test(text) ? 'dark' : / sang$/.test(text) ? 'light' : '';
    if (want && (root.getAttribute('data-theme') === 'dark') === (want === 'dark')) return ok('Giao diện đã đúng chế độ');
    b.click(); return ok('Đã đổi giao diện');
  });
  add('g-focus', 'Chế độ tập trung', ['tập trung'], /^((bat|tat) )?(che do )?tap trung$/, async function () {
    return press('[data-cv236-action="focus"]') ? ok('Đã đổi chế độ tập trung') : no('Hãy mở một editor trước');
  });
  add('g-guide', 'Hướng dẫn nhanh editor', ['hướng dẫn'], /^(huong dan|tro giup|help)$/, async function () {
    return press('[data-cv236-action="guide"]') ? ok('Đã mở hướng dẫn') : (await open('settings') && await open('guide') ? ok('Đã mở hướng dẫn') : no('Hãy mở một editor trước'));
  });

  /* ---------- matching ---------- */
  function match(text) { var q = clean(text); if (!q) return null; return COMMANDS.find(function (c) { return c.pattern.test(q); }) || null; }
  function suggest(text, limit) {
    var q = clean(text); if (q.length < 2) return [];
    return COMMANDS.filter(function (c) { return c.examples.some(function (x) { return norm(x).indexOf(q) === 0; }); }).slice(0, limit || 4);
  }
  function recent() { try { var a = JSON.parse(w.localStorage.getItem(KEY) || '[]'); return Array.isArray(a) ? a.filter(function (x) { return typeof x === 'string'; }).slice(0, 3) : []; } catch (e) { return []; } }
  function remember(text) { try { w.localStorage.setItem(KEY, JSON.stringify([text].concat(recent().filter(function (x) { return x !== text; })).slice(0, 3))); } catch (e) { /* storage is optional */ } }
  function toast(m) { if (w.CV && w.CV.toast) w.CV.toast(m); }
  var busy = false;
  async function run(text) {
    var c = match(text); if (!c) return no('Chưa hiểu lệnh này');
    if (busy) return no('Đang chạy lệnh trước');
    busy = true; var r;
    try { r = await c.run(clean(text)); } catch (e) { r = no('Lệnh chưa hoàn tất. Hãy thử lại'); }
    busy = false; if (r.ok) remember(String(text).trim()); return r;
  }

  /* ---------- palette rows ---------- */
  function row(list, before, label, hint, text) {
    var n = d.createElement('div'); n.className = 'palItem l237'; n.setAttribute('role', 'button');
    n.innerHTML = '<span class="pi">▶</span><span>' + esc(label) + '</span><small>' + esc(hint) + '</small>';
    n.dataset.cv237 = text;
    n.addEventListener('click', function () { w.CV.palette.close(); run(text).then(function (r) { toast(r.msg); }); });
    list.insertBefore(n, before); return n;
  }
  function decorate(query) {
    var list = byId('paletteList'); if (!list) return;
    var q = String(query || '').trim(), first = list.firstChild, rows = [], exact = match(q);
    if (!q) recent().forEach(function (t) { if (match(t)) rows.push(row(list, first, t, 'Lệnh gần đây', t)); });
    else if (exact) rows.push(row(list, first, exact.label, 'Enter để chạy', q));
    else suggest(q).forEach(function (c) { rows.push(row(list, first, c.label, 'Gợi ý lệnh', c.examples[0])); });
    if (rows.length && q) {
      var empty = list.querySelector('.emptyState'); if (empty) empty.remove();
      list.querySelectorAll('.palItem.on').forEach(function (n) { n.classList.remove('on'); });
      rows[0].classList.add('on');
    }
  }
  function install() {
    if (installed) return true;
    var input = byId('paletteInput');
    if (!input || !w.CV || !w.CV.palette || !w.CV.palette.render) return false;
    var css = d.createElement('style'); css.id = 'canvio-p237-css';
    css.textContent = '.palItem.l237{cursor:pointer}.palItem.l237 .pi{color:var(--cv-accent,#F83E9F)}.palItem.l237.on{background:var(--cv-accent-soft,var(--surface-3));box-shadow:inset 3px 0 0 var(--cv-accent,#F83E9F)}';
    d.head.appendChild(css);
    var base = w.CV.palette.render;
    w.CV.palette.render = function (q) { var r = base.apply(this, arguments); decorate(q); return r; };
    input.placeholder = 'Gõ lệnh: “thêm chữ”, “đổi sang 9:16”, “xuất PNG”, “mở video”…';
    /* window capture runs before the older palette key handlers, so a recognised command runs exactly once */
    w.addEventListener('keydown', function (e) {
      if (e.target !== input || e.key !== 'Enter' || e.isComposing) return;
      var list = byId('paletteList'), on = list && list.querySelector('.palItem.on');
      var text = match(input.value) && (!on || on.classList.contains('l237')) ? (on ? on.dataset.cv237 : input.value) : (on && on.classList.contains('l237') ? on.dataset.cv237 : '');
      if (!text) return;
      e.preventDefault(); e.stopImmediatePropagation(); w.CV.palette.close(); input.blur();
      run(text).then(function (r) { toast(r.msg); });
    }, true);
    installed = true; return true;
  }
  function start() { var n = 0; (function retry() { if (!install() && ++n < 100) w.setTimeout(retry, 200); })(); }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', start, { once: true }); else start();

  w.CVCommandP237 = {
    version: '237.1.0', match: function (t) { var c = match(t); return c ? c.id : null; }, run: run, suggest: function (t) { return suggest(t).map(function (c) { return c.id; }); },
    list: function () { return COMMANDS.map(function (c) { return { id: c.id, label: c.label, example: c.examples[0] }; }); },
    tests: function () { return { installed: installed, atLeast30: COMMANDS.length >= 30, uniqueIds: new Set(COMMANDS.map(function (c) { return c.id; })).size === COMMANDS.length, everyExampleResolves: COMMANDS.every(function (c) { return c.examples.every(function (x) { return match(x) === c; }); }) }; }
  };
})(window, document);
