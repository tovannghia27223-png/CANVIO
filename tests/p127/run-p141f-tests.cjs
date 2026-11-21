const fs=require('fs'),vm=require('vm');
const js=fs.readFileSync(__dirname+'/../../canvio-p141-fonts.js','utf8'),p118=fs.readFileSync(__dirname+'/../../canvio-p118-wordmark.js','utf8');
const h=fs.readFileSync(__dirname+'/../../index.html','utf8'),m=h.match(/<script id="canvio-lot141f">([\s\S]*?)<\/script>/);
const FULL=process.env.CANVIO_TEST_TTF||'/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',PART=process.env.CANVIO_TEST_TTF_PARTIAL||'/usr/share/fonts/truetype/crosextra/Caladea-Bold.ttf';
let bad=0;const ck=(n,v)=>{if(v!==true){console.log('FAIL',n);bad++}};
if(!m){console.log('FAIL lot missing');process.exit(1)}
ck('embedded equals standalone',m[1].replace(/\r\n/g,'\n').trim()===js.replace(/\r\n/g,'\n').trim());
const ab=f=>{const b=fs.readFileSync(f);return b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)};
for(const [name,src] of [['standalone',js],['embedded',m[1]]]){
  const sb={window:{},document:{readyState:'loading',addEventListener(){}},console,Math,Array,String,Number,Object,JSON,DataView,ArrayBuffer,Error,Date};
  vm.createContext(sb);vm.runInContext(p118,sb);vm.runInContext(src,sb);const A=sb.window.CVFontsP141;ck(name+' api',!!A);if(!A)continue;
  ck(name+' charset 146',A.VN.length===146&&A.VN.includes('ễ')&&A.VN.includes('Đ')&&A.VN.includes('ặ'));
  const full=A.analyze(ab(FULL),'LiberationSans-Regular.ttf');ck(name+' full font complete',full.vnComplete&&full.vnCoverage===100&&full.vnMissing.length===0);
  ck(name+' family name read',/Liberation/i.test(full.family));ck(name+' not variable',full.variable===false);ck(name+' kerning flagged',full.kerning===true);
  const part=A.analyze(ab(PART),'Caladea-Bold.ttf');ck(name+' partial font incomplete',!part.vnComplete&&part.vnMissing.length>5&&part.vnCoverage<100&&part.vnCoverage>0);
  ck(name+' missing list are real chars',part.vnMissing.every(c=>A.VN.includes(c)));
  const rep=A.report([full,part]);ck(name+' report counts',rep.completeFonts===1&&rep.fonts.length===2&&JSON.stringify(rep).indexOf('undefined')<0);
  const mk=(family,serif,ok)=>({family,serif,vnComplete:ok});
  const sg=A.suggest([mk('Lora',true,true),mk('Inter',false,true),mk('Broken',true,false),mk('Inter',false,true)]);ck(name+' suggests complete pair only',sg.length===1&&sg[0].heading==='Lora'&&sg[0].body==='Inter');
  ck(name+' no pair without both kinds',A.suggest([mk('A',true,true)]).length===0&&A.suggest(null).length===0);
  let t=0;for(const b of [new ArrayBuffer(8),new Uint8Array(64).buffer]){try{A.analyze(b,'x.ttf')}catch(e){t++}}ck(name+' rejects bad fonts',t===2);
}
console.log(bad?'P141f FAIL':'P141f OK');process.exit(bad?1:0)
