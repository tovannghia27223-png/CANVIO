/* CANVIO P234 — Pixel Atelier, Luma Develop, Clarity Lab and Layout Foundry adapters.
 * Reuses each native editor's existing controls, canvas, inspector and persistence hooks.
 */
(function(w,d){'use strict';
if(!w||!d||w.CVNativeStudioShellP234)return;
var IDS=['pixelStudio','colorStudio','clarityLab','layoutFoundry'];
var TITLES={pixelStudio:'Pixel Atelier',colorStudio:'Luma Develop',clarityLab:'Clarity Lab',layoutFoundry:'Layout Foundry'};
var mounted=Object.create(null),styleId='canvio-p234-native-shell-css';
function byId(id){return d.getElementById(id);}
function installCss(){
 if(byId(styleId))return;
 var s=d.createElement('style');s.id=styleId;
 s.textContent=[
 '.cv231-shell.cv234-native .cv231-layout{grid-template-columns:minmax(190px,260px) minmax(0,1fr) minmax(250px,320px)}',
 '.cv231-shell.cv234-native .cv231-rail{display:flex;flex-direction:column;align-items:stretch;gap:8px;overflow:auto}',
 '.cv231-shell.cv234-native .cv231-rail>.ne-card{margin:0!important;max-height:100%;overflow:auto}',
 '.cv231-shell.cv234-native .cv231-rail .ne-toolbar{display:flex;flex-direction:column;align-items:stretch;gap:6px;max-height:100%;overflow:auto;margin:0}',
 '.cv231-shell.cv234-native .cv231-rail .ne-toolbar>*{min-width:0;max-width:100%;white-space:normal}',
 '.cv231-shell.cv234-native .cv231-canvas{display:flex;flex-direction:column;gap:8px;overflow:auto;padding:8px}',
 '.cv231-shell.cv234-native .cv231-canvas>.ne-stage{flex:1 1 auto;width:100%;height:100%;min-height:0!important;max-height:100%;padding:8px;overflow:auto}',
 '.cv231-shell.cv234-native .cv231-canvas>.ne-stage canvas,.cv231-shell.cv234-native .cv231-canvas>.ne-stage svg{max-width:100%;max-height:100%;object-fit:contain}',
 '.cv231-shell.cv234-native .cv231-canvas>.ne-hist{flex:none;max-height:100px;overflow:hidden}',
 '.cv231-shell.cv234-native .cv231-props{overflow:auto}',
 '.cv231-shell.cv234-native .cv231-props>.ne-side{position:static;top:auto;max-height:100%;overflow:auto}',
 '.cv231-shell.cv234-native.cv231-has-bottom .cv231-bottom{display:block!important;grid-column:1/-1;grid-row:2;min-height:0;padding:5px;overflow:auto!important}',
 '.cv231-shell.cv234-native.cv231-has-bottom .cv231-layout{grid-template-rows:minmax(0,1fr) 48px}',
 '.cv231-shell.cv234-native .cv231-bottom .ne-toolbar{display:flex;align-items:center;gap:6px;flex-wrap:nowrap;min-width:max-content;overflow:auto;margin:0}',
 '.cv231-shell.cv234-native .cv231-actions>.ne-toolbar{display:flex;align-items:center;gap:5px;flex-wrap:nowrap;min-width:max-content;overflow:auto}',
 '.cv231-shell.cv234-native .cv231-actions>.ne-toolbar>*{flex:0 0 auto}',
 '.cv231-shell.cv234-native .cv231-rail .ne-page-list{max-height:100%;overflow:auto}',
 '.cv231-shell.cv234-native .cv231-canvas>.ne-layout-canvas{flex:1;min-width:0;min-height:0;width:100%;height:100%;overflow:auto;display:grid;place-items:start center}',
 '.cv231-shell.cv234-native .cv231-canvas .ne-doc-page{max-width:100%;margin:0 auto}',
 '.cv231-shell.cv234-native .cv231-props .card{margin:0!important}',
 '@media(max-width:900px){.cv231-shell.cv234-native .cv231-layout{grid-template-columns:minmax(0,1fr)!important;grid-template-rows:minmax(180px,1fr) 54px minmax(42px,auto)!important}.cv231-shell.cv234-native .cv231-rail{grid-column:1;grid-row:2;flex-direction:row;align-items:center;overflow-x:auto;overflow-y:hidden}.cv231-shell.cv234-native .cv231-rail .ne-toolbar{flex-direction:row;align-items:center;width:max-content;max-width:none;overflow:visible}.cv231-shell.cv234-native .cv231-rail .ne-toolbar>*{flex:0 0 auto;min-height:40px;white-space:nowrap}.cv231-shell.cv234-native .cv231-rail>.ne-card{max-height:none;overflow:visible;min-width:220px}.cv231-shell.cv234-native .cv231-canvas{grid-column:1;grid-row:1}.cv231-shell.cv234-native .cv231-canvas>.ne-stage{min-height:160px!important}.cv231-shell.cv234-native .cv231-props{position:fixed;left:8px;right:8px;bottom:64px;top:auto;max-height:58dvh;z-index:1300}.cv231-shell.cv234-native .cv231-bottom{grid-column:1;grid-row:3}.cv231-shell.cv234-native .cv231-actions>.ne-toolbar{max-width:70vw}.cv231-shell.cv234-native .cv231-actions>.ne-toolbar>*{min-height:40px}}'
 ].join('');
 d.head.appendChild(s);
}
function markSource(page,selectors){selectors.forEach(function(sel){var n=page.querySelector(sel);if(n)n.classList.add('cv231-source-editor');});}
function mountRaster(id){
 var page=byId('page-'+id);if(!page||mounted[id])return !!mounted[id];
 var shell=w.CVEditorShellP231,work=page.querySelector('.ne-workgrid'),main=work&&work.querySelector('.ne-maincol'),side=work&&work.querySelector('.ne-side'),stage=main&&main.querySelector('.ne-stage');
 if(!shell||!work||!main||!side||!stage)return false;
 var bars=Array.prototype.slice.call(main.querySelectorAll('.ne-toolbar'));
 if(!bars.length)return false;
 var extras=[];
 if(id==='colorStudio'){var presets=main.querySelector('.ne-presets');if(presets){var card=presets.closest('.ne-card');if(card)extras.push(card);}}
 if(id==='clarityLab'){var queue=byId('cyAssets');if(queue){var card2=queue.closest('.ne-card');if(card2)extras.push(card2);}}
 markSource(page,['.ne-hero','.ne-workgrid','.ne-note']);
 installCss();
 var adopt=[{node:bars[0],slot:'rail',key:id+'-tools'},{node:stage,slot:'canvas',key:id+'-canvas'},{node:side,slot:'props',key:id+'-inspector'}];
 extras.forEach(function(node,i){adopt.push({node:node,slot:'rail',key:id+'-extra-'+i});});
 var key={pixelStudio:'px',colorStudio:'cl',clarityLab:'cy'}[id],exp=main.querySelector('[data-'+key+'="export"]');
 var bottom=exp&&exp.closest('.ne-toolbar');
 if(!bottom||bottom===bars[0])bottom=bars.length>1?bars[bars.length-1]:null;
 if(bottom)adopt.push({node:bottom,slot:'bottom',key:id+'-export-actions'});
 var hist=main.querySelector('.ne-hist');if(hist)adopt.push({node:hist,slot:'canvas',key:id+'-histogram'});
 var st=shell.mount(id,{title:TITLES[id],subtitle:'Native editor · Canvas · Tools · Inspector',topActions:'.ne-hero-actions',adopt:adopt});
 if(!st)return false;
 if(bottom){st.slots.bottom.hidden=false;st.shell.classList.add('cv231-has-bottom');}
 st.shell.classList.add('cv234-native');
 mounted[id]=true;
 w.requestAnimationFrame(function(){w.dispatchEvent(new Event('resize'));});
 return true;
}
function mountLayout(){
 var id='layoutFoundry',page=byId('page-'+id);if(!page||mounted[id])return !!mounted[id];
 var shell=w.CVEditorShellP231,bar=page.querySelector(':scope > .ne-toolbar'),layout=page.querySelector('.ne-layout-work'),pages=byId('lfPages'),canvas=byId('lfCanvas'),side=layout&&layout.querySelector('.ne-side');
 if(!shell||!bar||!layout||!pages||!canvas||!side)return false;
 markSource(page,['.ne-hero','.ne-layout-work','.ne-note']);
 installCss();
 var st=shell.mount(id,{title:TITLES[id],subtitle:'Document Studio · Multi-page layout · Print / Export',topActions:'.ne-hero-actions',adopt:[
  {node:bar,slot:'actions',key:'layout-toolbar'},
  {node:pages,slot:'rail',key:'layout-pages'},
  {node:canvas,slot:'canvas',key:'layout-canvas'},
  {node:side,slot:'props',key:'layout-inspector'}
 ]});
 if(!st)return false;
 st.shell.classList.add('cv234-native');
 mounted[id]=true;
 w.requestAnimationFrame(function(){w.dispatchEvent(new Event('resize'));});
 return true;
}
function mount(id){return id==='layoutFoundry'?mountLayout():mountRaster(id);}
function ready(){
 var n=0;(function retry(){var ok=IDS.every(function(id){return mount(id);});if(ok)return;if(++n<100)w.setTimeout(retry,200);})();
}
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
w.CVNativeStudioShellP234={version:'234.1.0',mount:mount,state:function(id){var st=w.CVEditorShellP231&&w.CVEditorShellP231.state(id);return{mounted:!!mounted[id],shell:st};},tests:function(){return{allFourMounted:IDS.every(function(id){return !!mounted[id];}),pageIdsPresent:IDS.every(function(id){return !!byId('page-'+id);}),singleNativePagePerEditor:IDS.every(function(id){return d.querySelectorAll('#page-'+id).length===1;})};}};
})(window,document);
