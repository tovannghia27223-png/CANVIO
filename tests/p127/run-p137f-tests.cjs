const fs=require('fs'),vm=require('vm');
const js=fs.readFileSync(__dirname+'/../../canvio-p137-frames.js','utf8'),h=fs.readFileSync(__dirname+'/../../index.html','utf8');
const m=h.match(/<script id="canvio-lot137f">([\s\S]*?)<\/script>/);let bad=0;const ck=(n,v)=>{if(v!==true){console.log('FAIL',n);bad++}};
ck('embedded lot present',!!m);ck('embedded equals standalone',!!m&&m[1].replace(/\r\n/g,'\n').trim()===js.replace(/\r\n/g,'\n').trim());
for(const [name,src] of [['standalone',js],['embedded',m[1]]]){
  const sb={window:{},document:{readyState:'loading',addEventListener(){}},console,Math,Array,String,Number,Object};vm.runInNewContext(src,sb);const A=sb.window.CVFramesP137;ck(name+' api',!!A);if(!A)continue;
  const meas=s=>s.length*10;
  const text='một hai ba bốn năm sáu bảy tám chín mười\nđoạn hai ngắn';
  const r=A.splitText(text,[{width:100,lines:2},{width:100,lines:2}],meas);
  ck(name+' two chunks',r.chunks.length===2);
  ck(name+' chunks fit their frame when re-wrapped',r.chunks.every(c=>A.wrapLines(c.text,100,meas).length<=2));
  const back=[r.chunks[0].text+r.chunks[0].sep+r.chunks[1].text+(r.tail?r.chunks[1].sep+r.tail.text:'')].join('');
  ck(name+' lossless join',back.replace(/\s+/g,' ')===text.replace(/\s+/g,' '));
  ck(name+' overflow goes to tail',!!r.tail&&r.tail.text.length>0);
  const r2=A.splitText('a b',[{width:100,lines:5}],meas);ck(name+' short text no tail',r2.tail===null&&r2.chunks[0].text==='a b');
  const r3=A.splitText('x\n\ny',[{width:100,lines:1},{width:100,lines:1},{width:100,lines:1}],meas);
  ck(name+' paragraph breaks kept',r3.chunks[0].sep==='\n'&&r3.chunks[1].text===''&&r3.chunks[2].text==='y');
  const r4=A.splitText('supercalifragilistic',[{width:50,lines:1}],meas);ck(name+' long word placed alone',r4.chunks[0].text==='supercalifragilistic');
  const r5=A.splitText('a b c d e f g h',[{width:30,lines:0}],meas);ck(name+' min one line',r5.chunks[0].text.length>0);
}
console.log(bad?'P137f FAIL':'P137f OK');process.exit(bad?1:0)
