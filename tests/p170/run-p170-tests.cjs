const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path'),{webcrypto}=require('crypto');
let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;};
/* thư mục giả trong bộ nhớ */
function mkDir(){
  const files={},dirs={};
  const self={files,dirs,
    async getDirectoryHandle(k,o){ if(!dirs[k]){ if(!(o&&o.create)) throw new Error('NotFound'); dirs[k]=mkDir(); } return dirs[k]; },
    async getFileHandle(k,o){
      if(!(k in files)){ if(!(o&&o.create)) throw new Error('NotFound'); files[k]=new Uint8Array(0); }
      return {
        async createWritable(){ return { async write(d){ files[k]=typeof d==='string'?new TextEncoder().encode(d):new Uint8Array(d); }, async close(){} }; },
        async getFile(){ const b=files[k]; return { async text(){ return new TextDecoder().decode(b); }, async arrayBuffer(){ return b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength); } }; }
      };
    },
    entries(){ const ks=Object.keys(files).concat(Object.keys(dirs)); let i=0; return { next(){ return Promise.resolve(i<ks.length?{done:false,value:[ks[i++]]}:{done:true}); } }; }
  };
  return self;
}
const root=mkDir();root.name='Kho';root.queryPermission=async()=>'granted';root.requestPermission=async()=>'granted';
const kv={};const idb={open(){const r={};setTimeout(()=>{r.result={createObjectStore(){},transaction(){return{objectStore(){return{get(k){const q={};setTimeout(()=>{q.result=kv[k];q.onsuccess&&q.onsuccess()});return q},put(v,k){kv[k]=v;}}},set oncomplete(f){setTimeout(f)}}}};r.onupgradeneeded&&r.onupgradeneeded();r.onsuccess&&r.onsuccess();});return r;}};
/* tài nguyên giả: 2 ảnh khác nội dung + 1 bản trùng nội dung + 1 tệp không có dữ liệu */
const b64=s=>Buffer.from(s).toString('base64');
let assets=[{id:'a1',name:'a/b:c.png',mime:'image/png',data:'data:image/png;base64,'+b64('AAAA-1'),cat:'image'},{id:'a2',name:'b.png',mime:'image/png',data:'data:image/png;base64,'+b64('BBBB-2'),cat:'image'},{id:'a3',name:'trung.png',mime:'image/png',data:'data:image/png;base64,'+b64('AAAA-1'),cat:'image'},{id:'a4',name:'rong.png',mime:'image/png',data:'',cat:'image'}];
const win={};win.window=win;win.document={readyState:'complete',getElementById:()=>null,addEventListener(){}};win.setTimeout=setTimeout;win.crypto=webcrypto;win.btoa=s=>Buffer.from(s,'binary').toString('base64');win.atob=s=>Buffer.from(s,'base64').toString('binary');
win.TextEncoder=TextEncoder;win.TextDecoder=TextDecoder;win.indexedDB=idb;win.File=class{constructor(p,n,o){this.p=p;this.name=n;this.type=(o||{}).type||'';}};
win.CV={assets:{list:()=>assets,addBlob:async f=>{const u=f.p[0];assets.unshift({id:'n'+assets.length,name:f.name,mime:f.type,data:'data:'+f.type+';base64,'+Buffer.from(u).toString('base64'),cat:'image'});}}};
win.CVCreativeCore={active:{id:'p1',name:'Dự án thử',documents:{x:1}}};win.showDirectoryPicker=async()=>root;
/* Supabase Storage giả + máy khách P130 thật (WebCrypto) */
const store={};win.fetch=async(url,o)=>{const m=/\/storage\/v1\/object\/(authenticated\/)?(.+)$/.exec(url);const k=m[2];if(o.method==='POST'){store[k]=o.body;return{ok:true,status:200,text:async()=>'{}'};}
 if(!(k in store))return{ok:false,status:404,text:async()=>'nf'};return{ok:true,status:200,text:async()=>store[k]};};
