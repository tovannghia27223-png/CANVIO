/* CANVIO P59 — Whisper worker provenance and privacy diagnostics. No model request is made here. */
(function () {
  'use strict';
  var WORKER_PATH = 'assets/canvio-whisper-worker.js';
  var lastReport = null;
  function inspectWorker() {
    if (typeof fetch !== 'function' || !window.URL) return Promise.resolve({ available: false, checked: false, modelInferenceTested: false, reason: 'Fetch/URL không khả dụng trong context này.' });
    var url;
    try { url = new URL(WORKER_PATH, document.baseURI); }
    catch (error) { return Promise.resolve({ available: false, checked: false, modelInferenceTested: false, reason: 'Không phân giải được worker URL từ origin hiện tại.' }); }
    if (window.location && url.origin !== window.location.origin) return Promise.resolve({ available: false, checked: false, modelInferenceTested: false, reason: 'Worker URL không cùng origin với ứng dụng.' });
    return fetch(url.href, { method: 'GET', credentials: 'same-origin', cache: 'no-store' }).then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status + ' khi tải worker.');
      return response.text().then(function (source) {
        var report = {
          available: true,
          checked: true,
          status: response.status,
          contentType: response.headers && response.headers.get ? response.headers.get('content-type') : null,
          sameOrigin: true,
          transformersVersionPinned: /Transformers\.js 3\.8\.1/.test(source) && /\.\/p85\/transformers\/transformers\.min\.js/.test(source),
          runtimeSameOrigin: /new URL\(['"]\.\/p85\/transformers\//.test(source) && !/https:\/\/esm\.sh\//.test(source),
          modelPinned: /Xenova\/whisper-tiny/.test(source),
          browserLocalInference: /automatic-speech-recognition/.test(source),
          remoteAsrEndpointAbsent: !/(?:api\.openai\.com\/v1\/audio|speech-to-text\s*:\s*http)/i.test(source),
          sourceBytes: new Blob([source]).size,
          modelInferenceTested: false
        };
        lastReport = report;
        return JSON.parse(JSON.stringify(report));
      });
    }).catch(function (error) {
      var report = { available: false, checked: true, sameOrigin: true, error: error.message || String(error), modelInferenceTested: false };
      lastReport = report;
      return report;
    });
  }
  window.CANVIOWhisperAcceptance = {
    version: '59.0.0',
    workerPath: WORKER_PATH,
    inspectWorker: inspectWorker,
    limits: { maxInputBytes: 100 * 1024 * 1024, maxDurationSeconds: 480, languages: ['vietnamese', 'english', 'auto'] },
    last: function () { return lastReport ? JSON.parse(JSON.stringify(lastReport)) : null; }
  };
  var suite = window.CANVIOPhaseSuite;
  if (suite) {
    var previousTests = suite.tests; suite.version = '59.0.0';
    suite.tests = function () {
      var result = previousTests ? previousTests.apply(this, arguments) : {};
      result.p59WhisperWorkerAcceptance = !!(window.CANVIOWhisperAcceptance && window.CANVIOWhisperAcceptance.inspectWorker);
      return result;
    };
  }
})();
