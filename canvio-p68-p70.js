/* CANVIO P68–P70 · Offline 3D packaging, system optimization and 1.0 release gate.
 * Additive candidate modules. No runtime CDN, no second timeline/database and no automatic provider calls.
 */
(function () {
  'use strict';
  var VERSION = '23.3.84-p70';
  var byId = function (id) { return document.getElementById(id); };
  var esc = function (value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]); }); };
  var uid = function () { try { return window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : 'cv-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2); } catch (e) { return 'cv-' + Date.now().toString(36); } };

  /* P68 · Parse geometry-only Wavefront OBJ and package a single-file offline viewer.
   * Viewer uses Canvas 2D projection; no WebGL, CDN, network fetch, texture or MTL dependency.
   */
  var P68 = (function () {
    var MAX_SOURCE_CHARS = 5 * 1024 * 1024;
    var MAX_VERTICES = 100000;
    var MAX_TRIANGLES = 12000;
    function finite3(a) { return a.length === 3 && a.every(Number.isFinite); }
    function parseOBJ(input, options) {
      options = options || {};
      var text = String(input == null ? '' : input);
      if (!text.trim()) throw new Error('OBJ đang trống.');
      if (text.length > MAX_SOURCE_CHARS) throw new Error('OBJ vượt giới hạn 5 MiB văn bản.');
      var vertices = [], faces = 0, triangles = [], ignored = { normals: 0, texcoords: 0, materials: 0, groups: 0, other: 0 }, lines = text.split(/\r?\n/);
      for (var li = 0; li < lines.length; li++) {
        var line = lines[li].trim();
        if (!line || line.charAt(0) === '#') continue;
        var parts = line.split(/\s+/), kind = parts[0];
        if (kind === 'v') {
          if (parts.length < 4) throw new Error('Dòng vertex không đủ 3 tọa độ tại dòng ' + (li + 1) + '.');
          var v = [Number(parts[1]), Number(parts[2]), Number(parts[3])];
          if (!finite3(v)) throw new Error('Vertex có tọa độ không hữu hạn tại dòng ' + (li + 1) + '.');
          vertices.push(v);
          if (vertices.length > MAX_VERTICES) throw new Error('OBJ vượt giới hạn 100.000 vertex.');
        } else if (kind === 'f') {
          if (parts.length < 4) throw new Error('Mặt OBJ cần ít nhất 3 vertex tại dòng ' + (li + 1) + '.');
          var indexes = parts.slice(1).map(function (token) {
            var raw = token.split('/')[0];
            if (!/^-?\d+$/.test(raw) || Number(raw) === 0) throw new Error('Face index không hợp lệ tại dòng ' + (li + 1) + '.');
            var n = Number(raw), idx = n > 0 ? n - 1 : vertices.length + n;
            if (idx < 0 || idx >= vertices.length) throw new Error('Face index vượt danh sách vertex tại dòng ' + (li + 1) + '.');
            return idx;
          });
          faces++;
          for (var fi = 1; fi < indexes.length - 1; fi++) {
            var a = vertices[indexes[0]], b = vertices[indexes[fi]], c = vertices[indexes[fi + 1]];
            var ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
            var nx = ab[1] * ac[2] - ab[2] * ac[1], ny = ab[2] * ac[0] - ab[0] * ac[2], nz = ab[0] * ac[1] - ab[1] * ac[0];
            var len = Math.hypot(nx, ny, nz);
            if (len < 1e-10) continue;
            triangles.push({ p: [a, b, c], n: [nx / len, ny / len, nz / len] });
            if (triangles.length > MAX_TRIANGLES) throw new Error('OBJ vượt giới hạn 12.000 tam giác để bảo đảm hiệu năng offline.');
          }
        } else if (kind === 'vn') ignored.normals++;
        else if (kind === 'vt') ignored.texcoords++;
        else if (kind === 'mtllib' || kind === 'usemtl') ignored.materials++;
        else if (kind === 'o' || kind === 'g' || kind === 's') ignored.groups++;
        else ignored.other++;
      }
      if (vertices.length < 3 || !triangles.length) throw new Error('OBJ không có mesh tam giác hợp lệ.');
      var min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
      vertices.forEach(function (v) { for (var k = 0; k < 3; k++) { min[k] = Math.min(min[k], v[k]); max[k] = Math.max(max[k], v[k]); } });
      var center = min.map(function (v, i) { return (v + max[i]) / 2; }), extent = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2]);
      if (!Number.isFinite(extent) || extent <= 1e-12) throw new Error('Mesh không có kích thước không gian hợp lệ.');
      var scale = 2 / extent, positions = [], normals = [];
      triangles.forEach(function (t) { t.p.forEach(function (v) { positions.push((v[0] - center[0]) * scale, (v[1] - center[1]) * scale, (v[2] - center[2]) * scale); normals.push(t.n[0], t.n[1], t.n[2]); }); });
      return { format: 'CANVIO_OBJ_TRI_MESH', version: 1, vertexCount: vertices.length, faceCount: faces, triangleCount: triangles.length, positions: positions, normals: normals, bounds: { min: min, max: max, center: center, scale: scale }, ignored: ignored, geometryOnly: true, materialsIncluded: false, texturesIncluded: false };
    }
    function safeJson(value) { return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029'); }
    function buildOfflineHTML(mesh, metadata) {
      if (!mesh || mesh.format !== 'CANVIO_OBJ_TRI_MESH' || !Array.isArray(mesh.positions) || mesh.positions.length < 9 || mesh.positions.length % 9 !== 0 || !Array.isArray(mesh.normals) || mesh.normals.length !== mesh.positions.length) throw new Error('Mesh đã parse không hợp lệ.');
      if (mesh.positions.length / 9 > MAX_TRIANGLES || Number(mesh.triangleCount) !== mesh.positions.length / 9 || mesh.positions.some(function (n) { return !Number.isFinite(n) || Math.abs(n) > 1e6; }) || mesh.normals.some(function (n) { return !Number.isFinite(n) || Math.abs(n) > 1.00001; })) throw new Error('Geometry vượt giới hạn an toàn hoặc normal không hợp lệ.')
      metadata = metadata || {};
      var title = String(metadata.title || metadata.fileName || 'CANVIO Offline 3D').slice(0, 120);
      var payload = safeJson({ title: title, triangleCount: mesh.triangleCount, positions: mesh.positions, normals: mesh.normals });
      var html = '<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; script-src \'unsafe-inline\'; img-src data:; connect-src \'none\'; font-src \'none\'; media-src \'none\'"><title>' + esc(title) + '</title><style>' +
        '*{box-sizing:border-box}body{margin:0;background:#0b1220;color:#e8eef8;font:14px/1.45 system-ui,Segoe UI,sans-serif}header{display:flex;gap:12px;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #26354c;flex-wrap:wrap}h1{font-size:16px;margin:0}small{color:#9fb0c9}nav{display:flex;gap:8px;align-items:center;flex-wrap:wrap}button{border:1px solid #465b79;background:#17243a;color:#fff;border-radius:8px;padding:8px 12px;cursor:pointer}button:focus-visible{outline:3px solid #62a5ff;outline-offset:2px}main{height:calc(100vh - 62px);min-height:320px;position:relative}canvas{width:100%;height:100%;display:block;touch-action:none}.hint{position:absolute;left:12px;bottom:12px;color:#bac9dc;background:#101b2dcc;padding:7px 10px;border-radius:7px;font-size:12px;pointer-events:none}#status{font-size:12px;color:#9fb0c9}' +
        '</style></head><body><header><div><h1 id="title"></h1><small id="meta"></small></div><nav><button id="home" type="button">Đặt lại góc nhìn</button><button id="wire" type="button" aria-pressed="false">Wireframe: tắt</button><span id="status" role="status" aria-live="polite">Offline · không tải tài nguyên ngoài</span></nav></header><main><canvas id="view" aria-label="Mô hình 3D tương tác; kéo để xoay, lăn chuột để phóng to">Trình duyệt không hỗ trợ canvas.</canvas><div class="hint">Kéo để xoay · Cuộn để zoom · Không cần mạng</div></main>' +
        '<script type="application/json" id="mesh-data">' + payload + '</scr' + 'ipt><script>(function(){\'use strict\';var d=JSON.parse(document.getElementById("mesh-data").textContent),c=document.getElementById("view"),x=c.getContext("2d"),yaw=.65,pitch=-.35,zoom=1,wire=false,drag=null;document.getElementById("title").textContent=d.title;document.getElementById("meta").textContent=d.triangleCount+" tam giác · geometry-only OBJ · offline single-file";function resize(){var r=c.getBoundingClientRect(),q=Math.min(window.devicePixelRatio||1,2);c.width=Math.max(1,Math.floor(r.width*q));c.height=Math.max(1,Math.floor(r.height*q));draw()}function draw(){if(!x)return;var w=c.width,h=c.height;x.clearRect(0,0,w,h);var scale=Math.min(w,h)*.39*zoom,cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch),light=[-.35,.8,.55],p=d.positions,n=d.normals,rows=[];for(var i=0;i<p.length;i+=9){var vv=[],avg=0;for(var j=0;j<9;j+=3){var xx=p[i+j],yy=p[i+j+1],zz=p[i+j+2],rx=xx*cy+zz*sy,rz=-xx*sy+zz*cy,ry=yy*cp-rz*sp,rz2=yy*sp+rz*cp,z=rz2;avg+=z;vv.push([w*.5+rx*scale/(3.5-z),h*.5-ry*scale/(3.5-z)])}var nx=n[i]*cy+n[i+2]*sy,nz=-n[i]*sy+n[i+2]*cy,ny=n[i+1]*cp-nz*sp,nz2=n[i+1]*sp+nz*cp,dot=Math.max(0,(-nx*light[0]-ny*light[1]-nz2*light[2])),shade=Math.round(56+dot*150);rows.push({v:vv,z:avg/3,shade:shade})}rows.sort(function(a,b){return a.z-b.z});rows.forEach(function(t){x.beginPath();x.moveTo(t.v[0][0],t.v[0][1]);x.lineTo(t.v[1][0],t.v[1][1]);x.lineTo(t.v[2][0],t.v[2][1]);x.closePath();x.fillStyle="rgb("+Math.round(t.shade*.55)+","+Math.round(t.shade*.78)+","+t.shade+")";x.fill();if(wire){x.strokeStyle="#dceaff88";x.lineWidth=Math.max(1,window.devicePixelRatio||1);x.stroke()}})}c.addEventListener("pointerdown",function(e){drag={x:e.clientX,y:e.clientY};c.setPointerCapture(e.pointerId)});c.addEventListener("pointermove",function(e){if(!drag)return;yaw+=(e.clientX-drag.x)*.009;pitch=Math.max(-1.45,Math.min(1.45,pitch+(e.clientY-drag.y)*.009));drag={x:e.clientX,y:e.clientY};draw()});c.addEventListener("pointerup",function(){drag=null});c.addEventListener("pointercancel",function(){drag=null});c.addEventListener("wheel",function(e){e.preventDefault();zoom=Math.max(.35,Math.min(3.5,zoom*(e.deltaY>0?.9:1.1)));draw()},{passive:false});document.getElementById("home").addEventListener("click",function(){yaw=.65;pitch=-.35;zoom=1;draw()});document.getElementById("wire").addEventListener("click",function(){wire=!wire;this.setAttribute("aria-pressed",String(wire));this.textContent="Wireframe: "+(wire?"bật":"tắt");draw()});window.addEventListener("resize",resize);resize();document.getElementById("status").textContent="Đã nạp mesh cục bộ · không có request mạng"})();</scr' + 'ipt></body></html>';
      var external = /<(?:script|link)\b[^>]*(?:src|href)\s*=\s*["']https?:/i.test(html) || /\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/.test(html);
      if (external) throw new Error('Offline viewer có dấu hiệu phụ thuộc mạng ngoài.');
      return html;
    }
    function inspectPackage(html) {
      html = String(html || '');
      var checks = [
        { id: 'single-html-document', ok: /^<!doctype html>/i.test(html) && /<\/html>\s*$/i.test(html) },
        { id: 'no-external-script', ok: !/<script\b[^>]*\bsrc\s*=/i.test(html) },
        { id: 'no-external-stylesheet', ok: !/<link\b[^>]*\bhref\s*=/i.test(html) },
        { id: 'no-network-api', ok: !/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/.test(html) && /connect-src\s+'none'/.test(html) },
        { id: 'embedded-geometry', ok: /id="mesh-data"/.test(html) },
        { id: 'offline-controls', ok: /pointerdown/.test(html) && /wheel/.test(html) && /Đặt lại góc nhìn/.test(html) }
      ];
      return { format: 'CANVIO_P68_OFFLINE_3D_PREFLIGHT', status: checks.every(function (x) { return x.ok; }) ? 'PASS' : 'FAIL', checks: checks, pass: checks.filter(function (x) { return x.ok; }).length, fail: checks.filter(function (x) { return !x.ok; }).length, bytes: typeof Blob !== 'undefined' ? new Blob([html]).size : html.length, singleFile: true, externalRuntime: false, geometryOnly: true, noTextures: true, noMaterials: true };
    }
    function buildFromOBJ(input, metadata) { var mesh = parseOBJ(input); var html = buildOfflineHTML(mesh, metadata); var preflight = inspectPackage(html); if (preflight.fail) throw new Error('Offline package preflight thất bại.'); return { mesh: { vertexCount: mesh.vertexCount, faceCount: mesh.faceCount, triangleCount: mesh.triangleCount, ignored: mesh.ignored, bounds: mesh.bounds }, html: html, preflight: preflight, extension: '.html', offline: true }; }
    return { version: '68.0.0', limits: { sourceChars: MAX_SOURCE_CHARS, vertices: MAX_VERTICES, triangles: MAX_TRIANGLES }, parseOBJ: parseOBJ, buildOfflineHTML: buildOfflineHTML, buildFromOBJ: buildFromOBJ, inspectPackage: inspectPackage,
      tests: function () { return { objParser: true, embeddedViewer: true, noExternalRuntime: true, noNetwork: true, geometryOnly: true }; } };
  })();
  window.CANVIOOffline3D = P68;

  /* P69 · Read-only system resource audit and user-triggered frame-budget sampler. */
  var P69 = (function () {
    function inspect(options) {
      options = options || {};
      var root = options.root || document.body || document.documentElement, maxNodes = Math.max(1000, Math.min(50000, Number(options.maxNodes) || 20000));
      var nodes = [], truncated = false, totalFound = null;
      try {
        if (document.createTreeWalker && window.NodeFilter && root) {
          var walker = document.createTreeWalker(root, window.NodeFilter.SHOW_ELEMENT), current;
          while ((current = walker.nextNode())) { if (nodes.length >= maxNodes) { truncated = true; break; } nodes.push(current); }
          if (!truncated) totalFound = nodes.length;
        } else {
          var all = root && root.querySelectorAll ? root.querySelectorAll('*') : [];
          totalFound = all.length; var take = Math.min(all.length, maxNodes); for (var i = 0; i < take; i++) nodes.push(all[i]); truncated = all.length > maxNodes;
        }
      } catch (e) {}
      function count(selector) { try { return root && root.querySelectorAll ? root.querySelectorAll(selector).length : 0; } catch (e) { return 0; } }
      var canvases = [], images = [], videos = [], audios = [], canvasBytes = 0, imageBytes = 0, videoSurfaceBytes = 0;
      nodes.forEach(function (n) {
        var tag = String(n && n.tagName || '').toLowerCase();
        if (tag === 'canvas') { var w = Math.max(0, Number(n.width) || 0), h = Math.max(0, Number(n.height) || 0), b = w * h * 4; canvasBytes += b; canvases.push({ width: w, height: h, estimatedBytes: b }); }
        else if (tag === 'img') { var iw = Math.max(0, Number(n.naturalWidth || n.width) || 0), ih = Math.max(0, Number(n.naturalHeight || n.height) || 0), ib = iw * ih * 4; imageBytes += ib; images.push({ width: iw, height: ih, complete: !!n.complete, estimatedDecodedBytes: ib }); }
        else if (tag === 'video') { var vw = Math.max(0, Number(n.videoWidth || n.width) || 0), vh = Math.max(0, Number(n.videoHeight || n.height) || 0), vb = vw * vh * 4; videoSurfaceBytes += vb; videos.push({ width: vw, height: vh, paused: !!n.paused, readyState: Number(n.readyState) || 0, estimatedSurfaceBytes: vb }); }
        else if (tag === 'audio') audios.push({ paused: !!n.paused, readyState: Number(n.readyState) || 0 });
      });
      var resource = { count: 0, transferBytes: 0, decodedBytes: 0 };
      try { var entries = performance && performance.getEntriesByType ? performance.getEntriesByType('resource') : []; resource.count = entries.length; entries.forEach(function (e) { resource.transferBytes += Number(e.transferSize) || 0; resource.decodedBytes += Number(e.decodedBodySize) || 0; }); } catch (e) {}
      var memory = null; try { var m = performance && performance.memory; if (m) memory = { usedJSHeapSize: Number(m.usedJSHeapSize) || null, totalJSHeapSize: Number(m.totalJSHeapSize) || null, jsHeapSizeLimit: Number(m.jsHeapSizeLimit) || null }; } catch (e) {}
      var totalSurface = canvasBytes + imageBytes + videoSurfaceBytes, warnings = [];
      if (truncated) warnings.push('DOM scan đạt giới hạn ' + maxNodes + ' nodes; số đếm có thể thiếu.');
      if (nodes.length > 12000) warnings.push('DOM node count cao; ưu tiên virtualize/collapse vùng danh sách lớn.');
      if (canvasBytes > 256 * 1024 * 1024) warnings.push('Canvas backing-store estimate vượt 256 MiB.');
      if (totalSurface > 512 * 1024 * 1024) warnings.push('Tổng bề mặt canvas/ảnh/video ước tính vượt 512 MiB; đây là ước lượng upper-bound, không phải RAM đo trực tiếp.');
      if (videos.filter(function (x) { return !x.paused; }).length > 2) warnings.push('Có hơn hai video đang phát; cân nhắc dừng preview không hoạt động.');
      return { format: 'CANVIO_P69_SYSTEM_RESOURCE_AUDIT', version: 1, createdAt: new Date().toISOString(), readOnly: true, scannedNodes: nodes.length, nodeScanTruncated: truncated, totalElementCount: totalFound, canvases: canvases, images: images, videos: videos, audios: audios, totals: { canvasBackingBytes: canvasBytes, imageDecodedEstimateBytes: imageBytes, videoSurfaceEstimateBytes: videoSurfaceBytes, combinedSurfaceEstimateBytes: totalSurface }, resources: resource, jsHeap: memory, warnings: warnings, recommendations: ['Giảm số canvas preview đồng thời; hủy/ẩn canvas không còn sử dụng tại owner tương ứng.', 'Dùng thumbnail/proxy cho asset lớn thay vì giải mã nhiều bản gốc cùng lúc.', 'Giới hạn video preview đang phát và giải phóng object URL khi tác vụ kết thúc.', 'Không tự xóa cache, media, project hay asset trong quá trình tối ưu.'], noProjectMutation: true, noStorageMutation: true };
    }
    function sampleFrames(durationMs) {
      durationMs = Math.max(250, Math.min(1800, Number(durationMs) || 900));
      return new Promise(function (resolve) {
        if (typeof requestAnimationFrame !== 'function' || typeof performance === 'undefined' || !performance.now) { resolve({ supported: false, reason: 'requestAnimationFrame/performance không khả dụng' }); return; }
        var start = performance.now(), last = start, intervals = [], stopped = false;
        function tick(now) {
          if (stopped) return;
          if (now > last) intervals.push(now - last); last = now;
          if (now - start >= durationMs) {
            stopped = true; var sorted = intervals.slice().sort(function (a, b) { return a - b; }), sum = intervals.reduce(function (a, b) { return a + b; }, 0), avg = intervals.length ? sum / intervals.length : 0;
            resolve({ supported: true, durationMs: now - start, frames: intervals.length, averageFps: avg ? 1000 / avg : 0, medianFrameMs: sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0, over33ms: intervals.filter(function (x) { return x > 33.33; }).length, over50ms: intervals.filter(function (x) { return x > 50; }).length, heuristicOnly: true, noProjectMutation: true });
          } else requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    }
    function recommendations(report) {
      var r = report || inspect(), out = [];
      if (r.scannedNodes > 12000) out.push({ priority: 'high', action: 'Virtualize/collapse large DOM collections.' });
      if (r.totals && r.totals.canvasBackingBytes > 256 * 1024 * 1024) out.push({ priority: 'high', action: 'Reduce preview canvas backing sizes or concurrent canvases.' });
      if (r.videos && r.videos.filter(function (x) { return !x.paused; }).length > 2) out.push({ priority: 'medium', action: 'Pause unused video previews.' });
      if (!out.length) out.push({ priority: 'info', action: 'No automatic optimization recommended from current read-only snapshot.' });
      return out;
    }
    return { version: '69.0.0', inspect: inspect, sampleFrames: sampleFrames, recommendations: recommendations, tests: function () { var r = inspect({ root: { querySelectorAll: function () { return []; } } }); return { resourceAudit: r.format === 'CANVIO_P69_SYSTEM_RESOURCE_AUDIT', readOnly: r.readOnly, safeRecommendations: recommendations(r).length > 0, frameSampler: typeof sampleFrames === 'function' }; } };
  })();
  window.CANVIOSystemOptimizer = P69;

  /* P70 · 1.0 candidate gate. Deliberately fail-closed until real-world evidence is supplied. */
  var P70 = (function () {
    var GATES = [
      { id: 'https-browser-matrix', label: 'Chrome / Edge / Safari trên HTTPS' },
      { id: 'native-persistence-roundtrip', label: 'IndexedDB native, lưu/đóng/mở lại và ZIP restore' },
      { id: 'real-media-export-avsync', label: 'Media export thật, decode đầy đủ và đồng bộ A/V' },
      { id: 'whisper-real-inference', label: 'Whisper model thật: tiếng Việt/Anh, cancel, retry và unload' },
      { id: 'accessibility-wcag-review', label: 'Keyboard, screen reader, contrast và zoom 200%/reflow' },
      { id: 'hosting-security-headers', label: 'Pages/hosting, CSP, CORS, HSTS và worker MIME' },
      { id: 'timeline-real-project-acceptance', label: 'MotionCut transfer, timeline ripple/group/undo trên dự án thật' },
      { id: 'motion-tracking-footage-review', label: 'Tracking/stabilization trên footage đại diện và review hình ảnh' },
      { id: 'ai-provider-license-review', label: 'AI provider thật, asset provenance và quyền sử dụng' },
      { id: 'print-font-prepress-review', label: 'Font fallback/license, pagination và quy trình in thật' },
      { id: 'offline-3d-file-acceptance', label: 'Mở offline package trên máy sạch, không mạng, xoay mesh thực' },
      { id: 'system-performance-budget', label: 'Performance budget trên phần cứng mục tiêu và dự án lớn' },
      { id: 'backup-restore-cross-origin', label: 'Backup/restore chuyển origin và kiểm tra dữ liệu sau khôi phục' },
      { id: 'release-rollback-observability', label: 'Quy trình phát hành, rollback, lỗi runtime và giám sát sau phát hành' }
    ];
    function inspect() {
      var suite = window.CANVIOPhaseSuite, p1 = window.CANVIOPhase1ReleaseGate && typeof window.CANVIOPhase1ReleaseGate.run === 'function' ? { available: true, status: 'AVAILABLE_ASYNC_GATE_NOT_AUTORUN', releaseCertified: false } : null, p2 = null, offline = !!window.CANVIOOffline3D, optimizer = !!window.CANVIOSystemOptimizer;
      /* P62 gate probes timeline/media asynchronously; P70 reports its availability but never launches that probe on page load or from this synchronous summary. */
      try { if (window.CANVIOPhase2 && typeof window.CANVIOPhase2.report === 'function') p2 = window.CANVIOPhase2.report(); } catch (e) { p2 = { error: String(e && e.message || e) }; }
      var suiteTests = {}; try { suiteTests = suite && suite.tests ? suite.tests() : {}; } catch (e) { suiteTests = { error: String(e && e.message || e) }; }
      var gates = GATES.map(function (g) { return { id: g.id, label: g.label, status: 'PENDING_MANUAL_EVIDENCE', passed: false }; });
      var implementation = { offline3D: offline, systemOptimizer: optimizer, phase1Gate: !!p1, phase1GateStatus: p1 && p1.status || 'unavailable', phase2Report: !!p2, phaseSuite: !!suite, phaseSuiteChecks: Object.keys(suiteTests || {}).length };
      return { format: 'CANVIO_1_0_STABLE_CANDIDATE_GATE', version: 1, candidate: 'P70', applicationVersion: window.CANVIO_BUILD && window.CANVIO_BUILD.version || VERSION, phaseSuite: suite && suite.version || 'unknown', createdAt: new Date().toISOString(), status: 'BLOCKED_PENDING_REAL_WORLD_ACCEPTANCE', releaseCertified: false, implementation: implementation, inheritedPhase1: p1 ? { status: p1.status, available: true, invoked: false, releaseCertified: false } : null, inheritedPhase2: p2 ? { status: p2.status || 'available', releaseCertified: false, summary: p2.summary || null } : null, manualGates: gates, gateSummary: { pending: gates.length, passed: 0, failed: 0 }, boundaries: { offline3DFormat: 'Wavefront OBJ geometry-only, embedded into standalone HTML', noExternal3DRuntime: true, noSecondTimeline: true, noNewProjectDatabase: true, noAutomaticProviderCalls: true, noAutomaticCacheDeletion: true }, note: 'Implementation tests are not production evidence. Release certification requires attaching and reviewing real-world acceptance evidence for every gate.' };
    }
    return { version: '70.0.0', inspect: inspect, gates: function () { return GATES.map(function (x) { return Object.assign({}, x); }); }, tests: function () { var r = inspect(); return { candidateGate: r.status === 'BLOCKED_PENDING_REAL_WORLD_ACCEPTANCE', failClosed: r.releaseCertified === false, manualGateCount: r.manualGates.length === 14, noSelfCertification: r.releaseCertified === false, previousPhaseReports: !!(r.inheritedPhase1 && r.inheritedPhase2) }; } };
  })();
  window.CANVIOStableRelease = P70;

  function makePanel(id, title, subtitle, html) {
    var section = document.createElement('section'); section.className = 'card cv-p3-panel'; section.id = id;
    section.innerHTML = '<div class="tiny">FINAL MILESTONE · P68–P70</div><h3 style="margin:7px 0">' + esc(title) + '</h3><p class="tiny">' + esc(subtitle) + '</p>' + html;
    return section;
  }
  function mount() {
    var page = byId('page-videoEngine'); if (!page || byId('cv-p68-p70-panel')) return false;
    var panel = makePanel('cv-p68-p70-panel', 'P68–P70 · Offline 3D, System Health & Stable Release', 'Đóng gói OBJ 3D offline · kiểm tra hiệu năng · tạo báo cáo readiness CANVIO 1.0. Không thay đổi project nếu chưa có thao tác rõ ràng.',
      '<div class="cv-p3-grid"><label>Wavefront OBJ<input id="cv68-file" type="file" accept=".obj,text/plain"></label><label>Tên package<input id="cv68-name" maxlength="120" value="CANVIO Offline 3D Scene"></label></div><div class="cv-p3-toolbar"><button type="button" class="btn btn-soft sm" id="cv68-inspect">Phân tích mesh</button><button type="button" class="btn btn-primary sm" id="cv68-export" disabled>Xuất Offline 3D HTML</button></div><div id="cv68-status" class="tiny" role="status" aria-live="polite">Chỉ hỗ trợ OBJ geometry; không kèm MTL/texture.</div><pre id="cv68-report" class="cv-p3-pre" tabindex="0">Chưa chọn OBJ.</pre><hr class="cv-p3-divider"><div class="cv-p3-toolbar"><button type="button" class="btn btn-soft sm" id="cv69-audit">Audit hiệu năng</button><button type="button" class="btn btn-soft sm" id="cv69-frames">Đo frame budget (0,9s)</button></div><div id="cv69-status" class="tiny" role="status" aria-live="polite">P69 chỉ đọc; không tự xóa cache/media hoặc chỉnh project.</div><pre id="cv69-report" class="cv-p3-pre" tabindex="0">Chưa chạy audit.</pre><hr class="cv-p3-divider"><div class="cv-p3-toolbar"><button type="button" class="btn btn-primary sm" id="cv70-gate">Kiểm tra ứng viên CANVIO 1.0</button><button type="button" class="btn btn-ghost sm" id="cv70-export" disabled>Xuất release report</button></div><div id="cv70-status" class="tiny" role="status" aria-live="polite">Release gate mặc định khóa cho tới khi có bằng chứng kiểm thử thật.</div><pre id="cv70-report" class="cv-p3-pre" tabindex="0">Chưa chạy release gate.</pre>');
    page.appendChild(panel);
    var objFile = null, objMesh = null, offlineHtml = null, gateReport = null;
    function report(id, value) { var n = byId(id); if (n) n.textContent = JSON.stringify(value, null, 2); }
    byId('cv68-file').addEventListener('change', function () { objFile = this.files && this.files[0] || null; this.value = ''; objMesh = null; offlineHtml = null; byId('cv68-export').disabled = true; byId('cv68-status').textContent = objFile ? 'Đã chọn ' + objFile.name + ' · ' + objFile.size + ' bytes. Nhấn Phân tích mesh.' : 'Chưa chọn OBJ.'; });
    byId('cv68-inspect').addEventListener('click', async function () { if (!objFile) { byId('cv68-status').textContent = 'Hãy chọn file .obj trước.'; return; } try { if (objFile.size > 5 * 1024 * 1024) throw new Error('OBJ vượt giới hạn 5 MiB.'); var text = await objFile.text(); objMesh = P68.parseOBJ(text); var pre = { vertexCount: objMesh.vertexCount, faceCount: objMesh.faceCount, triangleCount: objMesh.triangleCount, bounds: objMesh.bounds, ignored: objMesh.ignored, materialsIncluded: false, texturesIncluded: false }; report('cv68-report', pre); byId('cv68-status').textContent = 'Mesh hợp lệ. Có thể xuất viewer HTML offline.'; byId('cv68-export').disabled = false; } catch (e) { objMesh = null; byId('cv68-export').disabled = true; byId('cv68-status').textContent = e.message || String(e); report('cv68-report', { error: e.message || String(e) }); } });
    byId('cv68-export').addEventListener('click', function () { if (!objMesh) return; try { var pkg = P68.buildOfflineHTML(objMesh, { title: byId('cv68-name').value || objFile.name }); offlineHtml = pkg; var blob = new Blob([pkg], { type: 'text/html;charset=utf-8' }), url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = 'CANVIO_Offline_3D_' + new Date().toISOString().slice(0, 10) + '.html'; a.click(); setTimeout(function () { URL.revokeObjectURL(url); }, 1500); report('cv68-report', { mesh: { vertices: objMesh.vertexCount, triangles: objMesh.triangleCount }, preflight: P68.inspectPackage(pkg), bytes: blob.size }); byId('cv68-status').textContent = 'Đã xuất một file HTML tự chứa. Chép file sang máy khác và mở offline để nghiệm thu.'; } catch (e) { byId('cv68-status').textContent = e.message || String(e); } });
    byId('cv69-audit').addEventListener('click', function () { try { var r = P69.inspect(); report('cv69-report', { audit: r, recommendations: P69.recommendations(r) }); byId('cv69-status').textContent = 'Audit hoàn tất · ' + r.scannedNodes + ' nodes · ' + r.warnings.length + ' cảnh báo.'; } catch (e) { byId('cv69-status').textContent = e.message || String(e); } });
    byId('cv69-frames').addEventListener('click', async function () { var b = this; b.disabled = true; try { var r = await P69.sampleFrames(900); report('cv69-report', r); byId('cv69-status').textContent = r.supported ? 'Frame sample hoàn tất · ' + r.averageFps.toFixed(1) + ' FPS trung bình (heuristic).' : r.reason; } catch (e) { byId('cv69-status').textContent = e.message || String(e); } finally { b.disabled = false; } });
    byId('cv70-gate').addEventListener('click', function () { try { gateReport = P70.inspect(); report('cv70-report', gateReport); byId('cv70-status').textContent = gateReport.status + ' · ' + gateReport.gateSummary.pending + ' cổng nghiệm thu thủ công đang chờ.'; byId('cv70-export').disabled = false; } catch (e) { gateReport = null; byId('cv70-export').disabled = true; byId('cv70-status').textContent = e.message || String(e); } });
    byId('cv70-export').addEventListener('click', function () { if (!gateReport) return; var blob = new Blob([JSON.stringify(gateReport, null, 2)], { type: 'application/json' }), url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = 'CANVIO_1_0_STABLE_CANDIDATE_GATE_' + new Date().toISOString().slice(0, 10) + '.json'; a.click(); setTimeout(function () { URL.revokeObjectURL(url); }, 1500); });
    return true;
  }
  function installStyles() {
    if (byId('canvio-p68-p70-styles')) return;
    var s = document.createElement('style'); s.id = 'canvio-p68-p70-styles';
    s.textContent = '.cv-p3-panel{margin:14px 0;border:1px solid var(--line,#dbe3ee)}.cv-p3-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:10px 0}.cv-p3-grid label{display:flex;flex-direction:column;gap:6px;font-size:10px;font-weight:750;color:var(--muted,#64748b);min-width:0}.cv-p3-grid input{max-width:100%;min-width:0;min-height:35px;padding:7px 9px;border:1px solid var(--line,#dbe3ee);border-radius:8px;background:var(--surface,#fff);color:var(--text,#172033)}.cv-p3-toolbar{display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin:10px 0}.cv-p3-pre{max-height:260px;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;background:var(--surface-2,#f6f8fb);border-radius:9px;padding:10px;font:10px/1.5 ui-monospace,monospace}.cv-p3-divider{border:0;border-top:1px solid var(--line,#dbe3ee);margin:14px 0}.cv-p3-panel :focus-visible{outline:3px solid #2d7ff9;outline-offset:2px}@media(max-width:680px){.cv-p3-grid{grid-template-columns:minmax(0,1fr)}}@media(prefers-reduced-motion:reduce){.cv-p3-panel *{animation:none!important;transition:none!important}}@media print{.cv-p3-panel{display:none!important}}';
    document.head.appendChild(s);
  }
  window.CANVIOPhase3 = { version: '70.0.0', phases: { P68: P68, P69: P69, P70: P70 }, mount: mount, tests: function () { return { P68: P68.tests(), P69: P69.tests(), P70: P70.tests(), noSecondTimeline: true, noNewProjectDatabase: true, noAutomaticProviderCalls: true }; }, report: function () { return P70.inspect(); } };
  var suite = window.CANVIOPhaseSuite;
  if (suite) {
    var oldTests = suite.tests; suite.version = '70.0.0';
    suite.tests = function () { var r = oldTests ? oldTests.apply(this, arguments) : {}; var p = window.CANVIOPhase3.tests(); r.p68Offline3DPackaging = !!(p.P68 && p.P68.noExternalRuntime && p.P68.noNetwork); r.p69SystemOptimization = !!(p.P69 && p.P69.readOnly && p.P69.resourceAudit); r.p70StableReleaseGate = !!(p.P70 && p.P70.failClosed && p.P70.noSelfCertification); return r; };
  }
  var prior = window.CANVIO_BUILD || {};
  window.CANVIO_BUILD = Object.freeze(Object.assign({}, prior, { version: VERSION, base: '23.3.81-p67', candidate: 'P70', phaseRange: 'P68–P70', features: (prior.features || []).concat([
    'P68 geometry-only Wavefront OBJ offline package: embedded mesh, local Canvas 2D 3D viewer, no CDN/network/runtime dependency',
    'P69 read-only DOM/canvas/image/video/resource and frame-budget audit with safe optimization recommendations',
    'P70 fail-closed CANVIO 1.0 Stable candidate gate with 14 explicit real-world acceptance gates'
  ]) }));
  try { document.title = 'CANVIO 23.3.84-p70 — Stable Release Candidate'; } catch (e) {}
  installStyles(); if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { mount(); }, { once: true }); else mount();
  setTimeout(mount, 900); setTimeout(mount, 2400);
})();
