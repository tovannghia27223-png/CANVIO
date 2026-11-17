'use strict';
const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const overrides = [
  { source: '.canvio/p70/overrides/p57-native-persistence.js', target: 'tests/p57/p57-native-persistence.js', id: 'canvio-p57-native-persistence-audit' },
  { source: '.canvio/p70/overrides/p57-run-tests.cjs', target: 'tests/p57/run-p57-tests.cjs' },
  { source: '.canvio/p70/overrides/p60-accessibility-audit.js', target: 'tests/p60/p60-accessibility-audit.js', id: 'canvio-p60-accessibility-screening' },
  { source: '.canvio/p70/overrides/p68-p70-tests.cjs', target: 'tests/p68-p70/run-p68-p70-tests.cjs' },
  { source: '.canvio/p70/overrides/canvio-p68-p70.js', target: 'canvio-p68-p70.js', id: 'canvio-p68-p70-main' }
];

function full(relative) {
  const value = path.resolve(root, relative);
  if (!value.startsWith(root + path.sep)) throw new Error('Unsafe override path: ' + relative);
  return value;
}
let html = fs.readFileSync(full('index.html'), 'utf8');
for (const item of overrides) {
  const sourcePath = full(item.source);
  const targetPath = full(item.target);
  const source = fs.readFileSync(sourcePath, 'utf8').trim();
  if (!source) throw new Error('Empty reviewed override: ' + item.source);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, source + '\n', 'utf8');
  if (!item.id) continue;
  const opening = '<script id="' + item.id + '">';
  const tagStart = html.indexOf(opening);
  if (tagStart < 0) throw new Error('Missing inline script marker: ' + item.id);
  const bodyStart = tagStart + opening.length;
  const bodyEnd = html.indexOf('</script>', bodyStart);
  if (bodyEnd < 0) throw new Error('Unterminated inline script: ' + item.id);
  html = html.slice(0, bodyStart) + '\n' + source + '\n' + html.slice(bodyEnd);
}
fs.writeFileSync(full('index.html'), html, 'utf8');

for (const item of overrides.filter(x => x.id)) {
  const source = fs.readFileSync(full(item.target), 'utf8').trim();
  const opening = '<script id="' + item.id + '">';
  const start = html.indexOf(opening);
  const bodyStart = start + opening.length;
  const bodyEnd = html.indexOf('</script>', bodyStart);
  if (start < 0 || bodyEnd < 0 || html.slice(bodyStart, bodyEnd).trim() !== source) {
    throw new Error('Inline/standalone source mismatch: ' + item.target);
  }
}
console.log('PASS: applied ' + overrides.length + ' reviewed P70 override inputs; P57/P60/P68 inline sources are synchronized.');
