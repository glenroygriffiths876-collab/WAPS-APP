const { test, expect } = require('@playwright/test');

function collectErrors(page){
  const errors=[];
  page.on('pageerror',e=>{const v='page:'+e.message;errors.push(v);console.log('WAPS_PAGE_ERROR',v)});
  page.on('console',m=>{ if(m.type()==='error'){const v='console:'+m.text();errors.push(v);console.log('WAPS_CONSOLE_ERROR',v)} });
  return errors;
}

test('WAPS core communication journey works by real clicks', async ({ page }) => {
  test.setTimeout(90000);
  const errors=collectErrors(page);
  await page.goto('http://127.0.0.1:4173/#home');
  await expect(page.locator('.waps-home')).toBeVisible();

  await page.locator('.desktopnav [data-route="talk"]').click();
  await expect(page.locator('.talk-stage')).toBeVisible();
  const allCount=await page.locator('.aac').count();
  expect(allCount).toBeGreaterThan(10);
  await page.locator('.aac').first().click();
  await expect(page.locator('.sentence-word')).toHaveCount(1);
  await page.locator('[data-action="backspace"]').click();
  await expect(page.locator('.sentence-word')).toHaveCount(0);
  await page.locator('.aac').first().click();
  await page.locator('[data-action="clearSentence"]').click();
  await expect(page.locator('.sentence-word')).toHaveCount(0);
  await page.locator('.aac-cat[data-cat="food"]').click();
  const foodCount=await page.locator('.aac').count();
  expect(foodCount).toBeGreaterThan(0);
  expect(foodCount).toBeLessThan(allCount);
  await expect(page.locator('.aac-cat[data-cat="food"]')).toHaveAttribute('aria-pressed','true');

  await page.locator('.desktopnav [data-route="practice"]').click();
  await expect(page.locator('.practice-library')).toBeVisible();
  await page.locator('[data-start]').first().click();
  await expect(page.locator('.premium-activity')).toBeVisible();
  await expect(page.locator('.choice')).toHaveCount(3);
  await page.locator('.support-choice[data-support="Gesture"]').click();
  await expect(page.locator('#promptLevel')).toHaveValue('Gesture');
  await expect(page.locator('.support-choice[data-support="Gesture"]')).toHaveClass(/active/);
  const target=await page.locator('.choice').first().getAttribute('data-target');
  await page.locator('.choice[data-choice="'+target+'"]').click();
  await expect(page.locator('#feedback .feedback')).toBeVisible();
  await page.locator('[data-action="repeatPrompt"]').first().click();
  await expect(page.locator('.premium-activity')).toBeVisible();
  await page.locator('.activity-back').click();
  await expect(page.locator('.practice-library')).toBeVisible();

  await page.locator('.desktopnav [data-route="coach"]').click();
  await expect(page.locator('.coach-home')).toBeVisible();
  await page.locator('[data-coach]').first().click();
  await expect(page.locator('.coach-card')).toBeVisible();
  const firstStep=await page.locator('.coach-card h2').textContent();
  await page.locator('[data-action="coachNext"]').click();
  await expect(page.locator('.coach-card h2')).not.toHaveText(firstStep);
  await page.locator('[data-action="coachPrev"]').click();
  await expect(page.locator('.coach-card h2')).toHaveText(firstStep);

  await page.locator('.desktopnav [data-route="progress"]').click();
  await expect(page.locator('.progress-page')).toBeVisible();
  await page.locator('.desktopnav [data-route="more"]').click();
  await expect(page.locator('.more-page')).toBeVisible();
  await page.locator('.desktopnav [data-route="home"]').click();
  await expect(page.locator('.waps-home')).toBeVisible();

  expect(errors).toEqual([]);
});

test('WAPS More toolkit launch buttons open and close correctly', async ({ page }) => {
  test.setTimeout(90000);
  const errors=collectErrors(page);
  await page.goto('http://127.0.0.1:4173/#more');
  await expect(page.locator('.more-page')).toBeVisible();

  const modalActions=['profile','goals','discovery','supports','academy','help','routines','noMaterials','handbook','professional','settings'];
  for(const action of modalActions){
    await page.locator('.more-tile[data-action="'+action+'"]').click();
    await expect(page.locator('dialog[open]')).toBeVisible();
    await page.locator('dialog[open] .dialog-close button').click();
    await expect(page.locator('dialog[open]')).toHaveCount(0);
  }

  const downloadPromise=page.waitForEvent('download');
  await page.locator('.more-tile[data-action="backup"]').click();
  const download=await downloadPromise;
  expect(await download.suggestedFilename()).toMatch(/^WAPS-backup-.*\.json$/);

  expect(errors).toEqual([]);
});

