/* CANVIO P62 — Phase 1 release candidate gate. It is intentionally fail-closed. */
(function () {
  'use strict';
  var GATES = [
    { id: 'browser-matrix', label: 'Chrome / Edge / Safari trên HTTPS', status: 'OPEN', evidence: 'Cần kiểm tra first boot, navigation, console và worker trên từng browser thật.' },
    { id: 'real-media-export', label: 'Media export thực và đồng bộ A/V', status: 'OPEN', evidence: 'Cần file video/audio thật, decode, duration, A/V sync và cancellation ở nhiều thời điểm.' },
    { id: 'whisper-inference', label: 'Whisper model inference thật', status: 'OPEN', evidence: 'Cần tải runtime/model, chạy Vietnamese/English/auto, timestamp, cancel, unload và retry.' },
    { id: 'native-persistence', label: 'IndexedDB native và backup/restore', status: 'OPEN', evidence: 'Cần save/close/reopen, ZIP same-origin/fresh-origin, quota, blocked, corrupt và oversize.' },
    { id: 'accessibility', label: 'Keyboard, screen reader và 200% zoom', status: 'OPEN', evidence: 'Cần nghiệm thu thủ công bằng screen reader và browser zoom thực.' },
    { id: 'hosting-security', label: 'Hosting, HTTPS, CSP, CORS và headers', status: 'OPEN', evidence: 'Cần deployment thật, response headers, worker/model paths và post-deploy smoke.' }
  ];
  async function run() {
    var prior = window.CANVIOReleaseGate && typeof window.CANVIOReleaseGate.run === 'function'
      ? await window.CANVIOReleaseGate.run() : null;
    var phaseTests = window.CANVIOPhaseSuite && typeof window.CANVIOPhaseSuite.tests === 'function'
      ? window.CANVIOPhaseSuite.tests() : {};
    var persistence = window.CANVIOPersistenceAudit;
    var report = {
      format: 'CANVIO_PHASE1_RELEASE_CANDIDATE',
      candidate: 'P62',
      build: window.CANVIO_BUILD && window.CANVIO_BUILD.version || 'unknown',
      phaseSuite: window.CANVIOPhaseSuite && window.CANVIOPhaseSuite.version || '62.0.0',
      generatedAt: new Date().toISOString(),
      implementation: {
        P57: !!persistence,
        P58: !!window.CANVIOExportAcceptance,
        P59: !!window.CANVIOWhisperAcceptance,
        P60: !!window.CANVIOAccessibilityAudit,
        P61: !!window.CANVIOHostingSecurityAudit,
        P62: true
      },
      runtimeFeatureFlags: phaseTests,
      priorReleaseGate: prior ? { candidate: prior.candidate || null, status: prior.status || null, releaseCertified: prior.releaseCertified === true } : null,
      manualGates: GATES.map(function (gate) { return Object.assign({}, gate); }),
      releaseCertified: false,
      status: 'BLOCKED_PENDING_REAL_WORLD_ACCEPTANCE',
      limitations: [
        'Local source/VM and synthetic browser tests do not certify native storage or data recovery.',
        'Synthetic MediaRecorder output does not certify real user-media A/V synchronization.',
        'Worker asset inspection does not execute Whisper inference.',
        'DOM accessibility screening does not replace WCAG, screen-reader or true 200% zoom review.',
        'DOM checks cannot prove server response headers or a successful deployed Pages workflow.'
      ]
    };
    return JSON.parse(JSON.stringify(report));
  }
  window.CANVIOPhase1ReleaseGate = { version: '62.0.0', run: run, gates: function () { return GATES.map(function (x) { return Object.assign({}, x); }); } };
  var oldBuild = window.CANVIO_BUILD || {};
  window.CANVIO_BUILD = Object.freeze(Object.assign({}, oldBuild, {
    version: '23.3.76-p62', base: '23.3.70-p56', candidate: 'P62',
    features: (oldBuild.features || []).concat([
      'P57 native IndexedDB persistence audit and safe sentinel round-trip',
      'P58 local exported-media metadata/decode-readiness acceptance',
      'P59 Whisper worker provenance/privacy/runtime input hardening',
      'P60 DOM accessibility screening with explicit manual limitations',
      'P61 hosting/security environment audit',
      'P62 fail-closed Phase 1 release candidate gate'
    ])
  }));
  try { document.title = 'CANVIO 23.3.76-p62 — Phase 1 Release Candidate'; } catch (error) {}

  var suite = window.CANVIOPhaseSuite;
  if (suite) {
    var previousTests = suite.tests; suite.version = '62.0.0';
    suite.tests = function () {
      var result = previousTests ? previousTests.apply(this, arguments) : {};
      result.p62Phase1ReleaseGate = !!(window.CANVIOPhase1ReleaseGate && window.CANVIOPhase1ReleaseGate.run);
      return result;
    };
  }
})();
