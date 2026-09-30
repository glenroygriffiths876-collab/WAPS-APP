import {COLOURS,SHAPES,COLOUR_PRESETS,SHAPE_PRESETS,COLOUR_BASE_SHAPES,SHAPE_BASE_COLOURS,validateConceptData} from './identify-data.js';

export function createIdentifyFeature(ctx){
  const {getState,persist,active,show,toast,main,modal,go,esc,celebrate}=ctx;
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const colourMap=Object.fromEntries(COLOURS.map(x=>[x.id,x]));
  const shapeMap=Object.fromEntries(SHAPES.map(x=>[x.id,x]));
  const praise=['Great job!','You found it!','Yes!','Nice looking!','Well done!'];
  const clone=v=>JSON.parse(JSON.stringify(v));
  const defaults={
    colours:{selected:[...COLOUR_PRESETS.early],choices:3,showWord:true,autoSpeak:true,celebration:true,sessionLength:'continuous',generalise:false},
    shapes:{selected:[...SHAPE_PRESETS.early],choices:3,showWord:true,autoSpeak:true,celebration:true,sessionLength:'continuous',generalise:false}
  };
  let draft=null,runtime=null,advanceTimer=null;

  function state(){
    const S=getState();if(!S.identify||typeof S.identify!=='object')S.identify={prefs:{},sessions:{},history:[]};
    S.identify.prefs=S.identify.prefs||{};S.identify.sessions=S.identify.sessions||{};S.identify.history=Array.isArray(S.identify.history)?S.identify.history:[];
    return S.identify;
  }
  const profileKey=()=>getState().active||'global';
  function slot(obj){const k=profileKey();if(!obj[k])obj[k]={};return obj[k]}
  function prefs(type){const b=slot(state().prefs);if(!b[type])b[type]=clone(defaults[type]);return b[type]}
  function session(type){return slot(state().sessions)[type]||null}
  function saveSession(type,s){slot(state().sessions)[type]=s}
  const selectedLabel=(type,id)=>type==='colours'?colourMap[id]?.label:shapeMap[id]?.label;
  function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
  function makeRound(items,last){
    let r=shuffle(items);
    if(r.length>1&&r[0]===last){const j=1+Math.floor(Math.random()*(r.length-1));[r[0],r[j]]=[r[j],r[0]]}
    return r;
  }
  function configSignature(p){return JSON.stringify([p.selected,p.choices,p.showWord,p.autoSpeak,p.celebration,p.sessionLength,p.generalise])}
  function launch(){
    cleanup();
    const cs=session('colours'),ss=session('shapes');
    const cp=cs&&cs.queue?.length?Math.min(cs.cursor+1,cs.queue.length)+'/'+cs.queue.length:'';
    const sp=ss&&ss.queue?.length?Math.min(ss.cursor+1,ss.queue.length)+'/'+ss.queue.length:'';
    show(`<div class="identify-launch"><span class="eyebrow">WAPS COLOURS & SHAPES</span><h1>What would you like to identify?</h1><p>One clear target at a time. Colours use the same shape; shapes use the same colour.</p><div class="identify-type-grid">
      <button data-identify-type="colours"><span>🎨</span><b>Colours</b><small>Red, blue, yellow, green and more${cp?' · Continue '+cp:''}</small></button>
      <button data-identify-type="shapes"><span>🔷</span><b>Shapes</b><small>Circle, square, triangle and more${sp?' · Continue '+sp:''}</small></button>
    </div><div class="notice"><b>Learning safeguard:</b> colour questions vary only colour; shape questions vary only shape. This prevents unintended clues.</div></div>`,true);
  }
  function config(type){
    const p=prefs(type);draft={type,...clone(p),selected:[...(p.selected||defaults[type].selected)]};renderConfig();
  }
  function renderConfig(){
    const isColour=draft.type==='colours',all=isColour?COLOURS:SHAPES,presets=isColour?COLOUR_PRESETS:SHAPE_PRESETS;
    show(`<div class="identify-config"><button class="btn ghost" data-action="identifyLaunch">← Colours & Shapes</button><span class="eyebrow">${isColour?'COLOURS':'SHAPES'}</span><h1>Choose what to practise.</h1>
      <div class="identify-presets">${Object.entries(presets).map(([k,v])=>`<button data-identify-preset="${k}">${k[0].toUpperCase()+k.slice(1)}</button>`).join('')}</div>
      <div class="identify-token-grid ${isColour?'colour-tokens':'shape-tokens'}">${all.map(x=>`<button class="${draft.selected.includes(x.id)?'selected':''}" data-identify-token="${x.id}">${isColour?colourSwatch(x):shapeMini(x,'#5C72C7')}<b>${esc(x.label)}</b></button>`).join('')}</div>
      <div class="identify-setting-grid">
        <label>Choices<select id="identifyChoices"><option value="2" ${draft.choices==2?'selected':''}>2</option><option value="3" ${draft.choices==3?'selected':''}>3</option><option value="4" ${draft.choices==4?'selected':''}>4</option></select></label>
        <label>Session<select id="identifyLength"><option value="5" ${draft.sessionLength==='5'?'selected':''}>5</option><option value="10" ${draft.sessionLength==='10'?'selected':''}>10</option><option value="15" ${draft.sessionLength==='15'?'selected':''}>15</option><option value="continuous" ${draft.sessionLength==='continuous'?'selected':''}>Continuous</option></select></label>
        <label class="identify-check"><input id="identifyShowWord" type="checkbox" ${draft.showWord?'checked':''}> Show word</label>
        <label class="identify-check"><input id="identifyAutoSpeak" type="checkbox" ${draft.autoSpeak?'checked':''}> Auto-speak</label>
        <label class="identify-check"><input id="identifyCelebration" type="checkbox" ${draft.celebration?'checked':''}> Celebration</label>
      </div>
      ${isColour?'<div class="notice"><b>Colour accessibility:</b> colour practice relies on colour discrimination. If a child has a known colour-vision difference, use Shapes or choose highly distinct colours. WAPS does not diagnose colour vision.</div>':''}
      <div class="identify-config-summary"><b id="identifySelectedCount">${draft.selected.length} selected</b><span>Saved separately for ${esc(active()?.name||'this device')}.</span></div>
      <div class="actions"><button class="btn" data-action="identifyStart">Start / continue →</button><button class="btn secondary" data-action="identifyLearn">Learn first</button>${session(draft.type)?'<button class="btn ghost" data-action="identifyRestart">Restart saved set</button>':''}</div>
    </div>`,true);
  }
  function colourSwatch(c){return `<span class="colour-swatch" style="--stimulus:${c.value};--stimulus-outline:${c.outline||'transparent'}"></span>`}
  function shapeMini(s,colour){return `<svg class="shape-mini" viewBox="0 0 200 200" aria-hidden="true" style="--stimulus:${colour}">${s.svg}</svg>`}
  function toggleToken(id,button){
    const has=draft.selected.includes(id);draft.selected=has?draft.selected.filter(x=>x!==id):[...draft.selected,id];button?.classList.toggle('selected',!has);
    const out=$('#identifySelectedCount');if(out)out.textContent=draft.selected.length+' selected';
  }
  function preset(key){
    const src=draft.type==='colours'?COLOUR_PRESETS:SHAPE_PRESETS;if(!src[key])return;draft.selected=[...src[key]];renderConfig();
  }
  function readConfig(){
    draft.choices=Number($('#identifyChoices')?.value||3);draft.sessionLength=$('#identifyLength')?.value||'continuous';
    draft.showWord=!!$('#identifyShowWord')?.checked;draft.autoSpeak=!!$('#identifyAutoSpeak')?.checked;draft.celebration=!!$('#identifyCelebration')?.checked;
    draft.selected=[...new Set(draft.selected)];
  }
  async function start(){
    readConfig();if(draft.selected.length<2){toast('Choose at least two '+(draft.type==='colours'?'colours':'shapes')+'.');return}
    draft.choices=Math.max(2,Math.min(draft.choices,draft.selected.length,4));
    const pb=slot(state().prefs);pb[draft.type]=clone(draft);
    let s=session(draft.type),sig=configSignature(draft);
    if(!s||s.signature!==sig||!Array.isArray(s.queue)||s.cursor>=s.queue.length){
      const last=s?.lastTarget||null;s={type:draft.type,queue:makeRound(draft.selected,last),cursor:0,round:(s?.round||0)+1,lastTarget:last,positionCycle:0,questionCount:0,sessionCorrect:0,signature:sig,started:new Date().toISOString()};
      saveSession(draft.type,s);
    }
    await persist();if(modal.open)modal.close();renderQuestion(draft.type);
  }
  function buildQuestion(type){
    const p=prefs(type),s=session(type);if(!s||!s.queue?.length||s.cursor>=s.queue.length)return null;
    const target=s.queue[s.cursor],available=p.selected.filter(x=>x!==target),count=Math.max(2,Math.min(Number(p.choices)||3,p.selected.length,4));
    const distractors=shuffle(available).slice(0,count-1),choices=shuffle([target,...distractors]);
    // balanced target positions: rotate desired position, then swap target into it.
    const desired=s.positionCycle%count,current=choices.indexOf(target);[choices[current],choices[desired]]=[choices[desired],choices[current]];s.positionCycle=(s.positionCycle+1)%count;
    const commonShape=COLOUR_BASE_SHAPES[s.questionCount%COLOUR_BASE_SHAPES.length];
    const commonColour=SHAPE_BASE_COLOURS[s.questionCount%SHAPE_BASE_COLOURS.length];
    return {type,target,choices,commonShape,commonColour,attempts:0,firstTapAt:0,lastTapAt:0,cueUsed:false,locked:false,openedAt:Date.now()};
  }
  function renderQuestion(type){
    cleanup(false);document.body.classList.add('identify-active');const s=session(type),p=prefs(type);
    if(!s||s.cursor>=s.queue.length){roundComplete(type);return}
    runtime=buildQuestion(type);if(!runtime){roundComplete(type);return}
    const targetLabel=selectedLabel(type,runtime.target),isColour=type==='colours',total=s.queue.length;
    main.innerHTML=`<div class="identify-child-screen"><header class="identify-child-head"><button class="identify-back" data-action="identifyExit" aria-label="Exit activity">←</button><div><span>${isColour?'COLOURS':'SHAPES'}</span><b>${isColour?'Find '+targetLabel+'.':'Find the '+targetLabel+'.'}</b></div><div class="identify-count">${s.cursor+1} / ${total}</div></header>
      <section class="identify-task"><button class="identify-hear" data-action="identifyHear">🔊</button><h1>${isColour?'Find '+esc(targetLabel)+'.':'Find the '+esc(targetLabel)+'.'}</h1></section>
      <div class="identify-choice-grid count-${runtime.choices.length}" id="identifyChoices">${runtime.choices.map(id=>choiceHTML(type,id,p)).join('')}</div>
      <div id="identifyFeedback" class="identify-feedback" aria-live="polite">Look carefully and choose one.</div>
      <button class="identify-hear-bottom" data-action="identifyHear">🔊 Hear again</button>
    </div>`;
    persist().catch(()=>{});if(p.autoSpeak)setTimeout(()=>speakQuestion(),220);
  }
  function choiceHTML(type,id,p){
    const label=selectedLabel(type,id),isColour=type==='colours';
    return `<button class="identify-choice" data-identify-choice="${id}" aria-label="${esc(label)}">${isColour?renderColourStimulus(id,runtime.commonShape):renderShapeStimulus(id,runtime.commonColour)}${p.showWord?`<b>${esc(label)}</b>`:''}</button>`;
  }
  function renderColourStimulus(colourId,shapeId){
    const c=colourMap[colourId],s=shapeMap[shapeId];return `<svg class="identify-stimulus colour-stimulus" viewBox="0 0 200 200" style="--stimulus:${c.value};--stimulus-outline:${c.outline||'transparent'}" aria-hidden="true">${s.svg}</svg>`;
  }
  function renderShapeStimulus(shapeId,colourId){
    const c=colourMap[colourId],s=shapeMap[shapeId];return `<svg class="identify-stimulus shape-stimulus" viewBox="0 0 200 200" style="--stimulus:${c.value};--stimulus-outline:${c.outline||'transparent'}" aria-hidden="true">${s.svg}</svg>`;
  }
  function speak(text){
    if(!('speechSynthesis'in window)||typeof SpeechSynthesisUtterance==='undefined')return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.rate=.84;u.pitch=1.03;speechSynthesis.speak(u);
  }
  function speakQuestion(){
    if(!runtime)return;const label=selectedLabel(runtime.type,runtime.target);speak(runtime.type==='colours'?'Find '+label+'.':'Find the '+label+'.');
  }
  async function choose(button){
    if(!runtime||runtime.locked)return;const id=button.dataset.identifyChoice,now=performance.now();runtime.attempts++;if(!runtime.firstTapAt)runtime.firstTapAt=now;
    const tooRapid=runtime.lastTapAt&&now-runtime.lastTapAt<320;runtime.lastTapAt=now;
    if(id!==runtime.target){
      button.classList.add('try-again');setTimeout(()=>button.classList.remove('try-again'),420);
      const fb=$('#identifyFeedback');if(fb)fb.textContent='Try again.';
      if(runtime.attempts>=3){
        runtime.cueUsed=true;const right=$(`[data-identify-choice="${runtime.target}"]`);right?.classList.add('cue');setTimeout(()=>right?.classList.remove('cue'),850);
        if(fb)fb.textContent='Look for '+selectedLabel(runtime.type,runtime.target)+'.';
      }
      if(tooRapid&&fb)fb.textContent='Take your time. Look carefully.';
      return;
    }
    runtime.locked=true;$$('.identify-choice').forEach(x=>x.disabled=true);button.classList.add('correct');
    const p=prefs(runtime.type),s=session(runtime.type),label=selectedLabel(runtime.type,runtime.target),responseMs=Math.round(performance.now()-runtime.openedAt);
    const firstTry=runtime.attempts===1;
    state().history.push({id:crypto.randomUUID(),profile:profileKey(),at:new Date().toISOString(),type:runtime.type,target:runtime.target,correct:true,firstTry,attempts:runtime.attempts,cueUsed:runtime.cueUsed,round:s.round,responseMs});
    if(state().history.length>700)state().history=state().history.slice(-700);
    s.lastTarget=runtime.target;s.cursor++;s.questionCount++;s.sessionCorrect=(s.sessionCorrect||0)+1;
    await persist();
    const phrase=praise[Math.floor(Math.random()*praise.length)],fb=$('#identifyFeedback');if(fb)fb.textContent=phrase+' '+label+'!';
    speak(label+'!');
    if(p.celebration)celebrate?.(button);
    const finite=p.sessionLength!=='continuous'?Number(p.sessionLength):0;
    advanceTimer=setTimeout(()=>{
      if(finite&&s.sessionCorrect>=finite&&s.cursor<s.queue.length){sessionPause(runtime.type);return}
      if(s.cursor>=s.queue.length){roundComplete(runtime.type);return}
      renderQuestion(runtime.type);
    },900);
  }
  function sessionPause(type){
    stopTimers();document.body.classList.add('identify-active');const s=session(type),p=prefs(type),label=type==='colours'?'colours':'shapes';
    main.innerHTML=`<div class="identify-finish-screen"><div class="identify-finish-icon">✓</div><span class="eyebrow">SESSION COMPLETE</span><h1>Great work!</h1><p>You completed ${p.sessionLength} ${label} questions. Your place in this round is saved.</p><div class="actions"><button class="btn" data-action="identifyContinue">Continue another session</button><button class="btn ghost" data-action="identifyExit">Done for now</button></div></div>`;s.sessionCorrect=0;persist().catch(()=>{});
  }
  function roundComplete(type){
    stopTimers();document.body.classList.add('identify-active');const s=session(type),p=prefs(type),label=type==='colours'?'colours':'shapes';
    main.innerHTML=`<div class="identify-finish-screen"><div class="identify-finish-icon">★</div><span class="eyebrow">ROUND COMPLETE</span><h1>You finished this round!</h1><p>Every selected ${label.slice(0,-1)} was practised before repeating.</p><div class="actions"><button class="btn" data-action="identifyAgain">Practise again</button><button class="btn secondary" data-action="identifyChange">Change ${label}</button><button class="btn ghost" data-action="identifyExit">Done</button></div></div>`;
    if(p.celebration)celebrate?.(null);
  }
  async function again(){
    const type=runtime?.type||draft?.type||'colours',s=session(type),p=prefs(type),last=s?.lastTarget||null;
    if(!s)return config(type);s.queue=makeRound(p.selected,last);s.cursor=0;s.round=(s.round||1)+1;s.questionCount=0;s.sessionCorrect=0;await persist();renderQuestion(type);
  }
  async function continueSession(){
    const type=runtime?.type||draft?.type||'colours',s=session(type);if(s)s.sessionCorrect=0;await persist();renderQuestion(type);
  }
  async function restart(){
    const type=draft.type,s=session(type);if(!s){toast('No saved set to restart.');return}
    if(!confirm('Restart this '+type+' set from the beginning? Progress history will stay in Communication Story.'))return;
    const p=prefs(type);s.queue=makeRound(p.selected,s.lastTarget);s.cursor=0;s.round=(s.round||1)+1;s.questionCount=0;s.sessionCorrect=0;await persist();if(modal.open)modal.close();renderQuestion(type);
  }
  function learn(){
    readConfig();if(draft.selected.length<2){toast('Choose at least two items first.');return}
    const items=draft.selected.slice(0,Math.min(8,draft.selected.length)),isColour=draft.type==='colours';
    show(`<div class="identify-learn"><button class="btn ghost" data-identify-type="${draft.type}">← Back</button><span class="eyebrow">LEARN FIRST</span><h1>Look, tap and listen.</h1><div class="identify-learn-grid">${items.map(id=>`<button data-identify-learn="${id}">${isColour?renderColourStimulusForLearn(id):renderShapeStimulusForLearn(id)}<b>${esc(selectedLabel(draft.type,id))}</b></button>`).join('')}</div><button class="btn" data-action="identifyStart">Ready — start identifying →</button></div>`,true);
  }
  function renderColourStimulusForLearn(id){const c=colourMap[id],s=shapeMap.circle;return `<svg class="identify-stimulus" viewBox="0 0 200 200" style="--stimulus:${c.value};--stimulus-outline:${c.outline||'transparent'}">${s.svg}</svg>`}
  function renderShapeStimulusForLearn(id){const c=colourMap.blue,s=shapeMap[id];return `<svg class="identify-stimulus" viewBox="0 0 200 200" style="--stimulus:${c.value};--stimulus-outline:transparent">${s.svg}</svg>`}
  function learnSpeak(id){speak(selectedLabel(draft.type,id))}
  function cleanup(resetRuntime=true){
    stopTimers();document.body.classList.remove('identify-active');if('speechSynthesis'in window)speechSynthesis.cancel();if(resetRuntime)runtime=null;
  }
  function stopTimers(){clearTimeout(advanceTimer);advanceTimer=null}
  function exit(){cleanup();if(modal.open)modal.close();go('practice')}
  function progressHTML(){
    const h=state().history.filter(x=>x.profile===profileKey()),now=Date.now(),week=7*86400000,recent=h.filter(x=>now-new Date(x.at).getTime()<=week);
    if(!recent.length)return '';
    const c=recent.filter(x=>x.type==='colours'),s=recent.filter(x=>x.type==='shapes');
    const names=rows=>[...new Set(rows.map(x=>selectedLabel(x.type,x.target)))].filter(Boolean);
    const cn=names(c),sn=names(s);
    const insight=(rows,type)=>{
      const by={};for(const r of rows)(by[r.target]??=[]).push(r);
      for(const [id,rs] of Object.entries(by)){if(rs.length>=2&&rs.filter(x=>x.firstTry).length===rs.length)return `${selectedLabel(type,id)} was selected on the first try in ${rs.length} recent opportunities.`}
      for(const [id,rs] of Object.entries(by)){if(rs.some(x=>x.cueUsed))return `${selectedLabel(type,id)} needed extra visual support in a recent opportunity.`}
      return '';
    };
    return `<section class="identify-progress-card"><div class="identify-progress-icon">🎨🔷</div><div><span class="eyebrow">COLOURS & SHAPES</span>${cn.length?`<h3>Colours</h3><p>${esc(cn.join(', '))} practised this week.</p>`:''}${sn.length?`<h3>Shapes</h3><p>${esc(sn.join(', '))} practised this week.</p>`:''}${insight(c,'colours')?`<small>${esc(insight(c,'colours'))}</small>`:''}${insight(s,'shapes')?`<small>${esc(insight(s,'shapes'))}</small>`:''}<button class="btn ghost" data-action="identifyLaunch">Open Colours & Shapes</button></div></section>`;
  }
  async function handleClick(el){
    const typeBtn=el.closest('[data-identify-type]');if(typeBtn){config(typeBtn.dataset.identifyType);return true}
    const token=el.closest('[data-identify-token]');if(token){toggleToken(token.dataset.identifyToken,token);return true}
    const presetBtn=el.closest('[data-identify-preset]');if(presetBtn){preset(presetBtn.dataset.identifyPreset);return true}
    const answer=el.closest('[data-identify-choice]');if(answer){await choose(answer);return true}
    const learnBtn=el.closest('[data-identify-learn]');if(learnBtn){learnSpeak(learnBtn.dataset.identifyLearn);return true}
    const a=el.closest('[data-action]')?.dataset.action;if(!a||!a.startsWith('identify'))return false;
    if(a==='identifyLaunch'){launch();return true}
    if(a==='identifyStart'){await start();return true}
    if(a==='identifyLearn'){learn();return true}
    if(a==='identifyRestart'){await restart();return true}
    if(a==='identifyHear'){speakQuestion();return true}
    if(a==='identifyContinue'){await continueSession();return true}
    if(a==='identifyAgain'){await again();return true}
    if(a==='identifyChange'){cleanup();config(runtime?.type||draft?.type||'colours');return true}
    if(a==='identifyExit'){exit();return true}
    return false;
  }
  const validationErrors=validateConceptData();
  if(validationErrors.length)console.error('WAPS colour/shape validation',validationErrors);
  return {launch,handleClick,progressHTML,cleanup,validationErrors};
}
