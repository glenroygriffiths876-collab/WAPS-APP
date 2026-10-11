const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

const base='http://127.0.0.1:4173/';
const cases=[
  {label:'phone portrait',viewport:{width:390,height:844},device:{hasTouch:true,isMobile:true},layout:'portrait',home:'.v59-p-talk'},
  {label:'phone landscape',viewport:{width:844,height:390},device:{hasTouch:true,isMobile:true},layout:'landscape',home:'.v59-l-talk'},
  {label:'tablet portrait',viewport:{width:800,height:1180},device:{hasTouch:true,isMobile:true},layout:'portrait',home:'.v59-p-talk'},
  {label:'tablet landscape',viewport:{width:1180,height:800},device:{hasTouch:true,isMobile:true},layout:'landscape',home:'.v59-l-talk'},
  {label:'desktop',viewport:{width:1440,height:900},device:{},layout:'landscape',home:'.v59-l-talk'}
];

for(const device of cases){
  test('Approved Home and Talk remain functional on '+device.label,async ({browser})=>{
    const context=await browser.newContext({viewport:device.viewport,...device.device});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{
      if(r.status()===404&&/(?:app\.js|app\.css|home-landscape|home-portrait)/.test(r.url()))errors.push('Missing app asset '+r.url());
    });
    await page.goto(base+'#home');
    await expect(page.locator('html')).toHaveAttribute('data-waps-home-layout',device.layout);
    await expect(page.locator('.v59-'+device.layout+'-art')).toHaveAttribute('src',/^data:image\/webp;base64,/);
    await expect(page.locator(device.home)).toBeVisible();
    fs.mkdirSync('test-results/approved-screens',{recursive:true});
    await page.screenshot({path:'test-results/approved-screens/home-'+device.label.replaceAll(' ','-')+'.png'});
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    expect(overflow,device.label+' horizontal overflow').toBeLessThanOrEqual(2);
    await page.locator(device.home).click();
    await expect(page).toHaveURL(/#talk$/);
    await expect(page.locator('.talk-stage')).toBeVisible();
    await page.screenshot({path:'test-results/approved-screens/talk-'+device.label.replaceAll(' ','-')+'.png'});
    await expect(page.locator('#aacGrid button.aac').first()).toBeVisible();
    expect(await page.locator('#aacGrid button.aac').count()).toBeGreaterThan(30);
    expect(errors).toEqual([]);
    await context.close();
  });
}

test('AAC message building and Practice library survive route changes',async ({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto(base+'#talk');
  await page.locator('#aacGrid button.aac').first().click();
  await expect(page.locator('#sentence .sentence-word').first()).toBeVisible();
  await page.goto(base+'#practice');
  for(const action of ['startUnifiedPractice','traceLaunch','traceWordsLaunch','csLaunch','mathLaunch','muLaunch']){
    await expect(page.locator('[data-action="'+action+'"]')).toBeVisible();
  }
});

test('Practice records first answer without forced retry or covering choices',async ({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto(base+'#practice');
  await page.locator('[data-action="startUnifiedPractice"]').click();
  const choices=page.locator('.premium-activity .choice');
  const target=await choices.first().getAttribute('data-target');
  const wrongIndex=await choices.evaluateAll((nodes,t)=>nodes.findIndex(n=>n.dataset.choice!==t),target);
  expect(wrongIndex).toBeGreaterThanOrEqual(0);
  await choices.nth(wrongIndex).click();
  await expect(page.locator('.premium-activity .choice.answer-key')).toHaveCount(0);
  await expect(page.locator('#feedback')).toContainText('Let’s learn together');
  await expect(page.locator('.support-question')).toBeVisible();
  const layout=await page.evaluate(()=>{
    const choices=[...document.querySelectorAll('.premium-activity .choice')].map(n=>n.getBoundingClientRect());
    const panel=document.querySelector('.premium-activity .practice-response-panel').getBoundingClientRect();
    return {choiceBottom:Math.max(...choices.map(r=>r.bottom)),panelTop:panel.top};
  });
  expect(layout.panelTop).toBeGreaterThanOrEqual(layout.choiceBottom-1);
  await page.locator('.support-choice[data-support="Independent"]').click();
  await expect(page.locator('#promptLevel')).toHaveValue('Independent');
  await page.locator('[data-action="showPracticeAnswer"]').click();
  await expect(page.locator('.choice.answer-key')).toHaveCount(1);
  await page.locator('[data-action="practiceNext"], [data-action="practiceFinish"]').click();
  await expect(page.locator('.premium-activity, .practice-library').first()).toBeVisible();
});

test('Current settings remain accessible, with voice and display controls',async ({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto(base+'#home');
  await page.locator('.v59-p-settings').click();
  await expect(page.locator('dialog[open] .settings-home')).toBeVisible();
  await page.locator('dialog[open] [data-settings-page="voice"]').click();
  await expect(page.locator('dialog[open] .settings-shell')).toContainText('Speaking speed');
  await page.locator('dialog[open] [data-settings-page="home"]').click();
  await page.locator('dialog[open] [data-settings-page="display"]').click();
  await expect(page.locator('dialog[open] .settings-shell')).toBeVisible();
});

test('Other learning activity entry points remain available',async ({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto(base+'#practice');
  await page.locator('[data-action="mathLaunch"]').click();
  await expect(page.locator('.math-launch')).toBeVisible();
  await page.locator('dialog[open] [data-action="closeModal"]').click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await page.locator('[data-action="muLaunch"]').click();
  await expect(page.locator('.mu-launch')).toBeVisible();
  await expect(page.locator('[data-mu-mode]')).toHaveCount(5);
  await page.locator('dialog[open] [data-action="closeModal"]').click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await page.locator('[data-action="traceLaunch"]').click();
  await expect(page.locator('dialog[open]')).toBeVisible();
});

test('More and Progress remain reachable without changing approved Home',async ({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto(base+'#more');
  await expect(page.locator('.more-group-card')).toHaveCount(6);
  await page.goto(base+'#progress');
  await expect(page.locator('.progress-page')).toBeVisible();
});
