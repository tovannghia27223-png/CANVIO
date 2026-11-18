/* CANVIO P102 — ORMBG local background-removal worker.
 * Transformers.js 3.8.1/ONNX WASM are self-hosted; model weights are fetched only after an explicit user action.
 * Model card: Orangebot/ormbg-ONNX (Apache-2.0).
 */
'use strict';
const MODEL_ID='Orangebot/ormbg-ONNX';
const TRANSFORMERS_URL='./p85/transformers/transformers.min.js';
const MAX_PIXELS=1024*1024;
let pipelinePromise=null;
let activeRequest=0;
function post(type,extra={},transfer=[]){const payload=Object.assign({type:type},extra);if(transfer&&transfer.length)self.postMessage(payload,transfer);else self.postMessage(payload);}
function progress(info){const p=info||{};post('progress',{progress:{status:String(p.status||'loading'),file:p.file?String(p.file).split('/').pop():'',progress:Number.isFinite(Number(p.progress))?Number(p.progress):null}});}
async function loadPipeline(backend){
 if(pipelinePromise)return pipelinePromise;
 pipelinePromise=(async()=>{
  post('status',{message:'Đang nạp Transformers.js 3.8.1…'});
  const transformers=await import(TRANSFORMERS_URL);
  if(transformers.env){transformers.env.useBrowserCache=true;transformers.env.allowRemoteModels=true;if(transformers.env.backends&&transformers.env.backends.onnx&&transformers.env.backends.onnx.wasm){transformers.env.backends.onnx.wasm.wasmPaths=new URL('./p85/transformers/',self.location.href).href;transformers.env.backends.onnx.wasm.numThreads=1;}}
  const canUseWebGPU=backend!=='wasm'&&typeof navigator!=='undefined'&&navigator.gpu&&typeof navigator.gpu.requestAdapter==='function';
  if(canUseWebGPU){try{post('status',{message:'Đang khởi tạo ORMBG WebGPU fp16…'});const adapter=await navigator.gpu.requestAdapter();if(!adapter)throw new Error('Không tìm thấy WebGPU adapter.');const segmenter=await transformers.pipeline('background-removal',MODEL_ID,{device:'webgpu',dtype:'fp16',progress_callback:progress});post('ready',{backend:'webgpu-fp16',license:'Apache-2.0'});return{segmenter,backend:'webgpu-fp16'};}catch(error){post('status',{message:'WebGPU không sẵn sàng; chuyển sang WASM/CPU uint8…'});pipelinePromise=null;}}
  const segmenter=await transformers.pipeline('background-removal',MODEL_ID,{device:'wasm',dtype:'uint8',progress_callback:progress});post('ready',{backend:'wasm-uint8',license:'Apache-2.0'});return{segmenter,backend:'wasm-uint8'};
 })().catch(error=>{pipelinePromise=null;throw error;});
 return pipelinePromise;
}
self.addEventListener('message',async event=>{
 const message=event.data||{};if(message.type!=='remove')return;const requestId=++activeRequest;
 try{
  if(!(message.buffer instanceof ArrayBuffer))throw new Error('Dữ liệu ảnh không hợp lệ.');
  if(message.buffer.byteLength<1||message.buffer.byteLength>12*1024*1024)throw new Error('Ảnh vượt giới hạn 12 MiB hoặc rỗng.');
  const blob=new Blob([message.buffer],{type:String(message.mime||'image/png')});
  const loaded=await loadPipeline(String(message.backend||'auto'));if(requestId!==activeRequest)return;
  post('status',{message:'Đang tách nền trong trình duyệt…'});
  const output=await loaded.segmenter(blob);if(requestId!==activeRequest)return;
  const result=Array.isArray(output)?output[0]:output;
  if(!result||!result.data||!result.width||!result.height)throw new Error('Model không trả về ảnh hợp lệ.');
  if(result.width*result.height>MAX_PIXELS)throw new Error('Kết quả vượt giới hạn 1 megapixel.');
  if(typeof result.rgba==='function')result.rgba();
  if(result.channels!==4)throw new Error('Model không trả về RGBA có alpha.');
  const data=result.data,buffer=data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength);
  post('result',{width:result.width,height:result.height,backend:loaded.backend,buffer},[buffer]);
 }catch(error){post('error',{message:String(error&&error.message?error.message:error)});}
});
