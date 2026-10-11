const { test, expect } = require('@playwright/test');

const BASE='http://127.0.0.1:4173/#home';
async function openHome(browser,viewport,device={}){
 const context=await browser.newContext({viewport,...device});
 const page=await context.newPage();
 const missing=[];
 page.on('response',response=>{
   if(response.status()===404 && /(?:app\.css|app\.js|home-art\.css|home-(?:landscape|portrait))/.test(response.url()))missing.push(response.url());
 });
 await page.goto(BASE);
 await expect(page.locator('.v59-portrait-art')).toHaveAttribute('src',/^data:image\/webp;base64,/);
 await expect(page.locator('.v59-landscape-art')).toHaveAttribute('src',/^data:image\/webp;base64,/);
 return {context,page,missing};
}
async function homeMeasures(page){
 return page.evaluate(()=>{
  const rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};
  const portrait=document.querySelector('.v59-portrait-view');
  const landscape=document.querySelector('.v59-landscape-view');
  return {
   orientation:document.documentElement.dataset.wapsHomeLayout,
   viewport:{width:window.innerWidth,height:window.innerHeight},
   coarse:matchMedia('(pointer:coarse)').matches,
   portraitDisplay:getComputedStyle(portrait).display,
   landscapeDisplay:getComputedStyle(landscape).display,
   portrait:rect(portrait),
   landscape:rect(landscape),
   landscapeImage:{width:document.querySelector('.v59-landscape-art').naturalWidth,height:document.querySelector('.v59-landscape-art').naturalHeight},
   horizontalOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth
  };
 });
}

test('WAPS Home orientation — portrait tablet displays locked portrait art',async ({browser})=>{
 const {context,page,missing}=await openHome(browser,{width:800,height:1180},{isMobile:true,hasTouch:true});
 const m=await homeMeasures(page);
 expect(m.orientation).toBe('portrait');
 expect(m.portraitDisplay).toBe('block');
 expect(m.landscapeDisplay).toBe('none');
 expect(m.portrait.width).toBeGreaterThan(400);
 expect(m.portrait.right).toBeLessThanOrEqual(801);
 expect(m.horizontalOverflow).toBeLessThanOrEqual(2);
 expect(missing).toEqual([]);
 await context.close();
});

test('WAPS Home orientation — landscape tablet shows wide art without side bars',async ({browser})=>{
 const {context,page,missing}=await openHome(browser,{width:1180,height:800},{isMobile:true,hasTouch:true});
 const m=await homeMeasures(page);
 expect(m.orientation).toBe('landscape');
 expect(m.landscapeDisplay).toBe('block');
 expect(m.portraitDisplay).toBe('none');
 expect(m.landscapeImage).toEqual({width:1400,height:630});
 expect(m.landscape.width).toBeGreaterThanOrEqual(1178);
 expect(m.landscape.height).toBeGreaterThanOrEqual(798);
 expect(m.horizontalOverflow).toBeLessThanOrEqual(2);
 expect(missing).toEqual([]);
 await page.locator('.v59-l-talk').click();
 await expect(page).toHaveURL(/#talk$/);
 await context.close();
});

test('WAPS Home orientation — rotates both ways without reloading or lost hotspots',async ({browser})=>{
 const {context,page}=await openHome(browser,{width:800,height:1180},{isMobile:true,hasTouch:true});
 await page.setViewportSize({width:1180,height:800});
 await expect(page.locator('html')).toHaveAttribute('data-waps-home-layout','landscape');
 let m=await homeMeasures(page);
 expect(m.landscapeDisplay).toBe('block');
 expect(m.portraitDisplay).toBe('none');
 expect(m.landscape.width).toBeGreaterThanOrEqual(1178);
 await page.setViewportSize({width:800,height:1180});
 await expect(page.locator('html')).toHaveAttribute('data-waps-home-layout','portrait');
 m=await homeMeasures(page);
 expect(m.landscapeDisplay).toBe('none');
 expect(m.portraitDisplay).toBe('block');
 await page.locator('.v59-p-practice').click();
 await expect(page).toHaveURL(/#practice$/);
 await context.close();
});

test('WAPS Home orientation — desktop retains wide art in its original aspect ratio',async ({browser})=>{
 const {context,page,missing}=await openHome(browser,{width:1440,height:900});
 const m=await homeMeasures(page);
 expect(m.orientation).toBe('landscape');
 expect(m.landscapeDisplay).toBe('block');
 expect(m.portraitDisplay).toBe('none');
 expect(m.landscape.width).toBeGreaterThan(1200);
 expect(m.landscape.height/m.landscape.width).toBeGreaterThan(.44);
 expect(m.landscape.height/m.landscape.width).toBeLessThan(.47);
 expect(m.horizontalOverflow).toBeLessThanOrEqual(2);
 expect(m.missing).toBeUndefined();
 expect(missing).toEqual([]);
 await page.locator('.v59-l-practice').click();
 await expect(page).toHaveURL(/#practice$/);
 await context.close();
});
