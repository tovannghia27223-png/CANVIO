/* CANVIO P105 — Depth Anything V2 Small local depth-estimation worker.
 * Transformers.js 3.8.1/ONNX WASM are self-hosted; model weights are fetched only after an explicit user action.
 * Model card: onnx-community/depth-anything-v2-small-ONNX (Apache-2.0).
 */
'use strict';
const MODEL_ID='onnx-community/depth-anything-v2-small-ONNX';
const TRANSFORMERS_URL='./p85/transformers/transformers.min.js';
const MAX_PIXELS=1024*1024;
let pipelinePromise=null;
let requestSequence=0;
function post(type,extra={},transfer=[]){const payload=Object.assign({type:type},extra);if(transfer&&transfer.length)self.postMessage(payload,transfer);else self.postMessage(payload);}
function progress(info){const p=info||{};post('progress',{progress:{status:String(p.status||'loading'),file:p.file?String(p.file).split('/').pop():'',progress:Number.isFinite(Number(p.progress))?Number(p.progress):null}});}
async function loadEstimator(backend){
 if(pipelinePromise)return pipelinePromise;
 pipelinePromise=(async()=>{
  post('status',{message:'Đang nạp Transformers.js 3.8.1…'});
  const transformers=await import(TRANSFORMERS_URL);
  if(transformers.env){transformers.env.useBrowserCache=true;transformers.env.allowRemoteModels=true;if(transformers.env.backends&&transformers.env.backends.onnx&&transformers.env.backends.onnx.wasm){transformers.env.backends.onnx.wasm.wasmPaths=new URL('./p85/transformers/',self.location.href).href;transformers.env.backends.onnx.wasm.numThreads=1;}}
  const canUseWebGPU=backend!=='wasm'&&typeof navigator!=='undefined'&&navigator.gpu&&typeof navigator.gpu.requestAdapter==='function';
  if(canUseWebGPU){try{post('status',{message:'Đang khởi tạo Depth Anything V2 WebGPU fp16…'});const adapter=await navigator.gpu.requestAdapter();if(!adapter)throw new Error('Không tìm thấy WebGPU adapter.');const estimator=await transformers.pipeline('depth-estimation',MODEL_ID,{device:'webgpu',dtype:'fp16',progress_callback:progress});post('ready',{backend:'webgpu-fp16',license:'Apache-2.0'});return{estimator,backend:'webgpu-fp16'};}catch(error){post('status',{message:'WebGPU không sẵn sàng; chuyển sang WASM/CPU q4…'});pipelinePromise=null;}}
  const estimator=await transformers.pipeline('depth-estimation',MODEL_ID,{device:'wasm',dtype:'q4',progress_callback:progress});post('ready',{backend:'wasm-q4',license:'Apache-2.0'});return{estimator,backend:'wasm-q8'};
 })().catch(error=>{pipelinePromise=null;throw error;});
 return pipelinePromise;
}
function normalizeDepth(raw){
 if(!raw||!raw.data||!raw.width||!raw.height)throw new Error('Model không trả về depth map hợp lệ.');
 const count=raw.width*raw.height;if(count>MAX_PIXELS)throw new Error('Depth map vượt giới hạn 1 megapixel.');
 const source=raw.data,values=new Float32Array(count);let min=Infinity,max=-Infinity;
 for(let i=0;i<count;i++){const value=Number(source[i]);if(!Number.isFinite(value))throw new Error('Depth map chứa giá trị không hữu hạn.');values[i]=value;if(value<min)min=value;if(value>max)max=value;}
 const span=max-min,output=new Uint8Array(count);if(span<=1e-8)output.fill(127);else for(let i=0;i<count;i++)output[i]=Math.max(0,Math.min(255,Math.round((values[i]-min)/span*255)));
 return{width:raw.width,height:raw.height,bytes:output};
}
self.addEventListener('message',async event=>{
 const message=event.data||{};if(message.type!=='estimate')return;const requestId=++requestSequence;
 try{
  if(!(message.buffer instanceof ArrayBuffer))throw new Error('Dữ liệu ảnh không hợp lệ.');
  if(message.buffer.byteLength<1||message.buffer.byteLength>10*1024*1024)throw new Error('Ảnh vượt giới hạn 10 MiB hoặc rỗng.');
  const blob=new Blob([message.buffer],{type:String(message.mime||'image/png')});
  const loaded=await loadEstimator(String(message.backend||'auto'));if(requestId!==requestSequence)return;
  post('status',{message:'Đang ước lượng chiều sâu trên thiết bị…'});
  const output=await loaded.estimator(blob);if(requestId!==requestSequence)return;
  const rawDepth=output&&(output.depth||output.depth_map);if(!rawDepth)throw new Error('Pipeline không trả về ảnh depth; cần kiểm tra lại model/runtime version.');
  const normalized=normalizeDepth(rawDepth),buffer=normalized.bytes.buffer;
  post('result',{width:normalized.width,height:normalized.height,backend:loaded.backend,buffer},[buffer]);
 }catch(error){post('error',{message:String(error&&error.message?error.message:error)});}
});
