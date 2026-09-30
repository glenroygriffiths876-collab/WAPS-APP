const { test, expect } = require('@playwright/test');

function collectErrors(page){
  const errors=[];
  page.on('pageerror',e=>errors.push('page:'+e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push('console:'+m.text())});
  return errors;
}

test('Home makes Practice Together primary and caregiver shortcuts work', async ({page})=>{
  const errors=collectErrors(page);
  await page.goto('http://127.0.0.1:4173/#home');
  await expect(page.locator('.home-practice-primary')).toBeVisible();
  await expect(page.locator('.home-practice-primary')).toContainText('Practice Together');
  await page.locator('.home-practice-primary').click();
  await expect(page).toHaveURL(/#practice$/);
  await expect(page.locator('.practice-main-focus')).toBeVisible();
  await page.locator('.brand[data-route="home"]').click();
  await page.locator('.home-quick-card[data-route="talk"]').click();
  await expect(page.locator('.talk-stage')).toBeVisible();
  expect(errors).toEqual([]);
});

test('Practice Together is compact and support choices appear after an answer', async ({page})=>{
  const errors=collectErrors(page);
  await page.goto('http://127.0.0.1:4173/#practice');
  await expect(page.locator('.practice-simple-head')).toContainText('Practice Together');
  await page.locator('[data-action="startUnifiedPractice"]').click();
  await expect(page.locator('.premium-activity')).toBeVisible();
  await expect(page.locator('#supportFab')).toBeHidden();
  await expect(page.locator('.support-question')).toBeHidden();
  const target=await page.locator('.choice').first().getAttribute('data-target');
  await page.locator('.choice[data-choice="'+target+'"]').click();
  await expect(page.locator('.support-question')).toBeVisible();
  await expect(page.locator('.support-question')).toContainText('By themselves');
  await page.locator('.support-choice[data-support="Independent"]').click();
  await expect(page.locator('#promptLevel')).toHaveValue('Independent');
  expect(errors).toEqual([]);
});

test('More is six simple groups and opens the old tools through groups', async ({page})=>{
  const errors=collectErrors(page);
  await page.goto('http://127.0.0.1:4173/#more');
  await expect(page.locator('.more-group-card')).toHaveCount(6);
  await page.locator('[data-more-group="child"]').click();
  await expect(page.locator('dialog[open] .more-group-sheet')).toBeVisible();
  await expect(page.locator('dialog[open] [data-action="profile"]')).toBeVisible();
  await expect(page.locator('dialog[open] [data-action="progressOpen"]')).toBeVisible();
  await page.locator('dialog[open] [data-action="closeModal"]').first().click();
  await page.locator('[data-more-group="learn"]').click();
  await expect(page.locator('dialog[open] [data-action="academy"]')).toBeVisible();
  await expect(page.locator('dialog[open] [data-action="printCentre"]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('WhatsApp Support uses the approved group link and hides in child work', async ({page})=>{
  const errors=collectErrors(page);
  await page.goto('http://127.0.0.1:4173/#home');
  await expect(page.locator('#supportFab')).toBeVisible();
  await page.locator('#supportFab').click();
  const join=page.locator('dialog[open] a.whatsapp-join-btn');
  await expect(join).toHaveAttribute('href','https://chat.whatsapp.com/DvI8bqupHVQD2lLQUgAKYK');
  await expect(join).toHaveAttribute('target','_blank');
  await expect(page.locator('dialog[open]')).toContainText('New members need approval from a group admin.');
  await page.locator('dialog[open] [data-action="closeModal"]').click();
  await page.goto('http://127.0.0.1:4173/#talk');
  await expect(page.locator('#supportFab')).toBeHidden();
  await page.goto('http://127.0.0.1:4173/#practice');
  await page.locator('[data-action="traceLaunch"]').click();
  await page.locator('dialog[open] [data-trace-type="letters"]').click();
  await page.locator('dialog[open] [data-action="traceStart"]').click();
  await expect(page.locator('#supportFab')).toBeHidden();
  expect(errors).toEqual([]);
});

test('Words & Names keeps optional personal picture flow working', async ({page})=>{
  const errors=collectErrors(page);
  await page.goto('http://127.0.0.1:4173/#practice');
  await page.locator('[data-action="traceLaunch"]').click();
  await page.locator('dialog[open] [data-action="traceWordsLaunch"]').click();
  await page.locator('[data-action="traceWordsAdd"]').click();
  await page.locator('#traceWordText').fill('DOG');
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFElEQVR42mP8z8DAwMDAxMDAwMAAAAwBAQDJ/pLvAAAAAElFTkSuQmCC','base64');
  await page.locator('#traceWordFile').setInputFiles({name:'dog.png',mimeType:'image/png',buffer:png});
  await expect(page.locator('#traceWordPicturePreview img')).toBeVisible();
  await page.locator('[data-action="traceWordsSave"]').click();
  await expect(page.locator('.trace-word-card')).toContainText('DOG');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('[data-action="traceLaunch"]').click();
  await page.locator('dialog[open] [data-action="traceWordsLaunch"]').click();
  await expect(page.locator('.trace-word-card .trace-word-thumb-img')).toBeVisible();
  await page.locator('[data-action="traceWordsStart"]').click();
  await expect(page.locator('.trace-word-intro h1')).toHaveText('DOG');
  expect(errors).toEqual([]);
});

test('Colours and Shapes setup is simple and still starts', async ({page})=>{
  const errors=collectErrors(page);
  await page.goto('http://127.0.0.1:4173/#practice');
  await page.locator('[data-action="csLaunch"]').click();
  await expect(page.locator('.simple-cs-launch')).toBeVisible();
  await page.locator('[data-cs-type="colours"]').click();
  await expect(page.locator('.cs-config')).toBeVisible();
  await page.locator('[data-action="csStart"]').click();
  await expect(page.locator('.cs-child-screen')).toBeVisible();
  await expect(page.locator('#supportFab')).toBeHidden();
  expect(errors).toEqual([]);
});

test('Mobile core screens have no horizontal overflow', async ({page})=>{
  for(const viewport of [{width:360,height:800},{width:390,height:844},{width:430,height:932},{width:820,height:1180}]){
    await page.setViewportSize(viewport);
    for(const route of ['home','talk','practice','coach','progress','more']){
      await page.goto('http://127.0.0.1:4173/#'+route);
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(2);
    }
  }
});

test('Practice Together fits phone view without page scrolling', async ({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:4173/#practice');
  await page.locator('[data-action="startUnifiedPractice"]').click();
  await expect(page.locator('.premium-activity')).toBeVisible();
  const dims=await page.evaluate(()=>({
    docH:document.documentElement.scrollHeight,
    viewH:window.innerHeight,
    mainH:document.querySelector('main').getBoundingClientRect().height,
    choiceCount:document.querySelectorAll('.choice').length
  }));
  expect(dims.docH).toBeLessThanOrEqual(dims.viewH+2);
  expect(dims.mainH).toBeLessThanOrEqual(dims.viewH+2);
  expect(dims.choiceCount).toBeGreaterThanOrEqual(2);
});

test('Core app remains available offline after first load', async ({page,context})=>{
  await page.goto('http://127.0.0.1:4173/#home');
  await page.waitForFunction(()=>navigator.serviceWorker?.controller || navigator.serviceWorker?.ready,{timeout:15000}).catch(()=>{});
  await page.waitForTimeout(1200);
  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.locator('.simple-home')).toBeVisible();
  await page.locator('.bottomnav [data-route="practice"]').click();
  await expect(page.locator('.practice-library')).toBeVisible();
  await context.setOffline(false);
});
