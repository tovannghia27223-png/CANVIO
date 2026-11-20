const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const window={};const document={readyState:'loading',addEventListener(){}};
vm.runInNewContext(fs.readFileSync('canvio-p127-duck.js','utf8'),{window,document,console,Math,Number,String,Array,Object,Infinity,isFinite});
const result=window.CVDuckSubP127.tests();for(const [k,v] of Object.entries(result)){if(v!==true)throw new Error('P127.7 failed: '+k);}
console.log('P127.7 PASS',Object.keys(result).length+'/'+Object.keys(result).length);
