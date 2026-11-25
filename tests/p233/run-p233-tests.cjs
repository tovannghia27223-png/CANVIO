'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..','..'),src=fs.readFileSync(path.join(root,'canvio-p233-video-shell.js'),'utf8');
const checks=[];
function ck(n,f){f();checks.push(n);process.stdout.write('PASS '+n+'\n');}
ck('P233 uses the existing Video Engine and IndexedDB timeline owner',()=>{assert.ok(src.includes("w.CV&&CV.engines&&CV.engines.video"));assert.ok(src.includes("typeof api._state!=='function'"));assert.ok(src.includes("typeof api.save!=='function'"));assert.ok(!src.includes('indexedDB.open'));assert.ok(!src.includes('createObjectStore'));assert.ok(!src.includes('VT_KEY ='));});
ck('P233 maps preview, properties, native asset picker and timeline to shared slots',()=>{for(const x of ["vtCanvas","vtProps","vtAssetPicker","vtTimeline","slot:'canvas'","slot:'props'","slot:'rail'","slot:'bottom'"])assert.ok(src.includes(x),x);});
ck('P233 keeps native toolbar/export handlers without cloning or replacing nodes',()=>{assert.ok(src.includes(".engine-toolbar"));assert.ok(src.includes("slot:'actions'"));assert.ok(!src.includes('cloneNode('));assert.ok(!src.includes('innerHTML='));});
ck('P233 exposes a bottom timeline row and narrow-screen layout',()=>{assert.ok(src.includes('cv231-has-bottom'));assert.ok(src.includes('grid-template-rows:minmax(190px,1fr) 54px minmax(126px,28dvh)'));});
ck('P233 retries safely until the shared shell and engine exist',()=>{assert.ok(src.includes('function retry()'));assert.ok(src.includes('if(++n<100)'));});
console.log(checks.length+'/'+checks.length+' P233 source assertions passed');
