'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const zlib = require('node:zlib');
const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'canvio-p105-p107-depth-parallax.js'), 'utf8');
const checks = {};
function test(name, fn) { try { fn(); checks[name] = true; } catch (error) { checks[name] = false; console.error('FAIL', name, error.stack || error); } }
async function asyncTest(name, fn) { try { await fn(); checks[name] = true; } catch (error) { checks[name] = false; console.error('FAIL', name, error.stack || error); } }
function crc32(bytes) { let crc = 0xffffffff; for (const b of bytes) { crc ^= b; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); } return (crc ^ 0xffffffff) >>> 0; }
function pngChunk(type, data) { const name = Buffer.from(type); const head = Buffer.alloc(4); head.writeUInt32BE(data.length); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([name, data]))); return Buffer.concat([head, name, data, crc]); }
function makePng(width=1,height=1) {
  const signature = Buffer.from([137,80,78,71,13,10,26,10]);
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width,0); ihdr.writeUInt32BE(height,4); ihdr[8]=8; ihdr[9]=6;
  const raw = Buffer.alloc((width*4+1)*height); for(let y=0;y<height;y++){raw[y*(width*4+1)]=0;for(let x=0;x<width;x++){const i=y*(width*4+1)+1+x*4;raw[i]=x*41%256;raw[i+1]=y*53%256;raw[i+2]=120;raw[i+3]=255;}}
  return Buffer.concat([signature, pngChunk('IHDR', ihdr), pngChunk('IDAT', zlib.deflateSync(raw)), pngChunk('IEND', Buffer.alloc(0))]);
}
function zipStored(entries, options={}) {
  const locals=[], centrals=[]; let offset=0;
  for (const item of entries) {
    const name=Buffer.from(item.name,'utf8'), data=Buffer.from(item.data), flags=item.flags ?? options.flags ?? 0, method=item.method ?? options.method ?? 0;
    const crc=(crc32(data) ^ ((item.corruptCrc || options.corruptCrc) ? 1 : 0)) >>> 0;
    const lh=Buffer.alloc(30); lh.writeUInt32LE(0x04034b50,0); lh.writeUInt16LE(20,4); lh.writeUInt16LE(flags,6); lh.writeUInt16LE(method,8); lh.writeUInt32LE(crc,14); lh.writeUInt32LE(data.length,18); lh.writeUInt32LE(data.length,22); lh.writeUInt16LE(name.length,26); lh.writeUInt16LE(0,28);
    locals.push(lh,name,data);
    const ch=Buffer.alloc(46); ch.writeUInt32LE(0x02014b50,0); ch.writeUInt16LE(20,4); ch.writeUInt16LE(20,6); ch.writeUInt16LE(flags,8); ch.writeUInt16LE(method,10); ch.writeUInt32LE(crc,16); ch.writeUInt32LE(data.length,20); ch.writeUInt32LE(data.length,24); ch.writeUInt16LE(name.length,28); ch.writeUInt16LE(0,30); ch.writeUInt16LE(0,32); ch.writeUInt16LE(0,34); ch.writeUInt16LE(0,36); ch.writeUInt32LE(0,38); ch.writeUInt32LE(offset,42);
    centrals.push(ch,name); offset += lh.length + name.length + data.length;
  }
  const central=Buffer.concat(centrals), body=Buffer.concat(locals), eocd=Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50,0); eocd.writeUInt16LE(0,4); eocd.writeUInt16LE(0,6); eocd.writeUInt16LE(entries.length,8); eocd.writeUInt16LE(entries.length,10); eocd.writeUInt32LE(central.length,12); eocd.writeUInt32LE(body.length,16); eocd.writeUInt16LE(0,20);
  return Buffer.concat([body,central,eocd]);
}
const png = makePng();
const png2x1 = makePng(2,1);
const baseManifest = { format:'CANVIO_DEPTH_PRESET_BUNDLE', version:1, model:'onnx-community/depth-anything-v2-small-ONNX', license:'Apache-2.0', sourceMime:'image/png', depthMime:'image/png', width:1, height:1, strength:0, duration:6, backend:'wasm-q8', sourceName:'source.png', depthName:'depth.png', createdAt:'2026-11-18T00:00:00.000Z' };
function bundle(manifest=baseManifest, options={}) {
  const entries=[{name:'manifest.json',data:JSON.stringify(manifest)}, {name:'source.png',data:options.sourcePng || png}, {name:'depth.png',data:options.depthPng || png}];
  if (options.extra) entries.push({name:options.extra,data:'x'});
  if (options.duplicate) entries.push({name:'source.png',data:png});
  if (options.pathName) entries[1].name=options.pathName;
  if (options.corruptData) entries[1].corruptCrc=true;
  return zipStored(entries, options);
}
function makeEnv({failAt=0}={}) {
  let records=[], next=1, adds=0;
  const CV={assets:{
    list:()=>records,
    async addBlob(file){ adds++; if (failAt && adds===failAt) throw new Error('fixture forced Asset Library failure'); const row={id:'asset-'+next++,name:file.name,type:file.type,data:'blob:fixture-'+next}; records.unshift(row); return row; },
    remove(id){ records=records.filter(x=>x.id!==id); return true; }
  }};
  const LS={set(_key, rows){ records=rows; return true; }};
  const CVZip={crc32};
  const win={CV,LS,CVZip,addEventListener(){},CANVIOProjectBundle:{exportZip(){}}};
  const document={readyState:'complete',getElementById(){return null;}};
  const sandbox={window:win,document,CV,LS,CVZip,File,Blob,URL,TextDecoder,TextEncoder,Uint8Array,DataView,ArrayBuffer,Date,console,setTimeout,clearTimeout};
  vm.runInNewContext(source,sandbox,{filename:'canvio-p105-p107-depth-parallax.js'});
  return {api:win.CANVIODepthParallaxP105, list:()=>records};
}
const env=makeEnv(); const api=env.api;
function ab(buf){const b=Buffer.from(buf);return b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength);}
test('P107 strict parser accepts exact three-file ZIP bundle',()=>{const parsed=api.parsePresetZip(ab(bundle()));assert.equal(parsed.entryCount,3);assert.equal(parsed.manifest.format,'CANVIO_DEPTH_PRESET_BUNDLE');});
test('P107 preserves valid numeric strength zero',()=>{const parsed=api.parsePresetZip(ab(bundle()));assert.equal(parsed.manifest.strength,0);});
test('P107 v2 accepts distinct source and depth image dimensions',()=>{const m={...baseManifest,version:2,sourceWidth:2,sourceHeight:1,depthWidth:1,depthHeight:1};const parsed=api.parsePresetZip(ab(bundle(m,{sourcePng:png2x1})));assert.equal(parsed.sourceInfo.width,2);assert.equal(parsed.depthInfo.width,1);assert.equal(parsed.manifest.width,1);});
test('P107 v2 rejects PNG dimensions that disagree with the declared source size',()=>{const m={...baseManifest,version:2,sourceWidth:3,sourceHeight:1,depthWidth:1,depthHeight:1};assert.throws(()=>api.parsePresetZip(ab(bundle(m,{sourcePng:png2x1}))),/Kích thước PNG/i);});
test('P107 rejects encrypted ZIP entries',()=>assert.throws(()=>api.parsePresetZip(ab(bundle(baseManifest,{flags:1}))),/STORE|ZIP/i));
test('P107 rejects data-descriptor ZIP entries',()=>assert.throws(()=>api.parsePresetZip(ab(bundle(baseManifest,{flags:8}))),/STORE|ZIP/i));
test('P107 rejects compressed ZIP methods',()=>assert.throws(()=>api.parsePresetZip(ab(bundle(baseManifest,{method:8}))),/STORE|ZIP/i));
test('P107 rejects path traversal and non-allowlisted names',()=>{assert.throws(()=>api.parsePresetZip(ab(bundle(baseManifest,{pathName:'../source.png'}))),/allowlist|Tên file/i);assert.throws(()=>api.parsePresetZip(ab(bundle(baseManifest,{extra:'payload.txt'}))),/allowlist|Tên file/i);});
test('P107 rejects duplicate ZIP filenames',()=>assert.throws(()=>api.parsePresetZip(ab(bundle(baseManifest,{duplicate:true}))),/trùng|central directory|bạn/i));
test('P107 validates entry CRC32 before accepting PNG bytes',()=>assert.throws(()=>api.parsePresetZip(ab(bundle(baseManifest,{corruptData:true}))),/CRC32/i));
test('P107 rejects invalid metadata, zero/oversized dimensions and out-of-range strength',()=>{assert.throws(()=>api.parsePresetZip(ab(bundle({...baseManifest,strength:.2}))),/Thông số|metadata/i);assert.throws(()=>api.parsePresetZip(ab(bundle({...baseManifest,width:2}))),/Kích thước|dimensions/i);});
(async()=>{
  await asyncTest('P107 imports source/depth into the existing Asset Library and retains zero strength',async()=>{
    const local=makeEnv(); const data=ab(bundle()); const file={size:data.byteLength,arrayBuffer:async()=>data};
    const result=await local.api.importPresetBundle(file); const rows=local.list();
    assert.equal(rows.length,2); assert.equal(result.width,1); assert.equal(result.height,1);
    const source=rows.find(x=>x.id===result.sourceAssetId); const depth=rows.find(x=>x.id===result.depthAssetId);
    assert.ok(source && depth); assert.equal(source.canvioDepth.parallax.strength,0); assert.equal(source.canvioDepth.depthAssetId,depth.id);
    assert.equal(depth.canvioDepth.kind,'depth-map');
  });
  await asyncTest('P107 v2 imports source/depth with independent dimensions and preserves zero strength',async()=>{
    const local=makeEnv(); const m={...baseManifest,version:2,sourceWidth:2,sourceHeight:1,depthWidth:1,depthHeight:1}; const data=ab(bundle(m,{sourcePng:png2x1})); const file={size:data.byteLength,arrayBuffer:async()=>data};
    const result=await local.api.importPresetBundle(file); const rows=local.list(); const source=rows.find(x=>x.id===result.sourceAssetId); const depth=rows.find(x=>x.id===result.depthAssetId);
    assert.equal(result.sourceWidth,2); assert.equal(result.sourceHeight,1); assert.equal(result.width,1); assert.equal(result.height,1);
    assert.equal(source.canvioDepth.sourceWidth,2); assert.equal(source.canvioDepth.depthWidth,1); assert.equal(source.canvioDepth.parallax.strength,0); assert.equal(depth.canvioDepth.width,1);
  });
  await asyncTest('P107 rolls back a partial Asset Library import after a later write fails',async()=>{
    const local=makeEnv({failAt:2}); const data=ab(bundle()); const file={size:data.byteLength,arrayBuffer:async()=>data};
    await assert.rejects(()=>local.api.importPresetBundle(file),/forced Asset Library failure/);
    assert.equal(local.list().length,0);
  });
  const passed=Object.values(checks).filter(Boolean).length;
  const report={suite:'CANVIO_P107_PORTABLE_PRESET_SECURITY_AND_ASSET_ROUNDTRIP',candidate:'23.3.108-p85-studio-r2',passed,total:Object.keys(checks).length,checks,fixture:'synthetic 1x1 and 2x1 RGBA PNGs plus uncompressed STORE ZIP; v1 backward compatibility and v2 independent dimensions',cloudSyncExecuted:false,crossDevicePhysicalRoundtripExecuted:false};
  fs.writeFileSync(path.join(__dirname,'p107-portable-preset-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
  if(passed!==Object.keys(checks).length) process.exit(1);
})().catch(error=>{console.error(error);process.exit(1);});
