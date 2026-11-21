/* P144 · Command Palette mở rộng + phím tắt toàn cục + trợ giúp theo ngữ cảnh.
   Additive: bọc CV.palette.build (thêm lệnh cho các công cụ mới, đưa lệnh dùng gần đây lên đầu), thêm phím Alt+Shift+<chữ> chuyển trang, F1 mở trợ giúp của trang đang xem.
   Lệnh chỉ điều hướng/đưa tới thẻ công cụ; chỉ các lệnh chỉ-đọc (phân tích, đo) mới tự chạy, không lệnh nào tự sửa timeline. */
(function () {
'use strict';
if (window.CVUxP144) return;
var RECENT_KEY = 'canvio144:recent', MAX_RECENT = 5;
var CMDS = [
  { label: 'Video: Phân tích chất lượng timeline (nhịp, thời lượng cảnh, chữ)', hint: 'Video', icon: '◑', page: 'videoEngine', sel: '#cv127-quality', run: '#cv127q-run' },
  { label: 'Video: Đo độ to LUFS clip đang chọn', hint: 'Video', icon: '♪', page: 'videoEngine', sel: '#cv127l-run' },
  { label: 'Video: Khử ồn clip đang chọn', hint: 'Video', icon: '♪', page: 'videoEngine', sel: '#cv138-run' },
  { label: 'Video: Thêm SFX (whoosh, hit, riser, click)', hint: 'Video', icon: '♫', page: 'videoEngine', sel: '#cv145s-kind' },
  { label: 'Video: Mẫu dàn dựng Short, Reel, YouTube, Recap', hint: 'Video', icon: '▤', page: 'videoEngine', sel: '#cv127t-row button' },
  { label: 'Video: Xuất GIF động từ timeline', hint: 'Video', icon: '⇪', page: 'videoEngine', sel: '#cv132-gif' },
  { label: 'Video: Đo màu histogram, waveform, vectorscope', hint: 'Video', icon: '◐', page: 'videoEngine', sel: '#cv134-run', run: '#cv134-run' },
  { label: 'Web: Web cuộn từ video (xuất HTML offline)', hint: 'Website', icon: '◈', page: 'webEngine', sel: '#cv125-card' },
  { label: 'Ảnh: Chuyển ảnh sang vector SVG (Image Trace)', hint: 'Ảnh', icon: '✎', page: 'imageStudio', sel: '#cv136-card' },
  { label: 'Tài nguyên: Tạo biểu đồ từ CSV', hint: 'Tài nguyên', icon: '▥', page: 'assets', sel: '#cv140-card' },
  { label: 'Tài nguyên: Giấy phép, credit và báo cáo', hint: 'Tài nguyên', icon: '§', page: 'assets', sel: '#cv145-card' },
  { label: 'Tài nguyên: Kiểm font tiếng Việt, data merge CSV', hint: 'Tài nguyên', icon: 'Ǻ', page: 'assets', sel: '#cv145-font' },
  { label: 'Cài đặt: Bộ nhớ và phục hồi sự cố', hint: 'Hệ thống', icon: '⛁', page: 'settings', sel: '#cv133-card' },
  { label: 'Hệ thống: Lưu bản phục hồi ngay', hint: 'Hành động', icon: '⛁', page: 'settings', sel: '#cv133-now', run: '#cv133-now' },
  { label: 'Trợ giúp: Phím tắt và mẹo của trang này (F1)', hint: 'Trợ giúp', icon: '?', help: true },
  { label: 'Trợ giúp: Xem lại hướng dẫn nhanh', hint: 'Trợ giúp', icon: '?', tour: true }
];
var NAV = { v: 'videoEngine', w: 'webEngine', p: 'poster', a: 'assets', i: 'imageStudio', h: 'home', s: 'settings', d: 'designEngine' };
var NAV_LABEL = { v: 'Video Engine', w: 'Website Engine', p: 'Poster', a: 'Tài nguyên', i: 'Image Studio', h: 'Trang chủ', s: 'Cài đặt', d: 'Design Engine' };
var TIPS = {
  home: ['Ctrl+K: tìm trang, mẫu và hành động.', 'Chọn Hub hoặc Studio phù hợp; mở hướng dẫn nhanh để xem luồng bắt đầu.'],
  creativeHub: ['Hub là điểm vào các workspace; dùng Studio Switcher để đổi nhóm công việc.', 'Gần đây và Đã gắn sao dùng trạng thái hiện có; dữ liệu dự án vẫn do Project Center/Project Vault quản lý.'],
  poster: ['T chữ · R khối · C hình tròn · L đường kẻ.', 'Ctrl+D nhân đôi · [ ] đổi lớp · Ctrl +/−/0 phóng to, thu nhỏ, vừa khung.', 'Ctrl+S lưu, Ctrl+Z hoàn tác.'],
  designEngine: ['Chọn đối tượng để chỉnh thuộc tính; Ctrl+Z hoàn tác.', 'Kiểm tra lớp đang khóa/ẩn trước khi sửa; lưu và mở lại dự án để xác nhận.'],
  layoutFoundry: ['Chọn master/layout phù hợp rồi áp dụng cho trang hiện tại.', 'Kiểm tra lề, phân cấp chữ và bản in; preflight trong app không thay thế kiểm tra PDF/X, CMYK hoặc bản in vật lý.'],
  vectorForge: ['Dùng Ảnh → Vector/Trace cho logo và hình ít màu; kiểm tra preview trước khi lưu SVG.', 'Giảm số màu/độ chi tiết để giữ SVG nhẹ; mở file xuất bằng trình duyệt khác để rà lại.'],
  autodesign: ['Viết brief rõ mục tiêu, đối tượng, kích thước và phong cách trước khi tạo bản nháp.', 'Provider AI chỉ chạy khi bạn chủ động dùng dịch vụ; kiểm tra quyền sử dụng và nguồn asset trước khi xuất.'],
  cvstudio: ['Điền thông tin cá nhân, kinh nghiệm và kỹ năng; kiểm tra lỗi chính tả và thứ tự thời gian.', 'Xem trước A4 và in thử; luồng xuất CV hiện có là owner chuẩn, không coi preflight là chứng nhận PDF/X.'],
  web: ['Dựng trang từ các block hiện có, sắp xếp thứ tự và kiểm tra nội dung trên màn hình hẹp.', 'Lưu trong Website Engine hiện tại; mở bản HTML xuất ở tab/trình duyệt khác để kiểm tra.'],
  webEngine: ['Kéo thả block để dựng trang; Xuất HTML để lấy tệp.', 'Thẻ Web cuộn từ video tạo trang cuộn tới đâu video chạy tới đó.', 'Auto Layout chèn preset vào GrapesJS hiện tại; chỉnh sửa trực tiếp trong editor rồi lưu.'],
  portfolioStudio: ['Sắp xếp dự án theo vai trò, kết quả và hình ảnh minh họa; ưu tiên case study có số liệu kiểm chứng.', 'Kiểm tra quyền sử dụng ảnh/logo và mở lại dự án sau khi lưu để xác nhận gallery.'],
  hrvisual: ['Chọn đúng ngữ cảnh tuyển dụng/đào tạo/nội bộ và giữ thông tin nhân sự chính xác.', 'Kiểm tra logo, màu thương hiệu, quyền dùng ảnh và khả năng đọc trên điện thoại.'],
  pixelStudio: ['Làm việc theo lưới pixel; giữ kích thước canvas và palette nhất quán.', 'Phóng to khi chỉnh pixel, thu nhỏ để kiểm tra hình tổng thể trước khi xuất.'],
  colorStudio: ['Điều chỉnh màu/độ sáng từng bước và so sánh trước–sau.', 'Không kéo highlight/shadow quá mức; kiểm tra ảnh trên màn hình khác trước khi bàn giao.'],
  clarityLab: ['Dùng tăng nét/khử nhiễu vừa phải; giữ bản gốc để đối chiếu.', 'Phóng to 100% để rà halo, bệt chi tiết và artefact trước khi xuất.'],
  imageStudio: ['Thẻ Ảnh → Vector đổi logo, icon, hình ít màu thành SVG.', 'Giảm số màu hoặc chọn Chi tiết thấp để tệp nhẹ hơn; kiểm tra SVG an toàn trước khi dùng.'],
  artcraft: ['Chọn asset/kiểu minh họa theo mục tiêu thiết kế; kiểm tra độ tương phản và tính nhất quán.', 'Gắn nguồn/giấy phép cho tài nguyên trước khi công bố hoặc chuyển giao.'],
  capcutEngine: ['Đây là bảng điều phối CapCut, không phải timeline độc lập.', 'Mở Video Engine để chỉnh clip trên timeline chuẩn; media, undo và export vẫn thuộc engine hiện hữu.'],
  videoEngine: ['Thêm clip bằng nút nhập media, kéo thanh tua để xem khung.', 'Thẻ Chất lượng: phân tích nhịp, đo LUFS, khử ồn, Auto Reframe, proxy, SFX, GIF và đo màu.', 'Mọi thao tác thêm clip tạo clip mới và giữ bản gốc; dùng Ctrl+Z khi cần hoàn tác.'],
  motionLab: ['Chọn preset chuyển động rồi xem thử trên đối tượng đang chọn.', 'Tôn trọng reduced-motion và kiểm tra tốc độ/độ dài trước khi xuất.'],
  videoStudio: ['Lập kịch bản, shot list và thứ tự cảnh trước khi dựng.', 'Chuyển media sang Video Engine để chỉnh timeline; không tạo timeline thứ hai trong Studio này.'],
  shotcraft: ['Mô tả góc máy, cỡ cảnh, chuyển động và mục tiêu của từng shot.', 'Giữ shot list khớp footage thực tế; không coi storyboard là tracking hay render video tự động.'],
  motion: ['Chọn motion preset phù hợp nội dung và thời lượng.', 'Kiểm tra keyframe trên timeline Video Engine; preset không thay thế thao tác chỉnh clip gốc.'],
  motionCut: ['MotionCut là luồng phụ/handoff; Video Engine vẫn là timeline chuẩn.', 'Nhập media qua engine hiện có và xác nhận mapping clip trước khi tiếp tục chỉnh sửa.'],
  assets: ['Tải ảnh/logo vào kho; gắn giấy phép để có báo cáo và credit.', 'Biểu đồ CSV và data merge nằm trong Asset Library; kiểm tra nguồn và quyền dùng trước khi công bố.'],
  projects: ['Project Center quản lý brief, tiến độ và trạng thái công việc.', 'Project Vault là nơi lưu/mở snapshot editor; hai khu vực có vai trò khác nhau.'],
  projectVault: ['Tạo snapshot có tên trước thay đổi lớn; dùng restore point khi cần quay lại.', 'Backup/restore phải được kiểm tra trên bản sao; không xóa dữ liệu cũ khi chưa xác minh bản phục hồi.'],
  export: ['Chọn đúng định dạng và kiểm tra codec/kích thước thực tế sau khi xuất.', 'Dùng File QC và công cụ độc lập để mở thử artifact; Blob được tạo không đồng nghĩa file đã đạt chuẩn.'],
  object: ['Kiểm tra mô hình 3D, camera và khả năng tải asset trước khi chia sẻ.', 'Offline OBJ viewer chỉ bao phủ profile hình học được hỗ trợ; không mặc định hỗ trợ GLTF/FBX đầy đủ.'],
  entry: ['Bắt đầu từ Hub hoặc chọn Studio theo loại sản phẩm cần làm.', 'Nếu chưa biết công cụ, dùng Ctrl+K tìm tính năng hoặc F1 để xem mẹo của trang.'],
  settings: ['Thẻ Bộ nhớ & phục hồi cho biết dung lượng và các bản tự lưu.', 'Nếu app đóng đột ngột, lần mở sau có thể xuất hiện thanh khôi phục; hãy xem nội dung trước khi xác nhận.']
};
function lsGet(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
function pushRecent(list, label, max) { var out = [label].concat((list || []).filter(function (x) { return x !== label; })); return out.slice(0, max || MAX_RECENT); }
function reorder(items, recent) { var rank = {}; (recent || []).forEach(function (l, i) { rank[l] = i; }); var hot = items.filter(function (it) { return rank[it.label] != null; }).sort(function (a, b) { return rank[a.label] - rank[b.label]; }); return hot.concat(items.filter(function (it) { return rank[it.label] == null; })); }
function currentPage() { var a = document.querySelector('.page.active'); return a && a.id ? a.id.replace(/^page-/, '') : 'home'; }
function waitFor(sel, ms) { return new Promise(function (ok) { var t0 = Date.now(); (function poll() { var el = document.querySelector(sel); if (el) return ok(el); if (Date.now() - t0 > (ms || 2500)) return ok(null); setTimeout(poll, 80); })(); }); }
function reveal(el) {
  if (!el) return; try { el.scrollIntoView({ block: 'center', behavior: window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); } catch (e) { el.scrollIntoView(); }
  var f = /^(button|input|select|textarea|a)$/i.test(el.tagName) ? el : el.querySelector('button,input,select,textarea,a[href]'); if (f) try { f.focus({ preventScroll: true }); } catch (e) {}
  var host = el.closest('.card') || el, prev = host.style.boxShadow; host.style.transition = 'box-shadow .3s'; host.style.boxShadow = '0 0 0 3px #2563eb66'; setTimeout(function () { host.style.boxShadow = prev; }, 1400);
}
function runCmd(c) {
  if (c.help) { openHelp(); return; }
  if (c.tour) { setTimeout(function () { startTour(true); }, 150); return; }
  if (window.CV && CV.go) CV.go(c.page);
  waitFor(c.sel).then(function (el) { reveal(el); if (c.run) { var b = document.querySelector(c.run); if (b && !b.disabled) b.click(); } });
}
function wrapPalette() {
  var P = window.CV && CV.palette; if (!P || P.__p144 || typeof P.build !== 'function') return false;
  var orig = P.build; P.__p144 = true;
  P.build = function () {
    var out = orig.apply(this, arguments) || [], have = {}; out.forEach(function (it) { have[it.label] = 1; });
    CMDS.forEach(function (c) { if (!have[c.label]) out.push({ label: c.label, hint: c.hint, icon: c.icon, run: function () { runCmd(c); } }); });
    out.forEach(function (it) { if (!it.__w) { var r = it.run; it.__w = 1; it.run = function () { try { lsSet(RECENT_KEY, pushRecent(lsGet(RECENT_KEY, []), it.label)); } catch (e) {} return r.apply(this, arguments); }; } });
    return reorder(out, lsGet(RECENT_KEY, []));
  };
  return true;
}
/* ---- help panel ---- */
var helpEl = null, lastFocus = null;
function openHelp() {
  closeHelp(); lastFocus = document.activeElement; var pg = currentPage(), tips = TIPS[pg] || ['Dùng Ctrl+K để tìm mọi chức năng.'];
  helpEl = document.createElement('div'); helpEl.id = 'cv144-help'; helpEl.setAttribute('role', 'dialog'); helpEl.setAttribute('aria-modal', 'true'); helpEl.setAttribute('aria-label', 'Trợ giúp');
  helpEl.style.cssText = 'position:fixed;inset:0;z-index:2147483100;background:rgba(15,23,42,.55);display:grid;place-items:center;padding:16px';
  var rows = Object.keys(NAV).map(function (k) { return '<div style="display:flex;justify-content:space-between;gap:12px"><span>' + NAV_LABEL[k] + '</span><kbd style="background:#e2e8f0;border-radius:5px;padding:1px 6px;font-size:12px">Alt+Shift+' + k.toUpperCase() + '</kbd></div>'; }).join('');
  helpEl.innerHTML = '<div style="background:#fff;color:#0f172a;border-radius:16px;max-width:520px;width:100%;max-height:86vh;overflow:auto;padding:18px 20px;font:14px/1.5 system-ui,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.4)"><div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:16px">Trợ giúp · ' + (document.title && pg === 'home' ? 'Trang chủ' : pg) + '</b><button type="button" id="cv144-x" aria-label="Đóng" style="border:0;background:#e2e8f0;border-radius:8px;padding:4px 10px;cursor:pointer">Đóng</button></div><h4 style="margin:12px 0 4px">Mẹo cho trang này</h4><ul style="margin:0;padding-left:18px">' + tips.map(function (t) { return '<li>' + t.replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }) + '</li>'; }).join('') + '</ul><h4 style="margin:12px 0 4px">Phím tắt toàn cục</h4><div style="display:grid;gap:4px"><div style="display:flex;justify-content:space-between"><span>Tìm lệnh, trang, công cụ</span><kbd style="background:#e2e8f0;border-radius:5px;padding:1px 6px;font-size:12px">Ctrl/⌘ K</kbd></div><div style="display:flex;justify-content:space-between"><span>Bảng phím tắt đầy đủ</span><kbd style="background:#e2e8f0;border-radius:5px;padding:1px 6px;font-size:12px">?</kbd></div><div style="display:flex;justify-content:space-between"><span>Trợ giúp trang này</span><kbd style="background:#e2e8f0;border-radius:5px;padding:1px 6px;font-size:12px">F1</kbd></div>' + rows + '</div></div>';
  document.body.appendChild(helpEl);
  var x = helpEl.querySelector('#cv144-x'); x.focus();
  helpEl.addEventListener('click', function (e) { if (e.target === helpEl || e.target === x) closeHelp(); });
  helpEl.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.stopPropagation(); closeHelp(); } else if (e.key === 'Tab') { e.preventDefault(); x.focus(); } });
}
function closeHelp() { if (helpEl) { helpEl.remove(); helpEl = null; if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) {} } }
/* ---- hướng dẫn lần đầu ---- */
var TOUR_KEY = 'canvio144:tour', tourEl = null, tourIdx = 0, tourLast = null;
var STEPS = [
  { sel: null, title: 'Chào mừng đến CANVIO', text: 'Poster, website, video, CV 3D và nhiều công cụ trong một nơi. Hướng dẫn 4 bước, bỏ qua bất cứ lúc nào.' },
  { sel: '.qbar', title: 'Tìm mọi thứ bằng Ctrl+K', text: 'Gõ tên trang, công cụ hoặc hành động (ví dụ "gif", "poster", "khử ồn") rồi nhấn Enter.' },
  { sel: '.cvQuick, [data-go="poster"]', title: 'Bắt đầu từ đây', text: 'Chọn một thẻ để mở Studio tương ứng. Mọi thao tác thêm vào dự án đều hoàn tác được bằng Ctrl+Z.' },
  { sel: null, title: 'Luôn có trợ giúp và an toàn', text: 'F1 mở mẹo của trang đang xem. Alt+Shift+V/W/P/A chuyển trang nhanh. App tự lưu bản phục hồi mỗi 30 giây.' }
];
function tourDone() { return lsGet(TOUR_KEY, null) !== null; }
function closeTour(mark) { if (tourEl) { tourEl.remove(); tourEl = null; } if (tourLast) { tourLast.style.outline = tourLast.__o || ''; tourLast = null; } if (mark) lsSet(TOUR_KEY, { done: true, at: Date.now() }); }
function showStep() {
  var st = STEPS[tourIdx], target = st.sel ? document.querySelector(st.sel) : null, last = tourIdx === STEPS.length - 1;
  if (tourLast) { tourLast.style.outline = tourLast.__o || ''; tourLast = null; }
  if (target && target.getBoundingClientRect().width > 0) { tourLast = target; target.__o = target.style.outline; target.style.outline = '3px solid #2563eb'; try { target.scrollIntoView({ block: 'center' }); } catch (e) {} } else target = null;
  var card = tourEl.querySelector('.cv144-tc'), r = target ? target.getBoundingClientRect() : null;
  card.innerHTML = '<div style="font-size:12px;color:#64748b">Bước ' + (tourIdx + 1) + '/' + STEPS.length + '</div><b style="font-size:16px;display:block;margin:2px 0 6px">' + st.title + '</b><div>' + st.text + '</div><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px"><button type="button" data-a="skip" style="border:1px solid #cbd5e1;background:#fff;border-radius:8px;padding:6px 12px;cursor:pointer">Bỏ qua</button><button type="button" data-a="next" style="border:0;background:#2563eb;color:#fff;border-radius:8px;padding:6px 14px;cursor:pointer">' + (last ? 'Xong' : 'Tiếp') + '</button></div>';
  var w = 340, top, left;
  if (r) { left = Math.max(12, Math.min(innerWidth - w - 12, r.left)); top = r.bottom + 14 + 170 > innerHeight ? Math.max(12, r.top - 190) : r.bottom + 14; } else { left = Math.max(12, (innerWidth - w) / 2); top = Math.max(12, innerHeight / 2 - 90); }
  card.style.left = left + 'px'; card.style.top = top + 'px'; card.querySelector('[data-a=next]').focus();
}
function startTour(force) {
  if (tourEl) return; if (!force && tourDone()) return;
  if (window.CV && CV.go && currentPage() !== 'home') CV.go('home');
  tourIdx = 0; tourEl = document.createElement('div'); tourEl.id = 'cv144-tour'; tourEl.setAttribute('role', 'dialog'); tourEl.setAttribute('aria-label', 'Hướng dẫn nhanh');
  tourEl.style.cssText = 'position:fixed;inset:0;z-index:2147483050;pointer-events:none';
  tourEl.innerHTML = '<div class="cv144-tc" style="position:fixed;width:340px;max-width:92vw;box-sizing:border-box;background:#fff;color:#0f172a;border-radius:14px;padding:14px 16px;font:14px/1.5 system-ui,sans-serif;box-shadow:0 12px 40px rgba(15,23,42,.35);pointer-events:auto"></div>';
  document.body.appendChild(tourEl); showStep();
  tourEl.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('[data-a]'); if (!a) return; if (a.dataset.a === 'skip') closeTour(true); else if (tourIdx >= STEPS.length - 1) closeTour(true); else { tourIdx++; showStep(); } });
  tourEl.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.stopPropagation(); closeTour(true); } else if (e.key === 'Tab') { var b = tourEl.querySelectorAll('button'), f = b[0], l = b[b.length - 1]; if (e.shiftKey && document.activeElement === f) { e.preventDefault(); l.focus(); } else if (!e.shiftKey && document.activeElement === l) { e.preventDefault(); f.focus(); } } });
}
function autoTour() { try { if (navigator.webdriver || tourDone() || document.getElementById('cv133-banner')) return; setTimeout(function () { if (!tourDone() && !document.getElementById('cv133-banner') && !document.querySelector('#palette.open') && currentPage() === 'home') startTour(false); }, 3500); } catch (e) {} }
function typing(t) { var tg = (t && t.tagName || '').toLowerCase(); return tg === 'input' || tg === 'textarea' || tg === 'select' || (t && t.isContentEditable); }
function onKey(e) {
  if (e.key === 'F1') { e.preventDefault(); helpEl ? closeHelp() : openHelp(); return; }
  if (e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey) { var k = String(e.code || '').replace(/^Key/, '').toLowerCase(); if (NAV[k] && window.CV && CV.go) { e.preventDefault(); CV.go(NAV[k]); } }
}
function start() { wrapPalette(); autoTour(); if (!window.__cv144Keys) { window.__cv144Keys = 1; document.addEventListener('keydown', onKey); } }
function ready() { var n = 0; (function t() { if (wrapPalette() || n++ > 40) { start(); return; } setTimeout(t, 250); })(); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true }); else ready();
function tests() {
  var items = [{ label: 'a' }, { label: 'b' }, { label: 'c' }, { label: 'd' }], r = reorder(items, ['c', 'a']), p = pushRecent(['x', 'y', 'z', 'w', 'v'], 'y', 5);
  return {
    recentPromoted: r.map(function (i) { return i.label; }).join('') === 'cabd',
    pushRecentDedupesAndCaps: p.join('') === 'yxzwv' && pushRecent(['a'], 'b', 1).join('') === 'b' && pushRecent(null, 'q').join('') === 'q',
    noDuplicateLabels: (function () { var s = {}; return CMDS.every(function (c) { if (s[c.label]) return false; s[c.label] = 1; return true; }); })(),
    everyCommandHasTargetOrHelp: CMDS.every(function (c) { return c.help || c.tour || (c.page && c.sel); }),
    tourStepsWellFormed: STEPS.length === 4 && STEPS.every(function (x) { return x.title && x.text; }),
    readOnlyAutoRunOnly: CMDS.filter(function (c) { return c.run; }).every(function (c) { return /^(#cv127q-run|#cv134-run|#cv133-now)$/.test(c.run); }),
    navKeysUnique: Object.keys(NAV).length === 8 && Object.keys(NAV).every(function (k) { return NAV_LABEL[k] && k.length === 1; }),
    tipsCoverAllKnownStudioRoutes: ['poster','layoutFoundry','vectorForge','designEngine','autodesign','cvstudio','web','webEngine','portfolioStudio','hrvisual','pixelStudio','colorStudio','clarityLab','imageStudio','artcraft','videoEngine','motionLab','videoStudio','shotcraft','motion','motionCut','creativeHub'].every(function (k) { return TIPS[k] && TIPS[k].length >= 2; }),
    tipsCoverProjectAndUtilityPages: ['home','projects','projectVault','export','object','entry','capcutEngine','assets','settings'].every(function (k) { return TIPS[k] && TIPS[k].length >= 2; }),
    tipsAvoidGenericFallbackForStudioRoutes: ['poster','layoutFoundry','vectorForge','designEngine','autodesign','cvstudio','web','webEngine','portfolioStudio','hrvisual','pixelStudio','colorStudio','clarityLab','imageStudio','artcraft','videoEngine','motionLab','videoStudio','shotcraft','motion','motionCut','creativeHub'].every(function (k) { return TIPS[k].some(function (t) { return t.length > 25; }); })
  };
}
window.CVUxP144 = { version: '144.3.0', startTour: startTour, closeTour: closeTour, tourDone: tourDone, commands: CMDS, nav: NAV, tips: TIPS, openHelp: openHelp, closeHelp: closeHelp, wrapPalette: wrapPalette, tests: tests };
})();
