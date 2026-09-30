import {MU_SPECIAL_VISUALS,muSpecialVisualHTML,MU_FIND_POOL,MU_MATCH_TASKS,MU_SORT_FAMILIES,MU_GROUP_TASKS,MU_MODE_LABELS} from './comprehension-data.js';

export function createComprehensionLearningFeature(ctx){
  const {getState,persist,show,toast,main,modal,go,esc,celebrate,visualHTML}=ctx;
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const DEFAULTS={fieldSize:3,sessionLength:5,hearPrompts:true};
  let runtime=null,advanceTimer=null;

  function clone(v){return JSON.parse(JSON.stringify(v))}
  function shuffled(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
  function state(){
    const S=getState();
    if(!S.comprehensionLearning||typeof S.comprehensionLearning!=='object')S.comprehensionLearning={prefs:{},sessions:{},history:[]};
    S.comprehensionLearning.prefs=S.comprehensionLearning.prefs||{};
    S.comprehensionLearning.sessions=S.comprehensionLearning.sessions||{};
    S.comprehensionLearning.history=Array.isArray(S.comprehensionLearning.history)?S.comprehensionLearning.history:[];
    return S.comprehensionLearning;
  }
  const profileKey=()=>getState().active||'global';
  function prefs(){
    const t=state(),k=profileKey();
    if(!t.prefs[k])t.prefs[k]=clone(DEFAULTS);
    const p=t.prefs[k];p.fieldSize=Math.max(3,Math.min(5,Number(p.fieldSize)||3));
    if(!['continuous',5,10,15,'5','10','15'].includes(p.sessionLength))p.sessionLength=5;
    if(typeof p.hearPrompts!=='boolean')p.hearPrompts=true;
    return p;
  }
  function session(mode){const t=state(),k=profileKey();t.sessions[k]=t.sessions[k]||{};return t.sessions[k][mode]||null}
  function setSession(mode,v){const t=state(),k=profileKey();t.sessions[k]=t.sessions[k]||{};t.sessions[k][mode]=v}
  function goal(){const v=prefs().sessionLength;return String(v)==='continuous'?Infinity:Number(v||5)}
  function signature(){const p=prefs();return JSON.stringify([p.fieldSize,String(p.sessionLength),!!p.hearPrompts])}
  function cleanup(){clearTimeout(advanceTimer);advanceTimer=null;runtime=null;document.body.classList.remove('mu-active');if('speechSynthesis'in window)speechSynthesis.cancel()}
  function speak(text,force=false){if(!force&&!prefs().hearPrompts)return;if(!('speechSynthesis'in window)||typeof SpeechSynthesisUtterance==='undefined')return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(String(text));u.rate=.88;u.pitch=1.02;speechSynthesis.speak(u)}
  function labelFor(id){
    if(MU_SPECIAL_VISUALS[id])return MU_SPECIAL_VISUALS[id].label;
    const aliases={'green-dotted-ball':'Green ball with dots','brown-dog':'Brown dog','brown-horse':'Brown horse'};
    if(aliases[id])return aliases[id];
    const c=ctx.concept?.[id];return c?.label||String(id).replaceAll('-',' ');
  }
  function itemVisual(id,cls=''){
    if(MU_SPECIAL_VISUALS[id]||id==='snack')return muSpecialVisualHTML(id,cls);
    return visualHTML(id,cls);
  }
  function shapeHTML(shape){
    return '<span class="mu-shape '+shape+'" aria-hidden="true"></span><b>'+esc(shape[0].toUpperCase()+shape.slice(1))+'</b>';
  }
  function clearSessionTimers(){clearTimeout(advanceTimer);advanceTimer=null}
  function modeIcon(mode){return ({find:'◎',match:'↔',sort:'⇄',group:'✓',rules:'○×'})[mode]||'◎'}

  function launch(){
    cleanup();const p=prefs();
    show('<div class="mu-launch"><span class="eyebrow">MATCH & UNDERSTAND</span><h1>Choose an activity.</h1><p>Look, match and sort pictures together.</p><div class="mu-mode-grid">'+Object.keys(MU_MODE_LABELS).map(mode=>{
      const s=session(mode),sub=mode==='find'?'Choose the picture':mode==='match'?'See what goes together':mode==='sort'?'Put things in groups':mode==='group'?'Find all that belong':'Follow two picture rules';
      return '<button data-mu-mode="'+mode+'"><span class="mu-mode-icon '+mode+'">'+modeIcon(mode)+'</span><b>'+MU_MODE_LABELS[mode]+'</b><small>'+(s&&s.current&&!s.finished?'Continue':sub)+'</small></button>';
    }).join('')+'</div><button class="mu-change" data-action="muSettings">Change · '+p.fieldSize+' pictures · '+(String(p.sessionLength)==='continuous'?'Continuous':p.sessionLength+' questions')+'</button></div>',true);
  }

  function settings(){
    cleanup();const p=prefs();
    show('<div class="mu-settings"><button class="btn ghost" data-action="muLaunch">← Match & Understand</button><span class="eyebrow">MATCH & UNDERSTAND</span><h1>Change practice.</h1><div class="mu-setting-block"><b>Pictures shown</b><p>Start with 3. Use 4 or 5 when the child is ready for a larger choice field.</p><div class="mu-setting-pills">'+[3,4,5].map(v=>'<label><input type="radio" name="muField" value="'+v+'" '+(p.fieldSize===v?'checked':'')+'><span>'+v+'</span></label>').join('')+'</div></div><div class="mu-setting-block"><b>Questions</b><div class="mu-setting-pills">'+[5,10,15,'continuous'].map(v=>'<label><input type="radio" name="muSession" value="'+v+'" '+(String(p.sessionLength)===String(v)?'checked':'')+'><span>'+(v==='continuous'?'Continuous':v)+'</span></label>').join('')+'</div></div><label class="mu-hear-toggle"><input id="muHearPrompts" type="checkbox" '+(p.hearPrompts?'checked':'')+'><span><b>Hear prompts</b><small>Read the activity instruction aloud.</small></span></label><button class="btn" data-action="muSaveSettings">Save</button></div>',true);
  }
  async function saveSettings(){
    const p=prefs();p.fieldSize=Math.max(3,Math.min(5,Number($('input[name="muField"]:checked')?.value)||3));
    const sl=$('input[name="muSession"]:checked')?.value||'5';p.sessionLength=sl==='continuous'?'continuous':Number(sl);p.hearPrompts=!!$('#muHearPrompts')?.checked;
    await persist();launch();toast('Match & Understand updated');
  }

  function deckFor(mode){
    if(mode==='find')return shuffled(MU_FIND_POOL);
    if(mode==='match')return shuffled(MU_MATCH_TASKS.map(x=>x.id));
    if(mode==='sort')return shuffled(MU_SORT_FAMILIES.map(x=>x.id));
    if(mode==='group')return shuffled(MU_GROUP_TASKS.map(x=>x.id));
    return shuffled(['rules-a','rules-b','rules-c','rules-d','rules-e']);
  }
  function refill(s,mode){s.remaining=deckFor(mode);if(s.lastTask&&s.remaining.length>1&&s.remaining[0]===s.lastTask){const x=s.remaining.shift();s.remaining.push(x)}}
  function ensureBoth(items){
    const left=items.filter(x=>x[1]==='left'),right=items.filter(x=>x[1]==='right'),p=prefs(),n=p.fieldSize;
    const out=[];if(left.length)out.push(shuffled(left)[0]);if(right.length)out.push(shuffled(right)[0]);
    const used=new Set(out.map(x=>x[0])),rest=shuffled(items.filter(x=>!used.has(x[0])));
    while(out.length<n&&rest.length)out.push(rest.shift());return shuffled(out);
  }
  function buildQuestion(mode,key){
    const n=prefs().fieldSize;
    if(mode==='find'){
      const target=key,pool=shuffled(MU_FIND_POOL.filter(x=>x!==target)).slice(0,n-1);
      return {mode,key,target,choices:shuffled([target,...pool]),prompt:'Find the '+labelFor(target).toLowerCase()+'.',attempts:0,cued:false,startedAt:Date.now()};
    }
    if(mode==='match'){
      const t=MU_MATCH_TASKS.find(x=>x.id===key)||MU_MATCH_TASKS[0];
      return {mode,key,stimulus:t.stimulus,answer:t.answer,choices:shuffled(['circle','diamond']),prompt:t.prompt,attempts:0,cued:false,startedAt:Date.now()};
    }
    if(mode==='sort'){
      const f=MU_SORT_FAMILIES.find(x=>x.id===key)||MU_SORT_FAMILIES[0],items=ensureBoth(f.items);
      return {mode,key,family:f.id,title:f.title,left:f.left,right:f.right,items,index:0,prompt:'Where does this go?',attempts:0,cued:false,startedAt:Date.now()};
    }
    if(mode==='group'){
      const t=MU_GROUP_TASKS.find(x=>x.id===key)||MU_GROUP_TASKS[0],correct=shuffled(t.correct).slice(0,Math.min(t.correct.length,Math.max(2,n-1))),need=Math.max(0,n-correct.length),distractors=shuffled(t.distractors).slice(0,need);
      return {mode,key,correct,choices:shuffled([...correct,...distractors]),selected:[],prompt:t.prompt,attempts:0,cued:false,startedAt:Date.now()};
    }
    const apples=Math.max(1,Math.ceil(n/2)),kites=n-apples,items=shuffled([...Array(apples).fill('apple'),...Array(kites).fill('kite')]);
    return {mode,key,items,phase:'apple',marked:{},prompt:'Find all the apples.',attempts:0,cued:false,startedAt:Date.now()};
  }
  function ensureQuestion(mode){
    const s=session(mode);if(!s)return null;if(s.current)return s.current;
    const g=goal();if(Number.isFinite(g)&&s.completed>=g)return null;
    if(!s.remaining?.length)refill(s,mode);const key=s.remaining.shift();s.current=buildQuestion(mode,key);persist().catch(()=>{});return s.current;
  }
  async function start(mode){
    const sig=signature();let s=session(mode);
    if(!s||s.signature!==sig||s.finished){s={mode,signature:sig,remaining:[],current:null,completed:0,lastTask:null,finished:false,started:new Date().toISOString()};setSession(mode,s)}
    await persist();if(modal.open)modal.close();renderQuestion(mode);
  }
  function progressText(s){const g=goal();return Number.isFinite(g)?Math.min(s.completed+1,g)+' / '+g:'Keep going'}
  function findHTML(q){return '<div class="mu-choice-grid field-'+q.choices.length+'">'+q.choices.map(id=>'<button class="mu-picture-choice" data-mu-choice="'+id+'" aria-label="'+esc(labelFor(id))+'">'+itemVisual(id,'mu-choice-photo')+'</button>').join('')+'</div>'}
  function matchHTML(q){return '<div class="mu-match-stimulus">'+itemVisual(q.stimulus,'mu-match-photo')+'</div><div class="mu-shape-grid">'+q.choices.map(shape=>'<button data-mu-shape="'+shape+'">'+shapeHTML(shape)+'</button>').join('')+'</div>'}
  function sortHTML(q){
    const item=q.items[q.index];return '<div class="mu-sort-wrap"><div class="mu-sort-counter">'+(q.index+1)+' of '+q.items.length+'</div><div class="mu-sort-item">'+itemVisual(item[0],'mu-sort-photo')+'</div><div class="mu-sort-bins"><button data-mu-sort="left"><b>'+esc(q.left)+'</b></button><button data-mu-sort="right"><b>'+esc(q.right)+'</b></button></div></div>';
  }
  function groupHTML(q){return '<div class="mu-choice-grid field-'+q.choices.length+'">'+q.choices.map(id=>'<button class="mu-picture-choice '+(q.selected.includes(id)?'selected':'')+'" data-mu-group="'+id+'" aria-label="'+esc(labelFor(id))+'">'+itemVisual(id,'mu-choice-photo')+(q.selected.includes(id)?'<span class="mu-mark good">✓</span>':'')+'</button>').join('')+'</div>'}
  function rulesHTML(q){return '<div class="mu-rule-legend"><span><i class="circle-mark">○</i> Apple</span><span><i class="x-mark">×</i> Kite</span></div><div class="mu-choice-grid field-'+q.items.length+'">'+q.items.map((id,i)=>'<button class="mu-picture-choice '+(q.marked[i]?'selected':'')+'" data-mu-rule="'+i+'" aria-label="'+esc(labelFor(id))+'">'+itemVisual(id,'mu-choice-photo')+(q.marked[i]?'<span class="mu-mark '+q.marked[i]+'">'+(q.marked[i]==='circle'?'○':'×')+'</span>':'')+'</button>').join('')+'</div>'}
  function bodyHTML(q){return q.mode==='find'?findHTML(q):q.mode==='match'?matchHTML(q):q.mode==='sort'?sortHTML(q):q.mode==='group'?groupHTML(q):rulesHTML(q)}

  function renderQuestion(mode){
    clearSessionTimers();if('speechSynthesis'in window)speechSynthesis.cancel();document.body.classList.add('mu-active');
    const s=session(mode);if(!s){launch();return}const g=goal();if((Number.isFinite(g)&&s.completed>=g)||s.finished){finish(mode);return}
    const q=ensureQuestion(mode);if(!q){finish(mode);return}runtime={mode,locked:false};
    main.innerHTML='<div class="mu-child-screen" data-mu-mode-active="'+mode+'" data-mu-field="'+prefs().fieldSize+'"><header class="mu-child-head"><button data-action="muExit" aria-label="Leave activity">←</button><div><span>MATCH & UNDERSTAND</span><b>'+MU_MODE_LABELS[mode]+'</b></div><strong>'+progressText(s)+'</strong></header><section class="mu-prompt"><button data-action="muHear" aria-label="Hear instruction">🔊</button><h1>'+esc(q.prompt)+'</h1></section><section class="mu-work">'+bodyHTML(q)+'</section><footer class="mu-footer"><div id="muStatus" aria-live="polite">Look carefully.</div><button data-action="muHear">🔊 Hear</button></footer></div>';
    persist().catch(()=>{});if(prefs().hearPrompts)setTimeout(()=>speak(q.prompt),180);
  }
  function cue(ids=[]){runtime&& (runtime.cued=true);ids.forEach(id=>$$('[data-mu-choice="'+CSS.escape(id)+'"],[data-mu-group="'+CSS.escape(id)+'"]').forEach(b=>b.classList.add('mu-cue')))}
  function status(text,good=false){const x=$('#muStatus');if(x){x.textContent=text;x.classList.toggle('good',!!good)}}
  async function wrong(q,cueIds=[]){q.attempts++;q.cued=q.cued||q.attempts>=2;status(q.attempts>=2?'Let’s look together.':'Try again.');if(q.attempts>=2)cue(cueIds);await persist()}
  async function completeQuestion(mode,q,source){
    const s=session(mode);if(!s||runtime?.locked)return;runtime.locked=true;
    const firstTry=q.attempts===0&&!q.cued;
    state().history.push({id:crypto.randomUUID(),profile:profileKey(),at:new Date().toISOString(),mode,task:q.key,fieldSize:prefs().fieldSize,firstTry,cued:!!q.cued,attempts:q.attempts+1,source});
    if(state().history.length>800)state().history=state().history.slice(-800);
    s.completed++;s.lastTask=q.key;s.current=null;const g=goal();if(Number.isFinite(g)&&s.completed>=g)s.finished=true;
    await persist();status('✓ Great job!',true);celebrate?.($('#muStatus'));if(prefs().hearPrompts)speak('Great job');
    advanceTimer=setTimeout(()=>{advanceTimer=null;s.finished?finish(mode):renderQuestion(mode)},750);
  }
  async function chooseFind(id,btn){
    const s=session(runtime?.mode),q=s?.current;if(!q||q.mode!=='find'||runtime.locked)return;
    if(id!==q.target){btn.classList.add('try');setTimeout(()=>btn.classList.remove('try'),320);await wrong(q,[q.target]);return}
    btn.classList.add('correct');await completeQuestion('find',q,'find');
  }
  async function chooseShape(shape,btn){
    const q=session(runtime?.mode)?.current;if(!q||q.mode!=='match'||runtime.locked)return;
    if(shape!==q.answer){btn.classList.add('try');setTimeout(()=>btn.classList.remove('try'),320);q.attempts++;if(q.attempts>=2){q.cued=true;const right=$('[data-mu-shape="'+q.answer+'"]');right?.classList.add('mu-cue')}status(q.attempts>=2?'Let’s look together.':'Try again.');await persist();return}
    btn.classList.add('correct');await completeQuestion('match',q,'shape-match');
  }
  async function chooseSort(side,btn){
    const q=session(runtime?.mode)?.current;if(!q||q.mode!=='sort'||runtime.locked)return;const item=q.items[q.index];
    if(side!==item[1]){btn.classList.add('try');setTimeout(()=>btn.classList.remove('try'),320);q.attempts++;if(q.attempts>=2){q.cued=true;$('[data-mu-sort="'+item[1]+'"]')?.classList.add('mu-cue')}status(q.attempts>=2?'Let’s look together.':'Try again.');await persist();return}
    q.index++;status('✓ Great job!',true);if(q.index>=q.items.length){await completeQuestion('sort',q,'sort');return}await persist();setTimeout(()=>{if(runtime&&!runtime.locked){q.prompt='Where does this go?';renderQuestion('sort')}},350);
  }
  async function chooseGroup(id,btn){
    const q=session(runtime?.mode)?.current;if(!q||q.mode!=='group'||runtime.locked||q.selected.includes(id))return;
    if(!q.correct.includes(id)){btn.classList.add('try');setTimeout(()=>btn.classList.remove('try'),320);await wrong(q,q.correct.filter(x=>!q.selected.includes(x)));return}
    q.selected.push(id);btn.classList.add('selected');btn.insertAdjacentHTML('beforeend','<span class="mu-mark good">✓</span>');await persist();
    if(q.correct.every(x=>q.selected.includes(x))){await completeQuestion('group',q,'multi-select')}else status('Good. Find the others.',true);
  }
  async function chooseRule(index,btn){
    const q=session(runtime?.mode)?.current;if(!q||q.mode!=='rules'||runtime.locked||q.marked[index])return;index=Number(index);const id=q.items[index],wanted=q.phase;
    if(id!==wanted){btn.classList.add('try');setTimeout(()=>btn.classList.remove('try'),320);q.attempts++;if(q.attempts>=2){q.cued=true;$$('[data-mu-rule]').forEach((b,i)=>{if(q.items[i]===wanted&&!q.marked[i])b.classList.add('mu-cue')})}status(q.attempts>=2?'Let’s look together.':'Try again.');await persist();return}
    q.marked[index]=wanted==='apple'?'circle':'x';await persist();
    const remaining=q.items.some((x,i)=>x===wanted&&!q.marked[i]);
    if(!remaining&&wanted==='apple'){q.phase='kite';q.prompt='Now find all the kites.';await persist();renderQuestion('rules');return}
    if(!remaining&&wanted==='kite'){await completeQuestion('rules',q,'two-rules');return}
    renderQuestion('rules');
  }

  function finish(mode){
    clearSessionTimers();document.body.classList.add('mu-active');const s=session(mode);if(s)s.finished=true;persist().catch(()=>{});
    main.innerHTML='<div class="mu-finish"><span class="mu-finish-icon">'+modeIcon(mode)+'</span><span class="eyebrow">NICE WORK</span><h1>Nice work!</h1><p>'+(s?.completed||0)+' '+MU_MODE_LABELS[mode].toLowerCase()+' activit'+((s?.completed||0)===1?'y':'ies')+'.</p><div class="actions"><button class="btn" data-action="muAgain" data-mu-again="'+mode+'">Again</button><button class="btn secondary" data-action="muLaunch">Back to Match & Understand</button></div></div>';
  }
  async function again(mode){const old=session(mode);setSession(mode,{mode,signature:signature(),remaining:[],current:null,completed:0,lastTask:old?.lastTask||null,finished:false,started:new Date().toISOString()});await persist();renderQuestion(mode)}
  function exit(){cleanup();if(modal.open)modal.close();go('practice')}

  function progressHTML(){
    const rows=state().history.filter(x=>x.profile===profileKey()),cut=Date.now()-7*86400000,recent=rows.filter(x=>new Date(x.at).getTime()>=cut);if(!recent.length)return '';
    const sizes=recent.map(x=>x.fieldSize).filter(Number.isFinite),lo=Math.min(...sizes),hi=Math.max(...sizes),modes={};
    recent.forEach(x=>modes[x.mode]=(modes[x.mode]||0)+1);
    const summary=Object.entries(modes).map(([k,v])=>MU_MODE_LABELS[k]+': '+v).join(' · ');
    return '<section class="mu-progress-card"><span class="eyebrow">MATCH & UNDERSTAND</span><h2>Recent understanding practice</h2><p>Practised '+recent.length+' activit'+(recent.length===1?'y':'ies')+' this week with groups of '+(lo===hi?lo:lo+'–'+hi)+' pictures.</p><small>'+esc(summary)+'</small><button class="btn ghost" data-action="muLaunch">Open Match & Understand</button></section>';
  }

  async function handleClick(el){
    const mode=el.closest('button[data-mu-mode]');if(mode){await start(mode.dataset.muMode);return true}
    const find=el.closest('[data-mu-choice]');if(find){await chooseFind(find.dataset.muChoice,find);return true}
    const shape=el.closest('[data-mu-shape]');if(shape){await chooseShape(shape.dataset.muShape,shape);return true}
    const sort=el.closest('[data-mu-sort]');if(sort){await chooseSort(sort.dataset.muSort,sort);return true}
    const group=el.closest('[data-mu-group]');if(group){await chooseGroup(group.dataset.muGroup,group);return true}
    const rule=el.closest('[data-mu-rule]');if(rule){await chooseRule(rule.dataset.muRule,rule);return true}
    const action=el.closest('[data-action]')?.dataset.action;if(!action||!action.startsWith('mu'))return false;
    if(action==='muLaunch'){launch();return true}
    if(action==='muSettings'){settings();return true}
    if(action==='muSaveSettings'){await saveSettings();return true}
    if(action==='muHear'){const q=session(runtime?.mode)?.current;if(q)speak(q.prompt,true);return true}
    if(action==='muAgain'){await again(el.closest('[data-mu-again]')?.dataset.muAgain||runtime?.mode||'find');return true}
    if(action==='muExit'){exit();return true}
    return false;
  }
  return {launch,handleClick,progressHTML,cleanup};
}
