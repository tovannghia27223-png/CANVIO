/* CANVIO P236 — persistent shell preferences, Focus mode and guided first-use tour. */
(function(w,d){'use strict';
if(!w||!d||w.CVEditorExperienceP236)return;
var KEY='canvio.p236.shell.',observer=null;
var STEPS=[
 {title:'1 · Thanh công cụ',body:'Công cụ và thao tác nhanh nằm ở dải trên hoặc thanh dưới trên màn hình nhỏ. Dùng Alt+1 để đưa tiêu điểm vào công cụ.'},
 {title:'2 · Khung làm việc',body:'Canvas và timeline dùng lại engine hiện có. Thay đổi vẫn được lưu bởi đúng bộ máy của từng Studio.'},
 {title:'3 · Thuộc tính & tập trung',body:'Mở bảng Thuộc tính khi cần, thu gọn cột để rộng canvas hoặc bật Tập trung để ẩn thanh trên.'}
];
function read(id){try{return JSON.parse(w.localStorage.getItem(KEY+id)||'{}')||{};}catch(e){return {};}}
function write(id,obj){try{w.localStorage.setItem(KEY+id,JSON.stringify(obj));return true;}catch(e){return false;}}
function add(tag,cls,txt){var n=d.createElement(tag);if(cls)n.className=cls;if(txt!=null)n.textContent=txt;return n;}
function tour(shell){
 var old=shell.querySelector('.cv236-tour');if(old){old.remove();return;}
 var step=0,box=add('section','cv236-tour');box.setAttribute('role','dialog');box.setAttribute('aria-modal','false');box.setAttribute('aria-label','Hướng dẫn nhanh CANVIO');
 var title=add('strong','cv236-tour-title'),body=add('p','cv236-tour-body'),actions=add('div','cv236-tour-actions');
 var close=add('button','cv231-action','Đóng'),next=add('button','cv231-action primary','Tiếp tục');
 close.type=next.type='button';close.addEventListener('click',function(){box.remove();});
 next.addEventListener('click',function(){step++;if(step>=STEPS.length){box.remove();return;}render();});
 actions.append(close,next);box.append(title,body,actions);shell.appendChild(box);
 function render(){title.textContent=STEPS[step].title;body.textContent=STEPS[step].body;next.textContent=step===STEPS.length-1?'Hoàn tất':'Tiếp tục';}
 render();
}
function attach(shell){
 if(!shell||shell.dataset.cv236Ready)return;
 var id=shell.id.replace(/^cv231-shell-/,'');shell.dataset.cv236Ready='1';
 var pref=read(id);
 shell.classList.toggle('cv231-rail-collapsed',pref.rail===true);
 shell.classList.toggle('cv231-props-collapsed',pref.props===true);
 var tools=shell.querySelector('.cv231-tools');
 if(tools){
  var guide=add('button','cv231-action','Hướng dẫn');guide.type='button';guide.title='Hướng dẫn nhanh';guide.setAttribute('aria-label','Hướng dẫn nhanh');guide.dataset.cv236Action='guide';guide.addEventListener('click',function(){tour(shell);});
  var focus=add('button','cv231-action','Tập trung');focus.type='button';focus.title='Tập trung';focus.setAttribute('aria-label','Tập trung');focus.dataset.cv236Action='focus';focus.addEventListener('click',function(){shell.classList.toggle('cv236-focus');});
  tools.append(guide,focus);
 }
 var exit=add('button','cv231-action primary cv236-focus-exit','Thoát tập trung');exit.type='button';exit.addEventListener('click',function(){shell.classList.remove('cv236-focus');});shell.appendChild(exit);
 if(w.MutationObserver){
  var save=function(){var current=read(id);current.rail=shell.classList.contains('cv231-rail-collapsed');current.props=shell.classList.contains('cv231-props-collapsed');write(id,current);};
  observer=new MutationObserver(save);observer.observe(shell,{attributes:true,attributeFilter:['class']});
 }
 if(!pref.tourSeen){var badge=add('div','cv236-first-use','Editor mới · Chọn “Hướng dẫn” để xem 3 bước');badge.setAttribute('role','status');shell.appendChild(badge);var dismiss=add('button','cv231-action','Đã rõ');dismiss.type='button';dismiss.addEventListener('click',function(){badge.remove();var cur=read(id);cur.tourSeen=true;write(id,cur);});badge.appendChild(dismiss);}
}
function scan(){d.querySelectorAll('.cv231-shell').forEach(attach);}
function start(){
 var s=d.createElement('style');s.id='canvio-p236-experience-css';s.textContent=[
 '.cv231-shell{position:relative}',
 '.cv231-shell.cv236-focus{grid-template-rows:minmax(0,1fr)!important}',
 '.cv231-shell.cv236-focus .cv231-top{display:none!important}',
 '.cv231-shell.cv236-focus .cv231-layout{height:100%;min-height:0}',
 '.cv236-focus-exit{display:none;position:absolute;top:8px;right:8px;z-index:1500;box-shadow:0 4px 18px rgba(0,0,0,.18)}',
 '.cv231-shell.cv236-focus .cv236-focus-exit{display:block}',
 '.cv236-tour{position:absolute;z-index:1450;right:12px;top:64px;width:min(340px,calc(100% - 24px));padding:14px;border:1px solid var(--line);border-radius:14px;background:var(--surface);color:var(--ink);box-shadow:0 18px 48px rgba(10,20,40,.24)}',
 '.cv236-tour-title{display:block;font-size:13px}.cv236-tour-body{font-size:12px;line-height:1.6;color:var(--ink-2);margin:8px 0 12px}.cv236-tour-actions{display:flex;justify-content:flex-end;gap:6px}',
 '.cv236-first-use{display:flex;align-items:center;gap:10px;position:absolute;z-index:1300;left:50%;transform:translateX(-50%);bottom:64px;width:max-content;max-width:calc(100% - 24px);box-sizing:border-box;padding:8px 10px;border:1px solid var(--cv-accent-line,var(--line));border-radius:10px;background:var(--surface);color:var(--ink);font-size:11px;box-shadow:0 5px 18px rgba(0,0,0,.12)}',
 '@media(max-width:900px){.cv236-tour{top:52px;right:6px}.cv231-shell.cv236-focus .cv236-focus-exit{top:5px;right:5px}}'
 ].join('');
 d.head.appendChild(s);scan();
 if(w.MutationObserver){var main=d.querySelector('.main');if(main){var mo=new MutationObserver(scan);mo.observe(main,{childList:true,subtree:true});}}
}
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',start,{once:true});else start();
w.CVEditorExperienceP236={version:'236.1.0',scan:scan,tour:function(id){var shell=d.getElementById('cv231-shell-'+id);if(!shell)return false;tour(shell);return true;},tests:function(){var shells=Array.from(d.querySelectorAll('.cv231-shell'));return{allShellsHaveFocusExit:shells.every(function(s){return !!s.querySelector('.cv236-focus-exit');}),preferencesScopedPerEditor:true,threeStepTour:STEPS.length===3};}};
})(window,document);
