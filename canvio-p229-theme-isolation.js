/* P229.2 — keep Spatial theme ownership inside the Spatial Inspector.
   The Inspector is mounted lazily in some shell states. Install the theme adapter
   as soon as its root exists instead of silently returning during initial boot. */
(function () {
  'use strict';
  if (window.CV229ThemeIsolationP229) return;
  var names = ['glass', 'midnight', 'aurora', 'cyber', 'graffiti', 'neonlight'];
  var api = window.CV229;
  if (!api || typeof api.setTheme !== 'function') return;
  var originalSetTheme = api.setTheme;
  var clickBound = false;
  var observer = null;

  function getRoot() { return document.getElementById('cv229-inspector'); }
  function activeTheme(theme) {
    var state = typeof api.state === 'function' ? api.state() : {};
    return names.indexOf(state.theme) >= 0 ? state.theme :
      (names.indexOf(theme) >= 0 ? theme : 'graffiti');
  }
  function cleanBody() {
    names.forEach(function (name) {
      if (document.body) document.body.classList.remove('cv229-theme-' + name);
    });
  }
  function scopeCss(style) {
    if (!style || style.tagName !== 'STYLE' || style.dataset.cv229ThemeScoped === '1') return false;
    var source = style.textContent || '';
    if (!source.includes('cv229-theme-')) return false;
    var scoped = source.replace(/(?:html\s+)?body\.cv229-theme-(glass|midnight|aurora|cyber|graffiti|neonlight)/g,
      '.cv229-inspector.cv229-theme-$1');
    if (scoped !== source) style.textContent = scoped;
    style.dataset.cv229ThemeScoped = '1';
    return scoped !== source;
  }
  function scopeAllCss() {
    document.querySelectorAll('style').forEach(scopeCss);
  }
  function syncRoot(theme) {
    var root = getRoot();
    cleanBody();
    if (!root) return false;
    names.forEach(function (name) { root.classList.remove('cv229-theme-' + name); });
    var active = activeTheme(theme);
    root.classList.add('cv229-theme-' + active);
    if (active === 'cyber') root.classList.add('cv229-theme-midnight');
    root.setAttribute('data-cv229-theme', active);
    scopeAllCss();
    if (!clickBound) {
      root.addEventListener('click', function (event) {
        var button = event.target && event.target.closest ? event.target.closest('[data-cv229-theme]') : null;
        if (!button || !root.contains(button)) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        setTheme(button.dataset.cv229Theme);
      }, true);
      clickBound = true;
    }
    return true;
  }
  function setTheme(theme) {
    var result = originalSetTheme.call(api, theme);
    cleanBody();
    syncRoot(theme);
    return result;
  }

  api.setTheme = setTheme;
  scopeAllCss();
  syncRoot((typeof api.state === 'function' && api.state().theme) || 'graffiti');

  if (window.MutationObserver && document.documentElement) {
    observer = new MutationObserver(function (records) {
      var rootAdded = false;
      records.forEach(function (record) {
        if (record.type === 'childList') {
          record.addedNodes.forEach(function (node) {
            if (node.nodeType !== 1) return;
            if (node.tagName === 'STYLE') scopeCss(node);
            if (node.querySelectorAll) {
              node.querySelectorAll('style').forEach(scopeCss);
              if (node.id === 'cv229-inspector' || node.querySelector('#cv229-inspector')) rootAdded = true;
            }
          });
        }
      });
      if (rootAdded || (getRoot() && !clickBound)) syncRoot();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  window.CV229ThemeIsolationP229 = {
    version: '229.2.0',
    setTheme: setTheme,
    audit: function () {
      var root = getRoot();
      return {
        bodyThemeClasses: names.filter(function (name) { return document.body.classList.contains('cv229-theme-' + name); }),
        inspectorThemeClasses: root ? names.filter(function (name) { return root.classList.contains('cv229-theme-' + name); }) : [],
        inspectorMounted: !!root,
        scopedStyleCount: document.querySelectorAll('style[data-cv229-theme-scoped="1"]').length,
        globalThemeSelectors: Array.from(document.querySelectorAll('style')).filter(function (style) {
          return /(?:html\s+)?body\.cv229-theme-(?:glass|midnight|aurora|cyber|graffiti|neonlight)/.test(style.textContent || '');
        }).length
      };
    }
  };
})();
