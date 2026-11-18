/* CANVIO P105 — local Apache-2.0 Depth Anything V2 Small worker. */
import { env, pipeline } from './p85/transformers/transformers.min.js';
const MODEL='onnx-community/depth-anything-v2-small-ONNX';
const MAX_PIXELS=1024*1024;
let pipelines=new Map();
env.allowRemoteModels=true;
env.allowLocalModels=false;
env.useBrowserCache=true;
if(env.backends&&env.backends.onnx&&env.backends.onnx.wasm){
 env.backends.onnx.wasm.wasmPaths=new URL('./p85/transformers/',self.location.href).href;
 env.backends.onnx.wasm.numThreads=1;
}
function send(type,extra={}){self.postMessage(Object.assign({type},extra));}
async function getPipeline(backend){
 if(pipelines.has(backend))return pipelines.get(backend);
 const promise=pipeline('depth-estimation',MODEL,{
  device:backend==='webgpu'?'webgpu':'wasm',
  dtype:backend==='webgpu'?'fp16':'q8',
  progress_callback:p=>send('progress',{progress:p})
 });
 pipelines.set(backend,promise);
 try{return await promise;}catch(error){pipelines.delete(backend);throw error;}
}
async function estimate(message){
 if(!(message.buffer instanceof ArrayBuffer))throw new Error('Image buffer không hợp lệ.');
 const bitmap=await createImageBitmap(new Blob([message.buffer],{type:message.mime||'image/png'}));
 if(!bitmap.width||!bitmap.height||bitmap.width*bitmap.height>MAX_PIXELS){bitmap.close();throw new Error('Ảnh vượt giới hạn 1 megapixel của worker.');}
 let backend=message.backend||'auto';
 if(backend==='auto')backend=self.navigator&&self.navigator.gpu?'webgpu':'wasm';
 let runner;
 try{runner=await getPipeline(backend);}catch(error){
  if(backend!=='webgpu')throw error;
  backend='wasm';runner=await getPipeline(backend);
 }
 send('ready',{backend,license:'Apache-2.0',model:MODEL});
 try{
  const output=await runner(bitmap);
  const depth=output&&(output.depth||output.depth_map||output.predicted_depth);
  if(!depth||!depth.data||!depth.width||!depth.height)throw new Error('Depth model không trả về ma trận depth hợp lệ.');
  const source=depth.data, length=depth.width*depth.height;
  if(length<1||length>MAX_PIXELS||source.length!==length)throw new Error('Kích thước depth output không hợp lệ.');
  let min=Infinity,max=-Infinity;
  for(let i=0;i<length;i++){const v=Number(source[i]);if(!Number.isFinite(v))throw new Error('Depth output có giá trị không hữu hạn.');if(v<min)min=v;if(v>max)max=v;}
  const bytes=new Uint8Array(length),span=max-min||1;
  for(let i=0;i<length;i++)bytes[i]=Math.max(0,Math.min(255,Math.round((Number(source[i])-min)/span*255)));
  const buffer=bytes.buffer;
  send('result',{width:depth.width,height:depth.height,buffer,backend});
  self.postMessage({type:'done'});
 }finally{bitmap.close();}
}
self.addEventListener('message',event=>{
 const message=event.data||{};
 if(message.type!=='estimate')return;
 estimate(message).catch(error=>send('error',{message:String(error&&error.message||error)}));
});
