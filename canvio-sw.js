/* CANVIO P115 · Same-origin app shell cache. User data, APIs and remote models are never cached. */
'use strict';
const CACHE='canvio-shell-p115-v1';
const CORE=['./','./index.html','./canvio.webmanifest','./assets/icons/canvio-icon.svg','./assets/vendor/CANVIO-VENDOR-MANIFEST.json'];
const scopeUrl=new URL(self.registration.scope);
const shellUrl=new URL('./index.html',scopeUrl).href;
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    for(const path of CORE){try{await cache.add(new Request(new URL(path,scopeUrl).href,{cache:'reload'}));}catch(_e){if(path==='./index.html')throw _e;}}
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('canvio-shell-')&&key!==CACHE)await caches.delete(key);await self.clients.claim();})());
});
self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;
  const url=new URL(req.url);if(url.origin!==scopeUrl.origin||!url.href.startsWith(scopeUrl.href))return;
  if(url.pathname.includes('/api/')||url.pathname.endsWith('/api')||url.pathname.includes('/models/'))return;
  if(req.mode==='navigate'){
    event.respondWith((async()=>{const cache=await caches.open(CACHE);try{const response=await fetch(req);if(response.ok)await cache.put(req,response.clone());return response;}catch(_e){return(await cache.match(req))||(await cache.match(shellUrl))||Response.error();}})());return;
  }
  if(!/\.(?:js|mjs|css|wasm|json|webmanifest|svg|png|webp|woff2?)$/i.test(url.pathname))return;
  event.respondWith((async()=>{const cache=await caches.open(CACHE),hit=await cache.match(req);if(hit)return hit;try{const response=await fetch(req);if(response.ok&&response.type!=='opaque')await cache.put(req,response.clone());return response;}catch(_e){return hit||Response.error();}})());
});
