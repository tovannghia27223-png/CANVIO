/* CANVIO P59/P80 — local-only Whisper Tiny multilingual worker. */
import { env, pipeline } from './p85/transformers/transformers.min.js';
const MODEL='Xenova/whisper-tiny';
const MAX_AUDIO_SAMPLES=480*16000;
const ALLOWED_LANGUAGES=new Set(['vietnamese','english','auto']);
let transcriberPromise=null;
env.allowRemoteModels=true;env.allowLocalModels=false;env.useBrowserCache=true;
if(env.backends&&env.backends.onnx&&env.backends.onnx.wasm){
 env.backends.onnx.wasm.wasmPaths=new URL('./p85/transformers/',self.location.href).href;
 env.backends.onnx.wasm.numThreads=1;
}
function report(id,type,message,extra={}){self.postMessage(Object.assign({id,type,message},extra));}
async function getTranscriber(id){
 if(!transcriberPromise){
  report(id,'status','Đang nạp Transformers.js 3.8.1 từ CANVIO local runtime…');
  transcriberPromise=pipeline('automatic-speech-recognition',MODEL,{
   device:'wasm',dtype:'q8',
   progress_callback:info=>{
    const status=info&&info.status?String(info.status):'loading';
    const file=info&&info.file?String(info.file).split('/').pop():'';
    const pct=Number.isFinite(Number(info&&info.progress))?Number(info.progress).toFixed(0)+'%':'';
    report(id,'progress','Whisper · '+status+(file?' · '+file:'')+(pct?' · '+pct:''));
   }
  }).catch(error=>{transcriberPromise=null;throw error;});
 }
 return transcriberPromise;
}
self.addEventListener('message',async event=>{
 const message=event.data||{};if(message.action!=='transcribe')return;
 const id=message.id;
 try{
  if(!(message.audio instanceof ArrayBuffer))throw new Error('Dữ liệu waveform không hợp lệ.');
  const samples=new Float32Array(message.audio);
  if(!samples.length)throw new Error('Audio không có sample.');
  if(samples.length>MAX_AUDIO_SAMPLES)throw new Error('Audio vượt giới hạn 8 phút ở 16 kHz.');
  const language=message.language==null?'auto':String(message.language).toLowerCase();
  if(!ALLOWED_LANGUAGES.has(language))throw new Error('Ngôn ngữ Whisper không nằm trong danh sách hỗ trợ.');
  const transcriber=await getTranscriber(id);
  report(id,'status','Whisper đang nhận dạng audio trên thiết bị…');
  const options={return_timestamps:true,chunk_length_s:30,stride_length_s:5,task:'transcribe'};
  if(message.language&&message.language!=='auto')options.language=message.language;
  const output=await transcriber(samples,options);
  if(!output||typeof output!=='object'||typeof output.text!=='string')throw new Error('Whisper không trả về cấu trúc kết quả hợp lệ.');
  report(id,'result','Hoàn tất',{output});
 }catch(error){report(id,'error','',{error:String(error&&error.message||error)});}
});
