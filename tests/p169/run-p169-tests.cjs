const fs=require('fs'),vm=require('vm'),assert=require('assert');
const w={};w.window=w;w.document={readyState:'complete',getElementById:()=>null,addEventListener(){}};vm.createContext(w);vm.runInContext(fs.readFileSync('canvio-p169-character-studio.js','utf8'),w);
const P=w.CVCharacterStudioP169,t=P.tests();assert.equal(t.bounded,true);assert.equal(t.svg,true);assert.equal(t.featureRoundTrip,true);assert.equal(t.fieldCount,8);
const v=P.normalize({face:'x',hair:'long',mark:'scar-right',outfitColor:'red'});assert.equal(v.face,'oval');assert.equal(v.hair,'long');assert.match(P.renderSVG(v),/<svg/);console.log('P169 Node tests passed: 5');
