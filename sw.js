const CACHE='waps-reference-shell-v22';
const CORE=["./","./index.html","./app.css","./app.js","./data.js","./storage.js","./manifest.webmanifest","./icon.svg","./icon-192.png","./icon-512.png","./assets/ui/waps-landscape.svg","./assets/ui/waps-sunburst.svg"];
const OPTIONAL=["./again.svg","./angry.svg","./apple.svg","./assets/concepts/highres/apple.webp","./assets/concepts/highres/bag.webp","./assets/concepts/highres/ball.webp","./assets/concepts/highres/banana.webp","./assets/concepts/highres/bed.webp","./assets/concepts/highres/bike.webp","./assets/concepts/highres/bird.webp","./assets/concepts/highres/blocks.webp","./assets/concepts/highres/book.webp","./assets/concepts/highres/bread.webp","./assets/concepts/highres/breadfruit.webp","./assets/concepts/highres/car.webp","./assets/concepts/highres/cat.webp","./assets/concepts/highres/chair.webp","./assets/concepts/highres/chicken.webp","./assets/concepts/highres/comb.webp","./assets/concepts/highres/computer.webp","./assets/concepts/highres/cookie.webp","./assets/concepts/highres/crayon.webp","./assets/concepts/highres/cup.webp","./assets/concepts/highres/desk.webp","./assets/concepts/highres/dog.webp","./assets/concepts/highres/doll.webp","./assets/concepts/highres/door.webp","./assets/concepts/highres/egg.webp","./assets/concepts/highres/fish.webp","./assets/concepts/highres/flower.webp","./assets/concepts/highres/glue.webp","./assets/concepts/highres/juice.webp","./assets/concepts/highres/mango.webp","./assets/concepts/highres/milk.webp","./assets/concepts/highres/orange.webp","./assets/concepts/highres/pants.webp","./assets/concepts/highres/patty.webp","./assets/concepts/highres/pencil.webp","./assets/concepts/highres/phone.webp","./assets/concepts/highres/plantain.webp","./assets/concepts/highres/plate.webp","./assets/concepts/highres/puzzle.webp","./assets/concepts/highres/rice.webp","./assets/concepts/highres/scissors.webp","./assets/concepts/highres/shirt.webp","./assets/concepts/highres/shoe.webp","./assets/concepts/highres/soap.webp","./assets/concepts/highres/spoon.webp","./assets/concepts/highres/tablet.webp","./assets/concepts/highres/toothbrush.webp","./assets/concepts/highres/towel.webp","./assets/concepts/highres/toy.webp","./assets/concepts/highres/tree.webp","./assets/concepts/highres/tv.webp","./assets/concepts/highres/uniform.webp","./assets/concepts/highres/water.webp","./assets/concepts/highres/yam.webp","./bag.svg","./ball.svg","./banana.svg","./bathroom.svg","./beach.svg","./bed.svg","./bedroom.svg","./behind.svg","./beside.svg","./big.svg","./bird.svg","./blocks.svg","./book.svg","./breadfruit.svg","./break.svg","./brother.svg","./bus.svg","./calm.svg","./car.svg","./cat.svg","./chair.svg","./church.svg","./clinic.svg","./closed.svg","./cup.svg","./dad.svg","./doctor.svg","./dog.svg","./doll.svg","./door.svg","./drink.svg","./ear.svg","./eat.svg","./empty.svg","./excited.svg","./fast.svg","./finished.svg","./foot.svg","./friend.svg","./full.svg","./go.svg","./grandma.svg","./grandpa.svg","./hand.svg","./happy.svg","./head.svg","./help.svg","./hospital.svg","./house.svg","./hungry.svg","./hurts.svg","./inside.svg","./juice.svg","./jump.svg","./kitchen.svg","./light.svg","./mango.svg","./market.svg","./milk.svg","./more.svg","./mouth.svg","./mum.svg","./no.svg","./nurse.svg","./open.svg","./outside.svg","./pants.svg","./park.svg","./patty.svg","./pencil.svg","./plantain.svg","./plate.svg","./play.svg","./puzzle.svg","./rain.svg","./read.svg","./run.svg","./sad.svg","./scared.svg","./school.svg","./shirt.svg","./shoe.svg","./shop.svg","./sick.svg","./sister.svg","./sleep.svg","./slow.svg","./small.svg","./spoon.svg","./stop.svg","./sun.svg","./taxi.svg","./teacher.svg","./thirsty.svg","./tired.svg","./toilet.svg","./toothbrush.svg","./toy.svg","./wait.svg","./walk.svg","./wash.svg","./water.svg","./write.svg","./yam.svg","./yes.svg"];
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await cache.addAll(CORE);
    await Promise.allSettled(OPTIONAL.map(async url=>{
      try{
        const response=await fetch(url,{cache:'no-store'});
        if(response&&response.ok)await cache.put(url,response);
      }catch{}
    }));
    await self.skipWaiting();
  })());
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
  const liveShell=/\/(app\.js|app\.css|data\.js|storage\.js|manifest\.webmanifest)$/.test(path)||path.endsWith('/assets/concepts/highres/manifest.json');
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