/* P145.3 · SFX tổng hợp bằng Web Audio (OfflineAudioContext), không cần tệp ngoài, không bản quyền.
   Công thức: whoosh, hit, riser, click, glitch, pop. Xuất WAV 16-bit mono 44,1 kHz, chuẩn hoá đỉnh -1 dBFS, có seed để lặp lại được.
   Nút trong thẻ #cv127-quality: Nghe, Thêm vào timeline (qua importFiles của engine), Tải WAV. Giới hạn: chỉ âm tổng hợp, chưa có nhạc nền/stems/ducking. */
(function () {
'use strict';
if (window.CVSfxP145) return;
var SR = 44100, REC = {
  whoosh: { label: 'Whoosh', dur: 0.9 }, hit: { label: 'Hit', dur: 0.7 }, riser: { label: 'Riser', dur: 2.5 },
  click: { label: 'Click UI', dur: 0.12 }, glitch: { label: 'Glitch', dur: 0.5 }, pop: { label: 'Pop', dur: 0.25 }
};
function rng(seed) { var s = (seed >>> 0) || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
function clampDur(k, d) { var def = REC[k].dur, v = Number(d); if (!isFinite(v) || v <= 0) v = def; return Math.max(0.05, Math.min(6, v)); }
function noiseBuf(ctx, dur, seed) { var n = Math.ceil(ctx.sampleRate * dur), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0), r = rng(seed), i; for (i = 0; i < n; i++) d[i] = r() * 2 - 1; return b; }
function env(g, t0, a, peak, dur, end) { g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(peak, t0 + a); g.gain.exponentialRampToValueAtTime(Math.max(0.0001, end || 0.001), t0 + dur); }
function build(ctx, kind, dur, seed) {
  var out = ctx.createGain(), nz, src, f, g, o, i, r;
  out.connect(ctx.destination);
  function noise() { var s = ctx.createBufferSource(); s.buffer = noiseBuf(ctx, dur, seed); s.start(0); return s; }
  if (kind === 'whoosh') { src = noise(); f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2; f.frequency.setValueAtTime(300, 0); f.frequency.exponentialRampToValueAtTime(5000, dur * 0.45); f.frequency.exponentialRampToValueAtTime(400, dur); g = ctx.createGain(); env(g, 0, dur * 0.4, 1, dur, 0.001); src.connect(f); f.connect(g); g.connect(out); }
  else if (kind === 'hit') { o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(140, 0); o.frequency.exponentialRampToValueAtTime(38, dur * 0.6); g = ctx.createGain(); env(g, 0, 0.004, 1, dur, 0.001); o.connect(g); g.connect(out); o.start(0); o.stop(dur);
    src = noise(); f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1800; var g2 = ctx.createGain(); env(g2, 0, 0.002, 0.5, Math.min(0.12, dur), 0.001); src.connect(f); f.connect(g2); g2.connect(out); }
  else if (kind === 'riser') { src = noise(); f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2; f.frequency.setValueAtTime(200, 0); f.frequency.exponentialRampToValueAtTime(7000, dur); g = ctx.createGain(); g.gain.setValueAtTime(0.05, 0); g.gain.exponentialRampToValueAtTime(1, dur * 0.97); g.gain.linearRampToValueAtTime(0, dur); src.connect(f); f.connect(g); g.connect(out);
    o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(110, 0); o.frequency.exponentialRampToValueAtTime(880, dur); var g3 = ctx.createGain(); g3.gain.setValueAtTime(0.02, 0); g3.gain.linearRampToValueAtTime(0.25, dur * 0.97); g3.gain.linearRampToValueAtTime(0, dur); o.connect(g3); g3.connect(out); o.start(0); o.stop(dur); }
  else if (kind === 'click') { o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = 1800; g = ctx.createGain(); env(g, 0, 0.001, 0.8, dur, 0.001); o.connect(g); g.connect(out); o.start(0); o.stop(dur); }
  else if (kind === 'glitch') { r = rng(seed); src = noise(); f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 6; g = ctx.createGain(); var steps = Math.max(4, Math.round(dur * 24)); for (i = 0; i < steps; i++) { var t = i * dur / steps; f.frequency.setValueAtTime(300 + r() * 6000, t); g.gain.setValueAtTime(r() > 0.35 ? 0.4 + r() * 0.6 : 0, t); } g.gain.setValueAtTime(0, dur); src.connect(f); f.connect(g); g.connect(out); }
  else if (kind === 'pop') { o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(900, 0); o.frequency.exponentialRampToValueAtTime(220, dur * 0.8); g = ctx.createGain(); env(g, 0, 0.003, 1, dur, 0.001); o.connect(g); g.connect(out); o.start(0); o.stop(dur); }
  return out;
}
function normalize(data, peakDb) { var pk = 0, i; for (i = 0; i < data.length; i++) { var a = Math.abs(data[i]); if (a > pk) pk = a; } if (pk < 1e-6) return data; var gain = Math.pow(10, (peakDb == null ? -1 : peakDb) / 20) / pk, o = new Float32Array(data.length); for (i = 0; i < data.length; i++) o[i] = data[i] * gain; return o; }
function wav(data, sr) {
  var n = data.length, b = new ArrayBuffer(44 + n * 2), v = new DataView(b), i, s;
  function str(o, t) { for (var k = 0; k < t.length; k++) v.setUint8(o + k, t.charCodeAt(k)); }
  str(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); str(8, 'WAVE'); str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); str(36, 'data'); v.setUint32(40, n * 2, true);
  for (i = 0; i < n; i++) { s = Math.max(-1, Math.min(1, data[i])); v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true); }
  return new Uint8Array(b);
}
function render(kind, opt) {
  var AC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!REC[kind]) return Promise.reject(new Error('SFX không tồn tại.'));
  if (!AC) return Promise.reject(new Error('Trình duyệt không hỗ trợ OfflineAudioContext.'));
  var dur = clampDur(kind, opt && opt.duration), seed = Number(opt && opt.seed) || 1, ctx = new AC(1, Math.ceil(SR * dur), SR);
  build(ctx, kind, dur, seed);
  return ctx.startRendering().then(function (buf) { var d = normalize(buf.getChannelData(0), -1); return { samples: d, sampleRate: SR, duration: d.length / SR, wav: wav(d, SR), kind: kind }; });
}
function mount() {
  var page = document.querySelector('#page-videoEngine'), card = page && page.querySelector('#cv127-quality');
  if (!card || card.querySelector('#cv145s-row')) return false;
  var row = document.createElement('div'); row.id = 'cv145s-row'; row.className = 'row'; row.style.cssText = 'margin-top:10px;align-items:center;flex-wrap:wrap;gap:8px';
  row.innerHTML = '<b class="tiny">SFX tổng hợp (P145.3)</b><select class="input" id="cv145s-kind" style="max-width:130px" aria-label="Loại SFX">' + Object.keys(REC).map(function (k) { return '<option value="' + k + '">' + REC[k].label + '</option>'; }).join('') + '</select><label class="tiny">Giây <input type="number" id="cv145s-dur" step="0.1" min="0.05" max="6" value="0.9" style="width:60px"></label><button type="button" class="btn btn-soft sm" id="cv145s-play">Nghe</button><button type="button" class="btn btn-soft sm" id="cv145s-add">Thêm vào timeline</button><button type="button" class="btn btn-ghost sm" id="cv145s-dl">Tải WAV</button><span class="tiny" id="cv145s-out" role="status" aria-live="polite">Âm tự sinh, không bản quyền.</span>';
  card.insertBefore(row, card.querySelector('#cv127q-list'));
  var $ = function (s) { return row.querySelector(s); }, out = function (t) { $('#cv145s-out').textContent = t; };
  $('#cv145s-kind').addEventListener('change', function () { $('#cv145s-dur').value = REC[this.value].dur; });
  function go(fn) { var k = $('#cv145s-kind').value; out('Đang tạo…'); render(k, { duration: $('#cv145s-dur').value }).then(fn).catch(function (e) { out(String(e && e.message || e).slice(0, 140)); }); }
  $('#cv145s-play').addEventListener('click', function () { go(function (r) { try { var AC = window.AudioContext || window.webkitAudioContext, c = new AC(), b = c.createBuffer(1, r.samples.length, r.sampleRate); b.getChannelData(0).set(r.samples); var s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(); s.onended = function () { try { c.close(); } catch (e) {} }; out('Đang phát ' + REC[r.kind].label + ' (' + r.duration.toFixed(2) + ' s).'); } catch (e) { out('Không phát được: ' + String(e.message || e).slice(0, 100)); } }); });
  $('#cv145s-dl').addEventListener('click', function () { go(function (r) { var u = URL.createObjectURL(new Blob([r.wav], { type: 'audio/wav' })), a = document.createElement('a'); a.href = u; a.download = 'sfx-' + r.kind + '.wav'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000); out('Đã tải sfx-' + r.kind + '.wav'); }); });
  $('#cv145s-add').addEventListener('click', function () { var v = window.CV && CV.engines && CV.engines.video; if (!v || !v.importFiles) { out('Mở Video Engine trước.'); return; } go(function (r) { var f = new File([r.wav], 'sfx-' + r.kind + '.wav', { type: 'audio/wav' }); v.importFiles({ target: { files: [f], value: '' } }); out('Đã thêm sfx-' + r.kind + ' vào track audio.'); }); });
  return true;
}
function ready() { try { mount(); var p = document.querySelector('#page-videoEngine'); if (p && !p.__cv145sObs && window.MutationObserver) { p.__cv145sObs = new MutationObserver(function () { if (!p.querySelector('#cv145s-row')) mount(); }); p.__cv145sObs.observe(p, { childList: true, subtree: true }); } } catch (e) {} }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true }); else ready();
function tests() {
  var w = wav(new Float32Array([0, 1, -1, 0.5]), 44100), dv = new DataView(w.buffer), n = normalize(new Float32Array([0.1, -0.2]), -1), r1 = rng(5), r2 = rng(5), z = normalize(new Float32Array(4), -1);
  return {
    wavHeader: String.fromCharCode(w[0], w[1], w[2], w[3]) === 'RIFF' && String.fromCharCode(w[8], w[9], w[10], w[11]) === 'WAVE' && dv.getUint32(24, true) === 44100 && dv.getUint32(40, true) === 8 && w.length === 52,
    wavSamples: dv.getInt16(46, true) === 32767 && dv.getInt16(48, true) === -32768 && dv.getInt16(44, true) === 0,
    normalizeToMinus1dB: Math.abs(Math.max(Math.abs(n[0]), Math.abs(n[1])) - Math.pow(10, -1 / 20)) < 1e-6 && z.length === 4 && z[0] === 0,
    rngDeterministic: r1() === r2() && r1() !== r1(), recipes: Object.keys(REC).length === 6,
    durationClamped: clampDur('hit', 99) === 6 && clampDur('hit', -1) === 0.7 && clampDur('click', 0.001) === 0.05
  };
}
window.CVSfxP145 = { version: '145.3.0', recipes: REC, render: render, wav: wav, normalize: normalize, mount: mount, tests: tests };
})();
