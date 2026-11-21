'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const report=JSON.parse(fs.readFileSync('tests/p143/style-template-loader-inventory.json','utf8'));
const scripts=JSON.parse(fs.readFileSync('tests/p143/inline-source-inventory.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
assert.equal(report.format,'CANVIO_P143_STYLE_TEMPLATE_LOADER_INVENTORY');
assert.equal(report.source,'restored canonical index.html after all workflow-managed module integration steps');
assert.equal(report.htmlBytes,Buffer.byteLength(html));
assert.equal(report.styles.blockCount,(html.match(/<style\b/gi)||[]).length);
assert.equal(report.templates.count,(html.match(/<template\b/gi)||[]).length);
assert.equal(report.dynamicLoaders.count,report.dynamicLoaders.sites.length);
assert.equal(report.dependencyCandidates.confidence,'heuristic-not-semantic');
assert.ok(report.limitations.length>=5);
assert.equal(report.styles.blocks.length,report.styles.blockCount);
assert.equal(report.inlineStyleAttributes.length,report.styles.inlineStyleAttributeCount);
assert.equal(report.templates.blocks.length,report.templates.count);
assert.ok(report.dependencyCandidates.edges.every(edge=>edge.fromOrder!==edge.toOrder&&edge.confidence==='heuristic'));
assert.ok(scripts.modules.length===scripts.scriptTagCount);
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
