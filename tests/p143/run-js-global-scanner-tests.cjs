'use strict';
const assert=require('node:assert/strict');
const scanner=require('./js-global-scanner.cjs');
const result=scanner.runSelfTests();
for(const [name,passed] of Object.entries(result.checks))assert.equal(passed,true,'P143 lexical scanner: '+name);
console.log(JSON.stringify({suite:'P143 lexical global scanner contracts',passed:result.passed,total:result.total,failed:[]},null,2));