test('WAPS header and Home launch controls respond', async ({ page }) => {
  test.setTimeout(60000);
  const errors=collectErrors(page);
  await page.goto('http://127.0.0.1:4173/#home');

  await page.locator('#childSwitcher').click();
  await expect(page.locator('dialog[open]')).toBeVisible();
  await page.locator('dialog[open] .dialog-close button').click();

  await page.locator('.header-actions [data-action="settings"]').click();
  await expect(page.locator('dialog[open]')).toBeVisible();
  await page.locator('dialog[open] .dialog-close button').click();

  await page.locator('.home-action-card[data-route="talk"]').click();
  await expect(page.locator('.talk-stage')).toBeVisible();
  await page.locator('.brand[data-route="home"]').click();
  await expect(page.locator('.waps-home')).toBeVisible();

  expect(errors).toEqual([]);
});


test('WAPS current Home actions all navigate by real clicks', async ({ page }) => {
  test.setTimeout(60000);
  const errors=collectErrors(page);
  await page.goto('http://127.0.0.1:4173/#home');
  for (const route of ['practice','talk','coach']) {
    await page.locator('.home-action-card[data-route="'+route+'"]').click();
    await expect(page).toHaveURL(new RegExp('#'+route+'$'));
    await page.locator('.brand[data-route="home"]').click();
    await expect(page.locator('.waps-home')).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('WAPS visible production buttons are not inert', async ({ page }) => {
  test.setTimeout(90000);
  const errors=collectErrors(page);
  for (const route of ['home','talk','practice','coach','progress','more']) {
    await page.goto('http://127.0.0.1:4173/#'+route);
    const visible=page.locator('button:visible');
    const n=await visible.count();
    expect(n).toBeGreaterThan(0);
    for(let i=0;i<n;i++){
      const b=visible.nth(i);
      await expect(b).toBeEnabled();
    }
  }
  expect(errors).toEqual([]);
});


test('WAPS profile, goals and observation persistence flow works', async ({ page }) => {
  test.setTimeout(90000);
  const errors=collectErrors(page);
  await page.goto('http://127.0.0.1:4173/#home');

  await page.locator('#childSwitcher').click();
  await expect(page.locator('dialog[open]')).toBeVisible();
  await page.locator('#pname').fill('QA Child');
  await page.locator('#priority').fill('ask for help');
  await page.locator('input[name="mode"][value="AAC"]').check();
  await page.locator('[data-action="saveProfile"]').click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(page.locator('#childSwitcher')).toContainText('QA Child');

  await page.locator('.home-feature-card [data-action="goals"]').click();
  await expect(page.locator('dialog[open]')).toBeVisible();
  await expect(page.locator('dialog[open]')).toContainText('QA Child');
  await page.locator('[data-action="closeModal"]').click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);

  await page.locator('.home-feature-card [data-action="today"]').click();
  await expect(page.locator('dialog[open]')).toBeVisible();
  await page.locator('[data-action="observeToday"]').click();
  await expect(page.locator('dialog[open]')).toBeVisible();
  await page.locator('#obsPurpose').fill('Ask for help');
  await page.locator('#obsSupport').selectOption('Independent');
  await page.locator('#obsSpont').check();
  await page.locator('[data-action="saveObservation"]').click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);

  await page.locator('.desktopnav [data-route="progress"]').click();
  await expect(page.locator('.progress-page')).toBeVisible();
  await expect(page.locator('.progress-page')).toContainText('1');
  expect(errors).toEqual([]);
});

test('WAPS Practice support choices and activity retry remain clickable', async ({ page }) => {
  test.setTimeout(90000);
  const errors=collectErrors(page);
  await page.goto('http://127.0.0.1:4173/#practice');
  await page.locator('[data-start]').first().click();
  await expect(page.locator('.premium-activity')).toBeVisible();

  for (const support of ['Independent','Gesture','Verbal cue','Direct assistance']) {
    const btn=page.locator('.support-choice[data-support="'+support+'"]');
    await btn.click();
    await expect(btn).toHaveClass(/active/);
    await expect(page.locator('#promptLevel')).toHaveValue(support);
  }

  const target=await page.locator('.choice').first().getAttribute('data-target');
  await page.locator('.choice[data-choice="'+target+'"]').click();
  await expect(page.locator('#feedback .feedback')).toBeVisible();
  await page.locator('#feedback [data-start]').click();
  await expect(page.locator('.premium-activity')).toBeVisible();
  expect(errors).toEqual([]);
});

test('WAPS Coach can complete and record an outcome', async ({ page }) => {
  test.setTimeout(90000);
  const errors=collectErrors(page);
  await page.goto('http://127.0.0.1:4173/#coach');
  await page.locator('[data-coach]').first().click();
  await expect(page.locator('.coach-card')).toBeVisible();

  for(let i=0;i<12;i++){
    const next=page.locator('[data-action="coachNext"]');
    if(await next.count() && await next.isVisible()) {
      await next.click();
      if(await page.locator('.coach-outcome').count()) break;
    }
  }
  await expect(page.locator('.coach-outcome')).toHaveCount(4);
  await page.locator('.coach-outcome[data-result="Independent"]').click();
  await expect(page.locator('dialog[open]')).toBeVisible();
  await expect(page.locator('#obsPurpose')).toBeVisible();
  await page.locator('[data-action="closeModal"]').click();
  expect(errors).toEqual([]);
});


test('WAPS mobile and tablet layouts remain usable without horizontal overflow', async ({ page }) => {
  test.setTimeout(90000);
  for (const viewport of [{width:390,height:844},{width:820,height:1180}]) {
    await page.setViewportSize(viewport);
    for (const route of ['home','talk','practice','coach','progress','more']) {
      await page.goto('http://127.0.0.1:4173/#'+route);
      await page.waitForLoadState('domcontentloaded');
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(2);
      await expect(page.locator('#main')).toBeVisible();
    }
    await page.goto('http://127.0.0.1:4173/#practice');
    await page.locator('[data-start]').first().click();
    await expect(page.locator('.premium-activity')).toBeVisible();
    const activityOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    expect(activityOverflow).toBeLessThanOrEqual(2);
  }
});

test('WAPS installed core remains navigable offline after an online load', async ({ page, context }) => {
  test.setTimeout(90000);
  await page.goto('http://127.0.0.1:4173/#home');
  await page.waitForFunction(()=>navigator.serviceWorker?.controller || navigator.serviceWorker?.ready,{timeout:15000}).catch(()=>{});
  await page.waitForTimeout(1500);
  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.locator('.waps-home')).toBeVisible();
  await page.locator('.bottomnav [data-route="talk"]').click();
  await expect(page.locator('.talk-stage')).toBeVisible();
  await page.locator('.bottomnav [data-route="practice"]').click();
  await expect(page.locator('.practice-library')).toBeVisible();
  await context.setOffline(false);
});


