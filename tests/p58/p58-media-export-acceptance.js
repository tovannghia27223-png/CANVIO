/* CANVIO P58 — Read-only validation of a user-selected exported media file. */
(function () {
  'use strict';
  var lastReport = null;
  function inspectFile(file, options) {
    options = options || {};
    if (!file || !Number.isFinite(Number(file.size)) || Number(file.size) <= 0) return Promise.reject(new Error('Tệp xuất rỗng hoặc không hợp lệ.'));
    if (Number(file.size) > 2 * 1024 * 1024 * 1024) return Promise.reject(new Error('Tệp vượt giới hạn kiểm tra 2 GiB của trình duyệt.'));
    var name = String(file.name || 'exported-media').toLowerCase();
    var type = String(file.type || '').toLowerCase().split(';')[0].trim();
    var extension = /\.mp4$/.test(name) ? 'mp4' : /\.webm$/.test(name) ? 'webm' : '';
    if (type && type !== 'video/mp4' && type !== 'video/webm') return Promise.reject(new Error('Chỉ kiểm tra được file video MP4 hoặc WebM.'));
    if (!extension && type === 'video/mp4') extension = 'mp4';
    if (!extension && type === 'video/webm') extension = 'webm';
    if (!extension) return Promise.reject(new Error('Không xác định được định dạng MP4/WebM từ tên hoặc MIME.'));
    if (type && ((extension === 'mp4' && type !== 'video/mp4') || (extension === 'webm' && type !== 'video/webm'))) return Promise.reject(new Error('Phần mở rộng và MIME của file không khớp.'));
    if (!window.URL || typeof URL.createObjectURL !== 'function') return Promise.reject(new Error('Object URL không khả dụng để kiểm tra file.'));
    return new Promise(function (resolve, reject) {
      var video = document.createElement('video');
      var url = URL.createObjectURL(file);
      var settled = false;
      var timer = setTimeout(function () { finish(new Error('Hết thời gian chờ trình duyệt đọc metadata/decode file.')); }, Number(options.timeoutMs) > 0 ? Math.min(Number(options.timeoutMs), 30000) : 15000);
      function cleanup() {
        clearTimeout(timer);
        try { video.pause(); } catch (error) {}
        try { video.removeAttribute('src'); video.load(); } catch (error) {}
        try { URL.revokeObjectURL(url); } catch (error) {}
      }
      function finish(error) {
        if (settled) return;
        settled = true;
        if (error) { cleanup(); reject(error); return; }
        var report = {
          format: extension,
          mime: type || 'browser-detected',
          bytes: Number(file.size),
          durationSeconds: Number(video.duration),
          width: Number(video.videoWidth),
          height: Number(video.videoHeight),
          metadataReadable: true,
          decodeReadiness: true,
          scope: { sourceFileOnly: true, upload: false, storageMutation: false, avSyncCertified: false }
        };
        cleanup();
        lastReport = report;
        resolve(JSON.parse(JSON.stringify(report)));
      }
      video.preload = 'auto';
      video.muted = true;
      video.playsInline = true;
      video.onloadedmetadata = function () {
        if (!Number.isFinite(video.duration) || video.duration <= 0 || video.videoWidth <= 0 || video.videoHeight <= 0) {
          finish(new Error('Metadata video không hợp lệ: thiếu thời lượng hoặc kích thước khung hình.'));
          return;
        }
        // `canplay` is a local browser decode-readiness signal, not a complete
        // frame-by-frame or audio/video synchronization certification.
      };
      video.oncanplay = function () { finish(null); };
      video.onerror = function () { finish(new Error('Trình duyệt không giải mã được file đã chọn.')); };
      try { video.src = url; video.load(); } catch (error) { finish(error); }
    });
  }
  function capabilities() {
    var api = window.CV && CV.engines && CV.engines.video;
    var value = api && typeof api.exportCapabilities === 'function' ? api.exportCapabilities() : null;
    return { browser: value || null, mp4IsOptional: true, requiredRealMediaAcceptance: true };
  }
  window.CANVIOExportAcceptance = {
    version: '58.0.0',
    inspectFile: inspectFile,
    capabilities: capabilities,
    last: function () { return lastReport ? JSON.parse(JSON.stringify(lastReport)) : null; }
  };
  var suite = window.CANVIOPhaseSuite;
  if (suite) {
    var previousTests = suite.tests; suite.version = '58.0.0';
    suite.tests = function () {
      var result = previousTests ? previousTests.apply(this, arguments) : {};
      result.p58ExportAcceptance = !!(window.CANVIOExportAcceptance && window.CANVIOExportAcceptance.inspectFile);
      return result;
    };
  }
})();
