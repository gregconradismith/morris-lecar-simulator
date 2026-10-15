'use strict';
const cacheName='morris-lecar-v3';
self.addEventListener('install',e=>e.waitUntil(caches.open(cacheName).then(c=>c.addAll(['./','./index.html','./styles.css','./model.js','./timing.js','./app.js','./icon.svg','./manifest.webmanifest'])).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('morris-lecar-')&&k!==cacheName).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method==='GET'&&e.request.url.startsWith(self.registration.scope))e.respondWith(fetch(e.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(cacheName).then(c=>c.put(e.request,copy));}return response;}).catch(()=>caches.match(e.request)));});
