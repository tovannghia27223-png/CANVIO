'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
const storage=Object.create(null),assets=[{id:'asset-1',name:'Reference hero.png',mime:'image/png',data:'data:image/png;base64,AA=='}],handlers=Object.create(null);
const project={id:'p160-test',name:'CANVIO Test Project',brief:'Chiến dịch HR giới thiệu nhân tài',goal:'Tạo video giới thiệu',channel:'Website và video',assetIds:[],documents:{}};
const localStorage={getItem:k=>Object.prototype.hasOwnProperty.call(storage,k)?storage[k]:null,setItem:(k,v)=>{storage[k]=String(v);},removeItem:k=>{delete storage[k];}};
const core={get active(){return project;},create(){return project;},context(){return{projectId:project.id,projectName:project.name,brief:project.brief,goal:project.goal,channel:project.channel,assetIds:project.assetIds.slice()};},capture(){return true;},linkAsset(id){if(!project.assetIds.includes(id))project.assetIds.push(id);return true;},unlinkAsset(id){project.assetIds=project.assetIds.filter(x=>x!==id);return true;}};
const CV={assets:{list(){return assets.slice();},addBlob(){return Promise.resolve();},remove(id){const i=assets.findIndex(x=>x.id===id);if(i>=0)assets.splice(i,1);return Promise.resolve();},render(){}}};
const O={register(kind,tier,fn){(handlers[kind]||(handlers[kind]=Object.create(null)))[tier]=fn;},run(task){const fn=handlers[task.kind]&&handlers[task.kind][(task.tiers||['local'])[0]];if(!fn)return Promise.resolve({ok:false,message:'missing local handler'});return Promise.resolve().then(()=>fn(task)).then(text=>({ok:true,tier:'local',text:String(text)}),e=>({ok:false,message:e.message}));}};
const document={readyState:'loading',addEventListener(){},getElementById(){return null;},dispatchEvent(){},createElement(){return{};}};
const window={CV,CVCreativeCore:core,CVOrchestratorP128:O,CVZip:{build:async files=>new Blob(files.map(x=>x.data))},addEventListener(){},dispatchEvent(){},CustomEvent:function(type,init){this.type=type;this.detail=init&&init.detail;},URL,Blob,performance:{now:()=>Date.now()}};
const sandbox={window,document,localStorage,CV,CVCreativeCore:core,CVOrchestratorP128:O,URL,Blob,Promise,console,setTimeout,clearTimeout,Date,Math,Number,String,Array,Object,JSON,RegExp,Set,Map,Error,parseInt,isNaN};
vm.createContext(sandbox);
const files=['canvio-p160-collections.js','canvio-p161-spatial-workspace.js','canvio-p162-reference-canvas.js','canvio-p163-character-continuity.js','canvio-p164-shotlist.js','canvio-p165-ai-workflow.js','canvio-p166-landing-studio.js'];
for(const file of files)vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),sandbox,{filename:file});
const suites=[
 ['P160',window.CVInspirationCollectionsP160],
 ['P161',window.CVSpatialWorkspaceP161],
 ['P162',window.CVReferenceCanvasP162],
 ['P163',window.CVCharacterContinuityP163],
 ['P164',window.CVShotListP164],
 ['P165',window.CVAiWorkflowP165],
 ['P166',window.CVLandingStudioP166]
];
(async()=>{
 const report={suite:'CANVIO P160–P166 shared integration',checks:{},failures:[]};
 for(const [name,api] of suites){
  assert(api,name+' module must register');
  const result=api.tests();
  Object.entries(result).forEach(([k,v])=>{report.checks[name+'.'+k]=!!v;if(!v)report.failures.push(name+'.'+k);});
 }
 const workflow=window.CVAiWorkflowP165.create('End-to-end local workflow');
 assert(workflow.ok,'P165 workflow creation');
 const mood=await window.CVInspirationCollectionsP160.sendToStudio(window.CVInspirationCollectionsP160.read()[0].id);\n report.checks['P160.P128MoodboardHandoff']=mood.ok&&mood.detail.prompt.includes('[MOODBOARD]');\n const zipPackage=await window.CVInspirationCollectionsP160.exportZip();\n report.checks['P160.metadataZipExport']=!!zipPackage.blob&&zipPackage.bytes>0;\n const run=await window.CVAiWorkflowP165.run(workflow.workflow.id,'Brief chiến dịch HR: giới thiệu nhân tài với visual màu xanh, góc máy wide và CTA đăng ký');
 const revisionWorkflow=window.CVAiWorkflowP165.create('Bounded revision test',['scriptwriter','evaluator','reviser']);\n const revisionRun=await window.CVAiWorkflowP165.run(revisionWorkflow.workflow.id,'x');\n report.checks['P165.boundedRevisionCycle']=revisionRun.ok&&revisionRun.run.cycles===2&&revisionRun.run.log.filter(x=>x.role==='evaluator').length===2&&revisionRun.run.log.some(x=>x.role==='reviser');
 report.checks['P165.localWorkflowRuns']=run.ok&&run.run.status==='completed'&&run.run.log.length>=3;
 report.checks['P165.explicitNoInferenceBoundary']=run.run.claim.includes('no model inference');
 report.checks['SharedCore.singleProjectDocumentOwner']=['inspirationCollections','spatialWorkspace','referenceCanvas','characterContinuity','aiWorkflows','websiteLanding'].every(k=>Object.prototype.hasOwnProperty.call(project.documents,k));
 report.checks['SharedCore.assetsLinked']=project.assetIds.includes('asset-1');
 report.checks['NoNewDatabaseKeys']=Object.keys(storage).every(k=>k==='canvio5:media_video_project_v1');
 for(const [k,v] of Object.entries(report.checks))if(!v)report.failures.push(k);
 report.passed=Object.values(report.checks).filter(Boolean).length;report.total=Object.keys(report.checks).length;
 console.log(JSON.stringify(report,null,2));
 if(report.failures.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});