/* P229.1 — keep Spatial theme ownership inside the Spatial Inspector.
   Legacy theme CSS was body-scoped and recolored the shell/workspaces. This adapter
   rewrites those selectors to the inspector root and routes every theme change there. */
(function () {
  'use strict';
  if (window.CV229ThemeIsolationP229) return;
  var names = ['glass', 'midnight', 'aurora', 'cyber', 'graffiti', 'neonlight'];

  function install() {
    if (window.CV229ThemeIsolationP229) return true;
    var root = document.getElementById('cv229-inspector');
    var api = window.CV229;
    if (!root || !api || typeof api.setTheme !== 'function') return false;
    var originalSetTheme = api.setTheme;

    function cleanBody() {
      names.forEach(function (name) { document.body.classList.remove('cv229-theme-' + name); });
    }
    function scopeCss(style) {
      if (!style || style.tagName !== 'STYLE' || style.dataset.cv229ThemeScoped === '1') return false;
      var source = style.textContent || '';
      if (!source.includes('cv229-theme-')) return false;
      var scoped = source.replace(/(?:html\s+)?body\.cv229-theme-(glass|midnight|aurora|cyber|graffiti|neonlight)/g, '.cv229-inspector.cv229-theme-$1');
      if (scoped !== source) style.textContent = scoped;
      style.dataset.cv229ThemeScoped = '1';
      return scoped !== source;
    }
    function scopeAllCss() { document.querySelectorAll('style').forEach(scopeCss); }
    function setTheme(theme) {
      var result = originalSetTheme.call(api, theme);
      var state = typeof api.state === 'function' ? api.state() : {};
      var active = names.indexOf(state.theme) >= 0 ? state.theme : (names.indexOf(theme) >= 0 ? theme : 'graffiti');
      cleanBody();
      names.forEach(function (name) { root.classList.remove('cv229-theme-' + name); });
      root.classList.add('cv229-theme-' + active);
      if (active === 'cyber') root.classList.add('cv229-theme-midnight');
      root.setAttribute('data-cv229-theme', active);
      scopeAllCss();
      return result;
    }
    api.setTheme = setTheme;
    root.addEventListener('click', function (event) {
      var button = event.target && event.target.closest ? event.target.closest('[data-cv229-theme]') : null;
      if (!button || !root.contains(button)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      setTheme(button.dataset.cv229Theme);
    }, true);
    scopeAllCss();
    setTheme((typeof api.state === 'function' && api.state().theme) || 'graffiti');

    if (window.MutationObserver) {
      var observer = new MutationObserver(function (records) {
        var bodyChanged = false;
        records.forEach(function (record) {
          if (record.type === 'attributes' && record.target === document.body && record.attributeName === 'class') bodyChanged = true;
          if (record.type === 'childList') record.addedNodes.forEach(function (node) {
            if (node.nodeType !== 1) return;
            if (node.tagName === 'STYLE') scopeCss(node);
            if (node.querySelectorAll) node.querySelectorAll('style').forEach(scopeCss);
          });
        });
        if (bodyChanged) {
          var leaked = names.find(function (name) { return document.body.classList.contains('cv229-theme-' + name); });
          if (leaked) setTheme(leaked);
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
      observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }
    window.CV229ThemeIsolationP229 = {
      version: '229.1.0',
      setTheme: setTheme,
      audit: function () {
        return {
          bodyThemeClasses: names.filter(function (name) { return document.body.classList.contains('cv229-theme-' + name); }),
          inspectorThemeClasses: names.filter(function (name) { return root.classList.contains('cv229-theme-' + name); }),
          scopedStyleCount: document.querySelectorAll('style[data-cv229-theme-scoped="1"]').length,
          globalThemeSelectors: Array.from(document.querySelectorAll('style')).filter(function (style) {
            return /(?:html\s+)?body\.cv229-theme-(?:glass|midnight|aurora|cyber|graffiti|neonlight)/.test(style.textContent || '');
          }).length
        };
      }
    };
    return true;
  }

  /* The canonical bundle can publish CV229 after DOM-ready; retry until its owner exists. */
  if (!install()) {
    var attempts = 0;
    var retry = window.setInterval(function () {
      attempts += 1;
      if (install() || attempts >= 600) window.clearInterval(retry);
    }, 50);
  }
})();
