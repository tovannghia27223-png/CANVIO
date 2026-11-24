'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),storage=Object.create(null),assets=[];
let assetSeq=0,registered={};
const project={id:'project-test',name:'Test CANVIO',brief:'Chiến dịch giới thiệu sản phẩm',goal:'Video / phim ngắn',channel:'Đa kênh',assetIds:[],documents:{},activity:[]};
const localStorage={getItem(k){return Object.prototype.hasOwnProperty.call(storage,k)?storage[k]:null;},setItem(k,v){storage[k]=String(v);},removeItem(k){delete storage[k];}};
const core={
 get active(){return project;},create(){return project;},
 capture(module){if(module==='videoStudio'){try{project.documents.video=JSON.parse(localStorage.getItem('canvio5:media_video_project_v1')||'null');}catch(e){}}return true;},
 linkAsset(id){if(!project.assetIds.includes(id))project.assetIds.push(id);return true;},
 unlinkAsset(id){project.assetIds=project.assetIds.filter(x=>x!==id);return true;},
 context(){return{projectId:project.id,projectName:project.name,brief:project.brief,goal:project.goal,channel:project.channel,assetIds:project.assetIds.slice()};}
};
class FakeFile extends Blob{constructor(parts,name,opts){super(parts,opts);this.name=name;}}
class FakeCanvas{constructor(){this.width=1;this.height=1;}getContext(){return{drawImage(){},getImageData(){const data=new Uint8ClampedArray(64*64*4);for(let i=0;i<data.length;i+=4){data[i]=240;data[i+1]=120;data[i+2]=40;data[i+3]=255;}return{data};}};}toDataURL(type){return'data:'+(type||'image/jpeg')+';base64,AA==';}}
class FakeImage{set src(v){this._src=v;this.naturalWidth=16;this.naturalHeight=8;this.onload&&this.onload();}get src(){return this._src;}}
const document={readyState:'loading',addEventListener(){},createElement(tag){return tag==='canvas'?new FakeCanvas():{};},dispatchEvent(){},getElementById(){return null;}};
const CV={toast(){},brand:{paint(){}},assets:{
 list(){return assets.slice();},
 addBlob(file){assets.unshift({id:'asset-'+(++assetSeq),name:file.name,mime:file.type,size:file.size,data:'data:'+file.type+';base64,AA==',cat:'image'});return Promise.resolve();},
 render(){},remove(id){const i=assets.findIndex(x=>x.id===id);if(i>=0)assets.splice(i,1);return Promise.resolve();}
}};
const O={register(kind,tier,fn){registered[kind+':'+tier]=fn;},run(task){const fn=registered[task.kind+':'+task.tiers[0]];return fn?Promise.resolve(fn(task)).then(text=>({ok:true,tier:task.tiers[0],text})):Promise.resolve({ok:false,message:'missing handler'});}};
const window={CV,CVCreativeCore:core,CVOrchestratorP128:O,File:FakeFile,Blob,Uint8Array,atob:s=>Buffer.from(s,'base64').toString('binary'),addEventListener(){},dispatchEvent(){},URL,CustomEvent:function(type,init){this.type=type;this.detail=init&&init.detail;}};
const sandbox={window,document,CV,CVCreativeCore:core,CVOrchestratorP128:O,localStorage,LS:{get(k,fb){return k==='brand'?(JSON.parse(storage.brand||'null')||fb):k==='assets'?assets:fb;},set(k,v){if(k==='brand')storage.brand=JSON.stringify(v);if(k==='assets')assets.splice(0,assets.length,...v);return true;}},File:FakeFile,Blob,Uint8Array,atob:window.atob,Image:FakeImage,URL,CustomEvent:window.CustomEvent,console,setTimeout,Promise,Math,Number,String,Array,Object,JSON,Date,Error,Set,Map,RegExp,parseInt,isNaN,Event:function(type){this.type=type;}};
vm.createContext(sandbox);
for(const file of ['canvio-p153-board.js','canvio-p155-scene-pack.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),sandbox,{filename:file});
(async function(){
 const B=window.CVBoardP153,S=window.CVScenePackP155;assert(B&&S,'P153/P155 modules registered');
 const item=await B.addDataUrl('data:image/png;base64,AA==',{name:'Reference',kind:'Cảnh',extra:{yaw:35,pitch:4,fov:70}});
 assert(item.assetId,'P153 stores image in canonical Asset Library');
 assert.equal(B.list()[0].id,item.id,'P153 keeps stable board item ID');
 assert.equal(project.documents.inspirationBoard.items[0].assetId,item.assetId,'P153 metadata lives in Shared Core');
 assert(assets.some(a=>a.id===item.assetId&&a.canvioScene&&a.canvioScene.boardItemId===item.id&&a.canvioScene.yaw===35),'Asset Library stores panorama metadata');
 assert(project.assetIds.includes(item.assetId),'Asset is linked to current Core project');
 const ch=S.saveCard({type:'character',name:'Nhân vật A',desc:'Áo khoác xanh, tóc ngắn',refs:[item.id]});
 const sp=S.saveCard({type:'space',name:'Không gian A',desc:'Văn phòng sáng, cửa kính'});
 assert(ch.ok&&sp.ok,'P155 saves character and space cards');
 assert.equal(project.documents.scenePack.cards.length,2,'Cards are persisted in Core project documents');
 const prompt=await S.runPrompt({action:'bước vào phòng họp',roles:{character:{cardId:ch.card.id,ref:'ảnh nhân vật'},environment:{cardId:sp.card.id,ref:'ảnh không gian'},camera:{shotId:'wide-follow'}}});
 assert(prompt.ok&&prompt.orchestrated&&prompt.prompt.includes('[Brief dự án]')&&prompt.prompt.includes('[Nhân vật]'),'P156 prompt routed through P128 and includes Shared Core brief');
 localStorage.setItem('canvio5:media_video_project_v1',JSON.stringify({name:'Video hiện tại',shots:[{id:'existing-shot'}],media:[]}));
 const assigned=S.assignToStoryboard({title:'Cảnh 01',action:'bước vào phòng họp',prompt:prompt.prompt,shotSeconds:5,roles:{character:{cardId:ch.card.id},environment:{cardId:sp.card.id},camera:{shotId:'wide-follow'}}});
 assert(assigned.ok,'P156 assigns scene to native Video Studio project');
 const video=JSON.parse(localStorage.getItem('canvio5:media_video_project_v1'));
 assert.equal(video.shots.length,2,'Appending preserves existing Storyboard shots');
 assert(video.shots[1].scenePack.assetIds.includes(item.assetId),'Shot carries the linked reference asset ID');
 assert(project.documents.video&&project.documents.video.shots.length===2,'Shared Core captures the Storyboard snapshot');
 const camera=S.assignShotToStoryboard('pov');
 assert(camera.ok&&JSON.parse(localStorage.getItem('canvio5:media_video_project_v1')).shots.length===3,'P157 preset appends a shot to the existing Storyboard');
 assert(!Object.keys(storage).some(k=>k==='canvio.p153.board'||k==='canvio.p155.cards'),'New content does not create the old parallel localStorage stores');
 console.log(JSON.stringify({suite:'P159 Shared Creative Core integration',passed:13,total:13,failed:[]},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});