/* Canonical embedded lot: canvio-lot231. */
/* P231: one responsive shell that adopts existing editor nodes without cloning state or handlers. */
(function (w, d) {
  'use strict';
  if (!w || !d || w.CVEditorShellP231) return;
  var states = Object.create(null), styleId = 'canvio-p231-editor-shell-css', routeObserver = null;
  function el(tag, cls, text) { var n=d.createElement(tag); if(cls)n.className=cls; if(text!=null)n.textContent=text; return n; }
  function pageFor(id) { return id && id.nodeType===1 ? id : d.getElementById(String(id||'').indexOf('page-')===0?id:'page-'+id); }
  function installCss() {
    if(d.getElementById(styleId)) return;
    var s=el('style'); s.id=styleId;
    s.textContent='.app.cv231-app-active{height:100dvh!important;min-height:100dvh!important;overflow:hidden!important}.main.cv231-app-active{min-height:0!important;overflow:hidden!important}.page.cv231-enabled{box-sizing:border-box!important;width:100%!important;max-width:none!important;height:calc(100dvh - 98px)!important;min-height:0!important;overflow:hidden!important;margin:0!important;padding:8px 10px!important}.page.cv231-enabled>.head,.page.cv231-enabled>.cv231-source-editor{display:none!important}.cv231-shell{display:grid;grid-template-rows:52px minmax(0,1fr);gap:8px;width:100%;height:100%;min-width:0;min-height:0;color:var(--ink)}.cv231-top{display:flex;align-items:center;gap:8px;min-width:0;padding:6px 9px;border:1px solid var(--line);border-radius:12px;background:var(--surface);box-shadow:var(--sh-1)}.cv231-ident{min-width:112px;max-width:190px;overflow:hidden}.cv231-ident strong{display:block;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cv231-ident small{display:block;font-size:10px;color:var(--ink-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cv231-tools{display:flex;gap:4px;flex:none}.cv231-action{height:34px;padding:0 9px;border:1px solid var(--cv-accent-line,var(--line-2));border-radius:9px;background:var(--cv-accent-soft,var(--surface-3));color:var(--cv-accent-ink,var(--ink));font:700 11px inherit;white-space:nowrap;cursor:pointer}.cv231-action.primary{background:var(--cv-accent,#F83E9F);border-color:var(--cv-accent,#F83E9F);color:#fff}.cv231-actions{display:flex;align-items:center;gap:5px;flex:1;min-width:0;overflow:auto}.cv231-actions .headActions{display:flex!important;flex-wrap:nowrap!important;gap:5px!important;min-width:max-content}.cv231-layout{display:grid;grid-template-columns:minmax(168px,220px) minmax(0,1fr) minmax(250px,310px);gap:8px;min-width:0;min-height:0;overflow:hidden}.cv231-slot{box-sizing:border-box;min-width:0;min-height:0;overflow:hidden;border:1px solid var(--line);border-radius:12px;background:var(--surface)}.cv231-rail,.cv231-props{padding:8px;overflow:auto;overscroll-behavior:contain}.cv231-canvas{display:flex;min-width:0;min-height:0}.cv231-canvas #canvasWrap{width:100%!important;height:100%!important;max-height:100%!important;min-height:0!important;margin:0!important;overflow:auto!important;border:0!important}.cv231-rail .toolbar{position:static!important;display:flex!important;flex-direction:column!important;align-items:stretch!important;flex-wrap:nowrap!important;width:100%!important;max-height:none!important;margin:0!important;gap:6px!important;overflow:visible!important}.cv231-rail .toolbar .tbtn{width:100%;height:auto;min-height:36px;min-width:0;justify-content:flex-start;white-space:normal}.cv231-props>.stack{display:flex;flex-direction:column;gap:8px}.cv231-props .card{margin:0!important}.cv231-shell.cv231-rail-collapsed .cv231-layout{grid-template-columns:0 minmax(0,1fr) minmax(250px,310px)}.cv231-shell.cv231-rail-collapsed .cv231-rail,.cv231-shell.cv231-props-collapsed .cv231-props{display:none}.cv231-shell.cv231-props-collapsed .cv231-layout{grid-template-columns:minmax(168px,220px) minmax(0,1fr) 0}.cv231-shell.cv231-rail-collapsed.cv231-props-collapsed .cv231-layout{grid-template-columns:minmax(0,1fr)}@media(max-width:900px){.page.cv231-enabled{padding:6px!important}.cv231-shell{grid-template-rows:46px minmax(0,1fr);gap:6px}.cv231-top{gap:5px;padding:5px}.cv231-ident{min-width:80px;max-width:110px}.cv231-ident small{display:none}.cv231-action{height:34px;padding:0 7px;font-size:10px}.cv231-layout{grid-template-columns:minmax(0,1fr)!important;grid-template-rows:minmax(0,1fr) 50px}.cv231-canvas{grid-row:1}.cv231-rail{grid-row:2;padding:3px;overflow-x:auto;overflow-y:hidden}.cv231-rail .toolbar{flex-direction:row!important;align-items:center!important;width:max-content!important;max-width:none!important}.cv231-rail .toolbar .tbtn{width:auto;min-width:38px;min-height:38px;white-space:nowrap}.cv231-props{display:none;position:fixed;left:8px;right:8px;bottom:64px;top:auto;max-height:58dvh;z-index:1200;box-shadow:0 18px 44px rgba(12,20,38,.22)}.cv231-shell.cv231-mobile-props-open .cv231-props{display:block}.cv231-shell.cv231-props-collapsed .cv231-props{display:none!important}}@media(max-width:560px){.cv231-ident{min-width:72px;max-width:82px}.cv231-ident strong{font-size:11px}.cv231-action{padding:0 6px}.cv231-actions .headActions .btn{height:32px;padding:0 7px;font-size:10px}}@media(prefers-reduced-motion:reduce){.cv231-shell,.cv231-action{animation:none!important;transition:none!important}}';
    d.head.appendChild(s);
  }
  function restore(st) {
    st.records.slice().reverse().forEach(function(r){if(r.marker.parentNode){r.marker.parentNode.insertBefore(r.node,r.marker);r.marker.parentNode.removeChild(r.marker);} if(r.node.dataset)delete r.node.dataset.cv231Adopted;});
    st.records=[];
  }
  function syncAppLock() {
    var locked=Object.keys(states).some(function(k){var st=states[k];return st.enabled&&st.page.classList.contains('active');});
    var app=d.querySelector('.app'),main=d.querySelector('.main');
    if(app)app.classList.toggle('cv231-app-active',locked);
    if(main)main.classList.toggle('cv231-app-active',locked);
    return locked;
  }
  function observeRoutes() {
    if(routeObserver||!w.MutationObserver)return;
    var pages=d.querySelectorAll('.page');if(!pages.length)return;
    routeObserver=new w.MutationObserver(function(){syncAppLock();});
    pages.forEach(function(page){routeObserver.observe(page,{attributes:true,attributeFilter:['class']});});
    syncAppLock();
  }
  function adoptNode(st,node,slot,key) {
    var target=st.slots[slot]; if(!node||!target||target.contains(node))return false;
    var rec=st.records.find(function(x){return x.node===node;});
    if(!rec){if(!node.parentNode)return false;var marker=d.createComment('cv231-origin:'+key);node.parentNode.insertBefore(marker,node);rec={node:node,marker:marker};st.records.push(rec);}
    target.appendChild(node);node.dataset.cv231Adopted=key;return true;
  }
  function setEnabled(st,on) {
    on=!!on;if(on===st.enabled){syncAppLock();return on;}
    if(on){st.options.adopt.forEach(function(x){adoptNode(st,x.node||st.page.querySelector(x.selector),x.slot,x.key||x.selector||x.slot);});if(st.options.topActions){var n=st.page.querySelector(st.options.topActions);if(n)adoptNode(st,n,'actions','topActions');}st.page.classList.add('cv231-enabled');st.shell.hidden=false;st.enabled=true;try{w.sessionStorage.setItem('canvio.p231.mode.'+st.id,'editor');}catch(e){}if(st.options.onEnable)st.options.onEnable(st);}
    else{restore(st);st.page.classList.remove('cv231-enabled');st.shell.hidden=true;st.enabled=false;try{w.sessionStorage.setItem('canvio.p231.mode.'+st.id,'legacy');}catch(e){}if(st.options.onDisable)st.options.onDisable(st);}
    syncAppLock();
    return on;
  }
  function action(st,id,label,run,primary) {var b=el('button','cv231-action'+(primary?' primary':''),label);b.type='button';b.dataset.cv231Action=id;b.addEventListener('click',function(){try{if(run)run();}catch(e){if(w.CV&&CV.toast)CV.toast('Thao tác chưa hoàn tất. Hãy thử lại.');}});return b;}
  function mount(pageId,options) {
    var page=pageFor(pageId);if(!page)return false;var id=page.id.replace(/^page-/,'');if(states[id]){if(options)states[id].options=options;var mode='';try{mode=w.sessionStorage.getItem('canvio.p231.mode.'+id)||'';}catch(e){}setEnabled(states[id],mode!=='legacy');return states[id];}
    options=options||{};options.adopt=options.adopt||[];installCss();var head=page.querySelector('.head'),title=options.title||(head&&head.querySelector('h1')&&head.querySelector('h1').textContent.trim())||id;
    var shell=el('section','cv231-shell');shell.id='cv231-shell-'+id;shell.setAttribute('aria-label',title+' Editor');var top=el('header','cv231-top'),ident=el('div','cv231-ident');ident.appendChild(el('strong','',title));ident.appendChild(el('small','',options.subtitle||'Không gian làm việc'));var tools=el('div','cv231-tools'),actions=el('div','cv231-actions');top.append(ident,tools,actions);
    var layout=el('div','cv231-layout'),rail=el('aside','cv231-slot cv231-rail'),canvas=el('main','cv231-slot cv231-canvas'),props=el('aside','cv231-slot cv231-props'),bottom=el('div','cv231-slot cv231-bottom');rail.setAttribute('aria-label','Công cụ');canvas.setAttribute('aria-label','Khung làm việc');props.setAttribute('aria-label','Thuộc tính');bottom.hidden=true;layout.append(rail,canvas,props,bottom);shell.append(top,layout);if(head&&head.parentNode)head.parentNode.insertBefore(shell,head.nextSibling);else page.prepend(shell);
    var st={id:id,page:page,shell:shell,enabled:false,options:options,records:[],slots:{rail:rail,canvas:canvas,props:props,bottom:bottom,actions:actions}};states[id]=st;observeRoutes();
    tools.append(action(st,'toggle-rail','Công cụ',function(){shell.classList.toggle('cv231-rail-collapsed');}));tools.append(action(st,'toggle-props','Thuộc tính',function(){if(w.innerWidth<=900)shell.classList.toggle('cv231-mobile-props-open');else shell.classList.toggle('cv231-props-collapsed');}));tools.append(action(st,'legacy','Bố cục cũ',function(){setEnabled(st,false);}));
    (options.actions||[]).forEach(function(a){actions.append(action(st,a.id,a.label,a.run,a.variant==='primary'));});
    if(options.launchButton&&head){var host=head.querySelector('.headActions');if(host&&!host.querySelector('[data-cv231-launch]')){var launch=el('button','btn btn-soft',options.launchLabel||'Mở Editor');launch.type='button';launch.dataset.cv231Launch=id;launch.addEventListener('click',function(){setEnabled(st,true);});host.insertBefore(launch,host.firstChild);}}
    var mode='';try{mode=w.sessionStorage.getItem('canvio.p231.mode.'+id)||'';}catch(e){}setEnabled(st,mode!=='legacy');return st;
  }
  function adopt(selector,slot,pageId){var st=states[String(pageId||'').replace(/^page-/,'')]||Object.keys(states).map(function(k){return states[k];}).find(function(x){return x.enabled;});if(!st)return false;var n=selector&&selector.nodeType===1?selector:st.page.querySelector(selector);return adoptNode(st,n,slot,selector||slot);}
  function toggle(pageId){var st=states[String(pageId||'').replace(/^page-/,'')]||Object.keys(states).map(function(k){return states[k];}).find(function(x){return x.page.classList.contains('active');});return st?setEnabled(st,!st.enabled):false;}
  function state(id){var st=states[String(id||'').replace(/^page-/,'')];return st?{pageId:st.id,enabled:st.enabled,adopted:st.records.length,slots:Object.keys(st.slots)}:null;}
  function tests(){var ids=Object.keys(states);return{singleton:true,styleReady:!!d.getElementById(styleId),mounted:ids.length,allHaveSlots:ids.every(function(k){return Object.keys(states[k].slots).length===5;}),allAdoptedNodesConnected:ids.every(function(k){return states[k].records.every(function(x){return x.node.isConnected;});}),routeObserverReady:!!routeObserver,appLockScopedToActivePage:!d.querySelector('.app.cv231-app-active')||Object.keys(states).some(function(k){return states[k].enabled&&states[k].page.classList.contains('active');})};}
  w.CVEditorShellP231={version:'231.1.1',mount:mount,adopt:adopt,toggle:toggle,state:state,tests:tests};
})(window,document);