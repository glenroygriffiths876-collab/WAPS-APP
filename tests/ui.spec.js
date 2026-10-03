const { test, expect } = require('@playwright/test');

function collectErrors(page){
  const errors=[];
  page.on('pageerror',e=>errors.push('page:'+e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push('console:'+m.text())});
  return errors;
}

test('Home keeps Talk and Practice Together as the two primary choices', async ({page})=>{
  const errors=collectErrors(page);
  await page.goto('http://127.0.0.1:4173/#home');
  await expect(page.locator('.home-big-action')).toHaveCount(2);
  await expect(page.locator('.home-practice-action')).toContainText('Practice Together');
  await page.locator('.home-practice-action').click();
  await expect(page).toHaveURL(/#practice$/);
  await expect(page.locator('.practice-native-grid')).toBeVisible();
  await page.locator('.brand[data-route="home"]').click();
  await page.locator('.home-talk-action').click();
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
  await expect(page.locator('.v55-support-hotspot')).toBeVisible();
  await page.locator('.v55-support-hotspot').click();
  const join=page.locator('dialog[open] a.whatsapp-join-btn');
  await expect(join).toHaveAttribute('href','https://chat.whatsapp.com/DvI8bqupHVQD2lLQUgAKYK');
  await expect(join).toHaveAttribute('target','_blank');
  await expect(page.locator('dialog[open]')).toContainText('New members need approval from a group admin.');
  await page.getByRole('button',{name:'Not now'}).click();
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


test('Numbers & Maths supports touch counting, addition and take away', async ({page})=>{
  const errors=collectErrors(page);
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:4173/#practice');
  await expect(page.locator('[data-action="mathLaunch"]')).toBeVisible();
  await page.locator('[data-action="mathLaunch"]').click();
  await expect(page.locator('.math-launch')).toBeVisible();

  await page.locator('[data-math-type="count"]').click();
  await expect(page.locator('.math-child-screen')).toBeVisible();
  await expect(page.locator('#supportFab')).toBeHidden();
  const first=page.locator('.math-object-btn').first();
  await first.click();
  await first.click();
  await expect(page.locator('.math-object-btn.counted')).toHaveCount(1);
  for(let i=0;i<12;i++){
    if(await page.locator('#mathAnswerGrid:not(.hidden)').count())break;
    const next=page.locator('.math-object-btn:not(.counted)').first();
    if(await next.count())await next.click(); else break;
  }
  await expect(page.locator('#mathAnswerGrid')).toBeVisible();
  await page.locator('[data-action="mathExit"]').click();

  await page.locator('[data-action="mathLaunch"]').click();
  await page.locator('[data-math-type="add"]').click();
  await expect(page.locator('.math-equation')).toContainText('+');
  await expect(page.locator('#mathAnswerGrid')).toBeVisible();
  await page.locator('[data-action="mathExit"]').click();

  await page.locator('[data-action="mathLaunch"]').click();
  await page.locator('[data-math-type="subtract"]').click();
  await expect(page.locator('.math-equation')).toContainText('−');
  for(let i=0;i<12;i++){
    if(await page.locator('#mathAnswerGrid:not(.hidden)').count())break;
    const next=page.locator('.math-object-btn:not(.removed)').first();
    if(await next.count())await next.click(); else break;
  }
  await expect(page.locator('#mathAnswerGrid')).toBeVisible();
  await expect(page.locator('.math-away-tray')).toBeVisible();
  expect(errors).toEqual([]);
});


test('Count finishes the spoken final number before showing How many', async ({page})=>{
  const errors=collectErrors(page);
  await page.addInitScript(()=>{
    window.__wapsSpeechLog=[];
    window.__wapsSpeechTimer=null;
    class MockUtterance{constructor(text){this.text=String(text);this.rate=1;this.pitch=1;this.onend=null;this.onerror=null}}
    const synth={
      cancel(){if(window.__wapsSpeechTimer){clearTimeout(window.__wapsSpeechTimer);window.__wapsSpeechTimer=null}window.__wapsSpeechLog.push('cancel')},
      speak(u){window.__wapsSpeechLog.push('speak:'+u.text);window.__wapsSpeechTimer=setTimeout(()=>{window.__wapsSpeechTimer=null;window.__wapsSpeechLog.push('end:'+u.text);if(u.onend)u.onend()},350)}
    };
    try{Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:MockUtterance})}catch{window.SpeechSynthesisUtterance=MockUtterance}
    try{Object.defineProperty(window,'speechSynthesis',{configurable:true,value:synth})}catch{window.speechSynthesis=synth}
  });
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:4173/#practice');
  await page.locator('[data-action="mathLaunch"]').click();
  await page.locator('[data-action="mathSettings"]').click();
  await page.locator('input[name="mathMax"][value="3"]').check({force:true});
  await page.locator('#mathHearNumbers').check({force:true});
  await page.locator('[data-action="mathSaveSettings"]').click();
  await page.locator('[data-math-type="count"]').click();
  await page.waitForTimeout(600);
  await page.evaluate(()=>window.__wapsSpeechLog=[]);

  const total=Number(await page.locator('.math-child-screen').getAttribute('data-math-total'));
  const first=page.locator('.math-object-btn').first();
  await first.click();
  await first.click();
  await expect(page.locator('.math-object-btn.counted')).toHaveCount(1);

  for(let i=1;i<total;i++){
    const next=page.locator('.math-object-btn:not(.counted)').first();
    await next.click();
  }

  const hiddenImmediately=await page.locator('#mathAnswerGrid').evaluate(el=>el.classList.contains('hidden'));
  expect(hiddenImmediately).toBe(true);
  const immediateLog=await page.evaluate(()=>[...window.__wapsSpeechLog]);
  expect(immediateLog).toContain('speak:'+total);
  expect(immediateLog).not.toContain('end:'+total);

  await expect(page.locator('#mathAnswerGrid')).toBeVisible({timeout:1400});
  await page.waitForTimeout(250);
  const log=await page.evaluate(()=>[...window.__wapsSpeechLog]);
  const endIndex=log.indexOf('end:'+total);
  const howManyIndex=log.indexOf('speak:How many?');
  expect(endIndex).toBeGreaterThanOrEqual(0);
  expect(howManyIndex).toBeGreaterThan(endIndex);
  expect(errors).toEqual([]);
});

test('Numbers up to supports exact ceilings through 50 across all Maths modes', async ({page})=>{
  const errors=collectErrors(page);
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:4173/#practice');

  for(const max of [3,10,12,20,50]){
    await page.locator('[data-action="mathLaunch"]').click();
    await page.locator('[data-action="mathSettings"]').click();
    if(max>10){
      const more=page.locator('.math-more-numbers');
      if(!(await more.evaluate(el=>el.open)))await more.locator('summary').click();
    }
    await page.locator('input[name="mathMax"][value="'+max+'"]').check({force:true});
    await page.locator('#mathHearNumbers').uncheck({force:true});
    await page.locator('[data-action="mathSaveSettings"]').click();
    await expect(page.locator('.math-change')).toContainText('Up to '+max);

    await page.locator('[data-math-type="count"]').click();
    const countScreen=page.locator('.math-child-screen');
    expect(Number(await countScreen.getAttribute('data-math-max'))).toBe(max);
    const countTotal=Number(await countScreen.getAttribute('data-math-total'));
    expect(countTotal).toBeGreaterThanOrEqual(1);
    expect(countTotal).toBeLessThanOrEqual(max);
    expect(await page.locator('.math-object-btn').count()).toBeLessThanOrEqual(10);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(2);
    await page.locator('[data-action="mathExit"]').click();

    await page.locator('[data-action="mathLaunch"]').click();
    await page.locator('[data-math-type="add"]').click();
    const addScreen=page.locator('.math-child-screen');
    expect(Number(await addScreen.getAttribute('data-math-answer-value'))).toBeLessThanOrEqual(max);
    expect(Number(await addScreen.getAttribute('data-math-total'))).toBeLessThanOrEqual(max);
    await page.locator('[data-action="mathExit"]').click();

    await page.locator('[data-action="mathLaunch"]').click();
    await page.locator('[data-math-type="subtract"]').click();
    const subScreen=page.locator('.math-child-screen');
    expect(Number(await subScreen.getAttribute('data-math-start'))).toBeLessThanOrEqual(max);
    expect(Number(await subScreen.getAttribute('data-math-answer-value'))).toBeGreaterThanOrEqual(0);
    await page.locator('[data-action="mathExit"]').click();
  }

  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('[data-action="mathLaunch"]').click();
  await page.locator('[data-action="mathSettings"]').click();
  await expect(page.locator('input[name="mathMax"][value="50"]')).toBeChecked();
  expect(errors).toEqual([]);
});

test('Numbers up to stays separate for each child profile', async ({page})=>{
  const errors=collectErrors(page);
  await page.goto('http://127.0.0.1:4173/#home');

  await page.locator('.v55-profile-hotspot:visible, #childSwitcher:visible').first().click();
  await page.locator('#pname').fill('Math Child A');
  await page.locator('[data-action="saveProfile"]').click();
  await page.goto('http://127.0.0.1:4173/#practice');
  await page.locator('[data-action="mathLaunch"]').click();
  await page.locator('[data-action="mathSettings"]').click();
  await page.locator('input[name="mathMax"][value="4"]').check({force:true});
  await page.locator('[data-action="mathSaveSettings"]').click();
  await page.locator('dialog[open] [data-action="closeModal"]').click();

  await page.locator('.v55-profile-hotspot:visible, #childSwitcher:visible').first().click();
  await page.locator('#pname').fill('Math Child B');
  await page.locator('[data-action="saveProfile"]').click();
  await page.locator('[data-action="mathLaunch"]').click();
  await page.locator('[data-action="mathSettings"]').click();
  await page.locator('input[name="mathMax"][value="8"]').check({force:true});
  await page.locator('[data-action="mathSaveSettings"]').click();
  await page.locator('dialog[open] [data-action="closeModal"]').click();

  await page.locator('.v55-profile-hotspot:visible, #childSwitcher:visible').first().click();
  await page.locator('.list-item',{hasText:'Math Child A'}).locator('.choose-profile').click();
  await page.locator('[data-action="mathLaunch"]').click();
  await page.locator('[data-action="mathSettings"]').click();
  await expect(page.locator('input[name="mathMax"][value="4"]')).toBeChecked();
  await page.locator('dialog[open] [data-action="closeModal"]').click();

  await page.locator('.v55-profile-hotspot:visible, #childSwitcher:visible').first().click();
  await page.locator('.list-item',{hasText:'Math Child B'}).locator('.choose-profile').click();
  await page.locator('[data-action="mathLaunch"]').click();
  await page.locator('[data-action="mathSettings"]').click();
  await expect(page.locator('input[name="mathMax"][value="8"]')).toBeChecked();
  expect(errors).toEqual([]);
});


test('Talk includes reviewer-requested functional words and places', async ({page})=>{
  const errors=collectErrors(page);
  await page.goto('http://127.0.0.1:4173/#talk');
  for(const word of ['WAIT','I SEE','DOCTOR','SUPERMARKET','PLAYGROUND','SNACK']){
    await expect(page.locator('.aac').filter({hasText:word}).first()).toBeVisible();
  }
  await expect(page.locator('.aac').filter({hasText:'CLINIC'})).toHaveCount(0);
  await expect(page.locator('.aac').filter({hasText:'SUPERMARKET'}).locator('.mu-direct-visual img')).toHaveAttribute('src','./assets/concepts/highres/supermarket.webp');
  await expect(page.locator('.aac').filter({hasText:'PLAYGROUND'}).locator('.mu-direct-visual img')).toHaveAttribute('src','./assets/concepts/highres/playground.webp');
  await expect(page.locator('.aac').filter({hasText:'SNACK'}).locator('.mu-direct-visual img')).toHaveAttribute('src','./assets/concepts/highres/snack.webp');
  await page.locator('.aac').filter({hasText:'I SEE'}).first().click();
  await page.locator('.aac').filter({hasText:'APPLE'}).first().click();
  await expect(page.locator('#sentence')).toContainText('I SEE');
  await expect(page.locator('#sentence')).toContainText('APPLE');
  expect(errors).toEqual([]);
});

test('Match & Understand opens all five modes and respects picture field size', async ({page})=>{
  const errors=collectErrors(page);
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:4173/#practice');
  await expect(page.locator('[data-action="muLaunch"]')).toBeVisible();
  await page.locator('[data-action="muLaunch"]').click();
  await expect(page.locator('.mu-launch')).toBeVisible();
  await expect(page.locator('button[data-mu-mode]')).toHaveCount(5);

  await page.locator('[data-action="muSettings"]').click();
  await page.locator('input[name="muField"][value="5"]').check({force:true});
  await page.locator('#muHearPrompts').uncheck({force:true});
  await page.locator('[data-action="muSaveSettings"]').click();
  await expect(page.locator('.mu-change')).toContainText('5 pictures');

  await page.locator('button[data-mu-mode="find"]').click();
  await expect(page.locator('.mu-child-screen')).toHaveAttribute('data-mu-field','5');
  await expect(page.locator('.mu-picture-choice')).toHaveCount(5);
  await expect(page.locator('#supportFab')).toBeHidden();
  let overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  await page.locator('[data-action="muExit"]').click();

  await page.locator('[data-action="muLaunch"]').click();
  await page.locator('button[data-mu-mode="match"]').click();
  await expect(page.locator('.mu-shape-grid button')).toHaveCount(2);
  await expect(page.locator('.mu-shape.circle')).toBeVisible();
  await expect(page.locator('.mu-shape.diamond')).toBeVisible();
  await page.locator('[data-action="muExit"]').click();

  await page.locator('[data-action="muLaunch"]').click();
  await page.locator('button[data-mu-mode="sort"]').click();
  await expect(page.locator('.mu-sort-bins button')).toHaveCount(2);
  await page.locator('[data-action="muExit"]').click();

  await page.locator('[data-action="muLaunch"]').click();
  await page.locator('button[data-mu-mode="group"]').click();
  await expect(page.locator('.mu-picture-choice')).toHaveCount(5);
  await page.locator('[data-action="muExit"]').click();

  await page.locator('[data-action="muLaunch"]').click();
  await page.locator('button[data-mu-mode="rules"]').click();
  await expect(page.locator('.mu-rule-legend')).toContainText('Apple');
  await expect(page.locator('.mu-rule-legend')).toContainText('Kite');
  await expect(page.locator('.mu-picture-choice')).toHaveCount(5);
  overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  expect(errors).toEqual([]);
});

test('Match & Understand picture setting is profile specific and survives reload', async ({page})=>{
  const errors=collectErrors(page);
  await page.goto('http://127.0.0.1:4173/#home');
  await page.locator('.v55-profile-hotspot:visible, #childSwitcher:visible').first().click();
  await page.locator('#pname').fill('Understanding Child A');
  await page.locator('[data-action="saveProfile"]').click();
  await page.goto('http://127.0.0.1:4173/#practice');
  await page.locator('[data-action="muLaunch"]').click();
  await page.locator('[data-action="muSettings"]').click();
  await page.locator('input[name="muField"][value="4"]').check({force:true});
  await page.locator('[data-action="muSaveSettings"]').click();
  await page.locator('dialog[open] [data-action="closeModal"]').click();

  await page.locator('.v55-profile-hotspot:visible, #childSwitcher:visible').first().click();
  await page.locator('#pname').fill('Understanding Child B');
  await page.locator('[data-action="saveProfile"]').click();
  await page.locator('[data-action="muLaunch"]').click();
  await page.locator('[data-action="muSettings"]').click();
  await page.locator('input[name="muField"][value="5"]').check({force:true});
  await page.locator('[data-action="muSaveSettings"]').click();
  await page.locator('dialog[open] [data-action="closeModal"]').click();

  await page.locator('.v55-profile-hotspot:visible, #childSwitcher:visible').first().click();
  await page.locator('.list-item',{hasText:'Understanding Child A'}).locator('.choose-profile').click();
  await page.locator('[data-action="muLaunch"]').click();
  await page.locator('[data-action="muSettings"]').click();
  await expect(page.locator('input[name="muField"][value="4"]')).toBeChecked();
  await page.locator('dialog[open] [data-action="closeModal"]').click();

  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('[data-action="muLaunch"]').click();
  await page.locator('[data-action="muSettings"]').click();
  await expect(page.locator('input[name="muField"][value="4"]')).toBeChecked();
  expect(errors).toEqual([]);
});

test('Match & Understand individual production images load', async ({page})=>{
  const errors=collectErrors(page);
  const ids=["supermarket","playground","clock","fork","glass","bottle","pen","marker","dress","hat","red-apple","red-car","blue-car","brown-dog","brown-horse","green-dotted-ball","hot-soup","ice-cream","calendar","snack","kite"];
  await page.goto('http://127.0.0.1:4173/#practice');
  const qa=await page.evaluate(async ids=>{
    const mod=await import('./comprehension-data.js');
    const host=document.createElement('div');
    host.id='mu-asset-qa';
    document.body.append(host);
    for(const id of ids){
      const cell=document.createElement('div');
      cell.dataset.qa=id;
      cell.innerHTML=mod.muSpecialVisualHTML(id,'qa-photo').replace('loading="lazy"','loading="eager"');
      host.append(cell);
    }
    Object.assign(host.style,{position:'fixed',inset:'0',zIndex:'99999',overflow:'auto',background:'#fff'});
    const requests=await Promise.all(ids.map(async id=>{
      const src='./assets/concepts/highres/'+id+'.webp';
      const response=await fetch(src,{cache:'no-store'});
      return {id,src,status:response.status,ok:response.ok};
    }));
    const imgs=[...host.querySelectorAll('img')];
    for(const img of imgs){
      img.loading='eager';
      img.style.width='64px';
      img.style.height='64px';
    }
    await Promise.all(imgs.map(img=>new Promise((resolve,reject)=>{
      if(img.complete)return img.naturalWidth>0?resolve():reject(new Error('broken '+img.src));
      const timer=setTimeout(()=>reject(new Error('image timeout '+img.src)),5000);
      img.addEventListener('load',()=>{clearTimeout(timer);resolve()},{once:true});
      img.addEventListener('error',()=>{clearTimeout(timer);reject(new Error('broken '+img.src))},{once:true});
    })));
    return {
      requests,
      images:imgs.map(img=>({
        id:img.closest('[data-qa]')?.dataset.qa,
        src:img.getAttribute('src'),
        complete:img.complete,
        naturalWidth:img.naturalWidth,
        naturalHeight:img.naturalHeight
      })),
      spriteCount:host.querySelectorAll('.mu-sprite').length
    };
  },ids);
  expect(qa.requests).toHaveLength(ids.length);
  for(const row of qa.requests){
    expect(row.ok,row.id+' request failed').toBeTruthy();
    expect(row.status,row.id+' HTTP status').toBe(200);
  }
  expect(qa.images).toHaveLength(ids.length);
  for(const row of qa.images){
    expect(row.complete,row.id+' image incomplete').toBeTruthy();
    expect(row.naturalWidth,row.id+' naturalWidth').toBeGreaterThan(0);
    expect(row.naturalHeight,row.id+' naturalHeight').toBeGreaterThan(0);
    expect(row.src).toBe('./assets/concepts/highres/'+row.id+'.webp');
  }
  expect(qa.spriteCount).toBe(0);
  const source=await page.evaluate(()=>fetch('./comprehension-data.js',{cache:'no-store'}).then(r=>r.text()));
  expect(source).not.toContain('board-001-020.webp');
  expect(source).not.toContain('board-041-060.webp');
  expect(source).not.toContain('assets/comprehension/kite.webp');
  expect(source).not.toContain('mu-sprite');
  expect(errors).toEqual([]);
});

test('Mobile core screens have no horizontal overflow', async ({page})=>{
  for(const viewport of [{width:360,height:800},{width:390,height:844},{width:430,height:932},{width:820,height:1180}]){
    await page.setViewportSize(viewport);
    for(const route of ['home','talk','practice','coach','progress','more']){
      await page.goto('http://127.0.0.1:4173/#'+route);
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
      expect(overflow, route+' at '+viewport.width+'x'+viewport.height).toBeLessThanOrEqual(2);
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
  await expect(page.locator('.calm-home')).toBeVisible();
  await page.locator('.home-practice-action').click();
  await expect(page.locator('.practice-library')).toBeVisible();
  await context.setOffline(false);
});


test('v50 home keeps only Talk and Practice Together dominant', async ({page})=>{
  const errors=collectErrors(page);
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:4173/#home');
  await expect(page.locator('.home-big-action')).toHaveCount(2);
  await expect(page.locator('.home-big-action').filter({hasText:'Talk'})).toBeVisible();
  await expect(page.locator('.home-big-action').filter({hasText:'Practice Together'})).toBeVisible();
  await expect(page.locator('.calm-home')).not.toContainText('Help Now');
  await expect(page.locator('.calm-home')).not.toContainText('Coach');
  await expect(page.locator('.desktopnav [data-route="coach"]')).toHaveCount(0);
  await expect(page.locator('.bottomnav [data-route="coach"]')).toHaveCount(0);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  expect(errors).toEqual([]);
});

test('v50 Practice Together separates WAPS Activities from Explore More', async ({page})=>{
  const errors=collectErrors(page);
  await page.goto('http://127.0.0.1:4173/#practice');
  await expect(page.locator('.practice-tabs [data-practice-tab="waps"]')).toHaveAttribute('aria-selected','true');
  await expect(page.locator('.practice-native-grid .practice-tool-card')).toHaveCount(6);
  await expect(page.locator('[data-action="startUnifiedPractice"]')).toContainText('Mixed Practice');
  await expect(page.locator('.practice-native-grid')).toContainText('Words & Names');
  await expect(page.locator('[data-external-learning]')).toHaveCount(0);
  await page.locator('[data-practice-tab="explore"]').click();
  await expect(page.locator('[data-practice-tab="explore"]')).toHaveAttribute('aria-selected','true');
  const toy=page.locator('[data-external-learning="toy-theater"]');
  await expect(toy).toContainText('Toy Theater');
  await expect(toy).toHaveAttribute('href','https://toytheater.com/');
  await expect(toy).toHaveAttribute('target','_blank');
  expect(errors).toEqual([]);
});

test('v50 Find Help contains Coach and School Shadow Caregiver resource', async ({page})=>{
  const errors=collectErrors(page);
  await page.goto('http://127.0.0.1:4173/#more');
  await page.locator('[data-more-group="help"]').click();
  await expect(page.locator('dialog[open]')).toContainText('Help now');
  await expect(page.locator('dialog[open]')).toContainText('Coach');
  await expect(page.locator('dialog[open]')).toContainText('School Shadow / Caregiver');
  await page.locator('[data-action="shadowHelp"]').click();
  await expect(page.locator('.shadow-help-sheet')).toBeVisible();
  await expect(page.locator('.shadow-help-sheet')).toContainText('Documents you may need');
  await expect(page.locator('[data-shadow-pdf="requirements"]')).toBeVisible();
  await expect(page.locator('[data-shadow-pdf="job"]')).toBeVisible();
  await expect(page.locator('.shadow-help-sheet a[href="https://moey.gov.jm/special-education-unit/"]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('v50 Gentle Steps music is opt-in, bundled and caregiver controlled', async ({page})=>{
  const errors=collectErrors(page);
  await page.goto('http://127.0.0.1:4173/#home');
  const asset=await page.evaluate(()=>fetch('./assets/audio/waps-gentle-steps.mp3',{cache:'no-store'}).then(r=>({ok:r.ok,status:r.status,size:Number(r.headers.get('content-length')||0)})));
  expect(asset.ok).toBeTruthy();
  expect(asset.status).toBe(200);
  await page.locator('.v55-top-settings:visible, .header-circle[data-action="settings"]:visible').first().click();
  await expect(page.locator('#backgroundAudioSetting')).not.toBeChecked();
  await expect(page.locator('#audioVolumeSetting')).toHaveValue('0.25');
  await page.locator('#audioVolumeSetting').fill('0.35');
  await expect(page.locator('#audioVolumeSettingValue')).toHaveText('35%');
  await page.locator('[data-action="previewMusic"]').click();
  await page.waitForTimeout(250);
  const state=await page.evaluate(()=>({music:document.documentElement.dataset.music,src:document.querySelector('audio')?.src||null}));
  expect(['playing','blocked']).toContain(state.music);
  await page.locator('[data-action="saveSettings"]').click();
  await page.locator('.v55-top-settings:visible, .header-circle[data-action="settings"]:visible').first().click();
  await expect(page.locator('#audioVolumeSetting')).toHaveValue('0.35');
  expect(errors).toEqual([]);
});



test('v50 Talk is compact on a 390x844 phone', async ({page})=>{
  const errors=collectErrors(page);
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:4173/#talk');
  await expect(page.locator('.compact-talk-title')).toBeVisible();
  await expect(page.locator('.talk-sticky-zone')).toBeVisible();
  await expect(page.locator('.compact-quick')).toBeVisible();
  await expect(page.locator('.compact-catbar')).toBeVisible();
  await expect(page.locator('.aac-grid .aac').first()).toBeVisible();
  const dims=await page.evaluate(()=>{
    const first=document.querySelector('.aac-grid .aac')?.getBoundingClientRect();
    const sticky=document.querySelector('.talk-sticky-zone')?.getBoundingClientRect();
    return {
      firstTop:first?.top||9999,
      stickyBottom:sticky?.bottom||0,
      vh:innerHeight,
      cols:getComputedStyle(document.querySelector('#aacGrid')).gridTemplateColumns.split(' ').length,
      overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth
    };
  });
  expect(dims.firstTop).toBeLessThan(780);
  expect(dims.cols).toBe(3);
  expect(dims.overflow).toBeLessThanOrEqual(2);
  expect(errors).toEqual([]);
});

test('v50 phone landscape uses a denser Talk grid without horizontal page overflow', async ({page})=>{
  await page.setViewportSize({width:844,height:390});
  await page.goto('http://127.0.0.1:4173/#talk');
  await expect(page.locator('#aacGrid')).toBeVisible();
  const dims=await page.evaluate(()=>({
    cols:getComputedStyle(document.querySelector('#aacGrid')).gridTemplateColumns.split(' ').length,
    overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth
  }));
  expect(dims.cols).toBeGreaterThanOrEqual(5);
  expect(dims.overflow).toBeLessThanOrEqual(2);
});

test('v50 Fredoka and Nunito are self-hosted and load on phone viewport', async ({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:4173/#home');
  const result=await page.evaluate(async()=>{
    await document.fonts.ready;
    const [fredoka,nunito]=await Promise.all([
      fetch('./assets/fonts/fredoka-variable.woff2',{cache:'no-store'}),
      fetch('./assets/fonts/nunito-variable.ttf',{cache:'no-store'})
    ]);
    return {
      fredokaOk:fredoka.ok,
      nunitoOk:nunito.ok,
      fredokaCheck:document.fonts.check('16px "WAPS Fredoka"'),
      nunitoCheck:document.fonts.check('16px "WAPS Nunito"'),
      body:getComputedStyle(document.body).fontFamily,
      heading:getComputedStyle(document.querySelector('button')).fontFamily
    };
  });
  expect(result.fredokaOk).toBeTruthy();
  expect(result.nunitoOk).toBeTruthy();
  expect(result.fredokaCheck).toBeTruthy();
  expect(result.nunitoCheck).toBeTruthy();
  expect(result.body).toContain('WAPS Nunito');
  expect(result.heading).toContain('WAPS Fredoka');
});

test('v50 Child Mode persists across Talk Practice and internal activity navigation', async ({page})=>{
  const errors=collectErrors(page);
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:4173/#more');
  await page.locator('[data-more-group="settings"]').click();
  await page.locator('[data-action="childMode"]').click();
  await expect(page.locator('#childLock')).toBeVisible();
  await page.locator('.child-go[data-child-route="talk"]').click();
  await expect(page.locator('body')).toHaveClass(/child-mode-active/);
  await expect(page.locator('#childModeExitDock')).toBeVisible();
  await expect(page.locator('.bottomnav [data-route="more"]')).toBeHidden();
  await page.locator('.bottomnav [data-route="home"]').click();
  await expect(page.locator('body')).toHaveClass(/child-mode-active/);
  await page.locator('.bottomnav [data-route="practice"]').click();
  await expect(page.locator('body')).toHaveClass(/child-mode-active/);
  await page.locator('[data-action="startUnifiedPractice"]').click();
  await expect(page.locator('.premium-activity')).toBeVisible();
  await expect(page.locator('body')).toHaveClass(/child-mode-active/);
  await page.locator('[data-route="practice"]').first().click();
  await expect(page.locator('body')).toHaveClass(/child-mode-active/);
  await page.locator('#childModeExitDock').dispatchEvent('pointerdown');
  await page.waitForTimeout(1800);
  await expect(page.locator('body')).not.toHaveClass(/child-mode-active/);
  expect(errors).toEqual([]);
});

test('v50 Explore More does not open external links from Child Mode', async ({page})=>{
  await page.goto('http://127.0.0.1:4173/#more');
  await page.locator('[data-more-group="settings"]').click();
  await page.locator('[data-action="childMode"]').click();
  await page.locator('.child-go[data-child-route="practice"]').click();
  await page.locator('[data-practice-tab="explore"]').click();
  const toy=page.locator('[data-external-learning="toy-theater"]');
  await expect(toy).toBeVisible();
  const before=page.url();
  await toy.click();
  await expect(page).toHaveURL(before);
  await expect(page.locator('#toast')).toContainText('caregiver');
});


test('v50 mobile Settings remains visible and caregiver utilities do not cover content', async ({page})=>{
  for(const viewport of [{width:360,height:800},{width:390,height:844},{width:430,height:932}]){
    await page.setViewportSize(viewport);
    await page.goto('http://127.0.0.1:4173/#practice');
    await expect(page.locator('.header-circle[data-action="settings"]')).toBeVisible();
    await expect(page.locator('#caregiverUtilities')).toBeHidden();
    await page.locator('.header-circle[data-action="settings"]').click();
    await expect(page.locator('.premium-settings')).toBeVisible();
    await expect(page.locator('.premium-settings')).toContainText('Background Music');
    await page.locator('[data-action="closeModal"]').click();
  }
});

test('v50 Practice shows four activities above the fold on 390x844 phone', async ({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:4173/#practice');
  const cards=page.locator('.practice-native-grid .practice-tool-card');
  await expect(cards).toHaveCount(6);
  const boxes=await cards.evaluateAll(els=>els.slice(0,4).map(e=>e.getBoundingClientRect().bottom));
  expect(Math.max(...boxes)).toBeLessThan(780);
  const cols=await page.locator('.practice-native-grid').evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length);
  expect(cols).toBe(2);
});

test('v50 Mixed Practice choice cards are compact rather than vertically stretched', async ({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:4173/#practice');
  await page.locator('[data-action="startUnifiedPractice"]').click();
  await expect(page.locator('.premium-activity')).toBeVisible();
  const dims=await page.locator('.choice').evaluateAll(els=>els.map(e=>{const r=e.getBoundingClientRect();return {w:r.width,h:r.height,bottom:r.bottom}}));
  expect(dims.length).toBeGreaterThanOrEqual(2);
  for(const d of dims){
    expect(d.h).toBeLessThan(360);
    expect(d.h/d.w).toBeLessThan(1.5);
  }
  expect(Math.max(...dims.map(x=>x.bottom))).toBeLessThan(790);
});

test('v50 Talk quick labels are not clipped on phone', async ({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:4173/#talk');
  const toilet=page.locator('.compact-quick [data-quickword="toilet"]');
  await expect(toilet).toContainText('TOILET');
  const clipped=await toilet.evaluate(el=>{
    const label=el.querySelector('b');
    return label.scrollWidth>label.clientWidth+1 || label.scrollHeight>label.clientHeight+1;
  });
  expect(clipped).toBeFalsy();
});


test('v51 icon manifest exposes the complete 48-icon system', async ({page})=>{
  const errors=collectErrors(page);
  await page.goto('http://127.0.0.1:4173/#home');
  const result=await page.evaluate(async()=>{
    const [m,s]=await Promise.all([
      fetch('./assets/ui/v51/manifest.json',{cache:'no-store'}),
      fetch('./assets/ui/v51/icons.svg',{cache:'no-store'})
    ]);
    const manifest=await m.json();
    const sprite=await s.text();
    return {manifestStatus:m.status,spriteStatus:s.status,count:Object.keys(manifest.icons||{}).length,release:manifest.release,symbols:(sprite.match(/<symbol id=/g)||[]).length};
  });
  expect(result.manifestStatus).toBe(200);
  expect(result.spriteStatus).toBe(200);
  expect(result.release).toBe('v51');
  expect(result.count).toBe(48);
  expect(result.symbols).toBeGreaterThanOrEqual(48);
  expect(errors).toEqual([]);
});

test('v51 home preserves primary actions without horizontal overflow across target viewports', async ({page})=>{
  const errors=collectErrors(page);
  for(const vp of [{width:360,height:800},{width:390,height:844},{width:430,height:932},{width:820,height:1180},{width:1366,height:768}]){
    await page.setViewportSize(vp);
    await page.goto('http://127.0.0.1:4173/#home');
    await expect(page.locator('.home-talk-action')).toBeVisible();
    await expect(page.locator('.home-practice-action')).toBeVisible();
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(2);
  }
  expect(errors).toEqual([]);
});

test('v51 responsive recomposition keeps the same route and functions after orientation change', async ({page})=>{
  const errors=collectErrors(page);
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:4173/#practice');
  await expect(page.locator('[data-action="mathLaunch"]')).toBeVisible();
  await page.setViewportSize({width:844,height:390});
  await expect(page).toHaveURL(/#practice$/);
  await expect(page.locator('[data-action="mathLaunch"]')).toBeVisible();
  await expect(page.locator('[data-action="traceLaunch"]')).toBeVisible();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  expect(errors).toEqual([]);
});

test('v51 low stimulation suppresses decorative treatment and focused practice stays quiet', async ({page})=>{
  const errors=collectErrors(page);
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:4173/#home');
  await page.locator('.v55-top-settings').click();
  await page.locator('#stimSetting').check({force:true});
  await page.locator('[data-action="saveSettings"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-low-stim','1');
  const bg=await page.locator('body').evaluate(el=>getComputedStyle(el).backgroundImage);
  expect(bg==='none'||bg.includes('none')).toBeTruthy();
  await page.goto('http://127.0.0.1:4173/#practice');
  await page.locator('[data-action="startUnifiedPractice"]').click();
  await expect(page.locator('.premium-activity')).toBeVisible();
  await expect(page.locator('body')).toHaveAttribute('data-view','focus');
  const activityBg=await page.locator('.premium-activity').evaluate(el=>getComputedStyle(el).backgroundImage);
  expect(activityBg).toContain('linear-gradient');
  expect(errors).toEqual([]);
});


test('v55 Home renders the locked approved reference artwork across target viewports', async ({page})=>{
  const errors=collectErrors(page);
  for(const vp of [{width:360,height:800},{width:390,height:844},{width:430,height:932},{width:820,height:1180},{width:1366,height:768},{width:1920,height:1080}]){
    await page.setViewportSize(vp);
    await page.goto('http://127.0.0.1:4173/#home');
    await expect(page.locator('.v55-main-image')).toBeVisible();
    await expect(page.locator('.v55-nav-image')).toBeVisible();
    await expect(page.locator('.home-talk-action')).toBeVisible();
    await expect(page.locator('.home-practice-action')).toBeVisible();
    const m=await page.evaluate(()=>({
      overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
      main:[document.querySelector('.v55-main-image').naturalWidth,document.querySelector('.v55-main-image').naturalHeight],
      nav:[document.querySelector('.v55-nav-image').naturalWidth,document.querySelector('.v55-nav-image').naturalHeight],
      bodyH:document.body.getBoundingClientRect().height,
      viewH:innerHeight
    }));
    expect(m.overflow).toBeLessThanOrEqual(2);
    expect(m.main).toEqual([1024,1304]);
    expect(m.nav).toEqual([1024,174]);
    expect(Math.abs(m.bodyH-m.viewH)).toBeLessThanOrEqual(4);
  }
  expect(errors).toEqual([]);
});

test('v55 phone Home keeps the locked navigation on the bottom edge with no page scrolling', async ({page})=>{
  const errors=collectErrors(page);
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:4173/#home');
  await expect(page.locator('.v55-nav-frame')).toBeVisible();
  const m=await page.evaluate(()=>{
    const n=document.querySelector('.v55-nav-frame').getBoundingClientRect();
    const main=document.querySelector('.v55-main-frame').getBoundingClientRect();
    return {navBottom:n.bottom,mainTop:main.top,scrollH:document.documentElement.scrollHeight,h:innerHeight};
  });
  expect(Math.abs(m.navBottom-m.h)).toBeLessThanOrEqual(3);
  expect(m.mainTop).toBeGreaterThanOrEqual(-1);
  expect(m.scrollH).toBeLessThanOrEqual(m.h+3);
  expect(errors).toEqual([]);
});

test('v55 locked Home hit targets preserve approved actions', async ({page})=>{
  const errors=collectErrors(page);
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:4173/#home');
  await expect(page.locator('.v55-profile-hotspot')).toBeVisible();
  await expect(page.locator('.v55-top-progress')).toBeVisible();
  await expect(page.locator('.v55-top-settings')).toBeVisible();
  await expect(page.locator('.v55-top-more')).toBeVisible();
  await expect(page.locator('.v55-secondary-caregiver')).toBeVisible();
  await expect(page.locator('.v55-support-hotspot')).toBeVisible();
  await expect(page.locator('.v55-install-hotspot')).toBeVisible();
  await expect(page.locator('.v55-share-hotspot')).toBeVisible();
  await page.locator('.v55-talk-hotspot').click();
  await expect(page).toHaveURL(/#talk$/);
  await page.goto('http://127.0.0.1:4173/#home');
  await page.locator('.v55-practice-hotspot').click();
  await expect(page).toHaveURL(/#practice$/);
  expect(errors).toEqual([]);
});

test('v55 locked Home assets and manifest are bundled for offline use', async ({page})=>{
  const errors=collectErrors(page);
  await page.goto('http://127.0.0.1:4173/#home');
  const result=await page.evaluate(async()=>{
    const paths=['./assets/ui/v55/manifest.json','./assets/ui/v55/home-main.png','./assets/ui/v55/home-nav.png'];
    return Promise.all(paths.map(async path=>{const r=await fetch(path,{cache:'no-store'});return {path,ok:r.ok,status:r.status,size:(await r.arrayBuffer()).byteLength}}));
  });
  expect(result.every(v=>v.ok)).toBeTruthy();
  expect(result[1].size).toBeGreaterThan(1500000);
  expect(result[2].size).toBeGreaterThan(100000);
  expect(errors).toEqual([]);
});

test('v55 Low Stimulation and Child Mode still override caregiver-heavy Home art', async ({page})=>{
  const errors=collectErrors(page);
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:4173/#home');
  const guards=await page.evaluate(()=>{
    let all='';
    for(const sheet of Array.from(document.styleSheets)){
      try{all+='\n'+Array.from(sheet.cssRules||[]).map(r=>String(r.cssText||'')).join('\n')}catch{}
    }
    return all.includes('child-mode-active')&&all.includes('v55-caregiver-hotspot')&&all.includes('data-low-stim');
  });
  expect(guards).toBeTruthy();
  expect(errors).toEqual([]);
});
