'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const report=JSON.parse(fs.readFileSync('tests/p143/style-template-loader-inventory.json','utf8'));
const scripts=JSON.parse(fs.readFileSync('tests/p143/inline-source-inventory.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
assert.equal(report.format,'CANVIO_P143_STYLE_TEMPLATE_LOADER_INVENTORY');
assert.equal(report.source,'restored canonical index.html after all workflow-managed module integration steps');
assert.equal(report.htmlBytes,Buffer.byteLength(html));
assert.equal(report.styles.blockCount,(html.match(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi)||[]).length);
assert.equal(report.templates.count,(html.match(/<template\b[^>]*>[\s\S]*?<\/template\s*>/gi)||[]).length);
assert.equal(report.dynamicLoaders.count,report.dynamicLoaders.sites.length);
assert.equal(report.dependencyCandidates.confidence,'lexical-static-order-candidate-not-semantic');
assert.ok(report.limitations.length>=6);
assert.equal(report.styles.blocks.length,report.styles.blockCount);
assert.equal(report.styles.inlineAttributes.length,report.styles.inlineStyleAttributeCount);
assert.equal(report.templates.blocks.length,report.templates.count);
assert.ok(Array.isArray(scripts.modules)&&scripts.modules.length>0);
assert.ok(report.dependencyCandidates.summary.staticReadReferenceCount===report.dependencyCandidates.edges.length+report.dependencyCandidates.unresolved.length+report.dependencyCandidates.sameScriptReferences.length);
assert.ok(report.dependencyCandidates.edges.every(edge=>edge.fromOrder<edge.toOrder&&edge.executionOrder==='provider-before-consumer'&&['lexical-single-prior-provider','lexical-multiple-prior-writers-last-in-order'].includes(edge.confidence)&&edge.fromSha256&&edge.toSha256));
assert.ok(report.dependencyCandidates.unresolved.every(item=>item.reason==='no-provider-before-consumer'||item.reason==='no-static-provider-detected'));
const scanner=require('./js-global-scanner.cjs').runSelfTests();
assert.equal(scanner.passed,scanner.total,'lexical scanner fixtures must all pass');
console.log(JSON.stringify({
 suite:'P143 style/template/loader inventory validation',
 passed:12,total:12,
 styleBlocks:report.styles.blockCount,
 inlineStyleAttributes:report.styles.inlineStyleAttributeCount,
 templateBlocks:report.templates.count,
 dynamicLoaderSites:report.dynamicLoaders.count,
 dependencyCandidates:report.dependencyCandidates.count,
 limitations:report.limitations.length
},null,2));
