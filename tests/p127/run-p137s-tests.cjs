const fs=require('fs'),vm=require('vm');
const js=fs.readFileSync(__dirname+'/../../canvio-p137-styles.js','utf8');
const h=fs.readFileSync(__dirname+'/../../index.html','utf8'),m=h.match(/<script id="canvio-lot137s">([\s\S]*?)<\/script>/);
let bad=0;const ck=(n,v)=>{if(v!==true){console.log('FAIL',n);bad++}};
if(!m){console.log('FAIL lot missing');process.exit(1)}
ck('embedded equals standalone',m[1].replace(/\r\n/g,'\n').trim()===js.replace(/\r\n/g,'\n').trim());
for(const [name,src] of [['standalone',js],['embedded',m[1]]]){
  const store={};const sb={window:{},document:{readyState:'loading',addEventListener(){}},localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v}},console,Math,Array,String,Number,Object,JSON,Error,RegExp,Event:function(){}};
  vm.createContext(sb);vm.runInContext(src,sb);const A=sb.window.CVStylesP137;ck(name+' api',!!A);if(!A)continue;
  const t=A.tests();for(const k in t)ck(name+' '+k,t[k]===true);
  store['canvio137:styles']=JSON.stringify({'Tiêu đề 1':{fontSize:'40px',level:1},'Kiểu mới':{color:'red;x',fontSize:'11px'},'<bad>':{fontSize:'9px'}});
  const L=A.load();ck(name+' load overrides default',L['Tiêu đề 1'].fontSize==='40px'&&!('fontWeight' in L['Tiêu đề 1']));ck(name+' load adds valid custom only',L['Kiểu mới']&&L['Kiểu mới'].fontSize==='11px'&&!('color' in L['Kiểu mới'])&&!L['<bad>']);
  store['canvio137:styles']='{not json';ck(name+' corrupt storage falls back',A.load()['Thân bài'].fontSize==='15px');
}
console.log(bad?'P137s FAIL':'P137s OK');process.exit(bad?1:0)
