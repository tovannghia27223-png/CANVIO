/* P241: bounded RFC4180-style CSV parser. Runs only after explicit user interaction. */
function parse(text){
 text=String(text||'').replace(/^\uFEFF/,'');
 var rows=[],row=[],cell='',quoted=false;
 for(var i=0;i<text.length;i++){var c=text[i];
  if(quoted){if(c==='"'&&text[i+1]==='"'){cell+='"';i++;}else if(c==='"')quoted=false;else cell+=c;}
  else if(c==='"'){if(cell.length)throw Error('Dấu ngoặc kép chỉ được mở ở đầu ô.');quoted=true;}
  else if(c===','){row.push(cell);cell='';}
  else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(function(x){return x.trim()!=='';}))rows.push(row);row=[];cell='';}
  else cell+=c;
 }
 if(quoted)throw Error('CSV có dấu ngoặc kép chưa đóng.');
 row.push(cell);if(row.some(function(x){return x.trim()!=='';}))rows.push(row);
 if(!rows.length)return{headers:[],records:[],errors:['CSV trống']};
 var headers=rows.shift().map(function(x){return x.trim();}),seen=Object.create(null);
 headers.forEach(function(x){if(!x)throw Error('Tên cột CSV không được để trống.');if(seen[x])throw Error('Tên cột CSV bị trùng: '+x);seen[x]=true;});
 if(rows.length>500)throw Error('Tối đa 500 dòng mỗi lượt.');
 var errors=[],records=[];
 rows.forEach(function(r,i){if(r.length!==headers.length){errors.push('Dòng '+(i+2)+': có '+r.length+' cột, cần '+headers.length);return;}var o={};headers.forEach(function(h,j){o[h]=r[j];});records.push(o);});
 return{headers:headers,records:records,errors:errors};
}
self.onmessage=function(e){try{self.postMessage(Object.assign({ok:true},parse(e&&e.data&&e.data.text)));}catch(err){self.postMessage({ok:false,error:String(err&&err.message||err)});}};