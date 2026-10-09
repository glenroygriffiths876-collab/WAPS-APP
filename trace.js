import {TRACE_GLYPHS,TRACE_UPPER,TRACE_LOWER,TRACE_REQUIRED,validateTraceGlyphs} from './trace-data.js';

export function createTraceFeature(ctx){
  const {getState,persist,active,show,toast,main,modal,go,esc,celebrate,voice}=ctx;
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const NUMBER_BUTTONS=Array.from({length:21},(_,i)=>String(i));
  const autoVoice=()=>getState().settings?.autoVoice!==false;
  const clone=v=>JSON.parse(JSON.stringify(v));
  const DEFAULTS={
    letters:{type:'letters',selected:['A','B','C','D','E','F'],traceMode:'easy',guidance:'guided',lineSize:'medium',letterAudio:'name'},
    numbers:{type:'numbers',selected:['0','1','2','3','4','5'],traceMode:'easy',guidance:'guided',lineSize:'medium',letterAudio:'name'},
    words:{type:'words',selected:[],traceMode:'easy',guidance:'guided',lineSize:'medium',letterAudio:'name',showPictureDuringTrace:true}
  };
  const LETTER_NAMES={A:'ay',B:'bee',C:'see',D:'dee',E:'ee',F:'eff',G:'gee',H:'aitch',I:'eye',J:'jay',K:'kay',L:'el',M:'em',N:'en',O:'oh',P:'pee',Q:'cue',R:'ar',S:'ess',T:'tee',U:'you',V:'vee',W:'double you',X:'ex',Y:'why',Z:'zed'};
  const LETTER_EXAMPLES={A:'apple',B:'ball',C:'cat',D:'dog',E:'egg',F:'fish',G:'go',H:'hat',I:'igloo',J:'jump',K:'kite',L:'lion',M:'mango',N:'nose',O:'orange',P:'pen',Q:'queen',R:'run',S:'sun',T:'tree',U:'umbrella',V:'van',W:'water',X:'box',Y:'yam',Z:'zebra'};
  const ONES=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
  const TENS=['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
  let draft=null,runtime=null,recognition=null,advanceTimer=null,demoRAF=0,customCase='upper';

  function state(){
    const S=getState();
    if(!S.trace||typeof S.trace!=='object')S.trace={prefs:{},sessions:{},history:[]};
    S.trace.prefs=S.trace.prefs||{};
    S.trace.sessions=S.trace.sessions||{};
    S.trace.wordLibrary=S.trace.wordLibrary||{};
    S.trace.history=Array.isArray(S.trace.history)?S.trace.history:[];
    return S.trace;
  }
  const profileKey=()=>getState().active||'global';
  function bucket(obj,key){if(!obj[key])obj[key]={};return obj[key]}
  function wordLibrary(){const t=state(),list=t.wordLibrary?.[profileKey()];return Array.isArray(list)?list:[]}
  function wordById(id){return wordLibrary().find(x=>x.id===id)||null}
  function wordPictureHTML(rec,cls=''){if(!rec?.image)return '';let src='';if(rec.image.source==='waps'&&rec.image.id)src='./assets/concepts/highres/'+encodeURIComponent(rec.image.id)+'.webp';else if(rec.image.source==='upload'&&rec.image.data)src=rec.image.data;return src?`<img class="${cls}" src="${src}" alt="${esc(rec.word)} picture">`:''}
  function prefs(type){
    const t=state(),b=bucket(t.prefs,profileKey());
    b[type]={...clone(DEFAULTS[type]),...(b[type]||{})};
    if(!['easy','guided','formation'].includes(b[type].traceMode))b[type].traceMode='easy';
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
  function signature(items,p){return JSON.stringify([items,p.traceMode||'easy',p.guidance,p.lineSize,p.letterAudio,p.showPictureDuringTrace!==false])}
  function stopMedia(){
    try{recognition?.abort()}catch{} recognition=null;
    if(demoRAF)cancelAnimationFrame(demoRAF);demoRAF=0;
    clearTimeout(advanceTimer);advanceTimer=null;
    if(voice?.stop)voice.stop();else if('speechSynthesis'in window)speechSynthesis.cancel();
  }
  function cleanup(){
    stopMedia();document.body.classList.remove('trace-active','trace-say-active');
  }

  function launch(){
    cleanup();
    const ls=session('letters'),ns=session('numbers'),ws=session('words');
    const lp=ls&&ls.cursor<ls.items.length?ls.cursor+'/'+ls.items.length:null;
    const np=ns&&ns.cursor<ns.items.length?ns.cursor+'/'+ns.items.length:null;
    const wp=ws&&ws.cursor<ws.items.length?ws.cursor+'/'+ws.items.length:null;
    show(`<div class="trace-launch simple-trace-launch"><span class="eyebrow">TRACE & SAY</span><h1>Choose one.</h1><div class="trace-type-grid">
      <button data-trace-type="letters"><span class="trace-choice-mark">Aa</span><b>Letters</b><small>${lp?'Continue '+lp:'A–Z · a–z'}</small></button>
      <button data-trace-type="numbers"><span class="trace-choice-mark">123</span><b>Numbers</b><small>${np?'Continue '+np:'0–20 or your numbers'}</small></button>
      <button data-action="traceWordsLaunch"><span class="trace-word-launch-mark">Aa</span><b>Words & Names</b><small>${wp?'Continue '+wp:'Names · sight words · spelling'}</small></button>
    </div></div>`,true);
  }
  function config(type){
    const p=prefs(type);draft={...clone(p),type,selected:[...(p.selected||DEFAULTS[type].selected)]};customCase='upper';
    renderConfig();
  }
  function presetTokens(code){
    if(draft.type==='letters'){
      if(code==='upper')return [...TRACE_UPPER];
      if(code==='lower')return [...TRACE_LOWER];
      if(code==='both')return [...TRACE_UPPER,...TRACE_LOWER];
      if(code==='af')return 'ABCDEF'.split('');
      if(code==='gl')return 'GHIJKL'.split('');
      if(code==='mr')return 'MNOPQR'.split('');
      if(code==='sz')return 'STUVWXYZ'.split('');
      if(code==='name')return cleanNameLetters();
      return [];
    }
    const top=code==='05'?5:code==='09'?9:code==='010'?10:20;
    return Array.from({length:top+1},(_,i)=>String(i));
  }
  function sameSelection(items){
    const a=unique([...(draft.selected||[])]).sort(),b=unique([...(items||[])]).sort();
    return a.length===b.length&&a.every((x,i)=>x===b[i]);
  }
  function renderConfig(){
    const type=draft.type,isLetters=type==='letters',nameLetters=cleanNameLetters();
    const presets=isLetters
      ?[['af','First 6','A–F'],['gl','Next 6','G–L'],['upper','Capital letters','A–Z'],['lower','Small letters','a–z'],...(nameLetters.length?[['name','My name',nameLetters.join('')]]:[])]
      :[['05','First numbers','0–5'],['010','Up to 10','0–10'],['020','Up to 20','0–20']];
    show(`<div class="trace-config trace-quick-config"><button class="btn ghost trace-back" data-action="traceLaunch">← Trace & Say</button><span class="eyebrow">${isLetters?'LETTERS':'NUMBERS'}</span><h1>What should we practise?</h1><p class="trace-quick-help">Choose one. You can change it anytime.</p>
      <div class="trace-quick-grid">${presets.map(x=>`<button class="${sameSelection(presetTokens(x[0]))?'selected':''}" data-trace-preset="${x[0]}"><b>${x[1]}</b><small>${esc(x[2])}</small></button>`).join('')}</div>
      <button class="trace-specific-btn" data-action="traceChooseSpecific">＋ Choose specific ${isLetters?'letters':'numbers'}</button>
      <div class="trace-config-summary"><b id="traceSelectedCount">${draft.selected.length} selected</b><span>${esc(active()?.name||'Saved on this device')}</span></div>
      <div class="trace-quick-actions"><button class="btn trace-primary-start" data-action="traceStart">${resumePossible()?'Continue practice':'Start practice'}</button><button class="btn secondary" data-action="tracePracticeStyle">Practice style</button></div>
      ${session(draft.type)?'<button class="trace-restart-link" data-action="traceRestartSet">Restart saved set</button>':''}
    </div>`,true);
  }
  function renderSpecific(){
    const isLetters=draft.type==='letters';
    const tokens=isLetters?(customCase==='upper'?TRACE_UPPER:TRACE_LOWER):NUMBER_BUTTONS;
    show(`<div class="trace-config trace-specific-config"><button class="btn ghost trace-back" data-action="traceSpecificDone">← Quick setup</button><span class="eyebrow">CHOOSE SPECIFIC</span><h1>${isLetters?'Pick letters':'Pick numbers'}</h1>
      ${isLetters?`<div class="trace-case-switch"><button class="${customCase==='upper'?'selected':''}" data-trace-custom-case="upper">Capital A–Z</button><button class="${customCase==='lower'?'selected':''}" data-trace-custom-case="lower">Small a–z</button></div>`:''}
      <div class="trace-token-grid trace-token-grid-simple ${isLetters?'letters':'numbers'}">${tokens.map(t=>`<button class="${draft.selected.includes(t)?'selected':''}" data-trace-token="${esc(t)}">${esc(t)}</button>`).join('')}</div>
      ${!isLetters?`<div class="trace-custom-number-row"><label>Another number (0–99)<input id="traceCustomNumbers" type="number" min="0" max="99" inputmode="numeric" placeholder="e.g. 25"></label><button class="btn secondary" data-action="traceAddCustomNumber">Add</button></div>`:''}
      <div class="trace-config-summary"><b id="traceSelectedCount">${draft.selected.length} selected</b><span>Tap again to remove</span></div>
      <button class="btn trace-done-btn" data-action="traceSpecificDone">Done</button>
    </div>`,true);
  }
  function renderPracticeStyle(){
    const isLetters=draft.type==='letters';
    const option=(attr,value,label,sub='')=>`<button class="${draft[attr]===value?'selected':''}" data-trace-style="${attr}" data-trace-style-value="${value}"><b>${label}</b>${sub?`<small>${sub}</small>`:''}</button>`;
    show(`<div class="trace-config trace-style-config"><button class="btn ghost trace-back" data-action="traceStyleDone">← Quick setup</button><span class="eyebrow">PRACTICE STYLE</span><h1>How should WAPS help?</h1>
      <section class="trace-style-group"><b>How should tracing work?</b><div class="trace-style-options trace-mode-options">${option('traceMode','easy','Easy tracing','Start anywhere')}${option('traceMode','guided','Guided tracing','Suggested start')}${option('traceMode','formation','Writing practice','Stroke order')}</div></section>
      <section class="trace-style-group"><b>Line size</b><div class="trace-style-options">${option('lineSize','large','Large')}${option('lineSize','medium','Medium')}${option('lineSize','small','Small')}</div></section>
      ${isLetters?`<section class="trace-style-group"><b>When Hear is tapped</b><div class="trace-style-options">${option('letterAudio','name','Letter name')}${option('letterAudio','sound','Sound + example')}${option('letterAudio','both','Both')}</div></section>`:''}
      <div class="trace-style-footer"><button class="btn" data-action="traceStyleDone">Done</button><button class="btn secondary" data-action="tracePreview">Preview formation</button></div>
    </div>`,true);
  }
  function resumePossible(){
    const s=session(draft.type);return !!(s&&s.cursor<s.items.length&&s.signature===signature(draft.selected,draft));
  }
  function preset(code){
    draft.selected=presetTokens(code);
    renderConfig();
  }
  function toggleToken(token,button){
    const has=draft.selected.includes(token);
    draft.selected=has?draft.selected.filter(x=>x!==token):[...draft.selected,token];
    button?.classList.toggle('selected',!has);
    const out=$('#traceSelectedCount');if(out)out.textContent=draft.selected.length+' selected';
  }
  function readConfig(){
    if(draft.type==='numbers')draft.selected=unique(draft.selected).sort((a,b)=>Number(a)-Number(b));
    else draft.selected=unique(draft.selected);
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
    if(type==='words'){
      const rec=wordById(token);if(!rec)return null;
      return {type,token:rec.word,wordId:rec.id,wordRecord:rec,chars:[...rec.word],digitIndex:0,strokeIndex:0,strokeAttempts:0,totalAttempts:0,pointerAttempts:0,touched:false,recorded:false,started:Date.now(),wordStage:'trace',buildTiles:null,buildPlaced:[]};
    }
    return {type,token,chars:type==='numbers'?[...String(token)]:[String(token)],digitIndex:0,strokeIndex:0,strokeAttempts:0,totalAttempts:0,pointerAttempts:0,touched:false,recorded:false,started:Date.now()};
  }
  function traceWidth(){
    const p=currentPrefs(runtime.type);return p.lineSize==='small'?48:p.lineSize==='large'?88:68;
  }
  function traceMode(){const m=currentPrefs(runtime.type)?.traceMode;return ['easy','guided','formation'].includes(m)?m:'easy'}
  function guideOpacity(){
    const p=currentPrefs(runtime.type),mode=traceMode();if(runtime?.type==='words'&&runtime.wordStage==='try')return .12;
    if(mode==='easy')return .40;if(mode==='guided')return .32;if(p.guidance!=='fade')return .28;
    const recent=state().history.filter(x=>x.profile===profileKey()&&x.token===runtime.token).slice(-3).length;
    return Math.max(.09,.25-recent*.05);
  }
  function activeChar(){return runtime.chars[runtime.digitIndex]}
  function glyph(){return TRACE_GLYPHS[activeChar()]}
  function tokenContext(){
    if(runtime.type==='words'){
      const pic=currentPrefs('words').showPictureDuringTrace!==false?wordPictureHTML(runtime.wordRecord,'trace-word-trace-picture'):'';
      return `<div class="trace-word-context">${pic?`<div class="trace-word-cue">${pic}</div>`:''}<div class="trace-word-progress"><strong>${esc(runtime.token)}</strong><div>${runtime.chars.map((d,i)=>`<span class="${i<runtime.digitIndex?'done':i===runtime.digitIndex?'active':''}">${esc(d)}</span>`).join('')}</div></div></div>`;
    }
    if(runtime.type!=='numbers'||runtime.chars.length===1)return '';
    return `<div class="trace-number-context">${runtime.chars.map((d,i)=>`<span class="${i<runtime.digitIndex?'done':i===runtime.digitIndex?'active':''}">${d}</span>`).join('')}</div>`;
  }
  function renderCurrent(type){
    stopMedia();const s=currentSession(type);if(!s||s.cursor>=s.items.length){finishSet(type);return}
    const token=currentToken(type);runtime=newRuntime(type,token);
    if(!runtime){s.cursor++;persist().catch(()=>{});advanceToken();return}
    if(type==='words'){showWordIntro();return}
    renderTraceScreen();setTimeout(()=>speakToken(token,false),250);
  }
  function showWordIntro(){
    stopMedia();document.body.classList.add('trace-active');document.body.classList.remove('trace-say-active');
    const s=currentSession('words'),pic=wordPictureHTML(runtime.wordRecord,'trace-word-intro-picture');
    main.innerHTML=`<div class="trace-word-intro"><header class="trace-child-head"><button data-action="traceExit" class="trace-caregiver-back" aria-label="Exit word practice">←</button><div><span>WORDS & NAMES</span><b>See it. Hear it. Trace it.</b></div><div class="trace-count">${s.cursor+1} / ${s.items.length}</div></header><div class="trace-word-intro-card">${pic?`<div class="trace-word-intro-image">${pic}</div>`:''}<span class="eyebrow">YOUR WORD</span><h1>${esc(runtime.token)}</h1><div class="trace-word-letter-row">${runtime.chars.map(ch=>`<span>${esc(ch)}</span>`).join('')}</div><div class="trace-word-intro-actions"><button class="btn secondary" data-action="traceWordHear">🔊 Hear word</button><button class="btn" data-action="traceWordBegin">Start tracing →</button></div></div></div>`;
    setTimeout(()=>speakWord(),240);
  }
  function renderMultiNumberTraceScreen(){
    stopMedia();document.body.classList.add('trace-active');document.body.classList.remove('trace-say-active');
    const s=currentSession('numbers'),p=currentPrefs('numbers'),mode=traceMode(),formation=mode==='formation',w=traceWidth();
    const activeIndex=Math.max(0,Math.min(runtime.chars.length-1,runtime.digitIndex||0));
    const panels=runtime.chars.map((ch,i)=>{
      const g=TRACE_GLYPHS[ch];if(!g)return '';
      const done=i<activeIndex,active=i===activeIndex,stateClass=done?'done':active?'active':'upcoming';
      if(active){
        const showLines=formation;
        return `<div class="trace-digit-panel ${stateClass}" data-digit-index="${i}" aria-label="Trace digit ${esc(ch)}">
          <svg id="traceSvg" class="trace-svg" viewBox="0 0 1000 1000" role="img" aria-label="Trace ${esc(ch)}" touch-action="none">
            ${showLines?'<path class="trace-writing-line" d="M120 120 H880"/><path class="trace-writing-line mid" d="M120 410 H880"/><path class="trace-writing-line base" d="M120 820 H880"/><path class="trace-writing-line desc" d="M120 960 H880"/>':''}
            ${g.strokes.map((st,si)=>{const guideClass=formation?`${si<runtime.strokeIndex?'complete':''} ${si===runtime.strokeIndex?'active':''}`:'flex';const brightClass=formation?(si<runtime.strokeIndex?'complete':si===runtime.strokeIndex?'active':''):'';return `<path id="traceGuide${si}" class="trace-guide ${guideClass}" d="${st.d}" style="--trace-w:${w}px;--guide-opacity:${guideOpacity()}"/><path id="traceBright${si}" class="trace-bright ${brightClass}" d="${st.d}" style="--trace-w:${w}px"/>`}).join('')}
            <polyline id="traceLive" class="trace-live" points="" style="--trace-w:${Math.max(22,w*.42)}px"/>
            <circle id="traceStartDot" class="trace-start-dot ${mode==='easy'?'hidden':''}" r="${Math.max(28,w*.42)}"/>
            <circle id="traceDemoDot" class="trace-demo-dot" r="${Math.max(22,w*.34)}"/>
          </svg>
        </div>`;
      }
      return `<div class="trace-digit-panel ${stateClass}" data-digit-index="${i}" aria-label="${done?'Completed':'Next'} digit ${esc(ch)}">
        <svg class="trace-svg trace-static-digit" viewBox="0 0 1000 1000" aria-hidden="true">
          ${g.strokes.map(st=>`<path class="trace-guide trace-static-guide ${done?'complete':''}" d="${st.d}" style="--trace-w:${w}px;--guide-opacity:${done?'.95':'.24'}"/>`).join('')}
        </svg>
      </div>`;
    }).join('');
    const ch=runtime.chars[activeIndex],statusText=formation?`Trace ${esc(ch)}. Start at the glowing dot.`:mode==='guided'?`Trace ${esc(ch)}. The dot is only a guide.`:`Trace ${esc(ch)}. Start anywhere on it.`;
    main.innerHTML=`<div class="trace-child-screen trace-number-multi-screen">
      <header class="trace-child-head"><button data-action="traceExit" class="trace-caregiver-back" aria-label="Exit tracing">←</button><div><span>TRACE & SAY</span><b>Trace ${esc(runtime.token)}</b></div><div class="trace-count">${s.cursor+1} / ${s.items.length}</div></header>
      <div class="trace-multi-number-wrap trace-mode-${mode}">
        ${panels}
        <div id="traceStatus" class="trace-status trace-multi-status">${statusText}</div>
      </div>
      <div class="trace-child-controls"><button class="btn ghost" data-action="toggleAutoVoice" aria-pressed="${autoVoice()?'true':'false'}">${autoVoice()?'🔊 Auto voice on':'🔇 Auto voice off'}</button><button data-action="traceHear">🔊 Hear it again</button><button data-action="traceShowMe">👆 Show me</button><button data-action="traceRetryStroke">${formation?'↶ Try stroke':'↶ Clear trace'}</button><button data-action="traceStartOver">↺ Start item over</button></div>
    </div>`;
    requestAnimationFrame(formation?initStroke:initFlexibleTrace);
  }

  function renderTraceScreen(){
    if(runtime?.type==='numbers'&&runtime.chars.length>1){renderMultiNumberTraceScreen();return}
    stopMedia();document.body.classList.add('trace-active');document.body.classList.remove('trace-say-active');
    const s=currentSession(runtime.type),p=currentPrefs(runtime.type),g=glyph(),mode=traceMode();
    if(!g){toast('This tracing character is unavailable.');advanceToken('skipped');return}
    const w=traceWidth(),formation=mode==='formation',showLines=formation&&!(runtime.type==='words'&&runtime.wordStage==='try');
    const wordMode=runtime.type==='words',stageLabel=wordMode&&runtime.wordStage==='try'?'TRY':'TRACE & SAY';
    const traceLabel=wordMode?`Trace ${esc(activeChar())} in ${esc(runtime.token)}`:`Trace ${esc(runtime.token)}`;
    const initialStatus=formation?'Start at the glowing dot.':mode==='guided'?'Trace the shape. The dot shows one suggested start.':'Trace the shape. Start anywhere.';
    main.innerHTML=`<div class="trace-child-screen ${wordMode?'trace-word-child':''}">
      <header class="trace-child-head"><button data-action="traceExit" class="trace-caregiver-back" aria-label="Exit tracing">←</button><div><span>${stageLabel}</span><b>${traceLabel}</b></div><div class="trace-count">${s.cursor+1} / ${s.items.length}</div></header>
      ${tokenContext()}
      <div class="trace-canvas-wrap ${p.guidance} trace-mode-${mode} ${wordMode&&runtime.wordStage==='try'?'trace-try-guide':''}" id="traceCanvasWrap">
        <svg id="traceSvg" class="trace-svg" viewBox="0 0 1000 1000" role="img" aria-label="Trace ${esc(activeChar())}" touch-action="none">
          ${showLines?'<path class="trace-writing-line" d="M120 120 H880"/><path class="trace-writing-line mid" d="M120 410 H880"/><path class="trace-writing-line base" d="M120 820 H880"/><path class="trace-writing-line desc" d="M120 960 H880"/>':''}
          ${g.strokes.map((st,i)=>{const guideClass=formation?`${i<runtime.strokeIndex?'complete':''} ${i===runtime.strokeIndex?'active':''}`:'flex';const brightClass=formation?(i<runtime.strokeIndex?'complete':i===runtime.strokeIndex?'active':''):'';return `<path id="traceGuide${i}" class="trace-guide ${guideClass}" d="${st.d}" style="--trace-w:${w}px;--guide-opacity:${guideOpacity()}"/><path id="traceBright${i}" class="trace-bright ${brightClass}" d="${st.d}" style="--trace-w:${w}px"/>`}).join('')}
          <polyline id="traceLive" class="trace-live" points="" style="--trace-w:${Math.max(22,w*.42)}px"/>
          <circle id="traceStartDot" class="trace-start-dot ${mode==='easy'?'hidden':''}" r="${Math.max(28,w*.42)}"/>
          <circle id="traceDemoDot" class="trace-demo-dot" r="${Math.max(22,w*.34)}"/>
        </svg>
        <div id="traceStatus" class="trace-status">${initialStatus}</div>
      </div>
      <div class="trace-child-controls"><button class="btn ghost" data-action="toggleAutoVoice" aria-pressed="${autoVoice()?'true':'false'}">${autoVoice()?'🔊 Auto voice on':'🔇 Auto voice off'}</button><button data-action="traceHear">🔊 ${wordMode?'Hear word':'Hear it again'}</button><button data-action="traceShowMe">👆 Show me</button><button data-action="traceRetryStroke">${formation?'↶ Try stroke':'↶ Clear trace'}</button><button data-action="traceStartOver">↺ Start item over</button></div>
    </div>`;
    requestAnimationFrame(formation?initStroke:initFlexibleTrace);
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
      if(e.pointerType==='touch'&&Math.max(e.width||0,e.height||0)>95)return;
      if(dist(pt,start)>tolerance*1.55){status('Start at the glowing dot.');pulse();return}
      runtime.pointerAttempts++;runtime.touched=true;tracing=true;pointerId=e.pointerId;index=0;accepted=[pt];last=pt;try{svg.setPointerCapture(pointerId)}catch{};status('Follow the line.');
    };
    svg.onpointermove=e=>{
      if(!tracing||e.pointerId!==pointerId)return;e.preventDefault();
      const events=e.getCoalescedEvents?.()||[e];for(const ev of events)process(ev);
    };
    const end=e=>{
      if(!tracing||e.pointerId!==pointerId)return;e.preventDefault();tracing=false;try{svg.releasePointerCapture(pointerId)}catch{}
      const progress=index/(count-1),nearEnd=last?dist(last,samples[count-1])<=tolerance*1.7:false;
      if(progress>=.86&&nearEnd){completeStroke()}else{
        runtime.strokeAttempts++;runtime.totalAttempts++;index=0;accepted=[];bright.style.strokeDashoffset=String(len);live.setAttribute('points','');
        const extra=runtime.strokeAttempts>=2;status(extra?'Let’s try together. The guide will be a little easier.':'Almost. Try this line again.');
        setTimeout(()=>{renderTraceScreen();if(extra)setTimeout(showDemo,260)},650);
      }
    };
    svg.onpointerup=end;svg.onpointercancel=end;
  }
  function initFlexibleTrace(){
    const svg=$('#traceSvg'),live=$('#traceLive'),startDot=$('#traceStartDot'),g=glyph(),mode=traceMode();
    if(!svg||!live||!startDot||!g?.strokes?.length)return;
    const p=currentPrefs(runtime.type),baseTol=p.lineSize==='small'?62:p.lineSize==='large'?106:84;
    const tolerance=baseTol+(mode==='easy'?18:8),threshold=mode==='easy'?.64:.72;
    const tracks=g.strokes.map((st,i)=>{
      const path=$('#traceGuide'+i),bright=$('#traceBright'+i),len=path.getTotalLength(),count=Math.max(24,Math.ceil(len/10));
      const samples=Array.from({length:count},(_,n)=>path.getPointAtLength(len*n/(count-1)));
      return {i,path,bright,len,count,samples,covered:new Uint8Array(count),complete:false,short:len<90,closed:dist(samples[0],samples[count-1])<=tolerance*1.25};
    });
    const suggested=tracks[0].samples[0];startDot.setAttribute('cx',suggested.x);startDot.setAttribute('cy',suggested.y);
    let tracing=false,pointerId=null,currentStroke=-1,currentIndex=-1,lastAccepted=null,gesture=[],hadAccepted=false,done=false;
    const status=t=>{const o=$('#traceStatus');if(o)o.textContent=t};
    const ratio=t=>{let n=0;for(const v of t.covered)n+=v;return n/t.count};
    const markRange=(t,a,b)=>{
      if(t.short){t.covered.fill(1);return}
      const lo=Math.max(0,Math.min(a,b)-2),hi=Math.min(t.count-1,Math.max(a,b)+2);
      for(let i=lo;i<=hi;i++)t.covered[i]=1;
    };
    const markPoint=(t,i)=>markRange(t,i,i);
    const refresh=()=>{
      let all=true,firstIncomplete=0;
      tracks.forEach(t=>{
        const r=ratio(t);t.complete=r>=threshold;
        t.path.classList.toggle('partial',r>0&&!t.complete);
        t.path.classList.toggle('complete',t.complete);
        t.bright.classList.toggle('complete',t.complete);
        if(!t.complete&&all){all=false;firstIncomplete=t.i}
      });
      runtime.demoStrokeIndex=firstIncomplete;return all;
    };
    const nearestGlobal=pt=>{
      let best={s:-1,i:-1,d:Infinity};
      for(const t of tracks)for(let i=0;i<t.count;i++){const d=dist(pt,t.samples[i]);if(d<best.d)best={s:t.i,i,d}}
      return best;
    };
    const saveGesture=()=>{
      if(gesture.length>1){
        const poly=document.createElementNS('http://www.w3.org/2000/svg','polyline');
        poly.setAttribute('class','trace-live trace-live-saved');poly.setAttribute('style',live.getAttribute('style')||'');
        poly.setAttribute('points',gesture.map(q=>q.x.toFixed(1)+','+q.y.toFixed(1)).join(' '));svg.insertBefore(poly,live);
      }
      gesture=[];live.setAttribute('points','');
    };
    const completeNow=()=>{if(done)return;done=true;tracing=false;saveGesture();status('Nice tracing!');setTimeout(completeFlexibleCharacter,180)};
    const process=e=>{
      if(done)return;const pt=svgPoint(svg,e),n=nearestGlobal(pt);
      if(n.d>tolerance){status('Stay close to the shape.');return}
      const t=tracks[n.s],jump=lastAccepted?dist(pt,lastAccepted.pt):0;
      if(lastAccepted&&jump>260){status('Keep your finger near the shape.');return}
      if(currentStroke===n.s&&currentIndex>=0){
        const delta=Math.abs(n.i-currentIndex),allowance=Math.max(10,Math.ceil(jump/7)+9);
        if(t.closed&&delta>t.count*.65){
          if(currentIndex>t.count*.7&&n.i<t.count*.3){markRange(t,currentIndex,t.count-1);markRange(t,0,n.i)}
          else if(n.i>t.count*.7&&currentIndex<t.count*.3){markRange(t,0,currentIndex);markRange(t,n.i,t.count-1)}
          else markPoint(t,n.i);
        }else if(delta<=allowance)markRange(t,currentIndex,n.i);else markPoint(t,n.i);
      }else markPoint(t,n.i);
      currentStroke=n.s;currentIndex=n.i;lastAccepted={pt,s:n.s,i:n.i};gesture.push(pt);hadAccepted=true;
      live.setAttribute('points',gesture.slice(-100).map(q=>q.x.toFixed(1)+','+q.y.toFixed(1)).join(' '));
      status(mode==='guided'?'Keep following the shape. The dot is only a guide.':'Keep tracing the shape.');
      if(refresh())completeNow();
    };
    svg.onpointerdown=e=>{
      if(done||e.isPrimary===false)return;e.preventDefault();const pt=svgPoint(svg,e);
      if(e.pointerType==='touch'&&Math.max(e.width||0,e.height||0)>95)return;
      const n=nearestGlobal(pt);
      if(n.d>tolerance*1.65){status('Touch anywhere on the shape to begin.');tracks[n.s]?.path?.classList.add('trace-pulse');setTimeout(()=>tracks[n.s]?.path?.classList.remove('trace-pulse'),650);return}
      runtime.pointerAttempts++;runtime.touched=true;tracing=true;pointerId=e.pointerId;currentStroke=-1;currentIndex=-1;lastAccepted=null;gesture=[];hadAccepted=false;
      try{svg.setPointerCapture(pointerId)}catch{};process(e);
    };
    svg.onpointermove=e=>{if(!tracing||e.pointerId!==pointerId||done)return;e.preventDefault();const events=e.getCoalescedEvents?.()||[e];for(const ev of events)process(ev)};
    const end=e=>{
      if(!tracing||e.pointerId!==pointerId||done)return;e.preventDefault();tracing=false;try{svg.releasePointerCapture(pointerId)}catch{}
      saveGesture();currentStroke=-1;currentIndex=-1;lastAccepted=null;
      if(!hadAccepted){runtime.totalAttempts++;status('Touch the shape and try again.');return}
      if(refresh()){completeNow();return}status('Good. Keep going — touch any unfinished part.');
    };
    svg.onpointerup=end;svg.onpointercancel=end;
  }
  function completeFlexibleCharacter(){
    if(!runtime)return;runtime.strokeAttempts=0;runtime.demoStrokeIndex=0;
    if(runtime.digitIndex<runtime.chars.length-1){runtime.digitIndex++;runtime.strokeIndex=0;setTimeout(renderTraceScreen,180);return}
    if(runtime.type==='words'){setTimeout(()=>runtime.wordStage==='try'?showSayStage():showBuildStage(),240);return}
    setTimeout(showSayStage,240);
  }
  function completeStroke(){
    runtime.strokeIndex++;runtime.strokeAttempts=0;
    const g=glyph();
    if(runtime.strokeIndex<g.strokes.length){setTimeout(renderTraceScreen,180);return}
    if(runtime.digitIndex<runtime.chars.length-1){runtime.digitIndex++;runtime.strokeIndex=0;setTimeout(renderTraceScreen,220);return}
    if(runtime.type==='words'){setTimeout(()=>runtime.wordStage==='try'?showSayStage():showBuildStage(),260);return}
    setTimeout(showSayStage,260);
  }
  function retryStroke(){
    if(!runtime)return;runtime.strokeAttempts++;runtime.totalAttempts++;renderTraceScreen();
  }
  function restartItem(){
    if(!runtime)return;runtime=newRuntime(runtime.type,runtime.type==='words'?runtime.wordId:runtime.token);renderTraceScreen();
  }
  function showDemo(){
    if(!runtime)return;const demoIndex=traceMode()==='formation'?runtime.strokeIndex:Number(runtime.demoStrokeIndex||0),path=$('#traceGuide'+demoIndex),dot=$('#traceDemoDot');if(!path||!dot)return;
    if(demoRAF)cancelAnimationFrame(demoRAF);const len=path.getTotalLength(),start=performance.now(),dur=Math.max(900,Math.min(1800,len*1.45));dot.classList.add('show');
    const tick=t=>{const p=Math.min(1,(t-start)/dur),pt=path.getPointAtLength(len*p);dot.setAttribute('cx',pt.x);dot.setAttribute('cy',pt.y);if(p<1)demoRAF=requestAnimationFrame(tick);else{dot.classList.remove('show');demoRAF=0}};
    demoRAF=requestAnimationFrame(tick);
  }
  function shuffle(list){const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
  function showBuildStage(){
    stopMedia();document.body.classList.add('trace-active');
    if(!runtime.buildTiles){runtime.buildTiles=shuffle(runtime.chars.map((ch,i)=>({id:'tile-'+i+'-'+crypto.randomUUID().slice(0,6),ch,index:i})));runtime.buildPlaced=[]}
    const pic=wordPictureHTML(runtime.wordRecord,'trace-build-picture'),nextIndex=runtime.buildPlaced.length;
    main.innerHTML=`<div class="trace-build-screen"><header class="trace-child-head"><button data-action="traceExit" class="trace-caregiver-back">←</button><div><span>BUILD</span><b>Build ${esc(runtime.token)}</b></div><div class="trace-count">${nextIndex} / ${runtime.chars.length}</div></header><div class="trace-build-card">${pic?`<div class="trace-build-image">${pic}</div>`:''}<h1>${esc(runtime.token)}</h1><div class="trace-build-slots">${runtime.chars.map((ch,i)=>`<span class="${i<nextIndex?'filled':i===nextIndex?'active':''}">${i<nextIndex?esc(ch):''}</span>`).join('')}</div><p id="traceBuildStatus">Tap the next letter.</p><div class="trace-build-tiles">${runtime.buildTiles.map(t=>`<button data-trace-build-id="${t.id}" ${runtime.buildPlaced.includes(t.id)?'disabled':''}>${esc(t.ch)}</button>`).join('')}</div></div></div>`;
  }
  function chooseBuildTile(id){
    if(!runtime||runtime.type!=='words')return;
    const tile=runtime.buildTiles?.find(x=>x.id===id);if(!tile||runtime.buildPlaced.includes(id))return;
    const expected=runtime.chars[runtime.buildPlaced.length];
    if(tile.ch.toLowerCase()!==String(expected).toLowerCase()){const b=$$('[data-trace-build-id]').find(x=>x.dataset.traceBuildId===id);b?.classList.add('try-again');setTimeout(()=>b?.classList.remove('try-again'),500);const st=$('#traceBuildStatus');if(st)st.textContent='Try again. Look at the next letter.';return}
    runtime.buildPlaced.push(id);
    if(runtime.buildPlaced.length>=runtime.chars.length){celebrate?.(null);setTimeout(showTryStage,450);return}
    showBuildStage();
  }
  function showTryStage(){
    stopMedia();document.body.classList.add('trace-active');
    const pic=wordPictureHTML(runtime.wordRecord,'trace-try-picture');
    main.innerHTML=`<div class="trace-try-screen"><header class="trace-child-head"><button data-action="traceExit" class="trace-caregiver-back">←</button><div><span>TRY</span><b>One more time</b></div><div></div></header><div class="trace-try-card">${pic?`<div class="trace-try-image">${pic}</div>`:''}<span class="eyebrow">YOU BUILT</span><h1>${esc(runtime.token)}</h1><p>Try the word again with a lighter tracing guide, or continue if this is enough practice today.</p><div class="actions"><button class="btn" data-action="traceTryWord">Try with less help →</button><button class="btn ghost" data-action="traceTrySkip">Continue</button></div></div></div>`;
  }
  function startTryTrace(){
    if(!runtime||runtime.type!=='words')return;runtime.wordStage='try';runtime.digitIndex=0;runtime.strokeIndex=0;runtime.strokeAttempts=0;runtime.buildPlaced=[];renderTraceScreen();
  }
  function speakWord(force=false){if(!force&&!autoVoice())return;
    if(!runtime||runtime.type!=='words')return;
    if(voice?.speak){voice.speak(String(runtime.token),{mode:'learning',rate:.78});return}
    if(!('speechSynthesis'in window)||typeof SpeechSynthesisUtterance==='undefined')return;
    speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(String(runtime.token));u.rate=.78;u.pitch=1;speechSynthesis.speak(u);
  }
  function speakToken(token,withPrompt=true,force=false){if(!force&&!autoVoice())return;
    if(!voice?.speak&&(!('speechSynthesis'in window)||typeof SpeechSynthesisUtterance==='undefined'))return;
    if(voice?.stop)voice.stop();else if('speechSynthesis'in window)speechSynthesis.cancel();let text='';
    if(runtime?.type==='words'){text=withPrompt?'Trace '+activeChar()+' in '+String(token):String(token)}
    else if(runtime?.type==='numbers')text=numberWords(token);
    else{
      const upper=String(token).toUpperCase(),p=currentPrefs('letters'),name=LETTER_NAMES[upper]||upper,example=LETTER_EXAMPLES[upper];
      if(p.letterAudio==='sound')text=upper+' as in '+example;
      else if(p.letterAudio==='both')text=upper+'. '+upper+' as in '+example;
      else text=upper;
    }
    if(withPrompt&&runtime?.type!=='words')text='Trace '+text;
    if(voice?.speak){voice.speak(text,{mode:'learning',rate:.82});return}const u=new SpeechSynthesisUtterance(text);u.rate=.82;u.pitch=1;speechSynthesis.speak(u);
  }
  function showSayStage(){
    stopMedia();document.body.classList.add('trace-active','trace-say-active');
    const supported=!!(window.SpeechRecognition||window.webkitSpeechRecognition),spoken=runtime.type==='numbers'?numberWords(runtime.token):String(runtime.token);
    const pic=runtime.type==='words'?wordPictureHTML(runtime.wordRecord,'trace-say-picture'):'';
    main.innerHTML=`<div class="trace-say-screen"><header class="trace-child-head"><button data-action="traceExit" class="trace-caregiver-back">←</button><div><span>${runtime.type==='words'?'WORD COMPLETE':'TRACE COMPLETE'} ✓</span><b>Now say it.</b></div><div></div></header>
      <div class="trace-say-card">${pic?`<div class="trace-say-image">${pic}</div>`:''}<span class="eyebrow">SAY IT</span><div class="trace-say-token">${esc(runtime.token)}</div><p>Say “${esc(spoken)}”.</p>
      <div id="traceSpeechStatus" class="trace-speech-status">${supported?'Tap the microphone when you are ready.':'Your device cannot check speech automatically.'}</div>
      ${supported?'<button class="trace-mic" data-action="traceListen">🎤 <span>Say it</span></button>':''}
      <div class="trace-speech-fallback"><button data-action="traceCaregiverConfirm">👩🏽 Caregiver: I heard it</button><button data-action="traceSpeechSkip">Continue without voice →</button></div></div></div>`;
    setTimeout(()=>speakSayPrompt(),220);
  }
  function speakSayPrompt(){if(!autoVoice())return;
    let target=runtime.type==='numbers'?numberWords(runtime.token):String(runtime.token);
    if(voice?.speak){voice.speak('Now say '+target,{mode:'learning',rate:.82});return}
    if(!('speechSynthesis'in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance('Now say '+target);u.rate=.82;speechSynthesis.speak(u);
  }
  function normalizeSpeech(s){return String(s||'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim()}
  function speechMatches(transcript){
    const got=normalizeSpeech(transcript);
    if(runtime.type==='words')return got===normalizeSpeech(runtime.token);
    if(runtime.type==='numbers'){
      const target=String(Number(runtime.token)),word=numberWords(runtime.token);return got===target||got===word||got==='number '+target||got==='number '+word||(target==='0'&&got==='oh');
    }
    const L=String(runtime.token).toUpperCase(),low=L.toLowerCase(),name=normalizeSpeech(LETTER_NAMES[L]||L);
    const aliases=new Set([low,name,'letter '+low,'letter '+name]);
    const common={A:['hey'],B:['be','bee'],C:['sea','see'],D:['dee'],E:['e'],F:['eff'],G:['gee'],H:['aitch','h'],I:['eye'],J:['jay'],K:['kay'],L:['el'],M:['em'],N:['en'],O:['oh'],P:['pea','pee'],Q:['cue','queue'],R:['are','ar'],S:['ess'],T:['tea','tee'],U:['you'],V:['vee'],W:['double you','double u'],X:['ex'],Y:['why'],Z:['zee','zed']};
    (common[L]||[]).forEach(x=>aliases.add(x));return aliases.has(got);
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
    t.history.push({id:crypto.randomUUID(),profile:profileKey(),at:new Date().toISOString(),type:runtime.type,token:runtime.token,completed:true,traceAttempts:runtime.pointerAttempts,retries:runtime.totalAttempts,traceMode:currentPrefs(runtime.type).traceMode||'easy',guidance:currentPrefs(runtime.type).guidance,lineSize:currentPrefs(runtime.type).lineSize,speech:status});runtime.recorded=true;
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
    const unit=type==='letters'?'letters':type==='numbers'?'numbers':'words';
    const choose=type==='words'?'<button class="btn secondary" data-action="traceWordsLaunch">Choose words</button>':`<button class="btn secondary" data-action="traceChooseNew" data-trace-type="${type}">Choose new ${type}</button>`;
    main.innerHTML=`<div class="trace-finish-screen"><div class="trace-finish-star">★</div><span class="eyebrow">SET COMPLETE</span><h1>You finished this set!</h1><p>${s?.items?.length||0} ${unit} completed in Round ${s?.round||1}.</p><div class="trace-finish-actions"><button class="btn" data-action="traceAgain" data-trace-type="${type}">Practise again</button>${choose}<button class="btn ghost" data-action="traceExit">Done</button></div></div>`;
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
    const r=runtime;if(r?.touched&&!r.recorded){
      const t=state();t.history.push({id:crypto.randomUUID(),profile:profileKey(),at:new Date().toISOString(),type:r.type,token:r.token,completed:false,traceAttempts:r.pointerAttempts,retries:r.totalAttempts,traceMode:currentPrefs(r.type).traceMode||'easy',guidance:currentPrefs(r.type).guidance,lineSize:currentPrefs(r.type).lineSize,speech:'not completed'});if(t.history.length>500)t.history=t.history.slice(-500);persist().catch(()=>{});
    }
    cleanup();runtime=null;if(modal.open)modal.close();go('practice');
  }
  function progressHTML(){
    const h=state().history.filter(x=>x.profile===profileKey()),week=7*86400000,now=Date.now(),recent=h.filter(x=>x.completed!==false&&now-new Date(x.at).getTime()<=week);
    if(!recent.length)return '';
    const tokens=unique(recent.map(x=>x.token));
    const spoken=recent.filter(x=>x.speech==='recognized'||x.speech==='caregiver').length;
    let retry='';
    const grouped={};for(const x of h){(grouped[x.token]??=[]).push(x)}
    for(const [token,rows] of Object.entries(grouped)){const completed=rows.filter(x=>x.completed!==false);if(completed.length>=2&&(completed.at(-1).retries??0)<(completed.at(-2).retries??0)){retry=`Recent tracing of ${esc(token)} used fewer retries than the previous recorded attempt.`;break}}
    return `<section class="trace-progress-card"><div class="story-illustration">✏️</div><div><span class="eyebrow">TRACE & SAY</span><h2>${tokens.length} tracing item${tokens.length===1?'':'s'} practised this week.</h2><p>${esc(tokens.slice(0,12).join(', '))}${tokens.length>12?'…':''}. ${spoken} included recognised or caregiver-confirmed spoken practice.</p>${retry?`<small>${retry}</small>`:''}<button class="btn ghost" data-action="traceLaunch">Open Trace & Say</button></div></section>`;
  }
  async function startWordSet(ids,options={}){
    const valid=[...new Set(ids||[])].filter(id=>wordById(id));
    if(!valid.length){toast('Choose at least one saved word first.');return}
    const t=state(),pb=bucket(t.prefs,profileKey());
    pb.words={...clone(DEFAULTS.words),...(pb.words||{}),...options,selected:valid};
    const p=pb.words,sig=signature(valid,p);let s=session('words');
    if(!s||s.signature!==sig||!Array.isArray(s.items)||s.cursor>=s.items.length){
      s={type:'words',items:[...valid],cursor:0,round:(s?.round||0)+1,signature:sig,started:new Date().toISOString()};saveSession('words',s);
    }
    await persist();if(modal.open)modal.close();renderCurrent('words');
  }
  function preview(){
    readConfig();if(!draft.selected.length){toast('Choose at least one item first.');return}
    const token=draft.selected[0],ch=draft.type==='numbers'?[...String(token)][0]:token,g=TRACE_GLYPHS[ch];if(!g)return;
    show(`<div class="trace-preview"><button class="btn ghost" data-action="tracePreviewBack">← Back</button><span class="eyebrow">FORMATION PREVIEW</span><h1>${esc(token)}</h1><svg viewBox="0 0 1000 1000">${g.strokes.map((s,i)=>`<path d="${s.d}" class="preview-stroke s${i%4}"/>`).join('')}</svg><p>Easy tracing lets the child start anywhere and lift or keep their finger down. Writing practice uses the conventional stroke order shown here.</p></div>`,true);
  }
  async function handleClick(el){
    const buildBtn=el.closest('[data-trace-build-id]');if(buildBtn){chooseBuildTile(buildBtn.dataset.traceBuildId);return true}
    const typeBtn=el.closest('[data-trace-type]');
    if(typeBtn&&!el.closest('[data-action="traceAgain"],[data-action="traceChooseNew"]')){config(typeBtn.dataset.traceType);return true}
    const tokenBtn=el.closest('[data-trace-token]');if(tokenBtn){toggleToken(tokenBtn.dataset.traceToken,tokenBtn);return true}
    const presetBtn=el.closest('[data-trace-preset]');if(presetBtn){preset(presetBtn.dataset.tracePreset);return true}
    const caseBtn=el.closest('[data-trace-custom-case]');if(caseBtn){customCase=caseBtn.dataset.traceCustomCase==='lower'?'lower':'upper';renderSpecific();return true}
    const styleBtn=el.closest('[data-trace-style]');if(styleBtn){const k=styleBtn.dataset.traceStyle,v=styleBtn.dataset.traceStyleValue;if(['traceMode','guidance','lineSize','letterAudio'].includes(k)){draft[k]=v;renderPracticeStyle()}return true}
    const a=el.closest('[data-action]')?.dataset.action;if(!a||!a.startsWith('trace'))return false;
    if(a==='traceLaunch'){launch();return true}
    if(a==='traceChooseSpecific'){renderSpecific();return true}
    if(a==='traceSpecificDone'){renderConfig();return true}
    if(a==='tracePracticeStyle'){renderPracticeStyle();return true}
    if(a==='traceStyleDone'){renderConfig();return true}
    if(a==='tracePreviewBack'){renderPracticeStyle();return true}
    if(a==='traceAddCustomNumber'){const n=Number($('#traceCustomNumbers')?.value);if(Number.isInteger(n)&&n>=0&&n<=99){draft.selected=unique([...draft.selected,String(n)]).sort((a,b)=>Number(a)-Number(b));renderSpecific()}else toast('Enter a number from 0 to 99.');return true}
    if(a==='traceStart'){await start();return true}
    if(a==='tracePreview'){preview();return true}
    if(a==='traceRestartSet'){await restartSavedSet(draft?.type||'letters');return true}
    if(a==='traceWordBegin'){renderTraceScreen();return true}
    if(a==='traceWordHear'){speakWord(true);return true}
    if(a==='traceTryWord'){startTryTrace();return true}
    if(a==='traceTrySkip'){showSayStage();return true}
    if(a==='traceHear'){speakToken(runtime.token,runtime?.type!=='words',true);return true}
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
  return {launch,handleClick,progressHTML,cleanup,validationErrors,startWordSet};
}
