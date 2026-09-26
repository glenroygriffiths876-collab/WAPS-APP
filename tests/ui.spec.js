const { test, expect } = require('@playwright/test');

function collectErrors(page){
  const errors=[];
  page.on('pageerror',e=>errors.push('page:'+e.message));
  page.on('console',m=>{ if(m.type()==='error') errors.push('console:'+m.text()) });
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

  await page.locator('.big-action[data-route="talk"]').click();
  await expect(page.locator('.talk-stage')).toBeVisible();
  await page.locator('.brand[data-route="home"]').click();
  await expect(page.locator('.waps-home')).toBeVisible();

  expect(errors).toEqual([]);
});
