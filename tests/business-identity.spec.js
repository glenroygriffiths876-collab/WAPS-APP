const {test,expect}=require('@playwright/test');
const BASE='http://127.0.0.1:4173/';
for(const viewport of [{width:390,height:844},{width:1440,height:900}]){
 test('WAPS business attribution and feedback on '+viewport.width,async({browser})=>{
  const context=await browser.newContext({viewport,permissions:['clipboard-read','clipboard-write']});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(BASE+'#more');
  const tag=page.locator('.more-page .bc-brand-tag');
  await expect(tag).toBeVisible();
  await expect(tag).toHaveAttribute('href','https://beginningconcepts.org/');
  const loaded=await tag.locator('img').evaluate(img=>img.complete&&img.naturalWidth>0);
  expect(loaded).toBe(true);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  await page.locator('.more-group-card.about').click();
  await page.locator('[data-action="about"]').click();
  await expect(page.locator('.bc-about-credit .bc-brand-tag')).toHaveAttribute('href','https://beginningconcepts.org/');
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
