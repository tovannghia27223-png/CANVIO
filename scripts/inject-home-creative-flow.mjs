import fs from 'node:fs';
const htmlPath='index.html',sourcePath='canvio-home-creative-flow.js',id='canvio-lot146';
let html=fs.readFileSync(htmlPath,'utf8');
const source=fs.readFileSync(sourcePath,'utf8').trim();
if(!source)throw new Error('P146 standalone source is empty');
const re=new RegExp('<script\\b(?=[^>]*\\bid=["\\\']'+id+'["\\\'])[^>]*>([\\s\\S]*?)<\\/script\\s*>','gi');
const matches=[...html.matchAll(re)];
if(matches.length>1)throw new Error('P146 duplicate inline owner found: '+matches.length);
if(matches.length===1){
 if(matches[0][1].trim()!==source)throw new Error('P146 standalone/inline source drift; refusing silent overwrite');
 console.log('P146 canonical inline lot already matches standalone source.');
}else{
 const at=html.lastIndexOf('</body>');
 if(at<0)throw new Error('Could not find final </body> in index.html');
 html=html.slice(0,at)+'<script id="'+id+'">\n'+source+'\n</script>\n'+html.slice(at);
 fs.writeFileSync(htmlPath,html,'utf8');
 console.log('Injected P146 guided workflow into canonical Home page.');
}
