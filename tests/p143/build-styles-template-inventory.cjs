'use strict';
const fs=require('node:fs');
const crypto=require('node:crypto');
const html=fs.readFileSync('index.html','utf8');
const scriptInventory=JSON.parse(fs.readFileSync('tests/p143/inline-source-inventory.json','utf8'));
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
function attrs(raw){
  const out={},re=/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let m;
  while((m=re.exec(raw||''))){
    const k=m[1].toLowerCase();
    if(k==='/'||k==='style')continue;
    out[k]=m[2]!==undefined?m[2]:(m[3]!==undefined?m[3]:(m[4]!==undefined?m[4]:true));
  }
  return out;
}
function cssSelectors(css){
  const clean=String(css||'').replace(/\/\*[\s\S]*?\*\//g,'');
  const found=[];
  for(const m of clean.matchAll(/([^{}]+)\{/g)){
    const selector=m[1].trim().replace(/\s+/g,' ');
    if(!selector||selector.startsWith('@'))continue;
    found.push(selector.slice(0,240));
  }
  return [...new Set(found)].slice(0,500);
}
const styleBlocks=[];
const styleRe=/<style\b([^>]*)>([\s\S]*?)<\/style\s*>/gi;
let m,styleOrder=0;
while((m=styleRe.exec(html))){
  const a=attrs(m[1]),css=m[2]||'';
  styleBlocks.push({
    order:styleOrder++,
    id:typeof a.id==='string'?a.id:null,
    media:typeof a.media==='string'?a.media:null,
    type:typeof a.type==='string'?a.type:'text/css',
    bytes:Buffer.byteLength(css),
    sha256:sha(css),
    selectorCount:cssSelectors(css).length,
    selectors:cssSelectors(css)
  });
}
const inlineStyleAttributes=[];
const styleAttrRe=/<([a-z][a-z0-9:-]*)\b([^>]*?\sstyle\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*)>/gi;
let styleAttrOrder=0;
while((m=styleAttrRe.exec(html))){
  const value=m[3]!==undefined?m[3]:(m[4]!==undefined?m[4]:(m[5]||''));
  inlineStyleAttributes.push({
    order:styleAttrOrder++,
    element:m[1].toLowerCase(),
    bytes:Buffer.byteLength(value),
    sha256:sha(value)
  });
}
const templates=[];
const templateRe=/<template\b([^>]*)>([\s\S]*?)<\/template\s*>/gi;
let templateOrder=0;
while((m=templateRe.exec(html))){
  const a=attrs(m[1]),body=m[2]||'';
  templates.push({
    order:templateOrder++,
    id:typeof a.id==='string'?a.id:null,
    name:typeof a.name==='string'?a.name:null,
    bytes:Buffer.byteLength(body),
    sha256:sha(body)
  });
}
const dynamicPatterns=[
  ['dynamic-script-element',/\bdocument\s*\.\s*createElement\s*\(\s*['"]script['"]\s*\)/gi],
  ['script-src-assignment',/\b(?:script|s)\s*\.\s*src\s*=/gi],
  ['classic-importScripts',/\bimportScripts\s*\(/gi],
  ['dedicated-worker',/\bnew\s+(?:window\s*\.\s*)?Worker\s*\(/gi],
  ['shared-worker',/\bnew\s+(?:window\s*\.\s*)?SharedWorker\s*\(/gi],
  ['dynamic-import',/\bimport\s*\(\s*[^)]/gi],
  ['dynamic-fetch',/\bfetch\s*\(/gi],
  ['document-write',/\bdocument\s*\.\s*write(?:ln)?\s*\(/gi],
  ['iframe-src-assignment',/\b(?:iframe|frame)\s*\.\s*src\s*=/gi]
];
const scriptBlocks=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
const dynamicLoaders=[];
for(let i=0;i<scriptBlocks.length;i++){
  const a=attrs(scriptBlocks[i][1]),source=scriptBlocks[i][2]||'';
  for(const [kind,re] of dynamicPatterns){
    re.lastIndex=0;let hit,kindCount=0;
    while((hit=re.exec(source))&&kindCount<100){
      const from=Math.max(0,hit.index-70),to=Math.min(source.length,hit.index+140);
      dynamicLoaders.push({
        kind,
        scriptOrder:i,
        scriptId:typeof a.id==='string'?a.id:null,
        offset:hit.index,
        excerpt:source.slice(from,to).replace(/\s+/g,' ').trim()
      });
      kindCount++;
    }
  }
}
const byGlobal=new Map();
for(const module of scriptInventory.modules||[]){
  for(const name of module.exportedGlobals||[]){
    if(!byGlobal.has(name))byGlobal.set(name,[]);
    byGlobal.get(name).push(module);
  }
}
const dependencyCandidates=[];
for(const consumer of scriptInventory.modules||[]){
  for(const name of consumer.knownGlobalReads||[]){
    const producers=byGlobal.get(name)||[];
    for(const producer of producers){
      if(producer.order===consumer.order)continue;
      dependencyCandidates.push({
        global:name,
        fromOrder:producer.order,
        fromId:producer.id,
        toOrder:consumer.order,
        toId:consumer.id,
        executionOrder:producer.order<consumer.order?'producer-before-consumer':'consumer-before-producer',
        confidence:'heuristic'
      });
    }
  }
}
dependencyCandidates.sort((a,b)=>a.fromOrder-b.fromOrder||a.toOrder-b.toOrder||a.global.localeCompare(b.global));
const loaderCounts={};
for(const item of dynamicLoaders)loaderCounts[item.kind]=(loaderCounts[item.kind]||0)+1;
const report={
  format:'CANVIO_P143_STYLE_TEMPLATE_LOADER_INVENTORY',
  version:1,
  generatedAt:new Date().toISOString(),
  source:'restored canonical index.html after all workflow-managed module integration steps',
  purpose:'Inventory inline styles, template elements and dynamic resource-loader call sites. Dependency candidates use known global reads/exports and execution order only; they are heuristic and are not a human-reviewed semantic boot-order DAG.',
  htmlBytes:Buffer.byteLength(html),
  styles:{blockCount:styleBlocks.length,inlineStyleAttributeCount:inlineStyleAttributes.length,totalStyleBytes:styleBlocks.reduce((n,x)=>n+x.bytes,0)+inlineStyleAttributes.reduce((n,x)=>n+x.bytes,0),blocks:styleBlocks,inlineAttributes:inlineStyleAttributes},
  templates:{count:templates.length,blocks:templates},
  dynamicLoaders:{count:dynamicLoaders.length,countsByKind:loaderCounts,sites:dynamicLoaders},
  dependencyCandidates:{count:dependencyCandidates.length,confidence:'heuristic-not-semantic',edges:dependencyCandidates},
  limitations:[
    'Regular-expression inventories can miss HTML/CSS/JavaScript constructed from concatenated strings or runtime data.',
    'Inline style attribute records retain hashes and sizes, not full style contents.',
    'CSS selector extraction is approximate and does not evaluate nesting, @layer, @supports or runtime style mutation.',
    'Template elements do not include HTML templates stored only inside JavaScript strings.',
    'Global read/export pairs are candidate dependencies only; they do not prove invocation order, data flow or safe extraction boundaries.',
    'No script, style, template or loader has been moved by generating this report.'
  ]
};
fs.writeFileSync('tests/p143/style-template-loader-inventory.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({
  suite:'P143 CSS/style/template/dynamic-loader inventory',
  htmlBytes:report.htmlBytes,
  styleBlocks:styleBlocks.length,
  inlineStyleAttributes:inlineStyleAttributes.length,
  templateBlocks:templates.length,
  dynamicLoaderSites:dynamicLoaders.length,
  dependencyCandidates:dependencyCandidates.length,
  output:'tests/p143/style-template-loader-inventory.json'
},null,2));
