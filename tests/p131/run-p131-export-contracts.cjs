'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const print=read('canvio-p63-p67.js'),content=read('canvio-p145-core.js'),site=read('canvio-p73-offline-site.js');
const html=read('index.html'),checks={};
function check(name,fn){try{fn();checks[name]=true;console.log('PASS',name);}catch(e){checks[name]=false;console.error('FAIL',name,e.message);}}
check('P67 delegates final Print HTML fragment to shared P131 sanitizer while retaining safe CSS',()=>assert.ok(print.includes('window.CANVIOSecurity.sanitizeHtml(fragment)')&&print.includes('window.CANVIOSecurity.cleanCss')&&print.includes('sanitizePrintFragment: safePrintFragment')));
check('P145 Content Factory download boundary uses shared P131 redaction and fails closed',()=>assert.ok(content.includes('function safeExportText(value, security)')&&content.includes('new Blob([safe.text]')&&content.includes("if (!safe.available)")&&content.includes('safeExportText: safeExportText')));
check('P73 offline package redacts HTML and refuses to export without redactor',()=>assert.ok(site.includes('Bộ redaction P131 chưa sẵn sàng')&&site.includes('redactedSecretCount: securedOutput.redacted')&&site.includes('redactPackageOutput: redactPackageOutput')));
check('candidate HTML contains synchronized hardened consumers',()=>{
 for(const token of ["version: '67.0.1'","version: '73.1.0'","version: '145.1.1'","redactedSecretCount: securedOutput.redacted","sanitizePrintFragment: safePrintFragment","safeExportText: safeExportText"])assert.ok(html.includes(token),token);
});
const failed=Object.keys(checks).filter(k=>!checks[k]);console.log(JSON.stringify({suite:'P131_EXPORT_BOUNDARY_HARDENING',checks,failed},null,2));process.exit(failed.length?1:0);
