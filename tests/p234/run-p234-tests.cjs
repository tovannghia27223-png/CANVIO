'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..','..'),src=fs.readFileSync(path.join(root,'canvio-p234-native-studio-shell.js'),'utf8');
const checks=[];
function ck(n,f){f();checks.push(n);process.stdout.write('PASS '+n+'\n');}
ck('P234 covers Pixel Atelier, Luma Develop, Clarity Lab and Layout Foundry',()=>{for(const id of ['pixelStudio','colorStudio','clarityLab','layoutFoundry'])assert.ok(src.includes(id),id);});
ck('Raster adapters reuse native canvas, tools, inspector and export controls',()=>{for(const x of ['.ne-workgrid','.ne-maincol','.ne-side','.ne-stage','slot:\'rail\'','slot:\'canvas\'','slot:\'props\'','slot:\'bottom\''])assert.ok(src.includes(x),x);});
ck('Layout Foundry keeps the native page list, editable canvas and inspector',()=>{for(const x of ['lfPages','lfCanvas','layout-inspector','layout-toolbar'])assert.ok(src.includes(x),x);});
ck('P234 moves existing nodes and does not create storage or project owners',()=>{assert.ok(!src.includes('indexedDB.open'));assert.ok(!src.includes('localStorage.setItem'));assert.ok(!src.includes('createObjectStore'));assert.ok(!src.includes('cloneNode('));assert.ok(!src.includes('innerHTML='));});
ck('P234 preserves original native pages via the shared restoration anchors',()=>{assert.ok(src.includes('shell.mount'));assert.ok(src.includes('markSource'));assert.ok(src.includes('topActions:\'.ne-hero-actions\''));});
console.log(checks.length+'/'+checks.length+' P234 source assertions passed');
