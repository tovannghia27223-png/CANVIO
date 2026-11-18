// Generates a UV-sphere GLB compressed with Draco and with Meshopt (free, open-source encoders).
// KTX2/Basis is NOT generated here: it needs the external `toktx` binary and remains an open gate.
import fs from 'node:fs';
import { Document, NodeIO } from '@gltf-transform/core';
import { KHRDracoMeshCompression, EXTMeshoptCompression } from '@gltf-transform/extensions';
import { draco, meshopt } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';

const out = process.argv[2] || '.';
fs.mkdirSync(out, { recursive: true });
await MeshoptEncoder.ready;
const io = new NodeIO()
  .registerExtensions([KHRDracoMeshCompression, EXTMeshoptCompression])
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

const triangles = 48 * 24 * 2;
const d1 = sphereDoc();
await d1.transform(draco({ method: 'edgebreaker' }));
fs.writeFileSync(`${out}/draco.glb`, await io.writeBinary(d1));
const d2 = sphereDoc();
await d2.transform(meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
fs.writeFileSync(`${out}/meshopt.glb`, await io.writeBinary(d2));
for (const f of ['draco', 'meshopt']) {
  const txt = fs.readFileSync(`${out}/${f}.glb`).toString('latin1');
  const ext = f === 'draco' ? 'KHR_draco_mesh_compression' : 'EXT_meshopt_compression';
  if (!txt.includes(ext)) throw new Error(`${f}.glb does not contain ${ext}`);
  console.log(f, fs.statSync(`${out}/${f}.glb`).size, 'bytes', triangles, 'triangles');
}
