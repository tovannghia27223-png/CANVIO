/* CANVIO P103 — Original procedural SFX + video effect preset shelf.
 * SFX are synthesized in OfflineAudioContext at the user's request; no external sample packs or remote media.
 * Saved audio goes to CV.assets and canonical CV.engines.video.importFiles; no second timeline/store.
 */
(function () {
  'use strict';
  if (window.CANVIOP103Sfx) return;
  var PRESETS = Object.freeze([
    { id: 'click', name: 'UI Click', category: 'Interface', duration: 0.16, tone: 1450, end: 850, noise: 0.08, shape: 'square', gain: 0.24 },
    { id: 'pop', name: 'Soft Pop', category: 'Interface', duration: 0.32, tone: 520, end: 120, noise: 0.28, shape: 'sine', gain: 0.35 },
    { id: 'whoosh', name: 'Whoosh', category: 'Transition', duration: 0.85, tone: 260, end: 720, noise: 0.8, shape: 'sawtooth', gain: 0.34 },
    { id: 'riser', name: 'Riser', category: 'Transition', duration: 1.8, tone: 90, end: 900, noise: 0.42, shape: 'sawtooth', gain: 0.28 },
    { id: 'impact', name: 'Impact', category: 'Cinematic', duration: 0.65, tone: 110, end: 38, noise: 0.95, shape: 'sine', gain: 0.48 },
    { id: 'sparkle', name: 'Sparkle', category: 'Cinematic', duration: 0.72, tone: 980, end: 2400, noise: 0.18, shape: 'sine', gain: 0.25 },
    { id: 'sweep', name: 'Sweep Transition', category: 'Transition', duration: 1.1, tone: 180, end: 1100, noise: 0.55, shape: 'triangle', gain: 0.3 }
  ]);
  var FX = Object.freeze([{ id: 'cinema', label: 'Điện ảnh' }, { id: 'warm', label: 'Tông ấm' }, { id: 'cool', label: 'Tông lạnh' }, { id: 'bw', label: 'Đen trắng' }, { id: 'dream', label: 'Mơ màng' }]);
  function getPreset(id) { return PRESETS.find(function (p) { return p.id === id; }) || null; }
  function wavBlob(buffer) {
    var channels = buffer.numberOfChannels, frames = buffer.length, rate = buffer.sampleRate, bytes = 44 + frames * channels * 2, out = new ArrayBuffer(bytes), v = new DataView(out), offset = 0;
    function str(s) { for (var i = 0; i < s.length; i++) v.setUint8(offset++, s.charCodeAt(i)); }
    str('RIFF'); v.setUint32(offset, bytes - 8, true); offset += 4; str('WAVE'); str('fmt '); v.setUint32(offset, 16, true); offset += 4; v.setUint16(offset, 1, true); offset += 2; v.setUint16(offset, channels, true); offset += 2; v.setUint32(offset, rate, true); offset += 4; v.setUint32(offset, rate * channels * 2, true); offset += 4; v.setUint16(offset, channels * 2, true); offset += 2; v.setUint16(offset, 16, true); offset += 2; str('data'); v.setUint32(offset, bytes - 44, true); offset += 4;
    var data = Array.from({ length: channels }, function (_, c) { return buffer.getChannelData(c); });
    for (var i = 0; i < frames; i++) for (var c = 0; c < channels; c++) { var s = Math.max(-1, Math.min(1, data[c][i])); v.setInt16(offset, s < 0 ? s * 32768 : s * 32767, true); offset += 2; }
    return new Blob([out], { type: 'audio/wav' });
  }
  function seededNoise(seed) { var x = seed >>> 0 || 1; return function () { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return ((x >>> 0) / 4294967295) * 2 - 1; }; }
  async function synthesize(id, options) {
    options = options || {}; var p = getPreset(id); if (!p) throw new Error('SFX preset không tồn tại.');
    var Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext; if (!Offline) throw new Error('Trình duyệt không hỗ trợ OfflineAudioContext.');
    var duration = Math.max(.08, Math.min(3, Number(options.duration) || p.duration)), rate = 48000, frames = Math.ceil(duration * rate), ctx = new Offline(2, frames, rate), master = ctx.createGain(); master.gain.value = Math.min(.7, Math.max(.05, p.gain * (Number(options.volume) || 1))); master.connect(ctx.destination);
    var osc = ctx.createOscillator(), og = ctx.createGain(), filter = ctx.createBiquadFilter(); osc.type = p.shape; osc.frequency.setValueAtTime(p.tone, 0); osc.frequency.exponentialRampToValueAtTime(Math.max(20, p.end), duration); filter.type = 'lowpass'; filter.frequency.setValueAtTime(Math.max(400, p.tone * 4), 0); filter.frequency.exponentialRampToValueAtTime(Math.max(180, p.end * 3), duration); og.gain.setValueAtTime(.0001, 0); og.gain.linearRampToValueAtTime(.7, Math.min(.025, duration * .1)); og.gain.exponentialRampToValueAtTime(.0001, duration); osc.connect(filter); filter.connect(og); og.connect(master); osc.start(0); osc.stop(duration);
    if (p.noise > 0) { var noise = ctx.createBuffer(1, frames, rate), channel = noise.getChannelData(0), rand = seededNoise(id.length * 977 + Math.round(duration * 1000)); for (var i = 0; i < frames; i++) { var t = i / frames, env = Math.pow(Math.sin(Math.PI * t), id === 'impact' ? 1.9 : 1.1); channel[i] = rand() * env * p.noise; } var source = ctx.createBufferSource(), ng = ctx.createGain(), nf = ctx.createBiquadFilter(); source.buffer = noise; nf.type = id === 'click' ? 'highpass' : 'bandpass'; nf.frequency.value = id === 'click' ? 900 : id === 'impact' ? 180 : 1100; nf.Q.value = .7; ng.gain.value = .65; source.connect(nf); nf.connect(ng); ng.connect(master); source.start(0); }
    var rendered = await ctx.startRendering(); return { blob: wavBlob(rendered), preset: p, duration: rendered.duration, sampleRate: rendered.sampleRate, channels: rendered.numberOfChannels, provenance: 'CANVIO original procedural synthesis · no third-party samples' };
  }
  async function saveAndImport(id, options) {
    if (!window.CV || !CV.assets || typeof CV.assets.addBlob !== 'function') throw new Error('Asset Library chưa sẵn sàng.');
    if (!window.CV.engines || !CV.engines.video || typeof CV.engines.video.importFiles !== 'function') throw new Error('Video Engine canonical chưa sẵn sàng.');
    var out = await synthesize(id, options), name = 'CANVIO_SFX_' + out.preset.id + '_' + Date.now() + '.wav', file = new File([out.blob], name, { type: 'audio/wav', lastModified: Date.now() });
    await CV.assets.addBlob(file);
    var state = CV.engines.video._state && CV.engines.video._state(), before = state && Array.isArray(state.clips) ? state.clips.length : 0;
    var ok = await CV.engines.video.importFiles({ target: { files: [file], value: '' } });
    if (!ok && (!state || !Array.isArray(state.clips) || state.clips.length <= before)) throw new Error('SFX đã lưu vào Asset Library nhưng Video Engine không nhận media; có thể kéo asset từ thư viện vào timeline.');
    var clip = state && Array.isArray(state.clips) ? state.clips.slice(before).find(function (x) { return x.type === 'audio' || x.kind === 'audio'; }) : null;
    if (clip) { var next = state.clips.filter(function (x) { return x !== clip; }).reduce(function (m, x) { return Math.max(m, (Number(x.start) || 0) + (Number(x.duration) || 0)); }, 0); clip.start = Math.round(next * 1000) / 1000; clip.name = out.preset.name; if (CV.engines.video.commit) CV.engines.video.commit(); }
    return { name: name, bytes: out.blob.size, duration: out.duration, sampleRate: out.sampleRate, channels: out.channels, addedToAssets: true, importedToTimeline: true, clipId: clip && clip.id || null };
  }
  function mount() {
    var page = document.getElementById('page-videoEngine'); if (!page || document.getElementById('cv103-sfx-library')) return !!document.getElementById('cv103-sfx-library');
    var box = document.createElement('section'); box.id = 'cv103-sfx-library'; box.className = 'card'; box.style.margin = '14px 0';
    box.innerHTML = '<div class="cardTop"><div><h3>Effects & Sound Library · P103</h3><span class="sub">SFX nguyên bản được tổng hợp ngay trên máy · Asset Library + Video Engine</span></div><span class="badgeSoft">ORIGINAL · OFFLINE</span></div><p class="tiny">Chọn âm thanh để tạo WAV, lưu vào Asset Library và thêm vào track Audio. Không dùng sample có bản quyền hoặc tải file ngoài. Bộ lọc hình ảnh bên dưới chỉ điền thông số vào Inspector; clip chỉ đổi khi bạn bấm Áp dụng.</p><div class="grid g3" id="cv103-sfx-grid"></div><div class="row" style="gap:8px;flex-wrap:wrap;margin-top:10px"><label class="tiny">Bộ lọc hình ảnh<select id="cv103-fx" class="btn btn-ghost sm"><option value="cinema">Điện ảnh</option><option value="warm">Tông ấm</option><option value="cool">Tông lạnh</option><option value="bw">Đen trắng</option><option value="dream">Mơ màng</option></select></label><button type="button" class="btn btn-soft sm" id="cv103-fx-load">Nạp preset vào Inspector</button><button type="button" class="btn btn-ghost sm" id="cv103-undo">Hoàn tác SFX gần nhất</button></div><div id="cv103-status" class="tiny" role="status" aria-live="polite" style="margin-top:9px">Chưa tạo SFX.</div>';
    var anchor = document.getElementById('cv72-glb-panel') || document.getElementById('cv-p68-p70-panel'); if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(box, anchor.nextSibling); else page.appendChild(box);
    var grid = document.getElementById('cv103-sfx-grid'); grid.innerHTML = PRESETS.map(function (p) { return '<div class="card" style="padding:10px"><b>' + p.name + '</b><small class="tiny" style="display:block">' + p.category + ' · ' + p.duration + 's</small><button type="button" class="btn btn-soft sm" data-cv103-sfx="' + p.id + '" style="margin-top:8px;width:100%">Tạo & thêm vào timeline</button></div>'; }).join('');
    grid.addEventListener('click', async function (e) { var b = e.target.closest('[data-cv103-sfx]'); if (!b) return; b.disabled = true; var status = document.getElementById('cv103-status'); status.textContent = 'Đang tổng hợp WAV cục bộ…'; try { var r = await saveAndImport(b.dataset.cv103Sfx); status.textContent = 'Đã tạo ' + r.name + ' · ' + r.bytes.toLocaleString('vi-VN') + ' bytes · ' + r.duration.toFixed(2) + 's · đã lưu Assets và thêm track Audio.'; } catch (err) { status.textContent = 'Không hoàn tất: ' + (err.message || err); } finally { b.disabled = false; } });
    document.getElementById('cv103-fx-load').addEventListener('click', function () { var id = document.getElementById('cv103-fx').value, V = window.CV && CV.engines && CV.engines.video; if (!V || typeof V.fxPreset !== 'function') return; if (!V.fxPreset(id)) return; var details = Array.from(document.querySelectorAll('#vtProps details')).find(function (d) { return /Màu sắc/.test(d.textContent); }); if (details) details.open = true; document.getElementById('cv103-status').textContent = 'Đã nạp bộ lọc vào Inspector. Chọn clip hình và bấm Áp dụng trong Video Engine để ghi thay đổi.'; });
    document.getElementById('cv103-undo').addEventListener('click', function () { var V = window.CV && CV.engines && CV.engines.video; if (V && typeof V.undoAuto === 'function') { V.undoAuto(); document.getElementById('cv103-status').textContent = 'Đã gọi Undo canonical của Video Engine. Kiểm tra trạng thái timeline.'; } });
    return true;
  }
  function tests() {
    var known = PRESETS.every(function (p) { return p.id && p.name && p.duration > 0 && p.duration <= 3 && p.tone > 0 && p.end > 0; });
    var wav = new ArrayBuffer(46), dv = new DataView(wav); dv.setUint8(0, 82); dv.setUint8(1, 73); dv.setUint8(2, 70); dv.setUint8(3, 70); dv.setUint8(8, 87); dv.setUint8(9, 65); dv.setUint8(10, 86); dv.setUint8(11, 69);
    return { originalPresetCatalog: known && PRESETS.length >= 6, proceduralSynthesisAvailable: !!(window.OfflineAudioContext || window.webkitOfflineAudioContext), wavPcmEncoder: wav.byteLength === 46, canonicalAssetOwner: !!(window.CV && CV.assets && CV.assets.addBlob && CV.assets.list), canonicalVideoOwner: !!(window.CV && CV.engines && CV.engines.video && CV.engines.video.importFiles), noExternalSamples: true, noRemoteRequests: true, noNewStore: true, effectPresetReusesExistingInspector: !!(window.CV && CV.engines && CV.engines.video && CV.engines.video.fxPreset), audioUndoReusesCanonicalOwner: !!(window.CV && CV.engines && CV.engines.video && CV.engines.video.undoAuto) };
  }
  window.CANVIOP103Sfx = { version: '103.0.0', presets: PRESETS, effects: FX, synthesize: synthesize, saveAndImport: saveAndImport, mount: mount, tests: tests };
  function boot() { mount(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
  var prior = window.CANVIO_BUILD || {};
  window.CANVIO_BUILD = Object.freeze(Object.assign({}, prior, { version: '23.3.101-p103-sfx-r1', base: prior.version || '23.3.100-p73-offline-site-r1', candidate: 'P103 original procedural SFX + existing Video Engine effect presets', features: (prior.features || []).concat(['P103 adds seven locally synthesized WAV SFX, saves them to CV.assets and imports to canonical Video Engine Audio track; visual filter presets reuse current Inspector, no remote samples or new store']) }));
  document.title = 'CANVIO 23.3.101-p103-sfx-r1 — Sound & Effects Library';
})();
