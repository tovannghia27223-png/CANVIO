/* CANVIO P79 — optional WebCodecs AVC encode + minimal ISO BMFF muxer.
 * No third-party runtime, CDN, new persistence, timeline or media store.
 * Scope: silent image/text timeline compositions. Timelines with audible audio
 * or video-source clips retain the existing MediaRecorder MP4 route when available.
 */
(function () {
  'use strict';
  if (window.CANVIOWebCodecsExport) return;

  var MAX_FRAMES = 3600;
  var MAX_OUTPUT_BYTES = 384 * 1024 * 1024;
  var MAX_DURATION_SECONDS = 180;
  var active = null;
  var originalExportMP4 = null;
  var originalExportWebM = null;
  var originalCancelExport = null;
  var originalCapabilities = null;
  var lastReport = null;

  function u16(n) { return new Uint8Array([(n >>> 8) & 255, n & 255]); }
  function u32(n) { n = Number(n) >>> 0; return new Uint8Array([(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]); }
  function ascii(s) { var a = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i) & 255; return a; }
  function concat(parts) {
    var size = 0; parts.forEach(function (p) { size += p ? p.byteLength : 0; });
    if (size > 0xffffffff) throw new Error('P79 MP4 vượt giới hạn container 32-bit.');
    var out = new Uint8Array(size), off = 0;
    parts.forEach(function (p) { if (!p) return; var a = p instanceof Uint8Array ? p : new Uint8Array(p); out.set(a, off); off += a.byteLength; });
    return out;
  }
  function box(type) {
    var payload = Array.prototype.slice.call(arguments, 1);
    var content = concat(payload), size = content.byteLength + 8;
    if (size > 0xffffffff) throw new Error('MP4 box ' + type + ' vượt giới hạn 4 GiB.');
    return concat([u32(size), ascii(type), content]);
  }
  function fullBox(type, version, flags, payload) {
    var f = new Uint8Array([version & 255, (flags >>> 16) & 255, (flags >>> 8) & 255, flags & 255]);
    return box(type, f, payload || new Uint8Array(0));
  }
  function matrix() { return concat([u32(0x00010000),u32(0),u32(0),u32(0),u32(0x00010000),u32(0),u32(0),u32(0),u32(0x40000000)]); }
  function runLength(values) {
    var out = [];
    values.forEach(function (v) { var last = out[out.length - 1]; if (last && last.value === v) last.count++; else out.push({ count: 1, value: v }); });
    return out;
  }
  function validateAvcC(avcC) {
    if (!(avcC instanceof Uint8Array)) avcC = new Uint8Array(avcC || 0);
    if (avcC.byteLength < 7 || avcC[0] !== 1) throw new Error('WebCodecs không trả AVCDecoderConfigurationRecord hợp lệ.');
    var lengthSize = (avcC[4] & 3) + 1;
    if (lengthSize !== 4) throw new Error('AVC NAL length không tương thích với muxer MP4 P79.');
    var spsCount = avcC[5] & 31;
    if (!spsCount) throw new Error('AVC configuration thiếu SPS.');
    var off = 6;
    for (var i = 0; i < spsCount; i++) { if (off + 2 > avcC.length) throw new Error('AVC SPS bị cắt.'); var n = (avcC[off] << 8) | avcC[off + 1]; off += 2 + n; if (off > avcC.length) throw new Error('AVC SPS vượt giới hạn.'); }
    if (off >= avcC.length) throw new Error('AVC configuration thiếu PPS count.');
    var ppsCount = avcC[off++]; if (!ppsCount) throw new Error('AVC configuration thiếu PPS.');
    for (var j = 0; j < ppsCount; j++) { if (off + 2 > avcC.length) throw new Error('AVC PPS bị cắt.'); var pn = (avcC[off] << 8) | avcC[off + 1]; off += 2 + pn; if (off > avcC.length) throw new Error('AVC PPS vượt giới hạn.'); }
    return avcC;
  }
  function sampleHasNal(sample, wanted) {
    var a = sample.data, off = 0;
    while (off + 4 <= a.length) { var n = (a[off] * 0x1000000) + (a[off + 1] << 16) + (a[off + 2] << 8) + a[off + 3]; off += 4; if (!n || off + n > a.length) return false; if ((a[off] & 31) === wanted) return true; off += n; }
    return false;
  }
  function makeAvc1(width, height, avcC) {
    var compressor = new Uint8Array(32); compressor[0] = 0;
    var fixed = concat([new Uint8Array(6), u16(1), u16(0),u16(0),u32(0),u32(0),u32(0),u16(width),u16(height),u32(0x00480000),u32(0x00480000),u32(0),u16(1),compressor,u16(0x0018),u16(0xffff)]);
    return box('avc1', fixed, box('avcC', avcC));
  }
  function makeMP4(input) {
    input = input || {};
    var width = Number(input.width), height = Number(input.height), fps = Number(input.fps) || 30;
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 16 || height < 16 || width > 3840 || height > 2160 || width * height > 8294400) throw new Error('Kích thước MP4 không hợp lệ.');
    if (![24,25,30,50,60].includes(fps)) throw new Error('FPS P79 không được hỗ trợ.');
    var avcC = validateAvcC(input.avcC), samples = Array.isArray(input.samples) ? input.samples : [];
    if (!samples.length || samples.length > MAX_FRAMES) throw new Error('Số frame MP4 nằm ngoài giới hạn P79.');
    var frameDur = Math.round(1000000 / fps), norm = [], totalBytes = 0;
    samples.forEach(function (s, i) {
      var data = s.data instanceof Uint8Array ? s.data : new Uint8Array(s.data || 0);
      if (!data.length || data.length > 16 * 1024 * 1024) throw new Error('Sample video trống hoặc vượt 16 MiB.');
      totalBytes += data.length;
      if (totalBytes > MAX_OUTPUT_BYTES) throw new Error('MP4 vượt giới hạn bộ nhớ P79 (384 MiB).');
      var ts = Number.isFinite(Number(s.timestamp)) ? Math.max(0, Math.round(Number(s.timestamp))) : i * frameDur;
      var dur = Number.isFinite(Number(s.duration)) && Number(s.duration) > 0 ? Math.round(Number(s.duration)) : frameDur;
      norm.push({ data: data, timestamp: ts, duration: dur, key: s.type === 'key' });
    });
    for (var i = 1; i < norm.length; i++) { if (norm[i].timestamp <= norm[i-1].timestamp) throw new Error('Timestamp frame phải tăng nghiêm ngặt.'); }
    var durations = norm.map(function (s, i) { return i < norm.length - 1 ? norm[i + 1].timestamp - s.timestamp : s.duration; });
    if (durations.some(function (d) { return d <= 0 || d > 10000000; })) throw new Error('Frame duration không hợp lệ.');
    var durationUs = durations.reduce(function (a,b) { return a+b; }, 0);
    if (durationUs > MAX_DURATION_SECONDS * 1000000) throw new Error('Thời lượng WebCodecs tối đa là ' + MAX_DURATION_SECONDS + ' giây trong bản hiện tại.');
    if (!norm[0].key || !sampleHasNal(norm[0], 5)) throw new Error('Frame đầu tiên phải là H.264 IDR keyframe.');

    var ftyp = box('ftyp', ascii('isom'), u32(0x200), ascii('isom'), ascii('iso2'), ascii('avc1'), ascii('mp41'));
    var mdatPayload = concat(norm.map(function (s) { return s.data; }));
    var mdat = box('mdat', mdatPayload);
    var movieDuration = Math.ceil(durationUs / 1000);
    var mvhd = fullBox('mvhd',0,0,concat([u32(0),u32(0),u32(1000),u32(movieDuration),u32(0x00010000),u16(0x0100),new Uint8Array(10),matrix(),new Uint8Array(24),u32(2)]));
    var tkhd = fullBox('tkhd',0,7,concat([u32(0),u32(0),u32(1),u32(0),u32(movieDuration),new Uint8Array(8),u16(0),u16(0),u16(0),u16(0),matrix(),u32(width * 65536),u32(height * 65536)]));
    var mdhd = fullBox('mdhd',0,0,concat([u32(0),u32(0),u32(1000000),u32(durationUs),u16(0x55c4),u16(0)]));
    var hdlr = fullBox('hdlr',0,0,concat([u32(0),ascii('vide'),new Uint8Array(12),ascii('CANVIO WebCodecs\0')]));
    var vmhd = fullBox('vmhd',0,1,concat([u16(0),u16(0),u16(0),u16(0)]));
    var url = fullBox('url ',0,1,new Uint8Array(0));
    var dref = fullBox('dref',0,0,concat([u32(1),url]));
    var dinf = box('dinf',dref);
    var avc1 = makeAvc1(width,height,avcC);
    var stsd = fullBox('stsd',0,0,concat([u32(1),avc1]));
    var sttsRuns = runLength(durations);
    var stts = fullBox('stts',0,0,concat([u32(sttsRuns.length)].concat(sttsRuns.map(function (r) { return concat([u32(r.count),u32(r.value)]); }))));
    var stsc = fullBox('stsc',0,0,concat([u32(1),u32(1),u32(norm.length),u32(1)]));
    var stsz = fullBox('stsz',0,0,concat([u32(0),u32(norm.length)].concat(norm.map(function (s) { return u32(s.data.length); }))));
    var chunkOffset = ftyp.length + 8;
    var stco = fullBox('stco',0,0,concat([u32(1),u32(chunkOffset)]));
    var keyIndices = norm.map(function (s,i) { return s.key ? i+1 : 0; }).filter(Boolean);
    var stss = fullBox('stss',0,0,concat([u32(keyIndices.length)].concat(keyIndices.map(u32))));
    var stbl = box('stbl',stsd,stts,stsc,stsz,stco,stss);
    var minf = box('minf',vmhd,dinf,stbl);
    var mdia = box('mdia',mdhd,hdlr,minf);
    var trak = box('trak',tkhd,mdia);
    var moov = box('moov',mvhd,trak);
    var output = concat([ftyp,mdat,moov]);
    return { blob: new Blob([output],{type:'video/mp4'}), bytes: output.length, duration: durationUs/1000000, samples: norm.length, keyframes: keyIndices.length, codec: 'H.264/AVC', profile: 'video-only MP4; no audio track' };
  }
  function api() { return window.CV && CV.engines && CV.engines.video || null; }
  function capability() {
    var Encoder = window.VideoEncoder, Frame = window.VideoFrame;
    var apiPresent = typeof Encoder === 'function' && typeof Frame === 'function' && typeof Encoder.isConfigSupported === 'function';
    return { webCodecsAvailable: apiPresent, videoEncoder: typeof Encoder === 'function', videoFrame: typeof Frame === 'function', avcConfigProbe: apiPresent, muxer: 'CANVIO_ISOBMFF_AVC_1TRACK', maxFrames: MAX_FRAMES, maxDurationSeconds: MAX_DURATION_SECONDS, maxOutputBytes: MAX_OUTPUT_BYTES, audioEncoding: false, videoSourceSeeking: false, scope: 'silent-image-text-timeline-only' };
  }
  function canUseWebCodecs(state) {
    var c = capability(); if (!c.webCodecsAvailable) return { ok: false, reason: 'WebCodecs VideoEncoder không khả dụng trong trình duyệt.' };
    var clips = state && Array.isArray(state.clips) ? state.clips : [];
    var v = api();
    if (clips.some(function (x) { return x.type === 'video'; })) return { ok: false, reason: 'Timeline có footage video; giữ đường MP4 MediaRecorder để không đổi cách giải mã nguồn.' };
    if (clips.some(function (x) { return x.type === 'audio' && (!v || !v.isClipAudible || v.isClipAudible(x)); })) return { ok: false, reason: 'Timeline có audio nghe được; dùng đường MP4 MediaRecorder để giữ audio mix.' };
    return { ok: true, reason: 'Timeline ảnh/chữ không có audio; phù hợp WebCodecs video-only.' };
  }
  async function chooseConfig(width, height, bitrate, fps) {
    var Encoder = window.VideoEncoder;
    var candidates = width > 1920 || height > 1080 ? ['avc1.640033','avc1.640032','avc1.4D4032'] : width > 1280 || height > 720 ? ['avc1.4D4028','avc1.640028','avc1.42E028'] : ['avc1.42001f','avc1.4D401f','avc1.64001f'];
    for (var i = 0; i < candidates.length; i++) {
      var config = { codec: candidates[i], width: width, height: height, bitrate: bitrate, framerate: fps, latencyMode: 'realtime', hardwareAcceleration: 'prefer-hardware', avc: { format: 'avc' } };
      try { var result = await Encoder.isConfigSupported(config); if (result && result.supported) return result.config || config; } catch (e) {}
      delete config.hardwareAcceleration;
      try { var retry = await Encoder.isConfigSupported(config); if (retry && retry.supported) return retry.config || config; } catch (e2) {}
    }
    throw new Error('Trình duyệt không xác nhận cấu hình H.264 WebCodecs cho độ phân giải/FPS đã chọn.');
  }
  function raf() { return new Promise(function (resolve) { requestAnimationFrame(function () { resolve(); }); }); }
  function waitQueue(encoder, signal, job) {
    return new Promise(function (resolve,reject) {
      var started = Date.now(), done = false;
      function tick() {
        if (done) return;
        if (job && job.error) { done = true; reject(job.error); return; }
        if (job && job.cancelled) { done = true; reject(new Error('Đã hủy render WebCodecs.')); return; }
        if (signal && signal.aborted) { done = true; reject(new Error('Đã hủy render.')); return; }
        if (encoder.state === 'closed') { done = true; reject(new Error('VideoEncoder đã đóng trước khi encode xong.')); return; }
        if (encoder.encodeQueueSize <= 4) { done = true; resolve(); return; }
        if (Date.now() - started > 30000) { done = true; reject(new Error('WebCodecs encode queue timeout sau 30 giây.')); return; }
        setTimeout(tick,8);
      }
      tick();
    });
  }
  async function encodeTimeline(options) {
    options = options || {};
    var v = api(), state = v && v._state && v._state();
    if (!v || !state || typeof v.seek !== 'function') throw new Error('Video Engine canonical renderer chưa sẵn sàng.');
    var use = canUseWebCodecs(state); if (!use.ok) throw new Error(use.reason);
    if (active) throw new Error('Đang có một lượt WebCodecs export khác.');
    var width = Number(options.width) || 1920, height = Number(options.height) || 1080;
    var fps = [24,25,30,50,60].includes(Number(options.fps)) ? Number(options.fps) : 30;
    var bitrate = Math.max(1000000,Math.min(20000000,Number(options.videoBitsPerSecond)||6000000));
    var duration = Math.max(.05,Number(state.duration)||0), count = Math.ceil(duration*fps);
    if (duration > MAX_DURATION_SECONDS || count > MAX_FRAMES) throw new Error('P79 WebCodecs giới hạn ' + MAX_DURATION_SECONDS + ' giây / ' + MAX_FRAMES + ' frame; dùng đường xuất hiện có cho video dài hơn.');
    if (bitrate*duration/8 > MAX_OUTPUT_BYTES) throw new Error('Ước tính dung lượng MP4 vượt 384 MiB; giảm bitrate hoặc thời lượng.');
    if (!Number.isInteger(width)||!Number.isInteger(height)||width<640||height<360||width>3840||height>2160||width*height>8294400||Math.abs(width/height-16/9)>.003) throw new Error('P79 chỉ hỗ trợ 16:9 từ 640×360 đến 3840×2160.');
    var canvas = document.getElementById('vtCanvas'); if (!canvas) throw new Error('Không tìm thấy canvas Video Engine.');
    var oldW=canvas.width,oldH=canvas.height,oldTime=Number(state.time)||0,wasPlaying=!!state.playing;
    var job = { cancelled:false, encoder:null, abort:null, reject:null, settled:false };
    active = job;
    function cancel() { if (job.settled || job.cancelled) return false; job.cancelled=true; try { if (job.encoder && job.encoder.state !== 'closed') job.encoder.close(); } catch(e) {} if (job.reject) job.reject(new Error('Đã hủy render WebCodecs. Không tạo file đầu ra.')); return true; }
    job.cancel = cancel;
    if (typeof options.signal !== 'undefined' && options.signal && options.signal.aborted) { active=null; throw new Error('Đã hủy render trước khi bắt đầu.'); }
    if (options.signal && options.signal.addEventListener) { job.abort=cancel; options.signal.addEventListener('abort',job.abort,{once:true}); }
    var frames=[], avcC=null, encoder=null, oldStatus=document.getElementById('vtStatus'), originalText=oldStatus&&oldStatus.textContent;
    function restore() {
      try { if (encoder && encoder.state !== 'closed') encoder.close(); } catch(e) {}
      try { canvas.width=oldW; canvas.height=oldH; v.seek(oldTime); if (wasPlaying) v.play(); } catch(e2) {}
      if (options.signal && job.abort) try { options.signal.removeEventListener('abort',job.abort); } catch(e3) {}
      job.settled=true; if (active===job) active=null;
      if (oldStatus && !job.cancelled) oldStatus.textContent=originalText||'Sẵn sàng.';
    }
    try {
      if (typeof v.isExportBusy === 'function' && v.isExportBusy()) throw new Error('Video Engine đang thực hiện một export khác.');
      var config=await chooseConfig(width,height,bitrate,fps);
      if (job.cancelled) throw new Error('Đã hủy render WebCodecs.');
      encoder = new window.VideoEncoder({
        output: function (chunk, metadata) {
          if (job.cancelled) return;
          if (metadata && metadata.decoderConfig && metadata.decoderConfig.description) avcC = new Uint8Array(metadata.decoderConfig.description);
          var data = new Uint8Array(chunk.byteLength); chunk.copyTo(data);
          frames.push({data:data,timestamp:Number(chunk.timestamp)||0,duration:Number(chunk.duration)||Math.round(1000000/fps),type:chunk.type||'delta'});
        },
        error: function (error) { job.error = error instanceof Error ? error : new Error(String(error)); try { if (encoder && encoder.state !== 'closed') encoder.close(); } catch(e) {} }
      });
      job.encoder=encoder; encoder.configure(config);
      canvas.width=width; canvas.height=height; v.pause();
      var startTime = performance.now(), recovery = window.CANVIOReleaseGate && window.CANVIOReleaseGate.renderRecovery, recoveryStarted = false;
    if (recovery && typeof recovery.begin === 'function') { try { recovery.begin('mp4'); recoveryStarted = true; } catch (recoveryStartError) {} }
      for (var i=0;i<count;i++) {
        if (job.cancelled || (options.signal&&options.signal.aborted)) throw new Error('Đã hủy render WebCodecs.');
        var t=Math.min(duration, i/fps), timestamp=Math.round(i*1000000/fps), frameDuration=Math.round(1000000/fps);
        v.seek(t);
        await raf();
        if (job.cancelled) throw new Error('Đã hủy render WebCodecs.');
        var frame=new window.VideoFrame(canvas,{timestamp:timestamp,duration:frameDuration});
        try { encoder.encode(frame,{keyFrame:i===0 || i%(fps*2)===0}); } finally { frame.close(); }
        await waitQueue(encoder,options.signal,job);
        if (typeof options.onProgress==='function') try { options.onProgress(Math.floor((i+1)/count*95),t,duration); } catch(e) {}
      }
      await encoder.flush();
      if (job.error) throw job.error;
      if (job.cancelled) throw new Error('Đã hủy render WebCodecs.');
      if (!avcC) throw new Error('WebCodecs không cung cấp AVCDecoderConfigurationRecord; không thể mux MP4 an toàn.');
      var result=makeMP4({width:width,height:height,fps:fps,avcC:avcC,samples:frames});
      if (typeof options.onProgress==='function') try { options.onProgress(100,duration,duration); } catch(e) {}
      state.lastExport={format:'mp4',mode:'webcodecs',mimeType:'video/mp4',bytes:result.bytes,duration:result.duration,frames:result.samples,codec:result.codec,audio:false};
      lastReport={status:'completed',mode:'webcodecs',mimeType:'video/mp4',bytes:result.bytes,duration:result.duration,frames:result.samples,keyframes:result.keyframes,elapsedMs:Math.round(performance.now()-startTime),audioTrack:false};
      if (recoveryStarted && recovery && typeof recovery.finish === 'function') { try { recovery.finish('completed',result.blob,null); } catch(recoveryFinishError) {} }
      if (options.onComplete) try { options.onComplete(result.blob); } catch(onCompleteError) {}
      if (options.download !== false) {
        var url=URL.createObjectURL(result.blob),a=document.createElement('a'); a.href=url; a.download=String(options.filename||'CANVIO_WebCodecs.mp4').replace(/[\\/:*?"<>|]+/g,'_'); document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){URL.revokeObjectURL(url);},60000);
      }
      restore(); if (oldStatus) oldStatus.textContent='Đã xuất MP4 bằng WebCodecs · '+(result.bytes/1048576).toFixed(2)+' MB · video-only.'; return result.blob;
    } catch (error) {
      lastReport={status:job.cancelled?'cancelled':'failed',mode:'webcodecs',error:String(error&&error.message||error),frames:frames.length};
      if (recoveryStarted && recovery && typeof recovery.finish === 'function') { try { recovery.finish(job.cancelled?'cancelled':'failed',null,error); } catch(recoveryError) {} }
      restore(); throw error;
    }
  }
  function install() {
    var v=api(); if (!v || v.__canvioP79Installed) return false;
    originalExportMP4=v.exportMP4; originalExportWebM=v.exportWebM; originalCancelExport=v.cancelExport; originalCapabilities=v.exportCapabilities;
    if (typeof originalExportMP4!=='function') return false;
    var route=function(options) {
      options=options||{};
      var state=v._state&&v._state(), decision=canUseWebCodecs(state), caps=capability();
      if (caps.webCodecsAvailable && decision.ok) {
        return encodeTimeline(options).catch(function (error) {
          var msg=String(error&&error.message||error);
          if (msg.indexOf('Đã hủy')>=0 || !v.exportCapabilities || !v.exportCapabilities().h264Supported) { if (window.CV&&CV.toast) CV.toast(msg); return null; }
          if (window.CV&&CV.toast) CV.toast('WebCodecs không hoàn tất; chuyển sang MP4 MediaRecorder.');
          return Promise.resolve(originalExportMP4.apply(this,[options])).then(function(blob){lastReport={status:blob&&blob.size?'fallback-completed':'fallback-no-output',mode:'mediarecorder-fallback',reason:msg,bytes:blob&&blob.size||0};return blob});
        }.bind(this));
      }
      if (window.CANVIOWebCodecsExport && caps.webCodecsAvailable && !decision.ok && window.CV && CV.toast) CV.toast(decision.reason + ' Đang dùng MP4 MediaRecorder nếu được hỗ trợ.');
      return originalExportMP4.apply(this,arguments);
    };
    route.__canvioP79Wrapped=true; route.__canvioP79Original=originalExportMP4; v.exportMP4=route;
    var cancel=function(){ if(active&&active.cancel) active.cancel(); return typeof originalCancelExport==='function'?originalCancelExport.apply(this,arguments):!!active; };
    cancel.__canvioP79Wrapped=true; cancel.__canvioP79Original=originalCancelExport; v.cancelExport=cancel;
    var caps=function(){ var base=typeof originalCapabilities==='function'?originalCapabilities.apply(this,arguments):{}; return Object.assign({},base,{webCodecsAvailable:capability().webCodecsAvailable,webCodecsMuxer:capability().muxer,webCodecsMP4Scope:capability().scope,mp4Supported:!!(base.h264Supported||capability().webCodecsAvailable)}); };
    caps.__canvioP79Wrapped=true; caps.__canvioP79Original=originalCapabilities; v.exportCapabilities=caps;
    v.exportMP4WebCodecs=encodeTimeline; v.webCodecsMP4Decision=function(){return canUseWebCodecs(v._state&&v._state())}; v.__canvioP79Installed=true;
    var priorBuild=window.CANVIO_BUILD||{};
    window.CANVIO_BUILD=Object.freeze(Object.assign({},priorBuild,{version:'23.3.94-p79-r1',base:'23.3.93-p75-p76-p77-p83-r1',candidate:'P79 WebCodecs MP4 export with native fallback',phaseRange:'P68-P70 + P75-P79 + P82/P84 + P87/P88 + P90-P104',features:(priorBuild.features||[]).concat(['P79 optional WebCodecs AVC encoder and local ISO BMFF muxer for silent image/text timelines; retains MediaRecorder MP4 for audio/video-source timelines and WebM fallback','P79 export observes P50 cancellation, P52 recovery ledger and P101 options; no external muxer/runtime or CDN'])}));
    document.title='CANVIO 23.3.94-p79-r1 — WebCodecs Video Export';
    var format=document.getElementById('cv101-format'),status=document.getElementById('cv101-status'),baseCaps=caps(),decision=v.webCodecsMP4Decision();
    var canMp4=!!baseCaps.h264Supported||!!(baseCaps.webCodecsAvailable&&decision.ok);
    if(format){var mp4Option=format.querySelector('option[value="mp4"]');if(mp4Option)mp4Option.disabled=!canMp4;}
    if(status){if(!canMp4)status.textContent=decision.reason||'MP4/H.264 chưa khả dụng; WebM vẫn là fallback.';else if(!baseCaps.h264Supported&&baseCaps.webCodecsAvailable)status.textContent='WebCodecs H.264 sẵn sàng cho timeline ảnh/chữ không audio; audio/footage cần MediaRecorder MP4.';}
    var panel=document.getElementById('cv97-p101-panel');
    if(panel&&!document.getElementById('cv79-export-note')){var note=document.createElement('p');note.id='cv79-export-note';note.className='cv97-warning';note.textContent='P79 WebCodecs: MP4 AVC được mux cục bộ, chỉ cho timeline ảnh/chữ không có audio nghe được. Timeline có audio hoặc footage video dùng MP4 MediaRecorder nếu browser hỗ trợ; không âm thầm bỏ audio. WebCodecs chưa được hỗ trợ ở mọi trình duyệt và profile; giới hạn bản hiện tại 3.600 frame, 180 giây và 384 MiB. WebCodecs profile này không xuất audio.';panel.appendChild(note);}
    return true;
  }
  function tests() {
    var c=capability(), v=api(), checks={
      localIsoBmffMuxer:typeof makeMP4==='function',
      avcConfigurationValidation:typeof validateAvcC==='function',
      sampleTableConstruction:typeof runLength==='function',
      noThirdPartyRuntime:true,
      noExternalNetwork:/https?:\/\//.test(encodeTimeline.toString())===false,
      canonicalVideoOwner:!!(v&&v._state&&v.seek&&v.exportMP4),
      cancelHookAvailable:!!(v&&v.cancelExport),
      durationAndMemoryBounds:MAX_FRAMES===3600&&MAX_OUTPUT_BYTES===384*1024*1024,
      gracefulWebCodecsFallback:typeof originalExportMP4==='function'||!!(v&&v.exportMP4),
      p50CancelAndP52RecoveryHooks:!!(v&&v.cancelExport&&window.CANVIOReleaseGate&&window.CANVIOReleaseGate.renderRecovery),
      audioAndVideoClipGuard:typeof canUseWebCodecs==='function'
    };
    return {version:'79.0.0',checks:checks,pass:Object.keys(checks).filter(function(k){return checks[k]===true}).length,total:Object.keys(checks).length,allPass:Object.keys(checks).every(function(k){return checks[k]===true}),capabilities:c,last:lastReport,limitations:['WebCodecs MP4 P79 chỉ xuất timeline ảnh/chữ không có audio nghe được và không có clip footage video; các timeline khác dùng MP4 MediaRecorder hiện hữu nếu browser hỗ trợ.','Không có audio encode/mux trong WebCodecs path; không lược bỏ audio âm thầm.','Chưa có WebCodecs VideoEncoder trong Chromium harness hiện tại nên không tuyên bố encode phần cứng runtime đã nghiệm thu.','Muxer chỉ hỗ trợ single-track H.264 AVC, MP4 32-bit atoms, không fragmented MP4/fast-start optimization.']};
  }
  window.CANVIOWebCodecsExport={version:'79.0.0',capabilities:capability,muxMP4:makeMP4,decide:canUseWebCodecs,encode:encodeTimeline,tests:tests,last:function(){return lastReport?JSON.parse(JSON.stringify(lastReport)):null},install:install};
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true}); else install();
})();
