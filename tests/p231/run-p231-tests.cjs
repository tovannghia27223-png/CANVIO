'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..','..');
const shell=fs.readFileSync(path.join(root,'canvio-p231-editor-shell.js'),'utf8');
const poster=fs.readFileSync(path.join(root,'canvio-p232-poster-shell.js'),'utf8');
const checks=[];
function check(name,fn){fn();checks.push(name);process.stdout.write('PASS '+name+'\n');}
check('P231 exposes the canonical shared shell API',()=>{for(const t of ['CVEditorShellP231','mount:mount','adopt:adopt','toggle:toggle','state:state','tests:tests'])assert.ok(shell.includes(t),t);});
check('P231 restores adopted DOM at comment anchors and never clones handlers',()=>{assert.ok(shell.includes('createComment('));assert.ok(shell.includes('function restore('));assert.ok(!/cloneNode\s*\(/.test(shell));assert.ok(!/innerHTML\s*=/.test(shell));});
check('P231 stores only transient layout mode in sessionStorage',()=>{assert.ok(shell.includes('canvio.p231.mode.'));assert.ok(!/localStorage\s*\./.test(shell));assert.ok(!/indexedDB\s*\./.test(shell));});
check('P232 adopts the existing Poster toolbar, canvas, inspector and exports',()=>{for(const t of ['.toolbar','#canvasWrap',':scope > .stack','.headActions','p.history.undo()','p.history.redo()'])assert.ok(poster.includes(t),t);assert.ok(!/cloneNode\s*\(/.test(poster));});
check('P232 preserves Poster save, fit and native resize owners',()=>{assert.ok(poster.includes('CV.project.autosave'));assert.ok(poster.includes('p.fit()'));assert.ok(poster.includes('ResizeObserver'));});
check('P231/P232 expose canonical lots for P143 parity',()=>{assert.ok(shell.includes('canvio-lot231'));assert.ok(poster.includes('canvio-lot232'));});
process.stdout.write(checks.length+'/'+checks.length+' P231/P232 assertions passed\n');