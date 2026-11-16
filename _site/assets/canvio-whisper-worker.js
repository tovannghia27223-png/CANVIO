/* CANVIO P59 — hardened user-triggered, browser-local Whisper ASR worker.
 * Runtime is pinned to Transformers.js 3.8.1. The first run downloads the
 * runtime and model weights; Transformers.js stores model files in browser cache.
 * Audio samples are transferred from the page and are never sent to an ASR API.
 */
let transcriberPromise = null;
const MAX_AUDIO_SAMPLES = 480 * 16000;
const ALLOWED_LANGUAGES = new Set(['vietnamese', 'english', 'auto']);

function report(id, type, message, extra = {}) {
  self.postMessage({ id, type, message, ...extra });
}

async function getTranscriber(id) {
  if (!transcriberPromise) {
    transcriberPromise = (async () => {
      report(id, 'status', 'Đang nạp Transformers.js 3.8.1…');
      const transformers = await import('https://esm.sh/@huggingface/transformers@3.8.1');
      if (transformers.env) {
        transformers.env.useBrowserCache = true;
        transformers.env.allowRemoteModels = true;
      }
      report(id, 'status', 'Đang tải model Whisper multilingual (q8)…');
      return transformers.pipeline(
        'automatic-speech-recognition',
        'Xenova/whisper-tiny',
        {
          dtype: 'q8',
          progress_callback: (info) => {
            const status = info && info.status ? String(info.status) : 'loading';
            const file = info && info.file ? String(info.file).split('/').pop() : '';
            const pct = Number.isFinite(Number(info && info.progress)) ? Number(info.progress).toFixed(0) + '%' : '';
            report(id, 'progress', 'Whisper · ' + status + (file ? ' · ' + file : '') + (pct ? ' · ' + pct : ''));
          },
        },
      );
    })().catch((error) => {
      transcriberPromise = null;
      throw error;
    });
  }
  return transcriberPromise;
}

self.addEventListener('message', async (event) => {
  const message = event.data || {};
  if (message.action !== 'transcribe') return;
  const id = message.id;
  try {
    if (!(message.audio instanceof ArrayBuffer)) throw new Error('Dữ liệu waveform không hợp lệ.');
    const samples = new Float32Array(message.audio);
    if (!samples.length) throw new Error('Audio không có sample.');
    if (samples.length > MAX_AUDIO_SAMPLES) throw new Error('Audio vượt giới hạn 8 phút ở 16 kHz.');
    const language = message.language == null ? 'auto' : String(message.language).toLowerCase();
    if (!ALLOWED_LANGUAGES.has(language)) throw new Error('Ngôn ngữ Whisper không nằm trong danh sách hỗ trợ.');
    const transcriber = await getTranscriber(id);
    report(id, 'status', 'Whisper đang nhận dạng audio trên thiết bị…');
    const options = {
      return_timestamps: true,
      chunk_length_s: 30,
      stride_length_s: 5,
      task: 'transcribe',
    };
    // Whisper detects the spoken language when no `language` option is supplied.
    // Do not replace the explicit `auto` choice with the Vietnamese default.
    if (message.language && message.language !== 'auto') options.language = message.language;
    const output = await transcriber(samples, options);
    if (!output || typeof output !== 'object' || typeof output.text !== 'string') {
      throw new Error('Whisper không trả về cấu trúc kết quả hợp lệ.');
    }
    report(id, 'result', 'Hoàn tất', { output });
  } catch (error) {
    report(id, 'error', '', { error: String(error && error.message ? error.message : error) });
  }
});
