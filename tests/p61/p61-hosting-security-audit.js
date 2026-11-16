/* CANVIO P61 — Read-only deployment/security readiness checks. */
(function () {
  'use strict';
  var lastReport = null;
  function inspect() {
    var location = window.location || { protocol: 'about:', origin: 'null' };
    var base = document.baseURI || (location.href || 'about:blank');
    var worker;
    try { worker = new URL('assets/canvio-whisper-worker.js', base); }
    catch (error) { worker = null; }
    var scripts = document.querySelectorAll ? Array.prototype.slice.call(document.querySelectorAll('script[src]')).map(function (node) { return node.src; }) : [];
    var media = document.querySelectorAll ? Array.prototype.slice.call(document.querySelectorAll('[src],[href]')).filter(function (node) { var value = node.getAttribute('src') || node.getAttribute('href') || ''; return /^http:\/\//i.test(value); }).length : 0;
    var cspMeta = document.querySelector ? document.querySelector('meta[http-equiv="Content-Security-Policy" i]') : null;
    var secure = !!window.isSecureContext;
    var sameOriginWorker = !!(worker && location.origin && worker.origin === location.origin);
    var report = {
      version: '61.0.0',
      origin: location.origin || null,
      protocol: location.protocol || null,
      secureContext: secure,
      secureTransport: location.protocol === 'https:' || (location.hostname === 'localhost' || location.hostname === '127.0.0.1'),
      workerUrl: worker && worker.href || null,
      workerSameOrigin: sameOriginWorker,
      externalScriptSources: scripts,
      externalScriptCount: scripts.length,
      mixedContentReferenceCount: media,
      cspMetaPresent: !!cspMeta,
      serverSecurityHeadersVerified: false,
      scope: { readOnly: true, networkProbe: false, headersRequireServerInspection: true, cspRequiresDependencyReview: true },
      warnings: []
    };
    if (!secure) report.warnings.push('Context chưa được xác nhận là secure context HTTPS.');
    if (!sameOriginWorker) report.warnings.push('Worker chưa được chứng minh nằm cùng origin; kiểm tra đường dẫn sau deploy.');
    if (media) report.warnings.push('Có tham chiếu HTTP có nguy cơ mixed content.');
    if (!cspMeta) report.warnings.push('Không thấy CSP meta; HTTP response headers vẫn phải kiểm tra tại hosting.');
    report.warnings.push('Không thể xác nhận CSP/CORS/MIME/HSTS/Referrer-Policy bằng DOM; cần kiểm tra response headers thật.');
    report.warnings.push('CANVIO có inline scripts và tải model/runtime theo yêu cầu; không áp CSP nghiêm ngặt trước khi lập dependency/hash/nonce allowlist.');
    lastReport = report;
    return JSON.parse(JSON.stringify(report));
  }
  window.CANVIOHostingSecurityAudit = { version: '61.0.0', inspect: inspect, last: function () { return lastReport ? JSON.parse(JSON.stringify(lastReport)) : null; } };
  var suite = window.CANVIOPhaseSuite;
  if (suite) {
    var previousTests = suite.tests; suite.version = '61.0.0';
    suite.tests = function () {
      var result = previousTests ? previousTests.apply(this, arguments) : {};
      result.p61HostingSecurityScreening = !!(window.CANVIOHostingSecurityAudit && window.CANVIOHostingSecurityAudit.inspect);
      return result;
    };
  }
})();
