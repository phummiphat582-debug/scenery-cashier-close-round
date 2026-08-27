const CACHE_NAME='scenery-cashier-pwa-v6';
const APP_SHELL=[
  './',
  './index.html',
  './styles.css?v=20260812-villa-grid-3',
  './master-data.js?v=20260718-1730',
  './app.js?v=20260812-master-data-live-1',
  './invoice-source-loader.js?v=20260801-invoice-source-1',
  './supabase-config.js?v=20260801-1',
  './supabase-bridge.js?v=20260813-auth-flow-2',
  './production-cleanup.js?v=20260801-auth-session-2',
  './close-round-print-fix.js?v=20260815-table-1',
  './close-round-legacy-compat.js?v=20260816-legacy-compact-3',
  './manifest.webmanifest',
  './login-logo.png',
  './pwa-icon-192.png',
  './pwa-icon-512.png'
];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
  event.respondWith(fetch(request).then(response=>{
    if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy));}
    return response;
  }).catch(()=>caches.match(request).then(cached=>cached||caches.match('./index.html'))));
});
