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

  function getRoot() { return document.getElementById('cv229-inspector'); }
  function activeTheme(hint) {
    var state = typeof api.state === 'function' ? api.state() : {};
    return names.indexOf(state && state.theme) >= 0 ? state.theme :
      (names.indexOf(hint) >= 0 ? hint : 'graffiti');
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
      if (rootAdded) bindPicker();
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
        var css = style.textContent || '';
        var matches = css.match(/(?:html\s+)?body\.cv229-theme-(?:glass|midnight|aurora|cyber|graffiti|neonlight)/g);
        globalSelectorCount += matches ? matches.length : 0;
      });
      return {
        activeTheme: active,
        bodyThemeClasses: names.filter(function (name) {
          return body.classList.contains('cv229-theme-' + name);
        }),
        inspectorThemeClasses: inspector ? names.filter(function (name) {
          return inspector.classList.contains('cv229-theme-' + name);
        }) : [],
        globalThemeSelectors: globalSelectorCount,
        globalThemeApplied: body.classList.contains('cv229-theme-' + active),
        pickerButtonsSynced: Array.prototype.every.call(document.querySelectorAll('[data-cv229-theme]'), function (button) {
          return button.getAttribute('aria-pressed') ===
            (button.getAttribute('data-cv229-theme') === active ? 'true' : 'false');
        })
      };
    }
  };
})();