test('WAPS Words & Names saves an optional personal picture and reopens it', async ({ page }) => {
  test.setTimeout(90000);
  const errors=collectErrors(page);
  await page.goto('http://127.0.0.1:4173/#practice');
  await expect(page.locator('.practice-library')).toBeVisible();

  await page.locator('[data-action="traceLaunch"]').click();
  await expect(page.locator('dialog[open]')).toBeVisible();
  await page.locator('dialog[open] [data-action="traceWordsLaunch"]').click();
  await expect(page.locator('.trace-words-config')).toBeVisible();

  await page.locator('[data-action="traceWordsAdd"]').click();
  await expect(page.locator('.trace-word-editor')).toBeVisible();
  await page.locator('#traceWordText').fill('DOG');

  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFElEQVR42mP8z8DAwMDAxMDAwMAAAAwBAQDJ/pLvAAAAAElFTkSuQmCC','base64');
  await page.locator('#traceWordFile').setInputFiles({name:'dog.png',mimeType:'image/png',buffer:png});
  await expect(page.locator('#traceWordPicturePreview img')).toBeVisible();
  await page.locator('[data-action="traceWordsSave"]').click();

  await expect(page.locator('.trace-word-card')).toContainText('DOG');
  await expect(page.locator('.trace-word-card .trace-word-thumb-img')).toBeVisible();
  await expect(page.locator('[data-action="traceWordsStart"]')).toBeEnabled();

  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('[data-action="traceLaunch"]').click();
  await page.locator('dialog[open] [data-action="traceWordsLaunch"]').click();
  await expect(page.locator('.trace-word-card')).toContainText('DOG');
  await expect(page.locator('.trace-word-card .trace-word-thumb-img')).toBeVisible();

  await page.locator('[data-action="traceWordsStart"]').click();
  await expect(page.locator('.trace-word-intro')).toBeVisible();
  await expect(page.locator('.trace-word-intro h1')).toHaveText('DOG');
  await expect(page.locator('.trace-word-intro-picture')).toBeVisible();

  await page.locator('[data-action="traceWordBegin"]').click();
  await expect(page.locator('.trace-word-child #traceSvg')).toBeVisible();
  await expect(page.locator('.trace-word-progress')).toContainText('DOG');
  await page.locator('[data-action="traceExit"]').click();
  await expect(page.locator('.practice-library')).toBeVisible();

  expect(errors).toEqual([]);
});
