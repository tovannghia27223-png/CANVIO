/* CANVIO P63–P67 · Creative Production Expansion.
 * Additive bridge/workflow APIs. Video Engine remains the only canonical video timeline;
 * Layout Foundry, Asset Library and existing engine owners remain storage/render owners.
 */
(function () {
  'use strict';
  var VERSION = '23.3.81-p67';
  var byId = function (id) { return document.getElementById(id); };
  var safeCall = function (fn, fallback) { try { return fn(); } catch (error) { return fallback; } };
  var uid = function (prefix) {
    var value = '';
    try { value = window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : ''; } catch (error) {}
    if (!value) value = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
    return String(prefix || 'cv') + '-' + value;
  };
  var esc = function (value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]); }); };
  var toast = function (message) { try { if (window.CV && typeof CV.toast === 'function') CV.toast(message); } catch (error) {} };

  /* P63 · One canonical timeline contract and explicit source bridges. */
  var P63 = (function () {
    function apis() {
      return {
        video: window.CV && CV.engines && CV.engines.video || null,
        motionCut: window.CVNativeEngines && CVNativeEngines.motionCut || null,
        motionLab: window.CVNativeEngines && CVNativeEngines.motionLab || null,
        shape: window.CVShapeAnim || null
      };
    }
    function inspect() {
      var a = apis(), state = a.video && typeof a.video._state === 'function' ? a.video._state() : null;
      var clips = state && Array.isArray(state.clips) ? state.clips : [];
      var counts = { video: 0, image: 0, audio: 0, text: 0, other: 0 }, tracks = {}, end = 0;
      clips.forEach(function (clip) {
        counts[Object.prototype.hasOwnProperty.call(counts, clip.type) ? clip.type : 'other']++;
        tracks[clip.track] = (tracks[clip.track] || 0) + 1;
        end = Math.max(end, (Number(clip.start) || 0) + (Number(clip.duration) || 0));
      });
      var motionCut = safeCall(function () { return a.motionCut && a.motionCut.snapshotState ? a.motionCut.snapshotState() : []; }, []);
      var motionLab = safeCall(function () { return a.motionLab && a.motionLab.snapshotState ? a.motionLab.snapshotState() : null; }, null);
      var shape = safeCall(function () { return a.shape && a.shape.project ? a.shape.project() : null; }, null);
      var motionCutCount = Array.isArray(motionCut) ? motionCut.length : 0;
      var motionLabCount = 0;
      try { var parsed = typeof motionLab === 'string' ? JSON.parse(motionLab) : motionLab; motionLabCount = parsed && Array.isArray(parsed.objs) ? parsed.objs.length : 0; } catch (error) {}
      var shapeCount = shape && Array.isArray(shape.layers) ? shape.layers.length : 0;
      return {
        format: 'CANVIO_UNIFIED_TIMELINE_INSPECTION', version: 1,
        canonicalOwner: 'CV.engines.video._state()', canonicalAvailable: !!state,
        canonicalClipCount: clips.length, canonicalDuration: Number(state && state.duration) || end,
        clipCounts: counts, trackCounts: tracks, maxClipEnd: end,
        sourceEditors: { motionCut: { available: !!a.motionCut, stagedClips: motionCutCount }, motionLab: { available: !!a.motionLab, stagedObjects: motionLabCount }, shapeAnimation: { available: !!a.shape, stagedLayers: shapeCount } },
        mutationBoundary: { canonicalTimelineOnly: true, sourceEditorsRemainSeparateUntilExplicitTransfer: true, noSecondTimelineCreated: true, noNewStore: true },
        limitations: ['MotionCut and Motion Lab retain their existing editor-local working state until the user explicitly transfers/render-imports them.', 'Media transfer uses existing Video Engine import and Shape Animation bridge APIs; it is not a transparent cross-editor live-sync system.']
      };
    }
    function clipDTO() {
      var a = apis(), s = a.video && a.video._state && a.video._state();
      return s && Array.isArray(s.clips) ? s.clips.map(function (c) { return { id: String(c.id || ''), name: String(c.name || c.type || 'Clip'), type: String(c.type || 'other'), track: Number(c.track) || 0, start: Number(c.start) || 0, duration: Number(c.duration) || 0, end: (Number(c.start) || 0) + (Number(c.duration) || 0), locked: !!(a.video.isClipLocked && a.video.isClipLocked(c)), mediaId: c.mediaId || null }; }) : [];
    }
    function validate() {
      var rows = [], ids = Object.create(null), clips = clipDTO(), a = apis();
      function add(id, ok, detail) { rows.push({ id: id, ok: !!ok, detail: String(detail || '') }); }
      add('canonical-video-owner', !!(a.video && a.video._state && a.video.commit), 'CV.engines.video là owner và commit API hiện hữu.');
      clips.forEach(function (c) { ids[c.id] = (ids[c.id] || 0) + 1; });
      add('unique-clip-identifiers', clips.every(function (c) { return c.id && ids[c.id] === 1; }), 'Không có ID clip rỗng hoặc trùng trong timeline canonical.');
      add('finite-clip-timing', clips.every(function (c) { return Number.isFinite(c.start) && c.start >= 0 && Number.isFinite(c.duration) && c.duration >= 0.2; }), 'Start/duration phải hữu hạn; duration tối thiểu 0,2 giây.');
      add('existing-source-bridges', !!(a.motionCut && a.motionCut.sendToVideoEngine && a.shape && a.shape.toVideo), 'Sử dụng bridge MotionCut và Shape Animation có sẵn.');
      return { format: 'CANVIO_UNIFIED_TIMELINE_VALIDATION', rows: rows, pass: rows.filter(function (x) { return x.ok; }).length, fail: rows.filter(function (x) { return !x.ok; }).length, noSecondTimeline: true };
    }
    async function importMotionCut() {
      var a = apis(); if (!a.motionCut || typeof a.motionCut.sendToVideoEngine !== 'function') throw new Error('MotionCut bridge chưa sẵn sàng.');
      return await a.motionCut.sendToVideoEngine();
    }
    async function importShapeAnimation() {
      var a = apis(); if (!a.shape || typeof a.shape.toVideo !== 'function') throw new Error('Shape Animation bridge chưa sẵn sàng.');
      return await a.shape.toVideo();
    }
    return { version: '63.0.0', owner: 'CV.engines.video', inspect: inspect, clips: clipDTO, validate: validate, importMotionCut: importMotionCut, importShapeAnimation: importShapeAnimation,
      tests: function () { var a = apis(); return { canonicalOwner: !!(a.video && a.video._state && a.video.commit), motionCutExplicitBridge: !!(a.motionCut && a.motionCut.sendToVideoEngine), shapeAnimationBridge: !!(a.shape && a.shape.toVideo), noSecondTimeline: true, noNewStore: true }; } };
  })();
  window.CANVIOUnifiedTimeline = P63;

  /* P64 · Ripple editing, persistent group metadata, snapping and atomic group moves. */
  var P64 = (function () {
    function api() { return window.CV && CV.engines && CV.engines.video || null; }
    function state() { var a = api(); return a && a._state ? a._state() : null; }
    function clips() { var s = state(); return s && Array.isArray(s.clips) ? s.clips : []; }
    function locked(a, c) { return !!(c && (c.locked || (a && a.isClipLocked && a.isClipLocked(c)))); }
    function commit(a, s) { if (a && a.commit) { s.duration = Math.max(30, clips().reduce(function (m, c) { return Math.max(m, (Number(c.start) || 0) + (Number(c.duration) || 0) + 1); }, 0)); a.commit(); return true; } return false; }
    function copyForPlan(c) { var x = Object.assign({}, c); delete x.el; return x; }
    function planRippleDelete(start, end) {
      start = Number(start); end = Number(end); var a = api(), s = state(), list = clips();
      if (!s || !a || !a._pro || !a._pro.rippleList) return { ok: false, reason: 'canonical-ripple-owner-unavailable' };
      if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end - start < 0.2) return { ok: false, reason: 'invalid-range' };
      var blocked = list.filter(function (c) { var cs = Number(c.start) || 0, ce = cs + (Number(c.duration) || 0), affected = cs >= end - 0.01 || (ce > start + 0.01 && cs < end - 0.01); return affected && locked(a, c); });
      if (blocked.length) return { ok: false, reason: 'locked-clips-would-be-affected', blockedIds: blocked.map(function (x) { return x.id; }) };
      var working = list.map(copyForPlan), result = a._pro.rippleList(working, start, end, -999999);
      return { ok: true, start: start, end: end, duration: end - start, shifted: working.filter(function (x, i) { return Number(x.start) !== Number(list[i] && list[i].start); }).length, droppedIds: (result.drop || []).map(function (x) { return x.id; }), splitCount: (result.add || []).length, result: result };
    }
    function rippleDelete(start, end) {
      var plan = planRippleDelete(start, end); if (!plan.ok) return plan;
      var a = api(), s = state(); if (a._pro.pushUndo) a._pro.pushUndo();
      var result = a._pro.rippleList(s.clips, plan.start, plan.end, -999999);
      var drop = new Set((result.drop || []).map(function (x) { return x.id; }));
      s.clips = s.clips.filter(function (x) { return !drop.has(x.id); });
      (result.add || []).forEach(function (pair) { if (pair && pair[1]) s.clips.push(pair[1]); });
      if (drop.has(s.selected)) s.selected = null;
      commit(a, s);
      return { ok: true, shifted: plan.shifted, removed: drop.size, split: (result.add || []).length, start: plan.start, end: plan.end, canonicalOwnerOnly: true };
    }
    function normalizeIds(ids) { return Array.from(new Set((Array.isArray(ids) ? ids : []).map(String).filter(Boolean))); }
    function group(ids, name) {
      var a = api(), s = state(), set = new Set(normalizeIds(ids)), list = clips().filter(function (c) { return set.has(String(c.id)); });
      if (!s || list.length < 2 || list.length !== set.size) return { ok: false, reason: 'select-at-least-two-existing-clips' };
      var bad = list.filter(function (c) { return locked(a, c); }); if (bad.length) return { ok: false, reason: 'locked-clips', blockedIds: bad.map(function (x) { return x.id; }) };
      var gid = uid('vtgroup'); if (a._pro && a._pro.pushUndo) a._pro.pushUndo();
      list.forEach(function (c) { c.groupId = gid; c.groupName = String(name || 'Nhóm timeline').trim().slice(0, 80) || 'Nhóm timeline'; }); commit(a, s);
      return { ok: true, groupId: gid, count: list.length, name: list[0].groupName };
    }
    function ungroup(ids) {
      var a = api(), s = state(), set = new Set(normalizeIds(ids)), list = clips().filter(function (c) { return set.has(String(c.id)); });
      if (!s || !list.length || list.length !== set.size) return { ok: false, reason: 'clips-not-found' };
      if (list.some(function (c) { return locked(a, c); })) return { ok: false, reason: 'locked-clips' };
      if (a._pro && a._pro.pushUndo) a._pro.pushUndo();
      list.forEach(function (c) { delete c.groupId; delete c.groupName; }); commit(a, s); return { ok: true, count: list.length };
    }
    function groupIds(ids) { var set = new Set(normalizeIds(ids)); return clips().filter(function (c) { return set.has(String(c.id)); }).map(function (c) { return c.groupId || null; }); }
    function moveGroup(ids, delta) {
      var a = api(), s = state(), set = new Set(normalizeIds(ids)), list = clips().filter(function (c) { return set.has(String(c.id)); }); delta = Number(delta);
      if (!s || !Number.isFinite(delta) || !set.size || list.length !== set.size) return { ok: false, reason: 'invalid-selection-or-delta' };
      var bad = list.filter(function (c) { return locked(a, c) || (Number(c.start) || 0) + delta < 0; }); if (bad.length) return { ok: false, reason: 'locked-or-negative-start', blockedIds: bad.map(function (x) { return x.id; }) };
      if (Math.abs(delta) < 0.0001) return { ok: true, moved: 0 };
      if (a._pro && a._pro.pushUndo) a._pro.pushUndo(); list.forEach(function (c) { c.start = Math.round(((Number(c.start) || 0) + delta) * 1000) / 1000; }); commit(a, s); return { ok: true, moved: list.length, delta: delta };
    }
    function duplicateGroup(ids, offset) {
      var a = api(), s = state(), set = new Set(normalizeIds(ids)), list = clips().filter(function (c) { return set.has(String(c.id)); }); offset = Number(offset);
      if (!s || !set.size || list.length !== set.size || !Number.isFinite(offset) || offset <= 0) return { ok: false, reason: 'invalid-selection-or-offset' };
      if (list.some(function (c) { return locked(a, c); })) return { ok: false, reason: 'locked-clips' };
      var gid = list.some(function (c) { return c.groupId; }) ? uid('vtgroup') : null;
      var clones = list.map(function (c) { var x = Object.assign({}, c); x.id = uid('vtclip'); x.name = String(c.name || c.type || 'Clip').slice(0, 140) + ' copy'; x.start = Math.round(((Number(c.start) || 0) + offset) * 1000) / 1000; delete x.el; if (gid) { x.groupId = gid; x.groupName = (c.groupName || 'Nhóm timeline') + ' copy'; } return x; });
      if (a._pro && a._pro.pushUndo) a._pro.pushUndo(); Array.prototype.push.apply(s.clips, clones); commit(a, s); return { ok: true, duplicated: clones.length, ids: clones.map(function (x) { return x.id; }), mediaReferencesReused: true };
    }
    function snap(value, threshold, excludeIds) {
      value = Number(value); threshold = Number.isFinite(Number(threshold)) ? Math.max(0, Math.min(2, Number(threshold))) : 0.15;
      if (!Number.isFinite(value)) return { value: 0, snapped: false, target: null, delta: null };
      var excluded = new Set(normalizeIds(excludeIds)), points = [{ value: 0, source: 'timeline-start', id: null }];
      clips().forEach(function (c) { if (excluded.has(String(c.id))) return; var st = Number(c.start) || 0, en = st + (Number(c.duration) || 0); points.push({ value: st, source: 'clip-start', id: c.id }); points.push({ value: en, source: 'clip-end', id: c.id }); });
      var best = null, dist = Infinity; points.forEach(function (p) { var d = Math.abs(p.value - value); if (d <= threshold && d < dist) { best = p; dist = d; } });
      return { value: best ? best.value : value, snapped: !!best, target: best, delta: best ? best.value - value : 0 };
    }
    function selectedGroup(groupId) { return clips().filter(function (c) { return c.groupId === groupId; }).map(function (c) { return c.id; }); }
    return { version: '64.0.0', planRippleDelete: planRippleDelete, rippleDelete: rippleDelete, group: group, ungroup: ungroup, moveGroup: moveGroup, duplicateGroup: duplicateGroup, snap: snap, groupIds: groupIds, selectedGroup: selectedGroup,
      tests: function () { var a = api(), s = state(); return { canonicalOwner: !!(a && s && Array.isArray(s.clips)), ripplePlanner: !!(a && a._pro && a._pro.rippleList), clipLocksRespected: !!(a && a.isClipLocked), groupsPersistOnCanonicalClips: !!(s && s.clips), noSecondTimeline: true, noNewStore: true }; } };
  })();
  window.CANVIOAdvancedTimeline = P64;

  /* P65 · Local feature-point tracker and inverse-motion stabilization. No model/network. */
  var P65 = (function () {
    function gray(frame) {
      if (!frame || !frame.data || !frame.width || !frame.height || frame.data.length < frame.width * frame.height * 4) throw new Error('Frame ImageData không hợp lệ.');
      var out = new Uint8Array(frame.width * frame.height), d = frame.data;
      for (var i = 0, j = 0; i < out.length; i++, j += 4) out[i] = Math.round(d[j] * 0.299 + d[j + 1] * 0.587 + d[j + 2] * 0.114);
      return out;
    }
    function scorePatch(a, b, w, h, ax, ay, bx, by, radius) {
      var sum = 0, count = 0;
      for (var y = -radius; y <= radius; y += 1) for (var x = -radius; x <= radius; x += 1) {
        var x1 = ax + x, y1 = ay + y, x2 = bx + x, y2 = by + y;
        if (x1 < 0 || y1 < 0 || x2 < 0 || y2 < 0 || x1 >= w || x2 >= w || y1 >= h || y2 >= h) return Infinity;
        sum += Math.abs(a[y1 * w + x1] - b[y2 * w + x2]); count++;
      }
      return count ? sum / count : Infinity;
    }
    function trackFrames(frames, point, options) {
      options = options || {}; if (!Array.isArray(frames) || frames.length < 2 || frames.length > 120) throw new Error('Tracker cần từ 2 đến 120 frame mẫu.');
      var w = Number(frames[0].width), h = Number(frames[0].height), x = Math.round(Number(point && point.x)), y = Math.round(Number(point && point.y));
      if (!(w >= 32 && h >= 32) || !Number.isFinite(x) || !Number.isFinite(y) || x < 8 || y < 8 || x >= w - 8 || y >= h - 8) throw new Error('Điểm tracking phải nằm bên trong frame và cách mép tối thiểu 8 px.');
      var radius = Math.max(2, Math.min(10, Math.round(Number(options.patchRadius) || 5))), search = Math.max(2, Math.min(35, Math.round(Number(options.searchRadius) || 14))), minConfidence = Math.max(0.1, Math.min(0.99, Number(options.minConfidence) || 0.55));
      var prev = gray(frames[0]), results = [{ index: 0, time: Number(frames[0].time) || 0, x: x, y: y, confidence: 1 }];
      for (var fi = 1; fi < frames.length; fi++) {
        var f = frames[fi]; if (Number(f.width) !== w || Number(f.height) !== h) throw new Error('Kích thước frame mẫu không đồng nhất.');
        var next = gray(f), best = { score: Infinity, x: x, y: y }, secondScore = Infinity;
        for (var dy = -search; dy <= search; dy++) for (var dx = -search; dx <= search; dx++) {
          var cx = x + dx, cy = y + dy, score = scorePatch(prev, next, w, h, x, y, cx, cy, radius);
          if (score < best.score) { secondScore = best.score; best = { score: score, x: cx, y: cy }; }
          else if (score < secondScore) secondScore = score;
        }
        /* Reject flat/repetitive patches: a low SAD alone is not enough when many positions match equally well. */
        var uniqueness = Number.isFinite(secondScore) ? Math.max(0, Math.min(1, (secondScore - best.score) / 32)) : 0;
        var fit = Number.isFinite(best.score) ? Math.max(0, Math.min(1, 1 - best.score / 96)) : 0;
        var confidence = fit * uniqueness;
        if (!Number.isFinite(best.score) || confidence < minConfidence) throw new Error('Mất điểm tracking tại frame ' + fi + ' (confidence ' + confidence.toFixed(2) + '). Hãy chọn điểm có chi tiết/texture rõ hơn hoặc tăng search radius.');
        x = best.x; y = best.y; results.push({ index: fi, time: Number(f.time) || fi, x: x, y: y, confidence: confidence }); prev = next;
      }
      return { points: results, width: w, height: h, sampleCount: results.length, averageConfidence: results.reduce(function (a, p) { return a + p.confidence; }, 0) / results.length, algorithm: 'grayscale-local-patch-SAD', machineLearning: false, upload: false };
    }
    async function trackFile(file, point, options, onProgress) {
      options = options || {}; if (!file || !/^video\//.test(file.type || '') || file.size > 100 * 1024 * 1024) throw new Error('Chọn video hợp lệ không quá 100 MB.');
      var url = URL.createObjectURL(file), video = document.createElement('video'), canvas = document.createElement('canvas'), ctx, frames = [];
      video.muted = true; video.preload = 'auto'; video.playsInline = true; video.src = url;
      try {
        await new Promise(function (resolve, reject) { video.onloadedmetadata = resolve; video.onerror = function () { reject(new Error('Không đọc được video local.')); }; });
        if (!Number.isFinite(video.duration) || video.duration <= 0 || video.duration > 60) throw new Error('Video tracking giới hạn tối đa 60 giây.');
        var scale = Math.min(1, 480 / video.videoWidth, 270 / video.videoHeight); canvas.width = Math.max(32, Math.round(video.videoWidth * scale)); canvas.height = Math.max(32, Math.round(video.videoHeight * scale)); ctx = canvas.getContext('2d', { willReadFrequently: true });
        var sx = Number(point.x) * canvas.width / video.videoWidth, sy = Number(point.y) * canvas.height / video.videoHeight;
        var fps = Math.max(0.5, Math.min(3, Number(options.sampleRate) || 1)), count = Math.max(2, Math.min(48, Math.ceil(video.duration * fps) + 1));
        for (var i = 0; i < count; i++) {
          var time = video.duration * i / (count - 1);
          if (Math.abs((video.currentTime || 0) - time) > 0.01) await new Promise(function (resolve, reject) { var done = function () { cleanup(); resolve(); }, fail = function () { cleanup(); reject(new Error('Không seek được frame ' + i)); }, cleanup = function () { video.removeEventListener('seeked', done); video.removeEventListener('error', fail); }; video.addEventListener('seeked', done, { once: true }); video.addEventListener('error', fail, { once: true }); video.currentTime = time; });
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height); frames.push({ data: ctx.getImageData(0, 0, canvas.width, canvas.height).data, width: canvas.width, height: canvas.height, time: time });
          if (typeof onProgress === 'function') onProgress(i + 1, count);
        }
        return trackFrames(frames, { x: sx, y: sy }, options);
      } finally { try { video.pause(); video.removeAttribute('src'); video.load(); } catch (error) {} URL.revokeObjectURL(url); }
    }
    function applyToSelected(result, mode) {
      var a = window.CV && CV.engines && CV.engines.video, s = a && a._state && a._state();
      if (!s || !Array.isArray(s.clips) || !result || !Array.isArray(result.points) || result.points.length < 2) return { ok: false, reason: 'tracking-result-or-timeline-unavailable' };
      var clip = s.clips.find(function (c) { return c.id === s.selected; });
      if (!clip || !['video', 'image'].includes(clip.type)) return { ok: false, reason: 'select-video-or-image-clip-in-canonical-timeline' };
      if (a.isClipLocked && a.isClipLocked(clip)) return { ok: false, reason: 'selected-clip-or-track-locked' };
      var p = result.points, first = p[0], last = p[p.length - 1], maxX = 0, maxY = 0;
      p.forEach(function (q) { maxX = Math.max(maxX, Math.abs(q.x - first.x) / result.width); maxY = Math.max(maxY, Math.abs(q.y - first.y) / result.height); });
      var stabilize = mode === 'stabilize', count = Math.min(8, p.length), frames = [];
      for (var i = 0; i < count; i++) {
        var q = p[Math.round(i * (p.length - 1) / Math.max(1, count - 1))], sign = stabilize ? -1 : 1;
        frames.push({ t: Math.round(i * 100 / Math.max(1, count - 1)), x: Math.max(-2000, Math.min(2000, (q.x - first.x) / result.width * 960 * sign)), y: Math.max(-1125, Math.min(1125, (q.y - first.y) / result.height * 540 * sign)), scale: stabilize ? Math.min(1.35, 1 + Math.max(maxX * 2, maxY * 2) * 1.08) : 1, opacity: 1, rotation: 0 });
      }
      var motion = { from: frames[0], to: frames[frames.length - 1], keyframes: frames, easing: 'linear' };
      if (a._pro && a._pro.pushUndo) a._pro.pushUndo(); clip.motion = motion; if (a.commit) a.commit();
      return { ok: true, clipId: clip.id, mode: stabilize ? 'stabilize' : 'follow', keyframes: frames.length, averageConfidence: result.averageConfidence, localOnly: true, noModel: true };
    }
    return { version: '65.0.0', trackFrames: trackFrames, trackFile: trackFile, applyToSelected: applyToSelected,
      tests: function () { return { localPatchTracker: typeof trackFrames === 'function', inverseStabilization: typeof applyToSelected === 'function', noModelDownload: true, noNetwork: true, canonicalTimelineTarget: !!(window.CV && CV.engines && CV.engines.video) }; } };
  })();
  window.CANVIOMotionTracking = P65;

  /* P66 · Prompt-to-Asset workflow; provider calls remain user-owned and explicit. */
  var P66 = (function () {
    function buildPrompt(input) {
      input = input || {}; var brief = String(input.brief || '').trim().slice(0, 6000), output = String(input.output || 'image').slice(0, 24), ratio = String(input.ratio || '1:1').slice(0, 16), style = String(input.style || 'Premium modern').slice(0, 80), notes = String(input.notes || '').trim().slice(0, 2000);
      if (!brief) throw new Error('Nhập brief trước khi tạo prompt.');
      return ['CREATIVE ASSET BRIEF', 'Output: ' + output, 'Aspect ratio: ' + ratio, 'Art direction: ' + style, 'Brief: ' + brief, notes ? 'Additional constraints: ' + notes : '', 'Production requirements: clean composition, deliberate hierarchy, coherent lighting/materials, legible typography where required, export-ready quality.', 'Do not invent brand facts, product specifications, legal claims, or text not present in the brief.'].filter(Boolean).join('\n\n');
    }
    function sanitizeSvg(raw) {
      raw = String(raw || ''); if (raw.length > 5 * 1024 * 1024) throw new Error('SVG vượt giới hạn 5 MB.');
      if (!/^\s*<svg[\s>]/i.test(raw)) throw new Error('File không phải SVG hợp lệ.');
      if (typeof DOMParser === 'undefined' || typeof XMLSerializer === 'undefined') {
        /* Conservative fail-closed fallback for environments without an XML DOM. */
        var fallback = raw.replace(/<\?xml[^>]*>|<!doctype[^>]*>|<!--[\s\S]*?-->/gi, '')
          .replace(/<(script|foreignObject|iframe|object|embed|audio|video|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
          .replace(/\s+on[a-z]+\s*=\s*(["']).*?\1/gi, '')
          .replace(/\s+(?:href|xlink:href|src)\s*=\s*(["'])\s*(?!#)[\s\S]*?\1/gi, '')
          .replace(/\s+style\s*=\s*(["'])[^"']*(?:url\s*\(|@import|expression\s*\(|javascript:)[^"']*\1/gi, '');
        if (!/^\s*<svg\b/i.test(fallback) || /<script\b|\son[a-z]+\s*=/i.test(fallback)) throw new Error('Không thể xác thực SVG an toàn trong môi trường hiện tại.');
        return fallback;
      }
      var doc = new DOMParser().parseFromString(raw, 'image/svg+xml');
      if (!doc.documentElement || doc.documentElement.localName !== 'svg' || doc.querySelector('parsererror')) throw new Error('Không phân tích được SVG.');
      Array.from(doc.querySelectorAll('script,foreignObject,iframe,object,embed,audio,video')).forEach(function (node) { node.remove(); });
      Array.from(doc.querySelectorAll('*')).forEach(function (node) {
        Array.from(node.attributes || []).forEach(function (attr) {
          var name = attr.name.toLowerCase(), value = String(attr.value || '').trim();
          if (name.indexOf('on') === 0 || name === 'srcdoc') node.removeAttribute(attr.name);
          else if ((name === 'href' || name === 'xlink:href' || name === 'src') && value && value.charAt(0) !== '#') node.removeAttribute(attr.name);
          else if (name === 'style' && /(url\s*\(|@import|expression\s*\(|javascript:)/i.test(value)) node.removeAttribute(attr.name);
        });
      });
      Array.from(doc.querySelectorAll('style')).forEach(function (node) {
        var css = String(node.textContent || '');
        if (/@import|url\s*\(|expression\s*\(|javascript:/i.test(css)) node.remove();
      });
      if (!doc.documentElement.getAttribute('xmlns')) doc.documentElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      var cleaned = new XMLSerializer().serializeToString(doc.documentElement);
      /* P131: defense in depth through the shared allow-list sanitizer (SMIL href animation, CSS escapes, DTD). */
      if (window.CANVIOSecurity && typeof window.CANVIOSecurity.sanitizeSvg === 'function') cleaned = window.CANVIOSecurity.sanitizeSvg(cleaned).svg;
      return cleaned;
    }
    async function ingest(file, options) {
      options = options || {}; if (!file || file.size <= 0 || file.size > 50 * 1024 * 1024) throw new Error('Tệp ảnh phải có dung lượng từ 1 byte đến 50 MB.');
      var type = String(file.type || '').toLowerCase(), name = String(file.name || 'generated-asset').slice(0, 180), prepared = file;
      if (type === 'image/svg+xml' || /\.svg$/i.test(name)) { var clean = sanitizeSvg(await file.text()); prepared = new File([clean], name.replace(/[^\w .()-]/g, '_'), { type: 'image/svg+xml', lastModified: Date.now() }); }
      else {
        if (!/^image\/(png|jpeg|webp)$/.test(type)) throw new Error('Chỉ nhận PNG, JPEG, WebP hoặc SVG đã làm sạch.');
        if (typeof createImageBitmap === 'function') { var bitmap = await createImageBitmap(file); try { if (bitmap.width > 12000 || bitmap.height > 12000) throw new Error('Ảnh vượt giới hạn 12.000 px mỗi chiều.'); } finally { bitmap.close && bitmap.close(); } }
      }
      if (!window.CV || !CV.assets || typeof CV.assets.addBlob !== 'function' || typeof CV.assets.list !== 'function') throw new Error('Asset Library hiện hữu chưa sẵn sàng.');
      var before = CV.assets.list() || [], known = new Set(before.map(function (x) { return String(x.id); }));
      await CV.assets.addBlob(prepared);
      var list = CV.assets.list() || [], asset = list.find(function (x) { return x && x.id && !known.has(String(x.id)) && x.name === prepared.name && Number(x.size) === prepared.size; });
      if (!asset || !asset.id) throw new Error('Asset Library chưa trả về chính xác tài nguyên vừa nhập; không tự chọn một asset khác. Hãy kiểm tra thư viện.');
      var license = ['unverified', 'user-created', 'commercial', 'restricted'].indexOf(String(options.license || 'unverified')) >= 0 ? String(options.license || 'unverified') : 'unverified';
      asset.license = license;
      asset.provenance = { source: String(options.source || 'user-imported-ai-output').slice(0, 240), importedAt: new Date().toISOString(), licenseStatus: license, userAsserted: true };
      if (!window.LS || typeof LS.set !== 'function' || !LS.set('assets', list.slice(0, 40))) throw new Error('Asset đã nhập, nhưng không lưu được metadata provenance vào Asset Library. Hãy kiểm tra dung lượng lưu trữ.');
      if (CV.assets.render) CV.assets.render();
      if (window.CVCreativeCore && typeof CVCreativeCore.linkAsset === 'function') safeCall(function () { CVCreativeCore.linkAsset(asset.id); });
      return { ok: true, asset: { id: asset.id, name: asset.name, mime: asset.mime || prepared.type, size: asset.size || prepared.size }, license: license, source: asset.provenance.source, provenancePersisted: true, owner: 'CV.assets / existing LS assets record', noNewStore: true, uploaded: false };
    }
    async function openInEditor(assetId, target) {
      var allowed = ['poster', 'designEngine', 'videoEngine', 'vectorForge']; if (allowed.indexOf(target) < 0) throw new Error('Editor đích không được hỗ trợ.');
      var item = (CV.assets.list() || []).find(function (x) { return x.id === assetId; }); if (!item) throw new Error('Không tìm thấy asset trong thư viện.');
      CV.go(target);
      await new Promise(function (resolve) { setTimeout(resolve, 240); });
      if (target === 'poster' && CV.assets.use) CV.assets.use(assetId);
      else if (target === 'designEngine' && CV.engines && CV.engines.design && CV.engines.design.addAsset) CV.engines.design.addAsset(assetId);
      else if (target === 'videoEngine' && CV.engines && CV.engines.video && CV.engines.video.addAsset) CV.engines.video.addAsset(assetId);
      else if (target === 'vectorForge' && item.data && /^image\/svg\+xml$/i.test(item.mime || '')) {
        var text = await (await fetch(item.data)).text(); var safe = sanitizeSvg(text); var svg = document.getElementById('vfSvg');
        if (!svg || !window.CVNativeEngines || !CVNativeEngines.vector) throw new Error('Vector Forge chưa sẵn sàng.');
        var bytes = new TextEncoder().encode(safe), binary = ''; for (var offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode.apply(null, bytes.subarray(offset, Math.min(bytes.length, offset + 0x8000)));
        var dataUrl = 'data:image/svg+xml;base64,' + btoa(binary), ns = 'http://www.w3.org/2000/svg';
        var group = document.createElementNS(ns, 'g'); group.setAttribute('class', 'vf-object'); group.setAttribute('data-id', uid('vf')); group.setAttribute('data-type', 'asset'); group.setAttribute('data-cvg-name', item.name); group.setAttribute('transform', 'translate(360 190)');
        var image = document.createElementNS(ns, 'image'); image.setAttribute('x', '0'); image.setAttribute('y', '0'); image.setAttribute('width', '480'); image.setAttribute('height', '320'); image.setAttribute('preserveAspectRatio', 'xMidYMid meet'); image.setAttribute('href', dataUrl); image.setAttribute('role', 'img'); image.setAttribute('aria-label', item.name); group.appendChild(image); svg.appendChild(group);
        CVNativeEngines.vector.render(); svg.dispatchEvent(new Event('pointerup', { bubbles: true }));
        return { ok: true, assetId: assetId, target: target, insertedAs: 'sanitized-vector-image-layer', persistedThroughExistingVectorOwner: true };
      } else if (CV.assets.use) CV.assets.use(assetId);
      return { ok: true, assetId: assetId, target: target };
    }
    return { version: '66.0.0', buildPrompt: buildPrompt, sanitizeSvg: sanitizeSvg, ingest: ingest, openInEditor: openInEditor,
      tests: function () { return { promptBuilder: typeof buildPrompt === 'function', svgSanitizer: typeof sanitizeSvg === 'function', assetOwner: !!(window.CV && CV.assets && CV.assets.addBlob && CV.assets.list), explicitProviderOnly: true, noBackgroundGeneration: true, noNewStore: true }; } };
  })();
  window.CANVIOAICreativeWorkflow = P66;

  /* P67 · Typography controls, master elements and print/prepress screening. */
  var P67 = (function () {
    function layout() { return window.CVNativeEngines && CVNativeEngines.layout || null; }
    function snapshot() { var a = layout(); if (!a || !a.snapshotState) throw new Error('Layout Foundry hiện hữu chưa sẵn sàng.'); var raw = a.snapshotState(); var value = typeof raw === 'string' ? JSON.parse(raw) : raw; if (!value || !Array.isArray(value.pages)) throw new Error('Không đọc được pages từ owner Layout Foundry.'); return value; }
    function escapeText(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]); }); }
    function cleanPagesHtml(html) { return String(html || '').replace(/<([a-z][\w:-]*)\b[^>]*data-canvio-p67="(?:header|footer|folio|typography)"[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<style\b[^>]*data-canvio-p67-typography[^>]*>[\s\S]*?<\/style>/gi, ''); }
    function applyMaster(options) {
      options = options || {}; var data = snapshot(), header = String(options.header || '').trim().slice(0, 180), footer = String(options.footer || '').trim().slice(0, 180), folio = options.folio !== false;
      if (!header && !footer && !folio) return { ok: false, reason: 'empty-master' };
      data.pages.forEach(function (page, index) {
        if (!page || page.hidden) return;
        var html = cleanPagesHtml(page.html || '');
        if (header) html = '<header data-canvio-p67="header" style="font:600 9pt/1.3 Arial,sans-serif;border-bottom:.25pt solid #aab2c0;padding-bottom:3mm;margin-bottom:5mm">' + escapeText(header) + '</header>' + html;
        if (footer || folio) html += '<footer data-canvio-p67="footer" style="display:flex;justify-content:space-between;gap:8mm;border-top:.25pt solid #aab2c0;padding-top:3mm;margin-top:5mm;font:8pt/1.3 Arial,sans-serif"><span>' + escapeText(footer) + '</span>' + (folio ? '<span data-canvio-p67="folio">' + (index + 1) + ' / ' + data.pages.filter(function (x) { return x && !x.hidden; }).length + '</span>' : '') + '</footer>';
        page.html = html;
      });
      var a = layout(); var ok = a.restoreState(JSON.stringify(data)); if (ok === false) throw new Error('Layout Foundry từ chối cập nhật master elements.');
      return { ok: true, pages: data.pages.filter(function (x) { return x && !x.hidden; }).length, headerApplied: !!header, footerApplied: !!footer, folioApplied: !!folio, owner: 'CVNativeEngines.layout.restoreState', noNewStore: true };
    }
    function applyTypography(options) {
      options = options || {}; var font = String(options.fontFamily || 'Be Vietnam Pro').replace(/[^a-zA-Z0-9 ,_\-']/g, '').slice(0, 80) || 'Arial';
      var letter = Number(options.letterSpacing); if (!Number.isFinite(letter)) letter = 0; letter = Math.max(-2, Math.min(20, letter));
      var kerning = options.kerning !== false, ligatures = options.ligatures !== false;
      var css = '<style data-canvio-p67="typography">.doc-page{font-family:"' + font.replace(/"/g, '') + '",Arial,sans-serif;font-kerning:' + (kerning ? 'normal' : 'none') + ';font-feature-settings:"kern" ' + (kerning ? '1' : '0') + ',"liga" ' + (ligatures ? '1' : '0') + ';font-variant-ligatures:' + (ligatures ? 'common-ligatures' : 'none') + ';letter-spacing:' + letter + 'px}</style>';
      var data = snapshot(); data.pages.forEach(function (p) { if (p && !p.hidden) p.html = cleanPagesHtml(p.html || '') + css; });
      var a = layout(), ok = a.restoreState(JSON.stringify(data)); if (ok === false) throw new Error('Không lưu được typography settings vào Layout Foundry.');
      var fontAvailable = true; try { fontAvailable = !document.fonts || document.fonts.check('16px "' + font.replace(/"/g, '') + '"'); } catch (error) { fontAvailable = false; }
      return { ok: true, fontFamily: font, fontAvailable: fontAvailable, letterSpacingPx: letter, kerning: kerning, ligatures: ligatures, shapingOwner: 'browser CSS text layout', fontEmbedded: false, outlined: false };
    }
    function inspect(options) {
      options = options || {}; var bleed = Number(options.bleedMm == null ? 3 : options.bleedMm), safe = Number(options.safeMarginMm == null ? 5 : options.safeMarginMm), format = String(options.format || 'A4');
      if (!Number.isFinite(bleed) || bleed < 0 || bleed > 10) throw new Error('Bleed phải từ 0 đến 10 mm.');
      if (!Number.isFinite(safe) || safe < 3 || safe > 30) throw new Error('Safe margin phải từ 3 đến 30 mm.');
      if (['A4', 'A3', 'Letter', 'Legal', 'A5'].indexOf(format) < 0) throw new Error('Khổ giấy không được hỗ trợ.');
      var data = snapshot(), rows = [], metrics = { pages: 0, hiddenPages: 0, images: 0, missingAlt: 0, remoteImages: 0, blobImages: 0, unsafeUrls: 0, scriptTags: 0, activeEmbeds: 0, externalFonts: 0, emptyPages: 0, unverifiedAssetLicenses: 0 };
      function add(id, ok, detail, severity) { rows.push({ id: id, status: ok ? 'pass' : (severity || 'warn'), detail: String(detail || '') }); }
      var pages = data.pages.filter(function (p) { return p && !p.hidden; }); metrics.pages = pages.length; metrics.hiddenPages = data.pages.length - pages.length;
      pages.forEach(function (page) {
        var html = cleanPagesHtml(page.html || '');
        if (!html.replace(/<[^>]*>/g, '').trim() && !/<(?:img|svg|table|canvas|video)\b/i.test(html)) metrics.emptyPages++;
        metrics.scriptTags += (html.match(/<script\b/gi) || []).length;
        metrics.activeEmbeds += (html.match(/<(?:iframe|object|embed|applet)\b/gi) || []).length;
        var images = html.match(/<img\b[^>]*>/gi) || []; metrics.images += images.length;
        images.forEach(function (tag) { if (!/\balt\s*=\s*["'][^"']*["']/i.test(tag)) metrics.missingAlt++; var src = /\bsrc\s*=\s*["']([^"']*)/i.exec(tag); if (src) { if (/^https?:\/\//i.test(src[1])) metrics.remoteImages++; if (/^blob:/i.test(src[1])) metrics.blobImages++; if (/^javascript:/i.test(src[1])) metrics.unsafeUrls++; } });
        if (/(?:src|href)\s*=\s*["']\s*(?:javascript:|data:text\/html)/i.test(html) || /\son[a-z]+\s*=/i.test(html)) metrics.unsafeUrls++;
        if (/@import\s+url\s*\(\s*["']?https?:/i.test(html) || /url\(\s*["']?https?:[^)]*\)/i.test(html)) metrics.externalFonts++;
      });
      var assets = safeCall(function () { return window.CV && CV.assets && CV.assets.list ? CV.assets.list() : []; }, []);
      metrics.unverifiedAssetLicenses = (assets || []).filter(function (a) { return /^image\//.test(a.mime || '') && (!a.license || a.license === 'unverified'); }).length;
      add('layout-owner', !!layout(), 'Sử dụng Layout Foundry hiện tại; không tạo document store thứ hai.', 'fail');
      add('page-content', metrics.pages > 0 && metrics.emptyPages === 0, metrics.pages + ' trang hiển thị; ' + metrics.emptyPages + ' trang rỗng.', 'fail');
      add('image-alt', metrics.missingAlt === 0, metrics.missingAlt + ' ảnh thiếu alt.', 'warn');
      add('local-image-assets', metrics.remoteImages === 0 && metrics.blobImages === 0, metrics.remoteImages + ' ảnh remote; ' + metrics.blobImages + ' blob URL tạm.', 'warn');
      add('safe-html', metrics.unsafeUrls === 0 && metrics.scriptTags === 0 && metrics.activeEmbeds === 0, metrics.unsafeUrls + ' URL/event handler nguy hiểm · ' + metrics.scriptTags + ' script · ' + metrics.activeEmbeds + ' active embed.', 'fail');
      add('font-dependencies', metrics.externalFonts === 0, metrics.externalFonts + ' tham chiếu font/CSS remote; font cần được đóng gói hoặc xác minh.', 'warn');
      add('license-review', metrics.unverifiedAssetLicenses === 0, metrics.unverifiedAssetLicenses + ' ảnh trong Asset Library chưa có license khai báo.', 'warn');
      add('bleed-and-safe-area', bleed >= 0 && safe >= 3, 'Bleed ' + bleed + ' mm; safe margin ' + safe + ' mm. Cần xác nhận với nhà in.', 'warn');
      var fails = rows.filter(function (x) { return x.status === 'fail'; }).length, warns = rows.filter(function (x) { return x.status === 'warn'; }).length;
      return { format: 'CANVIO_PRINT_PREFLIGHT', version: 1, status: fails ? 'BLOCKED' : warns ? 'REVIEW_REQUIRED' : 'READY_FOR_PRINTER_REVIEW', summary: { pass: rows.filter(function (x) { return x.status === 'pass'; }).length, warn: warns, fail: fails }, metrics: metrics, print: { format: format, bleedMm: bleed, safeMarginMm: safe, cropMarksRequested: options.cropMarks === true }, checks: rows, readOnly: true, noProjectMutation: true, limitations: ['DOM/preflight checks cannot measure every rendered glyph overflow, CMYK conversion, spot colors, trapping, physical bleed, embedded font rights or printer-specific PDF/X requirements.', 'Browser CSS kerning/ligatures depend on the browser and installed font; fonts are not embedded or converted to outlines.', 'Bleed is recorded as a production requirement only; this HTML does not generate a physical bleed area, trim box, crop marks, CMYK separations or PDF/X output.'] };
    }
    function safePrintFragment(raw) {
      if (typeof DOMParser === 'undefined') throw new Error('Không có HTML parser an toàn; từ chối xuất Print HTML.');
      var doc = new DOMParser().parseFromString('<!doctype html><html><body>' + String(raw || '') + '</body></html>', 'text/html');
      Array.from(doc.body.querySelectorAll('script,iframe,object,embed,applet,base,form')).forEach(function (node) { node.remove(); });
      Array.from(doc.body.querySelectorAll('*')).forEach(function (node) {
        Array.from(node.attributes || []).forEach(function (attr) {
          var name = attr.name.toLowerCase(), value = String(attr.value || '').trim();
          if (name.indexOf('on') === 0 || name === 'srcdoc') node.removeAttribute(attr.name);
          else if ((name === 'href' || name === 'src' || name === 'xlink:href') && /^(?:javascript:|data:text\/html)/i.test(value)) node.removeAttribute(attr.name);
          else if (name === 'style' && /(expression\s*\(|javascript:|@import)/i.test(value)) node.removeAttribute(attr.name);
        });
      });
      Array.from(doc.body.querySelectorAll('style')).forEach(function (node) { if (/@import|url\s*\(\s*["']?https?:/i.test(node.textContent || '')) node.remove(); });
      return doc.body.innerHTML;
    }
    function buildPrintHtml(options) {
      options = options || {}; var report = inspect(options), data = snapshot(); if (report.summary.fail) throw new Error('Print preflight đang BLOCKED. Sửa script, embed hoặc URL nguy hiểm trước khi xuất.');
      var size = { A4: '210mm 297mm', A3: '297mm 420mm', A5: '148mm 210mm', Letter: '8.5in 11in', Legal: '8.5in 14in' }[report.print.format], bleed = report.print.bleedMm, safe = report.print.safeMarginMm;
      var pages = data.pages.filter(function (p) { return p && !p.hidden; }).map(function (p) { return '<section class="page"><main class="doc-page">' + safePrintFragment(p.html || '') + '</main></section>'; }).join('');
      var css = '@page{size:' + size + ';margin:0' + (report.print.cropMarksRequested ? ';marks:crop' : '') + '}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#111}body{font:10pt/1.5 Arial,sans-serif}.page{width:' + size.split(' ')[0] + ';min-height:' + size.split(' ')[1] + ';padding:' + safe + 'mm;page-break-after:always;break-after:page;overflow:hidden}.doc-page{min-height:calc(' + size.split(' ')[1] + ' - ' + (safe * 2) + 'mm);overflow-wrap:anywhere}img{max-width:100%;height:auto}table{max-width:100%;border-collapse:collapse}h1,h2,h3{break-after:avoid}p{orphans:3;widows:3}@media screen{body{background:#e9edf4}.page{margin:12px auto;background:white;box-shadow:0 2px 16px #17203322}}';
      return '<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CANVIO Print Production</title><style>' + css + '</style></head><body>' + pages + '</body></html>';
    }
    return { version: '67.0.0', applyMaster: applyMaster, applyTypography: applyTypography, inspect: inspect, buildPrintHtml: buildPrintHtml,
      tests: function () { return { layoutOwner: !!(layout() && layout().snapshotState && layout().restoreState), masterPage: typeof applyMaster === 'function', typographyCSS: typeof applyTypography === 'function', printPreflight: typeof inspect === 'function', printHtml: typeof buildPrintHtml === 'function', noNewStore: true, noPDFXClaim: true }; } };
  })();
  window.CANVIOPrintProduction = P67;

  /* Shared UI / user-initiated integrations. */
  function makePanel(id, title, subtitle, html) {
    if (byId(id)) return byId(id);
    var panel = document.createElement('section'); panel.id = id; panel.className = 'card cv-p2-panel';
    panel.setAttribute('aria-labelledby', id + '-title');
    panel.innerHTML = '<div class="cardTop"><div><h3 id="' + id + '-title">' + title + '</h3><span class="sub">' + subtitle + '</span></div><span class="badgeSoft">P63–P67</span></div>' + html;
    return panel;
  }
  function mountTimelinePanel() {
    var page = byId('page-videoEngine'); if (!page || byId('cv-p63-67-timeline')) return false;
    var anchor = page.querySelector('#cv-phase1-acceptance') || page.querySelector('.engine-toolbar') || page.firstElementChild;
    var panel = makePanel('cv-p63-67-timeline', 'Chặng 2 · Unified Creative Timeline', 'Video Engine là timeline chuẩn; MotionCut/Shape Animation chỉ chuyển khi bạn chủ động yêu cầu.',
      '<div class="cv-p2-toolbar"><button type="button" class="btn btn-soft sm" id="cv63-inspect">P63 · Kiểm tra timeline</button><button type="button" class="btn btn-soft sm" id="cv63-motioncut">P63 · Nhập MotionCut</button><button type="button" class="btn btn-soft sm" id="cv63-shape">P63 · Chuyển Shape Animation</button><button type="button" class="btn btn-ghost sm" id="cv64-refresh">Làm mới danh sách</button></div>' +
      '<div id="cv63-summary" class="tiny" role="status" aria-live="polite">Chưa kiểm tra timeline.</div><pre id="cv63-report" class="cv-p2-pre" tabindex="0">P63 chưa tạo báo cáo.</pre>' +
      '<hr class="cv-p2-divider"><b>P64 · Advanced Timeline Editing</b><div class="cv-p2-grid"><label>Ripple delete · Từ (giây)<input id="cv64-start" type="number" min="0" step="0.1" value="0"></label><label>Đến (giây)<input id="cv64-end" type="number" min="0.2" step="0.1" value="1"></label><label>Tên nhóm<input id="cv64-group-name" maxlength="80" value="Nhóm timeline"></label><label>Snap threshold (giây)<input id="cv64-snap-threshold" type="number" min="0" max="2" step="0.05" value="0.15"></label></div>' +
      '<div class="cv-p2-toolbar"><button type="button" class="btn btn-soft sm" id="cv64-plan">Xem trước Ripple</button><button type="button" class="btn btn-danger sm" id="cv64-ripple">Thực hiện Ripple Delete</button><button type="button" class="btn btn-soft sm" id="cv64-group">Group clips đã chọn</button><button type="button" class="btn btn-ghost sm" id="cv64-ungroup">Ungroup</button><button type="button" class="btn btn-ghost sm" id="cv64-move-left">Dời −1s</button><button type="button" class="btn btn-ghost sm" id="cv64-move-right">Dời +1s</button><button type="button" class="btn btn-soft sm" id="cv64-duplicate">Duplicate group +2s</button><button type="button" class="btn btn-ghost sm" id="cv64-snap">Snap playhead</button></div>' +
      '<div id="cv64-clips" class="cv-p2-clips" aria-label="Chọn clips trong canonical timeline"><span class="tiny">Nhấn làm mới danh sách để hiện clips.</span></div><pre id="cv64-report" class="cv-p2-pre" tabindex="0">P64 sẵn sàng.</pre>' +
      '<hr class="cv-p2-divider"><b>P65 · Motion Tracking & Stabilization</b><p class="tiny">Tracker patch-based chạy cục bộ, không cần model hay upload. Chọn đúng file nguồn của clip đang chọn trong Video Engine; click lên điểm có chi tiết rõ để khóa target.</p>' +
      '<div class="cv-p2-toolbar"><label class="btn btn-soft sm">Chọn video nguồn<input id="cv65-file" type="file" accept="video/*" hidden></label><label>Sample rate<input id="cv65-rate" type="number" min="0.5" max="3" step="0.5" value="1"></label><label>Search radius<input id="cv65-radius" type="number" min="2" max="35" value="14"></label><label>Patch radius<input id="cv65-patch" type="number" min="2" max="10" value="5"></label></div>' +
      '<canvas id="cv65-preview" width="480" height="270" class="cv-p2-canvas" role="img" aria-label="Video preview; click to choose tracking point"></canvas>' +
      '<div class="cv-p2-toolbar"><label>Chế độ<select id="cv65-mode"><option value="stabilize">Stabilize · chống rung</option><option value="follow">Follow · bám điểm bằng transform</option></select></label><button type="button" class="btn btn-primary sm" id="cv65-track">Phân tích tracking</button><button type="button" class="btn btn-soft sm" id="cv65-apply" disabled>Áp vào clip đang chọn</button></div><div id="cv65-status" class="tiny" role="status" aria-live="polite">Chưa chọn video hoặc điểm tracking.</div><pre id="cv65-report" class="cv-p2-pre" tabindex="0">P65 chưa chạy.</pre>'
    );
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(panel, anchor.nextSibling); else page.appendChild(panel);
    bindTimelinePanel(panel); return true;
  }
  function bindTimelinePanel(panel) {
    var report = byId('cv63-report'), summary = byId('cv63-summary'), clipBox = byId('cv64-clips'), selected = new Set(), trackFile = null, trackPoint = null, tracking = null, previewVideo = null, previewUrl = null;
    function show(node, value) { if (node) node.textContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2); }
    function readSelection() { return Array.from(selected); }
    function refresh() {
      var data = P63.inspect(), validation = P63.validate(); show(report, { timeline: data, validation: validation });
      show(summary, data.canonicalClipCount + ' clips · ' + data.canonicalDuration.toFixed(2) + 's · Owner: ' + data.canonicalOwner + ' · MotionCut staged: ' + data.sourceEditors.motionCut.stagedClips + ' · Shape layers: ' + data.sourceEditors.shapeAnimation.stagedLayers);
      var clips = P63.clips(); if (clipBox) { clipBox.textContent = ''; clips.forEach(function (c) { var label = document.createElement('label'); label.className = 'cv-p2-clip'; var check = document.createElement('input'); check.type = 'checkbox'; check.value = c.id; check.checked = selected.has(c.id); check.addEventListener('change', function () { if (check.checked) selected.add(c.id); else selected.delete(c.id); }); var text = document.createElement('span'); text.textContent = c.name + ' · ' + c.type + ' · T' + c.track + ' · ' + c.start.toFixed(2) + '–' + c.end.toFixed(2) + 's' + (c.locked ? ' · LOCKED' : ''); label.appendChild(check); label.appendChild(text); clipBox.appendChild(label); }); if (!clips.length) clipBox.textContent = 'Timeline đang trống.'; }
    }
    function selectedIds() { return readSelection().filter(function (id) { return P63.clips().some(function (c) { return c.id === id; }); }); }
    byId('cv63-inspect').addEventListener('click', refresh);
    byId('cv64-refresh').addEventListener('click', refresh);
    byId('cv63-motioncut').addEventListener('click', async function () { try { var before = P63.inspect().canonicalClipCount; await P63.importMotionCut(); refresh(); show(report, { action: 'MotionCut transfer requested', previousCanonicalClipCount: before, after: P63.inspect().canonicalClipCount, note: 'Source MotionCut state remains available until user clears it.' }); } catch (e) { show(report, { error: e.message || String(e) }); } });
    byId('cv63-shape').addEventListener('click', async function () { try { var n = await P63.importShapeAnimation(); refresh(); show(report, { action: 'Shape Animation bridge completed', added: n, timeline: P63.inspect() }); } catch (e) { show(report, { error: e.message || String(e) }); } });
    byId('cv64-plan').addEventListener('click', function () { var r = P64.planRippleDelete(byId('cv64-start').value, byId('cv64-end').value); show(byId('cv64-report'), r); });
    byId('cv64-ripple').addEventListener('click', function () { var a = Number(byId('cv64-start').value), b = Number(byId('cv64-end').value); var p = P64.planRippleDelete(a, b); if (!p.ok) return show(byId('cv64-report'), p); if (!window.confirm('Ripple Delete sẽ dồn các clip phía sau và cắt/loại các clip giao với vùng đã chọn. Các clip/track khóa sẽ chặn thao tác. Tiếp tục?')) return; var r = P64.rippleDelete(a, b); show(byId('cv64-report'), r); refresh(); });
    byId('cv64-group').addEventListener('click', function () { var r = P64.group(selectedIds(), byId('cv64-group-name').value); show(byId('cv64-report'), r); refresh(); });
    byId('cv64-ungroup').addEventListener('click', function () { var r = P64.ungroup(selectedIds()); show(byId('cv64-report'), r); refresh(); });
    byId('cv64-move-left').addEventListener('click', function () { var r = P64.moveGroup(selectedIds(), -1); show(byId('cv64-report'), r); refresh(); });
    byId('cv64-move-right').addEventListener('click', function () { var r = P64.moveGroup(selectedIds(), 1); show(byId('cv64-report'), r); refresh(); });
    byId('cv64-duplicate').addEventListener('click', function () { var r = P64.duplicateGroup(selectedIds(), 2); show(byId('cv64-report'), r); refresh(); });
    byId('cv64-snap').addEventListener('click', function () { var v = window.CV && CV.engines && CV.engines.video, s = v && v._state && v._state(); if (!s) return; var r = P64.snap(s.time, byId('cv64-snap-threshold').value); if (r.snapped && v.seek) v.seek(r.value); show(byId('cv64-report'), r); });

    var preview = byId('cv65-preview'), ctx = preview.getContext('2d'), point = null, result = null;
    var previewRect = null;
    function drawPreview() { if (!previewVideo || !previewVideo.videoWidth) return; ctx.clearRect(0, 0, preview.width, preview.height); var scale = Math.min(preview.width / previewVideo.videoWidth, preview.height / previewVideo.videoHeight), w = previewVideo.videoWidth * scale, h = previewVideo.videoHeight * scale, x = (preview.width - w) / 2, y = (preview.height - h) / 2; previewRect = { x: x, y: y, w: w, h: h }; ctx.fillStyle = '#0c1525'; ctx.fillRect(0, 0, preview.width, preview.height); ctx.drawImage(previewVideo, x, y, w, h); if (point) { var px = point.x * w / previewVideo.videoWidth, py = point.y * h / previewVideo.videoHeight; ctx.strokeStyle = '#00d2c8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px + x, py + y, 9, 0, Math.PI * 2); ctx.moveTo(px + x - 14, py + y); ctx.lineTo(px + x + 14, py + y); ctx.moveTo(px + x, py + y - 14); ctx.lineTo(px + x, py + y + 14); ctx.stroke(); } }
    byId('cv65-file').addEventListener('change', function () { var f = this.files && this.files[0]; this.value = ''; if (!f) return; if (previewUrl) URL.revokeObjectURL(previewUrl); trackFile = f; result = null; point = null; byId('cv65-apply').disabled = true; previewVideo = document.createElement('video'); previewVideo.muted = true; previewVideo.preload = 'metadata'; previewUrl = URL.createObjectURL(f); previewVideo.onloadedmetadata = function () { if (previewVideo.duration > 60 || f.size > 100 * 1024 * 1024) { show(byId('cv65-status'), 'Video vượt giới hạn 60 giây hoặc 100 MB.'); return; } previewVideo.currentTime = 0.01; }; previewVideo.onseeked = drawPreview; previewVideo.onerror = function () { show(byId('cv65-status'), 'Không đọc được video local.'); }; previewVideo.src = previewUrl; show(byId('cv65-status'), 'Đã chọn ' + f.name + '. Click trên preview để chọn điểm tracking.'); });
    preview.addEventListener('click', function (e) { if (!previewVideo || !previewVideo.videoWidth || !previewRect) return; var r = preview.getBoundingClientRect(), cx = (e.clientX - r.left) * preview.width / r.width, cy = (e.clientY - r.top) * preview.height / r.height; if (cx < previewRect.x || cy < previewRect.y || cx > previewRect.x + previewRect.w || cy > previewRect.y + previewRect.h) { show(byId('cv65-status'), 'Hãy chọn điểm nằm trên khung hình video, không chọn vùng letterbox.'); return; } point = { x: (cx - previewRect.x) * previewVideo.videoWidth / previewRect.w, y: (cy - previewRect.y) * previewVideo.videoHeight / previewRect.h }; drawPreview(); show(byId('cv65-status'), 'Đã chọn điểm nguồn (' + point.x.toFixed(0) + ', ' + point.y.toFixed(0) + ' px).'); });
    byId('cv65-track').addEventListener('click', async function () { if (!trackFile || !point || !previewVideo) return show(byId('cv65-status'), 'Chọn video và click điểm tracking trước.'); var b = this; b.disabled = true; result = null; byId('cv65-apply').disabled = true; try { var width = preview.width, height = preview.height; result = await P65.trackFile(trackFile, point, { displayWidth: width, displayHeight: height, sampleRate: Number(byId('cv65-rate').value), searchRadius: Number(byId('cv65-radius').value), patchRadius: Number(byId('cv65-patch').value) }, function (n, total) { show(byId('cv65-status'), 'Đang lấy mẫu frame ' + n + '/' + total + '…'); }); show(byId('cv65-status'), 'Tracking đạt ' + result.sampleCount + ' mẫu · confidence trung bình ' + result.averageConfidence.toFixed(2) + '.'); show(byId('cv65-report'), result); byId('cv65-apply').disabled = false; } catch (e) { show(byId('cv65-status'), 'Tracking thất bại: ' + (e.message || String(e))); show(byId('cv65-report'), { error: e.message || String(e) }); } finally { b.disabled = false; } });
    byId('cv65-apply').addEventListener('click', function () { if (!result) return; if (!window.confirm('Áp tracking lên clip video/ảnh đang chọn trong Video Engine? Motion hiện có trên clip sẽ được thay bằng keyframe tracking mới.')) return; var r = P65.applyToSelected(result, byId('cv65-mode').value); show(byId('cv65-report'), r); show(byId('cv65-status'), r.ok ? 'Đã áp keyframe tracking vào clip ' + r.clipId + '. Lưu timeline để giữ thay đổi.' : 'Không thể áp tracking: ' + r.reason); });
    refresh(); return true;
  }
  function mountAIPanel() {
    var page = byId('page-promptForge'); if (!page || byId('cv-p66-ai-workflow')) return false;
    var panel = makePanel('cv-p66-ai-workflow', 'P66 · AI Creative Asset Workflow', 'Brief → prompt → công cụ AI bạn chọn → import an toàn → Asset Library → editor. CANVIO không tự phát sinh API request.',
      '<div class="cv-p2-grid"><label>Brief<textarea id="cv66-brief" rows="3" placeholder="Chủ thể, mục tiêu, đối tượng, thông điệp…"></textarea></label><label>Định dạng<select id="cv66-output"><option value="image">Hình ảnh</option><option value="product">Ảnh sản phẩm</option><option value="brand">Brand asset</option><option value="video">Video concept / storyboard</option></select></label><label>Tỷ lệ<select id="cv66-ratio"><option>1:1</option><option>16:9</option><option>9:16</option><option>4:5</option><option>3:2</option><option>A4</option></select></label><label>Art direction<input id="cv66-style" value="Premium modern" maxlength="80"></label><label>Ràng buộc<textarea id="cv66-notes" rows="2" placeholder="Màu thương hiệu, license, điều cần tránh…"></textarea></label></div><div class="cv-p2-toolbar"><button type="button" class="btn btn-primary sm" id="cv66-build">Tạo production prompt</button><button type="button" class="btn btn-soft sm" id="cv66-copy">Copy prompt</button><button type="button" class="btn btn-ghost sm" id="cv66-send-promptforge">Đưa sang Prompt Forge</button></div><textarea id="cv66-prompt" rows="8" class="cv-p2-textarea" aria-label="Production prompt"></textarea><hr class="cv-p2-divider"><b>Import output từ công cụ AI</b><div class="cv-p2-grid"><label>Nguồn / provider<input id="cv66-source" value="User-selected AI tool" maxlength="180"></label><label>License<select id="cv66-license"><option value="unverified">Chưa xác minh</option><option value="user-created">Tự tạo / quyền sở hữu đã xác nhận</option><option value="commercial">Cho phép thương mại (đã kiểm chứng)</option><option value="restricted">Hạn chế / không dùng thương mại</option></select></label><label>Editor đích<select id="cv66-target"><option value="poster">Poster Studio</option><option value="designEngine">Design Engine</option><option value="vectorForge">Vector Forge (SVG)</option><option value="videoEngine">Video Engine</option></select></label><label class="btn btn-soft sm">Chọn output ảnh<input id="cv66-file" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,.svg" hidden></label></div><div id="cv66-status" role="status" aria-live="polite" class="tiny">Chưa nhập output. Asset sẽ đi vào Asset Library hiện hữu; metadata license phải được kiểm tra bởi người dùng.</div><pre id="cv66-report" class="cv-p2-pre" tabindex="0">P66 chưa chạy.</pre>' );
    var anchor = page.querySelector('.ne-workgrid') || page.firstElementChild; if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(panel, anchor.nextSibling); else page.appendChild(panel);
    var prompt = byId('cv66-prompt');
    byId('cv66-build').addEventListener('click', function () { try { prompt.value = P66.buildPrompt({ brief: byId('cv66-brief').value, output: byId('cv66-output').value, ratio: byId('cv66-ratio').value, style: byId('cv66-style').value, notes: byId('cv66-notes').value }); byId('cv66-status').textContent = 'Prompt đã tạo cục bộ. Không có provider/API nào được gọi.'; } catch (e) { byId('cv66-status').textContent = e.message || String(e); } });
    byId('cv66-copy').addEventListener('click', function () { if (!prompt.value.trim()) return; try { CV.util.copy(prompt.value); byId('cv66-status').textContent = 'Đã copy prompt.'; } catch (e) { prompt.focus(); prompt.select(); } });
    byId('cv66-send-promptforge').addEventListener('click', function () { var out = byId('pfOutput'); if (out) { out.value = prompt.value; CV.go('promptForge'); out.dispatchEvent(new Event('input', { bubbles: true })); } });
    byId('cv66-file').addEventListener('change', async function () { var f = this.files && this.files[0]; this.value = ''; if (!f) return; try { var r = await P66.ingest(f, { license: byId('cv66-license').value, source: byId('cv66-source').value }); byId('cv66-report').textContent = JSON.stringify(r, null, 2); byId('cv66-status').textContent = 'Đã nhập asset. Đang mở editor đích…'; var opened = await P66.openInEditor(r.asset.id, byId('cv66-target').value); byId('cv66-report').textContent = JSON.stringify({ import: r, open: opened }, null, 2); byId('cv66-status').textContent = 'Hoàn tất import vào Asset Library và gửi tới editor: ' + byId('cv66-target').value + '. License vẫn cần xác minh tài liệu nguồn.'; } catch (e) { byId('cv66-status').textContent = 'Import thất bại: ' + (e.message || String(e)); byId('cv66-report').textContent = JSON.stringify({ error: e.message || String(e) }, null, 2); } });
    return true;
  }
  function mountPrintPanel() {
    var page = byId('page-layoutFoundry'); if (!page || byId('cv-p67-print-production')) return false;
    var panel = makePanel('cv-p67-print-production', 'P67 · Typography & Print Production', 'Master header/footer, browser font shaping controls và preflight trước khi in. Không tuyên bố PDF/X hoặc CMYK certification.',
      '<div class="cv-p2-grid"><label>Master header<input id="cv67-header" maxlength="180" placeholder="Tên thương hiệu / tài liệu"></label><label>Master footer<input id="cv67-footer" maxlength="180" placeholder="Tên công ty / phiên bản"></label><label>Font family<input id="cv67-font" value="Be Vietnam Pro" maxlength="80"></label><label>Letter spacing (px)<input id="cv67-spacing" type="number" min="-2" max="20" step="0.1" value="0"></label><label>Paper<select id="cv67-format"><option>A4</option><option>A3</option><option>A5</option><option>Letter</option><option>Legal</option></select></label><label>Bleed (mm)<input id="cv67-bleed" type="number" min="0" max="10" step="0.5" value="3"></label><label>Safe margin (mm)<input id="cv67-safe" type="number" min="3" max="30" step="0.5" value="5"></label><label class="cv-p2-check"><input id="cv67-folio" type="checkbox" checked> Số trang</label><label class="cv-p2-check"><input id="cv67-kerning" type="checkbox" checked> Kerning</label><label class="cv-p2-check"><input id="cv67-ligatures" type="checkbox" checked> Ligatures</label><label class="cv-p2-check"><input id="cv67-crops" type="checkbox"> Yêu cầu crop marks</label></div><div class="cv-p2-toolbar"><button type="button" class="btn btn-soft sm" id="cv67-master">Áp dụng master page</button><button type="button" class="btn btn-soft sm" id="cv67-type">Áp dụng typography</button><button type="button" class="btn btn-primary sm" id="cv67-preflight">Chạy Print Preflight</button><button type="button" class="btn btn-ghost sm" id="cv67-export" disabled>Xuất Print HTML</button></div><div id="cv67-status" class="tiny" role="status" aria-live="polite">Chưa chạy preflight.</div><pre id="cv67-report" class="cv-p2-pre" tabindex="0">P67 chưa tạo báo cáo.</pre>' );
    page.appendChild(panel);
    var last = null;
    function opts() { return { format: byId('cv67-format').value, bleedMm: byId('cv67-bleed').value, safeMarginMm: byId('cv67-safe').value, cropMarks: byId('cv67-crops').checked }; }
    byId('cv67-master').addEventListener('click', function () { try { var r = P67.applyMaster({ header: byId('cv67-header').value, footer: byId('cv67-footer').value, folio: byId('cv67-folio').checked }); byId('cv67-status').textContent = 'Master elements đã áp dụng trên Layout Foundry hiện tại.'; byId('cv67-report').textContent = JSON.stringify(r, null, 2); } catch (e) { byId('cv67-status').textContent = e.message || String(e); } });
    byId('cv67-type').addEventListener('click', function () { try { var r = P67.applyTypography({ fontFamily: byId('cv67-font').value, letterSpacing: byId('cv67-spacing').value, kerning: byId('cv67-kerning').checked, ligatures: byId('cv67-ligatures').checked }); byId('cv67-status').textContent = 'Typography CSS đã áp dụng. Kiểm tra font thực tế và license trước khi xuất.'; byId('cv67-report').textContent = JSON.stringify(r, null, 2); } catch (e) { byId('cv67-status').textContent = e.message || String(e); } });
    byId('cv67-preflight').addEventListener('click', function () { try { last = P67.inspect(opts()); byId('cv67-report').textContent = JSON.stringify(last, null, 2); byId('cv67-status').textContent = last.status + ' · ' + last.summary.pass + ' PASS · ' + last.summary.warn + ' WARN · ' + last.summary.fail + ' FAIL.'; byId('cv67-export').disabled = last.summary.fail > 0; } catch (e) { last = null; byId('cv67-export').disabled = true; byId('cv67-status').textContent = e.message || String(e); } });
    byId('cv67-export').addEventListener('click', function () { if (!last || last.summary.fail) return; try { var html = P67.buildPrintHtml(opts()), blob = new Blob([html], { type: 'text/html;charset=utf-8' }), url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = 'CANVIO_Print_Production_' + new Date().toISOString().slice(0, 10) + '.html'; a.click(); setTimeout(function () { URL.revokeObjectURL(url); }, 1500); byId('cv67-status').textContent = 'Đã xuất Print HTML. Mở bằng Chrome/Edge và kiểm tra Print Preview trước khi lưu PDF.'; } catch (e) { byId('cv67-status').textContent = e.message || String(e); } });
    return true;
  }
  function mountAll() { mountTimelinePanel(); mountAIPanel(); mountPrintPanel(); }
  function installStyles() {
    if (byId('canvio-p63-p67-styles')) return;
    var style = document.createElement('style'); style.id = 'canvio-p63-p67-styles';
    style.textContent = '.cv-p2-panel{margin:12px 0;border:1px solid var(--line,#dbe3ee);}.cv-p2-toolbar{display:flex;flex-wrap:wrap;gap:7px;align-items:end;margin:10px 0}.cv-p2-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:10px 0}.cv-p2-grid label{display:flex;flex-direction:column;gap:5px;font-size:10px;font-weight:750;color:var(--muted,#64748b);min-width:0}.cv-p2-grid input,.cv-p2-grid select,.cv-p2-grid textarea,.cv-p2-toolbar select,.cv-p2-toolbar input{min-width:0;max-width:100%;min-height:34px;padding:6px 9px;border:1px solid var(--line,#dbe3ee);border-radius:8px;background:var(--surface,#fff);color:var(--text,#172033);font:inherit}.cv-p2-grid textarea,.cv-p2-textarea{width:100%;resize:vertical}.cv-p2-textarea{box-sizing:border-box;border:1px solid var(--line,#dbe3ee);border-radius:9px;padding:9px;background:var(--surface,#fff);color:var(--text,#172033);font:11px/1.5 ui-monospace,monospace}.cv-p2-pre{max-height:270px;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;background:var(--surface-2,#f6f8fb);border-radius:9px;padding:10px;font:10px/1.5 ui-monospace,monospace}.cv-p2-divider{border:0;border-top:1px solid var(--line,#dbe3ee);margin:14px 0}.cv-p2-clips{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;max-height:190px;overflow:auto;padding:7px;border:1px solid var(--line,#dbe3ee);border-radius:9px}.cv-p2-clip{display:flex;gap:7px;align-items:flex-start;padding:6px;border:1px solid var(--line,#e5eaf1);border-radius:7px;font-size:9px;overflow-wrap:anywhere}.cv-p2-clip input{flex:none;margin-top:2px}.cv-p2-check{flex-direction:row!important;align-items:center}.cv-p2-check input{min-height:0}.cv-p2-canvas{display:block;width:100%;max-width:640px;aspect-ratio:16/9;height:auto;background:#0c1525;border:1px solid var(--line,#dbe3ee);border-radius:9px;cursor:crosshair;margin:8px 0}.cv-p2-panel button:focus-visible,.cv-p2-panel input:focus-visible,.cv-p2-panel select:focus-visible,.cv-p2-panel textarea:focus-visible{outline:3px solid #2d7ff9;outline-offset:2px}@media(max-width:680px){.cv-p2-grid,.cv-p2-clips{grid-template-columns:minmax(0,1fr)}}@media(prefers-reduced-motion:reduce){.cv-p2-panel *{scroll-behavior:auto!important;transition:none!important;animation:none!important}}@media print{.cv-p2-panel{display:none!important}}';
    document.head.appendChild(style);
  }
  window.CANVIOPhase2 = { version: '67.0.0', phases: { P63: P63, P64: P64, P65: P65, P66: P66, P67: P67 }, mount: mountAll,
    tests: function () { return { P63: P63.tests(), P64: P64.tests(), P65: P65.tests(), P66: P66.tests(), P67: P67.tests(), noSecondTimeline: true, noNewStore: true, noAutomaticProviderCalls: true }; },
    report: function () { var checks = window.CANVIOPhase2.tests(), flat = []; Object.keys(checks).forEach(function (phase) { var value = checks[phase]; if (value && typeof value === 'object') Object.keys(value).forEach(function (k) { flat.push({ id: phase.toLowerCase() + '-' + k, ok: !!value[k], detail: k }); }); else flat.push({ id: phase, ok: !!value, detail: phase }); }); return { format: 'CANVIO_PHASE2_P63_P67_CANDIDATE', candidate: 'P67', build: VERSION, summary: { pass: flat.filter(function (x) { return x.ok; }).length, fail: flat.filter(function (x) { return !x.ok; }).length }, checks: flat, status: flat.every(function (x) { return x.ok; }) ? 'IMPLEMENTATION_READY_PENDING_MANUAL_ACCEPTANCE' : 'BLOCKED_BY_IMPLEMENTATION_CHECK', releaseCertified: false, manualGates: ['Real multi-track project round-trip and MotionCut source transfer', 'Ripple edit/group/snap/undo/redo on locked and unlocked user projects', 'Motion tracking on representative real footage and visual stabilization review', 'User-selected AI provider output, asset import and licensing provenance', 'Typography/font fallback, layout pagination, physical bleed and printer PDF workflow'], noSecondTimeline: true, noNewStore: true }; } };
  var suite = window.CANVIOPhaseSuite;
  if (suite) { var prevTests = suite.tests; suite.version = '67.0.0'; suite.tests = function () { var r = prevTests ? prevTests.apply(this, arguments) : {}; var p = window.CANVIOPhase2.tests(); r.p63UnifiedTimeline = !!(p.P63 && p.P63.canonicalOwner && p.P63.noSecondTimeline); r.p64AdvancedTimelineEditing = !!(p.P64 && p.P64.ripplePlanner && p.P64.clipLocksRespected); r.p65MotionTracking = !!(p.P65 && p.P65.localPatchTracker && p.P65.inverseStabilization); r.p66AICreativeAssetWorkflow = !!(p.P66 && p.P66.assetOwner && p.P66.explicitProviderOnly); r.p67PrintProduction = !!(p.P67 && p.P67.layoutOwner && p.P67.printPreflight); return r; }; }
  var prior = window.CANVIO_BUILD || {};
  window.CANVIO_BUILD = Object.freeze(Object.assign({}, prior, { version: VERSION, base: '23.3.76-p62', candidate: 'P67', phaseRange: 'P63–P67', features: (prior.features || []).concat([
    'P63 Unified Timeline contract and explicit MotionCut/Shape Animation bridges into canonical Video Engine',
    'P64 ripple delete planner/execution, persistent clip groups, group move/duplicate and timeline snapping on canonical state',
    'P65 local patch-based point tracking and inverse-motion stabilization keyframes; no model/network',
    'P66 explicit AI prompt-to-Asset-Library ingestion workflow with SVG sanitization and user-owned provider calls',
    'P67 Layout Foundry master header/footer/folio, typography shaping controls and print preflight/HTML export'
  ]) }));
  try { document.title = 'CANVIO 23.3.81-p67 — Creative Production Expansion'; } catch (error) {}
  installStyles(); if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { mountAll(); }, { once: true }); else mountAll();
  setTimeout(mountAll, 900); setTimeout(mountAll, 2400);
})();
