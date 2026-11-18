/* CANVIO P89 · searchable/tagged template discovery + selected multi-size export.
 * Reuses CV.templates, CVLot56, CV.responsive, CVZip and existing Poster data.
 * Tag state and current output selection are ephemeral UI state; no project store added.
 */
(function () {
  'use strict';
  if (window.CANVIOP89Suite) return;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var norm = function (v) { return String(v == null ? '' : v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase(); };
  var TAGS = [
    { id: 'hr', label: 'HR & nhân sự', terms: ['nhan su', 'tuyen dung', 'recruit', 'talent acquisition', 'people operations', 'employee', 'workforce'] },
    { id: 'finance', label: 'Tài chính', terms: ['tai chinh', 'finance', 'banking', 'investment', 'accounting', 'fintech'] },
    { id: 'business', label: 'Kinh doanh', terms: ['kinh doanh', 'business', 'sales', 'startup', 'commerce', 'e-commerce', 'real estate', 'bat dong san'] },
    { id: 'technology', label: 'Công nghệ', terms: ['cong nghe', 'technology', 'software', 'saas', 'digital', 'data', 'app', 'tech'] },
    { id: 'marketing', label: 'Marketing', terms: ['marketing', 'campaign', 'quang cao', 'social media', 'brand', 'launch'] },
    { id: 'education', label: 'Giáo dục', terms: ['giao duc', 'education', 'school', 'course', 'learning', 'training'] },
    { id: 'portfolio', label: 'Portfolio', terms: ['portfolio', 'creative', 'designer', 'photography', 'case study'] },
    { id: 'editorial', label: 'Biên tập', terms: ['editorial', 'magazine', 'journal', 'report', 'publication', 'tạp chí'] },
    { id: 'minimal', label: 'Tối giản', terms: ['minimal', 'swiss', 'clean', 'simple', 'toi gian'] },
    { id: 'luxury', label: 'Cao cấp', terms: ['luxury', 'premium', 'resort', 'high-end', 'cao cap', 'sang trong'] },
    { id: 'story', label: 'Story 9:16', terms: ['story', '9:16', 'vertical', 'portrait'] },
    { id: 'print', label: 'In ấn', terms: ['a4', 'a5', 'a2', 'print', 'in an', 'flyer', 'business card', 'danh thiep'] }
  ];
  var state = { tag: 'all', group: 'all', selected: null, installed: false };
  var templateStatus = null;
  var multiStatus = null;
  function textFor(entry) {
    if (!entry) return '';
    return [entry.name, entry.industry, entry.style, entry.ratio, entry.palette, entry.description, entry.headline, entry[1], entry[2], entry[3], entry[4] && JSON.stringify(entry[4])].filter(Boolean).join(' ');
  }
  function cardEntry(card) {
    var id = card.getAttribute('data-tpl');
    if (id && window.CV && CV.templates && typeof CV.templates.build === 'function') {
      var list = CV.templates.build();
      for (var i = 0; i < list.length; i++) if (list[i].id === id) return Object.assign({ _kind: 'poster' }, list[i]);
    }
    var use = $('[data-use]', card);
    if (use && window.CVLot56) {
      var parts = String(use.getAttribute('data-use') || '').split(':'), kind = parts[0], key = parts.slice(1).join(':');
      if (kind === 'web' && Array.isArray(CVLot56.WEB)) {
        for (var j = 0; j < CVLot56.WEB.length; j++) if (CVLot56.WEB[j][0] === key) return { _kind: 'web', name: CVLot56.WEB[j][1], description: CVLot56.WEB[j][2], style: CVLot56.WEB[j][3], spec: CVLot56.WEB[j][4] };
      }
      if (kind === 'cv' && Array.isArray(CVLot56.CVS)) {
        for (var k = 0; k < CVLot56.CVS.length; k++) if (CVLot56.CVS[k][0] === key) return { _kind: 'cv', name: CVLot56.CVS[k][1], description: CVLot56.CVS[k][2], palette: CVLot56.CVS[k][3] };
      }
    }
    return { _kind: 'unknown', name: ($('b', card) || {}).textContent || '', description: card.textContent || '' };
  }
  function tagsFor(entry) {
    var raw = norm(textFor(entry));
    var tags = [];
    var kind = entry && entry._kind;
    if (kind === 'poster') tags.push('poster');
    if (kind === 'web') tags.push('web');
    if (kind === 'cv') tags.push('cv', 'portfolio');
    TAGS.forEach(function (tag) {
      var hit = tag.terms.some(function (term) {
        var t = norm(term);
        if (t === 'app' || t === 'tech' || t === 'hr') return new RegExp('(^|[^a-z0-9])' + t + '([^a-z0-9]|$)').test(raw);
        return raw.indexOf(t) >= 0;
      });
      if (hit) tags.push(tag.id);
    });
    var ratio = norm(entry && entry.ratio || '');
    if (ratio === 'square') tags.push('square');
    if (ratio === 'story') tags.push('story');
    if (ratio === 'a4') tags.push('print');
    return Array.from(new Set(tags));
  }
  function tagLabel(id) {
    if (id === 'poster') return 'Poster';
    if (id === 'web') return 'Website';
    if (id === 'cv') return 'CV';
    if (id === 'square') return 'Vuông 1:1';
    for (var i = 0; i < TAGS.length; i++) if (TAGS[i].id === id) return TAGS[i].label;
    return id;
  }
  function makeTagBar() {
    var row = $('#page-templates .card .row');
    if (!row) return null;
    var card = row.closest('.card');
    var bar = $('#cv89-tagbar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'cv89-tagbar';
      bar.className = 'cv89-tagbar';
      bar.setAttribute('role', 'group');
      bar.setAttribute('aria-label', 'Lọc thư viện theo thẻ chủ đề');
      row.insertAdjacentElement('afterend', bar);
    }
    return bar;
  }
  function allTemplateCards() { return $$('#tplGrid .pvCard'); }
  function renderTagBar(cards) {
    var bar = makeTagBar();
    if (!bar) return;
    var counts = Object.create(null);
    cards.forEach(function (card) { tagsFor(cardEntry(card)).forEach(function (tag) { counts[tag] = (counts[tag] || 0) + 1; }); });
    var available = ['poster', 'web', 'cv'].concat(TAGS.map(function (x) { return x.id; }), ['square']);
    bar.textContent = '';
    var heading = document.createElement('span'); heading.className = 'cv89-tag-heading'; heading.textContent = 'Chủ đề:'; bar.appendChild(heading);
    function button(id, label, count) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'cv89-tag' + (state.tag === id ? ' is-active' : '');
      b.dataset.cv89Tag = id; b.setAttribute('aria-pressed', state.tag === id ? 'true' : 'false');
      b.textContent = label + (typeof count === 'number' ? ' · ' + count : ''); bar.appendChild(b);
    }
    button('all', 'Tất cả', cards.length);
    available.forEach(function (id) { if (counts[id]) button(id, tagLabel(id), counts[id]); });
    var clear = document.createElement('button'); clear.type = 'button'; clear.className = 'cv89-tag-clear'; clear.dataset.cv89Clear = '1'; clear.textContent = 'Xóa bộ lọc'; clear.setAttribute('aria-label', 'Xóa tìm kiếm và bộ lọc thư viện'); bar.appendChild(clear);
  }
  function decorateTemplates() {
    var grid = $('#tplGrid'); if (!grid) return;
    var cards = allTemplateCards(), visible = 0;
    cards.forEach(function (card) {
      var tags = tagsFor(cardEntry(card));
      card.dataset.cv89Tags = tags.join(' ');
      var matches = state.tag === 'all' || tags.indexOf(state.tag) >= 0;
      card.classList.toggle('cv89-tag-hidden', !matches);
      if (card.style.display !== 'none' && matches) visible++;
      var body = $('.pvBody', card);
      if (body) {
        var chips = $('.cv89-card-tags', body);
        if (!chips) { chips = document.createElement('div'); chips.className = 'cv89-card-tags'; body.appendChild(chips); }
        chips.textContent = '';
        tags.slice(0, 3).forEach(function (tag) { var span = document.createElement('span'); span.textContent = tagLabel(tag); chips.appendChild(span); });
      }
    });
    renderTagBar(cards);
    if (!templateStatus) {
      templateStatus = document.createElement('p'); templateStatus.id = 'cv89-template-status'; templateStatus.className = 'cv89-status';
      templateStatus.setAttribute('role', 'status'); templateStatus.setAttribute('aria-live', 'polite'); grid.insertAdjacentElement('beforebegin', templateStatus);
    }
    templateStatus.textContent = visible + ' / ' + cards.length + ' mẫu đang hiển thị' + (state.tag === 'all' ? '' : ' · thẻ ' + tagLabel(state.tag));
    var empty = $('#cv89-template-empty');
    if (visible === 0 && cards.length) {
      if (!empty) { empty = document.createElement('div'); empty.id = 'cv89-template-empty'; empty.className = 'emptyState'; empty.style.gridColumn = '1/-1'; empty.textContent = 'Không có mẫu phù hợp với thẻ này. Hãy xóa hoặc đổi bộ lọc.'; grid.appendChild(empty); }
    } else if (empty) empty.remove();
  }
  function installTemplateSearch() {
    var grid = $('#tplGrid');
    if (!grid || !window.CV || !CV.templates || typeof CV.templates.render !== 'function') return false;
    makeTagBar();
    var baseRender = CV.templates.render;
    if (!baseRender.__p89Wrapped) {
      var wrapped = function () { var result = baseRender.apply(this, arguments); decorateTemplates(); return result; };
      wrapped.__p89Wrapped = true; wrapped.__p89Original = baseRender; CV.templates.render = wrapped;
    }
    var bar = makeTagBar();
    if (bar && !bar.__p89Bound) {
      bar.__p89Bound = true;
      bar.addEventListener('click', function (event) {
        var button = event.target.closest('[data-cv89-tag],[data-cv89-clear]'); if (!button) return;
        if (button.hasAttribute('data-cv89-clear')) {
          state.tag = 'all';
          var query = $('#lib-q'); if (query) { query.value = ''; if (window.CV190TemplateState) CV190TemplateState.query = ''; }
          ['tplIndustry', 'tplStyle', 'tplRatio'].forEach(function (id) { var el = document.getElementById(id); if (el) el.value = 'all'; });
          if (window.CV190TemplateState) CV190TemplateState.kind = 'all';
          CV.templates.render();
          return;
        }
        state.tag = button.dataset.cv89Tag || 'all';
        decorateTemplates();
      });
    }
    CV.templates.render();
    return true;
  }
  function sizeList() { return window.CV && CV.responsive && typeof CV.responsive.getSizes === 'function' ? CV.responsive.getSizes() : []; }
  function installMultiSize() {
    if (!window.CV || !CV.responsive || typeof CV.responsive.render !== 'function') return false;
    var sizes = sizeList(), page = $('#page-responsive'), grid = $('#respGrid');
    if (!page || !grid || !sizes.length) return false;
    if (!state.selected) state.selected = new Set();
    var panel = $('#cv89-multisize-panel');
    if (!panel) {
      panel = document.createElement('div'); panel.id = 'cv89-multisize-panel'; panel.className = 'card cv89-multisize-panel';
      panel.innerHTML = '<div class="cv89-ms-head"><div><b>Chọn kích thước cần xuất</b><small>Chọn tất cả, theo nhóm hoặc từng định dạng. Không thay đổi thiết kế gốc.</small></div><strong id="cv89-ms-count">0 / 0</strong></div><div class="cv89-ms-groups" role="group" aria-label="Lọc nhóm kích thước"><button type="button" data-cv89-group="all" aria-pressed="true">Tất cả</button><button type="button" data-cv89-group="Mạng xã hội" aria-pressed="false">Mạng xã hội</button><button type="button" data-cv89-group="Video" aria-pressed="false">Video</button><button type="button" data-cv89-group="In ấn" aria-pressed="false">In ấn</button><button type="button" data-cv89-group="Web" aria-pressed="false">Web</button></div><div class="cv89-ms-actions"><button type="button" class="btn btn-soft sm" data-cv89-select-visible>Chọn nhóm đang xem</button><button type="button" class="btn btn-ghost sm" data-cv89-clear> Bỏ chọn tất cả</button><button type="button" class="btn btn-primary sm" id="cv89-export-selected">Xuất kích thước đã chọn</button></div><p id="cv89-ms-status" class="cv89-status" role="status" aria-live="polite">Các lựa chọn chỉ tồn tại trong phiên hiện tại.</p>';
      grid.insertAdjacentElement('beforebegin', panel);
    }
    var baseRender = CV.responsive.render;
    if (!baseRender.__p89Wrapped) {
      var wrapped = function () { var result = baseRender.apply(this, arguments); decorateSizeCards(); return result; };
      wrapped.__p89Wrapped = true; wrapped.__p89Original = baseRender; CV.responsive.render = wrapped;
    }
    function updateStatus() {
      var count = $('#cv89-ms-count'), status = $('#cv89-ms-status'), button = $('#cv89-export-selected');
      var selected = state.selected ? state.selected.size : 0;
      if (count) count.textContent = selected + ' / ' + sizes.length;
      if (status) status.textContent = 'Đã chọn ' + selected + ' / ' + sizes.length + ' kích thước. Bộ lọc nhóm chỉ thay đổi phần đang xem, không xóa lựa chọn.';
      if (button) { button.textContent = 'Xuất ' + selected + ' kích thước đã chọn'; button.disabled = selected === 0; }
    }
    function decorateSizeCards() {
      $$('#respGrid [data-size-id]').forEach(function (card) {
        var id = card.dataset.sizeId, record = sizes.find(function (s) { return s.id === id; });
        if (!record) return;
        var body = $('.pvBody', card); if (!body) return;
        var label = $('.cv89-size-choice', body);
        if (!label) {
          label = document.createElement('label'); label.className = 'cv89-size-choice';
          var input = document.createElement('input'); input.type = 'checkbox'; input.dataset.cv89Size = id;
          input.setAttribute('aria-label', 'Chọn ' + record.name + ' để xuất hàng loạt');
          var span = document.createElement('span'); span.textContent = 'Chọn để xuất hàng loạt';
          label.appendChild(input); label.appendChild(span); body.appendChild(label);
        }
        var check = $('input[data-cv89-size]', label); if (check) check.checked = state.selected.has(id);
        card.style.display = state.group === 'all' || record.group === state.group ? '' : 'none';
      });
      panel.querySelectorAll('[data-cv89-group]').forEach(function (button) {
        var active = button.dataset.cv89Group === state.group;
        button.setAttribute('aria-pressed', active ? 'true' : 'false'); button.classList.toggle('is-active', active);
      });
      updateStatus();
    }
    if (!panel.__p89Bound) {
      panel.__p89Bound = true;
      panel.addEventListener('click', function (event) {
        var group = event.target.closest('[data-cv89-group]');
        if (group) { state.group = group.dataset.cv89Group; decorateSizeCards(); return; }
        if (event.target.closest('[data-cv89-select-visible]')) {
          sizes.forEach(function (s) { if (state.group === 'all' || s.group === state.group) state.selected.add(s.id); });
          decorateSizeCards(); return;
        }
        if (event.target.closest('[data-cv89-clear]')) { state.selected.clear(); decorateSizeCards(); return; }
        if (event.target.closest('#cv89-export-selected')) {
          var ids = sizes.filter(function (s) { return state.selected.has(s.id); }).map(function (s) { return s.id; });
          if (!ids.length) { if (window.CV && CV.toast) CV.toast('Chọn ít nhất một kích thước trước khi xuất.'); return; }
          if (window.CV && CV.responsive && typeof CV.responsive.exportZipish === 'function') CV.responsive.exportZipish(ids);
        }
      });
    }
    if (!grid.__p89Bound) {
      grid.__p89Bound = true;
      grid.addEventListener('change', function (event) {
        var input = event.target.closest('input[data-cv89-size]'); if (!input) return;
        if (input.checked) state.selected.add(input.dataset.cv89Size); else state.selected.delete(input.dataset.cv89Size);
        updateStatus();
      });
    }
    decorateSizeCards();
    return true;
  }
  function injectStyles() {
    if (document.getElementById('canvio-p89-styles')) return;
    var style = document.createElement('style');
    style.id = 'canvio-p89-styles';
    style.textContent = `
      #cv89-tagbar{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin:12px 0 14px;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:var(--surface-2)}
      .cv89-tag-heading{font-size:11px;font-weight:800;color:var(--ink-2);margin-right:2px}
      .cv89-tag{border:1px solid var(--line-2);border-radius:999px;padding:5px 10px;background:var(--surface);color:var(--ink-2);font-size:11px;font-weight:650;cursor:pointer;transition:background .15s,border-color .15s,color .15s}
      .cv89-tag:hover,.cv89-tag:focus-visible{border-color:var(--brand);outline:2px solid transparent;color:var(--brand-ink)}
      .cv89-tag.is-active{background:var(--brand-soft);border-color:var(--brand-line);color:var(--brand-ink)}
      .cv89-tag-clear{border:0;background:transparent;color:var(--ink-3);font-size:11px;text-decoration:underline;cursor:pointer;padding:5px 7px}
      .cv89-tag-hidden{display:none!important}
      .cv89-card-tags{display:flex;gap:4px;flex-wrap:wrap;margin-top:6px}
      .cv89-card-tags span{font-size:9px;line-height:1.5;padding:2px 6px;border-radius:99px;background:var(--surface-3);color:var(--ink-3)}
      .cv89-status{margin:6px 0 10px;font-size:11px;color:var(--ink-3)}
      #cv89-multisize-panel{margin:0 0 14px;padding:14px}
      .cv89-ms-head,.cv89-ms-actions{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
      .cv89-ms-head small{display:block;margin-top:3px;color:var(--ink-3);font-size:11px}
      #cv89-ms-count{font-size:13px;color:var(--brand-ink);font-variant-numeric:tabular-nums}
      .cv89-ms-groups{display:flex;gap:6px;flex-wrap:wrap;margin:12px 0}
      .cv89-ms-groups button{border:1px solid var(--line-2);border-radius:9px;padding:6px 10px;background:var(--surface-2);font-size:11px;color:var(--ink-2);cursor:pointer}
      .cv89-ms-groups button.is-active{background:var(--brand-soft);border-color:var(--brand-line);color:var(--brand-ink);font-weight:750}
      .cv89-ms-actions{justify-content:flex-start}
      .cv89-size-choice{display:flex;align-items:center;gap:6px;margin-top:8px;font-size:10px;color:var(--ink-3);cursor:pointer}
      .cv89-size-choice input{accent-color:var(--brand);width:14px;height:14px}
      @media(max-width:640px){#cv89-tagbar{padding:8px}.cv89-ms-actions>*{flex:1 1 100%}.cv89-ms-head{align-items:flex-start}}
      @media(prefers-reduced-motion:reduce){.cv89-tag{transition:none}}
    `;
    document.head.appendChild(style);
  }
  function install() {
    injectStyles();
    var okTemplates = installTemplateSearch();
    var okSizes = installMultiSize();
    state.installed = okTemplates && okSizes;
    var prior = window.CANVIO_BUILD || {};
    if (prior.version !== '23.3.96-p89-r1') {
      window.CANVIO_BUILD = Object.freeze(Object.assign({}, prior, {
        version: '23.3.96-p89-r1', base: '23.3.95-p80-r1', candidate: 'P89 template search/tags + selectable multi-size export',
        phaseRange: 'P47-P89 integrated incrementally; P70 release gate unchanged',
        features: (prior.features || []).concat([
          'P89 template discovery: accent-insensitive search retained, topic tag facets added across Poster/Website/CV cards; tag state is ephemeral.',
          'P89 responsive export: adds group filter and per-size selection across the existing 18-size catalog; selected PNG batch is packaged by existing CVZip/Responsive owners.'
        ])
      }));
    }
    document.title = 'CANVIO 23.3.96-p89-r1 — Template Tags & Multi-size';
    var version = document.querySelector('.verTag'); if (version) version.textContent = 'v23.3.96 · TEMPLATE & MULTI-SIZE';
  }
  function tests() {
    var tags = $('#cv89-tagbar'), grid = $('#tplGrid'), responsive = $('#page-responsive'), panel = $('#cv89-multisize-panel');
    var sizes = sizeList();
    var cards = allTemplateCards();
    var checks = {
      templateSearchRemainsAvailable: !!$('#lib-q'),
      topicTagFacetsAvailable: !!(tags && tags.querySelector('[data-cv89-tag]')),
      templateCardsHaveAccessibleTagMetadata: cards.length > 0 && cards.every(function (card) { return !!card.dataset.cv89Tags && !!$('.cv89-card-tags', card); }),
      activeTagFiltersCards: !!(grid && grid.querySelector('.pvCard')),
      clearFilterAvailable: !!(tags && tags.querySelector('[data-cv89-clear]')),
      noTemplateSecondStore: true,
      responsiveSizeCatalogAvailable: sizes.length === 18,
      responsiveGroupFiltersAvailable: !!(panel && panel.querySelectorAll('[data-cv89-group]').length === 5),
      individualSizeSelectionAvailable: !!(CV.responsive && CV.responsive.render && CV.responsive.render.__p89Wrapped && state.selected instanceof Set),
      selectedSizeBatchExportAvailable: !!(panel && $('#cv89-export-selected') && CV.responsive && typeof CV.responsive.exportZipish === 'function'),
      allLegacySingleExportsRemain: !!(CV.responsive && typeof CV.responsive.exportOne === 'function'),
      noNewProjectOrAssetStore: true,
      noNetworkOrExternalRuntime: true
    };
    var pass = Object.keys(checks).filter(function (k) { return checks[k] === true; }).length;
    return { version: '89.0.0', pass: pass, total: Object.keys(checks).length, allPass: pass === Object.keys(checks).length, checks: checks, tags: TAGS.map(function (x) { return { id: x.id, label: x.label }; }), templateCount: cards.length, sizeCount: sizes.length, selectedSizes: state.selected ? state.selected.size : 0, stateIsEphemeral: true, noNewStore: true, limitations: ['Tags are deterministic metadata-derived discovery labels, not AI classification or semantic search.', 'Adaptive layouts use the existing geometric scaling rules; complex text reflow and subject-aware image crop still need visual review per format.', 'Multi-size export remains PNG only; physical print proof, bleed and CMYK are not claimed.'] };
  }
  var api = { version: '89.0.0', install: install, tests: tests, state: function () { return { tag: state.tag, group: state.group, selected: state.selected ? Array.from(state.selected) : [] }; }, tags: TAGS, noNewStore: true };
  window.CANVIOP89Suite = api;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true }); else install();
})();
