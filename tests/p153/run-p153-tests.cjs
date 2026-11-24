const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
function load(file){const store={};const win={};win.window=win;win.localStorage={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]},get length(){return Object.keys(store).length},key:i=>Object.keys(store)[i]};
 win.document={readyState:'complete',getElementById:()=>null,addEventListener(){},dispatchEvent(){}};win.addEventListener=()=>{};win.setTimeout=setTimeout;win.URL=URL;win.CustomEvent=function(){};
 vm.createContext(win);vm.runInContext(fs.readFileSync(path.join(__dirname,'..','..',file),'utf8'),win,{filename:file});return win;}
let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;};
/* P153 */
const B=load('canvio-p153-board.js').CVBoardP153;
ok(B.colorNameOf('#dc2626')==='Đỏ'&&B.colorNameOf('#2563eb')==='Xanh dương'&&B.colorNameOf('#16a34a')==='Xanh lá','tên màu cơ bản');
ok(B.colorNameOf('#f97316')==='Cam'&&B.colorNameOf('#eab308')==='Vàng'&&B.colorNameOf('#7c3aed')==='Tím','tên màu 2');
ok(B.colorNameOf('#111111')==='Đen'&&B.colorNameOf('#fafafa')==='Trắng'&&B.colorNameOf('#888888')==='Xám'&&B.colorNameOf('#7a4a1f')==='Nâu','trung tính + nâu');
const px=new Uint8ClampedArray(4*100);for(let i=0;i<100;i++){const o=i*4;if(i<70){px[o]=250;px[o+1]=110;px[o+2]=20;}else{px[o]=20;px[o+1]=40;px[o+2]=220;}px[o+3]=255;}
const pal=B.palette(px,5);ok(pal.length===2,'2 màu chủ đạo: '+pal);ok(B.colorNameOf(pal[0])==='Cam'&&B.colorNameOf(pal[1])==='Xanh dương','thứ tự theo độ phủ');
const tr=new Uint8ClampedArray(8);tr[3]=0;tr[7]=0;ok(B.palette(tr).length===0,'bỏ điểm trong suốt');
const items=[{id:1,name:'A',kind:'Logo',names:['Cam'],note:'',url:''},{id:2,name:'B',kind:'Web',names:['Xanh dương','Cam'],note:'hero',url:''},{id:3,name:'C',kind:'Logo',names:[],note:'',url:'https://x.vn'}];
ok(B.filterItems(items,{color:'Cam'}).length===2&&B.filterItems(items,{kind:'Logo'}).length===2&&B.filterItems(items,{kind:'Logo',color:'Cam'}).length===1,'lọc màu/loại');
ok(B.filterItems(items,{q:'hero'}).length===1&&B.filterItems(items,{q:'x.vn'}).length===1&&B.filterItems(items,{}).length===3,'tìm chữ');
ok(B.safeUrl('javascript:alert(1)')===''&&B.safeUrl('example.com')==='https://example.com/'&&B.safeUrl('')==='','link an toàn');
B.addLink('example.com',{name:'Ex',kind:'Web'}).then(it=>{ok(it.type==='link'&&B.list().length===1,'thêm link');B.update(it.id,{note:'ghi chú'});ok(B.list()[0].note==='ghi chú','sửa ghi chú');return B.remove(it.id).catch(()=>{});}).then(()=>{ok(B.list().length===0,'xóa');
 return B.addLink('javascript:alert(1)').then(()=>{throw new Error('phải lỗi')},e=>{ok(/không hợp lệ/.test(e.message),'chặn link xấu');});}).then(()=>{
/* P154 */
const P=load('canvio-p154-panorama.js').CVPanoramaP154;
const sw=512,sh=256,d=new Uint8ClampedArray(sw*sh*4);for(let y=0;y<sh;y++)for(let x=0;x<sw;x++){const o=(y*sw+x)*4;d[o]=Math.round(x/(sw-1)*255);d[o+1]=Math.round(y/(sh-1)*255);d[o+2]=0;d[o+3]=255;}
const src={data:d,w:sw,h:sh};
function centre(yaw,pitch,fov){const out={data:new Uint8ClampedArray(64*36*4),w:64,h:36};P.renderView(src,out,yaw,pitch,fov);const o=(18*64+32)*4;return [out.data[o],out.data[o+1]];}
let c=centre(0,0,90);ok(Math.abs(c[0]-127.5)<5&&Math.abs(c[1]-127.5)<5,'yaw0 pitch0 giữa ảnh '+c);
c=centre(90,0,90);ok(Math.abs(c[0]-(0.75*255))<5,'yaw90 → 3/4 chiều ngang '+c);
c=centre(-90,0,90);ok(Math.abs(c[0]-(0.25*255))<5,'yaw-90 → 1/4 '+c);
c=centre(180,0,90);ok(c[0]<8||c[0]>247,'yaw180 → mép ghép '+c);
c=centre(0,45,90);ok(Math.abs(c[1]-(0.25*255))<6,'pitch45 → nhìn lên (hàng y nhỏ) '+c);
c=centre(0,-45,90);ok(Math.abs(c[1]-(0.75*255))<6,'pitch-45 → nhìn xuống '+c);
const a=centre(30,10,60),b=centre(30,10,60);ok(a[0]===b[0]&&a[1]===b[1],'xác định (deterministic)');
ok(JSON.stringify(P.outSize('16:9',1280))==='{"w":1280,"h":720}'&&JSON.stringify(P.outSize('9:16',1280))==='{"w":720,"h":1280}'&&JSON.stringify(P.outSize('1:1',1000))==='{"w":1000,"h":1000}','kích thước theo tỉ lệ');
ok(P.isEquirect(4096,2048)&&!P.isEquirect(1920,1080),'nhận diện 2:1');
/* P155–157 */
const S=load('canvio-p155-scene-pack.js').CVScenePackP155;
ok(!S.saveCard({type:'character',name:'',desc:'x'}).ok&&!S.saveCard({type:'x',name:'a',desc:'b'}).ok&&!S.saveCard({type:'space',name:'a',desc:''}).ok,'từ chối thẻ thiếu');
const c1=S.saveCard({type:'character',name:'Thám tử Minh',desc:'nam 30 tuổi, áo khoác nâu',traits:'sẹo mày trái',refs:['i1']}).card;
const c2=S.saveCard({type:'space',name:'Văn phòng cũ',desc:'tường gạch, đèn vàng'}).card;
ok(S.readCards().length===2,'lưu 2 thẻ');
S.saveCard({id:c1.id,type:'character',name:'Minh',desc:'đã sửa'});ok(S.readCards().length===2&&S.readCards().some(x=>x.name==='Minh'),'sửa thẻ không nhân bản');
const ex=S.exportCards();const before=S.readCards().length;S.removeCard(c2.id);ok(S.readCards().length===before-1,'xóa thẻ');
const im=S.importCards(ex);ok(im.ok&&im.count===2&&S.readCards().length===2,'nhập lại khôi phục');ok(!S.importCards('{"a":1}').ok&&!S.importCards('xx').ok,'chặn tệp sai');
ok(S.SHOTS.length>=8,'≥8 góc máy');
let r=S.buildPrompt({action:'lao xe',roles:{}});ok(!r.ok&&/thiếu/.test(r.error),'thiếu vai báo lỗi');
r=S.buildPrompt({action:'lao xe qua ngã tư',roles:{character:{cardId:c1.id,ref:'ảnh 1'},environment:{cardId:c2.id,ref:'ảnh 2'},camera:{shotId:'wide-follow',ref:'ảnh 3'}}});
ok(r.ok&&/\[Nhân vật\] \(tham chiếu: ảnh 1\)/.test(r.prompt)&&/\[Không gian\]/.test(r.prompt)&&/\[Góc máy\]/.test(r.prompt)&&/Phân công/.test(r.prompt)&&r.shotSeconds===5,'prompt đủ vai');
ok(S.toneDelta(['#ff8800','#1122cc'],['#ff8800','#1122cc'])===0,'cùng tông = 0');
const dFar=S.toneDelta(['#ff8800'],['#0044ff']),dNear=S.toneDelta(['#ff8800'],['#f08a10']);
ok(dFar>dNear&&dFar>14&&dNear<14,'đo lệch tông '+dNear+' / '+dFar);
ok(S.toneVerdict(dFar).ok===false&&S.toneVerdict(dNear).ok===true&&S.toneVerdict(null).ok===null,'kết luận tông');
console.log('P153–P157 node tests passed:',n);
}).catch(e=>{console.error('FAIL',e);process.exit(1);});
