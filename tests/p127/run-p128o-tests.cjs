const fs=require('fs'),vm=require('vm');
const js=fs.readFileSync(__dirname+'/../../canvio-p128-orchestrator.js','utf8');
const h=fs.readFileSync(__dirname+'/../../index.html','utf8'),m=h.match(/<script id="canvio-lot128o">([\s\S]*?)<\/script>/);
let bad=0;const ck=(n,v)=>{if(v!==true){console.log('FAIL',n);bad++}};
if(!m){console.log('FAIL lot missing');process.exit(1)}
ck('embedded equals standalone',m[1].replace(/\r\n/g,'\n').trim()===js.replace(/\r\n/g,'\n').trim());
(async()=>{for(const [name,src] of [['standalone',js],['embedded',m[1]]]){
  const store={};const calls=[];
  const sb={window:{CVAIProviderAdapter:{call:(p,o)=>{calls.push(o.provider);return sb.behavior[o.provider](p)}}},behavior:{},document:{readyState:'loading',addEventListener(){}},localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v}},console,Math,Array,String,Number,Object,JSON,Promise,Map,Date,setTimeout,clearTimeout};
  vm.createContext(sb);vm.runInContext(src,sb);const O=sb.window.CVOrchestratorP128;ck(name+' api',!!O);if(!O)continue;
  const reset=()=>{O.reset();calls.length=0;sb.behavior={local:async()=>'LOCAL OK',gemini:async()=>'GEMINI OK'}};
  reset();let r=await O.run({prompt:'viết brief'});ck(name+' local first',r.ok&&r.tier==='local'&&r.text==='LOCAL OK'&&calls.join()==='local');
  r=await O.run({prompt:'viết brief'});ck(name+' cache hit no call',r.cached===true&&calls.length===1);
  reset();sb.behavior.local=async()=>{throw new Error('ECONNREFUSED')};r=await O.run({prompt:'a'});ck(name+' falls back to gemini',r.ok&&r.tier==='gemini'&&r.tried.length===1&&r.tried[0].tier==='local'&&calls.join()==='local,gemini');
  ck(name+' stats recorded',O.stats().local.fail===1&&O.stats().gemini.ok===1&&O.stats().local.lastError.indexOf('ECONNREFUSED')>=0);
  reset();sb.behavior.local=async()=>{throw new Error('x')};sb.behavior.gemini=async()=>{throw new Error('NO_KEY')};r=await O.run({prompt:'b'});ck(name+' all fail reported',!r.ok&&r.status==='failed'&&r.tried.length===2&&/NO_KEY/.test(r.message)&&calls.length===2);
  reset();sb.behavior.local=async()=>'   ';r=await O.run({prompt:'c'});ck(name+' empty answer falls through',r.ok&&r.tier==='gemini');
  reset();r=await O.run({kind:'image',prompt:'a cat'});ck(name+' image unconfigured honest',!r.ok&&r.status==='unconfigured'&&calls.length===0);
  O.register('image','local',async()=>({url:'blob:x'}));r=await O.run({kind:'image',prompt:'a cat',tiers:['local']});ck(name+' registered handler runs',r.ok&&r.tier==='local'&&r.text.url==='blob:x');
  reset();r=await O.run({prompt:'d',tiers:['gemini','local']});ck(name+' explicit tier order',r.tier==='gemini'&&calls.join()==='gemini');
  O.setOrder('gemini-only');ck(name+' order persisted',store['canvio128:tiers']==='gemini-only'&&O.order()==='gemini-only');reset();r=await O.run({prompt:'e'});ck(name+' gemini-only uses only gemini',r.tier==='gemini'&&calls.join()==='gemini');
  let e1=false;try{O.setOrder('hack')}catch(e){e1=true}ck(name+' rejects bad order',e1);
  O.setOrder('local-first');reset();let rej=0;for(const t of [{prompt:''},{prompt:'x'.repeat(20001)}]){try{await O.run(t)}catch(e){rej++}}ck(name+' rejects empty/huge prompt',rej===2);
  reset();sb.behavior.local=()=>new Promise(()=>{});r=await O.run({prompt:'slow',timeoutMs:30});ck(name+' timeout falls back',r.ok&&r.tier==='gemini'&&/Quá thời gian/.test(r.tried[0].error));
  reset();let big=0;for(let i=0;i<60;i++)await O.run({prompt:'p'+i});r=await O.run({prompt:'p0'});ck(name+' cache bounded (oldest evicted)',r.cached===false);
  ck(name+' one call per tier per action',calls.filter(x=>x==='local').length<=61);
}
console.log(bad?'P128o FAIL':'P128o OK');process.exit(bad?1:0)})();
