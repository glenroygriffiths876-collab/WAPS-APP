import {TRACE_GLYPHS,TRACE_UPPER,TRACE_LOWER,TRACE_REQUIRED,validateTraceGlyphs} from './trace-data.js';

export function createTraceFeature(ctx){
  const {getState,persist,active,show,toast,main,modal,go,esc,celebrate}=ctx;
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const NUMBER_BUTTONS=Array.from({length:21},(_,i)=>String(i));
  const clone=v=>JSON.parse(JSON.stringify(v));
  const DEFAULTS={
    letters:{type:'letters',selected:['A','B','C','D','E','F'],guidance:'guided',lineSize:'medium',letterAudio:'name'},
    numbers:{type:'numbers',selected:['0','1','2','3','4','5'],guidance:'guided',lineSize:'medium',letterAudio:'name'}
  };
  const LETTER_NAMES={A:'ay',B:'bee',C:'see',D:'dee',E:'ee',F:'eff',G:'gee',H:'aitch',I:'eye',J:'jay',K:'kay',L:'el',M:'em',N:'en',O:'oh',P:'pee',Q:'cue',R:'ar',S:'ess',T:'tee',U:'you',V:'vee',W:'double you',X:'ex',Y:'why',Z:'zed'};
  const LETTER_EXAMPLES={A:'apple',B:'ball',C:'cat',D:'dog',E:'egg',F:'fish',G:'go',H:'hat',I:'igloo',J:'jump',K:'kite',L:'lion',M:'mango',N:'nose',O:'orange',P:'pen',Q:'queen',R:'run',S:'sun',T:'tree',U:'umbrella',V:'van',W:'water',X:'box',Y:'yam',Z:'zebra'};
  const ONES=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
  const TENS=['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
  let draft=null,runtime=null,recognition=null,advanceTimer=null,demoRAF=0;

  function state(){
    const S=getState();
    if(!S.trace||typeof S.trace!=='object')S.trace={prefs:{},sessions:{},history:[]};
    S.trace.prefs=S.trace.prefs||{};
    S.trace.sessions=S.trace.sessions||{};
    S.trace.history=Array.isArray(S.trace.history)?S.trace.history:[];
    return S.trace;
  }
  const profileKey=()=>getState().active||'global';
  function bucket(obj,key){if(!obj[key])obj[key]={};return obj[key]}
  function prefs(type){
    const t=state(),b=bucket(t.prefs,profileKey());
    if(!b[type])b[type]=clone(DEFAULTS[type]);
    return b[type];
  }
  function session(type){
    const t=state(),b=bucket(t.sessions,profileKey());
    return b[type]||null;
  }
  function saveSession(type,value){
    const t=state(),b=bucket(t.sessions,profileKey());b[type]=value;
  }
  function numberWords(value){
    const n=Number(value);if(!Number.isInteger(n)||n<0||n>99)return String(value);
    if(n<20)return ONES[n];
    const ten=TENS[Math.floor(n/10)],one=n%10;return one?ten+' '+ONES[one]:ten;
  }
  function unique(list){return [...new Set(list)]}
  function cleanNameLetters(){
    const name=(active()?.name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z]/g,'');
    return unique([...name]);
  }
  function signature(items,p){return JSON.stringify([items,p.guidance,p.lineSize,p.letterAudio])}
  function stopMedia(){
    try{recognition?.abort()}catch{} recognition=null;
    if(demoRAF)cancelAnimationFrame(demoRAF);demoRAF=0;
    clearTimeout(advanceTimer);advanceTimer=null;
    if('speechSynthesis'in window)speechSynthesis.cancel();
  }
  function cleanup(){
    stopMedia();document.body.classList.remove('trace-active','trace-say-active');
  }

  function launch(){
    cleanup();
    const ls=session('letters'),ns=session('numbers');
    const lp=ls&&ls.cursor<ls.items.length?ls.cursor+'/'+ls.items.length:null;
    const np=ns&&ns.cursor<ns.items.length?ns.cursor+'/'+ns.items.length:null;
    show(`<div class="trace-launch"><span class="eyebrow">WAPS TRACE & SAY</span><h1>What would you like to practise?</h1><p>One character at a time: trace it, say it, celebrate, then continue.</p><div class="trace-type-grid">
      <button data-trace-type="letters"><span>🔤</span><b>Letters</b><small>Uppercase, lowercase, custom sets${lp?' · Continue '+lp:''}</small></button>
      <button data-trace-type="numbers"><span>🔢</span><b>Numbers</b><small>0–5, 0–9, 0–10, 0–20 or custom${np?' · Continue '+np:''}</small></button>
    </div><div class="notice"><b>Child-friendly tracing:</b> WAPS checks the current stroke path with generous motor tolerance. It does not require pixel-perfect handwriting.</div></div>`,true);
  }

  function config(type){
    const p=prefs(type);draft={...clone(p),type,selected:[...(p.selected||DEFAULTS[type].selected)]};
    renderConfig();
  }
  function renderConfig(){
    const type=draft.type,isLetters=type==='letters',nameLetters=cleanNameLetters();
    const tokens=isLetters?[...TRACE_UPPER,...TRACE_LOWER]:NUMBER_BUTTONS;
    const presets=isLetters
      ?[['upper','A–Z'],['lower','a–z'],['both','A–Z + a–z'],['af','A–F'],['gl','G–L'],['mr','M–R'],['sz','S–Z'],...(nameLetters.length?[['name','Name letters']]:[])]
      :[['05','0–5'],['09','0–9'],['010','0–10'],['020','0–20']];
    show(`<div class="trace-config"><button class="btn ghost" data-action="traceLaunch">← Trace & Say</button><span class="eyebrow">${isLetters?'LETTERS':'NUMBERS'}</span><h1>Choose what to practise.</h1>
      <div class="trace-presets">${presets.map(x=>`<button data-trace-preset="${x[0]}">${x[1]}</button>`).join('')}</div>
      <div class="trace-token-grid ${isLetters?'letters':'numbers'}">${tokens.map(t=>`<button class="${draft.selected.includes(t)?'selected':''}" data-trace-token="${esc(t)}">${esc(t)}</button>`).join('')}</div>
      ${!isLetters?`<div class="field"><label>Optional custom numbers (0–99)<input id="traceCustomNumbers" inputmode="numeric" placeholder="e.g. 12, 15, 20"></label><div class="mini">Separate numbers with commas. Selected numbers above are included too.</div></div>`:''}
      <div class="trace-setting-grid">
        <label>Guidance<select id="traceGuidance"><option value="guided" ${draft.guidance==='guided'?'selected':''}>Guided</option><option value="standard" ${draft.guidance==='standard'?'selected':''}>Standard</option><option value="fade" ${draft.guidance==='fade'?'selected':''}>Fade the guide</option></select></label>
        <label>Trace line<select id="traceLineSize"><option value="small" ${draft.lineSize==='small'?'selected':''}>Small</option><option value="medium" ${draft.lineSize==='medium'?'selected':''}>Medium</option><option value="large" ${draft.lineSize==='large'?'selected':''}>Large</option></select></label>
        ${isLetters?`<label>Letter audio<select id="traceLetterAudio"><option value="name" ${draft.letterAudio==='name'?'selected':''}>Letter name</option><option value="sound" ${draft.letterAudio==='sound'?'selected':''}>Letter sound + example</option><option value="both" ${draft.letterAudio==='both'?'selected':''}>Name + sound/example</option></select></label>`:''}
      </div>
      <div class="trace-config-summary"><b id="traceSelectedCount">${draft.selected.length} selected</b><span>WAPS will remember this set for ${esc(active()?.name||'this device')}.</span></div>
      <div class="actions"><button class="btn" data-action="traceStart">${resumePossible()?'Continue / start selected set':'Start tracing'} →</button><button class="btn secondary" data-action="tracePreview">Preview formation</button>${session(draft.type)?'<button class="btn ghost" data-action="traceRestartSet">Restart saved set</button>':''}</div>
    </div>`,true);
  }
  function resumePossible(){
    const s=session(draft.type);return !!(s&&s.cursor<s.items.length);
  }
  function preset(code){
    if(draft.type==='letters'){
      if(code==='upper')draft.selected=[...TRACE_UPPER];
      else if(code==='lower')draft.selected=[...TRACE_LOWER];
      else if(code==='both')draft.selected=[...TRACE_UPPER,...TRACE_LOWER];
      else if(code==='af')draft.selected='ABCDEF'.split('');
      else if(code==='gl')draft.selected='GHIJKL'.split('');
      else if(code==='mr')draft.selected='MNOPQR'.split('');
      else if(code==='sz')draft.selected='STUVWXYZ'.split('');
      else if(code==='name')draft.selected=cleanNameLetters();
    }else{
      const top=code==='05'?5:code==='09'?9:code==='010'?10:20;
      draft.selected=Array.from({length:top+1},(_,i)=>String(i));
    }
    renderConfig();
  }
  function toggleToken(token,button){
    const has=draft.selected.includes(token);
    draft.selected=has?draft.selected.filter(x=>x!==token):[...draft.selected,token];
    button?.classList.toggle('selected',!has);
    const out=$('#traceSelectedCount');if(out)out.textContent=draft.selected.length+' selected';
  }
  function readConfig(){
    draft.guidance=$('#traceGuidance')?.value||'guided';
    draft.lineSize=$('#traceLineSize')?.value||'medium';
    draft.letterAudio=$('#traceLetterAudio')?.value||'name';
    if(draft.type==='numbers'){
      const extra=($('#traceCustomNumbers')?.value||'').split(/[ ,]+/).map(x=>x.trim()).filter(Boolean).map(Number).filter(n=>Number.isInteger(n)&&n>=0&&n<=99).map(String);
      draft.selected=unique([...draft.selected,...extra]).sort((a,b)=>Number(a)-Number(b));
    }else{
      draft.selected=unique(draft.selected);
    }
  }
  async function start(){
    readConfig();
    if(!draft.selected.length){toast('Choose at least one '+(draft.type==='letters'?'letter':'number')+'.');return}
    const t=state(),pb=bucket(t.prefs,profileKey());pb[draft.type]={...clone(draft)};
    let s=session(draft.type),sig=signature(draft.selected,draft);
    if(!s||s.signature!==sig||!Array.isArray(s.items)||s.cursor>=s.items.length){
      s={type:draft.type,items:[...draft.selected],cursor:0,round:(s?.round||0)+1,signature:sig,started:new Date().toISOString()};
      saveSession(draft.type,s);
    }
    await persist();if(modal.open)modal.close();renderCurrent(draft.type);
  }
  function currentSession(type){return session(type)}
  function currentPrefs(type){return prefs(type)}
  function currentToken(type){
    const s=currentSession(type);return s?.items?.[s.cursor]??null;
  }
  function newRuntime(type,token){
    return {type,token,chars:type==='numbers'?[...String(token)]:[String(token)],digitIndex:0,strokeIndex:0,strokeAttempts:0,totalAttempts:0,started:Date.now()};
  }
  function traceWidth(){
    const p=currentPrefs(runtime.type);return p.lineSize==='small'?48:p.lineSize==='large'?88:68;
  }
  function guideOpacity(){
    const p=currentPrefs(runtime.type);if(p.guidance!=='fade')return .28;
    const recent=state().history.filter(x=>x.profile===profileKey()&&x.token===runtime.token).slice(-3).length;
    return Math.max(.09,.25-recent*.05);
  }
  function activeChar(){return runtime.chars[runtime.digitIndex]}
  function glyph(){return TRACE_GLYPHS[activeChar()]}
  function tokenContext(){
    if(runtime.type!=='numbers'||runtime.chars.length===1)return '';
    return `<div class="trace-number-context">${runtime.chars.map((d,i)=>`<span class="${i<runtime.digitIndex?'done':i===runtime.digitIndex?'active':''}">${d}</span>`).join('')}</div>`;
  }
  function renderCurrent(type){
    stopMedia();const s=currentSession(type);if(!s||s.cursor>=s.items.length){finishSet(type);return}
    const token=currentToken(type);runtime=newRuntime(type,token);renderTraceScreen();setTimeout(()=>speakToken(token,false),250);
  }
  function renderTraceScreen(){
    stopMedia();document.body.classList.add('trace-active');document.body.classList.remove('trace-say-active');
    const s=currentSession(runtime.type),p=currentPrefs(runtime.type),g=glyph();
    if(!g){toast('This tracing character is unavailable.');advanceToken('skipped');return}
    const w=traceWidth(),showLines=p.guidance==='guided';
    main.innerHTML=`<div class="trace-child-screen">
      <header class="trace-child-head"><button data-action="traceExit" class="trace-caregiver-back" aria-label="Exit tracing">←</button><div><span>TRACE & SAY</span><b>Trace ${esc(runtime.token)}</b></div><div class="trace-count">${s.cursor+1} / ${s.items.length}</div></header>
      ${tokenContext()}
      <div class="trace-canvas-wrap ${p.guidance}" id="traceCanvasWrap">
        <svg id="traceSvg" class="trace-svg" viewBox="0 0 1000 1000" role="img" aria-label="Trace ${esc(activeChar())}" touch-action="none">
          ${showLines?'<path class="trace-writing-line" d="M120 120 H880"/><path class="trace-writing-line mid" d="M120 410 H880"/><path class="trace-writing-line base" d="M120 820 H880"/><path class="trace-writing-line desc" d="M120 960 H880"/>':''}
          ${g.strokes.map((st,i)=>`<path id="traceGuide${i}" class="trace-guide ${i<runtime.strokeIndex?'complete':''} ${i===runtime.strokeIndex?'active':''}" d="${st.d}" style="--trace-w:${w}px;--guide-opacity:${guideOpacity()}"/><path id="traceBright${i}" class="trace-bright ${i<runtime.strokeIndex?'complete':''}" d="${st.d}" style="--trace-w:${w}px"/>`).join('')}
          <polyline id="traceLive" class="trace-live" points="" style="--trace-w:${Math.max(22,w*.42)}px"/>
          <circle id="traceStartDot" class="trace-start-dot" r="${Math.max(28,w*.42)}"/>
          <circle id="traceDemoDot" class="trace-demo-dot" r="${Math.max(22,w*.34)}"/>
        </svg>
        <div id="traceStatus" class="trace-status">Start at the glowing dot.</div>
      </div>
      <div class="trace-child-controls"><button data-action="traceHear">🔊 Hear it again</button><button data-action="traceShowMe">👆 Show me</button><button data-action="traceRetryStroke">↶ Try stroke</button><button data-action="traceStartOver">↺ Start item over</button></div>
    </div>`;
    requestAnimationFrame(initStroke);
  }

  function svgPoint(svg,e){
    const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;
    const m=svg.getScreenCTM();return m?pt.matrixTransform(m.inverse()):{x:0,y:0};
  }
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  function initStroke(){
    const svg=$('#traceSvg'),path=$('#traceGuide'+runtime.strokeIndex),bright=$('#traceBright'+runtime.strokeIndex),startDot=$('#traceStartDot'),live=$('#traceLive');
    if(!svg||!path||!bright||!startDot)return;
    const len=path.getTotalLength(),count=Math.max(100,Math.ceil(len/7)),samples=Array.from({length:count},(_,i)=>path.getPointAtLength(len*i/(count-1)));
    const start=samples[0];startDot.setAttribute('cx',start.x);startDot.setAttribute('cy',start.y);
    bright.style.strokeDasharray=String(len);bright.style.strokeDashoffset=String(len);
    let tracing=false,pointerId=null,index=0,accepted=[],last=null,raf=0;
    const p=currentPrefs(runtime.type),baseTol=p.lineSize==='small'?58:p.lineSize==='large'?98:78;
    const tolerance=baseTol+Math.min(runtime.strokeAttempts*14,36)+(p.guidance==='guided'?8:0);
    const status=t=>{let o=$('#traceStatus');if(o)o.textContent=t};
    const renderProgress=()=>{
      raf=0;const progress=index/(count-1);bright.style.strokeDashoffset=String(len*(1-progress));
      live.setAttribute('points',accepted.slice(-80).map(q=>q.x.toFixed(1)+','+q.y.toFixed(1)).join(' '));
    };
    const pulse=()=>{path.classList.remove('trace-pulse');void path.getBBox();path.classList.add('trace-pulse');setTimeout(()=>path.classList.remove('trace-pulse'),650)};
    const nearest=(pt,min,max)=>{
      let best=-1,bd=Infinity;
      for(let i=min;i<=max;i++){const dd=dist(pt,samples[i]);if(dd<bd){bd=dd;best=i}}
      return {i:best,d:bd};
    };
    const process=e=>{
      const pt=svgPoint(svg,e),jump=last?dist(pt,last):0;
      const allowance=Math.max(22,Math.ceil(jump/7)+12),min=Math.max(0,index-4),max=Math.min(count-1,index+allowance);
      const n=nearest(pt,min,max);
      if(n.d<=tolerance && !(jump>210&&n.i-index>30)){
        index=Math.max(index,n.i);accepted.push(pt);last=pt;status('Keep following the bright line.');
        if(!raf)raf=requestAnimationFrame(renderProgress);
      }else{
        status('Stay near the line.');path.classList.add('trace-off');setTimeout(()=>path.classList.remove('trace-off'),180);
      }
    };
    svg.onpointerdown=e=>{
      if(e.isPrimary===false)return;e.preventDefault();const pt=svgPoint(svg,e);
      if(dist(pt,start)>tolerance*1.55){status('Start at the glowing dot.');pulse();return}
      tracing=true;pointerId=e.pointerId;index=0;accepted=[pt];last=pt;try{svg.setPointerCapture(pointerId)}catch{};status('Follow the line.');
    };
    svg.onpointermove=e=>{
      if(!tracing||e.pointerId!==pointerId)return;e.preventDefault();
      const events=e.getCoalescedEvents?.()||[e];for(const ev of events)process(ev);
    };
    const end=e=>{
      if(!tracing||e.pointerId!==pointerId)return;e.preventDefault();tracing=false;try{svg.releasePointerCapture(pointerId)}catch{}
      const progress=index/(count-1);
      if(progress>=.86){completeStroke()}else{
        runtime.strokeAttempts++;runtime.totalAttempts++;index=0;accepted=[];bright.style.strokeDashoffset=String(len);live.setAttribute('points','');
        status(runtime.strokeAttempts>=2?'Let’s try together. The guide is a little easier now.':'Almost. Try this line again.');
        if(runtime.strokeAttempts>=2)setTimeout(showDemo,450);
      }
    };
    svg.onpointerup=end;svg.onpointercancel=end;
  }
  function completeStroke(){
    runtime.strokeIndex++;runtime.strokeAttempts=0;
    const g=glyph();
    if(runtime.strokeIndex<g.strokes.length){setTimeout(renderTraceScreen,180);return}
    if(runtime.digitIndex<runtime.chars.length-1){runtime.digitIndex++;runtime.strokeIndex=0;setTimeout(renderTraceScreen,220);return}
    setTimeout(showSayStage,260);
  }
  function retryStroke(){
    if(!runtime)return;runtime.strokeAttempts++;runtime.totalAttempts++;renderTraceScreen();
  }
  function restartItem(){
    if(!runtime)return;runtime=newRuntime(runtime.type,runtime.token);renderTraceScreen();
  }
  function showDemo(){
    if(!runtime)return;const path=$('#traceGuide'+runtime.strokeIndex),dot=$('#traceDemoDot');if(!path||!dot)return;
    if(demoRAF)cancelAnimationFrame(demoRAF);const len=path.getTotalLength(),start=performance.now(),dur=Math.max(900,Math.min(1800,len*1.45));dot.classList.add('show');
    const tick=t=>{const p=Math.min(1,(t-start)/dur),pt=path.getPointAtLength(len*p);dot.setAttribute('cx',pt.x);dot.setAttribute('cy',pt.y);if(p<1)demoRAF=requestAnimationFrame(tick);else{dot.classList.remove('show');demoRAF=0}};
    demoRAF=requestAnimationFrame(tick);
  }
  function speakToken(token,withPrompt=true){
    if(!('speechSynthesis'in window)||typeof SpeechSynthesisUtterance==='undefined')return;
    speechSynthesis.cancel();let text='';
    if(runtime?.type==='numbers')text=numberWords(token);
    else{
      const upper=String(token).toUpperCase(),p=currentPrefs('letters'),name=LETTER_NAMES[upper]||upper,example=LETTER_EXAMPLES[upper];
      if(p.letterAudio==='sound')text=upper+' as in '+example;
      else if(p.letterAudio==='both')text=upper+'. '+upper+' as in '+example;
      else text=upper;
    }
    if(withPrompt)text='Trace '+text;
    const u=new SpeechSynthesisUtterance(text);u.rate=.82;u.pitch=1.02;speechSynthesis.speak(u);
  }
  function showSayStage(){
    stopMedia();document.body.classList.add('trace-active','trace-say-active');
    const supported=!!(window.SpeechRecognition||window.webkitSpeechRecognition),spoken=runtime.type==='numbers'?numberWords(runtime.token):String(runtime.token).toUpperCase();
    main.innerHTML=`<div class="trace-say-screen"><header class="trace-child-head"><button data-action="traceExit" class="trace-caregiver-back">←</button><div><span>TRACE COMPLETE ✓</span><b>Now say it.</b></div><div></div></header>
      <div class="trace-say-card"><span class="eyebrow">SAY IT</span><div class="trace-say-token">${esc(runtime.token)}</div><p>Say “${esc(spoken)}”.</p>
      <div id="traceSpeechStatus" class="trace-speech-status">${supported?'Tap the microphone when you are ready.':'Your device cannot check speech automatically.'}</div>
      ${supported?'<button class="trace-mic" data-action="traceListen">🎤 <span>Say it</span></button>':''}
      <div class="trace-speech-fallback"><button data-action="traceCaregiverConfirm">👩🏽 Caregiver: I heard it</button><button data-action="traceSpeechSkip">Continue without voice →</button></div></div></div>`;
    setTimeout(()=>speakSayPrompt(),220);
  }
  function speakSayPrompt(){
    if(!('speechSynthesis'in window))return;let target=runtime.type==='numbers'?numberWords(runtime.token):String(runtime.token).toUpperCase();
    speechSynthesis.cancel();const u=new SpeechSynthesisUtterance('Now say '+target);u.rate=.82;speechSynthesis.speak(u);
  }
  function normalizeSpeech(s){return String(s||'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim()}
  function speechMatches(transcript){
    const got=normalizeSpeech(transcript);
    if(runtime.type==='numbers'){
      const target=String(Number(runtime.token)),word=numberWords(runtime.token);return got===target||got===word||got==='number '+target||got==='number '+word;
    }
    const L=String(runtime.token).toUpperCase(),low=L.toLowerCase(),name=normalizeSpeech(LETTER_NAMES[L]||L);
    const aliases=new Set([low,name,'letter '+low,'letter '+name]);
    if(L==='A')aliases.add('hey');if(L==='C')aliases.add('sea');if(L==='G')aliases.add('gee');if(L==='R')aliases.add('are');if(L==='U')aliases.add('you');if(L==='Y')aliases.add('why');if(L==='Z'){aliases.add('zee');aliases.add('zed')}
    return aliases.has(got);
  }
  function listen(){
    const R=window.SpeechRecognition||window.webkitSpeechRecognition;if(!R){toast('Speech checking is not available.');return}
    try{recognition?.abort()}catch{}
    recognition=new R();recognition.lang='en-JM';recognition.interimResults=false;recognition.maxAlternatives=3;
    const st=$('#traceSpeechStatus');if(st)st.textContent='🎤 Listening…';
    recognition.onresult=e=>{
      const alts=[];for(let i=0;i<e.results[0].length;i++)alts.push(e.results[0][i].transcript);
      if(alts.some(speechMatches)){finishSpeech('recognized');return}
      runtime.speechAttempts=(runtime.speechAttempts||0)+1;
      if(st)st.textContent=runtime.speechAttempts>=3?'I still didn’t catch that. A caregiver can confirm, or you can continue.':'I didn’t catch that. Try again.';
    };
    recognition.onerror=()=>{runtime.speechAttempts=(runtime.speechAttempts||0)+1;if(st)st.textContent='I didn’t catch that. Try again or use caregiver confirm.'};
    recognition.onend=()=>{recognition=null};
    try{recognition.start()}catch{if(st)st.textContent='Microphone could not start. Use caregiver confirm or continue.'}
  }
  async function finishSpeech(status){
    stopMedia();const t=state(),s=currentSession(runtime.type);
    t.history.push({id:crypto.randomUUID(),profile:profileKey(),at:new Date().toISOString(),type:runtime.type,token:runtime.token,traceAttempts:runtime.totalAttempts,guidance:currentPrefs(runtime.type).guidance,lineSize:currentPrefs(runtime.type).lineSize,speech:status});
    if(t.history.length>500)t.history=t.history.slice(-500);
    s.cursor=Math.min(s.items.length,s.cursor+1);await persist();
    celebrate?.($('.trace-say-token'));
    main.innerHTML=`<div class="trace-success-screen"><div class="trace-success-check">✓</div><h1>Great work!</h1><p>You traced and practised ${esc(runtime.token)}.</p><button class="btn" data-action="traceNextNow">Next now →</button></div>`;
    advanceTimer=setTimeout(()=>advanceToken(),1450);
  }
  function advanceToken(){
    clearTimeout(advanceTimer);advanceTimer=null;const type=runtime?.type||draft?.type||'letters',s=currentSession(type);
    if(!s||s.cursor>=s.items.length){finishSet(type);return}renderCurrent(type);
  }
  function finishSet(type){
    stopMedia();document.body.classList.add('trace-active');const s=currentSession(type);
    main.innerHTML=`<div class="trace-finish-screen"><div class="trace-finish-star">★</div><span class="eyebrow">SET COMPLETE</span><h1>You finished this set!</h1><p>${s?.items?.length||0} ${type==='letters'?'letters':'numbers'} completed in Round ${s?.round||1}.</p><div class="trace-finish-actions"><button class="btn" data-action="traceAgain" data-trace-type="${type}">Practise again</button><button class="btn secondary" data-action="traceChooseNew" data-trace-type="${type}">Choose new ${type}</button><button class="btn ghost" data-action="traceExit">Done</button></div></div>`;
    celebrate?.(null);
  }
  async function again(type){
    const s=currentSession(type);if(!s)return launch();s.cursor=0;s.round=(s.round||1)+1;s.started=new Date().toISOString();await persist();renderCurrent(type);
  }
  async function restartSavedSet(type){
    const s=currentSession(type);if(!s){toast('There is no saved set to restart.');return}
    if(!confirm('Restart this Trace & Say set from the beginning? Completed history will stay in Progress.'))return;
    s.cursor=0;s.round=(s.round||1)+1;s.started=new Date().toISOString();await persist();if(modal.open)modal.close();renderCurrent(type);
  }
  function exit(){
    cleanup();if(modal.open)modal.close();go('practice');
  }
  function progressHTML(){
    const h=state().history.filter(x=>x.profile===profileKey()),week=7*86400000,now=Date.now(),recent=h.filter(x=>now-new Date(x.at).getTime()<=week);
    if(!recent.length)return '';
    const tokens=unique(recent.map(x=>x.token));
    const spoken=recent.filter(x=>x.speech==='recognized'||x.speech==='caregiver').length;
    let retry='';
    const grouped={};for(const x of h){(grouped[x.token]??=[]).push(x)}
    for(const [token,rows] of Object.entries(grouped)){if(rows.length>=2&&rows.at(-1).traceAttempts<rows.at(-2).traceAttempts){retry=`Recent tracing of ${esc(token)} used fewer retries than the previous recorded attempt.`;break}}
    return `<section class="trace-progress-card"><div class="story-illustration">✏️</div><div><span class="eyebrow">TRACE & SAY</span><h2>${tokens.length} character${tokens.length===1?'':'s'} traced this week.</h2><p>${esc(tokens.slice(0,12).join(', '))}${tokens.length>12?'…':''}. ${spoken} included recognised or caregiver-confirmed spoken practice.</p>${retry?`<small>${retry}</small>`:''}<button class="btn ghost" data-action="traceLaunch">Open Trace & Say</button></div></section>`;
  }
  function preview(){
    readConfig();if(!draft.selected.length){toast('Choose at least one item first.');return}
    const token=draft.selected[0],ch=draft.type==='numbers'?[...String(token)][0]:token,g=TRACE_GLYPHS[ch];if(!g)return;
    show(`<div class="trace-preview"><button class="btn ghost" data-trace-type="${draft.type}">← Back</button><span class="eyebrow">FORMATION PREVIEW</span><h1>${esc(token)}</h1><svg viewBox="0 0 1000 1000">${g.strokes.map((s,i)=>`<path d="${s.d}" class="preview-stroke s${i%4}"/>`).join('')}</svg><p>Strokes are completed in the displayed order. In the child activity, only one stroke is active at a time.</p></div>`,true);
  }
  async function handleClick(el){
    const typeBtn=el.closest('[data-trace-type]');
    if(typeBtn&&!el.closest('[data-action="traceAgain"],[data-action="traceChooseNew"]')){config(typeBtn.dataset.traceType);return true}
    const tokenBtn=el.closest('[data-trace-token]');if(tokenBtn){toggleToken(tokenBtn.dataset.traceToken,tokenBtn);return true}
    const presetBtn=el.closest('[data-trace-preset]');if(presetBtn){preset(presetBtn.dataset.tracePreset);return true}
    const a=el.closest('[data-action]')?.dataset.action;if(!a||!a.startsWith('trace'))return false;
    if(a==='traceLaunch'){launch();return true}
    if(a==='traceStart'){await start();return true}
    if(a==='tracePreview'){preview();return true}
    if(a==='traceRestartSet'){await restartSavedSet(draft?.type||'letters');return true}
    if(a==='traceHear'){speakToken(runtime.token,true);return true}
    if(a==='traceShowMe'){showDemo();return true}
    if(a==='traceRetryStroke'){retryStroke();return true}
    if(a==='traceStartOver'){restartItem();return true}
    if(a==='traceListen'){listen();return true}
    if(a==='traceCaregiverConfirm'){await finishSpeech('caregiver');return true}
    if(a==='traceSpeechSkip'){await finishSpeech('skipped');return true}
    if(a==='traceNextNow'){advanceToken();return true}
    if(a==='traceAgain'){await again(el.closest('[data-trace-type]')?.dataset.traceType||runtime?.type||'letters');return true}
    if(a==='traceChooseNew'){cleanup();config(el.closest('[data-trace-type]')?.dataset.traceType||runtime?.type||'letters');return true}
    if(a==='traceExit'){exit();return true}
    return false;
  }
  const validationErrors=validateTraceGlyphs();
  if(validationErrors.length)console.error('WAPS Trace glyph validation',validationErrors);
  return {launch,handleClick,progressHTML,cleanup,validationErrors};
}
