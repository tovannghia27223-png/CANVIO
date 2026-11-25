/* P229.3 — one shared appearance palette for the complete CANVIO interface.
   The Spatial Appearance picker is the global palette control: shell navigation,
   topbar, menus, shared buttons, cards, toolbars, workspace surfaces and Spatial
   Inspector all follow the same active palette. Keep the canonical body selectors
   intact; never rewrite or scope them to the Inspector. */
(function () {
  'use strict';
  if (window.CV229ThemeGlobalP229) return;
  var names = ['glass', 'midnight', 'aurora', 'cyber', 'graffiti', 'neonlight'];
  var api = window.CV229;
  if (!api || typeof api.setTheme !== 'function') return;
  var originalSetTheme = api.setTheme;
  var clickBound = false;
  var observer = null;
  var spatialStyle = null;
  var palettes = {
    glass: { panel: 'rgba(255,255,255,.90)', section: 'rgba(255,255,255,.76)', line: 'rgba(171,187,214,.42)', ink: '#192740', muted: '#7888a1', accent: '#647d9d', soft: 'rgba(100,125,157,.12)' },
    midnight: { panel: 'rgba(25,38,56,.98)', section: '#23334a', line: '#34445b', ink: '#e8eef7', muted: '#aebbd0', accent: '#9ab8ee', soft: 'rgba(112,153,213,.18)' },
    aurora: { panel: 'rgba(255,255,255,.94)', section: 'rgba(245,244,255,.90)', line: 'rgba(156,137,255,.34)', ink: '#26344b', muted: '#68778d', accent: '#8b78d8', soft: 'rgba(156,137,255,.14)' },
    cyber: { panel: 'rgba(15,16,32,.98)', section: '#141530', line: '#34376b', ink: '#eaf0ff', muted: '#b5bfe6', accent: '#00e5ff', soft: '#0a2a3c' },
    graffiti: { panel: 'rgba(255,255,255,.98)', section: '#f7f2ff', line: '#d9c8fb', ink: '#10182a', muted: '#46536a', accent: '#ff3d9a', soft: '#f2eaff' },
    neonlight: { panel: '#ffffff', section: '#f8fafd', line: '#d0d8e8', ink: '#0e1530', muted: '#434d6b', accent: '#0780a8', soft: '#e4f7fc' }
  };

  function getRoot() { return document.getElementById('cv229-inspector'); }
  function activeTheme(hint) {
    var state = typeof api.state === 'function' ? api.state() : {};
    return names.indexOf(state && state.theme) >= 0 ? state.theme :
      (names.indexOf(hint) >= 0 ? hint : 'graffiti');
  }
  function installSpatialPaletteBridge() {
    if (spatialStyle && spatialStyle.isConnected) return;
    spatialStyle = document.getElementById('canvio-p229-global-spatial-theme');
    if (spatialStyle) return;
    spatialStyle = document.createElement('style');
    spatialStyle.id = 'canvio-p229-global-spatial-theme';
    var css = '';
    names.forEach(function (name) {
      var p = palettes[name];
      var root = 'body.cv229-theme-' + name + ' #cv229-inspector';
      css += root + '{background:' + p.panel + '!important;color:' + p.ink + '!important;border-color:' + p.line + '!important;}\n';
      css += root + ' .cv229-inspector-head{background:' + p.section + '!important;border-color:' + p.line + '!important;color:' + p.ink + '!important;}\n';
      css += root + ' .cv229-inspector-brand strong,' + root + ' .cv229-section-title b{color:' + p.ink + '!important;}\n';
      css += root + ' .cv229-inspector-brand small,' + root + ' .cv229-inspector-foot,' + root + ' .cv229-section-title span,' + root + ' .cv230-preview-controls label{color:' + p.muted + '!important;}\n';
      css += root + ' .cv229-kicker{color:' + p.accent + '!important;}\n';
      css += root + ' .cv229-search{background:' + p.section + '!important;border-color:' + p.line + '!important;color:' + p.ink + '!important;}\n';
      css += root + ' .cv229-search input{color:' + p.ink + '!important;}\n';
      css += root + ' .cv229-search span{color:' + p.muted + '!important;}\n';
      css += root + ' .cv230-preview-controls input{accent-color:' + p.accent + '!important;}\n';
      css += root + ' .cv229-empty{color:' + p.muted + '!important;border-color:' + p.line + '!important;}\n';
      css += root + ' .cv229-section,' + root + ' .cv230-preview-stage,' + root + ' .cv230-preview-empty{background:' + p.section + '!important;border-color:' + p.line + '!important;color:' + p.ink + '!important;}\n';
      css += root + ' .cv229-route,' + root + ' .cv229-control,' + root + ' .cv229-dock-row button,' + root + ' .cv229-theme-grid button,' + root + ' .cv229-shortcuts kbd,' + root + ' .cv229-icon-btn,' + root + ' .cv230-layout-grid button,' + root + ' .cv230-preview-toolbar button,' + root + ' .cv230-preview-controls button{background:' + p.section + '!important;border-color:' + p.line + '!important;color:' + p.ink + '!important;}\n';
      css += root + ' .cv229-route.active,' + root + ' .cv229-control[aria-pressed="true"],' + root + ' .cv229-dock-row button.active,' + root + ' .cv229-theme-grid button.active,' + root + ' .cv230-layout-grid button.active,' + root + ' .cv230-preview-toolbar button.active{background:' + p.soft + '!important;border-color:' + p.accent + '!important;color:' + p.accent + '!important;box-shadow:inset 0 0 0 1px ' + p.accent + '!important;}\n';
    });
    (document.body || document.documentElement).appendChild(spatialStyle);
  }
  function syncGlobalTheme(hint) {
    var body = document.body;
    var root = document.documentElement;
    var inspector = getRoot();
    if (!body || !root) return false;
    var active = activeTheme(hint);

    /* The body is the single theme owner. Descendant workspaces inherit the
       shared semantic variables and match the existing body.cv229-theme-* CSS. */
    names.forEach(function (name) {
      body.classList.remove('cv229-theme-' + name);
      if (inspector) inspector.classList.remove('cv229-theme-' + name);
    });
    body.classList.add('cv229-theme-' + active);
    if (active === 'cyber') body.classList.add('cv229-theme-midnight');
    root.setAttribute('data-cv229-theme', active);
    body.setAttribute('data-cv229-theme', active);

    Array.prototype.forEach.call(document.querySelectorAll('[data-cv229-theme]'), function (button) {
      var selected = button.getAttribute('data-cv229-theme') === active;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });
    installSpatialPaletteBridge();
    return true;
  }
  function setTheme(theme) {
    var result = originalSetTheme.call(api, theme);
    syncGlobalTheme(theme);
    return result;
  }
  function bindPicker() {
    var root = getRoot();
    if (!root || clickBound) return;
    root.addEventListener('click', function (event) {
      var button = event.target && event.target.closest ?
        event.target.closest('[data-cv229-theme]') : null;
      if (!button || !root.contains(button)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      setTheme(button.getAttribute('data-cv229-theme'));
    }, true);
    clickBound = true;
  }

  api.setTheme = setTheme;
  bindPicker();
  syncGlobalTheme();

  if (window.MutationObserver && document.documentElement) {
    observer = new MutationObserver(function (records) {
      var rootAdded = false;
      records.forEach(function (record) {
        if (record.type !== 'childList') return;
        Array.prototype.forEach.call(record.addedNodes, function (node) {
          if (!node || node.nodeType !== 1) return;
          if (node.id === 'cv229-inspector' ||
              (node.querySelector && node.querySelector('#cv229-inspector'))) rootAdded = true;
        });
      });
      if (rootAdded) {
        bindPicker();
        syncGlobalTheme();
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  window.CV229ThemeGlobalP229 = {
    version: '229.3.0',
    setTheme: setTheme,
    sync: syncGlobalTheme,
    audit: function () {
      var body = document.body;
      var inspector = getRoot();
      var active = activeTheme();
      var globalSelectorCount = 0;
      Array.prototype.forEach.call(document.querySelectorAll('style'), function (style) {
        var matches = (style.textContent || '').match(/(?:html\s+)?body\.cv229-theme-(?:glass|midnight|aurora|cyber|graffiti|neonlight)/g);
        globalSelectorCount += matches ? matches.length : 0;
      });
      return {
        activeTheme: active,
        bodyThemeClasses: names.filter(function (name) { return body.classList.contains('cv229-theme-' + name); }),
        inspectorThemeClasses: inspector ? names.filter(function (name) { return inspector.classList.contains('cv229-theme-' + name); }) : [],
        globalThemeSelectors: globalSelectorCount,
        globalThemeApplied: body.classList.contains('cv229-theme-' + active),
        spatialPaletteBridge: !!document.getElementById('canvio-p229-global-spatial-theme'),
        pickerButtonsSynced: Array.prototype.every.call(document.querySelectorAll('[data-cv229-theme]'), function (button) {
          return button.getAttribute('aria-pressed') ===
            (button.getAttribute('data-cv229-theme') === active ? 'true' : 'false');
        })
      };
    }
  };
})();