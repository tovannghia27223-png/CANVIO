'use strict';
const fs=require('node:fs');
const crypto=require('node:crypto');
const html=fs.readFileSync('index.html','utf8');
const re=/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
const attrRe=/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
const knownGlobals=['CV','CVWS','CVWeb','CVKit','CVAssets','CVDesignSystem','CVContext','CVTimeline','CANVIOSecurity','CANVIOPersistentProjects','CANVIOStudioSwitcherP109','CANVIOHubP110','CANVIOStudioShellP111','CVAutoLayoutP124','CVProxyP133','CVUxP144','LS','P7','P8','P30','P31'];
const modules=[];
let match,index=0;
while((match=re.exec(html))){
  const rawAttrs=match[1]||'',source=match[2]||'',attrs={};
  let a;
  attrRe.lastIndex=0;
  while((a=attrRe.exec(rawAttrs))){
    const key=a[1].toLowerCase();
    if(key==='/'||key==='script')continue;
    attrs[key]=a[2]!==undefined?a[2]:(a[3]!==undefined?a[3]:(a[4]!==undefined?a[4]:true));
  }
  const id=typeof attrs.id==='string'?attrs.id:null;
  const src=typeof attrs.src==='string'?attrs.src:null;
  const exports=new Set();
  for(const m of source.matchAll(/\bwindow\.([A-Za-z_$][\w$]*)\s*=/g))exports.add(m[1]);
  for(const m of source.matchAll(/\bwindow\[['"]([A-Za-z_$][\w$]*)['"]\]\s*=/g))exports.add(m[1]);
  const reads=[];
  for(const name of knownGlobals){
    const rx=new RegExp('(?:\\bwindow\\.'+name+'\\b|\\b'+name+'\\s*(?:\\.|\\[))');
    if(rx.test(source)&&!exports.has(name))reads.push(name);
  }
  modules.push({
    order:index++,
    id,
    type:typeof attrs.type==='string'?attrs.type:'classic',
    src,
    async:Object.prototype.hasOwnProperty.call(attrs,'async'),
    defer:Object.prototype.hasOwnProperty.call(attrs,'defer'),
    noModule:Object.prototype.hasOwnProperty.call(attrs,'nomodule'),
    bytes:Buffer.byteLength(source),
    sha256:crypto.createHash('sha256').update(source).digest('hex'),
    exportedGlobals:[...exports].sort(),
    knownGlobalReads:reads.sort()
  });
}
const counts=new Map();
for(const item of modules)if(item.id)counts.set(item.id,(counts.get(item.id)||0)+1);
const duplicateScriptIds=[...counts.entries()].filter(([,count])=>count>1).map(([id,count])=>({id,count}));
const inline=modules.filter(m=>!m.src);
const external=modules.filter(m=>m.src);
const report={
  format:'CANVIO_P143_INLINE_SOURCE_INVENTORY',
  version:1,
  generatedAt:new Date().toISOString(),
  source:'restored canonical index.html after hosted workflow integration steps',
  purpose:'Complete script-tag inventory in browser execution order; known global reference detection is heuristic, not a semantic dependency DAG.',
  htmlBytes:Buffer.byteLength(html),
  scriptTagCount:modules.length,
  inlineScriptCount:inline.length,
  externalScriptCount:external.length,
  moduleScriptCount:modules.filter(m=>m.type==='module').length,
  asyncScriptCount:modules.filter(m=>m.async).length,
  deferScriptCount:modules.filter(m=>m.defer).length,
  uniqueScriptIds:counts.size,
  duplicateScriptIds,
  modules
};
fs.mkdirSync('tests/p143',{recursive:true});
fs.writeFileSync('tests/p143/inline-source-inventory.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({
  suite:'P143 complete inline script inventory',
  htmlBytes:report.htmlBytes,
  scriptTagCount:report.scriptTagCount,
  inlineScriptCount:report.inlineScriptCount,
  externalScriptCount:report.externalScriptCount,
  moduleScriptCount:report.moduleScriptCount,
  asyncScriptCount:report.asyncScriptCount,
  deferScriptCount:report.deferScriptCount,
  uniqueScriptIds:report.uniqueScriptIds,
  duplicateScriptIds:report.duplicateScriptIds.length,
  report:'tests/p143/inline-source-inventory.json'
},null,2));
