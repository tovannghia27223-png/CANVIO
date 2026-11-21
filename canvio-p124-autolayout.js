/* P124 · Responsive Auto Layout + reusable component variants for the existing Website Engine.
   Uses only CVWeb.addComponents() and CV.engines.web.save(); no second editor, project store or dependency. */
(function () {
'use strict';
if (window.CVAutoLayoutP124) return;

var VERSION = '124.4.0';
var INSTANCE = 0;
var VARIANTS = {
  surface: { background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: 'none' },
  outline: { background: 'transparent', border: '1px solid #94a3b8', boxShadow: 'none' },
  elevated: { background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 12px 32px rgba(15,23,42,.10)' },
  soft: { background: '#f1f5f9', border: '1px solid transparent', boxShadow: 'none' }
};
var KINDS = ['stack', 'row', 'grid', 'split', 'card'];

function clamp(value, min, max, fallback) {
  var n = Number(value);
  if (!isFinite(n)) n = fallback;
  return Math.max(min, Math.min(max, n));
}
function cleanText(value, fallback, max) {
  var s = String(value == null ? fallback : value).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
  return s.slice(0, max || 160);
}
function esc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function normalize(kind, options) {
  options = options || {};
  if (KINDS.indexOf(kind) < 0) throw new Error('Kiểu Auto Layout không hợp lệ.');
  var variant = Object.prototype.hasOwnProperty.call(VARIANTS, options.variant) ? options.variant : 'surface';
  var mobileBreakpoint = Math.round(clamp(options.mobileBreakpoint, 320, 767, 640));
  var tabletBreakpoint = Math.round(clamp(options.tabletBreakpoint, 768, 1280, 960));
  return {
    kind: kind,
    variant: variant,
    gap: Math.round(clamp(options.gap, 8, 64, 20)),
    minWidth: Math.round(clamp(options.minWidth, 180, 480, kind === 'split' ? 352 : 240)),
    columns: Math.round(clamp(options.columns, 2, 6, 3)),
    mobileColumns: Math.round(clamp(options.mobileColumns, 1, 2, 1)),
    tabletColumns: Math.round(clamp(options.tabletColumns, 1, 4, 2)),
    desktopColumns: Math.round(clamp(options.desktopColumns, 2, 6, clamp(options.columns, 2, 6, 3))),
    mobileBreakpoint: mobileBreakpoint,
    tabletBreakpoint: Math.max(mobileBreakpoint + 1, tabletBreakpoint),
    title: cleanText(options.title, 'Tiêu đề thành phần', 120),
    description: cleanText(options.description, 'Mô tả ngắn — nhấp để chỉnh sửa nội dung.', 240)
  };
}
function cardMarkup(o, index) {
  var v = VARIANTS[o.variant];
  var style = 'min-width:0;padding:24px;border-radius:16px;background:' + v.background +
    ';border:' + v.border + ';box-shadow:' + v.boxShadow + ';';
  return '<article data-canvio-component="card" data-canvio-variant="' + o.variant + '" style="' + style + '">' +
    '<h3 data-canvio-component="heading" style="margin:0 0 10px;font-size:1.125rem;line-height:1.35;font-weight:700;">' +
    esc(o.title + (index > 0 ? ' ' + (index + 1) : '')) + '</h3>' +
    '<p data-canvio-component="body" style="margin:0;color:#475569;line-height:1.65;">' + esc(o.description) + '</p>' +
    '</article>';
}
function render(kind, options) {
  var o = normalize(kind, options), style, inner, i, children = [], instance = 'cv-p124-layout-' + (++INSTANCE), rules = [];
  if (kind === 'card') return cardMarkup(o, 0);
  if (kind === 'stack') {
    style = 'display:flex;flex-direction:column;gap:' + o.gap + 'px;width:100%;max-width:72rem;margin-inline:auto;padding:clamp(16px,3vw,32px);box-sizing:border-box;';
    inner = '<header><h2 style="margin:0 0 8px;font-size:clamp(1.35rem,2.5vw,2rem);line-height:1.2;">' + esc(o.title) +
      '</h2><p style="margin:0;color:#475569;line-height:1.65;">' + esc(o.description) + '</p></header>' +
      cardMarkup(o, 0);
  } else if (kind === 'row') {
    style = 'display:flex;flex-direction:row;flex-wrap:wrap;align-items:stretch;gap:' + o.gap + 'px;width:100%;max-width:72rem;margin-inline:auto;padding:clamp(16px,3vw,32px);box-sizing:border-box;';
    for (i = 0; i < 3; i++) children.push('<div style="flex:1 1 ' + o.minWidth + 'px;min-width:0;">' + cardMarkup(o, i) + '</div>');
    inner = children.join('');
    rules.push('.' + instance + '{flex-direction:row;}');
    rules.push('@media(max-width:' + o.mobileBreakpoint + 'px){.' + instance + '{flex-direction:column;}}');
  } else if (kind === 'grid') {
    style = 'display:grid;align-items:stretch;gap:' + o.gap + 'px;width:100%;max-width:72rem;margin-inline:auto;padding:clamp(16px,3vw,32px);box-sizing:border-box;';
    for (i = 0; i < o.desktopColumns; i++) children.push(cardMarkup(o, i));
    inner = children.join('');
    rules.push('.' + instance + '{grid-template-columns:repeat(' + o.desktopColumns + ',minmax(0,1fr));}');
    rules.push('@media(max-width:' + o.tabletBreakpoint + 'px){.' + instance + '{grid-template-columns:repeat(' + o.tabletColumns + ',minmax(0,1fr));}}');
    rules.push('@media(max-width:' + o.mobileBreakpoint + 'px){.' + instance + '{grid-template-columns:repeat(' + o.mobileColumns + ',minmax(0,1fr));}}');
  } else {
    style = 'display:grid;align-items:center;gap:' + (o.gap + 8) + 'px;width:100%;max-width:72rem;margin-inline:auto;padding:clamp(16px,3vw,32px);box-sizing:border-box;';
    inner = '<div style="min-width:0;"><p style="margin:0 0 8px;color:#64748b;font-size:.8rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">CANVIO · AUTO LAYOUT</p>' +
      '<h2 style="margin:0 0 12px;font-size:clamp(1.6rem,3vw,2.6rem);line-height:1.15;">' + esc(o.title) + '</h2>' +
      '<p style="margin:0;color:#475569;line-height:1.7;">' + esc(o.description) + '</p></div>' + cardMarkup(o, 0);
    rules.push('.' + instance + '{grid-template-columns:repeat(2,minmax(0,1fr));}');
    rules.push('@media(max-width:' + o.tabletBreakpoint + 'px){.' + instance + '{grid-template-columns:repeat(' + Math.min(2, o.tabletColumns) + ',minmax(0,1fr));}}');
    rules.push('@media(max-width:' + o.mobileBreakpoint + 'px){.' + instance + '{grid-template-columns:repeat(1,minmax(0,1fr));}}');
  }
  var css = rules.length ? '<style data-canvio-p124-breakpoints="' + instance + '">' + rules.join('') + '</style>' : '';
  return css + '<section class="cv-p124-layout ' + instance + '" data-canvio-auto-layout="' + kind + '" data-canvio-layout-version="' + VERSION +
    '" data-canvio-layout-instance="' + instance + '" style="' + style + '">' + inner + '</section>';
}
function inspect() {
  return {
    version: VERSION,
    layouts: [
      { id: 'stack', label: 'Stack · xếp dọc', description: 'Nội dung theo trục dọc, khoảng cách nhất quán.' },
      { id: 'row', label: 'Row · hàng linh hoạt', description: 'Flex wrap, tự xuống hàng khi thiếu không gian.' },
      { id: 'grid', label: 'Grid · lưới tự co giãn', description: 'CSS Grid auto-fit/minmax, tự đổi số cột.' },
      { id: 'split', label: 'Split · hai vùng', description: 'Hai vùng nội dung tự xếp lại trên màn hình hẹp.' },
      { id: 'card', label: 'Card · biến thể', description: 'Thành phần tái sử dụng với bốn biến thể bề mặt.' }
    ],
    variants: Object.keys(VARIANTS),
    breakpointControls: ['mobileBreakpoint', 'tabletBreakpoint', 'mobileColumns', 'tabletColumns', 'desktopColumns']
  };
}
function selectedTarget(){
 var ed=window.CVWeb,component=null;
 try{component=ed&&typeof ed.getSelected==='function'?ed.getSelected():null;}catch(e){}
 if(!component||typeof component.addClass!=='function')return null;
 try{if(typeof component.is==='function'&&component.is('wrapper'))return null;}catch(e){}
 return component;
}
function selectedTargetClass(component){
 var raw='';
 try{raw=component.getId?component.getId():(component.get&&component.get('id'))||component.cid||'';}catch(e){}
 raw=String(raw||'selected').toLowerCase().replace(/[^a-z0-9_-]/g,'-').replace(/^-+|-+$/g,'').slice(0,48)||'selected';
 return 'cv-p124-selected-'+raw;
}
function selectedResponsiveCss(selector,options){
 if(!/^\.cv-p124-selected-[a-z0-9_-]{1,64}$/.test(String(selector||'')))throw new Error('Selector P124 không hợp lệ.');
 var o=normalize('grid',options),rule=function(columns,gap){return 'display:grid;grid-template-columns:repeat('+columns+',minmax(0,1fr));gap:'+gap+'px;min-width:0;box-sizing:border-box;';};
 return selector+'{'+rule(o.desktopColumns,o.gap)+'}@media(max-width:'+o.tabletBreakpoint+'px){'+selector+'{'+rule(o.tabletColumns,o.gap)+'}}@media(max-width:'+o.mobileBreakpoint+'px){'+selector+'{'+rule(o.mobileColumns,o.gap)+'}}';
}
function selectedLayoutRules(kind, options){
 var o=normalize(kind,options),base,tablet=null,mobile=null;
 if(kind==='stack'){
  base={display:'flex','flex-direction':'column',gap:o.gap+'px',width:'100%','min-width':'0','box-sizing':'border-box'};
 }else if(kind==='row'){
  base={display:'flex','flex-direction':'row','flex-wrap':'wrap','align-items':'stretch',gap:o.gap+'px',width:'100%','min-width':'0','box-sizing':'border-box'};
  mobile={'flex-direction':'column'};
 }else if(kind==='grid'){
  base={display:'grid','grid-template-columns':'repeat('+o.desktopColumns+',minmax(0,1fr))',gap:o.gap+'px',width:'100%','min-width':'0','box-sizing':'border-box'};
  tablet={'grid-template-columns':'repeat('+o.tabletColumns+',minmax(0,1fr))'};
  mobile={'grid-template-columns':'repeat('+o.mobileColumns+',minmax(0,1fr))'};
 }else if(kind==='split'){
  base={display:'grid','grid-template-columns':'repeat(2,minmax(0,1fr))',gap:(o.gap+8)+'px',width:'100%','min-width':'0','box-sizing':'border-box','align-items':'center'};
  tablet={'grid-template-columns':'repeat('+Math.min(2,o.tabletColumns)+',minmax(0,1fr))'};
  mobile={'grid-template-columns':'minmax(0,1fr)'};
 }else throw new Error('Kiểu bố cục áp dụng không hợp lệ.');
 return{options:o,base:base,tablet:tablet,mobile:mobile};
}
function cssText(style){
 return Object.keys(style||{}).map(function(key){
  return key.replace(/[A-Z]/g,function(c){return '-'+c.toLowerCase();})+':'+style[key]+';';
 }).join('');
}
function selectedLayoutCss(selector,kind,options){
 if(!/^\\.cv-p124-selected-[a-z0-9_-]{1,64}$/.test(String(selector||'')))throw new Error('Selector P124 không hợp lệ.');
 var rules=selectedLayoutRules(kind,options),o=rules.options,css=selector+'{'+cssText(rules.base)+'}';
 if(rules.tablet)css+='@media(max-width:'+o.tabletBreakpoint+'px){'+selector+'{'+cssText(rules.tablet)+'}}';
 if(rules.mobile)css+='@media(max-width:'+o.mobileBreakpoint+'px){'+selector+'{'+cssText(rules.mobile)+'}}';
 return css;
}
function selectedVariantCss(selector,variant){
 if(!/^\\.cv-p124-selected-[a-z0-9_-]{1,64}$/.test(String(selector||'')))throw new Error('Selector P124 không hợp lệ.');
 if(!Object.prototype.hasOwnProperty.call(VARIANTS,variant))throw new Error('Biến thể component không hợp lệ.');
 var style=VARIANTS[variant];
 return selector+'[data-canvio-variant="'+variant+'"]{background:'+style.background+';border:'+style.border+';box-shadow:'+style.boxShadow+';}';
}
function setSelectedRules(ed,selector,rules,css){
 if(ed.Css&&typeof ed.Css.setRule==='function'){
  ed.Css.setRule(selector,rules.base||rules);
  if(rules.tablet)ed.Css.setRule(selector,rules.tablet,{atRuleType:'media',atRuleParams:'(max-width: '+rules.options.tabletBreakpoint+'px)'});
  if(rules.mobile)ed.Css.setRule(selector,rules.mobile,{atRuleType:'media',atRuleParams:'(max-width: '+rules.options.mobileBreakpoint+'px)'});
  return true;
 }
 if(typeof ed.addStyle==='function'){ed.addStyle(css);return true;}
 return false;
}
async function applyLayoutToSelected(kind,options){
 var ed=window.CVWeb,component=selectedTarget();
 if(!ed||!component)return{ok:false,saved:false,error:'Hãy chọn một phần tử trong Website Engine trước.'};
 if(!KINDS.filter(function(x){return x!=='card';}).includes(kind))return{ok:false,saved:false,error:'Chỉ có thể áp dụng Stack, Row, Grid hoặc Split cho phần tử đang chọn.'};
 if(typeof component.addAttributes!=='function')return{ok:false,saved:false,error:'Phần tử được chọn không hỗ trợ thuộc tính component.'};
 var rules,cls=selectedTargetClass(component),selector='.'+cls;
 try{
  rules=selectedLayoutRules(kind,options);
  if(!setSelectedRules(ed,selector,rules,selectedLayoutCss(selector,kind,options)))return{ok:false,saved:false,error:'GrapesJS chưa sẵn sàng để lưu CSS layout.'};
  component.addClass(cls);
  component.addAttributes({'data-canvio-auto-layout':kind,'data-canvio-layout-version':VERSION,'data-canvio-variant':rules.options.variant});
 }catch(error){return{ok:false,saved:false,error:'Không áp dụng được layout: '+cleanText(error&&error.message,'lỗi GrapesJS',100)};}
 try{
  if(!window.CV||!CV.engines||!CV.engines.web||typeof CV.engines.web.save!=='function')
   return{ok:false,saved:false,className:cls,error:'Đã áp dụng trong phiên nhưng Website Engine chưa có hàm lưu.'};
  var saved=await Promise.resolve(CV.engines.web.save());
  if(saved===false)return{ok:false,saved:false,className:cls,error:'Đã áp dụng trong phiên nhưng lưu thất bại. Hãy kiểm tra và lưu lại trong Website Engine.'};
  return{ok:true,saved:true,className:cls,kind:kind,error:''};
 }catch(error){return{ok:false,saved:false,className:cls,error:'Đã áp dụng trong phiên nhưng lưu thất bại.'};}
}
async function applyVariantToSelected(variant){
 var ed=window.CVWeb,component=selectedTarget();
 if(!ed||!component)return{ok:false,saved:false,error:'Hãy chọn một phần tử trong Website Engine trước.'};
 if(typeof component.addAttributes!=='function')return{ok:false,saved:false,error:'Phần tử được chọn không hỗ trợ thuộc tính component.'};
 var cls=selectedTargetClass(component),selector='.'+cls,css;
 try{
  css=selectedVariantCss(selector,variant);
  var style=VARIANTS[variant];
  if(ed.Css&&typeof ed.Css.setRule==='function')ed.Css.setRule(selector+'[data-canvio-variant="'+variant+'"]',{background:style.background,border:style.border,'box-shadow':style.boxShadow});
  else if(typeof ed.addStyle==='function')ed.addStyle(css);
  else return{ok:false,saved:false,error:'GrapesJS chưa sẵn sàng để lưu biến thể.'};
  component.addClass(cls);
  component.addAttributes({'data-canvio-variant':variant});
 }catch(error){return{ok:false,saved:false,error:'Không áp dụng được biến thể: '+cleanText(error&&error.message,'lỗi GrapesJS',100)};}
 try{
  if(!window.CV||!CV.engines||!CV.engines.web||typeof CV.engines.web.save!=='function')
   return{ok:false,saved:false,className:cls,error:'Đã áp dụng trong phiên nhưng Website Engine chưa có hàm lưu.'};
  var saved=await Promise.resolve(CV.engines.web.save());
  if(saved===false)return{ok:false,saved:false,className:cls,error:'Đã áp dụng trong phiên nhưng lưu thất bại.'};
  return{ok:true,saved:true,className:cls,variant:variant,error:''};
 }catch(error){return{ok:false,saved:false,className:cls,error:'Đã áp dụng trong phiên nhưng lưu thất bại.'};}
}
async function applyResponsiveToSelected(options){
 var ed=window.CVWeb,component=selectedTarget();
 if(!ed||!component)return{ok:false,saved:false,error:'Hãy chọn một phần tử trong Website Engine trước.'};
 var o=normalize('grid',options),cls=selectedTargetClass(component),selector='.'+cls,css=selectedResponsiveCss(selector,o);
 if(!(ed.Css&&typeof ed.Css.setRule==='function')&&typeof ed.addStyle!=='function')
  return{ok:false,saved:false,error:'GrapesJS chưa sẵn sàng để lưu CSS responsive.'};
 try{
  if(ed.Css&&typeof ed.Css.setRule==='function'){
   ed.Css.setRule(selector,{display:'grid','grid-template-columns':'repeat('+o.desktopColumns+',minmax(0,1fr))',gap:o.gap+'px','min-width':'0','box-sizing':'border-box'});
   ed.Css.setRule(selector,{'grid-template-columns':'repeat('+o.tabletColumns+',minmax(0,1fr))',gap:o.gap+'px'},{atRuleType:'media',atRuleParams:'(max-width: '+o.tabletBreakpoint+'px)'});
   ed.Css.setRule(selector,{'grid-template-columns':'repeat('+o.mobileColumns+',minmax(0,1fr))',gap:o.gap+'px'},{atRuleType:'media',atRuleParams:'(max-width: '+o.mobileBreakpoint+'px)'});
  }else ed.addStyle(css);
  component.addClass(cls);
 }catch(error){return{ok:false,saved:false,error:'Không áp dụng được CSS responsive: '+cleanText(error&&error.message,'lỗi GrapesJS',100)};}
 try{
  if(!window.CV||!CV.engines||!CV.engines.web||typeof CV.engines.web.save!=='function')
   return{ok:false,saved:false,className:cls,error:'Đã áp dụng trong phiên nhưng Website Engine chưa có hàm lưu.'};
  var saved=await Promise.resolve(CV.engines.web.save());
  if(saved===false)return{ok:false,saved:false,className:cls,error:'Đã áp dụng trong phiên nhưng lưu thất bại. Hãy kiểm tra và lưu lại trong Website Engine.'};
  return{ok:true,saved:true,className:cls,error:''};
 }catch(error){return{ok:false,saved:false,className:cls,error:'Đã áp dụng trong phiên nhưng lưu thất bại.'};}
}
async function insert(kind, options) {
  var markup;
  try { markup = render(kind, options); }
  catch (error) { return { ok: false, inserted: false, saved: false, error: error.message }; }
  if (!window.CVWeb || typeof window.CVWeb.addComponents !== 'function' ||
      !window.CV || !window.CV.engines || !window.CV.engines.web ||
      typeof window.CV.engines.web.save !== 'function') {
    return { ok: false, inserted: false, saved: false, error: 'Website Engine chưa sẵn sàng. Hãy mở Website Engine rồi thử lại.' };
  }
  try {
    var added = await Promise.resolve(window.CVWeb.addComponents(markup));
    if (added === false) return { ok: false, inserted: false, saved: false, error: 'Website Engine từ chối chèn thành phần.' };
  } catch (error) {
    return { ok: false, inserted: false, saved: false, error: 'Không thể chèn thành phần: ' + cleanText(error && error.message, 'lỗi editor', 120) };
  }
  try {
    var saved = await Promise.resolve(window.CV.engines.web.save());
    if (saved === false) return { ok: false, inserted: true, saved: false, error: 'Đã chèn vào phiên hiện tại nhưng Website Engine từ chối lưu. Hãy kiểm tra và dùng Hoàn tác nếu cần.' };
    return { ok: true, inserted: true, saved: true, error: '' };
  } catch (error) {
    return { ok: false, inserted: true, saved: false, error: 'Đã chèn vào phiên hiện tại nhưng lưu thất bại. Hãy kiểm tra editor và dùng Hoàn tác nếu cần.' };
  }
}
function make(tag, attrs, text) {
  var el = document.createElement(tag), k;
  Object.keys(attrs || {}).forEach(function (key) {
    if (key === 'style') el.style.cssText = attrs[key];
    else el.setAttribute(key, attrs[key]);
  });
  if (text != null) el.textContent = text;
  return el;
}
function mount() {
  if (!document || typeof document.getElementById !== 'function') return false;
  var host = document.getElementById('page-webEngine');
  if (!host || host.querySelector('[data-canvio-p124-panel]')) return false;
  var panel = make('section', {
    'data-canvio-p124-panel': '1',
    'aria-label': 'Auto Layout và Component',
    style: 'margin:16px 0;padding:16px;border:1px solid #cbd5e1;border-radius:14px;background:var(--surface,#fff);color:var(--text,#0f172a);'
  });
  var heading = make('h3', { style: 'margin:0 0 6px;font-size:16px;font-weight:700;' }, 'Auto Layout & Component');
  var help = make('p', { style: 'margin:0 0 12px;color:var(--muted,#64748b);font-size:13px;line-height:1.5;' },
    'Chọn bố cục, biến thể và breakpoint. Thành phần được chèn vào Website Engine hiện tại; có thể chỉnh sửa tiếp trong GrapesJS.');
  var row = make('div', { style: 'display:flex;flex-wrap:wrap;gap:8px;align-items:center;' });
  var select = make('select', { 'aria-label': 'Biến thể component', style: 'min-height:36px;padding:6px 10px;border:1px solid #cbd5e1;border-radius:8px;background:transparent;color:inherit;' });
  inspect().variants.forEach(function (v) {
    var option = make('option', { value: v }, v.charAt(0).toUpperCase() + v.slice(1));
    select.appendChild(option);
  });
  function field(labelText, attrs, initial) {
    var label = make('label', { style: 'display:flex;flex-direction:column;gap:4px;min-width:112px;font-size:11px;color:var(--muted,#64748b);font-weight:600;' }, labelText);
    var input = make('input', attrs);
    input.value = String(initial);
    label.appendChild(input);
    return { label: label, input: input };
  }
  var settings = make('div', { style: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(112px,1fr));gap:8px;margin:12px 0;' });
  var title = field('Tiêu đề', { id: 'cv-p124-title', type: 'text', maxlength: '120', 'aria-label': 'Tiêu đề thành phần', style: 'width:100%;min-height:34px;box-sizing:border-box;padding:6px 8px;border:1px solid #cbd5e1;border-radius:8px;background:transparent;color:inherit;' }, 'Tiêu đề thành phần');
  var description = field('Mô tả', { id: 'cv-p124-description', type: 'text', maxlength: '240', 'aria-label': 'Mô tả thành phần', style: 'width:100%;min-height:34px;box-sizing:border-box;padding:6px 8px;border:1px solid #cbd5e1;border-radius:8px;background:transparent;color:inherit;' }, 'Mô tả ngắn — nhấp để chỉnh sửa nội dung.');
  var gap = field('Khoảng cách (px)', { id: 'cv-p124-gap', type: 'number', min: '8', max: '64', step: '1', 'aria-label': 'Khoảng cách' }, 20);
  var minWidth = field('Rộng tối thiểu (px)', { id: 'cv-p124-minwidth', type: 'number', min: '180', max: '480', step: '10', 'aria-label': 'Chiều rộng tối thiểu' }, 240);
  var mobileBreakpoint = field('Mobile tối đa (px)', { id: 'cv-p124-break-mobile', type: 'number', min: '320', max: '767', step: '1', 'aria-label': 'Breakpoint mobile' }, 640);
  var tabletBreakpoint = field('Tablet tối đa (px)', { id: 'cv-p124-break-tablet', type: 'number', min: '768', max: '1280', step: '1', 'aria-label': 'Breakpoint tablet' }, 960);
  var mobileColumns = field('Cột mobile', { id: 'cv-p124-cols-mobile', type: 'number', min: '1', max: '2', step: '1', 'aria-label': 'Số cột mobile' }, 1);
  var tabletColumns = field('Cột tablet', { id: 'cv-p124-cols-tablet', type: 'number', min: '1', max: '4', step: '1', 'aria-label': 'Số cột tablet' }, 2);
  var desktopColumns = field('Cột desktop', { id: 'cv-p124-cols-desktop', type: 'number', min: '2', max: '6', step: '1', 'aria-label': 'Số cột desktop' }, 3);
  [title, description, gap, minWidth, mobileBreakpoint, tabletBreakpoint, mobileColumns, tabletColumns, desktopColumns].forEach(function (f) { settings.appendChild(f.label); });
  var status = make('p', { role: 'status', 'aria-live': 'polite', style: 'margin:10px 0 0;font-size:12px;color:var(--muted,#64748b);' }, 'Chọn bố cục để chèn vào trang.');
  inspect().layouts.forEach(function (layout) {
    var button = make('button', {
      type: 'button',
      'data-p124-kind': layout.id,
      style: 'min-height:36px;padding:7px 12px;border:1px solid #cbd5e1;border-radius:8px;background:transparent;color:inherit;cursor:pointer;font:inherit;'
    }, layout.label);
    button.addEventListener('click', async function () {
      button.disabled = true;
      status.textContent = 'Đang chèn ' + layout.label + '…';
      var result = await insert(layout.id, {
        variant: select.value, title: title.input.value, description: description.input.value,
        gap: gap.input.value, minWidth: minWidth.input.value,
        mobileBreakpoint: mobileBreakpoint.input.value, tabletBreakpoint: tabletBreakpoint.input.value,
        mobileColumns: mobileColumns.input.value, tabletColumns: tabletColumns.input.value, desktopColumns: desktopColumns.input.value
      });
      status.textContent = result.ok ? 'Đã chèn và lưu thành công.' : result.error;
      button.disabled = false;
    });
    row.appendChild(button);
  });
  var selectedButton = make('button', {
    type: 'button',
    'data-p124-apply-selected': '1',
    style: 'min-height:36px;padding:7px 12px;border:1px solid #64748b;border-radius:8px;background:var(--primary,#2563eb);color:#fff;cursor:pointer;font:inherit;'
  }, 'Áp dụng breakpoint cho phần tử đang chọn');
  selectedButton.addEventListener('click', async function () {
    selectedButton.disabled = true;
    status.textContent = 'Đang áp dụng responsive cho phần tử được chọn…';
    var result = await applyResponsiveToSelected({
      gap: gap.input.value,
      mobileBreakpoint: mobileBreakpoint.input.value,
      tabletBreakpoint: tabletBreakpoint.input.value,
      mobileColumns: mobileColumns.input.value,
      tabletColumns: tabletColumns.input.value,
      desktopColumns: desktopColumns.input.value
    });
    status.textContent = result.ok ? 'Đã áp dụng và lưu responsive cho ' + result.className + '.' : result.error;
    selectedButton.disabled = false;
  });
  row.appendChild(selectedButton);
  var selectedLayoutSelect=make('select',{'aria-label':'Bố cục phần tử đang chọn','id':'cv-p124-selected-layout',style:'min-height:36px;padding:6px 10px;border:1px solid #cbd5e1;border-radius:8px;background:transparent;color:inherit;'});
  ['stack','row','grid','split'].forEach(function(kind){selectedLayoutSelect.appendChild(make('option',{value:kind},kind.charAt(0).toUpperCase()+kind.slice(1)));});
  var selectedLayoutButton=make('button',{type:'button','data-p124-apply-layout':'1',style:'min-height:36px;padding:7px 12px;border:1px solid #64748b;border-radius:8px;background:transparent;color:inherit;cursor:pointer;font:inherit;'},'Áp dụng bố cục cho phần tử đang chọn');
  selectedLayoutButton.addEventListener('click',async function(){
    selectedLayoutButton.disabled=true;status.textContent='Đang áp dụng bố cục cho phần tử được chọn…';
    var result=await applyLayoutToSelected(selectedLayoutSelect.value,{variant:select.value,gap:gap.input.value,minWidth:minWidth.input.value,mobileBreakpoint:mobileBreakpoint.input.value,tabletBreakpoint:tabletBreakpoint.input.value,mobileColumns:mobileColumns.input.value,tabletColumns:tabletColumns.input.value,desktopColumns:desktopColumns.input.value});
    status.textContent=result.ok?'Đã áp dụng và lưu '+result.kind+' cho '+result.className+'.':result.error;
    selectedLayoutButton.disabled=false;
  });
  var selectedVariantButton=make('button',{type:'button','data-p124-apply-variant':'1',style:'min-height:36px;padding:7px 12px;border:1px solid #64748b;border-radius:8px;background:transparent;color:inherit;cursor:pointer;font:inherit;'},'Áp dụng biến thể cho phần tử đang chọn');
  selectedVariantButton.addEventListener('click',async function(){
    selectedVariantButton.disabled=true;status.textContent='Đang áp dụng biến thể…';
    var result=await applyVariantToSelected(select.value);
    status.textContent=result.ok?'Đã áp dụng và lưu biến thể '+result.variant+'.':result.error;
    selectedVariantButton.disabled=false;
  });
  row.appendChild(selectedLayoutSelect);row.appendChild(selectedLayoutButton);row.appendChild(selectedVariantButton);
  panel.appendChild(heading); panel.appendChild(help); row.appendChild(select); panel.appendChild(row); panel.appendChild(settings); panel.appendChild(status);
  host.appendChild(panel);
  return true;
}
function hasPanel() {
  var host = document && typeof document.getElementById === 'function' ? document.getElementById('page-webEngine') : null;
  return !!(host && host.querySelector && host.querySelector('[data-canvio-p124-panel]'));
}
function start() {
  if (mount() || hasPanel()) return;
  if (typeof MutationObserver === 'function' && document && document.documentElement) {
    var observer = new MutationObserver(function () {
      if (mount() || hasPanel()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
}
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading' && document.addEventListener) document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
}
var api = { version: VERSION, inspect: inspect, normalize: normalize, render: render, selectedResponsiveCss: selectedResponsiveCss, selectedLayoutCss: selectedLayoutCss, applyLayoutToSelected: applyLayoutToSelected, selectedVariantCss: selectedVariantCss, applyVariantToSelected: applyVariantToSelected, applyResponsiveToSelected: applyResponsiveToSelected, insert: insert, mount: mount };
api.tests = function () {
  var n = normalize('grid', { columns: 99, gap: 1, minWidth: 900, variant: 'unknown' });
  var g = render('grid', { columns: 4, minWidth: 260, gap: 24 });
  var s = render('split', { minWidth: 360 });
  var r = render('row', { minWidth: 220 });
  var c = render('card', { variant: 'elevated', title: '<script>alert(1)<' + '/script>' });
  return {
    rejectsUnknownLayout: (function () { try { normalize('unknown'); return false; } catch (e) { return true; } })(),
    clampsColumns: n.columns === 6,
    clampsGap: n.gap === 8,
    clampsMinWidth: n.minWidth === 480,
    rejectsUnknownVariant: n.variant === 'surface',
    gridUsesConfiguredColumns: g.indexOf('grid-template-columns:repeat(4,minmax(0,1fr))') >= 0,
    splitUsesResponsiveGrid: s.indexOf('grid-template-columns:repeat(2,minmax(0,1fr))') >= 0 && s.indexOf('@media(max-width:640px)') >= 0,
    rowUsesFlexWrap: /flex-wrap:wrap/.test(r),
    cardVariantIsTagged: /data-canvio-variant="elevated"/.test(c),
    escapesUserText: !/<script>alert/.test(c) && /&lt;script&gt;/.test(c),
    boundsTextLength: normalize('card', { title: 'x'.repeat(200) }).title.length === 120,
    exposesFourVariants: inspect().variants.length === 4,
    clampsMobileColumns: normalize('grid', { mobileColumns: 9 }).mobileColumns === 2,
    breakpointsOrdered: normalize('grid', { mobileBreakpoint: 760, tabletBreakpoint: 768 }).tabletBreakpoint > normalize('grid', { mobileBreakpoint: 760, tabletBreakpoint: 768 }).mobileBreakpoint,
    responsiveRulesAreScoped: /data-canvio-p124-breakpoints/.test(g) && /cv-p124-layout-/.test(g),
    exposesBreakpointControls: inspect().breakpointControls.length === 5,
    selectedResponsiveCssHasThreeRanges: (selectedResponsiveCss('.cv-p124-selected-unit', { desktopColumns: 4, tabletColumns: 2, mobileColumns: 1 }).match(/@media/g) || []).length === 2,
    selectedResponsiveCssRejectsUnsafeSelector: (function () { try { selectedResponsiveCss('body', {}); return false; } catch (e) { return true; } })(),
    selectedResponsiveColumnsAreBounded: normalize('grid', { desktopColumns: 99, tabletColumns: 0, mobileColumns: 9 }).desktopColumns === 6 && normalize('grid', { desktopColumns: 99, tabletColumns: 0, mobileColumns: 9 }).tabletColumns === 1 && normalize('grid', { desktopColumns: 99, tabletColumns: 0, mobileColumns: 9 }).mobileColumns === 2,
    selectedResponsiveBreakpointsAreOrdered: normalize('grid', { mobileBreakpoint: 760, tabletBreakpoint: 768 }).tabletBreakpoint > normalize('grid', { mobileBreakpoint: 760, tabletBreakpoint: 768 }).mobileBreakpoint,
    selectedLayoutGridHasThreeBreakpoints: (selectedLayoutCss('.cv-p124-selected-unit', 'grid', { desktopColumns: 4, tabletColumns: 2, mobileColumns: 1 }).match(/@media/g) || []).length === 2,
    selectedLayoutCssRejectsUnsafeSelector: (function () { try { selectedLayoutCss('body', 'grid', {}); return false; } catch (e) { return true; } })(),
    selectedVariantCssRejectsUnknownVariant: (function () { try { selectedVariantCss('.cv-p124-selected-unit', 'unknown'); return false; } catch (e) { return true; } })(),
    selectedLayoutKeepsOnlyKnownLayoutKinds: (function () { try { selectedLayoutRules('card', {}); return false; } catch (e) { return true; } })()
  };
};
window.CVAutoLayoutP124 = api;
})();
