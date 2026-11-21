'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');

const root=path.resolve(__dirname,'../..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'source-module-map.json'),'utf8'));
const normalize=s=>String(s).replace(/\r\n?/g,'\n').trim();
const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
const failures=[];
const results=[];

for(const item of manifest.modules){
  const sourcePath=path.join(root,item.source);
  if(!fs.existsSync(sourcePath)){
    failures.push({source:item.source,scriptId:item.scriptId,error:'standalone source missing'});
    continue;
  }
  const source=fs.readFileSync(sourcePath,'utf8');
  let standaloneSyntax=true,embeddedSyntax=true;
  try{new vm.Script(source,{filename:item.source});}catch(e){standaloneSyntax=false;failures.push({source:item.source,scriptId:item.scriptId,error:'standalone syntax: '+e.message});}
  const found=scripts.filter(m=>{
    const id=(m[1].match(/(?:^|\s)id\s*=\s*(["'])(.*?)\1/i)||[])[2];
    return id===item.scriptId;
  });
  if(found.length!==1){
    failures.push({source:item.source,scriptId:item.scriptId,error:'expected exactly one embedded script lot; found '+found.length});
    results.push({source:item.source,scriptId:item.scriptId,standaloneSyntax,embeddedCount:found.length,parity:false});
    continue;
  }
  const embedded=found[0][2];
  try{new vm.Script(embedded,{filename:item.scriptId+'.js'});}catch(e){embeddedSyntax=false;failures.push({source:item.source,scriptId:item.scriptId,error:'embedded syntax: '+e.message});}
  const parity=normalize(embedded)===normalize(source);
  if(!parity)failures.push({source:item.source,scriptId:item.scriptId,error:'standalone/embedded source mismatch'});
  if(/^\s*import\s/m.test(source))failures.push({source:item.source,scriptId:item.scriptId,error:'ES module import found in classic inline-lot source'});
  if(/<\/script/i.test(source))failures.push({source:item.source,scriptId:item.scriptId,error:'literal closing script tag can truncate HTML source'});
  results.push({
    source:item.source,
    scriptId:item.scriptId,
    bytes:Buffer.byteLength(source),
    sha256:crypto.createHash('sha256').update(source).digest('hex'),
    standaloneSyntax,
    embeddedSyntax,
    parity
  });
}
const report={
  suite:'P143 phase-1 standalone source / canonical inline-lot parity',
  scope:'Only the workflow-managed modules listed in tests/p143/source-module-map.json; not a full index.html modularization claim.',
  total:manifest.modules.length,
  passed:results.filter(x=>x.standaloneSyntax&&x.embeddedSyntax&&x.parity).length,
  failed:failures.length,
  failures,
  modules:results
};
console.log(JSON.stringify(report,null,2));
if(failures.length)process.exit(1);
