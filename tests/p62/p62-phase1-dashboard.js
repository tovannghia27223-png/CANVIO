/* CANVIO P57–P62 — user-triggered Phase 1 acceptance panel. */
(function () {
  'use strict';
  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (key === 'className') node.className = attrs[key];
      else if (key === 'style') node.style.cssText = attrs[key];
      else node.setAttribute(key, attrs[key]);
    });
    if (text != null) node.textContent = text;
    return node;
  }
  function mount() {
    var page = document.getElementById('page-videoEngine');
    if (!page || document.getElementById('cv-phase1-acceptance')) return;
    var anchor = page.querySelector('.engine-toolbar');
    if (!anchor || !anchor.parentNode) return;
    var panel = el('section', { id: 'cv-phase1-acceptance', className: 'card', style: 'margin:12px 0;border:1px solid var(--line,#dbe3ee);' });
    panel.setAttribute('aria-labelledby', 'cv-phase1-heading');
    panel.innerHTML = '<div class="cardTop"><div><h3 id="cv-phase1-heading">Chặng 1 · Release Acceptance (P57–P62)</h3><span class="sub">Các phép kiểm tra chỉ chạy khi bạn chủ động bấm; không tự gửi media lên server.</span></div><span class="badgeSoft">P62 candidate</span></div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px;margin:10px 0">' +
      '<button type="button" class="btn btn-soft sm" id="cv-p57-inspect">P57 · Kiểm tra IndexedDB</button>' +
      '<button type="button" class="btn btn-soft sm" id="cv-p57-roundtrip">P57 · Test ghi/đọc/xóa</button>' +
      '<button type="button" class="btn btn-ghost sm" id="cv-p57-persist">P57 · Xin persistent storage</button>' +
      '<button type="button" class="btn btn-soft sm" id="cv-p58-file">P58 · Kiểm tra file xuất</button>' +
      '<button type="button" class="btn btn-soft sm" id="cv-p59-worker">P59 · Kiểm tra Whisper worker</button>' +
      '<button type="button" class="btn btn-soft sm" id="cv-p60-a11y">P60 · Kiểm tra accessibility</button>' +
      '<button type="button" class="btn btn-soft sm" id="cv-p61-host">P61 · Kiểm tra hosting/security</button>' +
      '<button type="button" class="btn btn-primary sm" id="cv-p62-report">P62 · Báo cáo nghiệm thu</button>' +
      '</div><input id="cv-p58-file-input" type="file" accept="video/mp4,video/webm,.mp4,.webm" hidden aria-label="Chọn file MP4 hoặc WebM đã xuất để kiểm tra"><p id="cv-phase1-status" role="status" aria-live="polite" class="tiny">Chưa chạy kiểm tra. P57 chỉ làm việc với database media hiện có; P58 chỉ đọc file bạn chọn.</p><pre id="cv-phase1-output" tabindex="0" style="max-height:260px;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;background:var(--surface-2,#f6f8fb);padding:10px;border-radius:8px;font:11px/1.55 ui-monospace,monospace">P62 chưa tạo báo cáo.</pre>';
    anchor.parentNode.parentNode.insertBefore(panel, anchor.parentNode.nextSibling);
    var status = panel.querySelector('#cv-phase1-status');
    var output = panel.querySelector('#cv-phase1-output');
    function show(label, value) {
      status.textContent = label;
      output.textContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    }
    panel.querySelector('#cv-p57-inspect').addEventListener('click', function () {
      window.CANVIOPersistenceAudit.inspect().then(function (r) { show('P57 · Kiểm tra chỉ đọc hoàn tất.', r); }).catch(function (e) { show('P57 · Kiểm tra thất bại.', { error: e.message || String(e) }); });
    });
    panel.querySelector('#cv-p57-roundtrip').addEventListener('click', function () {
      if (!window.confirm('CANVIO sẽ ghi một Blob kiểm tra tạm vào object store media hiện có, đọc lại rồi xóa trong cùng giao dịch. Không ghi đè media của bạn. Tiếp tục?')) return;
      window.CANVIOPersistenceAudit.roundTrip().then(function (r) { show('P57 · Giao dịch thử nghiệm đã hoàn tất.', r); }).catch(function (e) { show('P57 · Giao dịch thử nghiệm thất bại.', { error: e.message || String(e), keepOriginalMedia: true }); });
    });
    panel.querySelector('#cv-p57-persist').addEventListener('click', function () {
      window.CANVIOPersistenceAudit.requestPersistence().then(function (r) { show('P57 · Kết quả yêu cầu persistent storage.', r); });
    });
    panel.querySelector('#cv-p58-file').addEventListener('click', function () { panel.querySelector('#cv-p58-file-input').click(); });
    panel.querySelector('#cv-p58-file-input').addEventListener('change', function (event) {
      var file = event.target.files && event.target.files[0]; event.target.value = '';
      if (!file) return;
      show('P58 · Đang đọc metadata và kiểm tra decode-readiness cục bộ…', 'Không tải file lên và không lưu vào dự án.');
      window.CANVIOExportAcceptance.inspectFile(file).then(function (r) { show('P58 · Metadata/decode-readiness đã đọc được. Đây chưa phải xác nhận A/V sync.', r); }).catch(function (e) { show('P58 · File không qua kiểm tra.', { error: e.message || String(e) }); });
    });
    panel.querySelector('#cv-p59-worker').addEventListener('click', function () {
      show('P59 · Đang kiểm tra worker cùng origin; không tải model và không gửi audio…', '');
      window.CANVIOWhisperAcceptance.inspectWorker().then(function (r) { show('P59 · Worker asset check.', r); });
    });
    panel.querySelector('#cv-p60-a11y').addEventListener('click', function () {
      show('P60 · Sàng lọc DOM hoàn tất; cần kiểm tra screen reader/zoom thủ công.', window.CANVIOAccessibilityAudit.inspect(document));
    });
    panel.querySelector('#cv-p61-host').addEventListener('click', function () {
      show('P61 · Kiểm tra môi trường hosting (DOM-only). Server headers vẫn cần xác minh riêng.', window.CANVIOHostingSecurityAudit.inspect());
    });
    panel.querySelector('#cv-p62-report').addEventListener('click', function () {
      show('P62 · Đang tổng hợp trạng thái release; báo cáo không tự chứng nhận Stable…', '');
      window.CANVIOPhase1ReleaseGate.run().then(function (r) { show('P62 · Báo cáo nghiệm thu được tạo. Trạng thái production vẫn fail-closed.', r); }).catch(function (e) { show('P62 · Không tạo được báo cáo.', { error: e.message || String(e), releaseCertified: false }); });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();
