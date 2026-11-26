'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{webcrypto}=require('node:crypto');
const root=path.resolve(__dirname,'../..'),sources=[
'canvio-p239-brief-pack.js','canvio-p240-magic-resize.js','canvio-p241-csv-bulk.js','canvio-p242-project-bundle.js','canvio-p243-website-publish.js','canvio-p244-caption-voice.js','canvio-p245-beat-editor.js','canvio-p246-collab-lite.js','canvio-p247-performance-pwa.js','canvio-p248-local-models.js','canvio-p239-p248-ui.js'
];
const project={id:'p239-test',name:'CANVIO QA',brief:'Chiến dịch tuyển dụng HR',goal:'awareness',documents:{}};
const assets=[];
const core={get active(){return project;},create(o){project.id='p-import-'+Date.now();project.name=o.name;project.documents={};return project;},context(){return{projectId:project.id,projectName:project.name,brief:project.brief,goal:project.goal};},capture(){return true;},linkAsset(){return true;}};
const win={CVCreativeCore:core,CV:{assets:{list(){return assets;},async addBlob(file){const x={id:'a'+assets.length,name:file.name,mime:file.type};assets.push(x);return x;},render(){}},engines:{video:{_state(){return{clips:[{id:'c1',type:'text',track:3,text:'Xin chào',start:1.25,duration:2},{id:'v1',type:'video',track:1,start:1.1,duration:4}]};}}}},CVZip:{async build(files){return new Blob(files.map(x=>String(x.data||'')),{type:'application/zip'});}},CVStorageHubP170:{async folderState(){return{state:'granted'};},async saveLocal(){return{ok:true};}},CVComfyP120P126:{async connect(){return{ok:true};}},location:{href:'https://example.test/app',hash:''},setTimeout(){return 1;},clearTimeout(){},setInterval(){return 1;},clearInterval(){},confirm(){return true},performance:{getEntriesByType(){return[];}},speechSynthesis:{cancel(){},getVoices(){return[];},speak(){}},SpeechSynthesisUtterance:function(t){this.text=t;},};
const document={readyState:'complete',visibilityState:'visible',getElementById(){return null;},querySelector(){return null;},querySelectorAll(){return[];},addEventListener(){},createElement(){return{setAttribute(){},appendChild(){},click(){},remove(){},style:{},dataset:{}};},documentElement:{},body:{appendChild(){}}};
class MockDOMParser {
 parseFromString(html) {
  const source=String(html);
  const images=Array.from(source.matchAll(new RegExp("<img\\b([^>]*)>","gi"))).map(m=>({
   hasAttribute(k){return k==='alt'&&new RegExp("\\balt\\s*=\\s*(['\"])(.*?)\\1","i").test(m[1]);},
   getAttribute(){const x=m[1].match(new RegExp("\\balt\\s*=\\s*(['\"])(.*?)\\1","i"));return x?x[2]:'';}
  }));
  return {
   querySelector(sel) {
    if(sel==='title'){const m=source.match(new RegExp("<title[^>]*>([\\s\\S]*?)</title>","i"));return m?{textContent:m[1]}:null;}
    if(sel==='meta[name="description"]'){const m=source.match(new RegExp("<meta[^>]*name=['\"]description['\"][^>]*content=['\"]([^'\"]*)['\"]","i"));return m?{content:m[1]}:null;}
    return null;
   },
   querySelectorAll(sel){return sel==='h1'?Array.from(source.matchAll(new RegExp("<h1\\b","gi"))):[];},
   images
  };
 }
}
Object.assign(win,{window:win,document,crypto:webcrypto,Blob,File:global.File||class File extends Blob{constructor(parts,name,opts){super(parts,opts);this.name=name;}},URL,TextEncoder,TextDecoder,DOMParser:MockDOMParser,navigator:{serviceWorker:null},fetch:async()=>{throw new Error('network disabled in test');},getComputedStyle(){return{getPropertyValue(){return'#F83E9F';}};},btoa:s=>Buffer.from(s,'binary').toString('base64'),atob:s=>Buffer.from(s,'base64').toString('binary'),unescape,escape,Date,Math,JSON,Array,Object,String,Number,Boolean,RegExp,Promise,Map,Set,Uint8Array,Uint32Array,DataView,Intl});
const ctx={...win,window:win,document,navigator:win.navigator,crypto:webcrypto,DOMParser:MockDOMParser,getComputedStyle:win.getComputedStyle,URL,Blob:win.Blob,File:win.File,TextEncoder,TextDecoder,fetch:win.fetch,setTimeout:win.setTimeout,setInterval:win.setInterval,clearTimeout:win.clearTimeout,clearInterval:win.clearInterval,console,performance:win.performance,confirm:win.confirm,btoa:win.btoa,atob:win.atob,unescape,escape};
for(const file of sources){const p=path.join(root,file);if(!fs.existsSync(p))throw new Error('Missing source '+file);vm.runInNewContext(fs.readFileSync(p,'utf8'),ctx,{filename:file,timeout:10000});}
const suites=[
['P239',()=>{const r=win.CVBriefPackP239.build('Chiến dịch tuyển dụng nhân sự cho doanh nghiệp');assert.equal(r.ok,true);assert.equal(Object.keys(r.documents).length,5);assert.equal(win.CVBriefPackP239.tests().fiveKinds,true);}],
['P240',()=>{const r=win.CVMagicResizeP240.tests();assert.ok(Object.values(r).every(Boolean),JSON.stringify(r));}],
['P241',()=>{const r=win.CVBulkP241.tests();assert.ok(Object.values(r).every(Boolean),JSON.stringify(r));const p=win.CVBulkP241.parseCSV('name,role\n"Nguyễn, A",HR');assert.equal(p.rows[0].name,'Nguyễn, A');}],
['P242',()=>{const r=win.CVProjectBundleP242.tests();assert.equal(r.crc32,true);assert.equal(r.projectOwner,true);assert.equal(r.assetRelink,true);assert.equal(r.secretScrub,true);const q=win.CVProjectBundleP242.sanitizeProject({name:'ok',apiKey:'do-not-export',documents:{refreshToken:'bad',title:'Keep'}});assert.equal(q.excludedSecretFields,2);assert.equal(q.project.apiKey,undefined);assert.equal(q.project.documents.refreshToken,undefined);assert.equal(q.project.documents.title,'Keep');}],
['P243',()=>{const r=win.CVWebsitePublishP243.tests();assert.equal(r.seoPass,true);assert.equal(r.rejectTraversal,true);}],
['P244',()=>{const r=win.CVCaptionVoiceP244.tests();assert.equal(r.srtTime,true);}],
['P245',()=>{const r=win.CVBeatEditorP245.tests();assert.equal(r.nonDestructive,true);assert.equal(r.durationBound,300);assert.equal(r.fileSizeBound,40*1024*1024);}],
['P246',()=>{const r=win.CVCollabLiteP246.tests();assert.equal(r.readOnlyPayload,true);}],
['P247',()=>{const r=win.CVPerformanceP247.tests();assert.equal(r.honestCodeSplitFlag,true);}],
['P248',()=>{const r=win.CVLocalModelsP248.tests();assert.equal(r.sevenGbRecommendation,true);}],
['UI',()=>{const r=win.CVStudioProUI239248.tests();assert.ok(r.p240Api&&r.p241Api&&r.p242Api&&r.p243Api&&r.p244Api&&r.p245Api&&r.p246Api&&r.p247Api&&r.p248Api);assert.equal(typeof win.CVStudioProUI239248.mountNow,'function');}]
];
let pass=0;for(const [name,fn] of suites){try{fn();pass++;console.log('PASS '+name);}catch(e){console.error('FAIL '+name+': '+e.message);process.exitCode=1;}}
console.log(pass+'/'+suites.length+' P239–P248 checks passed.');
