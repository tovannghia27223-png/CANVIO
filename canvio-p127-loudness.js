/* P127.3 (phần đo) · Integrated loudness per ITU-R BS.1770-4 (K-weighting + 400 ms blocks + absolute/relative gate).
   Read-only: measures the selected clip's audio and suggests a gain; never edits the timeline. Sample peak only (no true-peak oversampling). */
(function () {
'use strict';
if (window.CVLoudnessP127) return;
var TARGET = -14, MAX_BYTES = 80 * 1024 * 1024, MAX_SECONDS = 1800;
function shelf(fs) {
  var f0 = 1681.974450955533, G = 3.999843853973347, Q = 0.7071752369554196, K = Math.tan(Math.PI * f0 / fs), Vh = Math.pow(10, G / 20), Vb = Math.pow(Vh, 0.4996667741545416), a0 = 1 + K / Q + K * K;
  return { b: [(Vh + Vb * K / Q + K * K) / a0, 2 * (K * K - Vh) / a0, (Vh - Vb * K / Q + K * K) / a0], a: [2 * (K * K - 1) / a0, (1 - K / Q + K * K) / a0] };
}
function highpass(fs) {
  var f0 = 38.13547087602444, Q = 0.5003270373238773, K = Math.tan(Math.PI * f0 / fs), a0 = 1 + K / Q + K * K;
  return { b: [1, -2, 1], a: [2 * (K * K - 1) / a0, (1 - K / Q + K * K) / a0] };
}
function biquad(x, c) {
  var y = new Float64Array(x.length), x1 = 0, x2 = 0, y1 = 0, y2 = 0, b = c.b, a = c.a, i, v;
  for (i = 0; i < x.length; i++) { v = b[0] * x[i] + b[1] * x1 + b[2] * x2 - a[0] * y1 - a[1] * y2; x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v; }
  return y;
}
function measure(channels, fs) {
  var out = { lufs: null, peakDb: null, blocks: 0, gated: 0, seconds: 0 };
  if (!channels || !channels.length || !(fs >= 8000 && fs <= 192000)) return out;
  var n = channels[0].length, nch = Math.min(channels.length, 5), i, c, peak = 0;
  if (!n || n > fs * MAX_SECONDS) return out;
  out.seconds = n / fs;
  var sh = shelf(fs), hp = highpass(fs), filt = [];
  for (c = 0; c < nch; c++) {
    var ch = channels[c]; if (!ch || ch.length !== n) return out;
    for (i = 0; i < n; i++) { var av = Math.abs(ch[i]); if (av > peak) peak = av; }
    filt.push(biquad(biquad(ch, sh), hp));
  }
  out.peakDb = peak > 0 ? 20 * Math.log10(peak) : -Infinity;
  var blk = Math.round(0.4 * fs), hop = Math.round(0.1 * fs);
  if (n < blk) return out;
  var cums = filt.map(function (f) { var s = new Float64Array(n + 1); for (var k = 0; k < n; k++) s[k + 1] = s[k] + f[k] * f[k]; return s; });
  var z = [];
  for (var st = 0; st + blk <= n; st += hop) { var sum = 0; for (c = 0; c < nch; c++) sum += (cums[c][st + blk] - cums[c][st]) / blk; z.push(sum); }
  out.blocks = z.length;
  var lk = function (s) { return -0.691 + 10 * Math.log10(s); };
  var abs = z.filter(function (s) { return s > 0 && lk(s) > -70; });
  if (!abs.length) return out;
  var rel = lk(abs.reduce(function (p, q) { return p + q; }, 0) / abs.length) - 10;
  var fin = abs.filter(function (s) { return lk(s) > rel; });
  if (!fin.length) return out;
  out.gated = fin.length; out.lufs = lk(fin.reduce(function (p, q) { return p + q; }, 0) / fin.length);
  return out;
}
function advice(m) {
  if (m.lufs == null) return { level: 'warn', text: 'Không đo được: clip im lặng hoặc quá ngắn (cần ≥ 0,4 s).' };
  var gain = TARGET - m.lufs, rounded = Math.round(gain * 10) / 10, risk = m.peakDb != null && isFinite(m.peakDb) && m.peakDb + gain > -0.5;
  var text = m.lufs.toFixed(1) + ' LUFS · đỉnh mẫu ' + (isFinite(m.peakDb) ? m.peakDb.toFixed(1) : '-∞') + ' dBFS · mục tiêu ' + TARGET + ' LUFS (Reels/YouTube): ' + (Math.abs(rounded) < 1.5 ? 'đã gần mục tiêu' : (rounded > 0 ? 'nên tăng ' : 'nên giảm ') + Math.abs(rounded).toFixed(1) + ' dB') + (risk && rounded > 0 ? '. Cẩn thận: tăng nữa sẽ làm đỉnh vượt -0,5 dBFS, nên dùng limiter.' : '.');
  return { level: Math.abs(rounded) < 1.5 ? 'pass' : (risk && rounded > 0 ? 'warn' : 'warn'), text: text, gainDb: rounded };
}
function getBlob(state, clip) {
  var id = clip.mediaId || clip.id, f = state.fileRefs && state.fileRefs[id];
  if (f) return Promise.resolve(f);
  return new Promise(function (ok) { if (!state.db) { ok(null); return; } var q; try { q = state.db.transaction('media').objectStore('media').get(id); } catch (e) { ok(null); return; } q.onsuccess = function () { var r = q.result; if (r && r.blob) { ok(r.blob); return; } var sc = window.CVMediaOPFSP133; if (r && r.storage === 'opfs' && sc && typeof sc.get === 'function') { sc.get(id, state).then(ok, function () { ok(null); }); return; } ok(null); }; q.onerror = function () { ok(null); }; });
}
function measureClip(state, clip) {
  var AC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!AC) return Promise.reject(new Error('Trình duyệt không hỗ trợ giải mã audio.'));
  if (!clip || (clip.type !== 'audio' && clip.type !== 'video')) return Promise.reject(new Error('Chọn clip audio hoặc video có tiếng.'));
  return getBlob(state, clip).then(function (blob) {
    if (!blob) throw new Error('Không đọc được media của clip này.');
    if (blob.size > MAX_BYTES) throw new Error('Tệp quá lớn để đo (tối đa 80 MB).');
    return blob.arrayBuffer();
  }).then(function (ab) {
    return new Promise(function (ok, no) { var ctx = new AC(1, 1, 44100), p = ctx.decodeAudioData(ab, ok, no); if (p && p.catch) p.catch(no); });
  }).then(function (buf) {
    var fs = buf.sampleRate, from = Math.min(buf.length, Math.max(0, Math.round((Number(clip.trimIn) || 0) * fs))), len = Math.min(buf.length - from, Math.round(Math.max(0.1, Number(clip.duration) || 0.1) * fs)), chs = [];
    for (var c = 0; c < buf.numberOfChannels; c++) chs.push(buf.getChannelData(c).subarray(from, from + len));
    return measure(chs, fs);
  });
}
function mount() {
  var page = document.querySelector('#page-videoEngine'), card = page && page.querySelector('#cv127-quality');
  if (!card || card.querySelector('#cv127l-run')) return false;
  var row = document.createElement('div'); row.className = 'row'; row.style.cssText = 'margin-top:10px;align-items:center;flex-wrap:wrap;gap:8px';
  row.innerHTML = '<b class="tiny">Đo độ to (P127.3)</b><button type="button" class="btn btn-soft sm" id="cv127l-run">Đo LUFS clip đang chọn</button><span class="tiny" id="cv127l-out" role="status" aria-live="polite">Chọn clip có tiếng rồi bấm đo. Chỉ đọc, không đổi âm lượng.</span>';
  var list = card.querySelector('#cv127q-list'); card.insertBefore(row, list);
  row.querySelector('#cv127l-run').addEventListener('click', function () {
    var out = row.querySelector('#cv127l-out'), v = window.CV && CV.engines && CV.engines.video, s = v && v._state && v._state(), btn = this;
    if (!s) { out.textContent = 'Mở Video Engine trước.'; return; }
    var clip = (s.clips || []).filter(function (c) { return c.id === s.selected; })[0];
    if (!clip) { out.textContent = 'Chọn một clip audio hoặc video trên timeline trước.'; return; }
    btn.disabled = true; out.textContent = 'Đang đo…';
    measureClip(s, clip).then(function (m) { out.textContent = advice(m).text; out.style.color = advice(m).level === 'pass' ? '#07603f' : '#7a4b00'; }).catch(function (e) { out.textContent = String(e && e.message || e).slice(0, 140); }).then(function () { btn.disabled = false; });
  });
  return true;
}
function ready() { try { mount(); var p = document.querySelector('#page-videoEngine'); if (p && !p.__cv127lObs && window.MutationObserver) { p.__cv127lObs = new MutationObserver(function () { if (!p.querySelector('#cv127l-run')) mount(); }); p.__cv127lObs.observe(p, { childList: true, subtree: true }); } } catch (e) {} }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true }); else ready();
function sine(fs, sec, amp, f) { var a = new Float32Array(Math.round(fs * sec)); for (var i = 0; i < a.length; i++) a[i] = amp * Math.sin(2 * Math.PI * f * i / fs); return a; }
function tests() {
  var fs = 48000, full = measure([sine(fs, 5, 1, 997)], fs), q = measure([sine(fs, 5, 0.1, 997)], fs), st = measure([sine(fs, 5, 0.5, 997), sine(fs, 5, 0.5, 997)], fs), sil = measure([new Float32Array(fs * 3)], fs), short = measure([sine(fs, 0.2, 0.5, 997)], fs);
  var loud = sine(fs, 4, 0.5, 997), quiet = sine(fs, 4, 0.0005, 997), mix = new Float32Array(loud.length + quiet.length); mix.set(loud, 0); mix.set(quiet, loud.length);
  var g = measure([mix], fs), ref = measure([loud], fs), lowTone = measure([sine(fs, 5, 1, 20)], fs);
  return {
    fullScaleSineIsMinus3: Math.abs(full.lufs - (-3.01)) < 0.15,
    tenTimesQuieterIsMinus20dB: Math.abs((full.lufs - q.lufs) - 20) < 0.05,
    stereoAddsThreeDb: Math.abs(st.lufs - (measure([sine(fs, 5, 0.5, 997)], fs).lufs + 3.01)) < 0.1,
    silenceIsNull: sil.lufs === null && sil.peakDb === -Infinity,
    tooShortIsNull: short.lufs === null,
    relativeGateIgnoresQuietTail: Math.abs(g.lufs - ref.lufs) < 0.3,
    kWeightingCutsSubBass: lowTone.lufs < full.lufs - 10,
    peakReported: Math.abs(full.peakDb) < 0.01 && Math.abs(q.peakDb - (-20)) < 0.05,
    badInputSafe: measure(null, 48000).lufs === null && measure([new Float32Array(10)], 10).lufs === null && measure([new Float32Array(5), new Float32Array(3)], 48000).lufs === null,
    adviceSuggestsGain: advice({ lufs: -24, peakDb: -10 }).gainDb === 10 && advice({ lufs: -14.5, peakDb: -3 }).level === 'pass' && advice({ lufs: null }).level === 'warn'
  };
}
window.CVLoudnessP127 = { version: '127.3.0', measure: measure, measureClip: measureClip, advice: advice, mount: mount, tests: tests };
})();
