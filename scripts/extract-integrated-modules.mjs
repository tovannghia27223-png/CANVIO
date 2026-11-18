import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
// OpenCV.js 5.0 does not export goodFeaturesToTrack in its generated JS API.
// Keep the native API when present; otherwise compute Shi–Tomasi corners with
// cornerMinEigenVal and feed CV_32FC2 points to the real Lucas–Kanade solver.
const p85FeatureFallback = String.raw`  function detectGoodFeatures(cv, gray, maxCorners, qualityLevel, minDistance) {
    var points = new cv.Mat();
    if (typeof cv.goodFeaturesToTrack === 'function') {
      cv.goodFeaturesToTrack(gray, points, maxCorners, qualityLevel, minDistance);
      return points;
    }
    if (typeof cv.cornerMinEigenVal !== 'function') {
      points.delete();
      throw new Error('OpenCV.js runtime thiếu cornerMinEigenVal; không thể khởi tạo điểm theo dõi Shi–Tomasi.');
    }
    var response = new cv.Mat();
    try {
      cv.cornerMinEigenVal(gray, response, 3, 3);
      var values = response.data32F;
      var rows = gray.rows, cols = gray.cols, length = rows * cols, maximum = 0;
      for (var i = 0; i < length; i++) {
        var score = values[i];
        if (Number.isFinite(score) && score > maximum) maximum = score;
      }
      if (!(maximum > 0)) return points;
      var cutoff = maximum * Math.max(0, Math.min(1, Number(qualityLevel) || 0.01));
      var candidates = [];
      for (var y = 3; y < rows - 3; y += 2) {
        for (var x = 3; x < cols - 3; x += 2) {
          var index = y * cols + x, value = values[index];
          if (!Number.isFinite(value) || value < cutoff) continue;
          var peak = true;
          for (var dy = -1; dy <= 1 && peak; dy++) {
            for (var dx = -1; dx <= 1; dx++) {
              if (!dx && !dy) continue;
              var other = values[(y + dy) * cols + x + dx];
              if (other > value || (other === value && (dy < 0 || (dy === 0 && dx < 0)))) { peak = false; break; }
            }
          }
          if (peak) candidates.push({ x: x, y: y, score: value });
        }
      }
      candidates.sort(function (a, b) { return b.score - a.score; });
      var chosen = [], flat = [], minDistance2 = Math.max(1, Number(minDistance) || 7) ** 2;
      for (var c = 0; c < candidates.length && chosen.length < maxCorners; c++) {
        var candidate = candidates[c], separated = true;
        for (var j = 0; j < chosen.length; j++) {
          var dx2 = candidate.x - chosen[j].x, dy2 = candidate.y - chosen[j].y;
          if (dx2 * dx2 + dy2 * dy2 < minDistance2) { separated = false; break; }
        }
        if (separated) { chosen.push(candidate); flat.push(candidate.x, candidate.y); }
      }
      if (!flat.length) return points;
      points.delete();
      points = new cv.Mat(chosen.length, 1, cv.CV_32FC2);
      points.data32F.set(flat);
      return points;
    } catch (error) {
      points.delete();
      throw error;
    } finally {
      response.delete();
    }
  }
`;
const p85Anchor = '  async function startOpticalFlow() {';
if (!html.includes(p85Anchor)) throw new Error('P85 tracking function not found; refusing unverified feature patch');
if (html.includes('function detectGoodFeatures(cv, gray, maxCorners')) throw new Error('P85 feature fallback already exists; refusing duplicate insertion');
html = html.replace(p85Anchor, p85FeatureFallback + '\n' + p85Anchor);
const p85Replacements = [
  ['cv.goodFeaturesToTrack(t.prevGray, t.prevPts, 160, 0.01, 7);', 't.prevPts = detectGoodFeatures(cv, t.prevGray, 160, 0.01, 7);'],
  ['cv.goodFeaturesToTrack(t.prevGray, t.prevPts = new cv.Mat(), 160, 0.01, 7);', 'if (t.prevPts) t.prevPts.delete(); t.prevPts = detectGoodFeatures(cv, t.prevGray, 160, 0.01, 7);'],
  ['cv.goodFeaturesToTrack(gray, t.prevPts, 160, 0.01, 7);', 't.prevPts = detectGoodFeatures(cv, t.prevGray, 160, 0.01, 7);']
];
for (const [before, after] of p85Replacements) {
  const count = html.split(before).length - 1;
  if (count !== 1) throw new Error('Expected one P85 API call to replace, found ' + count + ': ' + before);
  html = html.replace(before, after);
}
if ((html.match(/cv\.goodFeaturesToTrack\(/g) || []).length !== 1) throw new Error('Unexpected goodFeaturesToTrack invocation remains outside the guarded compatibility path');
fs.writeFileSync(path.join(root,'index.html'),html,'utf8');

const modules=[
 ['canvio-p57-native-persistence-audit','tests/p57/p57-native-persistence.js'],
 ['canvio-p58-media-export-acceptance','tests/p58/p58-media-export-acceptance.js'],
 ['canvio-p59-whisper-runtime-acceptance','tests/p59/p59-whisper-runtime-acceptance.js'],
 ['canvio-p60-accessibility-screening','tests/p60/p60-accessibility-audit.js'],
 ['canvio-p61-hosting-security-audit','tests/p61/p61-hosting-security-audit.js'],
 ['canvio-p62-phase1-release-gate','tests/p62/p62-release-candidate-gate.js'],
 ['canvio-p74-p81-three-viewer','canvio-p74-p81-three-viewer.js'],
 ['canvio-p85-module','canvio-p85-studio.js'],
 ['canvio-p102-background-removal','canvio-p102-background-removal.js'],
 ['canvio-p105-p107-depth-parallax','canvio-p105-p107-depth-parallax.js'],
 ['canvio-p68-p70-main','canvio-p68-p70.js'],
 ['canvio-p72-glb-viewer','canvio-p72-glb-viewer.js'],
 ['canvio-p73-offline-site','canvio-p73-offline-site.js'],
 ['canvio-p82-p84-vector-pdf','canvio-p82-p84-vector-pdf.js'],
 ['canvio-p87-cv-docx','canvio-p87-cv-docx.js'],
 ['canvio-p90-p96-main','canvio-p90-p96.js'],
 ['canvio-p97-p101-main','canvio-p97-p101.js'],
 ['canvio-p104-module','canvio-p104.js'],
];
for(const [id,file] of modules){
  let match;
  if(id==='canvio-p97-p101-main'){
   const candidates=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)]
    .filter(m=>!/\bid\s*=/.test(m[1])&&m[2].includes('/* CANVIO P97–P101 · Video Editor UX & local AI Director'));
   if(candidates.length!==1)throw new Error('Expected exactly one unlabelled P97–P101 module, found '+candidates.length);
   match=[null,candidates[0][2]];
  }else{
   const escaped=id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
   const re=new RegExp('<script\\b(?=[^>]*\\bid=["\\\']'+escaped+'["\\\'])[^>]*>([\\s\\S]*?)<\\/script\\s*>','i');
   match=html.match(re);
  }
  if(!match||!match[1].trim())throw new Error('Missing/empty integrated module: '+id);
  fs.writeFileSync(path.join(root,file),match[1].trim()+'\n');
}
console.log('Extracted '+modules.length+' integrated source modules from index.html');
