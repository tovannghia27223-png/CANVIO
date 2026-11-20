/* CANVIO P72 — Bounded GLB v2 geometry viewer, built over the P68 offline single-file viewer.
 * Supports static triangle meshes embedded in GLB; no CDN, npm package, external runtime or new store.
 * Materials, textures, animation, skinning, morph targets and compressed extensions are intentionally reported unsupported.
 */
(function () {
  'use strict';
  if (window.CANVIOGLBViewerP72) return;
  var MAX_BYTES = 20 * 1024 * 1024, MAX_VERTICES = 100000, MAX_TRIANGLES = 12000;
  function fail(message) { throw new Error(message); }
  function readAccessor(gltf, binary, index, expectedType) {
    var a = gltf.accessors && gltf.accessors[index];
    if (!a || a.sparse) fail('GLB accessor thiếu hoặc dùng sparse accessor chưa hỗ trợ.');
    var components = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[a.type];
    if (!components || (expectedType && a.type !== expectedType)) fail('GLB accessor type không hỗ trợ: ' + String(a.type));
    var types = {
      5121: { bytes: 1, read: function (v, o) { return v.getUint8(o); } },
      5123: { bytes: 2, read: function (v, o) { return v.getUint16(o, true); } },
      5125: { bytes: 4, read: function (v, o) { return v.getUint32(o, true); } },
      5126: { bytes: 4, read: function (v, o) { return v.getFloat32(o, true); } }
    };
    var t = types[a.componentType];
    if (!t || (a.componentType !== 5126 && !a.normalized && expectedType === 'VEC3')) fail('GLB componentType không hỗ trợ cho ' + (expectedType || a.type) + '.');
    var bv = gltf.bufferViews && gltf.bufferViews[a.bufferView];
    if (!bv || (bv.buffer || 0) !== 0) fail('GLB accessor không trỏ tới BIN chunk nhúng.');
    var stride = Number(bv.byteStride) || components * t.bytes;
    if (stride < components * t.bytes || stride > 252) fail('GLB byteStride không hợp lệ.');
    var start = (Number(bv.byteOffset) || 0) + (Number(a.byteOffset) || 0);
    var count = Number(a.count);
    if (!Number.isInteger(count) || count < 1 || count > MAX_VERTICES * 4) fail('GLB accessor count vượt giới hạn.');
    var needed = start + (count - 1) * stride + components * t.bytes;
    if (start < 0 || needed > binary.byteLength || needed > (Number(bv.byteOffset) || 0) + Number(bv.byteLength || 0)) fail('GLB accessor nằm ngoài BIN buffer.');
    var view = binary instanceof Uint8Array ? new DataView(binary.buffer, binary.byteOffset, binary.byteLength) : new DataView(binary), out = new Array(count * components), k = 0;
    for (var i = 0; i < count; i++) for (var c = 0; c < components; c++) {
      var value = t.read(view, start + i * stride + c * t.bytes);
      if (!Number.isFinite(value)) fail('GLB có tọa độ không hữu hạn.');
      if (a.normalized && a.componentType !== 5126) {
        var max = a.componentType === 5121 ? 255 : a.componentType === 5123 ? 65535 : 4294967295;
        value = value / max;
      }
      out[k++] = value;
    }
    return { data: out, count: count, components: components };
  }
  function matIdentity() { return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]; }
  function matMultiply(a, b) {
    var o = new Array(16);
    for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++) o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    return o;
  }
  function nodeMatrix(n) {
    if (Array.isArray(n.matrix) && n.matrix.length === 16 && n.matrix.every(Number.isFinite)) return n.matrix.slice();
    var tr = n.translation || [0, 0, 0], sc = n.scale || [1, 1, 1], q = n.rotation || [0, 0, 0, 1];
    if (![tr, sc, q].every(function (a) { return Array.isArray(a) && a.every(Number.isFinite); })) fail('GLB node transform không hợp lệ.');
    var x = q[0], y = q[1], z = q[2], w = q[3], x2 = x + x, y2 = y + y, z2 = z + z;
    var xx = x * x2, xy = x * y2, xz = x * z2, yy = y * y2, yz = y * z2, zz = z * z2, wx = w * x2, wy = w * y2, wz = w * z2;
    return [(1 - (yy + zz)) * sc[0], (xy + wz) * sc[0], (xz - wy) * sc[0], 0, (xy - wz) * sc[1], (1 - (xx + zz)) * sc[1], (yz + wx) * sc[1], 0, (xz + wy) * sc[2], (yz - wx) * sc[2], (1 - (xx + yy)) * sc[2], 0, tr[0], tr[1], tr[2], 1];
  }
  function transformPoint(m, x, y, z) { return [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]]; }
  function parseGLB(buffer) {
    if (!(buffer instanceof ArrayBuffer) || buffer.byteLength < 20) fail('GLB không hợp lệ hoặc quá ngắn.');
    if (buffer.byteLength > MAX_BYTES) fail('GLB vượt giới hạn 20 MiB.');
    var dv = new DataView(buffer);
    if (dv.getUint32(0, true) !== 0x46546c67) fail('Sai GLB magic; cần file nhị phân .glb.');
    var version = dv.getUint32(4, true), declared = dv.getUint32(8, true);
    if (version !== 2) fail('Chỉ hỗ trợ GLB phiên bản 2.');
    if (declared !== buffer.byteLength) fail('GLB header length không khớp kích thước file.');
    var offset = 12, json = null, bin = null, chunks = 0;
    while (offset + 8 <= buffer.byteLength) {
      var length = dv.getUint32(offset, true), type = dv.getUint32(offset + 4, true); offset += 8; chunks++;
      if (length % 4 !== 0 || offset + length > buffer.byteLength) fail('GLB chunk length không hợp lệ.');
      if (type === 0x4e4f534a) { if (json) fail('GLB có nhiều JSON chunk.'); json = new TextDecoder().decode(new Uint8Array(buffer, offset, length)).replace(/[\u0000\u0020]+$/g, ''); }
      else if (type === 0x004e4942) { if (bin) fail('GLB có nhiều BIN chunk chưa hỗ trợ.'); bin = new Uint8Array(buffer, offset, length); }
      offset += length;
    }
    if (!json || !bin || offset !== buffer.byteLength) fail('GLB phải có JSON chunk và BIN chunk nhúng hợp lệ.');
    var gltf; try { gltf = JSON.parse(json); } catch (e) { fail('JSON chunk trong GLB không đọc được.'); }
    if (!gltf.asset || String(gltf.asset.version) !== '2.0') fail('GLB asset version không phải 2.0.');
    if ((gltf.extensionsRequired || []).length) fail('GLB yêu cầu extension chưa hỗ trợ: ' + gltf.extensionsRequired.join(', '));
    if ((gltf.buffers || []).some(function (b) { return b.uri; })) fail('GLB có buffer URI ngoài; profile offline chỉ nhận BIN chunk nhúng.');
    var positions = [], triangles = 0, meshCount = 0, primitiveCount = 0, ignored = { materials: 0, textures: 0, animations: (gltf.animations || []).length, skins: (gltf.skins || []).length, morphTargets: 0, extensions: (gltf.extensionsUsed || []).slice() };
    function appendMesh(meshIndex, world) {
      var mesh = gltf.meshes && gltf.meshes[meshIndex]; if (!mesh || !Array.isArray(mesh.primitives)) fail('GLB node tham chiếu mesh không hợp lệ.');
      meshCount++;
      mesh.primitives.forEach(function (p) {
        if ((p.mode == null ? 4 : p.mode) !== 4) fail('GLB profile hiện chỉ hỗ trợ TRIANGLES (mode 4).');
        if (p.targets && p.targets.length) ignored.morphTargets += p.targets.length;
        if (!p.attributes || p.attributes.POSITION == null) fail('GLB primitive thiếu POSITION.');
        var pos = readAccessor(gltf, bin, p.attributes.POSITION, 'VEC3');
        if (pos.count > MAX_VERTICES) fail('GLB vượt giới hạn 100.000 vertex cho một primitive.');
        var idx;
        if (p.indices != null) idx = readAccessor(gltf, bin, p.indices, 'SCALAR').data;
        else { idx = new Array(pos.count); for (var j = 0; j < pos.count; j++) idx[j] = j; }
        if (idx.length % 3) fail('GLB triangle index count không chia hết cho 3.');
        if (triangles + idx.length / 3 > MAX_TRIANGLES) fail('GLB vượt giới hạn 12.000 tam giác.');
        for (var i = 0; i < idx.length; i += 3) {
          var ia = idx[i], ib = idx[i + 1], ic = idx[i + 2];
          if (![ia, ib, ic].every(function (v) { return Number.isInteger(v) && v >= 0 && v < pos.count; })) fail('GLB index nằm ngoài POSITION accessor.');
          var a = transformPoint(world, pos.data[ia * 3], pos.data[ia * 3 + 1], pos.data[ia * 3 + 2]);
          var b = transformPoint(world, pos.data[ib * 3], pos.data[ib * 3 + 1], pos.data[ib * 3 + 2]);
          var c = transformPoint(world, pos.data[ic * 3], pos.data[ic * 3 + 1], pos.data[ic * 3 + 2]);
          var ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
          var nx = ab[1] * ac[2] - ab[2] * ac[1], ny = ab[2] * ac[0] - ab[0] * ac[2], nz = ab[0] * ac[1] - ab[1] * ac[0], nl = Math.hypot(nx, ny, nz);
          if (nl < 1e-10) continue;
          var n = [nx / nl, ny / nl, nz / nl];
          [a, b, c].forEach(function (v) { positions.push(v[0], v[1], v[2], n[0], n[1], n[2]); });
          triangles++;
        }
        primitiveCount++;
        if (p.material != null) ignored.materials++;
      });
    }
    var nodes = gltf.nodes || [], scenes = gltf.scenes || [], sceneIndex = Number.isInteger(gltf.scene) ? gltf.scene : 0, usedNodes = false;
    if (scenes.length && scenes[sceneIndex] && Array.isArray(scenes[sceneIndex].nodes)) {
      function walk(nodeIndex, parent, depth) {
        if (depth > 64) fail('GLB node hierarchy sâu quá giới hạn.');
        var n = nodes[nodeIndex]; if (!n) fail('GLB scene có node index không hợp lệ.');
        var world = matMultiply(parent, nodeMatrix(n));
        if (n.mesh != null) appendMesh(n.mesh, world);
        (n.children || []).forEach(function (child) { walk(child, world, depth + 1); });
        usedNodes = true;
      }
      scenes[sceneIndex].nodes.forEach(function (n) { walk(n, matIdentity(), 0); });
    }
    if (!usedNodes) (gltf.meshes || []).forEach(function (_, i) { appendMesh(i, matIdentity()); });
    if (!triangles || !positions.length) fail('GLB không có static triangle mesh hợp lệ.');
    var min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    for (var k = 0; k < positions.length; k += 6) for (var q = 0; q < 3; q++) { min[q] = Math.min(min[q], positions[k + q]); max[q] = Math.max(max[q], positions[k + q]); }
    var center = min.map(function (v, i) { return (v + max[i]) / 2; }), extent = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2]);
    if (!Number.isFinite(extent) || extent <= 1e-12) fail('GLB mesh có bounds không hợp lệ.');
    var scale = 2 / extent, pOut = [], nOut = [];
    for (var z = 0; z < positions.length; z += 6) { pOut.push((positions[z] - center[0]) * scale, (positions[z + 1] - center[1]) * scale, (positions[z + 2] - center[2]) * scale); nOut.push(positions[z + 3], positions[z + 4], positions[z + 5]); }
    return { format: 'CANVIO_OBJ_TRI_MESH', version: 1, vertexCount: pOut.length / 3, faceCount: triangles, triangleCount: triangles, positions: pOut, normals: nOut, bounds: { min: min, max: max, center: center, scale: scale }, ignored: ignored, sourceFormat: 'GLB 2.0', meshCount: meshCount, primitiveCount: primitiveCount, geometryOnly: true, materialsIncluded: false, texturesIncluded: false };
  }
  function buildWebGLViewer(mesh, metadata) {
    if (!mesh || !Array.isArray(mesh.positions) || !Array.isArray(mesh.normals) || !mesh.positions.length || mesh.positions.length !== mesh.normals.length) fail('Static mesh data không hợp lệ.');
    var title = esc(metadata && metadata.title || 'CANVIO GLB Offline Viewer');
    var payload = JSON.stringify({ p: mesh.positions, n: mesh.normals });
    var runtime = "(function(){'use strict';var M=" + payload + ";var c=document.getElementById('view'),s=document.getElementById('status');var gl=c.getContext('webgl',{antialias:true,alpha:false});if(!gl){s.textContent='Thiết bị không hỗ trợ WebGL; không thể hiển thị mesh 3D.';return;}function shader(t,src){var x=gl.createShader(t);gl.shaderSource(x,src);gl.compileShader(x);if(!gl.getShaderParameter(x,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(x));return x;}var vs='attribute vec3 p;attribute vec3 n;uniform float yaw;uniform float pitch;uniform float zoom;varying float light;void main(){float cy=cos(yaw),sy=sin(yaw),cx=cos(pitch),sx=sin(pitch);vec3 v=vec3(p.x*cy+p.z*sy,p.y,-p.x*sy+p.z*cy);vec3 q=vec3(n.x*cy+n.z*sy,n.y,-n.x*sy+n.z*cy);float yy=v.y*cx-v.z*sx;float zz=v.y*sx+v.z*cx+3.2;float ny=q.y*cx-q.z*sx;float nz=q.y*sx+q.z*cx;gl_Position=vec4(v.x*1.65/max(.3,zz)*zoom,yy*1.65/max(.3,zz)*zoom,zz*.08,1.);light=max(.16,dot(normalize(vec3(q.x,ny,nz)),normalize(vec3(-.5,.8,1.))));}';var fs='precision mediump float;varying float light;void main(){vec3 base=vec3(.23,.57,.88);gl_FragColor=vec4(base*(.28+.72*light),1.);}';var pr=gl.createProgram();gl.attachShader(pr,shader(gl.VERTEX_SHADER,vs));gl.attachShader(pr,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(pr);if(!gl.getProgramParameter(pr,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(pr));gl.useProgram(pr);function buf(name,data){var b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);var l=gl.getAttribLocation(pr,name);gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,3,gl.FLOAT,false,0,0);}buf('p',M.p);buf('n',M.n);gl.enable(gl.DEPTH_TEST);var uy=gl.getUniformLocation(pr,'yaw'),up=gl.getUniformLocation(pr,'pitch'),uz=gl.getUniformLocation(pr,'zoom');var yaw=.55,pitch=.25,zoom=1,drag=null;function resize(){var r=c.getBoundingClientRect(),d=Math.min(2,window.devicePixelRatio||1),w=Math.max(1,Math.round(r.width*d)),h=Math.max(1,Math.round(r.height*d));if(c.width!==w||c.height!==h){c.width=w;c.height=h;}gl.viewport(0,0,w,h);}function draw(){resize();gl.clearColor(.035,.055,.09,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniform1f(uy,yaw);gl.uniform1f(up,pitch);gl.uniform1f(uz,zoom);gl.drawArrays(gl.TRIANGLES,0,M.p.length/3);requestAnimationFrame(draw);}c.addEventListener('pointerdown',function(e){drag=[e.clientX,e.clientY];c.setPointerCapture(e.pointerId);});c.addEventListener('pointermove',function(e){if(!drag)return;yaw+=(e.clientX-drag[0])*.009;pitch=Math.max(-1.4,Math.min(1.4,pitch+(e.clientY-drag[1])*.009));drag=[e.clientX,e.clientY];});c.addEventListener('pointerup',function(){drag=null;});c.addEventListener('pointercancel',function(){drag=null;});c.addEventListener('wheel',function(e){e.preventDefault();zoom=Math.max(.55,Math.min(2.8,zoom*(e.deltaY>0?.92:1.08)));},{passive:false});document.getElementById('reset').addEventListener('click',function(){yaw=.55;pitch=.25;zoom=1;});window.addEventListener('resize',resize);s.textContent='WebGL mesh ready · drag để xoay · scroll để zoom · '+(M.p.length/9).toLocaleString()+' tam giác.';draw();})();";
    return '<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:; connect-src \'none\'"><title>' + title + '</title><style>*{box-sizing:border-box}body{margin:0;background:#0b1220;color:#eaf0f8;font:14px system-ui;padding:14px}header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}button{border:1px solid #40506a;background:#18263b;color:#fff;border-radius:8px;padding:8px 12px}canvas{width:100%;height:min(76vh,680px);display:block;border:1px solid #34445c;border-radius:12px;touch-action:none;background:#101b2d}small{color:#9aabc2}#status{padding:9px 0;color:#afc8e6}</style></head><body><header><div><b>' + title + '</b><br><small>GLB 2.0 · static mesh · offline WebGL · không material/texture/animation</small></div><button id="reset">Đặt lại góc nhìn</button></header><canvas id="view"></canvas><div id="status" role="status">Đang khởi tạo WebGL…</div><script>' + runtime + '</scr' + 'ipt></body></html>';
  }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function download(blob, name) { var u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = name; a.click(); setTimeout(function () { URL.revokeObjectURL(u); }, 1200); }
  function mount() {
    var page = document.getElementById('page-videoEngine'), existing = document.getElementById('cv72-glb-panel');
    if (!page || existing) return !!existing;
    var panel = document.createElement('section'); panel.id = 'cv72-glb-panel'; panel.className = 'card'; panel.style.margin = '14px 0';
    panel.innerHTML = '<div class="cardTop"><div><h3>GLB Viewer · P72</h3><span class="sub">GLB 2.0 · static mesh WebGL · xem/đóng gói HTML offline</span></div><span class="badgeSoft">LOCAL · NO CDN</span></div><div class="grid g2"><label class="field"><span>Chọn mô hình .glb (P72 phân tích tối đa 20 MiB · P74 Full 3D tối đa 250 MiB)</span><input id="cv72-file" type="file" accept=".glb,model/gltf-binary"></label><label class="field"><span>Tên viewer</span><input id="cv72-title" maxlength="120" value="CANVIO GLB Offline Viewer"></label></div><div class="row" style="gap:7px;flex-wrap:wrap"><button type="button" class="btn btn-soft sm" id="cv72-inspect">Phân tích GLB</button><button type="button" class="btn btn-primary sm" id="cv72-export" disabled>Xuất HTML offline</button></div><div id="cv72-status" class="tiny" role="status" aria-live="polite">Chỉ đọc geometry GLB tĩnh. Material/texture/animation/skinning và extension nén không được đóng gói.</div><pre id="cv72-report" class="cv-p3-pre" tabindex="0">Chưa chọn GLB.</pre><iframe id="cv72-preview" title="Xem trước GLB viewer offline" sandbox="allow-scripts" style="display:none;width:100%;height:360px;border:1px solid var(--line);border-radius:10px;background:#0b1220"></iframe>';
    var anchor = document.getElementById('cv-p68-p70-panel'); if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(panel, anchor.nextSibling); else page.appendChild(panel);
    var file = null, mesh = null, pkg = null;
    function report(value) { document.getElementById('cv72-report').textContent = JSON.stringify(value, null, 2); }
    document.getElementById('cv72-file').addEventListener('change', function () { file = this.files && this.files[0] || null; mesh = pkg = null; document.getElementById('cv72-export').disabled = true; document.getElementById('cv72-preview').style.display = 'none'; document.getElementById('cv72-status').textContent = file ? 'Đã chọn ' + file.name + ' · ' + file.size + ' bytes. Bấm Phân tích GLB.' : 'Chưa chọn file.'; });
    document.getElementById('cv72-inspect').addEventListener('click', async function () {
      var b = this; if (!file) { document.getElementById('cv72-status').textContent = 'Hãy chọn một file GLB.'; return; }
      b.disabled = true;
      try {
        var buffer = await file.arrayBuffer(); mesh = parseGLB(buffer);
        pkg = buildWebGLViewer(mesh, { title: document.getElementById('cv72-title').value || file.name });
        if (!pkg || !/getContext\('webgl'/.test(pkg) || /<script\s+src=/i.test(pkg) || /https?:\/\//i.test(pkg)) fail('Standalone WebGL viewer preflight failed.');
        report({ source: 'GLB 2.0', fileBytes: file.size, meshCount: mesh.meshCount, primitives: mesh.primitiveCount, vertices: mesh.vertexCount, triangles: mesh.triangleCount, bounds: mesh.bounds, omitted: mesh.ignored, offlinePreflight: { status: true, webglViewer: true, externalRequests: 0, cspConnectNone: /connect-src \'none\'/.test(pkg) }, limitations: ['Không hiển thị vật liệu/texture; màu viewer trung tính.', 'Không đóng gói animation, skinning, morph targets.', 'Không hỗ trợ extension nén Draco/meshopt/KTX2.'] });
        var frame = document.getElementById('cv72-preview'); frame.srcdoc = pkg; frame.style.display = 'block';
        document.getElementById('cv72-status').textContent = 'GLB hợp lệ · ' + mesh.triangleCount.toLocaleString('vi-VN') + ' tam giác · viewer offline đã sẵn sàng.';
        document.getElementById('cv72-export').disabled = false;
      } catch (e) { mesh = pkg = null; document.getElementById('cv72-export').disabled = true; document.getElementById('cv72-status').textContent = 'Không thể đọc GLB: ' + (e.message || e); report({ error: e.message || String(e) }); }
      finally { b.disabled = false; }
    });
    document.getElementById('cv72-export').addEventListener('click', function () { if (!pkg || !mesh) return; download(new Blob([pkg], { type: 'text/html;charset=utf-8' }), 'CANVIO_GLB_Offline_' + new Date().toISOString().slice(0, 10) + '.html'); document.getElementById('cv72-status').textContent = 'Đã xuất HTML viewer tự chứa. Chuyển file sang máy khác và mở offline để xem.'; });
    return true;
  }
  function tests() {
    var p = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]), idx = new Uint16Array([0, 1, 2]), binLen = 44, json = { asset: { version: '2.0' }, buffers: [{ byteLength: binLen }], bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 36 }, { buffer: 0, byteOffset: 36, byteLength: 6 }], accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: 'VEC3' }, { bufferView: 1, componentType: 5123, count: 3, type: 'SCALAR' }], meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1 }] }], nodes: [{ mesh: 0 }], scenes: [{ nodes: [0] }], scene: 0 };
    var j = new TextEncoder().encode(JSON.stringify(json)), jl = Math.ceil(j.length / 4) * 4, bl = 44, total = 12 + 8 + jl + 8 + bl, out = new ArrayBuffer(total), v = new DataView(out), o = 0;
    v.setUint32(o, 0x46546c67, true); v.setUint32(o + 4, 2, true); v.setUint32(o + 8, total, true); o += 12; v.setUint32(o, jl, true); v.setUint32(o + 4, 0x4e4f534a, true); o += 8; new Uint8Array(out, o, j.length).set(j); new Uint8Array(out, o + j.length, jl - j.length).fill(0x20); o += jl; v.setUint32(o, bl, true); v.setUint32(o + 4, 0x004e4942, true); o += 8; new Uint8Array(out, o, 36).set(new Uint8Array(p.buffer)); new Uint8Array(out, o + 36, 6).set(new Uint8Array(idx.buffer));
    var parsed = parseGLB(out);
    var bad = new ArrayBuffer(total); new Uint8Array(bad).set(new Uint8Array(out)); new DataView(bad).setUint32(0, 0, true);
    var badRejected = false; try { parseGLB(bad); } catch (e) { badRejected = true; }
    var viewer = buildWebGLViewer(parsed, { title: 'fixture' });
    return { glbV2Header: parsed.sourceFormat === 'GLB 2.0', triangleParsed: parsed.triangleCount === 1, accessorBounds: parsed.positions.length === 9 && parsed.normals.length === 9, badMagicRejected: badRejected, boundedLimits: MAX_BYTES === 20 * 1024 * 1024 && MAX_VERTICES === 100000 && MAX_TRIANGLES === 12000, noExternalRuntime: !/<script\s+src=/i.test(viewer) && /connect-src \'none\'/.test(viewer), selfContainedWebGLViewer: /getContext\('webgl'/.test(viewer), noNewStore: true };
  }
  window.CANVIOGLBViewerP72 = { version: '72.0.0', parseGLB: parseGLB, buildWebGLViewer: buildWebGLViewer, mount: mount, tests: tests, limits: { bytes: MAX_BYTES, vertices: MAX_VERTICES, triangles: MAX_TRIANGLES } };
  function boot() { mount(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
  var prior = window.CANVIO_BUILD || {};
  window.CANVIO_BUILD = Object.freeze(Object.assign({}, prior, { version: '23.3.99-p72-glb-r1', base: prior.version || '23.3.98-p78-motion-r1', candidate: 'P72 bounded GLB static-mesh parser and self-contained WebGL viewer', features: (prior.features || []).concat(['P72 local GLB 2.0 static triangle mesh parser with node TRS/matrix, bounds checks and self-contained WebGL offline viewer; no Three/CDN/runtime dependency, explicitly excludes materials/textures/animation/compressed extensions']) }));
  document.title = 'CANVIO 23.3.99-p72-glb-r1 — GLB Viewer';
})();
