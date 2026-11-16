'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)];
const match = [...html.matchAll(/<script\s+id=["']canvio-p56-portable-archive-preflight["'][^>]*>([\s\S]*?)<\/script\s*>/ig)][0];
if (!match) throw new Error('P56 archive preflight script not found in index.html');
const p56 = match[1];
let passed = 0;
function assert(name, condition, detail = '') {
  if (!condition) throw new Error(`FAIL ${name}${detail ? `: ${detail}` : ''}`);
  passed++;
  console.log(`PASS ${name}`);
}
function crc32(bytes) {
  let c = 0xffffffff;
  for (const value of bytes) {
    c ^= value;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  return (c ^ 0xffffffff) >>> 0;
}
function concat(parts) {
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) { out.set(part, offset); offset += part.length; }
  return out;
}
function zip(entries, options = {}) {
  const encoder = new TextEncoder();
  const local = [], central = [];
  let offset = 0;
  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const data = encoder.encode(entry.data ?? '{}');
    const checksum = crc32(data);
    const localFlags = entry.localFlags ?? entry.flags ?? 0x0800;
    const centralFlags = entry.centralFlags ?? entry.flags ?? 0x0800;
    const method = entry.method ?? 0;
    const lh = new Uint8Array(30), lv = new DataView(lh.buffer);
    lv.setUint32(0, 0x04034b50, true); lv.setUint16(4, 20, true); lv.setUint16(6, localFlags, true);
    lv.setUint16(8, method, true); lv.setUint32(14, checksum, true); lv.setUint32(18, data.length, true);
    lv.setUint32(22, data.length, true); lv.setUint16(26, name.length, true);
    local.push(lh, name, data);
    const ch = new Uint8Array(46), cv = new DataView(ch.buffer);
    cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true);
    cv.setUint16(8, centralFlags, true); cv.setUint16(10, method, true); cv.setUint32(16, checksum, true);
    cv.setUint32(20, data.length, true); cv.setUint32(24, data.length, true); cv.setUint16(28, name.length, true);
    cv.setUint32(42, offset, true);
    central.push(ch, name);
    offset += lh.length + name.length + data.length;
  }
  const localBytes = concat(local), centralBytes = concat(central);
  const end = new Uint8Array(22), ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, entries.length, true); ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralBytes.length, true); ev.setUint32(16, localBytes.length, true);
  const bytes = concat([localBytes, centralBytes, end]);
  if (options.mutate) options.mutate(bytes, {localBytes, centralBytes, endOffset: bytes.length - 22});
  return bytes;
}
function asFile(bytes) {
  return {
    size: bytes.length,
    slice(start, end) {
      const part = bytes.slice(start, end);
      return { arrayBuffer: async () => part.buffer.slice(part.byteOffset, part.byteOffset + part.byteLength) };
    }
  };
}
const windowMock = {
  CANVIO_BUILD: { version: '23.3.69-p55', base: '23.3.68-p54', features: ['P55'] },
  CANVIOPhaseSuite: { version: '55.0.0', tests: () => ({priorPhase:true}) },
  CANVIOReleaseGate: { run: async () => ({format:'CANVIO_P55_RELEASE_READINESS',candidate:'P55',phaseSuite:'55.0.0',releaseCertified:false}) }
};
const context = { window:windowMock, document:{title:''}, TextDecoder, TextEncoder, DataView, Uint8Array, ArrayBuffer, Number, Math, Object, String, RegExp, Error, Promise, JSON, Date, Set, Map, console };
vm.createContext(context);
vm.runInContext(p56, context, { timeout:3000 });
const api = windowMock.CANVIOArchivePreflight;
assert('P56 archive preflight API is installed', !!api && api.version === '56.0.0');
assert('P56 candidate marker advances without changing P55 base lineage', windowMock.CANVIO_BUILD.version === '23.3.70-p56' && windowMock.CANVIO_BUILD.base === '23.3.69-p55');
assert('P56 PhaseSuite preserves prior tests and appends its own flags', windowMock.CANVIOPhaseSuite.version === '56.0.0' && windowMock.CANVIOPhaseSuite.tests().priorPhase && windowMock.CANVIOPhaseSuite.tests().p56ArchivePreflight);
assert('P56 release report wrapper is installed without self-certification', !!windowMock.CANVIOReleaseGate.run.__canvioP56Wrapped);

