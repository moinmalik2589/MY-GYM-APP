const CACHE_NAME="moin-gym-firebase-auth-theme-v9-20260818";
const FILES=["./","./index.html","./css/base.css","./css/themes.css","./js/config.js","./js/auth-config.js","./js/storage.js","./js/onboarding.js","./js/streak.js","./js/progress.js","./js/food.js","./js/ui.js","./js/app.js","./manifest.json","./assets/icon-192.png","./assets/icon-512.png","./assets/apple-touch-icon.png"];

self.addEventListener("install",event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(FILES)));
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch",event=>{
  const requestUrl=new URL(event.request.url);

  // ExerciseDB / TheMealDB / GIFs remain live API data and are cached only
  // as validated exact records in localStorage, never in the service worker.
  if(requestUrl.origin!==self.location.origin){
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response=>{
        const copy=response.clone();
        caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));
        return response;
      })
      .catch(()=>caches.match(event.request))
  );
});
