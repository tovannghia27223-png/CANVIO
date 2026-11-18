/* CANVIO P102 — local Apache-2.0 ORMBG inference worker. */
import { env, pipeline } from './p85/transformers/transformers.min.js';
const MODEL='Orangebot/ormbg-ONNX';
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
 const promise=pipeline('background-removal',MODEL,{
  device:backend==='webgpu'?'webgpu':'wasm',
  dtype:backend==='webgpu'?'fp16':'uint8',
  progress_callback:p=>send('progress',{progress:p})
 });
 pipelines.set(backend,promise);
 try{return await promise;}catch(error){pipelines.delete(backend);throw error;}
}
async function remove(message){
 if(!(message.buffer instanceof ArrayBuffer))throw new Error('Image buffer không hợp lệ.');
 const blob=new Blob([message.buffer],{type:message.mime||'image/png'});
 const bitmap=await createImageBitmap(blob);
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
  const result=await runner(bitmap);
  const image=Array.isArray(result)?result[0]:result;
  if(!image||!image.data||!image.width||!image.height)throw new Error('ORMBG không trả về ảnh alpha hợp lệ.');
  const pixels=image.data instanceof Uint8Array?image.data:new Uint8Array(image.data.buffer||image.data);
  if(pixels.length!==image.width*image.height*4)throw new Error('ORMBG output không có RGBA alpha đầy đủ.');
  const buffer=pixels.buffer.slice(pixels.byteOffset,pixels.byteOffset+pixels.byteLength);
  send('result',{width:image.width,height:image.height,buffer,backend});
  self.postMessage({type:'done'});
 }finally{bitmap.close();}
}
self.addEventListener('message',event=>{
 const message=event.data||{};
 if(message.type!=='remove')return;
 remove(message).catch(error=>send('error',{message:String(error&&error.message||error)}));
});
