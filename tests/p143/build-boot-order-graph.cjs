#!/usr/bin/env node
'use strict';
/* P143 Phase 3 — boot-order dependency graph from the inline-source inventory.
 * For each script: which earlier scripts provide the known globals it reads (hard edges), which globals are
 * only provided by a LATER script (forward references: safe only when read lazily at event time), and which
 * reads have no provider in the page (browser built-ins / externally provided). Heuristic like the inventory:
 * it uses exportedGlobals + knownGlobalReads, not a full semantic analysis. */
const fs=require('fs'),path=require('path');
const dir=__dirname,inv=JSON.parse(fs.readFileSync(path.join(dir,'inline-source-inventory.json'),'utf8'));
const mods=inv.modules,providers={};
mods.forEach(m=>(m.exportedGlobals||[]).forEach(g=>{(providers[g]=providers[g]||[]).push(m.order)}));
const nodes=[],forward=[],edges=[];
mods.forEach(m=>{
  const reads=[...new Set(m.knownGlobalReads||[])],deps=new Set(),fwd=[],unresolved=[];
  reads.forEach(g=>{
    const own=(m.exportedGlobals||[]).includes(g);if(own)return;
    const p=providers[g];if(!p){unresolved.push(g);return}
    const earlier=p.filter(o=>o<m.order);
    if(earlier.length){deps.add(Math.max(...earlier))}
    else{fwd.push({global:g,providerOrder:Math.min(...p)})}
  });
  deps.forEach(d=>edges.push([m.order,d]));
  fwd.forEach(f=>forward.push({reader:m.id||('#'+m.order),readerOrder:m.order,global:f.global,providerOrder:f.providerOrder}));
  nodes.push({order:m.order,id:m.id,bytes:m.bytes,provides:m.exportedGlobals||[],dependsOnOrders:[...deps].sort((a,b)=>a-b),forwardReads:fwd.map(f=>f.global),unresolvedReads:unresolved,
    extractionClass:fwd.length?'review-forward-reference':(deps.size===0&&!unresolved.length?'leaf-standalone':'ordered-dependent')});
});
const count=k=>nodes.filter(n=>n.extractionClass===k).length;
const out={format:'CANVIO_P143_BOOT_ORDER_GRAPH',version:1,
  purpose:'Heuristic boot-order graph from the inline inventory. forwardReferences are reads of a global that only a later script defines.',
  scriptCount:nodes.length,edgeCount:edges.length,
  summary:{leafStandalone:count('leaf-standalone'),orderedDependent:count('ordered-dependent'),reviewForwardReference:count('review-forward-reference'),forwardReferenceCount:forward.length},
  forwardReferences:forward,nodes};
const target=path.join(dir,'boot-order-graph.json');
if(process.argv.includes('--check')){
  const base=JSON.parse(fs.readFileSync(target,'utf8')),key=f=>f.reader+'>'+f.global,known=new Set(base.forwardReferences.map(key));
  const added=forward.filter(f=>!known.has(key(f)));
  if(added.length){console.error('P143 boot-order: new forward references (reorder scripts or make the read lazy, then rebuild):',JSON.stringify(added));process.exit(1)}
  console.log('P143 boot-order OK:',JSON.stringify(out.summary));process.exit(0);
}
fs.writeFileSync(target,JSON.stringify(out,null,1)+'\n');console.log('wrote boot-order-graph.json',JSON.stringify(out.summary));
