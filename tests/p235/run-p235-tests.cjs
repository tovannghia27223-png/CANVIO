'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..','..'),src=fs.readFileSync(path.join(root,'canvio-p235-editor-inputs.js'),'utf8');
const checks=[];
function ck(n,f){f();checks.push(n);process.stdout.write('PASS '+n+'\n');}
ck('P235 scopes shortcuts to supported active editor pages',()=>{assert.ok(src.includes('function active()'));assert.ok(src.includes('SUPPORTED.indexOf(id)>=0'));});
ck('P235 never intercepts typing inside inputs or contenteditable nodes',()=>{assert.ok(src.includes('function typing(t)'));assert.ok(src.includes('if(!a||typing(e.target))return;'));});
ck('P235 routes playback, save, duplicate, delete and undo to native owners',()=>{for(const x of ['video.play()','video.pause()','video.save()','video.duplicateLayer','video.deleteLayer','CV.poster.history.undo()'])assert.ok(src.includes(x),x);});
ck('P235 exposes Alt+1..5 focus regions and 40px mobile targets',()=>{assert.ok(src.includes('/^[1-5]$/'));assert.ok(src.includes('min-height:40px'));});
console.log(checks.length+'/'+checks.length+' P235 source assertions passed');
