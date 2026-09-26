const CACHE='waps-reference-shell-v18';
const CORE=["./","./index.html","./app.css","./app.js","./data.js","./storage.js","./manifest.webmanifest","./icon.svg","./icon-192.png","./icon-512.png","./assets/ui/waps-landscape.svg","./assets/ui/waps-sunburst.svg"];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
async function networkFirst(request,fallback){
  try{
    const response=await fetch(request,{cache:'no-store'});
    if(response&&response.ok){
      const cache=await caches.open(CACHE);
      cache.put(request,response.clone()).catch(()=>{});
    }
    return response;
  }catch(err){
    return (await caches.match(request)) || (fallback?await caches.match(fallback):undefined) || Response.error();
  }
}
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==location.origin)return;
  if(event.request.mode==='navigate'){
    event.respondWith(networkFirst(event.request,'./index.html'));
    return;
  }
  const path=url.pathname;
  const liveShell=/\/(app\.js|app\.css|data\.js|storage\.js|manifest\.webmanifest)$/.test(path);
  if(liveShell){
    event.respondWith(networkFirst(event.request));
    return;
  }
  event.respondWith(
    caches.match(event.request).then(hit=>hit||fetch(event.request).then(response=>{
      if(response&&response.ok){
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});
      }
      return response;
    }).catch(()=>hit))
  );
});