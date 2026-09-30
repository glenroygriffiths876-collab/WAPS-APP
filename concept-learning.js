import {COLOURS,SHAPES,COLOUR_PRESETS,SHAPE_PRESETS,COLOUR_BASE_SHAPES,SHAPE_BASE_COLOURS,validateConceptLearningData} from './concept-data.js';

export function createConceptLearningFeature(ctx){
  const {getState,persist,active,show,toast,main,modal,go,esc,celebrate}=ctx;
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const clone=v=>JSON.parse(JSON.stringify(v));
  const colourMap=Object.fromEntries(COLOURS.map(x=>[x.id,x]));
  const shapeMap=Object.fromEntries(SHAPES.map(x=>[x.id,x]));
  const PRAISE=['Great job!','You found it!','Yes!','Nice looking!','Well done!'];
  const DEFAULTS={
    colours:{type:'colours',selected:[...COLOUR_PRESETS.early],choices:3,showWord:true,autoSpeak:true,celebration:true,sessionLength:'round'},
    shapes:{type:'shapes',selected:[...SHAPE_PRESETS.early],choices:3,showWord:true,autoSpeak:true,celebration:true,sessionLength:'round'}
  };
  let draft=null,runtime=null,advanceTimer=null;

  function state(){
    const S=getState();
    if(!S.conceptLearning||typeof S.conceptLearning!=='object')S.conceptLearning={prefs:{},sessions:{},history:[]};
    S.conceptLearning.prefs=S.conceptLearning.prefs||{};
    S.conceptLearning.sessions=S.conceptLearning.sessions||{};
    S.conceptLearning.history=Array.isArray(S.conceptLearning.history)?S.conceptLearning.history:[];
    return S.conceptLearning;
  }
  const profileKey=()=>getState().active||'global';
  function bucket(obj,key){if(!obj[key])obj[key]={};return obj[key]}
  function prefs(type){
    const b=bucket(state().prefs,profileKey());
    if(!b[type])b[type]=clone(DEFAULTS[type]);
    return b[type];
  }
  function session(type){return bucket(state().sessions,profileKey())[type]||null}
  function setSession(type,value){bucket(state().sessions,profileKey())[type]=value}
  function unique(a){return [...new Set(a)]}
  function shuffled(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
  function stopAudio(){clearTimeout(advanceTimer);advanceTimer=null;if('speechSynthesis'in window)speechSynthesis.cancel()}
  function cleanup(){stopAudio();document.body.classList.remove('concept-id-active')}
  function labels(type){return type==='colours'?colourMap:shapeMap}
  function typeTitle(type){return type==='colours'?'Colours':'Shapes'}
  function typeIcon(type){return type==='colours'?'🎨':'🔷'}
  function itemLabel(type,id){return labels(type)[id]?.label||id}
  function sessionGoal(p){return p.sessionLength==='continuous'?Infinity:p.sessionLength==='round'?p.selected.length:Number(p.sessionLength||10)}
  function signature(p){return JSON.stringify([p.selected,p.choices,p.showWord,p.autoSpeak,p.celebration,p.sessionLength])}

  function launch(){
    cleanup();
    const cs=session('colours'),ss=session('shapes');
    show(`<div class="cs-launch"><span class="eyebrow">WAPS COLOURS & SHAPES</span><h1>What would you like to identify?</h1><p>Simple visual choices. One concept changes to the next after every correct answer.</p>
      <div class="cs-type-grid">
        <button data-cs-type="colours"><span>🎨</span><b>Colours</b><small>Same shape, different colours${cs&&cs.current?' · Continue saved question':''}</small></button>
        <button data-cs-type="shapes"><span>🔷</span><b>Shapes</b><small>Same colour, different shapes${ss&&ss.current?' · Continue saved question':''}</small></button>
      </div>
      <div class="notice"><b>Learning safeguard:</b> colour questions change only colour. Shape questions change only shape, so the child cannot solve the task using the wrong clue.</div>
    </div>`,true);
  }

  function config(type){
    const p=prefs(type);draft={...clone(p),type,selected:[...(p.selected||DEFAULTS[type].selected)]};renderConfig();
  }
  function renderConfig(){
    const isColour=draft.type==='colours',all=isColour?COLOURS:SHAPES,presets=isColour?COLOUR_PRESETS:SHAPE_PRESETS;
    show(`<div class="cs-config"><button class="btn ghost" data-action="csLaunch">← Colours & Shapes</button><span class="eyebrow">${typeIcon(draft.type)} ${typeTitle(draft.type).toUpperCase()}</span><h1>Choose what to practise.</h1>
      <div class="cs-presets">${Object.entries(presets).map(([id,list])=>`<button data-cs-preset="${id}">${id[0].toUpperCase()+id.slice(1)} · ${list.length}</button>`).join('')}</div>
      <div class="cs-token-grid ${isColour?'colours':'shapes'}">${all.map(x=>`<button class="${draft.selected.includes(x.id)?'selected':''}" data-cs-token="${x.id}">${isColour?`<span class="cs-mini-colour" style="background:${x.value};${x.outline?`border-color:${x.outline}`:''}"></span>`:`<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="#1E88E5">${x.svg}</g></svg>`}<b>${esc(x.label)}</b></button>`).join('')}</div>
      <div class="cs-settings-grid">
        <label>Choices<select id="csChoices"><option value="2" ${draft.choices==2?'selected':''}>2</option><option value="3" ${draft.choices==3?'selected':''}>3</option><option value="4" ${draft.choices==4?'selected':''}>4</option></select></label>
        <label>Session<select id="csSessionLength"><option value="round" ${draft.sessionLength==='round'?'selected':''}>One round</option><option value="5" ${String(draft.sessionLength)==='5'?'selected':''}>5 questions</option><option value="10" ${String(draft.sessionLength)==='10'?'selected':''}>10 questions</option><option value="15" ${String(draft.sessionLength)==='15'?'selected':''}>15 questions</option><option value="continuous" ${draft.sessionLength==='continuous'?'selected':''}>Continuous</option></select></label>
        <label class="cs-toggle"><input id="csShowWord" type="checkbox" ${draft.showWord?'checked':''}><span>Show word</span></label>
        <label class="cs-toggle"><input id="csAutoSpeak" type="checkbox" ${draft.autoSpeak?'checked':''}><span>Auto-speak</span></label>
        <label class="cs-toggle"><input id="csCelebration" type="checkbox" ${draft.celebration?'checked':''}><span>Celebration</span></label>
      </div>
      <div class="cs-selection-summary"><b id="csSelectedCount">${draft.selected.length} selected</b><span>Choose at least 2. WAPS remembers the set separately for each child.</span></div>
      ${isColour?'<div class="notice"><b>Colour accessibility:</b> this activity relies on colour discrimination. If a child has a known colour-vision difference, adapt the selected colours or use Shapes. WAPS does not diagnose colour vision.</div>':''}
      <div class="actions"><button class="btn" data-action="csStart">Start / continue →</button>${session(draft.type)?'<button class="btn ghost" data-action="csRestartSet">Restart saved set</button>':''}</div>
    </div>`,true);
  }
  function applyPreset(id){
    const sets=draft.type==='colours'?COLOUR_PRESETS:SHAPE_PRESETS;
    if(sets[id])draft.selected=[...sets[id]];renderConfig();
  }
  function toggleToken(id,btn){
    const has=draft.selected.includes(id);draft.selected=has?draft.selected.filter(x=>x!==id):[...draft.selected,id];
    btn?.classList.toggle('selected',!has);const o=$('#csSelectedCount');if(o)o.textContent=draft.selected.length+' selected';
  }
  function readConfig(){
    draft.choices=Number($('#csChoices')?.value||3);
    draft.sessionLength=$('#csSessionLength')?.value||'round';
    draft.showWord=!!$('#csShowWord')?.checked;
    draft.autoSpeak=!!$('#csAutoSpeak')?.checked;
    draft.celebration=!!$('#csCelebration')?.checked;
    draft.selected=unique(draft.selected);
  }
  function positionFor(s,n){
    s.positionCounts=s.positionCounts||{};
    s.positionCounts[n]=Array.isArray(s.positionCounts[n])?s.positionCounts[n]:Array(n).fill(0);
    const counts=s.positionCounts[n],min=Math.min(...counts);
    let candidates=counts.map((v,i)=>v===min?i:-1).filter(i=>i>=0);
    if(candidates.length>1&&s.lastCorrectPosition!=null)candidates=candidates.filter(i=>i!==s.lastCorrectPosition).length?candidates.filter(i=>i!==s.lastCorrectPosition):candidates;
    return candidates[Math.floor(Math.random()*candidates.length)];
  }
  function nextPresentation(type,s){
    const pool=type==='colours'?COLOUR_BASE_SHAPES:SHAPE_BASE_COLOURS;
    let options=pool.filter(x=>x!==s.lastPresentation);if(!options.length)options=[...pool];
    const pick=options[(s.completed+s.round)%options.length];s.lastPresentation=pick;return pick;
  }
  function refill(s,p){
    let deck=shuffled(p.selected);
    if(deck.length>1&&deck[0]===s.lastTarget){const j=deck.findIndex(x=>x!==s.lastTarget);[deck[0],deck[j]]=[deck[j],deck[0]]}
    s.remaining=deck;s.round=(s.round||0)+1;
  }
  function auditQuestion(q){
    const errors=[];
    if(!q.options.includes(q.target))errors.push('target missing');
    if(new Set(q.options).size!==q.options.length)errors.push('duplicate options');
    if(q.type==='colours'){
      if(!shapeMap[q.presentation])errors.push('missing common shape');
      if(q.options.some(id=>!colourMap[id]))errors.push('unknown colour option');
    }else{
      if(!colourMap[q.presentation])errors.push('missing common colour');
      if(q.options.some(id=>!shapeMap[id]))errors.push('unknown shape option');
    }
    return errors;
  }
  function ensureQuestion(type){
    const p=prefs(type),s=session(type);if(!s)return null;
    if(s.current)return s.current;
    const goal=sessionGoal(p);if(Number.isFinite(goal)&&s.completed>=goal)return null;
    if(!Array.isArray(s.remaining)||!s.remaining.length)refill(s,p);
    const target=s.remaining.shift(),n=Math.max(2,Math.min(Number(p.choices)||3,p.selected.length));
    const distractors=shuffled(p.selected.filter(x=>x!==target)).slice(0,n-1),pos=positionFor(s,n),options=[...distractors];options.splice(pos,0,target);
    const q={type,target,options,correctPosition:pos,presentation:nextPresentation(type,s),attempts:0,distinctWrong:[],rapidGuess:false,cued:false,startedAt:Date.now(),lastTapAt:0,lastTapId:null,round:s.round};
    const qa=auditQuestion(q);if(qa.length)console.error('WAPS Colours & Shapes question audit failed',qa,q);
    s.current=q;persist().catch(()=>{});return q;
  }
  async function start(){
    readConfig();
    if(draft.selected.length<2){toast('Choose at least 2 '+(draft.type==='colours'?'colours':'shapes')+'.');return}
    draft.choices=Math.min(draft.choices,draft.selected.length);
    const b=bucket(state().prefs,profileKey());b[draft.type]=clone(draft);
    const sig=signature(draft),old=session(draft.type);
    let s=old;
    if(!s||s.signature!==sig||s.finished){
      s={type:draft.type,signature:sig,remaining:[],current:null,completed:0,round:0,lastTarget:null,lastPresentation:null,lastCorrectPosition:null,positionCounts:{},started:new Date().toISOString(),finished:false};
      setSession(draft.type,s);
    }
    await persist();if(modal.open)modal.close();renderQuestion(draft.type);
  }
  async function restart(type){
    if(!confirm('Restart this '+typeTitle(type)+' set from the beginning? Your Progress history will stay saved.'))return;
    const p=prefs(type);setSession(type,{type,signature:signature(p),remaining:[],current:null,completed:0,round:0,lastTarget:null,lastPresentation:null,lastCorrectPosition:null,positionCounts:{},started:new Date().toISOString(),finished:false});
    await persist();if(modal.open)modal.close();renderQuestion(type);
  }

  function shapeSvg(shapeId,fill,outline){
    const sh=shapeMap[shapeId];if(!sh)return '';
    const stroke=outline||'#5F6970',opacity=outline?1:.18;
    return `<svg class="cs-stimulus-svg" viewBox="0 0 100 100" aria-hidden="true"><g fill="${fill}" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="2.4" stroke-linejoin="round">${sh.svg}</g></svg>`;
  }
  function optionVisual(q,id){
    if(q.type==='colours'){const colour=colourMap[id];return shapeSvg(q.presentation,colour.value,colour.outline||null)}
    const colour=colourMap[q.presentation];return shapeSvg(id,colour.value,colour.outline||null);
  }
  function progressLabel(type,s,p){
    const goal=sessionGoal(p);
    return Number.isFinite(goal)?`${Math.min(s.completed+1,goal)} / ${goal}`:`Round ${s.round||1}`;
  }
  function promptText(q){
    return q.type==='colours'?`Find ${itemLabel(q.type,q.target).toUpperCase()}.`:`Find the ${itemLabel(q.type,q.target).toUpperCase()}.`;
  }
  function renderQuestion(type){
    stopAudio();document.body.classList.add('concept-id-active');
    const p=prefs(type),s=session(type);if(!s){config(type);return}
    const goal=sessionGoal(p);if((Number.isFinite(goal)&&s.completed>=goal)||s.finished){finish(type);return}
    const q=ensureQuestion(type);if(!q){finish(type);return}
    runtime={type,locked:false};
    main.innerHTML=`<div class="cs-child-screen">
      <header class="cs-child-head"><button class="cs-caregiver-back" data-action="csExit" aria-label="Exit activity">←</button><div><span>${typeIcon(type)} ${typeTitle(type).toUpperCase()}</span><b>${type==='colours'?'Find the colour':'Find the shape'}</b></div><div class="cs-count">${progressLabel(type,s,p)}</div></header>
      <section class="cs-prompt-card"><button data-action="csHear" aria-label="Hear question">🔊</button><h1>${esc(promptText(q))}</h1></section>
      <section class="cs-answer-grid choices-${q.options.length}" id="csAnswerGrid">${q.options.map((id,i)=>`<button class="cs-answer" data-cs-answer="${id}" aria-label="${esc(itemLabel(type,id))}">${optionVisual(q,id)}${p.showWord?`<b>${esc(itemLabel(type,id))}</b>`:''}</button>`).join('')}</section>
      <footer class="cs-child-footer"><div id="csStatus" class="cs-status">Look carefully, then choose.</div><button data-action="csHear">🔊 Hear again</button></footer>
    </div>`;
    if(p.autoSpeak)setTimeout(()=>speakQuestion(q),220);
  }
  function speak(text){
    if(!('speechSynthesis'in window)||typeof SpeechSynthesisUtterance==='undefined')return;
    speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.rate=.86;u.pitch=1.02;speechSynthesis.speak(u);
  }
  function speakQuestion(q){speak(q.type==='colours'?`Find ${itemLabel(q.type,q.target)}`:`Find the ${itemLabel(q.type,q.target)}`)}
  function praiseText(q){
    const lead=PRAISE[(session(q.type)?.completed||0)%PRAISE.length];
    return q.type==='colours'?`${lead} ${itemLabel(q.type,q.target).toUpperCase()}!`:`${lead} ${itemLabel(q.type,q.target).toUpperCase()}!`;
  }
  async function answer(id,btn){
    const type=runtime?.type,s=session(type),p=prefs(type),q=s?.current;if(!q||runtime.locked)return;
    const now=Date.now();
    if(q.lastTapId===id&&now-q.lastTapAt<260)return;
    if(q.lastTapAt&&now-q.lastTapAt<430&&q.lastTapId!==id)q.rapidGuess=true;
    q.lastTapAt=now;q.lastTapId=id;q.attempts++;
    if(id!==q.target){
      if(!q.distinctWrong.includes(id))q.distinctWrong.push(id);
      btn.classList.add('try-again');setTimeout(()=>btn.classList.remove('try-again'),360);
      const out=$('#csStatus');if(out)out.textContent='Try again.';
      if(q.attempts>=3&&!q.cued){
        q.cued=true;const correct=$(`[data-cs-answer="${q.target}"]`);correct?.classList.add('support-cue');
        if(out)out.textContent=`Look for ${itemLabel(type,q.target)}.`;
        speak(type==='colours'?`Look for ${itemLabel(type,q.target)}`:`Look for the ${itemLabel(type,q.target)}`);
      }
      await persist();return;
    }
    runtime.locked=true;$$('.cs-answer').forEach(x=>x.disabled=true);btn.classList.add('correct');
    const firstTry=q.attempts===1&&!q.rapidGuess,record={
      id:crypto.randomUUID(),profile:profileKey(),at:new Date().toISOString(),type,target:q.target,attempts:q.attempts,firstTry,rapidGuess:q.rapidGuess,cued:q.cued,round:q.round,responseMs:Math.max(0,Date.now()-q.startedAt)
    };
    state().history.push(record);if(state().history.length>700)state().history=state().history.slice(-700);
    s.completed++;s.lastTarget=q.target;s.lastCorrectPosition=q.correctPosition;s.positionCounts[q.options.length][q.correctPosition]++;s.current=null;
    const goal=sessionGoal(p);if(Number.isFinite(goal)&&s.completed>=goal)s.finished=true;
    await persist();
    const out=$('#csStatus');if(out)out.textContent=praiseText(q);
    speak(q.type==='colours'?`Yes. ${itemLabel(type,q.target)}!`:`Yes. ${itemLabel(type,q.target)}!`);
    if(p.celebration)celebrate?.(btn);
    advanceTimer=setTimeout(()=>{advanceTimer=null;s.finished?finish(type):renderQuestion(type)},950);
  }
  function finish(type){
    stopAudio();document.body.classList.add('concept-id-active');const s=session(type),p=prefs(type);if(s)s.finished=true;persist().catch(()=>{});
    main.innerHTML=`<div class="cs-finish-screen"><div class="cs-finish-icon">${typeIcon(type)}</div><span class="eyebrow">SESSION COMPLETE</span><h1>You finished!</h1><p>${s?.completed||0} ${typeTitle(type).toLowerCase()} question${s?.completed===1?'':'s'} completed.</p><div class="cs-finish-actions"><button class="btn" data-action="csAgain" data-cs-type="${type}">Practise again</button><button class="btn secondary" data-action="csChooseNew" data-cs-type="${type}">Change ${typeTitle(type).toLowerCase()}</button><button class="btn ghost" data-action="csExit">Done</button></div></div>`;
  }
  async function again(type){
    const p=prefs(type);setSession(type,{type,signature:signature(p),remaining:[],current:null,completed:0,round:0,lastTarget:session(type)?.lastTarget||null,lastPresentation:null,lastCorrectPosition:null,positionCounts:{},started:new Date().toISOString(),finished:false});
    await persist();renderQuestion(type);
  }
  function exit(){cleanup();if(modal.open)modal.close();go('practice')}

  function progressHTML(){
    const h=state().history.filter(x=>x.profile===profileKey()),week=7*86400000,now=Date.now(),recent=h.filter(x=>now-new Date(x.at).getTime()<=week);
    if(!recent.length)return '';
    const colourRows=recent.filter(x=>x.type==='colours'),shapeRows=recent.filter(x=>x.type==='shapes');
    const summary=(rows,type)=>{
      if(!rows.length)return '';
      const ids=unique(rows.map(x=>x.target)),first=rows.filter(x=>x.firstTry).length;
      return `<div><span>${typeIcon(type)}</span><b>${typeTitle(type)}</b><p>${ids.map(id=>esc(itemLabel(type,id))).join(', ')} practised this week.</p><small>${first} of ${rows.length} recorded responses were correct on the first try.</small></div>`;
    };
    return `<section class="cs-progress-card"><span class="eyebrow">COLOURS & SHAPES</span><h2>Recent identification practice</h2><div class="cs-progress-grid">${summary(colourRows,'colours')}${summary(shapeRows,'shapes')}</div><button class="btn ghost" data-action="csLaunch">Open Colours & Shapes</button></section>`;
  }

  async function handleClick(el){
    const typeBtn=el.closest('[data-cs-type]');
    if(typeBtn&&!el.closest('[data-action="csAgain"],[data-action="csChooseNew"]')){config(typeBtn.dataset.csType);return true}
    const preset=el.closest('[data-cs-preset]');if(preset){applyPreset(preset.dataset.csPreset);return true}
    const token=el.closest('[data-cs-token]');if(token){toggleToken(token.dataset.csToken,token);return true}
    const ans=el.closest('[data-cs-answer]');if(ans){await answer(ans.dataset.csAnswer,ans);return true}
    const a=el.closest('[data-action]')?.dataset.action;if(!a||!a.startsWith('cs'))return false;
    if(a==='csLaunch'){launch();return true}
    if(a==='csStart'){await start();return true}
    if(a==='csRestartSet'){await restart(draft?.type||'colours');return true}
    if(a==='csHear'){const s=session(runtime?.type),q=s?.current;if(q)speakQuestion(q);return true}
    if(a==='csAgain'){await again(el.closest('[data-cs-type]')?.dataset.csType||runtime?.type||'colours');return true}
    if(a==='csChooseNew'){cleanup();config(el.closest('[data-cs-type]')?.dataset.csType||runtime?.type||'colours');return true}
    if(a==='csExit'){exit();return true}
    return false;
  }

  const validationErrors=validateConceptLearningData();
  if(validationErrors.length)console.error('WAPS Colours & Shapes data validation',validationErrors);
  return {launch,handleClick,progressHTML,cleanup,validationErrors};
}
