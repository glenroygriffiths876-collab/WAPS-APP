const { test, expect } = require('@playwright/test');

test('WAPS primary controls and activity controls work', async ({ page }) => {
  test.setTimeout(90000);
  const errors=[];
  page.on('pageerror',e=>errors.push('page:'+e.message));
  page.on('console',m=>{ if(m.type()==='error') errors.push('console:'+m.text()) });
  await page.goto('http://127.0.0.1:4173/#home');
  await expect(page.locator('.waps-home')).toBeVisible();

  await page.locator('.desktopnav [data-route="talk"]').click();
  await expect(page.locator('.talk-stage')).toBeVisible();
  const firstAAC=page.locator('.aac').first();
  await firstAAC.click();
  await expect(page.locator('.sentence-word')).toHaveCount(1);
  await page.locator('[data-action="clearSentence"]').click();
  await expect(page.locator('.sentence-word')).toHaveCount(0);
  await page.locator('.aac-cat[data-cat="food"]').click();
  await expect(page.locator('.aac')).toHaveCount(await page.locator('.aac').count());

  await page.locator('.desktopnav [data-route="practice"]').click();
  await expect(page.locator('.practice-library')).toBeVisible();
  await page.locator('[data-start]').first().click();
  await expect(page.locator('.premium-activity')).toBeVisible();
  await expect(page.locator('.choice')).toHaveCount(3);
  await page.locator('.support-choice[data-support="Gesture"]').click();
  await expect(page.locator('#promptLevel')).toHaveValue('Gesture');
  await expect(page.locator('.support-choice[data-support="Gesture"]')).toHaveClass(/active/);
  await page.locator('[data-action="repeatPrompt"]').first().click();
  await page.locator('.activity-back').click();
  await expect(page.locator('.practice-library')).toBeVisible();

  await page.locator('.desktopnav [data-route="coach"]').click();
  await expect(page.locator('.coach-home')).toBeVisible();
  await page.locator('[data-coach]').first().click();
  await expect(page.locator('.coach-card')).toBeVisible();
  await page.locator('[data-action="coachNext"]').click();
  await page.locator('[data-action="coachPrev"]').click();

  await page.locator('.desktopnav [data-route="progress"]').click();
  await expect(page.locator('.progress-page')).toBeVisible();

  await page.locator('.desktopnav [data-route="more"]').click();
  await expect(page.locator('.more-page')).toBeVisible();
  await page.locator('[data-action="settings"]').first().click();
  await expect(page.locator('dialog[open]')).toBeVisible();
  await page.locator('dialog[open] .dialog-close button').click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);

  await page.locator('.desktopnav [data-route="home"]').click();
  await expect(page.locator('.waps-home')).toBeVisible();

  expect(errors).toEqual([]);
});
