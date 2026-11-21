'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','..','canvio-p133-proxy.js'),'utf8');
const sandbox={window:{addEventListener(){}},document:{readyState:'loading',addEventListener(){}},console,Promise,Math,Number,Array,Object,Map,Set,Blob,Uint8Array,setTimeout,clearTimeout};
vm.runInNewContext(source,sandbox,{filename:'canvio-p133-proxy.js'});
const api=sandbox.window.CVProxyP133;if(!api)throw new Error('P133.2 API missing');
const results=api.tests();const failed=Object.keys(results).filter(k=>results[k]!==true);
console.log(JSON.stringify({suite:'P133.2 proxy source regression',results,failed},null,2));
if(failed.length)process.exit(1);