(async()=>{
const wrappedRelease = await windowMock.CANVIOReleaseGate.run();
assert('P56 release report declares P56 evidence and never self-certifies', wrappedRelease.format==='CANVIO_P56_RELEASE_READINESS' && wrappedRelease.candidate==='P56' && wrappedRelease.releaseCertified===false && wrappedRelease.archivePreflight.centralDirectoryVerified);
const good = zip([{name:'manifest.json',data:'{}'},{name:'full-backup.json',data:'{"format":"CANVIO_FULL_BACKUP"}'},{name:'README_RESTORE.md',data:'restore'}]);
const report = await api.inspect(asFile(good));
assert('Valid CVZip-style stored archive passes full EOCD and Central Directory validation', report.valid && report.entryCount === 3 && report.backupEntryPresent && report.manifestPresent);
assert('P56 reports read-only, no-mutation scope', report.scope.readOnly && report.scope.noProjectMutation && report.scope.noStorageWrite);
assert('P56 verifies exact Local Header/Central Directory layout', report.scope.centralDirectoryVerified && report.scope.localHeadersMatched);
assert('P56 records entry names and uncompressed sizes without reading project values', report.entries.some(x=>x.name==='full-backup.json') && report.totalUncompressedBytes > 0);

let missingPayload = false;
try { await api.inspect(asFile(zip([{name:'manifest.json',data:'{}'}]))); } catch (e) { missingPayload = /không có full-backup.json/.test(e.message); }
assert('P56 rejects ZIP without full-backup.json', missingPayload);
let duplicate = false;
try { await api.inspect(asFile(zip([{name:'full-backup.json',data:'{}'},{name:'full-backup.json',data:'{}'}]))); } catch (e) { duplicate = /trùng lặp/.test(e.message); }
assert('P56 rejects duplicate entry names', duplicate);
let traversal = false;
try { await api.inspect(asFile(zip([{name:'../full-backup.json',data:'{}'}]))); } catch (e) { traversal = /không an toàn|đường dẫn/.test(e.message); }
assert('P56 rejects traversal paths', traversal);
let encrypted = false;
try { await api.inspect(asFile(zip([{name:'full-backup.json',data:'{}',flags:0x0801}]))); } catch (e) { encrypted = /flag\/encryption/.test(e.message); }
assert('P56 rejects encrypted or unsupported general-purpose flags', encrypted);
let descriptor = false;
try { await api.inspect(asFile(zip([{name:'full-backup.json',data:'{}',flags:0x0808}]))); } catch (e) { descriptor = /flag\/encryption/.test(e.message); }
assert('P56 rejects data-descriptor archives unsupported by CANVIO restore', descriptor);
let compressed = false;
try { await api.inspect(asFile(zip([{name:'full-backup.json',data:'{}',method:8}]))); } catch (e) { compressed = /ZIP store/.test(e.message); }
assert('P56 rejects unsupported DEFLATE compression before parser allocation', compressed);
let headerMismatch = false;
try { await api.inspect(asFile(zip([{name:'full-backup.json',data:'{}',localFlags:0x0800,centralFlags:0}]))); } catch (e) { headerMismatch = /không khớp/.test(e.message); }
assert('P56 rejects Local Header/Central Directory metadata mismatch', headerMismatch);
let badOffset = false;
try { await api.inspect(asFile(zip([{name:'full-backup.json',data:'{}'}], {mutate(bytes, meta) { const v=new DataView(bytes.buffer); v.setUint32(meta.endOffset+16, meta.localBytes.length+1, true); }}))); } catch (e) { badOffset = /offset\/size/.test(e.message); }
assert('P56 rejects malformed Central Directory offset', badOffset);
let missingEocd = false;
try { const bytes=good.slice(0,-22); await api.inspect(asFile(bytes)); } catch (e) { missingEocd = /End of Central Directory/.test(e.message); }
assert('P56 rejects ZIP missing terminal EOCD', missingEocd);
let overlap = false;
try { await api.inspect(asFile(zip([{name:'full-backup.json',data:'{}'},{name:'manifest.json',data:'{}'}], {mutate(bytes, meta) { const v=new DataView(bytes.buffer); const firstNameLen=v.getUint16(meta.localBytes.length+28,true); const secondEntryOffset=meta.localBytes.length+46+firstNameLen; v.setUint32(secondEntryOffset+42,0,true); }}))); } catch (e) { overlap = /không khớp|chồng lấn/.test(e.message); }
assert('P56 rejects overlapping or aliased local records', overlap);
let tooLarge = false;
try { await api.inspect({size:api.constants.maxFileBytes+1,slice(){throw new Error('should not read')}}); } catch (e) { tooLarge = /512 MiB/.test(e.message); }
assert('P56 rejects archive above 512 MiB before reading slices', tooLarge);

const summary = api.summarizePayload({
  createdAt:'2026-11-16T12:00:00.000Z',schema:2,
  localStorage:{'canvio:project':'{}','canvio:token':'hidden','other':'x'},
  indexedDB:[{name:'CANVIO_MEDIA',stores:[{name:'media',rows:[{},{}]}]},{name:'OTHER_DB',stores:[{rows:[{}]}]}],
  excludedKeys:['canvio:token'],warnings:['one']
},{status:'verified'});
assert('Restore preview counts CANVIO keys, databases, stores and records only', summary.localStorageKeys===1 && summary.indexedDBDatabases===1 && summary.indexedDBStores===1 && summary.indexedDBRecords===2);
assert('Restore preview includes checksum, schema and warning counters', summary.checksumStatus==='verified' && summary.schema===2 && summary.sourceWarnings===1 && summary.excludedSecretKeys===1);
assert('Restore preview does not expose stored values or secret names', !JSON.stringify(summary).includes('hidden') && !JSON.stringify(summary).includes('canvio:token'));
api.setPendingPreview(report);
assert('P56 preview context is one-use and cleared after consumption', api.consumePendingPreview().entryCount===3 && api.consumePendingPreview()===null);

assert('P56 is wired before legacy ZIP parser and restore confirmation', /CANVIOArchivePreflight\.inspect\(file\)[\s\S]{0,350}readStoreZip\(file\)/.test(html) && /XEM TRƯỚC KHÔI PHỤC/.test(html));
assert('P56 candidate title observer follows the new build marker', /version==='23\.3\.70-p56'\?'CANVIO 23\.3\.70-p56/.test(html));
assert('P56 is one additive inline script after P55', /<script id="canvio-p55-runtime-release-gate">[\s\S]*?<\/script>\s*<script id="canvio-p56-portable-archive-preflight">/.test(html));

console.log(`\nP56: ${passed}/${passed} assertions passed.`);
})().catch(error=>{console.error(error);process.exitCode=1});
