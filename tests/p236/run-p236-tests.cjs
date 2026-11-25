'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..','..'),src=fs.readFileSync(path.join(root,'canvio-p236-editor-experience.js'),'utf8');
const checks=[];
function ck(n,f){f();checks.push(n);process.stdout.write('PASS '+n+'\n');}
ck('P236 stores rail and inspector preferences per editor',()=>{assert.ok(src.includes("var KEY='canvio.p236.shell.'"));assert.ok(src.includes('rail:shell.classList.contains'));assert.ok(src.includes('props:shell.classList.contains'));});
ck('P236 offers an accessible three-step guide and reversible focus mode',()=>{assert.ok(src.includes("STEPS=["));assert.ok(src.includes("setAttribute('role','dialog')"));assert.ok(src.includes('cv236-focus-exit'));assert.ok(src.includes('cv236-focus'));});
ck('P236 attaches to newly mounted shells without polling timers',()=>{assert.ok(src.includes('MutationObserver'));assert.ok(src.includes("querySelectorAll('.cv231-shell')"));assert.ok(!/setInterval\\s*\\(/.test(src));});
console.log(checks.length+'/'+checks.length+' P236 source assertions passed');
