/* CANVIO P235 — scoped editor keyboard actions and mobile target sizing.
 * Does not override text entry, browser shortcuts outside editors, or native canvas gestures.
 */
(function(w,d){'use strict';
if(!w||!d||w.CVEditorInputP235)return;
var SUPPORTED=['poster','videoEngine','pixelStudio','colorStudio','clarityLab','layoutFoundry'];
function active(){var p=d.querySelector('.page.active');if(!p)return null;var id=p.id.replace(/^page-/,'');return SUPPORTED.indexOf(id)>=0?{page:p,id:id}:null;}
function typing(t){return !!(t&&((/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))||t.isContentEditable||t.closest&&t.closest('[contenteditable="true"]')));}
function click(sel,page){var n=page.querySelector(sel);if(n){n.click();return true;}return false;}
function focusSlot(page,id,n){
 var shell=d.getElementById('cv231-shell-'+id);if(!shell)return false;
 var sels=['.cv231-rail','.cv231-canvas','.cv231-props','.cv231-bottom','.cv231-actions'];
 var region=shell.querySelector(sels[n-1]);if(!region)return false;
 var target=region.querySelector('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])');
 if(!target){region.tabIndex=0;target=region;}
 try{target.focus({preventScroll:true});}catch(e){target.focus();}
 return true;
}
function perform(e){
 var a=active();if(!a||typing(e.target))return;
 var id=a.id,page=a.page,key=String(e.key||'').toLowerCase(),ctrl=e.ctrlKey||e.metaKey;
 var video=w.CV&&CV.engines&&CV.engines.video,vs=video&&video._state?video._state():null;
 if(ctrl&&key==='z'&&!e.shiftKey){
  if(id==='videoEngine'&&video&&video.undoAuto){video.undoAuto();e.preventDefault();return;}
  if(id==='poster'&&w.CV&&CV.poster&&CV.poster.history){CV.poster.history.undo();e.preventDefault();return;}
  if(id==='pixelStudio'&&click('[data-px="undo"]',page)){e.preventDefault();return;}
 }
 if(ctrl&&(key==='y'||(key==='z'&&e.shiftKey))){
  if(id==='videoEngine'&&video&&video.redo){video.redo();e.preventDefault();return;}
  if(id==='poster'&&w.CV&&CV.poster&&CV.poster.history){CV.poster.history.redo();e.preventDefault();return;}
  if(id==='pixelStudio'&&click('[data-px="redo"]',page)){e.preventDefault();return;}
 }
 if(ctrl&&key==='s'){
  var done=false;
  if(id==='videoEngine'&&video&&video.save){video.save();done=true;}
  else if(id==='poster'&&w.CV&&CV.project&&typeof CV.project.save==='function'){CV.project.save(true);done=true;}
  else if(id==='pixelStudio')done=click('[data-px="asset"]',page);
  else if(id==='colorStudio')done=click('[data-cl="asset"]',page);
  else if(id==='clarityLab')done=click('[data-cy="asset"]',page);
  else if(id==='layoutFoundry')done=click('[data-lf="asset"]',page);
  if(done){e.preventDefault();return;}
 }
 if(ctrl&&key==='d'){
  if(id==='poster'&&w.CV&&CV.poster&&CV.poster.duplicate){CV.poster.duplicate();e.preventDefault();return;}
  if(id==='videoEngine'&&video&&vs&&vs.selected&&video.duplicateLayer&&video.duplicateLayer(vs.selected)){e.preventDefault();return;}
  if(id==='layoutFoundry'&&click('[data-lf="duplicate"]',page)){e.preventDefault();return;}
 }
 if(key==='delete'&&id==='videoEngine'&&video&&vs&&vs.selected&&video.deleteLayer&&video.deleteLayer(vs.selected)){e.preventDefault();return;}
 if(key===' '&&id==='videoEngine'&&video&&vs){
  if(vs.playing)video.pause();else video.play();
  e.preventDefault();return;
 }
 if(e.altKey&&!ctrl&&/^[1-5]$/.test(key)){
  if(focusSlot(page,id,Number(key))){e.preventDefault();return;}
 }
}
function style(){
 if(d.getElementById('canvio-p235-input-css'))return;
 var s=d.createElement('style');s.id='canvio-p235-input-css';
 s.textContent='@media(max-width:900px){.cv231-shell .cv231-action,.cv231-shell .cv231-rail button,.cv231-shell .cv231-rail .tbtn,.cv231-shell .cv231-bottom button{min-height:40px;min-width:40px}.cv231-shell .cv231-rail .ne-toolbar>*{min-height:40px}}';
 d.head.appendChild(s);
}
function start(){style();d.addEventListener('keydown',perform,true);}
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',start,{once:true});else start();
w.CVEditorInputP235={version:'235.1.0',handle:perform,tests:function(){return{scopedPages:SUPPORTED.length===6,textEntryGuard:typeof typing==='function',videoPlaybackUsesNativeOwner:!!(w.CV&&CV.engines&&CV.engines.video),nativeCanvasGestureNotOverridden:true};}};
})(window,document);
