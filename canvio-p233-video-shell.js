/* CANVIO P233 — Video Production Engine adapter for the shared P231 shell.
 * Moves existing Video Engine DOM nodes only. Timeline, media DB, undo and export remain canonical.
 */
(function(w,d){'use strict';
if(!w||!d||w.CVVideoShellP233)return;
var mounted=false,resizeObserver=null,routeObserver=null,styleId='canvio-p233-video-shell-css';
function el(id){return d.getElementById(id);}
function installCss(){
 if(el(styleId))return;
 var s=d.createElement('style');s.id=styleId;
 s.textContent=[
 '.cv231-shell.cv233-video.cv231-has-bottom .cv231-layout{grid-template-rows:minmax(0,1fr) minmax(132px,27%)}',
 '.cv231-shell.cv231-has-bottom .cv231-bottom{display:block!important;grid-column:1/-1;grid-row:2;min-height:0;padding:6px;overflow:hidden!important}',
 '.cv231-shell.cv233-video .cv231-bottom>.card{height:100%;min-height:0;margin:0!important;display:flex;flex-direction:column}',
 '.cv231-shell.cv233-video .cv231-bottom #vtTimeline{flex:1;min-height:0;max-height:100%;overflow:auto!important}',
 '.cv231-shell.cv233-video .cv231-bottom .cardTop{flex:none;margin-bottom:6px}',
 '.cv231-shell.cv233-video .cv231-actions>.engine-toolbar{display:flex;flex:0 0 auto;align-items:center;gap:5px;flex-wrap:nowrap;min-width:max-content;overflow:visible}',
 '.cv231-shell.cv233-video .cv231-actions>.engine-toolbar>*{flex:0 0 auto}',
 '.cv231-shell.cv233-video .cv231-actions .headActions{min-width:max-content}',
 '.cv231-shell.cv233-video .cv231-rail>.card{margin:0!important;max-height:100%;overflow:auto}',
 '.cv231-shell.cv233-video .cv231-canvas>.card{display:flex;flex-direction:column;width:100%;height:100%;min-height:0;margin:0!important;overflow:hidden}',
 '.cv231-shell.cv233-video .cv231-canvas>.card #vtCanvas{display:block;flex:1 1 auto;width:100%!important;height:100%!important;max-height:100%;min-height:0;object-fit:contain}',
 '.cv231-shell.cv233-video .cv231-canvas>.card input#vtScrub{flex:none}',
 '.cv231-shell.cv233-video .cv231-props>div{display:grid;align-content:start;gap:8px;max-height:100%;overflow:auto}',
 '.cv231-shell.cv233-video .cv231-props .card{margin:0!important;min-width:0}',
 '.cv231-shell.cv233-video .cv231-props #vtCapList{max-height:25dvh!important;overflow:auto}',
 '@media(max-width:900px){.cv231-shell.cv233-video.cv231-has-bottom .cv231-layout{grid-template-columns:minmax(0,1fr)!important;grid-template-rows:minmax(190px,1fr) 54px minmax(126px,28dvh)!important}.cv231-shell.cv233-video .cv231-bottom{grid-column:1;grid-row:3}.cv231-shell.cv233-video .cv231-bottom>.card{padding:5px}.cv231-shell.cv233-video .cv231-rail{grid-column:1;grid-row:2}.cv231-shell.cv233-video .cv231-rail>.card{max-height:none;overflow:visible}.cv231-shell.cv233-video .cv231-props{z-index:1300;max-height:58dvh}.cv231-shell.cv233-video .cv231-canvas>.card{padding:6px}.cv231-shell.cv233-video .cv231-bottom #vtTimeline{overflow:auto!important}}'
 ].join('');
 d.head.appendChild(s);
}
function mount(){
 if(mounted)return true;
 var page=el('page-videoEngine'),shell=w.CVEditorShellP231,api=w.CV&&CV.engines&&CV.engines.video;
 if(!page||!shell||!api||typeof api._state!=='function'||typeof api.save!=='function')return false;
 var toolbar=page.querySelector('.engine-toolbar');
 var toolbarCard=toolbar&&toolbar.parentElement;
 var canvas=el('vtCanvas'),preview=canvas&&canvas.closest('.card');
 var grid=canvas&&canvas.closest('.grid.g2');
 var right=grid&&grid.children.length>1?grid.children[1]:null;
 var timeline=el('vtTimeline'),timelineCard=timeline&&timeline.closest('.card');
 var asset=el('vtAssetPicker'),assetCard=asset&&asset.closest('.card');
 var assetGrid=assetCard&&assetCard.parentElement;
 var head=page.querySelector('.headActions');
 if(!toolbar||!toolbarCard||!preview||!grid||!right||!timelineCard||!assetCard||!assetGrid||!externalCard||!head)return false;
 toolbarCard.classList.add('cv231-source-editor');
 grid.classList.add('cv231-source-editor');
 timelineCard.classList.add('cv231-source-editor');
 assetGrid.classList.add('cv231-source-editor');
 installCss();
 var st=shell.mount('videoEngine',{
  title:'Video Production Engine',
  subtitle:'Preview · Media · Multitrack timeline · Export',
  launchButton:true,
  launchLabel:'Mở Video Editor',
  topActions:'.headActions',
  adopt:[
   {node:assetCard,slot:'rail',key:'video-assets'},
   {node:preview,slot:'canvas',key:'video-preview'},
   {node:right,slot:'props',key:'video-inspector-captions'},\n   {node:externalCard,slot:'props',key:'video-external-editor'},
   {node:timelineCard,slot:'bottom',key:'video-timeline'},
   {node:toolbar,slot:'actions',key:'video-native-toolbar'}
  ]
 });
 if(!st)return false;
 st.slots.bottom.hidden=false;
 st.shell.classList.add('cv231-has-bottom','cv233-video');
 mounted=true;
 function resize(){
  var c=el('vtCanvas');
  if(c){c.style.maxWidth='100%';}
  var state=api._state();
  if(state&&state.playing===false&&typeof api.seek==='function')api.seek(state.time||0);
 }
 if(w.ResizeObserver){resizeObserver=new ResizeObserver(function(){w.requestAnimationFrame(resize);});resizeObserver.observe(st.shell);}
 w.addEventListener('resize',resize,{passive:true});
 w.addEventListener('orientationchange',resize,{passive:true});
 w.requestAnimationFrame(resize);
 return true;
}
function ready(){var n=0;(function retry(){if(mount())return;if(++n<100)w.setTimeout(retry,200);})();if(w.MutationObserver&&!routeObserver){var main=d.querySelector('.main');if(main){routeObserver=new MutationObserver(function(){if(!mounted)mount();});routeObserver.observe(main,{childList:true,subtree:true});}}}
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
w.CVVideoShellP233={version:'233.1.0',mount:mount,state:function(){var s=w.CVEditorShellP231&&w.CVEditorShellP231.state('videoEngine');return{mounted:mounted,shell:s,engineReady:!!(w.CV&&CV.engines&&CV.engines.video)};}};
})(window,document);
