'use strict';
const fs = require('node:fs');

const htmlPath = 'index.html';
const modulePath = 'canvio-p102-background-removal.js';
const html = fs.readFileSync(htmlPath, 'utf8');
const source = fs.readFileSync(modulePath, 'utf8').trim();
const tag = /(<script\\b(?=[^>]*\\bid=["']canvio-p102-background-removal["'])[^>]*>)([\\s\\S]*?)(<\\/script\\s*>)/gi;
const matches = [...html.matchAll(tag)];

if (matches.length !== 1) {
  throw new Error('Expected exactly one canonical P102 inline script; found ' + matches.length);
}

const match = matches[0];
const inline = (match[2] || '').trim();
if (inline === source) {
  console.log('P102 standalone and canonical inline sources already match.');
  process.exit(0);
}

const leading = (match[2].match(/^\\r?\\n/) || ['\\n'])[0];
const trailing = (match[2].match(/\\r?\\n$/) || ['\\n'])[0];
const replacement = match[1] + leading + source + trailing + match[3];
const updated = html.slice(0, match.index) + replacement + html.slice(match.index + match[0].length);
fs.writeFileSync(htmlPath, updated, 'utf8');

const verify = [...updated.matchAll(tag)];
if (verify.length !== 1 || verify[0][2].trim() !== source) {
  throw new Error('P102 canonical inline parity failed after synchronization.');
}
console.log('Synchronized P102 standalone module into canonical index.html.');