vm.createContext(win);
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','..','canvio-p130-cloud.js'),'utf8'),win);
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','..','canvio-p170-storage-hub.js'),'utf8'),win);
const H=win.CVStorageHubP170,P=win.CVCloudP130;
(async()=>{
ok(H&&H.version==='170.0.0'&&H.bucket==='cv-assets','module nạp');
ok(H.safeName('a/b:c.png')==='a_b_c.png'&&H.safeName('..x')==='x'&&H.safeName('')==='tep'&&H.safeName('x'.repeat(300)).length===80,'safeName');
const p=H.parseDataUrl('data:image/png;base64,'+b64('hello'));ok(p&&p.mime==='image/png'&&Buffer.from(p.bytes).toString()==='hello','parseDataUrl base64');
ok(H.parseDataUrl('rác')===null,'parseDataUrl từ chối rác');ok(Buffer.from(H.parseDataUrl('data:text/plain,a%20b').bytes).toString()==='a b','parseDataUrl text');
ok(H.toDataUrl(new TextEncoder().encode('hi'),'text/plain')==='data:text/plain;base64,'+b64('hi'),'toDataUrl');
ok(H.missing([{sha:'1'},{sha:'2'}],['1']).length===1,'missing');
ok(/cv-assets/.test(H.sql)&&/auth\.uid\(\)/.test(H.sql)&&/public = false/.test(H.sql),'SQL bucket riêng tư + RLS theo uid');
const sqlFile=path.join(__dirname,'..','..','supabase','canvio-storage.sql');if(fs.existsSync(sqlFile))ok(fs.readFileSync(sqlFile,'utf8').replace(/\r/g,'')===H.sql,'tệp SQL khớp chuỗi trong module');
const d=await H.describe(assets);ok(d.items.length===2&&d.skipped===1&&d.items[0].sha!==d.items[1].sha,'describe: sha trùng nhận ra, tệp rỗng bỏ qua');
/* máy */
let e0=null;try{await H.saveLocal(false)}catch(e){e0=e}ok(e0&&/Chưa chọn/.test(e0.message),'chưa chọn thư mục thì báo rõ');
await H.pickFolder();ok((await H.folderState()).state==='granted','nhớ thư mục');
let r=await H.saveLocal(false);const R=root.dirs.CANVIO;
ok(r.saved===2&&r.kept===0&&r.skipped===1,'lưu máy: 2 tệp (trùng gộp)');
ok(Object.keys(R.dirs.assets.files).length===2&&Object.keys(R.dirs.assets.files).some(k=>k.endsWith('-a_b_c.png')),'tên tệp an toàn');
ok(JSON.parse(new TextDecoder().decode(R.files['manifest.json'])).assets.length===2&&JSON.parse(new TextDecoder().decode(R.dirs.projects.files['p1.json'])).name==='Dự án thử','manifest + dự án đang mở');
r=await H.saveLocal(false);ok(r.saved===0&&r.kept===2,'lưu lại không ghi trùng');
/* cloud */
let e1=null;try{await H.saveCloud()}catch(e){e1=e}ok(e1&&/mở khóa/.test(e1.message),'chưa mở khóa thì báo rõ');
const ls={};P.create&&0;const c=P.create({crypto:webcrypto,kdfIter:1000,storage:{getItem:k=>ls[k]??null,setItem:(k,v)=>{ls[k]=v},removeItem:k=>{delete ls[k]}},vault:{list:async()=>[],get:async()=>null,put:async()=>{},del:async()=>{}},fetch:async(u,o)=>{if(/auth\/v1\/signup|token/.test(u))return{ok:true,status:200,text:async()=>JSON.stringify({access_token:'T',refresh_token:'R',expires_in:3600,user:{id:'u1',email:'a@b.c'}})};if(/cv_meta/.test(u)&&o.method==='GET')return{ok:true,status:200,text:async()=>'[]'};return{ok:true,status:201,text:async()=>'[]'};}});
c.setCfg('https://abc.supabase.co','sb_publishable_xxxxxxxxxxxxxxxxxxxxxxxx');
ok(typeof c._key==='function'&&typeof c._token==='function','P130 lộ _key/_token');
try{await c.signUp('a@b.c','matkhau-12345');}catch(e){}
try{await c.signIn('a@b.c','matkhau-12345');}catch(e){}
try{await c.unlock('cum-mat-khau-ma-hoa');}catch(e){console.log('unlock',e.message)}
win.CVCloudP130.client=c;
ok(c.isUnlocked(),'đã mở khóa (giả)');
r=await H.saveCloud();ok(r.uploaded===2&&r.already===0,'cloud: 2 tệp mới '+JSON.stringify(r));
const keys=Object.keys(store);ok(keys.length===3&&keys.every(k=>k.startsWith('cv-assets/u1/')||k.startsWith('u1/')||/u1\//.test(k)),'đường dẫn theo uid');
ok(!Object.values(store).some(v=>v.includes('AAAA')||v.includes(b64('AAAA-1'))||v.includes('a/b')),'nội dung và tên tệp không lộ trong bản mã');
r=await H.saveCloud();ok(r.uploaded===0&&r.already===2,'cloud: không tải lại tệp đã có');
/* khôi phục sang "máy mới" */
assets=[{id:'z',name:'a/b:c.png',mime:'image/png',data:'data:image/png;base64,'+b64('AAAA-1'),cat:'image'}];
r=await H.restoreCloud();ok(r.restored===1&&r.already===1&&r.failed===0,'khôi phục cloud chỉ lấy tệp thiếu '+JSON.stringify(r));
assets=[];r=await H.restoreLocal(false);ok(r.restored===2&&r.failed===0,'khôi phục từ máy '+JSON.stringify(r));
/* hỏng một bên không hỏng bên kia */
const kvSave=kv.folder;delete kv.folder;H._setHandle(null);assets=[{id:'q',name:'q.png',mime:'image/png',data:'data:image/png;base64,'+b64('QQ'),cat:'image'}];
const both=await H.saveBoth(false);ok(!both.local.ok&&both.cloud.ok&&both.cloud.r.uploaded===1,'máy lỗi vẫn lưu cloud');ok(/Máy lỗi/.test(H.summary(both))&&/Cloud: 1 mới/.test(H.summary(both)),'tóm tắt từng bên');
kv.folder=kvSave;H._setHandle(root);win.CVCloudP130.client=null;const b2=await H.saveBoth(false);ok(b2.local.ok&&!b2.cloud.ok,'cloud lỗi vẫn lưu máy');
console.log('P170 node tests passed:',n);})().catch(e=>{console.error(e);process.exit(1)});
