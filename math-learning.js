export function createMathLearningFeature(ctx){
  const {getState,persist,show,toast,main,modal,go,esc,celebrate,voice}=ctx;
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const OBJECTS=['ball','cookie','fish','flower','egg','orange','crayon'];
  const LABELS={count:'Count',add:'Add',subtract:'Take Away'};
  const DEFAULTS={maxNumber:5,sessionLength:5,hearNumbers:true};
  const MAX_ALLOWED=50;
  const PAGE_SIZE=10;
  let runtime=null,advanceTimer=null,cueTimers=[],speechTransitionTimer=null;

  function clone(v){return JSON.parse(JSON.stringify(v))}
  function state(){
    const S=getState();
    if(!S.mathLearning||typeof S.mathLearning!=='object')S.mathLearning={prefs:{},sessions:{},history:[]};
    S.mathLearning.prefs=S.mathLearning.prefs||{};
    S.mathLearning.sessions=S.mathLearning.sessions||{};
    S.mathLearning.history=Array.isArray(S.mathLearning.history)?S.mathLearning.history:[];
    return S.mathLearning;
  }
  const profileKey=()=>getState().active||'global';
  function normalisePrefs(p){
    let changed=false;
    if(!Number.isFinite(Number(p.maxNumber))){
      p.maxNumber=p.level==='next'?10:5;changed=true;
    }
    const max=Math.max(1,Math.min(MAX_ALLOWED,Math.round(Number(p.maxNumber)||5)));
    if(p.maxNumber!==max){p.maxNumber=max;changed=true}
    if('level'in p){delete p.level;changed=true}
    if(!['continuous',5,10,15,'5','10','15'].includes(p.sessionLength)){p.sessionLength=5;changed=true}
    if(typeof p.hearNumbers!=='boolean'){p.hearNumbers=true;changed=true}
    if(changed)persist().catch(()=>{});
    return p;
  }
  function prefs(){
    const t=state(),k=profileKey();
    if(!t.prefs[k])t.prefs[k]=clone(DEFAULTS);
    return normalisePrefs(t.prefs[k]);
  }
  function session(type){const t=state(),k=profileKey();t.sessions[k]=t.sessions[k]||{};return t.sessions[k][type]||null}
  function setSession(type,value){const t=state(),k=profileKey();t.sessions[k]=t.sessions[k]||{};t.sessions[k][type]=value}
  function shuffled(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
  function maxValue(p=prefs()){return Math.max(1,Math.min(MAX_ALLOWED,Number(p.maxNumber)||5))}
  function goal(p=prefs()){return String(p.sessionLength)==='continuous'?Infinity:Number(p.sessionLength||5)}
  function signature(p=prefs()){return JSON.stringify([maxValue(p),String(p.sessionLength),!!p.hearNumbers])}
  function clearTimers(){clearTimeout(advanceTimer);advanceTimer=null;clearTimeout(speechTransitionTimer);speechTransitionTimer=null;cueTimers.forEach(clearTimeout);cueTimers=[]}
  function stopSpeech(){if(voice?.stop)voice.stop();else if('speechSynthesis'in window)speechSynthesis.cancel()}
  function cleanup(){clearTimers();stopSpeech();runtime=null;document.body.classList.remove('math-active')}
  const autoVoice=()=>getState().settings?.autoVoice!==false;
  function speechAvailable(){return voice?.available?.()||('speechSynthesis'in window&&typeof SpeechSynthesisUtterance!=='undefined')}
  function voiceSpeak(text,opts={}){if(voice?.speak)return voice.speak(String(text),opts);if(!speechAvailable())return Promise.resolve(false);return new Promise(resolve=>{const u=new SpeechSynthesisUtterance(String(text));u.rate=Number(opts.rate||.86);u.pitch=1;u.onend=()=>resolve(true);u.onerror=()=>resolve(false);speechSynthesis.cancel();speechSynthesis.speak(u)})}
  function speak(text,force=false){if(!force&&(!prefs().hearNumbers||!autoVoice()))return;if(!speechAvailable())return;voiceSpeak(text,{mode:'learning',rate:.86})}
  function speakNumber(n){if(!prefs().hearNumbers||!autoVoice()||!speechAvailable())return;voiceSpeak(n,{mode:'learning',rate:.84})}
  function speakNumberThen(n,done){if(runtime?.transitioning)return;const token=runtime,finish=()=>{if(runtime!==token)return;if(runtime)runtime.transitioning=false;done?.()};if(!prefs().hearNumbers||!autoVoice()||!speechAvailable()){finish();return}if(runtime)runtime.transitioning=true;let settled=false;const once=()=>{if(settled)return;settled=true;clearTimeout(speechTransitionTimer);speechTransitionTimer=null;finish()};speechTransitionTimer=setTimeout(once,5000);voiceSpeak(n,{mode:'learning',rate:.84}).then(once,once)}
function label(type){return LABELS[type]||'Maths'}
  function modeMark(type){return type==='count'?'123':type==='add'?'+':'−'}
  function rangeLabel(p=prefs()){return 'Up to '+maxValue(p)}
  function totalObjects(q){return q.type==='count'?q.quantity:q.type==='add'?q.a+q.b:q.start}
  function objectHTML(id,index,q){
    const counted=(q.counted||[]).includes(index),removed=(q.removed||[]).includes(index);
    const seq=counted?(q.counted.indexOf(index)+1):'';
    return '<button class="math-object-btn '+(counted?'counted ':'')+(removed?'removed ':'')+'" data-math-object="'+index+'" '+(removed?'disabled':'')+' aria-label="'+esc((removed?'Taken away ':'')+'object '+(index+1))+'"><img src="./assets/concepts/highres/'+id+'.webp" alt="" draggable="false">'+(counted&&!removed?'<span class="math-count-badge">'+seq+'</span>':'')+'</button>';
  }
  function chunkParts(start,count,labelText){
    const out=[];if(count<=0)return out;
    const parts=Math.ceil(count/PAGE_SIZE);
    for(let part=0;part<parts;part++){
      const first=start+part*PAGE_SIZE,last=Math.min(start+count,first+PAGE_SIZE);
      out.push({indices:Array.from({length:last-first},(_,i)=>first+i),label:labelText,part:part+1,parts});
    }
    return out;
  }
  function chunksFor(q){
    if(q.type==='add')return [...chunkParts(0,q.a,'First group'),...chunkParts(q.a,q.b,'Second group')];
    return chunkParts(0,totalObjects(q),q.type==='subtract'?'Starting group':'Count');
  }
  function currentChunk(q){
    const chunks=chunksFor(q),page=Math.max(0,Math.min(chunks.length-1,Number(q.page)||0));
    q.page=page;return {...chunks[page],page,totalPages:chunks.length};
  }
  function chunkDone(q,chunk){
    const used=q.type==='subtract'?(q.removed||[]):(q.counted||[]);
    return chunk.indices.every(i=>used.includes(i));
  }
  function chunkLabel(q,chunk){
    if(chunk.totalPages<=1)return '';
    if(q.type==='add')return chunk.label+' · part '+chunk.part+' of '+chunk.parts;
    return 'Group '+(chunk.page+1)+' of '+chunk.totalPages;
  }
  function launch(){
    cleanup();
    const modes=['count','add','subtract'],p=prefs();
    show('<div class="math-launch"><span class="eyebrow">NUMBERS & MATHS</span><h1>Choose one.</h1><div class="math-type-grid">'+modes.map(type=>{
      const s=session(type),sub=type==='count'?'Touch and count':type==='add'?'Put groups together':'Take some away';
      return '<button data-math-type="'+type+'"><span class="math-choice-mark '+type+'">'+modeMark(type)+'</span><b>'+label(type)+'</b><small>'+(s&&s.current&&!s.finished?'Continue':sub)+'</small></button>';
    }).join('')+'</div><button class="math-change" data-action="mathSettings">Change · '+rangeLabel(p)+' · '+(String(p.sessionLength)==='continuous'?'Continuous':p.sessionLength+' questions')+'</button></div>',true);
  }
  function numberChoices(from,to,p){
    let html='';
    for(let n=from;n<=to;n++)html+='<label class="math-number-option"><input type="radio" name="mathMax" value="'+n+'" '+(maxValue(p)===n?'checked':'')+'><span>'+n+'</span></label>';
    return html;
  }
  function settings(){
    cleanup();const p=prefs(),selected=maxValue(p);
    show('<div class="math-settings"><button class="btn ghost" data-action="mathLaunch">← Numbers & Maths</button><span class="eyebrow">MATHS</span><h1>Change practice.</h1><div class="math-setting-block math-number-setting"><div class="math-setting-title"><b>Numbers up to</b><span>Currently: Up to '+selected+'</span></div><div class="math-number-grid quick">'+numberChoices(1,10,p)+'</div><details class="math-more-numbers" '+(selected>10?'open':'')+'><summary>More numbers <span>11–50</span></summary><div class="math-number-grid more">'+numberChoices(11,50,p)+'</div></details></div><div class="math-setting-block"><b>Questions</b><div class="math-session-pills">'+[5,10,15,'continuous'].map(v=>'<label><input type="radio" name="mathSession" value="'+v+'" '+(String(p.sessionLength)===String(v)?'checked':'')+'><span>'+(v==='continuous'?'Continuous':v)+'</span></label>').join('')+'</div></div><label class="math-hear-toggle"><input id="mathHearNumbers" type="checkbox" '+(p.hearNumbers?'checked':'')+'><span><b>Hear numbers</b><small>Say each number while counting.</small></span></label><button class="btn math-save" data-action="mathSaveSettings">Save</button></div>',true);
  }
  async function saveSettings(){
    const p=prefs(),max=Math.max(1,Math.min(MAX_ALLOWED,Number($('input[name="mathMax"]:checked')?.value)||5)),sessionLength=$('input[name="mathSession"]:checked')?.value||'5';
    p.maxNumber=max;p.sessionLength=sessionLength==='continuous'?'continuous':Number(sessionLength);p.hearNumbers=!!$('#mathHearNumbers')?.checked;
    await persist();launch();toast('Maths practice updated');
  }
  function mixDifficulty(easy,hard){
    easy=shuffled(easy);hard=shuffled(hard);const out=[];
    while(easy.length||hard.length){
      for(let i=0;i<2&&easy.length;i++)out.push(easy.shift());
      if(hard.length)out.push(hard.shift());
      if(!easy.length&&hard.length)out.push(...hard.splice(0));
    }
    return out;
  }
  function deckFor(type,max){
    let deck=[];
    if(type==='count'){
      for(let n=1;n<=max;n++)deck.push({quantity:n});
      return max<=10?shuffled(deck):mixDifficulty(deck.filter(x=>x.quantity<=10),deck.filter(x=>x.quantity>10));
    }
    if(type==='add'){
      for(let a=1;a<=max;a++)for(let b=0;b<=max;b++)if(a+b<=max)deck.push({a,b,answer:a+b});
      return max<=10?shuffled(deck):mixDifficulty(deck.filter(x=>x.answer<=10),deck.filter(x=>x.answer>10));
    }
    for(let start=1;start<=max;start++)for(let remove=1;remove<=start;remove++)deck.push({start,remove,answer:start-remove});
    return max<=10?shuffled(deck):mixDifficulty(deck.filter(x=>x.start<=10),deck.filter(x=>x.start>10));
  }
  function problemSig(type,p){return type==='count'?String(p.quantity):type==='add'?p.a+'+'+p.b:p.start+'-'+p.remove}
  function refill(s,type,p){
    let deck=deckFor(type,maxValue(p));
    if(s.lastProblem&&deck.length>1&&problemSig(type,deck[0])===s.lastProblem){
      const swap=deck.findIndex(x=>problemSig(type,x)!==s.lastProblem);if(swap>0)[deck[0],deck[swap]]=[deck[swap],deck[0]];
    }
    s.remaining=deck;s.round=(s.round||0)+1;
  }
  function answerOptions(answer,max,s){
    const optionCount=max>=2?3:2,pool=[];
    for(let i=0;i<=max;i++)if(i!==answer)pool.push(i);
    pool.sort((a,b)=>Math.abs(a-answer)-Math.abs(b-answer));
    const distractors=shuffled(pool.slice(0,Math.min(pool.length,7))).slice(0,optionCount-1);
    const counts=(s.positionCounts||[0,0,0]).slice(0,optionCount),min=Math.min(...counts),eligible=Array.from({length:optionCount},(_,i)=>i).filter(i=>counts[i]===min&&i!==s.lastCorrectPosition);
    let pos=(eligible.length?eligible:Array.from({length:optionCount},(_,i)=>i).filter(i=>i!==s.lastCorrectPosition))[0];if(pos===undefined)pos=0;
    const opts=[...distractors];opts.splice(pos,0,answer);return {options:opts,correctPosition:pos};
  }
  function chooseObject(s){
    const options=OBJECTS.filter(x=>x!==s.lastObject),id=options[(s.completed+s.round)%options.length]||OBJECTS[0];s.lastObject=id;return id;
  }
  function ensureQuestion(type){
    const p=prefs(),s=session(type);if(!s)return null;
    const g=goal(p);if(Number.isFinite(g)&&s.completed>=g)return null;
    if(s.current)return s.current;
    if(!s.remaining?.length)refill(s,type,p);
    const base=s.remaining.shift(),max=maxValue(p),answer=type==='count'?base.quantity:base.answer,pos=answerOptions(answer,max,s),objectId=chooseObject(s);
    const q={...base,type,answer,objectId,options:pos.options,correctPosition:pos.correctPosition,attempts:0,wrong:[],cued:false,counted:[],removed:[],page:0,phase:type==='add'?'answer':'touch',startedAt:Date.now(),round:s.round,suppressPromptOnce:false};
    s.current=q;persist().catch(()=>{});return q;
  }
  async function start(type){
    const p=prefs(),sig=signature(p);let s=session(type);
    if(!s||s.signature!==sig||s.finished){
      s={type,signature:sig,remaining:[],current:null,completed:0,round:0,lastProblem:null,lastObject:null,lastCorrectPosition:null,positionCounts:[0,0,0],started:new Date().toISOString(),finished:false};
      setSession(type,s);
    }
    await persist();if(modal.open)modal.close();renderQuestion(type);
  }
  function progressLabel(s,p){
    const g=goal(p);return Number.isFinite(g)?Math.min(s.completed+1,g)+' / '+g:'Keep going';
  }
  function promptText(q){
    if(q.type==='count')return q.phase==='touch'?'Touch each one.':'How many?';
    if(q.type==='add')return 'How many altogether?';
    return q.phase==='touch'?'Take away '+q.remove+'.':'How many left?';
  }
  function equation(q){
    if(q.type==='add')return '<div class="math-equation">'+q.a+' <span>+</span> '+q.b+' <span>=</span> ?</div>';
    if(q.type==='subtract')return '<div class="math-equation">'+q.start+' <span>−</span> '+q.remove+' <span>=</span> ?</div>';
    return '';
  }
  function additionGroupHTML(q,start,count,groupLabel){
    const indices=Array.from({length:count},(_,i)=>start+i),cols=Math.max(1,Math.min(count||1,10));
    const width=count<=1?24:count===2?40:count===3?58:count===4?76:count===5?94:100;
    const density=count>20?'very-dense':count>10?'dense':count>5?'medium':'small';
    return '<div class="math-add-row" role="group" aria-label="'+esc(groupLabel+', '+count+' '+(count===1?'item':'items'))+'"><div class="math-add-object-row '+density+'" style="--math-add-cols:'+cols+';--math-add-width:'+width+'%">'+(count?indices.map(i=>objectHTML(q.objectId,i,q)).join(''):'<span class="math-add-zero" aria-label="zero items">0</span>')+'</div></div>';
  }
  function objectsGrid(q){
    if(q.type==='add'){
      const total=totalObjects(q),density=total>35?'density-ultra':total>20?'density-high':total>10?'density-medium':'density-low';
      return '<div class="math-add-stacked '+density+'" aria-label="'+q.a+' plus '+q.b+'">'+additionGroupHTML(q,0,q.a,'First group')+'<div class="math-add-plus" aria-hidden="true">+</div>'+additionGroupHTML(q,q.a,q.b,'Second group')+'</div>';
    }
    const total=totalObjects(q),indices=Array.from({length:total},(_,i)=>i);
    const cols=total<=4?total:total<=15?5:total<=24?6:7,rows=Math.ceil(total/Math.max(1,cols));
    const density=total>40?'ultra':total>30?'very-dense':total>20?'dense':total>15?'compact':total>10?'medium':'normal';
    return '<div class="math-all-visible"><div class="math-object-grid math-object-grid-all density-'+density+'" style="grid-template-columns:repeat('+cols+',minmax(0,1fr));grid-template-rows:repeat('+rows+',minmax(0,1fr))">'+indices.map(i=>objectHTML(q.objectId,i,q)).join('')+'</div></div>';
  }
  function awayTray(q){
    if(q.type!=='subtract'||!(q.removed||[]).length)return '';
    const shown=q.removed.slice(0,10),more=q.removed.length-shown.length;
    return '<div class="math-away-tray"><b>Away</b><div>'+shown.map(()=>'<img src="./assets/concepts/highres/'+q.objectId+'.webp" alt="">').join('')+(more>0?'<span class="math-away-more">+'+more+'</span>':'')+'</div></div>';
  }
  function answerGrid(q){
    const ready=q.type==='add'||q.phase==='answer';
    return '<section class="math-answer-grid choices-'+q.options.length+' '+(ready?'':'hidden')+'" id="mathAnswerGrid">'+q.options.map(v=>'<button class="math-answer" data-math-answer="'+v+'" data-correct="'+(v===q.answer?'1':'0')+'" aria-label="'+v+'">'+v+'</button>').join('')+'</section>';
  }
  function statusText(q){
    if(q.type==='count'&&q.phase==='touch')return '<span id="mathTouchCount">'+q.counted.length+' / '+q.quantity+'</span>';
    if(q.type==='subtract'&&q.phase==='touch')return '<span id="mathTakeCount">'+q.removed.length+' of '+q.remove+'</span>';
    if(q.type==='add')return '<span id="mathTouchCount">'+q.counted.length+' counted</span>';
    return 'Choose a number.';
  }
  function renderQuestion(type){
    clearTimers();stopSpeech();document.body.classList.add('math-active');
    const p=prefs(),s=session(type);if(!s){launch();return}
    const g=goal(p);if((Number.isFinite(g)&&s.completed>=g)||s.finished){finish(type);return}
    const q=ensureQuestion(type);if(!q){finish(type);return}
    runtime={type,locked:false,transitioning:false};
    const suppress=!!q.suppressPromptOnce;q.suppressPromptOnce=false;
    main.innerHTML='<div class="math-child-screen" data-math-type="'+type+'" data-math-phase="'+q.phase+'" data-math-max="'+maxValue(p)+'" data-math-total="'+totalObjects(q)+'" data-math-answer-value="'+q.answer+'" '+(q.start!=null?'data-math-start="'+q.start+'"':'')+' data-math-page="'+q.page+'"><header class="math-child-head"><button class="math-caregiver-back" data-action="mathExit" aria-label="Exit activity">←</button><div><span>NUMBERS & MATHS</span><b>'+label(type)+'</b></div><div class="math-progress">'+progressLabel(s,p)+'</div></header><section class="math-prompt-card"><button data-action="mathHear" aria-label="Hear question">🔊</button><h1>'+esc(promptText(q))+'</h1></section><section class="math-work-area">'+equation(q)+objectsGrid(q)+awayTray(q)+'</section>'+answerGrid(q)+'<footer class="math-child-footer"><div id="mathStatus" class="math-status">'+statusText(q)+'</div><button class="btn ghost" data-action="toggleAutoVoice" aria-pressed="'+(autoVoice()?'true':'false')+'">'+(autoVoice()?'🔊 Auto voice on':'🔇 Auto voice off')+'</button><button data-action="mathHear">🔊 Hear</button></footer></div>';
    persist().catch(()=>{});
    if(p.hearNumbers&&autoVoice()&&!suppress)setTimeout(()=>speakPrompt(q),180);
  }
  function speakPrompt(q){speak(promptText(q),true)}
  function updateObjectState(q,index){
    const b=$('[data-math-object="'+index+'"]');if(!b)return;
    if(q.counted.includes(index)){b.classList.add('counted');let badge=b.querySelector('.math-count-badge');if(!badge){badge=document.createElement('span');badge.className='math-count-badge';b.appendChild(badge)}badge.textContent=String(q.counted.indexOf(index)+1)}
    if(q.removed.includes(index)){b.classList.add('removed');b.disabled=true}
  }
  async function moveToNextChunk(type,q){
    q.page=(Number(q.page)||0)+1;q.suppressPromptOnce=true;await persist();renderQuestion(type);
  }
  async function finishTouchPhase(type,q){
    q.phase='answer';await persist();renderQuestion(type);
  }
  async function touchObject(index){
    const type=runtime?.type,s=session(type),q=s?.current;if(!q||runtime.locked||runtime.transitioning)return;
    index=Number(index);
    if(index<0||index>=totalObjects(q))return;
    if(q.type==='subtract'){
      if(q.removed.includes(index)||q.removed.length>=q.remove)return;
      q.removed.push(index);updateObjectState(q,index);
      const n=q.removed.length,stat=$('#mathStatus');if(stat)stat.innerHTML='<span id="mathTakeCount">'+n+' of '+q.remove+'</span>';
      await persist();
      if(n>=q.remove){speakNumberThen(n,()=>finishTouchPhase(type,q));return}
      speakNumber(n);return;
    }
    if(q.counted.includes(index))return;
    q.counted.push(index);updateObjectState(q,index);
    const n=q.counted.length,total=totalObjects(q),stat=$('#mathStatus');
    if(stat)stat.innerHTML=q.type==='count'?'<span id="mathTouchCount">'+n+' / '+q.quantity+'</span>':'<span id="mathTouchCount">'+n+' counted</span>';
    await persist();
    if(q.type==='count'&&n>=q.quantity){speakNumberThen(n,()=>finishTouchPhase(type,q));return}
    if(q.type==='add'&&n>=total){
      speakNumberThen(n,()=>{const out=$('#mathStatus');if(out)out.textContent='Now choose.';});
      return;
    }
    speakNumber(n);
  }
  function cueCount(q){
    q.cued=true;
    const ids=Array.from({length:totalObjects(q)},(_,i)=>i).filter(i=>q.type!=='subtract'||!q.removed.includes(i));
    $$('.math-object-btn').forEach(b=>b.classList.remove('math-cue'));
    ids.forEach((id,i)=>{
      const spoken=q.type==='subtract'||q.type==='add'?i+1:id+1;
      const t=setTimeout(()=>{const b=$('[data-math-object="'+id+'"]');if(b){b.classList.add('math-cue');setTimeout(()=>b.classList.remove('math-cue'),420)}if(prefs().hearNumbers)speakNumber(spoken)},i*480);cueTimers.push(t);
    });
  }
  async function answer(value,btn){
    const type=runtime?.type,s=session(type),p=prefs(),q=s?.current;if(!q||runtime.locked||runtime.transitioning)return;
    q.attempts++;value=Number(value);
    if(value!==q.answer){
      if(!q.wrong.includes(value))q.wrong.push(value);
      btn.classList.add('try-again');setTimeout(()=>btn.classList.remove('try-again'),340);
      const out=$('#mathStatus');if(out)out.textContent=q.attempts>=2?(q.type==='subtract'?'Let’s count what is left.':'Let’s count together.'):'Try again.';
      if(q.attempts>=2&&!q.cued)cueCount(q);
      await persist();return;
    }
    runtime.locked=true;$$('.math-answer').forEach(x=>x.disabled=true);btn.classList.add('correct');
    const firstTry=q.attempts===1&&!q.cued;
    const record={id:crypto.randomUUID(),profile:profileKey(),at:new Date().toISOString(),type,target:q.answer,quantity:q.type==='count'?q.quantity:undefined,a:q.a,b:q.b,start:q.start,remove:q.remove,firstTry,cued:q.cued,attempts:q.attempts,responseMs:Math.max(0,Date.now()-q.startedAt)};
    state().history.push(record);if(state().history.length>800)state().history=state().history.slice(-800);
    s.completed++;s.lastProblem=problemSig(type,q);s.lastCorrectPosition=q.correctPosition;s.positionCounts[q.correctPosition]=(s.positionCounts[q.correctPosition]||0)+1;s.current=null;
    const g=goal(p);if(Number.isFinite(g)&&s.completed>=g)s.finished=true;
    await persist();const out=$('#mathStatus');if(out)out.textContent='✓ Great job!';if(p.hearNumbers&&autoVoice()&&voice?.speak)voice.speak('Great job',{mode:'encouragement',rate:.9});else if(p.hearNumbers&&autoVoice())speak('Great job');celebrate?.(btn);
    advanceTimer=setTimeout(()=>{advanceTimer=null;s.finished?finish(type):renderQuestion(type)},850);
  }
  function finish(type){
    clearTimers();document.body.classList.add('math-active');const s=session(type);if(s)s.finished=true;persist().catch(()=>{});
    main.innerHTML='<div class="math-finish-screen"><div class="math-finish-mark">'+modeMark(type)+'</div><span class="eyebrow">NICE WORK</span><h1>You did it!</h1><p>'+(s?.completed||0)+' '+label(type).toLowerCase()+' question'+(s?.completed===1?'':'s')+'.</p><div class="math-finish-actions"><button class="btn" data-action="mathAgain" data-math-type="'+type+'">Again</button><button class="btn secondary" data-action="mathLaunch">Back to Maths</button></div></div>';
  }
  async function again(type){
    const old=session(type),p=prefs();setSession(type,{type,signature:signature(p),remaining:[],current:null,completed:0,round:0,lastProblem:old?.lastProblem||null,lastObject:old?.lastObject||null,lastCorrectPosition:old?.lastCorrectPosition??null,positionCounts:[0,0,0],started:new Date().toISOString(),finished:false});
    await persist();renderQuestion(type);
  }
  function exit(){cleanup();if(modal.open)modal.close();go('practice')}
  function progressHTML(){
    const rows=state().history.filter(x=>x.profile===profileKey()),week=7*86400000,cut=Date.now()-week,recent=rows.filter(x=>new Date(x.at).getTime()>=cut);
    if(!recent.length)return '';
    const count=recent.filter(x=>x.type==='count'),add=recent.filter(x=>x.type==='add'),sub=recent.filter(x=>x.type==='subtract');
    const first=arr=>arr.filter(x=>x.firstTry).length,parts=[];
    if(count.length){const vals=count.map(x=>x.quantity).filter(Number.isFinite),lo=Math.min(...vals),hi=Math.max(...vals);parts.push('<div><span>123</span><b>Count</b><p>Counted groups from '+lo+'–'+hi+' this week.</p><small>'+first(count)+' of '+count.length+' recent answers were correct on the first try.</small></div>')}
    if(add.length)parts.push('<div><span>+</span><b>Add</b><p>'+add.length+' addition opportunities this week.</p><small>'+first(add)+' of '+add.length+' were correct on the first try.</small></div>');
    if(sub.length)parts.push('<div><span>−</span><b>Take Away</b><p>'+sub.length+' take-away opportunities this week.</p><small>'+first(sub)+' of '+sub.length+' were correct on the first try.</small></div>');
    return '<section class="math-progress-card"><span class="eyebrow">NUMBERS & MATHS</span><h2>Recent maths practice</h2><div class="math-progress-grid">'+parts.join('')+'</div><button class="btn ghost" data-action="mathLaunch">Open Numbers & Maths</button></section>';
  }
  function validateMathGenerator(){
    const errors=[];
    for(const max of [1,3,10,12,20,50]){
      const c=deckFor('count',max),a=deckFor('add',max),sub=deckFor('subtract',max);
      if(!c.length||Math.max(...c.map(x=>x.quantity))!==max||c.some(x=>x.quantity<1||x.quantity>max))errors.push('Count ceiling '+max);
      if(!a.length||Math.max(...a.map(x=>x.answer))!==max||a.some(x=>x.answer<1||x.answer>max))errors.push('Add ceiling '+max);
      if(!sub.length||Math.max(...sub.map(x=>x.start))!==max||sub.some(x=>x.start<1||x.start>max||x.answer<0))errors.push('Take Away ceiling '+max);
    }
    return errors;
  }
  const validationErrors=validateMathGenerator();
  if(validationErrors.length)console.error('WAPS Numbers & Maths generator validation',validationErrors);

  async function handleClick(el){
    const obj=el.closest('[data-math-object]');if(obj){await touchObject(obj.dataset.mathObject);return true}
    const ans=el.closest('[data-math-answer]');if(ans){await answer(ans.dataset.mathAnswer,ans);return true}
    const typeBtn=el.closest('button[data-math-type]');
    const action=el.closest('[data-action]')?.dataset.action;
    if(typeBtn&&action!=='mathAgain'){await start(typeBtn.dataset.mathType);return true}
    if(!action||!action.startsWith('math'))return false;
    if(action==='mathLaunch'){launch();return true}
    if(action==='mathSettings'){settings();return true}
    if(action==='mathSaveSettings'){await saveSettings();return true}
    if(action==='mathHear'){const s=session(runtime?.type),q=s?.current;if(q)speakPrompt(q);return true}
    if(action==='mathAgain'){await again(el.closest('[data-math-type]')?.dataset.mathType||runtime?.type||'count');return true}
    if(action==='mathExit'){exit();return true}
    return false;
  }
  return {launch,handleClick,progressHTML,cleanup,validationErrors};
}
