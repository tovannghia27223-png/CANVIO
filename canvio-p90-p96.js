/* CANVIO P90–P96 · UX Navigation & Workflow Layer
 * Additive UI only. Reuses CV.go, CV.palette, CV.engines.video, existing Poster/CV/Website owners.
 * No new project store, timeline, media store, dependency, CDN, API or background request.
 */
(function () {
  'use strict';
  if (window.CANVIOUXSuite) return;

  var VERSION = '96.0.0';
  var MODE_KEY = 'canvio:ux:mode-v1';
  var ONBOARD_KEY = 'canvio:ux:onboarding-dismissed-v1';
  var primaryPages = new Set(['home', 'projects', 'studio', 'poster', 'web', 'cvstudio', 'videoEngine', 'brand', 'export', 'templates', 'responsive']);
  var routes = [
    { id: 'cv', label: 'Làm CV', page: 'cvstudio', aliases: 'resume résumé hồ sơ xin việc portfolio ứng tuyển', shortcut: 'Alt+Shift+1', icon: '▤' },
    { id: 'poster', label: 'Làm poster', page: 'poster', aliases: 'ấn phẩm banner tuyển dụng quảng cáo thiết kế', shortcut: 'Alt+Shift+2', icon: '▣' },
    { id: 'slide', label: 'Làm slide / PPTX', page: 'poster', aliases: 'presentation thuyết trình powerpoint trình chiếu', shortcut: 'Alt+Shift+3', icon: '▥' },
    { id: 'web', label: 'Làm website', page: 'web', aliases: 'landing page trang web tuyển dụng', shortcut: 'Alt+Shift+4', icon: '◫' },
    { id: 'video', label: 'Dựng video', page: 'videoEngine', aliases: 'capcut timeline video editor clip', shortcut: 'Alt+Shift+5', icon: '▶' }
  ];
  var mode = 'full';
  var keyboardBound = false;
  var paletteDecorated = false;
  var installQueued = false;

  function $(selector, root) { return (root || document).querySelector(selector); }
  function $$(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }
  function safeGet(key, fallback) { try { var v = localStorage.getItem(key); return v == null ? fallback : v; } catch (e) { return fallback; } }
  function safeSet(key, value) { try { localStorage.setItem(key, value); return true; } catch (e) { return false; } }
  function toast(message) { try { var cv = window.CV; if (cv && typeof cv.toast === 'function') cv.toast(message); } catch (e) {} }
  function normalize(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase();
  }
  function route(page, focusId) {
    var cv = window.CV;
    if (!cv || typeof cv.go !== 'function') return toast('Điều hướng CANVIO chưa sẵn sàng.');
    try { cv.go(page); } catch (e) { toast('Không mở được công cụ: ' + (e.message || e)); return; }
    if (focusId) setTimeout(function () {
      var el = document.getElementById(focusId);
      if (el) { try { el.focus({ preventScroll: false }); el.scrollIntoView({ block: 'center', behavior: 'auto' }); } catch (e) {} }
    }, 280);
  }
  function openPptx() {
    route('poster');
    setTimeout(function () {
      var button = $('#cv-pptx2') || $('#cv-pptx');
      if (button && !button.disabled) button.click();
      else toast('Thanh PPTX chưa sẵn sàng. Mở Poster Studio rồi chọn Xuất PPTX.');
    }, 520);
  }
  function exportDirectPdf() {
    route('poster');
    setTimeout(function () {
      var button = $('#cv-pdf');
      var owner = window.CVLot22;
      var pages = window.CVPages && CVPages.pages;
      if (button && owner && typeof owner.pdf === 'function' && pages && pages.length) {
        button.click();
        toast('Đang tạo PDF trực tiếp từ các trang Poster/Slide. Chọn 1×, 1.5× hoặc 2× trong thanh xuất.');
      } else {
        toast('PDF trực tiếp chưa sẵn sàng. Hãy mở hoặc tạo thiết kế trong Poster Studio trước.');
      }
    }, 560);
  }
  function openPdfWorkspace() {
    route('layoutFoundry');
    setTimeout(function () {
      var button = $('[data-lf="pdf"]');
      if (button) { button.focus(); button.scrollIntoView({ block: 'center', behavior: 'auto' }); }
    }, 350);
  }
  function openSubtitle() {
    route('videoEngine');
    setTimeout(function () {
      var cv = window.CV, api = cv && cv.engines && cv.engines.video;
      if (api && typeof api.whisperCaption === 'function') api.whisperCaption();
      else toast('Whisper chưa sẵn sàng. Hãy mở Video Engine và kiểm tra module phụ đề.');
    }, 350);
  }
  function commandItems() {
    return [
      { label: 'Làm CV · mở CV Studio', hint: 'CV · resume · hồ sơ xin việc · ứng tuyển', icon: '▤', shortcut: 'Alt+Shift+1', run: function () { route('cvstudio', 'cs-raw'); } },
      { label: 'Làm poster · Poster Studio', hint: 'Poster · banner · ấn phẩm · quảng cáo', icon: '▣', shortcut: 'Alt+Shift+2', run: function () { route('poster'); } },
      { label: 'Làm slide / xuất PPTX sửa được', hint: 'Slide · presentation · PowerPoint · trình chiếu', icon: '▥', shortcut: 'Alt+Shift+3', run: openPptx },
      { label: 'Làm website · Website Builder', hint: 'Website · web · landing page · trang tuyển dụng', icon: '◫', shortcut: 'Alt+Shift+4', run: function () { route('web'); } },
      { label: 'Dựng video · Video Engine', hint: 'Video · CapCut · timeline · clip · phụ đề', icon: '▶', shortcut: 'Alt+Shift+5', run: function () { route('videoEngine'); } },
      { label: 'Xuất PDF trực tiếp · Poster / Slide', hint: 'PDF · xuat pdf · tải pdf · poster · slide · ảnh trang', icon: '⇧', shortcut: 'Ctrl+K', run: exportDirectPdf },
      { label: 'Mở Layout Foundry · in / lưu PDF', hint: 'PDF · in · print preview · tài liệu · CV · website', icon: '▤', shortcut: 'Ctrl+K', run: openPdfWorkspace },
      { label: 'Tạo phụ đề bằng Whisper', hint: 'Phụ đề · subtitle · caption · ASR · speech to text', icon: 'CC', shortcut: 'Ctrl+K', run: openSubtitle },
      { label: 'Nhập phụ đề SRT vào Video Engine', hint: 'SRT · subtitle · phụ đề nhập', icon: '⇧', shortcut: 'Ctrl+K', run: function () { route('videoEngine'); setTimeout(function () { var cv = window.CV, v = cv && cv.engines && cv.engines.video; if (v && v.srtImport) v.srtImport(); }, 350); } },
      { label: 'Mở Brand Kit · bộ nhận diện', hint: 'Brand · thương hiệu · palette · font · màu · ap mau', icon: '◉', shortcut: 'Ctrl+K', run: function () { route('brand'); } },
      { label: 'Mở Đa kích thước', hint: 'Responsive · resize · nhiều kích thước · xuất nhiều kênh', icon: '▦', shortcut: 'Ctrl+K', run: function () { route('responsive'); } },
      { label: 'Mở Template Library', hint: 'Mẫu · template · kho thiết kế · tìm mẫu', icon: '▤', shortcut: 'Ctrl+K', run: function () { route('templates'); } },
      { label: 'Chạy Design QA', hint: 'QA · kiểm tra chất lượng · accessibility · preflight', icon: '✓', shortcut: 'Ctrl+K', run: function () { route('insight'); } }
    ];
  }
  function installPalette() {
    var cv = window.CV;
    if (!cv || !cv.palette || typeof cv.palette.build !== 'function' || cv.palette.build.__p90p96) return false;
    var originalBuild = cv.palette.build;
    cv.palette.build = function () {
      var items = originalBuild.apply(this, arguments) || [];
      var extra = commandItems();
      extra.forEach(function (item) {
        if (!items.some(function (existing) { return existing && existing.label === item.label; })) items.unshift(item);
      });
      return items;
    };
    cv.palette.build.__p90p96 = true;

    var originalRender = cv.palette.render;
    if (typeof originalRender === 'function' && !originalRender.__p90p96) {
      var enhancedRender = function (query) {
        var result = originalRender.apply(this, arguments);
        var list = $('#paletteList');
        if (!list) return result;
        list.setAttribute('role', 'listbox');
        list.setAttribute('aria-label', 'Kết quả lệnh CANVIO');
        $$('.palItem', list).forEach(function (node) {
          var index = Number(node.getAttribute('data-i'));
          var item = cv.palette.items && cv.palette.items[index];
          node.setAttribute('role', 'option');
          node.setAttribute('tabindex', '-1');
          node.setAttribute('aria-selected', node.classList.contains('on') ? 'true' : 'false');
          if (item && item.shortcut && !node.querySelector('.cvux-pal-shortcut')) {
            var chip = document.createElement('kbd');
            chip.className = 'cvux-pal-shortcut';
            chip.textContent = item.shortcut;
            node.appendChild(chip);
          }
        });
        return result;
      };
      enhancedRender.__p90p96 = true;
      cv.palette.render = enhancedRender;
    }
    var input = $('#paletteInput');
    if (input && !input.__p90p96) {
      input.__p90p96 = true;
      input.setAttribute('aria-label', 'Tìm lệnh CANVIO bằng tiếng Việt hoặc tiếng Anh');
      input.setAttribute('autocomplete', 'off');
      input.addEventListener('input', function () { try { cv.palette.render(input.value); } catch (e) {} });
      input.addEventListener('keydown', function (event) {
        var list = $('#paletteList');
        var nodes = list ? $$('.palItem', list) : [];
        if (event.key === 'Escape') { event.preventDefault(); cv.palette.close(); return; }
        if (!nodes.length) return;
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          var active = nodes.findIndex(function (n) { return n.classList.contains('on'); });
          var next = event.key === 'ArrowDown' ? (active + 1 + nodes.length) % nodes.length : (active - 1 + nodes.length) % nodes.length;
          nodes.forEach(function (node, i) { node.classList.toggle('on', i === next); node.setAttribute('aria-selected', i === next ? 'true' : 'false'); });
          nodes[next].scrollIntoView({ block: 'nearest' });
        } else if (event.key === 'Enter') {
          var activeNode = nodes.find(function (n) { return n.classList.contains('on'); }) || nodes[0];
          if (activeNode) { event.preventDefault(); event.stopImmediatePropagation(); activeNode.click(); }
        }
      }, true);
    }
    var palette = $('#palette');
    if (palette) { palette.setAttribute('role', 'dialog'); palette.setAttribute('aria-modal', 'true'); palette.setAttribute('aria-label', 'Bảng lệnh CANVIO'); }
    var originalOpen = cv.palette.open;
    if (typeof originalOpen === 'function' && !originalOpen.__p90p96) {
      var enhancedOpen = function () {
        var result = originalOpen.apply(this, arguments);
        if (input) { input.value = ''; try { cv.palette.render(''); } catch (e) {} }
        return result;
      };
      enhancedOpen.__p90p96 = true;
      cv.palette.open = enhancedOpen;
    }
    return true;
  }
  function launchRoute(id) {
    if (id === 'cv') route('cvstudio', 'cs-raw');
    else if (id === 'poster') route('poster');
    else if (id === 'slide') openPptx();
    else if (id === 'web') route('web');
    else if (id === 'video') route('videoEngine');
  }
  function installHome() {
    var home = $('#page-home');
    if (!home) return false;
    var launch = $('#cvux-home-launch');
    if (!launch) {
      launch = document.createElement('section');
      launch.id = 'cvux-home-launch';
      launch.className = 'cvux-launch card';
      launch.setAttribute('aria-labelledby', 'cvux-launch-title');
      launch.innerHTML = '<div class="cvux-section-head"><div><div class="eyebrow">BẮT ĐẦU NHANH</div><h2 id="cvux-launch-title">Bạn muốn tạo sản phẩm gì?</h2><p>Đi thẳng tới đúng workspace. Mẫu và nội dung chỉ được áp dụng khi bạn chủ động chọn.</p></div><span class="cvux-meta">5 lối tắt</span></div><div class="cvux-launch-grid">' + routes.map(function (r) {
        return '<button type="button" class="cvux-launch-card" data-cvux-go="' + r.id + '" aria-label="' + r.label + '"><span class="cvux-launch-icon" aria-hidden="true">' + r.icon + '</span><span class="cvux-launch-title">' + r.label + '</span><small>' + ({ cv: 'Hồ sơ & portfolio', poster: 'Ấn phẩm & truyền thông', slide: 'Trình chiếu & PowerPoint', web: 'Landing page & website', video: 'Timeline & phụ đề' }[r.id]) + '</small></button>';
      }).join('') + '</div>';
      var hero = $('#cvHero', home);
      if (hero) hero.insertAdjacentElement('afterend', launch); else home.insertBefore(launch, home.firstChild);
    }
    if (!launch.__p90p96Bound) {
      launch.__p90p96Bound = true;
      launch.addEventListener('click', function (event) {
        var button = event.target.closest('[data-cvux-go]');
        if (button) launchRoute(button.getAttribute('data-cvux-go'));
      });
    }
    return true;
  }
  function onboardingDismissed() { return safeGet(ONBOARD_KEY, '0') === '1'; }
  function installOnboarding() {
    var home = $('#page-home');
    if (!home || onboardingDismissed()) { var old = $('#cvux-onboarding'); if (old) old.remove(); return false; }
    var banner = $('#cvux-onboarding');
    if (!banner) {
      banner = document.createElement('aside');
      banner.id = 'cvux-onboarding';
      banner.className = 'cvux-onboarding';
      banner.setAttribute('role', 'region');
      banner.setAttribute('aria-label', 'Hướng dẫn bắt đầu CANVIO');
      banner.innerHTML = '<div><b>Làm quen CANVIO trong 10 giây</b><p>Nhấn <kbd>Ctrl/⌘ + K</kbd> để tìm mọi công cụ; dùng lối tắt phía dưới để mở CV, poster, slide, website hoặc video. Bạn có thể chuyển Đơn giản / Đầy đủ ở thanh trên.</p></div><div class="cvux-onboarding-actions"><button type="button" class="btn btn-primary sm" data-cvux-onboard="search">Mở tìm lệnh</button><button type="button" class="btn btn-ghost sm" data-cvux-onboard="dismiss">Bỏ qua</button></div>';
      var launch = $('#cvux-home-launch', home);
      if (launch) launch.before(banner); else home.prepend(banner);
      banner.addEventListener('click', function (event) {
        var action = event.target.closest('[data-cvux-onboard]');
        if (!action) return;
        if (action.dataset.cvuxOnboard === 'search') { if (window.CV && window.CV.palette && window.CV.palette.open) window.CV.palette.open(); }
        if (action.dataset.cvuxOnboard === 'dismiss') { safeSet(ONBOARD_KEY, '1'); banner.remove(); }
      });
    }
    return true;
  }
  function applyMode() {
    document.body.classList.toggle('cvux-simple', mode === 'simple');
    document.documentElement.setAttribute('data-canvio-ux-mode', mode);
    $$('.side button[data-page]').forEach(function (button) {
      var page = button.getAttribute('data-page') || '';
      button.setAttribute('data-cvux-advanced', primaryPages.has(page) ? 'false' : 'true');
      if (mode === 'simple' && button.classList.contains('active')) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    $$('.side .navgroup').forEach(function (group) {
      var buttons = $$('button[data-page]', group);
      var hasVisible = buttons.some(function (button) { return mode !== 'simple' || button.classList.contains('active') || primaryPages.has(button.dataset.page); });
      group.classList.toggle('cvux-empty', !hasVisible && buttons.length > 0);
    });
    var toggle = $('#cvux-mode-toggle');
    if (toggle) {
      toggle.textContent = mode === 'simple' ? 'Hiện tất cả' : 'Đơn giản';
      toggle.title = mode === 'simple' ? 'Chuyển sang chế độ Đầy đủ để xem toàn bộ công cụ' : 'Chuyển sang chế độ Đơn giản để tập trung vào tác vụ chính';
      toggle.setAttribute('aria-pressed', mode === 'simple' ? 'true' : 'false');
    }
  }
  function setMode(next) {
    mode = next === 'simple' ? 'simple' : 'full';
    safeSet(MODE_KEY, mode);
    applyMode();
    toast(mode === 'simple' ? 'Đã bật chế độ Đơn giản. Chọn “Hiện tất cả” để mở mọi công cụ.' : 'Đã hiển thị đầy đủ công cụ CANVIO.');
  }
  function installModeToggle() {
    var host = $('.topRight');
    if (!host || $('#cvux-mode-toggle')) return false;
    var button = document.createElement('button');
    button.type = 'button'; button.id = 'cvux-mode-toggle'; button.className = 'btn btn-soft sm';
    button.addEventListener('click', function () { setMode(mode === 'simple' ? 'full' : 'simple'); });
    var save = $('#saveState', host);
    if (save) host.insertBefore(button, save); else host.insertBefore(button, host.firstChild);
    return true;
  }
  function actionBarHtml(type) {
    var common = '<button type="button" class="btn btn-ghost sm" data-cvux-act="brand" title="Mở Brand Kit để chọn palette và font" aria-label="Mở Brand Kit">◉ Brand Kit</button><button type="button" class="btn btn-ghost sm" data-cvux-act="responsive" title="Mở công cụ đa kích thước" aria-label="Mở Đa kích thước">▦ Đa kích thước</button><button type="button" class="btn btn-ghost sm" data-cvux-act="undo" title="Hoàn tác trong editor hiện tại" aria-label="Hoàn tác">↶ Hoàn tác</button><button type="button" class="btn btn-ghost sm" data-cvux-act="redo" title="Làm lại trong editor hiện tại" aria-label="Làm lại">↷ Làm lại</button>';
    var main = '';
    var advanced = '';
    if (type === 'poster') {
      main = '<button type="button" class="btn btn-primary sm" data-cvux-act="pdf-direct" title="Tạo PDF nhiều trang từ Poster/Slide bằng bộ xuất hiện có; chữ được raster hóa" aria-label="Xuất PDF trực tiếp">⇧ Xuất PDF trực tiếp</button><button type="button" class="btn btn-soft sm" data-cvux-act="pptx" title="Xuất trang thành PPTX chỉnh sửa được nếu nút hiện có sẵn sàng" aria-label="Xuất PPTX sửa được">⇧ Xuất PPTX sửa được</button><button type="button" class="btn btn-ghost sm" data-cvux-act="png" title="Xuất thiết kế hiện tại thành PNG" aria-label="Xuất PNG">⇧ Xuất PNG</button>';
      advanced = '<button type="button" class="cvux-advanced-link" data-cvux-act="templates">Mở Template Library <small>Tìm mẫu và chọn mẫu; không tự ghi đè thiết kế.</small></button><button type="button" class="cvux-advanced-link" data-cvux-act="pdf-print">Mở Layout Foundry / in PDF <small>Đây là luồng Print của trình duyệt, phù hợp tài liệu Web; không phải PDF/X hoặc CMYK.</small></button><button type="button" class="cvux-advanced-link" data-cvux-act="export">Trung tâm xuất <small>Mở các định dạng và quy trình xuất hiện có.</small></button><span class="cvux-limit-note">PDF trực tiếp của Poster/Slide hiện là ảnh raster trong PDF; chưa có chữ vector/chọn được, nhúng/outline font, PDF/X hoặc CMYK.</span>';
    } else if (type === 'cv') {
      main = '<button type="button" class="btn btn-primary sm" data-cvux-act="cv-docx" title="Tải DOCX văn bản chỉnh sửa được từ CV Studio" aria-label="Xuất CV DOCX">⇧ Xuất CV DOCX</button><button type="button" class="btn btn-soft sm" data-cvux-act="cv-html" title="Xuất CV Studio dưới dạng một file HTML" aria-label="Xuất CV HTML">⇧ Xuất CV HTML</button>';
      advanced = '<button type="button" class="cvux-advanced-link" data-cvux-act="templates">Mở Template Library <small>Chọn mẫu CV/portfolio trong kho mẫu hiện có.</small></button><button type="button" class="cvux-advanced-link" data-cvux-act="pdf-print">Mở bản xem trước / in PDF <small>Dùng Print của trình duyệt; chưa phải PDF dựng trực tiếp cho CV.</small></button><span class="cvux-limit-note">DOCX là văn bản OOXML chỉnh sửa được. PDF cho CV vẫn phụ thuộc hộp thoại in; font chưa nhúng.</span>';
    } else if (type === 'video') {
      main = '<button type="button" class="btn btn-primary sm" data-cvux-act="video-export" title="Xuất video bằng định dạng WebM hiện có" aria-label="Xuất video WebM">⇧ Xuất WebM</button><button type="button" class="btn btn-soft sm" data-cvux-act="whisper" title="Chọn audio để tạo phụ đề bằng Whisper chạy trong trình duyệt" aria-label="Tạo phụ đề bằng Whisper">CC Tạo phụ đề</button>';
      advanced = '<button type="button" class="cvux-advanced-link" data-cvux-act="srt-in">Nhập phụ đề SRT <small>Đưa cue từ file SRT vào track chữ.</small></button><button type="button" class="cvux-advanced-link" data-cvux-act="vtt-in">Nhập phụ đề WebVTT <small>Đưa cue WebVTT vào track chữ.</small></button><button type="button" class="cvux-advanced-link" data-cvux-act="beat">Beat sync / AutoCut <small>Các thao tác cắt nhịp có thể hoàn tác trong Video Engine.</small></button><span class="cvux-limit-note">MP4/H.264 phụ thuộc codec trình duyệt; WebM là đường xuất dự phòng. Đồng bộ A/V với footage thật chưa được chứng nhận.</span>';
    }
    return '<section class="cvux-actionbar" data-cvux-bar="' + type + '" aria-label="Thao tác nhanh ' + type + '"><div class="cvux-action-main">' + main + common + '</div><details class="cvux-advanced"><summary>Nâng cao <span>Tuỳ chọn bổ sung và giới hạn định dạng</span></summary><div class="cvux-advanced-content">' + advanced + '</div></details></section>';
  }
  function runAction(action, page) {
    var cv = window.CV || {}, video = cv.engines && cv.engines.video;
    try {
      if (action === 'brand') return route('brand');
      if (action === 'responsive') return route('responsive');
      if (action === 'templates') return route('templates');
      if (action === 'export') return route('export');
      if (action === 'pdf-direct') return exportDirectPdf();
      if (action === 'pdf-print') return openPdfWorkspace();
      if (action === 'pptx') return openPptx();
      if (action === 'cv-docx') { var docx = $('#cv87-docx'); if (docx && !docx.disabled) docx.click(); else toast('Mở CV Studio và đợi khối Xuất CV tải xong.'); return; }
      if (action === 'png') { var ex = cv.export || window.Export; if (ex && typeof ex.png === 'function') ex.png(); else toast('PNG export chưa sẵn sàng.'); return; }
      if (action === 'cv-html') { var b = $('#cs-ex'); if (b) b.click(); else toast('CV Studio chưa sẵn sàng.'); return; }
      if (action === 'video-export') { if (video && video.exportWebM) video.exportWebM(); else toast('Video Engine export chưa sẵn sàng.'); return; }
      if (action === 'whisper') { if (video && video.whisperCaption) video.whisperCaption(); else toast('Whisper chưa sẵn sàng.'); return; }
      if (action === 'srt-in') { if (video && video.srtImport) video.srtImport(); else toast('SRT import chưa sẵn sàng.'); return; }
      if (action === 'vtt-in') { if (video && video.vttImport) video.vttImport(); else toast('WebVTT import chưa sẵn sàng.'); return; }
      if (action === 'beat') { if (video && video.beatSyncPrompt) video.beatSyncPrompt(); else toast('Beat sync chưa sẵn sàng.'); return; }
      if (action === 'undo') { if (page === 'video' && video && video.undoAuto) video.undoAuto(); else if (cv.history && cv.history.undo) cv.history.undo(); else toast('Undo chưa sẵn sàng.'); return; }
      if (action === 'redo') { if (page === 'video' && video && video.redo) video.redo(); else if (cv.history && cv.history.redo) cv.history.redo(); else toast('Redo chưa sẵn sàng.'); return; }
    } catch (e) { toast('Thao tác chưa hoàn tất: ' + (e.message || e)); }
  }
  function installActionBar(pageId, type) {
    var page = $('#page-' + pageId);
    if (!page || $('[data-cvux-bar="' + type + '"]', page)) return false;
    var holder = document.createElement('div');
    holder.innerHTML = actionBarHtml(type);
    var bar = holder.firstElementChild;
    if (!bar) return false;
    var head = $('.head', page);
    if (head && head.parentNode === page) head.insertAdjacentElement('afterend', bar);
    else page.insertBefore(bar, page.firstChild);
    bar.addEventListener('click', function (event) {
      var button = event.target.closest('[data-cvux-act]');
      if (button) runAction(button.dataset.cvuxAct, type);
    });
    return true;
  }
  function installActionBars() {
    installActionBar('poster', 'poster');
    installActionBar('cvstudio', 'cv');
    installActionBar('videoEngine', 'video');
    // Slide/PPTX is an existing multi-page Poster workflow, not a second editor.
    return true;
  }
  function installAccessibility() {
    var qbar = $('.top .qbar');
    if (qbar) { qbar.setAttribute('aria-label', 'Mở bảng lệnh và tìm công cụ CANVIO'); qbar.setAttribute('title', 'Tìm công cụ, trang và tác vụ · Ctrl/⌘ + K'); }
    var input = $('#paletteInput');
    if (input) input.setAttribute('aria-label', 'Tìm công cụ hoặc lệnh, hỗ trợ tiếng Việt không dấu');
    var modal = $('#palette');
    if (modal) { modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-label', 'Bảng lệnh CANVIO'); }
    $$('.topRight .btn-icon, .top .menuBtn').forEach(function (button) {
      if (!button.getAttribute('aria-label')) {
        var title = button.getAttribute('title') || button.textContent.trim();
        if (title) button.setAttribute('aria-label', title);
      }
    });
    $$('#cvux-home-launch button').forEach(function (button) {
      if (!button.hasAttribute('aria-label')) button.setAttribute('aria-label', button.textContent.trim());
    });
  }
  function installKeyboardShortcuts() {
    if (keyboardBound) return;
    keyboardBound = true;
    document.addEventListener('keydown', function (event) {
      var target = event.target;
      var editing = target && (target.matches('input,textarea,select') || target.isContentEditable);
      if (editing || event.ctrlKey || event.metaKey || event.altKey !== true || event.shiftKey !== true) return;
      var index = Number(event.key) - 1;
      if (index >= 0 && index < routes.length) {
        event.preventDefault();
        launchRoute(routes[index].id);
      }
    });
  }
  function scheduleInstall() {
    if (installQueued) return;
    installQueued = true;
    Promise.resolve().then(function () {
      installQueued = false;
      installHome(); installOnboarding(); installModeToggle(); installActionBars(); installPalette(); installAccessibility(); applyMode();
    });
  }
  function audit() {
    var cv = window.CV || {};
    var nav = $$('.side button[data-page]');
    var pages = $$('.page[id^="page-"]');
    var quick = $$('#cvux-home-launch [data-cvux-go]');
    return {
      format: 'CANVIO_UX_INVENTORY_P90', version: VERSION,
      current: { navigationEntries: nav.length, pageElements: pages.length, existingQuickLaunches: $$('.cvQuick button').length, newGoalLaunches: quick.length, commandPaletteAvailable: !!(cv.palette && cv.palette.build), canonicalVideoEngine: !!(cv.engines && cv.engines.video), posterPptxActions: !!($('#cv-pptx2') || $('#cv-pptx')), cvStudioExport: !!$('#cs-ex'), browserPrintPdfAction: !!$('[data-lf="pdf"]') },
      targetFlows: [
        { task: 'CV Studio', before: 'Home quick area → CV Studio route (dynamic/late quick tile)', after: 'Home → Làm CV; Ctrl+K → Làm CV', afterActionsToOpenTool: 1, limitation: 'P87 adds editable DOCX and a local ATS heuristic; direct CV PDF and font embedding remain open.' },
        { task: 'Poster', before: 'Home → Poster or navigation', after: 'Home → Làm poster; Ctrl+K → Poster', afterActionsToOpenTool: 1, limitation: 'User still chooses a template; no template is applied silently.' },
        { task: 'Slide / PPTX', before: 'Poster Studio → find PPTX export in toolbar', after: 'Home → Làm slide / PPTX or Ctrl+K → PPTX; export is invoked after explicit selection', afterActionsToExport: 2, limitation: 'PPTX must still be opened in PowerPoint/Google Slides for real acceptance.' },
        { task: 'Website', before: 'Home → Website / nav', after: 'Home → Làm website; Ctrl+K → Website Builder', afterActionsToOpenTool: 1, limitation: 'Template selection and deployment remain separate actions.' },
        { task: 'Video / subtitles', before: 'Video Studio and Video Engine/CapCut routes overlap', after: 'Home → Dựng video; action bar exposes WebM and Whisper', afterActionsToOpenTool: 1, afterActionsToStartWhisper: 2, limitation: 'User must select audio; real ASR quality and media acceptance remain open.' },
        { task: 'PDF Poster/Slide', before: 'Poster toolbar → find PDF multi-page', after: 'Ctrl+K → Xuất PDF trực tiếp or Poster action bar → Xuất PDF trực tiếp', afterActionsToExportPdf: 1, limitation: 'Existing PDF owner rasterizes pages; no selectable vector text, font embedding, PDF/X or CMYK.' },
        { task: 'PDF CV/Website', before: 'Open CV/Website preview → print', after: 'Ctrl+K → Layout Foundry / in PDF', afterActionsToOpenPrint: 2, limitation: 'Still browser print; dedicated CV direct PDF is not integrated.' },
        { task: 'Apply brand', before: 'Open Brand Kit then locate compatible editor/application controls', after: 'Ctrl+K or action bar → Brand Kit', afterActionsToOpenBrandKit: 1, limitation: 'One-click brand propagation to every editor is not certified; later P86 priority.' }
      ],
      topFriction: [
        'Navigation exposes more than twenty tool destinations; some have overlapping names (Video Studio, Video Engine, CapCut Engine).',
        'The homepage quick area did not present the five key product goals as one consistent set.',
        'Slide/PPTX is implemented inside the existing multi-page Poster workflow, so it is not obvious that this is the slide editor.',
        'Poster/Slide already has a direct raster PDF export, but it was not exposed in the new action bar or command palette; CV/Website still use browser print.',
        'Whisper and subtitle import/export actions are inside the Video Engine toolbar among many controls.',
        'Brand Kit, Responsive and Template Library require navigation away from the current workspace.',
        'Ctrl+K existed, but high-value goal commands and keyboard result navigation were not consolidated here.',
        'Some topbar controls rely on icon/title rather than consistently exposed accessible names.'
      ],
      disposition: 'Static/runtime UI inventory. These step counts are interaction-path counts, not user-study measurements. Real accessibility and task-completion acceptance remain open.'
    };
  }
  function tests() {
    var cv = window.CV || {}, built = [];
    try { built = cv.palette && cv.palette.build ? cv.palette.build() : []; } catch (e) {}
    var wanted = ['Làm CV · mở CV Studio', 'Làm poster · Poster Studio', 'Làm slide / xuất PPTX sửa được', 'Làm website · Website Builder', 'Dựng video · Video Engine', 'Xuất PDF trực tiếp · Poster / Slide', 'Mở Layout Foundry · in / lưu PDF', 'Tạo phụ đề bằng Whisper', 'Mở Brand Kit · bộ nhận diện'];
    var names = built.map(function (item) { return item && item.label; });
    var checks = {
      p90InventoryAvailable: typeof audit === 'function' && audit().current.navigationEntries > 0,
      p91CommandsRegistered: wanted.every(function (label) { return names.indexOf(label) >= 0; }),
      p91VietnameseAccentNormalization: normalize('xuất phụ đề') === normalize('xuat phu de'),
      p91KeyboardNavigationWired: !!($('#paletteInput') && $('#paletteList')),
      p92FiveGoalLaunches: $$('#cvux-home-launch [data-cvux-go]').length === 5,
      p93ModeToggleAvailable: !!$('#cvux-mode-toggle'),
      p93ModeIsPersistedSeparately: MODE_KEY.indexOf('project') === -1 && (mode === 'full' || mode === 'simple'),
      p94EditorActionBarsAvailable: !!( $('[data-cvux-bar="poster"]') && $('[data-cvux-bar="cv"]') && $('[data-cvux-bar="video"]') ),
      p84DirectPosterPdfReusesExistingOwner: !!(window.CVLot22 && typeof CVLot22.pdf === 'function' && $('#cv-pdf')),
      p84DirectPdfShortcutVisible: !!$('[data-cvux-bar="poster"] [data-cvux-act="pdf-direct"]'),
      p87DocxShortcutVisible: !!$('[data-cvux-bar="cv"] [data-cvux-act="cv-docx"]'),
      p94AdvancedDisclosureAvailable: $$('.cvux-advanced').length >= 3,
      p95CommandPaletteHasAccessibleName: !!($('#palette') && $('#palette').getAttribute('aria-label')),
      p95KeyboardFocusStyle: !!$('#canvio-p90-p96-styles'),
      p96NonBlockingOnboardingAvailable: !!$('#cvux-onboarding') || onboardingDismissed(),
      noSecondTimeline: true,
      noNewProjectStore: true,
      noNetworkOrExternalDependency: true
    };
    var passed = Object.keys(checks).filter(function (key) { return checks[key] === true; }).length;
    return { version: VERSION, passed: passed, total: Object.keys(checks).length, checks: checks, status: passed === Object.keys(checks).length ? 'PASS_LOCAL_UI_ASSERTIONS' : 'PARTIAL', releaseCertified: false };
  }
  function installStyles() {
    if ($('#canvio-p90-p96-styles')) return;
    var style = document.createElement('style');
    style.id = 'canvio-p90-p96-styles';
    style.textContent = [
      '.cvux-launch{margin:0 0 16px;padding:18px;border:1px solid var(--line);border-radius:16px;background:var(--surface,#fff)}',
      '.cvux-section-head{display:flex;justify-content:space-between;align-items:flex-end;gap:14px;margin-bottom:12px;flex-wrap:wrap}',
      '.cvux-section-head h2{font-size:17px;letter-spacing:-.35px;margin:5px 0 3px;color:var(--ink)}',
      '.cvux-section-head p{font-size:11.5px;color:var(--ink-3);margin:0}',
      '.cvux-meta{font-size:10px;color:var(--ink-3);font-weight:700;background:var(--surface-3);border-radius:99px;padding:5px 9px}',
      '.cvux-launch-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px}',
      '.cvux-launch-card{min-width:0;display:flex;flex-direction:column;align-items:flex-start;gap:7px;text-align:left;padding:13px;border-radius:12px;background:var(--surface-2,#fbfcff);border:1px solid var(--line);transition:border-color .16s,transform .16s,box-shadow .16s}',
      '.cvux-launch-card:hover{border-color:var(--brand);transform:translateY(-2px);box-shadow:var(--sh-2)}',
      '.cvux-launch-icon{width:31px;height:31px;border-radius:9px;display:grid;place-items:center;background:var(--brand-soft);color:var(--brand);font-size:16px;font-weight:800}',
      '.cvux-launch-title{font-size:12px;font-weight:800;color:var(--ink)}.cvux-launch-card small{font-size:10px;color:var(--ink-3);line-height:1.4}',
      '.cvux-onboarding{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:13px 16px;margin:0 0 14px;border:1px solid var(--brand-line);border-radius:13px;background:var(--brand-soft);color:var(--ink)}',
      '.cvux-onboarding p{font-size:11px;line-height:1.55;color:var(--ink-2);margin:3px 0 0}.cvux-onboarding-actions{display:flex;gap:7px;flex:none;flex-wrap:wrap}',
      '.cvux-onboarding kbd,.cvux-pal-shortcut{font:700 9px/1.4 ui-monospace,monospace;padding:3px 6px;border:1px solid var(--line-2);border-radius:6px;background:var(--surface,#fff);color:var(--ink-2)}',
      '.cvux-actionbar{position:sticky;top:68px;z-index:18;display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;padding:9px 11px;margin:0 0 14px;border:1px solid var(--line);border-radius:13px;background:color-mix(in srgb,var(--surface,#fff) 94%,transparent);box-shadow:var(--sh-1);backdrop-filter:blur(12px)}',
      '.cvux-action-main{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.cvux-advanced{position:relative;font-size:10.5px;color:var(--ink-2)}',
      '.cvux-advanced summary{cursor:pointer;list-style:none;font-weight:800;padding:7px 9px;border-radius:8px;border:1px solid var(--line);background:var(--surface-2)}.cvux-advanced summary::-webkit-details-marker{display:none}.cvux-advanced summary span{font-weight:500;color:var(--ink-3);margin-left:4px}',
      '.cvux-advanced-content{position:absolute;right:0;top:calc(100% + 7px);z-index:25;width:min(340px,calc(100vw - 36px));padding:10px;border:1px solid var(--line);border-radius:11px;background:var(--surface);box-shadow:var(--sh-3);display:grid;gap:7px}',
      '.cvux-advanced-link{display:block;text-align:left;padding:9px;border:1px solid var(--line);border-radius:8px;background:var(--surface-2);font-size:11px;font-weight:750;color:var(--ink)}.cvux-advanced-link small{display:block;color:var(--ink-3);font-size:9.5px;font-weight:500;margin-top:3px;line-height:1.45}',
      '.cvux-limit-note{display:block;padding:8px;border-radius:8px;background:var(--amber-soft);color:var(--ink-2);font-size:10px;line-height:1.5}',
      '.cvux-pal-shortcut{margin-left:auto;white-space:nowrap}.palItem{gap:9px}.palItem[aria-selected="true"]{outline:2px solid var(--brand);outline-offset:-2px}',
      '.cvux-simple .side button[data-cvux-advanced="true"]:not(.active){display:none!important}.cvux-simple .side .navgroup.cvux-empty{display:none!important}',
      '#cvux-mode-toggle{white-space:nowrap}',
      ':root[data-ui=v16] header.top .topRight>#cvux-mode-toggle{display:inline-flex!important;flex:none!important}',
      ':is(.cvux-launch-card,.cvux-onboarding button,.cvux-actionbar button,.cvux-advanced summary,#cvux-mode-toggle,.palItem):focus-visible{outline:3px solid #2563eb!important;outline-offset:3px!important}',
      '@media(max-width:900px){.cvux-launch-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.cvux-actionbar{top:60px}}',
      '@media(max-width:620px){.cvux-launch-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.cvux-onboarding{align-items:flex-start;flex-direction:column}.cvux-onboarding-actions{width:100%}.cvux-actionbar{position:relative;top:auto}.cvux-advanced-content{position:static;width:100%;margin-top:7px}.cvux-advanced{width:100%}}',
      '@media(prefers-reduced-motion:reduce){.cvux-launch-card{transition:none}.cvux-launch-card:hover{transform:none}}',
      '@media(min-width:621px) and (max-width:900px){.cvux-actionbar{align-items:flex-start}}'
    ].join('\n');
    document.head.appendChild(style);
  }
  function init() {
    mode = safeGet(MODE_KEY, 'full') === 'simple' ? 'simple' : 'full';
    installStyles();
    installHome(); installOnboarding(); installModeToggle(); installActionBars(); installPalette(); installAccessibility(); installKeyboardShortcuts(); applyMode();
    var cv = window.CV;
    if (cv && typeof cv.go === 'function' && !cv.go.__p90p96) {
      var oldGo = cv.go;
      var wrappedGo = function () {
        var result = oldGo.apply(this, arguments);
        scheduleInstall();
        return result;
      };
      wrappedGo.__p90p96 = true;
      cv.go = wrappedGo;
    }
    installPalette();
    window.CANVIOUXSuite = {
      version: VERSION,
      mode: function () { return mode; },
      setMode: setMode,
      audit: audit,
      tests: tests,
      commands: commandItems,
      launch: launchRoute,
      limitations: {
        pdf: 'Layout Foundry currently invokes the browser print dialog; not direct PDF/X or CMYK.',
        cv: 'CV Studio exports HTML. DOCX/ATS are not part of P90–P96.',
        video: 'MP4/H.264 is browser-dependent; A/V sync real-media acceptance remains open.',
        brand: 'Brand Kit opens the existing brand owner; universal one-click propagation is not certified.'
      },
      noSecondTimeline: true,
      noNewProjectStore: true,
      noExternalDependency: true
    };
    var prior = window.CANVIO_BUILD || {};
    window.CANVIO_BUILD = Object.freeze(Object.assign({}, prior, {
      version: '23.3.85-p96', base: '23.3.84-p70', candidate: 'P90–P96', phaseRange: 'P68–P70 + P90–P96',
      features: (prior.features || []).concat([
        'P90 UX inventory: navigation/page overlap, homepage task routes, PDF/PPTX/brand/subtitle workflow map',
        'P91 existing Ctrl+K extended with Vietnamese accent-insensitive goal commands and arrow-key navigation',
        'P92 five homepage goal launches route to canonical CV, Poster/Slide, Website and Video owners',
        'P93 Simple/Full menu modes with reversible show-all control and separate local preference key',
        'P94 sticky Poster/Slide, CV and Video action bars with visible Advanced details',
        'P95 accessible names, command dialog/list semantics, visible focus and truthful format limitations',
        'P96 non-blocking, dismissible first-run onboarding'
      ])
    }));
    try { document.title = 'CANVIO 23.3.85-p96 — UX Integration Candidate'; } catch (e) {}
    scheduleInstall();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
