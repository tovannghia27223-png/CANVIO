const fs=require('fs'),vm=require('vm');
const js=fs.readFileSync(__dirname+'/../../canvio-p118-wordmark.js','utf8');
const h=fs.readFileSync(__dirname+'/../../index.html','utf8');
const m=h.match(/<script id="canvio-lot118w">([\s\S]*?)<\/script>/);
const FONT=process.env.CANVIO_TEST_TTF||'/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf';
let bad=0;const ck=(n,v)=>{if(v!==true){console.log('FAIL',n);bad++}};
if(!m){console.log('FAIL embedded lot missing');process.exit(1)}
ck('embedded equals standalone',m[1].replace(/\r\n/g,'\n').trim()===js.replace(/\r\n/g,'\n').trim());
for(const [name,src] of [['standalone',js],['embedded',m[1]]]){
  const sb={window:{},document:{readyState:'loading',addEventListener(){}},console,Math,Array,String,Number,Object,JSON,DataView,ArrayBuffer,Error};
  vm.runInNewContext(src,sb);const A=sb.window.CVWordmarkP118;ck(name+' api',!!A);
  if(!A)continue;
  const has=fs.existsSync(FONT);ck(name+' test font present',has);if(!has)continue;
  const b=fs.readFileSync(FONT),ab=b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength);
  const f=A.parse(ab);ck(name+' upm',f.upm===2048||f.upm===1000);
  const gA=f.cmap(65),gV=f.cmap(86),gSp=f.cmap(32);ck(name+' cmap A,V,space',gA>0&&gV>0&&gA!==gV&&gSp>0);
  ck(name+' AV kerned negative',A.kernPair(f,gA,gV)<0);
  const k=A.layout(f,'AV',{size:100,kerning:true}),n=A.layout(f,'AV',{size:100,kerning:false});ck(name+' kerning narrows',k.width<n.width-1);
  ck(name+' tracking widens',A.layout(f,'AV',{size:100,tracking:100,kerning:false}).width>n.width+15);
  const g=A.glyph(f,f.cmap(79));ck(name+' O has 2 contours',g.length===2);
  const s=A.toSvg(f,'Logo é',{size:100});ck(name+' svg shape',/^<svg /.test(s.svg)&&s.d.indexOf('NaN')<0&&s.d.split('Z').length>6&&/viewBox="0 0 [\d.]+ [\d.]+"/.test(s.svg));
  ck(name+' escapes title',A.toSvg(f,'<b>&"',{}).svg.indexOf('<b>')<0);
  ck(name+' missing counted',A.toSvg(f,'A中',{}).missing===1);
  ck(name+' empty text',A.toSvg(f,'',{}).d==='');
  let t=0;for(const bad of [new ArrayBuffer(4),new Uint8Array([0x4f,0x54,0x54,0x4f,0,0,0,0,0,0,0,0,0]).buffer,new Uint8Array(64).buffer]){try{A.parse(bad)}catch(e){t++}}ck(name+' rejects bad fonts',t===3);
  const trunc=ab.slice(0,2000);let tr=false;try{A.parse(trunc)}catch(e){tr=true}ck(name+' rejects truncated',tr);
}
(async()=>{
  const zlib=require('zlib'),buf=fs.readFileSync(FONT),dvv=new DataView(buf.buffer,buf.byteOffset,buf.byteLength),n=dvv.getUint16(4);
  const tabs=[];for(let i=0;i<n;i++){const o=12+i*16;tabs.push({tag:buf.subarray(o,o+4),ck:dvv.getUint32(o+4),off:dvv.getUint32(o+8),len:dvv.getUint32(o+12)})}
  const comp=tabs.map(t=>{const raw=buf.subarray(t.off,t.off+t.len),z=zlib.deflateSync(raw);return z.length<raw.length?z:raw});
  let pos=44+n*20;const offs=comp.map(c=>{const o=pos;pos+=(c.length+3)&~3;return o});
  const w=Buffer.alloc(pos);w.write('wOFF',0,'latin1');w.writeUInt32BE(0x00010000,4);w.writeUInt32BE(pos,8);w.writeUInt16BE(n,12);
  tabs.forEach((t,i)=>{const o=44+i*20;t.tag.copy(w,o);w.writeUInt32BE(offs[i],o+4);w.writeUInt32BE(comp[i].length,o+8);w.writeUInt32BE(t.len,o+12);w.writeUInt32BE(t.ck,o+16);comp[i].copy(w,offs[i])});
  const ab=w.buffer.slice(w.byteOffset,w.byteOffset+w.length);
  for(const [name,src] of [['standalone',js],['embedded',m[1]]]){
    const sb={window:{},document:{readyState:'loading',addEventListener(){}},console,Math,Array,String,Number,Object,JSON,DataView,ArrayBuffer,Uint8Array,Promise,Response,DecompressionStream,Error};
    vm.runInNewContext(src,sb);const A=sb.window.CVWordmarkP118;
    const f=await A.parseAsync(ab),g=A.parse(new Uint8Array(buf).buffer);
    ck(name+' woff parses',!!f&&f.upm===g.upm);
    ck(name+' woff svg equals ttf svg',A.toSvg(f,'Hay',{size:100}).d===A.toSvg(g,'Hay',{size:100}).d);
    let r=0;try{A.parse(ab)}catch(e){r++}ck(name+' sync parse rejects woff',r===1);
    let bd=0;try{await A.parseAsync(ab.slice(0,60))}catch(e){bd++}ck(name+' truncated woff rejected',bd===1);
  }
  console.log(bad?'P118w WOFF FAIL':'P118w WOFF OK');process.exit(bad?1:0);
})();
