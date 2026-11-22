const {test,expect}=require('@playwright/test');
const BASE='http://127.0.0.1:4173/';
for(const viewport of [{width:390,height:844},{width:1440,height:900}]){
 test('WAPS business attribution and feedback on '+viewport.width,async({browser})=>{
  const context=await browser.newContext({viewport,permissions:['clipboard-read','clipboard-write']});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(BASE+'#more');
  const tag=page.locator('.more-page .bc-more-logo-shortcut');
  await expect(tag).toBeVisible();
  await expect(tag).toHaveAttribute('href','https://beginningconcepts.org/');
  const loaded=await tag.locator('img').evaluate(img=>img.complete&&img.naturalWidth>0);
  expect(loaded).toBe(true);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  await page.locator('.more-group-card.about').click();
  await page.locator('[data-action="about"]').click();
  await expect(page.locator('.bc-about-credit .bc-brand-tag')).toHaveAttribute('href','https://beginningconcepts.org/');
 await expect(page.locator('.bc-about-credit .bc-brand-tag')).toContainText('FREE FOREVER');
  await page.locator('[data-action="closeModal"]').last().click();
  await page.locator('#feedbackFab').click();
  await expect(page.locator('.bc-feedback-recipient')).toContainText('beginningconcepts.org@gmail.com');
  await expect(page.locator('[data-action="sendPageFeedback"]')).toContainText('Email Beginning Concepts');
  await page.locator('#feedbackIssue').fill('Sample issue to test the business email composition');
  await page.locator('[data-action="copyPageFeedback"]').click();
  await expect(page.locator('#toast')).toContainText('Feedback report copied');
  expect(errors).toEqual([]);
  await context.close();
 });
}
test('Share and QR always show the Beginning Concepts WAPS address',async({page})=>{
 await page.goto(BASE+'#more');
 await page.locator('.more-group-card.settings').click();
 await page.locator('.more-group-list [data-action="shareApp"]').click();
 await expect(page.locator('.app-share-sheet .share-url-preview')).toContainText('https://waps.beginningconcepts.org/');
 await page.locator('[data-action="showAppQr"]').click();
 await expect(page.locator('.app-qr-sheet .share-url-preview')).toContainText('https://waps.beginningconcepts.org/');
 await expect(page.locator('.app-qr-sheet .qr-frame img')).toHaveAttribute('src',/waps\.beginningconcepts\.org/);
});

for(const device of [
 {name:'phone portrait',width:390,height:844,mode:'portrait'},
 {name:'phone landscape',width:844,height:390,mode:'landscape'},
 {name:'tablet portrait',width:800,height:1180,mode:'portrait'},
 {name:'tablet landscape',width:1180,height:800,mode:'landscape'},
 {name:'desktop',width:1440,height:900,mode:'landscape'}
]){
 test('Beginning Concepts logo is clearly visible and clickable on WAPS Home: '+device.name,async({browser})=>{
  const context=await browser.newContext({viewport:{width:device.width,height:device.height}});
  const page=await context.newPage();
  await page.goto(BASE+'#home');
  const logo=page.locator('.bc-home-'+device.mode+'-credit .bc-brand-tag');
  await expect(logo).toBeVisible();
  await expect(logo).toHaveAttribute('href','https://beginningconcepts.org/');
  await expect(logo).toContainText('Donated by');
  await expect(logo).toContainText('FREE FOREVER');
  await expect(logo.locator('img')).toHaveAttribute('src','./assets/brand/beginning-concepts-logo.webp');
  const geometry=await logo.evaluate(link=>{
   const r=link.getBoundingClientRect(),mx=r.x+r.width/2,my=r.y+r.height/2;
   const target=document.elementFromPoint(mx,my);
   const hotspots=[...document.querySelectorAll('.v59-hotspot')].filter(e=>getComputedStyle(e).display!=='none');
   const intersects=hotspots.filter(el=>{
    const x=el.getBoundingClientRect();
    return r.left<x.right&&r.right>x.left&&r.top<x.bottom&&r.bottom>x.top;
   }).map(e=>e.className);
   return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,
    clickable:target===link||link.contains(target),intersects,
    screenWidth:window.innerWidth,screenHeight:window.innerHeight};
  });
  expect(geometry.width).toBeGreaterThan(70);
  expect(geometry.clickable).toBe(true);
  expect(geometry.intersects).toEqual([]);
  expect(geometry.left).toBeGreaterThanOrEqual(0);
  expect(geometry.top).toBeGreaterThanOrEqual(0);
  expect(geometry.right).toBeLessThanOrEqual(geometry.screenWidth+1);
  expect(geometry.bottom).toBeLessThanOrEqual(geometry.screenHeight+1);
  await context.close();
 });
}
test('More shows Beginning Concepts logo beside heading without scrolling to footer',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto(BASE+'#more');
 const shortcut=page.locator('.more-simple-head .bc-more-logo-shortcut');
 await expect(shortcut).toBeInViewport();
 await expect(shortcut).toHaveAttribute('href','https://beginningconcepts.org/');
 await expect(shortcut.locator('img')).toBeVisible();
 const footer=page.locator('.bc-page-footer .bc-brand-tag');
 await expect(footer).toHaveAttribute('href','https://beginningconcepts.org/');
 await footer.scrollIntoViewIfNeeded();
 await footer.click({trial:true});
});
test('Nonhome top-level screens have a natural page-end credit',async({page})=>{
 for(const route of ['talk','practice','coach','progress','more']){
  await page.goto(BASE+'#'+route);
  await expect(page.locator('.bc-page-footer .bc-brand-tag')).toHaveAttribute('href','https://beginningconcepts.org/');
 }
});
