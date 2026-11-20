/* P138 (phần khử ồn) · Khử ồn nền bằng spectral gating thuần JS (STFT 1024/hop 512, căn-hann, hồ sơ ồn lấy từ ~10% khung yên nhất, trừ phổ + sàn -20 dB, làm mượt tần số).
   Không phải RNNoise/AI: hiệu quả với ồn đều (quạt, điều hoà, hiss), kém với ồn thay đổi hay tiếng người nền. Tạo clip MỚI, không sửa clip gốc.
   Giới hạn 5 phút mono. TTS tiếng Việt (Piper) chưa làm vì cần model tải về. */
(function () {
'use strict';
if (window.CVDenoiseP138) return;
var N = 1024, HOP = 512, MAX_SECONDS = 300, MAX_BYTES = 80 * 1048576;
function fft(re, im, inv) {
  var n = re.length, i, j = 0, k, bit, t;
  for (i = 1; i < n; i++) { bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
  for (var len = 2; len <= n; len <<= 1) {
    var ang = 2 * Math.PI / len * (inv ? -1 : 1), wr = Math.cos(ang), wi = Math.sin(ang), h = len >> 1;
    for (i = 0; i < n; i += len) { var cr = 1, ci = 0; for (k = 0; k < h; k++) { var ur = re[i + k], ui = im[i + k], vr = re[i + k + h] * cr - im[i + k + h] * ci, vi = re[i + k + h] * ci + im[i + k + h] * cr; re[i + k] = ur + vr; im[i + k] = ui + vi; re[i + k + h] = ur - vr; im[i + k + h] = ui - vi; var nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr; } }
  }
  if (inv) for (i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
}
var WIN = (function () { var w = new Float64Array(N); for (var i = 0; i < N; i++) w[i] = Math.sqrt(0.5 - 0.5 * Math.cos(2 * Math.PI * i / N)); return w; })();
function denoise(x, opt) {
  opt = opt || {}; if (!x || typeof x.length !== 'number') return new Float32Array(0);
  var n = x.length, strength = Math.max(0, Math.min(1, opt.strength == null ? 0.6 : Number(opt.strength))), alpha = 1 + 2.5 * strength, floor = Math.pow(10, -(8 + 14 * strength) / 20);
  if (!(n > N * 2)) return Float32Array.from(x || []);
  var frames = Math.ceil((n + 2 * HOP - N) / HOP) + 1, pad = (frames - 1) * HOP + N, buf = new Float64Array(pad), f, i, k;
  for (i = 0; i < n; i++) buf[i + HOP] = x[i];
  var mags = [], energy = new Float64Array(frames), re = new Float64Array(N), im = new Float64Array(N);
  for (f = 0; f < frames; f++) { for (i = 0; i < N; i++) { re[i] = buf[f * HOP + i] * WIN[i]; im[i] = 0; } fft(re, im, false); var m = new Float32Array(N / 2 + 1), e = 0; for (k = 0; k <= N / 2; k++) { m[k] = Math.sqrt(re[k] * re[k] + im[k] * im[k]); e += m[k] * m[k]; } mags.push(m); energy[f] = e; }
  var order = Array.from(energy.keys()).sort(function (a, b) { return energy[a] - energy[b]; }), use = Math.max(3, Math.floor(frames * 0.1)), prof = new Float64Array(N / 2 + 1);
  for (i = 0; i < use; i++) for (k = 0; k <= N / 2; k++) prof[k] += mags[order[i]][k] / use;
  var out = new Float64Array(pad), prevG = new Float64Array(N / 2 + 1).fill(1), g = new Float64Array(N / 2 + 1), gs = new Float64Array(N / 2 + 1);
  for (f = 0; f < frames; f++) {
    for (i = 0; i < N; i++) { re[i] = buf[f * HOP + i] * WIN[i]; im[i] = 0; } fft(re, im, false);
    for (k = 0; k <= N / 2; k++) { var mg = mags[f][k] + 1e-12; g[k] = Math.max(floor, 1 - alpha * prof[k] / mg); }
    for (k = 0; k <= N / 2; k++) { var s = (g[Math.max(0, k - 1)] + 2 * g[k] + g[Math.min(N / 2, k + 1)]) / 4; gs[k] = s < prevG[k] ? 0.5 * prevG[k] + 0.5 * s : s; prevG[k] = gs[k]; }
    for (k = 0; k <= N / 2; k++) { re[k] *= gs[k]; im[k] *= gs[k]; if (k > 0 && k < N / 2) { re[N - k] = re[k]; im[N - k] = -im[k]; } }
    fft(re, im, true);
    for (i = 0; i < N; i++) out[f * HOP + i] += re[i] * WIN[i];
  }
  var y = new Float32Array(n); for (i = 0; i < n; i++) y[i] = out[i + HOP]; return y;
}
function rms(a, s, e) { var t = 0, c = 0; for (var i = s; i < e && i < a.length; i++) { t += a[i] * a[i]; c++; } return Math.sqrt(t / Math.max(1, c)); }
function wav(data, sr) {
  var n = data.length, b = new ArrayBuffer(44 + n * 2), v = new DataView(b), i, s;
  function str(o, t) { for (var k = 0; k < t.length; k++) v.setUint8(o + k, t.charCodeAt(k)); }
  str(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); str(8, 'WAVE'); str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); str(36, 'data'); v.setUint32(40, n * 2, true);
  for (i = 0; i < n; i++) { s = Math.max(-1, Math.min(1, data[i])); v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true); }
  return new Uint8Array(b);
}
function getBlob(state, clip) { var id = clip.mediaId || clip.id, f = state.fileRefs && state.fileRefs[id]; if (f) return Promise.resolve(f); return new Promise(function (ok) { if (!state.db) { ok(null); return; } var q; try { q = state.db.transaction('media').objectStore('media').get(id); } catch (e) { ok(null); return; } q.onsuccess = function () { ok(q.result && (q.result.blob || null)); }; q.onerror = function () { ok(null); }; }); }
function processClip(state, clip, strength) {
  var AC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!AC) return Promise.reject(new Error('Trình duyệt không hỗ trợ giải mã audio.'));
  if (!clip || (clip.type !== 'audio' && clip.type !== 'video')) return Promise.reject(new Error('Chọn clip audio hoặc video có tiếng.'));
  return getBlob(state, clip).then(function (blob) {
    if (!blob) throw new Error('Không đọc được media của clip này.'); if (blob.size > MAX_BYTES) throw new Error('Tệp quá lớn (tối đa 80 MB).'); return blob.arrayBuffer();
  }).then(function (ab) { return new Promise(function (ok, no) { var c = new AC(1, 1, 44100), p = c.decodeAudioData(ab, ok, no); if (p && p.catch) p.catch(no); }); }).then(function (buf) {
    var fs = buf.sampleRate, from = Math.min(buf.length, Math.max(0, Math.round((Number(clip.trimIn) || 0) * fs))), len = Math.min(buf.length - from, Math.round(Math.max(0.1, Number(clip.duration) || 0.1) * fs));
    if (len > fs * MAX_SECONDS) throw new Error('Clip dài quá 5 phút.');
    var mono = new Float32Array(len), ch, i; for (ch = 0; ch < buf.numberOfChannels; ch++) { var d = buf.getChannelData(ch); for (i = 0; i < len; i++) mono[i] += d[from + i] / buf.numberOfChannels; }
    var y = denoise(mono, { strength: strength }); return { samples: y, sampleRate: fs, wav: wav(y, fs) };
  });
}
function mount() {
  var page = document.querySelector('#page-videoEngine'), card = page && page.querySelector('#cv127-quality');
  if (!card || card.querySelector('#cv138-row')) return false;
  var row = document.createElement('div'); row.id = 'cv138-row'; row.className = 'row'; row.style.cssText = 'margin-top:10px;align-items:center;flex-wrap:wrap;gap:8px';
  row.innerHTML = '<b class="tiny">Khử ồn (P138)</b><label class="tiny">Mức <input type="range" id="cv138-s" min="0" max="100" value="60"></label><button type="button" class="btn btn-soft sm" id="cv138-run">Khử ồn clip đang chọn</button><span class="tiny" id="cv138-out" role="status" aria-live="polite">Tạo clip mới đã giảm ồn nền đều (quạt, hiss); clip gốc giữ nguyên.</span>';
  card.insertBefore(row, card.querySelector('#cv127q-list'));
  row.querySelector('#cv138-run').addEventListener('click', function () {
    var out = row.querySelector('#cv138-out'), btn = this, v = window.CV && CV.engines && CV.engines.video, s = v && v._state && v._state();
    if (!s || !v.importFiles) { out.textContent = 'Mở Video Engine trước.'; return; }
    var clip = (s.clips || []).filter(function (c) { return c.id === s.selected; })[0]; if (!clip) { out.textContent = 'Chọn một clip có tiếng trên timeline.'; return; }
    btn.disabled = true; out.textContent = 'Đang khử ồn…';
    processClip(s, clip, row.querySelector('#cv138-s').value / 100).then(function (r) { var f = new File([r.wav], String(clip.name || 'audio').replace(/\.[^.]+$/, '').slice(0, 60) + '-khu-on.wav', { type: 'audio/wav' }); v.importFiles({ target: { files: [f], value: '' } }); out.textContent = 'Đã thêm clip "' + f.name + '" (mono). Nghe thử rồi bỏ clip nào không cần.'; }).catch(function (e) { out.textContent = String(e && e.message || e).slice(0, 140); }).then(function () { btn.disabled = false; });
  });
  return true;
}
function ready() { try { mount(); var p = document.querySelector('#page-videoEngine'); if (p && !p.__cv138Obs && window.MutationObserver) { p.__cv138Obs = new MutationObserver(function () { if (!p.querySelector('#cv138-row')) mount(); }); p.__cv138Obs.observe(p, { childList: true, subtree: true }); } } catch (e) {} }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true }); else ready();
function synth(sr, sec, noiseAmp) { var n = sr * sec, x = new Float32Array(n), s = 12345, i; for (i = 0; i < n; i++) { s = (s * 1664525 + 1013904223) >>> 0; var r = s / 4294967296 * 2 - 1, on = Math.floor(i / (sr / 2)) % 2 === 0; x[i] = (on ? 0.4 * Math.sin(2 * Math.PI * 440 * i / sr) : 0) + noiseAmp * r; } return x; }
function tests() {
  var sr = 16000, x = synth(sr, 6, 0.05), y = denoise(x, { strength: 0.7 });
  var tOn = [sr * 0.1, sr * 0.4], tOff = [sr * 0.6, sr * 0.9], on0 = rms(x, tOn[0], tOn[1]), on1 = rms(y, tOn[0], tOn[1]), offIn = 0, offOut = 0, c = 0;
  for (var sec = 2; sec < 5; sec += 2) { offIn += rms(x, sec * sr + tOff[0], sec * sr + tOff[1]); offOut += rms(y, sec * sr + tOff[0], sec * sr + tOff[1]); c++; }
  offIn /= c; offOut /= c;
  var db = function (a, b) { return 20 * Math.log10(a / b); }, w = wav(new Float32Array([0, 1, -1]), 8000), clean = new Float32Array(sr * 3);
  var re = new Float64Array(8), im = new Float64Array(8); re[1] = 1; fft(re, im, false); var re2 = Float64Array.from(re), im2 = Float64Array.from(im); fft(re2, im2, true);
  return {
    fftRoundTrip: Math.abs(re2[1] - 1) < 1e-9 && Math.abs(re[0] - 1) < 1e-9 && Math.abs(re2[0]) < 1e-9 && Math.abs(re[1] - Math.cos(2 * Math.PI / 8)) < 1e-9,
    noiseDropsAtLeast10dB: db(offIn, offOut) >= 10,
    toneKeptWithin2dB: Math.abs(db(on1, on0)) <= 2,
    outputSameLengthFinite: y.length === x.length && Array.prototype.every.call(y, isFinite),
    strengthMonotonic: rms(denoise(x, { strength: 1 }), sr * 2 + tOff[0], sr * 2 + tOff[1]) < rms(denoise(x, { strength: 0 }), sr * 2 + tOff[0], sr * 2 + tOff[1]),
    shortInputPassesThrough: denoise(new Float32Array(100), {}).length === 100 && denoise(null, {}).length === 0,
    edgesNotAttenuated: (function () { var c = new Float32Array(sr * 3), i, k = Math.round(sr * 0.2); for (i = 0; i < k; i++) { c[i] = 0.4 * Math.sin(2 * Math.PI * 440 * i / sr); c[c.length - 1 - i] = 0.4 * Math.sin(2 * Math.PI * 440 * i / sr); } var o = denoise(c, { strength: 0.5 }); return Math.abs(rms(o, 0, k) / rms(c, 0, k) - 1) < 0.15 && Math.abs(rms(o, c.length - k, c.length) / rms(c, c.length - k, c.length) - 1) < 0.15; })(), silenceStaysSilent: rms(denoise(clean, {}), 0, clean.length) < 1e-6,
    wavHeader: String.fromCharCode(w[0], w[1], w[2], w[3]) === 'RIFF' && w.length === 50
  };
}
window.CVDenoiseP138 = { version: '138.1.0', denoise: denoise, processClip: processClip, wav: wav, mount: mount, tests: tests };
})();
