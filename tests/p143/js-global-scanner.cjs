'use strict';
const IDENT_START=/[A-Za-z_$]/;
const IDENT_PART=/[A-Za-z0-9_$]/;
const ASSIGNMENTS=new Set(['=','+=','-=','*=','/=','%=','&&=','||=','??=','&=','|=','^=','<<=','>>=','>>>=']);
function isSpace(ch){return ch===' '||ch==='\t'||ch==='\r'||ch==='\n'||ch==='\f'||ch==='\v';}
function isIdentStart(ch){return !!ch&&IDENT_START.test(ch);}
function isIdentPart(ch){return !!ch&&IDENT_PART.test(ch);}
function canStartRegex(previous){
 if(!previous)return true;
 if(previous.type==='identifier')return ['return','throw','case','delete','void','typeof','instanceof','in','of','yield','await'].includes(previous.value);
 if(previous.type==='punct')return ['(','[','{',',',';',':','=','!','?','&&','||','??','=>','&','|','^','~'].includes(previous.value);
 return false;
}
function readRegex(source,start){
 let i=start+1,escaped=false,inClass=false,line=1;
 for(let p=0;p<start;p++)if(source[p]==='\n')line++;
 while(i<source.length){
  const ch=source[i++];
  if(ch==='\n')break;
  if(escaped){escaped=false;continue;}
  if(ch==='\\'){escaped=true;continue;}
  if(ch==='[')inClass=true;
  else if(ch===']')inClass=false;
  else if(ch==='/'&&!inClass){while(i<source.length&&/[A-Za-z]/.test(source[i]))i++;break;}
 }
 return {end:i,token:{type:'regex',value:'',line,offset:start}};
}
function tokenize(source){
 source=String(source||'');
 const tokens=[];let i=0,line=1;
 const push=(type,value,offset,tokenLine)=>tokens.push({type,value,offset,line:tokenLine});
 while(i<source.length){
  const ch=source[i];
  if(isSpace(ch)){if(ch==='\n')line++;i++;continue;}
  if(ch==='/'&&source[i+1]==='/'){i+=2;while(i<source.length&&source[i]!=='\n')i++;continue;}
  if(ch==='/'&&source[i+1]==='*'){
   i+=2;while(i<source.length&&!(source[i]==='*'&&source[i+1]==='/')){if(source[i]==='\n')line++;i++;}i=Math.min(source.length,i+2);continue;
  }
  if(ch==="'"||ch==='"'){
   const start=i,tokenLine=line;let escaped=false;i++;
   while(i<source.length){
    const next=source[i++];
    if(next==='\n')line++;
    if(escaped){escaped=false;continue;}
    if(next==='\\'){escaped=true;continue;}
    if(next===ch)break;
   }
   const raw=source.slice(start+1,Math.max(start+1,i-1));
   push('string',raw,start,tokenLine);continue;
  }
  if(ch===String.fromCharCode(96)){
   i++;let escaped=false;
   while(i<source.length){
    const next=source[i++];
    if(next==='\n')line++;
    if(escaped){escaped=false;continue;}
    if(next==='\\'){escaped=true;continue;}
    if(next===String.fromCharCode(96))break;
   }
   continue;
  }
  const previous=tokens[tokens.length-1]||null;
  if(ch==='/'&&canStartRegex(previous)){
   const r=readRegex(source,i);push(r.token.type,r.token.value,r.token.offset,r.token.line);i=r.end;continue;
  }
  if(isIdentStart(ch)){
   const start=i,tokenLine=line;i++;
   while(i<source.length&&isIdentPart(source[i]))i++;
   push('identifier',source.slice(start,i),start,tokenLine);continue;
  }
  if(/[0-9]/.test(ch)){
   const start=i,tokenLine=line;i++;
   while(i<source.length&&/[A-Za-z0-9_.]/.test(source[i]))i++;
   push('number',source.slice(start,i),start,tokenLine);continue;
  }
  const multi=['>>>=','===','!==','>>>','**=','&&=','||=','??=','<<=','>>=','?.','=>','==','!=','<=','>=','++','--','+=','-=','*=','/=','%=','&&','||','??','<<','>>','**','&=','|=','^='];
  const op=multi.find(x=>source.startsWith(x,i));
  const value=op||ch,tokenLine=line;
  push('punct',value,i,tokenLine);i+=value.length;
 }
 return tokens;
}
function isAssignment(value){return ASSIGNMENTS.has(value);}
function memberAt(tokens,i){
 const base=tokens[i];if(!base||base.type!=='identifier'||(base.value!=='window'&&base.value!=='globalThis'))return null;
 if(tokens[i+1]?.value==='.'&&tokens[i+2]?.type==='identifier')return {name:tokens[i+2].value,end:i+2,kind:base.value+'.property'};
 if(tokens[i+1]?.value==='['&&tokens[i+2]?.type==='string'&&tokens[i+3]?.value===']')return {name:tokens[i+2].value,end:i+3,kind:base.value+'[constant]'}; 
 return null;
}
function scanGlobalReferences(source,knownGlobals){
 const tokens=tokenize(source),known=new Set(knownGlobals||[]),exports=new Set(),bindings=new Set(),propertyReads=new Map(),knownReads=new Map(),writeKinds=[];
 for(let i=0;i<tokens.length;i++){
  const token=tokens[i];
  if(token.type==='identifier'&&(token.value==='window'||token.value==='globalThis')){
   const member=memberAt(tokens,i);if(!member)continue;
   const next=tokens[member.end+1]?.value;
   if(isAssignment(next)){exports.add(member.name);writeKinds.push({name:member.name,line:token.line,kind:member.kind});}
   else{
    const item=propertyReads.get(member.name)||{count:0,lines:[]};
    item.count++;if(item.lines.length<6&&!item.lines.includes(token.line))item.lines.push(token.line);propertyReads.set(member.name,item);
   }
  }
 }
 let braceDepth=0,parenDepth=0,bracketDepth=0;
 for(let i=0;i<tokens.length;i++){
  const token=tokens[i],value=token.value;
  if(braceDepth===0&&parenDepth===0&&bracketDepth===0&&token.type==='identifier'){
   if((value==='var'||value==='let'||value==='const')&&tokens[i+1]?.type==='identifier')bindings.add(tokens[i+1].value);
   if(value==='class'&&tokens[i+1]?.type==='identifier')bindings.add(tokens[i+1].value);
   if(value==='function'){
    let n=i+1;if(tokens[n]?.value==='*')n++;
    if(tokens[n]?.type==='identifier')bindings.add(tokens[n].value);
   }
  }
  if(token.type==='identifier'&&known.has(value)&&tokens[i+1]&&['.','['].includes(tokens[i+1].value)){
   if(tokens[i-1]?.value!=='.'&&tokens[i-1]?.value!=='?.'){
    const item=knownReads.get(value)||{count:0,lines:[]};
    item.count++;if(item.lines.length<6&&!item.lines.includes(token.line))item.lines.push(token.line);knownReads.set(value,item);
   }
  }
  if(value==='{')braceDepth++;
  else if(value==='}')braceDepth=Math.max(0,braceDepth-1);
  else if(value==='(')parenDepth++;
  else if(value===')')parenDepth=Math.max(0,parenDepth-1);
  else if(value==='[')bracketDepth++;
  else if(value===']')bracketDepth=Math.max(0,bracketDepth-1);
 }
 return {
  exportedGlobals:[...exports].sort(),
  globalDeclarations:[...bindings].sort(),
  globalPropertyReads:[...propertyReads.entries()].map(([name,meta])=>({name,count:meta.count,lines:meta.lines})).sort((a,b)=>a.name.localeCompare(b.name)),
  knownGlobalReads:[...knownReads.entries()].map(([name,meta])=>({name,count:meta.count,lines:meta.lines})).sort((a,b)=>a.name.localeCompare(b.name)),
  globalWrites:writeKinds.sort((a,b)=>a.line-b.line||a.name.localeCompare(b.name)),
  limitations:['Template literal bodies and interpolation expressions are skipped as one lexical region.','Destructured globals, alias flow, computed property names, eval and dynamically assembled identifiers are not resolved.','Top-level bindings are detected only for simple var/let/const/function/class declarations.','This scanner is lexical evidence, not a JavaScript AST or proof of runtime data flow.']
 };
}
function runSelfTests(){
 const bt=String.fromCharCode(96);
 const fixture=[
  '// window.CommentApi = 1',
  '/* globalThis.BlockCommentApi = 1; */',
  'const text = "window.StringApi = 1";',
  "const single = 'window.SingleStringApi = 1';",
  'const template = '+bt+'window.TemplateApi = 1'+bt+';',
  'const regex = /window.RegexApi\\\\.run/;',
  'window.ProviderApi = { run(){} };',
  "window['BracketApi'] = {};",
  'globalThis.GlobalApi = {};',
  'const RootOwner = {};',
  'function PublicOwner() {}',
  'for (const LoopLocal of items) { consume(LoopLocal); }',
  'const result = window.ProviderApi.run();',
  'const result2 = ProviderApi.run();',
  'if (CVNativeEngines.pixel) {}',
  'window.WriteOnlyApi = 1;'
 ].join('\n');
 const result=scanGlobalReferences(fixture,['CVNativeEngines','ProviderApi','StringApi','CommentApi','BlockCommentApi','RegexApi']);
 const checks={
  detectsWindowExport:result.exportedGlobals.includes('ProviderApi'),
  detectsBracketExport:result.exportedGlobals.includes('BracketApi'),
  detectsGlobalThisExport:result.exportedGlobals.includes('GlobalApi'),
  detectsTopLevelLexicalBinding:result.globalDeclarations.includes('RootOwner'),
  detectsTopLevelFunctionBinding:result.globalDeclarations.includes('PublicOwner'),
  ignoresForLoopBinding:!result.globalDeclarations.includes('LoopLocal'),
  detectsWindowPropertyRead:result.globalPropertyReads.some(x=>x.name==='ProviderApi'),
  detectsKnownBareRead:result.knownGlobalReads.some(x=>x.name==='CVNativeEngines'),
  ignoresCommentText:!result.exportedGlobals.includes('CommentApi')&&!result.exportedGlobals.includes('BlockCommentApi'),
  ignoresStringText:!result.exportedGlobals.includes('StringApi'),
  ignoresRegexText:!result.exportedGlobals.includes('RegexApi'),
  ignoresTemplateBody:!result.exportedGlobals.includes('TemplateApi'),
  recordsWriteSite:result.globalWrites.some(x=>x.name==='WriteOnlyApi')
 };
 return {checks,passed:Object.values(checks).filter(Boolean).length,total:Object.keys(checks).length};
}
module.exports={tokenize,scanGlobalReferences,runSelfTests};
