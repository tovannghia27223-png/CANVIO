// Generates a UV-sphere GLB compressed with Draco and with Meshopt (free, open-source encoders).
// KTX2/Basis (UASTC) is generated with the external `toktx` binary from KTX-Software, installed by the workflow.
import fs from 'node:fs';
import { Document, NodeIO } from '@gltf-transform/core';
import { KHRDracoMeshCompression, EXTMeshoptCompression, KHRTextureBasisu } from '@gltf-transform/extensions';
import { draco, meshopt, toktx } from '@gltf-transform/functions';
import zlib from 'node:zlib';
import draco3d from 'draco3dgltf';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';

const out = process.argv[2] || '.';
fs.mkdirSync(out, { recursive: true });
await MeshoptEncoder.ready;
const io = new NodeIO()
  .registerExtensions([KHRDracoMeshCompression, EXTMeshoptCompression, KHRTextureBasisu])
  .registerDependencies({
    'draco3d.encoder': await draco3d.createEncoderModule(),
    'draco3d.decoder': await draco3d.createDecoderModule(),
    'meshopt.encoder': MeshoptEncoder,
    'meshopt.decoder': MeshoptDecoder,
  });

function sphereDoc() {
  const doc = new Document();
  const buffer = doc.createBuffer();
  const W = 48, H = 24, pos = [], nor = [], idx = [];
  for (let y = 0; y <= H; y++) for (let x = 0; x <= W; x++) {
    const u = (x / W) * Math.PI * 2, v = (y / H) * Math.PI;
    const nx = Math.cos(u) * Math.sin(v), ny = Math.cos(v), nz = Math.sin(u) * Math.sin(v);
    pos.push(nx * 0.8, ny * 0.8, nz * 0.8); nor.push(nx, ny, nz);
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const a = y * (W + 1) + x, b = a + W + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const P = doc.createAccessor().setType('VEC3').setArray(new Float32Array(pos)).setBuffer(buffer);
  const N = doc.createAccessor().setType('VEC3').setArray(new Float32Array(nor)).setBuffer(buffer);
  const I = doc.createAccessor().setType('SCALAR').setArray(new Uint16Array(idx)).setBuffer(buffer);
  const prim = doc.createPrimitive().setAttribute('POSITION', P).setAttribute('NORMAL', N).setIndices(I);
  const mesh = doc.createMesh('sphere').addPrimitive(prim);
  const node = doc.createNode('sphere').setMesh(mesh);
  doc.createScene('scene').addChild(node);
  return doc;
}

// Minimal PNG writer (RGBA gradient) so the KTX2 fixture has a real texture to encode.
function png(w, h) {
  const crcT = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
  const crc = (b) => { let c = -1; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
  const chunk = (t, d) => { const b = Buffer.alloc(12 + d.length); b.writeUInt32BE(d.length, 0); b.write(t, 4, 'latin1'); d.copy(b, 8); b.writeUInt32BE(crc(b.subarray(4, 8 + d.length)), 8 + d.length); return b; };
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; for (let x = 0; x < w; x++) { const o = y * (w * 4 + 1) + 1 + x * 4; raw[o] = x * 4; raw[o + 1] = y * 4; raw[o + 2] = 160; raw[o + 3] = 255; } }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
function texturedDoc() {
  const doc = sphereDoc();
  const buffer = doc.getRoot().listBuffers()[0];
  const prim = doc.getRoot().listMeshes()[0].listPrimitives()[0];
  const uv = [];
  for (let y = 0; y <= 24; y++) for (let x = 0; x <= 48; x++) uv.push(x / 48, y / 24);
  prim.setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(new Float32Array(uv)).setBuffer(buffer));
  const tex = doc.createTexture('grad').setImage(new Uint8Array(png(64, 64))).setMimeType('image/png');
  prim.setMaterial(doc.createMaterial('m').setBaseColorTexture(tex));
  return doc;
}

const triangles = 48 * 24 * 2;
const d1 = sphereDoc();
await d1.transform(draco({ method: 'edgebreaker' }));
fs.writeFileSync(`${out}/draco.glb`, await io.writeBinary(d1));
const d2 = sphereDoc();
await d2.transform(meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
fs.writeFileSync(`${out}/meshopt.glb`, await io.writeBinary(d2));
const d3 = texturedDoc();
await d3.transform(toktx({ mode: 'uastc', slots: /baseColor/ }));
fs.writeFileSync(`${out}/ktx2.glb`, await io.writeBinary(d3));
for (const f of ['draco', 'meshopt', 'ktx2']) {
  const txt = fs.readFileSync(`${out}/${f}.glb`).toString('latin1');
  const ext = { draco: 'KHR_draco_mesh_compression', meshopt: 'EXT_meshopt_compression', ktx2: 'KHR_texture_basisu' }[f];
  if (!txt.includes(ext)) throw new Error(`${f}.glb does not contain ${ext}`);
  console.log(f, fs.statSync(`${out}/${f}.glb`).size, 'bytes', triangles, 'triangles');
}
