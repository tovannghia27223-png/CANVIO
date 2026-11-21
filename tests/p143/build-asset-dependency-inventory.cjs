'use strict';
const fs=require('node:fs');
const crypto=require('node:crypto');

function sha(value){return crypto.createHash('sha256').update(value).digest('hex');}
function parseAttrs(raw){
  const out={};let i=0;
  while(i<raw.length){
    while(i<raw.length&&/[\s/]/.test(raw[i]))i++;
    const start=i;while(i<raw.length&&!/[\s=/>]/.test(raw[i]))i++;
    if(i===start){i++;continue;}
    const key=raw.slice(start,i).toLowerCase();
    while(i<raw.length&&/\s/.test(raw[i]))i++;
    let value=true;
    if(raw[i]==='='){
      i++;while(i<raw.length&&/\s/.test(raw[i]))i++;
      const q=raw[i];
      if(q==='"'||q==="'"){i++;const v=i;while(i<raw.length&&raw[i]!==q)i++;value=raw.slice(v,i);if(raw[i]===q)i++;}
      else{const v=i;while(i<raw.length&&!/[\s>]/.test(raw[i]))i++;value=raw.slice(v,i);}
    }
    out[key]=value;
  }
  return out;
}
function readTag(html,start){
  let i=start+1,quote='';
  while(i<html.length){
    const c=html[i];
    if(quote){if(c===quote)quote='';}
    else if(c==='"'||c==="'")quote=c;
    else if(c==='>')break;
    i++;
  }
  if(i>=html.length)return null;
  const raw=html.slice(start+1,i);
  const m=raw.match(/^\s*(\/?)\s*([A-Za-z][\w:-]*)/);
  if(!m)return {end:i+1,ignore:true};
  const closing=!!m[1],name=m[2].toLowerCase();
  const attrs=parseAttrs(raw.slice(m[0].length));
  return {end:i+1,closing,name,attrs,selfClosing:/\/\s*$/.test(raw),raw};
}
function findClosing(html,name,from){
  const re=new RegExp('<\\s*\\/\\s*'+name+'\\s*>','ig');re.lastIndex=from;
  const m=re.exec(html);return m?{start:m.index,end:re.lastIndex}:null;
}
function findTemplateEnd(html,from){
  const re=/<\s*(\/?)\s*template\b[^>]*>/ig;re.lastIndex=from;let depth=1,m;
  while((m=re.exec(html))){
    if(m[1])depth--;else depth++;
    if(depth===0)return {start:m.index,end:re.lastIndex};
  }
  return null;
}
function makeLineLookup(html){const offsets=[-1];for(let i=0;i<html.length;i++)if(html.charCodeAt(i)===10)offsets.push(i);return function(index){let lo=0,hi=offsets.length-1;while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(offsets[mid]<index)lo=mid;else hi=mid-1;}return lo+1;};}
function attrRecord(tag,attrs,line,index){
  const value=String(attrs.style||'');
  return {line:line(index),tag,id:typeof attrs.id==='string'?attrs.id:null,
    className:typeof attrs.class==='string'?attrs.class.slice(0,180):null,
    bytes:Buffer.byteLength(value),sha256:sha(value),propertyCount:(value.match(/(?:^|;)\s*[-\w]+\s*:/g)||[]).length};
}
function scanHtml(html){
  const styleBlocks=[],inlineStyleAttributes=[],templateBlocks=[],htmlTemplateSignals=[],stylesheetLinks=[],dynamicLoaders=[],scriptBlocks=[],idCounts=new Map(),line=makeLineLookup(html);
  let cursor=0,ordinal=0;
  while(cursor<html.length){
    const start=html.indexOf('<',cursor);if(start<0)break;
    if(html.startsWith('<!--',start)){const close=html.indexOf('-->',start+4);cursor=close<0?html.length:close+3;continue;}
    const tag=readTag(html,start);if(!tag){cursor=start+1;continue;}if(tag.ignore){cursor=tag.end;continue;}
    cursor=tag.end;if(tag.closing)continue;
    const a=tag.attrs;
    if(typeof a.id==='string')idCounts.set(a.id,(idCounts.get(a.id)||0)+1);
    if(a.style!==undefined)inlineStyleAttributes.push(attrRecord(tag.name,a,line,start));
    if(tag.name==='link'&&typeof a.href==='string'&&String(a.rel||'').toLowerCase().split(/\s+/).includes('stylesheet')){
      stylesheetLinks.push({line:line(start),href:a.href,media:typeof a.media==='string'?a.media:null,integrity:typeof a.integrity==='string'?a.integrity:null});
    }
    if(tag.name==='template'&&!tag.selfClosing){
      const end=findTemplateEnd(html,cursor);
      if(end){
        const payload=html.slice(cursor,end.start);
        templateBlocks.push({ordinal:templateBlocks.length,line:lineAt(html,start),id:typeof a.id==='string'?a.id:null,
          name:typeof a.name==='string'?a.name:null,bytes:Buffer.byteLength(payload),sha256:sha(payload),
          elementCount:(payload.match(/<[A-Za-z][\w:-]*(?:\s|>)/g)||[]).length});
        cursor=end.end;continue;
      }
    }
    if(tag.name==='style'&&!tag.selfClosing){
      const close=findClosing(html,'style',cursor);
      if(close){const payload=html.slice(cursor,close.start);styleBlocks.push({ordinal:styleBlocks.length,line:lineAt(html,start),
        id:typeof a.id==='string'?a.id:null,media:typeof a.media==='string'?a.media:null,
        bytes:Buffer.byteLength(payload),sha256:sha(payload),ruleCount:(payload.match(/(?:^|})\s*[^@{}][^{}]*\{/g)||[]).length});
        cursor=close.end;continue;}
    }
    if(tag.name==='script'&&!tag.selfClosing){
      const close=findClosing(html,'script',cursor);
      if(close){
        const payload=html.slice(cursor,close.start);
        const record={ordinal:ordinal++,line:lineAt(html,start),id:typeof a.id==='string'?a.id:null,
          type:typeof a.type==='string'?a.type:'classic',bytes:Buffer.byteLength(payload),sha256:sha(payload)};
        scriptBlocks.push(record);
        const payloadType=String(a.type||'classic').toLowerCase();
        if(payloadType==='application/json'||payloadType==='application/ld+json'||payloadType==='application\\/ld\\+json'||payloadType==='text/template'||payloadType==='text/html'){
          templateBlocks.push({kind:'inert-script-payload',ordinal:record.ordinal,line:record.line,id:record.id,payloadType:payloadType,bytes:Buffer.byteLength(payload),sha256:sha(payload)});
        }
        const templatePatterns=[
          ['innerHTML-markup',/\.innerHTML\s*=/ig],
          ['outerHTML-markup',/\.outerHTML\s*=/ig],
          ['insertAdjacentHTML',/\.insertAdjacentHTML\s*\(/ig],
          ['template-element',/\.createElement\s*\(\s*(['"])template\1/ig]
        ];
        for(const [kind,re] of templatePatterns){re.lastIndex=0;let tm;
          while((tm=re.exec(payload))){
            const at=tm.index,from=Math.max(0,payload.lastIndexOf('\n',at-1)+1),to0=payload.indexOf('\n',at),to=to0<0?payload.length:to0;
            const snippet=payload.slice(from,to).trim().replace(/\s+/g,' ').slice(0,200);
            if(/<\/?[a-z][\w:-]*(?:\s|>)/i.test(snippet)||kind==='insertAdjacentHTML'||kind==='template-element'){
              htmlTemplateSignals.push({kind,scriptOrder:record.ordinal,scriptId:record.id,line:line(cursor+at),snippet});
            }
            if(htmlTemplateSignals.length>=500)break;
          }
          if(htmlTemplateSignals.length>=500)break;
        }
        const patterns=[
          ['script-create',/\bdocument\s*\.\s*createElement\s*\(\s*(['"])script\1/ig],
          ['dynamic-script-src',/\b(?:script|s|el|node|tag)\s*\.\s*src\s*=/ig],
          ['dynamic-import',/\bimport\s*\(/ig],
          ['worker-constructor',/\bnew\s+Worker\s*\(/ig],
          ['shared-worker-constructor',/\bnew\s+SharedWorker\s*\(/ig],
          ['worker-importScripts',/\bimportScripts\s*\(/ig],
          ['service-worker-register',/\bnavigator\s*\.\s*serviceWorker\s*\.\s*register\s*\(/ig],
          ['stylesheet-create',/\bdocument\s*\.\s*createElement\s*\(\s*(['"])link\1/ig]
        ];
        for(const [kind,re] of patterns){re.lastIndex=0;let m;
          while((m=re.exec(payload))){
            const at=m.index,from=Math.max(0,payload.lastIndexOf('\n',at-1)+1),to0=payload.indexOf('\n',at),to=to0<0?payload.length:to0;
            const snippet=payload.slice(from,to).trim().replace(/\s+/g,' ').slice(0,200);
            dynamicLoaders.push({kind,scriptOrder:record.ordinal,scriptId:record.id,line:line(cursor+at),snippet});
            if(dynamicLoaders.length>=500)break;
          }
          if(dynamicLoaders.length>=500)break;
        }
        cursor=close.end;continue;
      }
    }
  }
  const duplicateIds=[...idCounts.entries()].filter(([,n])=>n>1).map(([id,count])=>({id,count}));
  return {
    format:'CANVIO_P143_ASSET_DEPENDENCY_INVENTORY',version:1,
    purpose:'Deterministic inventory of stylesheet links, style blocks/attributes, inert template payloads and dynamic JS loader signals. Dynamic loader matches are heuristic; no semantic dependency DAG is asserted.',
    htmlBytes:Buffer.byteLength(html),scriptBlockCount:scriptBlocks.length,styleBlockCount:styleBlocks.length,
    inlineStyleAttributeCount:inlineStyleAttributes.length,templateBlockCount:templateBlocks.length,htmlTemplateElementCount:templateBlocks.filter(function(x){return x.kind!=='inert-script-payload';}).length,
    inertScriptPayloadCount:templateBlocks.filter(function(x){return x.kind==='inert-script-payload';}).length,htmlTemplateSignalCount:htmlTemplateSignals.length,
    stylesheetLinkCount:stylesheetLinks.length,dynamicLoaderSignalCount:dynamicLoaders.length,
    uniqueElementIds:idCounts.size,duplicateElementIds:duplicateIds,
    scriptBlocks,styleBlocks,inlineStyleAttributes,templateBlocks,htmlTemplateSignals,stylesheetLinks,dynamicLoaders
  };
}
if(require.main===module){
  const html=fs.readFileSync('index.html','utf8');const report=scanHtml(html);
  fs.mkdirSync('tests/p143',{recursive:true});
  fs.writeFileSync('tests/p143/asset-dependency-inventory.json',JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({suite:'P143 CSS/template/dynamic-loader inventory',
    scriptBlocks:report.scriptBlockCount,styleBlocks:report.styleBlockCount,
    inlineStyleAttributes:report.inlineStyleAttributeCount,templateBlocks:report.templateBlockCount,
    stylesheetLinks:report.stylesheetLinkCount,dynamicLoaderSignals:report.dynamicLoaderSignalCount,
    duplicateIds:report.duplicateElementIds.length,report:'tests/p143/asset-dependency-inventory.json'},null,2));
}
module.exports={scanHtml};
