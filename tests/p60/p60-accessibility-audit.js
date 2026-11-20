/* CANVIO P60 — In-app accessibility screening; it is not a WCAG certification. */
(function () {
  'use strict';
  var lastReport = null;
  function visible(node) {
    var current = node;
    while (current && current !== document) {
      if (current.hidden || (current.getAttribute && current.getAttribute('aria-hidden') === 'true')) return false;
      var style = window.getComputedStyle ? window.getComputedStyle(current) : null;
      if (style && (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse')) return false;
      current = current.parentElement;
    }
    return !!node;
  }
  function referencedName(ids) {
    if (!ids || typeof document.getElementById !== 'function') return '';
    return String(ids).trim().split(/\s+/).map(function (id) {
      var target = document.getElementById(id);
      return target ? String(target.innerText || target.textContent || '').replace(/\s+/g, ' ').trim() : '';
    }).filter(Boolean).join(' ').trim();
  }
  function hasName(node) {
    // aria-labelledby accepts a whitespace-separated list of ID references.
    if (referencedName(node.getAttribute('aria-labelledby'))) return true;
    var aria = (node.getAttribute('aria-label') || '').trim();
    if (aria) return true;
    var title = (node.getAttribute('title') || '').trim();
    var text = (node.innerText || node.textContent || '').replace(/\s+/g, ' ').trim();
    if (title || text) return true;
    // Native label association is safer than interpolating arbitrary IDs into selectors.
    if (node.labels && node.labels.length) {
      for (var i = 0; i < node.labels.length; i++) {
        var labelText = (node.labels[i].innerText || node.labels[i].textContent || '').replace(/\s+/g, ' ').trim();
        if (labelText) return true;
      }
    }
    if (node.id && document.querySelectorAll) {
      var labels = document.querySelectorAll('label[for]');
      for (var j = 0; j < labels.length; j++) {
        if (String(labels[j].getAttribute('for') || '') !== String(node.id)) continue;
        var explicitText = (labels[j].innerText || labels[j].textContent || '').replace(/\s+/g, ' ').trim();
        if (explicitText) return true;
      }
    }
    return !!(node.closest && node.closest('label'));
  }
  function inspect(root) {
    root = root || document;
    var issues = [], totalIssues = 0, counts = { controls: 0, unnamedControls: 0, images: 0, imagesMissingAlt: 0, landmarks: 0, headings: 0, dialogs: 0, dialogsMissingName: 0, buttonsMissingType: 0 };
    function add(code, node, detail) {
      totalIssues++;
      if (issues.length < 200) issues.push({ code: code, tag: node && node.tagName ? node.tagName.toLowerCase() : '', id: node && node.id || '', detail: detail });
    }
    var controls = root.querySelectorAll ? root.querySelectorAll('button,a[href],input,select,textarea,[role="button"],[role="link"],[tabindex]:not([tabindex="-1"])') : [];
    Array.prototype.forEach.call(controls, function (node) {
      if (!visible(node)) return;
      counts.controls++;
      if (!hasName(node)) { counts.unnamedControls++; add('control-name-missing', node, 'Thiếu tên truy cập bằng text, label hoặc ARIA.'); }
      if (node.tagName && node.tagName.toLowerCase() === 'button' && node.form && !node.hasAttribute('type')) { counts.buttonsMissingType++; add('button-type-missing', node, 'Nên khai báo type="button" hoặc type="submit".'); }
    });
    var images = root.querySelectorAll ? root.querySelectorAll('img') : [];
    Array.prototype.forEach.call(images, function (node) {
      counts.images++;
      if (!node.hasAttribute('alt')) { counts.imagesMissingAlt++; add('image-alt-missing', node, 'Ảnh cần alt mô tả hoặc alt="" nếu trang trí.'); }
    });
    var landmarks = root.querySelectorAll ? root.querySelectorAll('main,nav,header,footer,aside,[role="main"],[role="navigation"],[role="region"]') : [];
    counts.landmarks = landmarks.length;
    var headings = root.querySelectorAll ? root.querySelectorAll('h1,h2,h3,h4,h5,h6') : [];
    counts.headings = headings.length;
    var dialogs = root.querySelectorAll ? root.querySelectorAll('[role="dialog"],[aria-modal="true"]') : [];
    counts.dialogs = dialogs.length;
    Array.prototype.forEach.call(dialogs, function (node) {
      if (!hasName(node)) { counts.dialogsMissingName++; add('dialog-name-missing', node, 'Dialog cần accessible name.'); }
    });
    var report = {
      version: '60.0.0',
      counts: counts,
      issueCount: totalIssues,
      capturedIssues: issues.length,
      issues: issues,
      truncated: totalIssues > issues.length,
      scope: { automatedScreeningOnly: true, wcagCertified: false, true200PercentZoomTested: false, screenReaderTested: false }
    };
    lastReport = report;
    return JSON.parse(JSON.stringify(report));
  }
  window.CANVIOAccessibilityAudit = { version: '60.0.0', inspect: inspect, last: function () { return lastReport ? JSON.parse(JSON.stringify(lastReport)) : null; } };
  var suite = window.CANVIOPhaseSuite;
  if (suite) {
    var previousTests = suite.tests; suite.version = '60.0.0';
    suite.tests = function () {
      var result = previousTests ? previousTests.apply(this, arguments) : {};
      result.p60AccessibilityScreening = !!(window.CANVIOAccessibilityAudit && window.CANVIOAccessibilityAudit.inspect);
      return result;
    };
  }
})();
