import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const modules=[
 ['canvio-p74-p81-three-viewer','canvio-p74-p81-three-viewer.js'],
 ['canvio-p85-module','canvio-p85-studio.js'],
 ['canvio-p102-background-removal','canvio-p102-background-removal.js'],
 ['canvio-p105-p107-depth-parallax','canvio-p105-p107-depth-parallax.js'],
 ['canvio-p68-p70-main','canvio-p68-p70.js'],
 ['canvio-p72-glb-viewer','canvio-p72-glb-viewer.js'],
 ['canvio-p73-offline-site','canvio-p73-offline-site.js'],
 ['canvio-p82-p84-vector-pdf','canvio-p82-p84-vector-pdf.js'],
 ['canvio-p87-cv-docx','canvio-p87-cv-docx.js'],
 ['canvio-p90-p96-main','canvio-p90-p96.js'],
 ['canvio-p97-p101-main','canvio-p97-p101.js'],
 ['canvio-p104-module','canvio-p104.js'],
];
for(const [id,file] of modules){
  let match;
  if(id==='canvio-p97-p101-main'){
   const candidates=[...html.matchAll(/<script\\b([^>]*)>([\\s\\S]*?)<\\/script\\s*>/gi)]
    .filter(m=>!/\\bid\\s*=/.test(m[1])&&m[2].includes('/* CANVIO P97–P101 · Video Editor UX & local AI Director'));
   if(candidates.length!==1)throw new Error('Expected exactly one unlabelled P97–P101 module, found '+candidates.length);
   match=[null,candidates[0][2]];
  }else{
   const escaped=id.replace(/[.*+?^$\\{\\}()|[\\]\\\\]/g,'\\\\$&');
   const re=new RegExp('<script\\\\b(?=[^>]*\\\\bid=["\\\\\\']'+escaped+'["\\\\\\'])[^>]*>([\\\\s\\\\S]*?)<\\\\/script\\\\s*>','i');
   match=html.match(re);
  }
  if(!match||!match[1].trim())throw new Error('Missing/empty integrated module: '+id);
  fs.writeFileSync(path.join(root,file),match[1].trim()+'\\n');
}
console.log('Extracted '+modules.length+' integrated source modules from index.html');
