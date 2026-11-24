/* P159 · Hợp nhất Bảng cảm hứng và Cảnh nhất quán với Shared Creative Core.
   Di chuyển dữ liệu cũ không phá huỷ; ảnh vào CV.assets, cards vào project documents, prompt/shot dùng P128/Video Studio. */
(function () {
'use strict';
if (window.CVSceneIntegrationP159) return;
var running = false, last = null;
function migrate() {
  if (running) return Promise.resolve(last);
  var B = window.CVBoardP153, S = window.CVScenePackP155, C = window.CVCreativeCore, CVX = window.CV;
  if (!B || !S || !C || !CVX || !CVX.assets) return Promise.resolve({ ok: false, waiting: true });
  var oldBoard = B.readLegacy ? B.readLegacy() : [], oldCards = S.readLegacyCards ? S.readLegacyCards() : [];
  if (!(C.active || oldBoard.length || oldCards.length)) return Promise.resolve({ ok: true, empty: true, migrated: 0 });
  if (!C.active && typeof C.create === 'function') C.create({ name: 'Cảnh nhất quán' });
  running = true;
  return Promise.resolve(B.migrateToAssets ? B.migrateToAssets() : { ok: false })
    .then(function (assets) {
      var cards = S.migrateToCore ? S.migrateToCore() : { ok: false };
      last = { ok: !!(assets && assets.ok && cards && cards.ok), assets: assets, cards: cards, projectId: (C.context && C.context().projectId) || null };
      try { document.dispatchEvent(new CustomEvent('canvio:p159-ready', { detail: last })); } catch (e) {}
      return last;
    }).catch(function (e) { last = { ok: false, error: String(e && e.message || e) }; return last; })
    .then(function (r) { running = false; return r; });
}
function applyInspirationColor(hex) {
  hex = String(hex || '').trim();
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return false;
  try {
    var brand = window.LS && LS.get ? LS.get('brand', {}) : {};
    brand = brand && typeof brand === 'object' ? brand : {};
    brand.primary = hex;
    if (window.LS && LS.set) LS.set('brand', brand);
    var field = document.getElementById('bPrimary');
    if (field) { field.value = hex; field.dispatchEvent(new Event('input', { bubbles: true })); }
    if (window.CV && CV.brand && CV.brand.paint) CV.brand.paint();
    if (window.CVCreativeCore && CVCreativeCore.applyBrandPalette) CVCreativeCore.applyBrandPalette();
    return true;
  } catch (e) { return false; }
}
function reconcileAssetRemoval(id) {
  var B = window.CVBoardP153, S = window.CVScenePackP155, C = window.CVCreativeCore;
  if (!B || !S) return;
  var removedRefs = [], items = B.list().filter(function (item) {
    if (String(item.assetId || '') === String(id)) { removedRefs.push(String(item.id)); return false; }
    return true;
  });
  if (removedRefs.length && B.saveList) B.saveList(items);
  var cards = S.readCards(), changed = false;
  cards.forEach(function (card) {
    if (!Array.isArray(card.refs)) return;
    var refs = card.refs.filter(function (ref) { return removedRefs.indexOf(String(ref)) < 0; });
    if (refs.length !== card.refs.length) { card.refs = refs; changed = true; }
  });
  if (changed && S.replaceCards) S.replaceCards(cards);
  try { if (C && C.unlinkAsset) C.unlinkAsset(id); } catch (e) {}
  try { if (C && C.capture) C.capture('assets'); } catch (e) {}
}
function install() {
  if (document.__cvP159Installed) return;
  document.__cvP159Installed = true;
  document.addEventListener('cv153:usecolor', function (e) { applyInspirationColor(e && e.detail && e.detail.hex); });
  var assets = window.CV && CV.assets;
  if (assets && typeof assets.remove === 'function' && !assets.remove.__cvP159) {
    var original = assets.remove;
    var wrapped = function (id) {
      var result = original.apply(this, arguments);
      Promise.resolve(result).then(function () { reconcileAssetRemoval(id); });
      return result;
    };
    wrapped.__cvP159 = true;
    assets.remove = wrapped;
  }
}
function ready() {
  install();
  var n = 0;
  (function attempt() {
    migrate().then(function (r) { if (r && r.waiting && ++n < 40) setTimeout(attempt, 250); });
  })();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true }); else ready();
window.CVSceneIntegrationP159 = { version: '159.0.0', migrate: migrate, applyInspirationColor: applyInspirationColor, reconcileAssetRemoval: reconcileAssetRemoval, status: function () { return last; } };
})();