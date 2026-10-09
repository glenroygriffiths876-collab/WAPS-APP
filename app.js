import {CONCEPTS,AAC,ACTIVITY_SETS,COACH_ROUTINES,LESSONS,HELP,ROUTINES,NO_MATERIALS,HANDBOOK} from './data.js';import {COURSE_MODULES,COURSE_VIDEOS,COURSE_VERSION,COURSE_DISCLAIMER} from './course-data.js';import {NEEDS_DOMAINS,NEEDS_QUESTIONS,JAMAICA_RESOURCES} from './family-data.js';import {createTraceFeature} from './trace.js?v=68';import {createTraceWordsFeature} from './trace-words.js?v=68';import {createConceptLearningFeature} from './concept-learning.js';import {createMathLearningFeature} from './math-learning.js?v=62';import {createComprehensionLearningFeature} from './comprehension-learning.js';import {muSpecialVisualHTML} from './comprehension-data.js';import {load,save,clearAll} from './storage.js';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];const main=$('#main'),modal=$('#modal'),mb=$('#modalBody');const concept=Object.fromEntries(CONCEPTS.map(x=>[x.id,x]));function integrityAudit(){const ids=new Set(CONCEPTS.map(x=>x.id)),issues=[];if(ids.size!==CONCEPTS.length)issues.push('Duplicate concept IDs');for(const a of ACTIVITY_SETS){if(!a.sets?.length)issues.push('Empty activity '+a.id);for(const [t,cs] of (a.sets||[])){if(!ids.has(t))issues.push('Missing target '+t+' in '+a.id);for(const c of cs)if(!ids.has(c))issues.push('Missing choice '+c+' in '+a.id)}}for(const a of AAC)if(a.img&&!ids.has(a.img))issues.push('Missing AAC concept '+a.img);return issues}const integrityIssues=integrityAudit();if(integrityIssues.length)console.error('WAPS integrity audit failed',integrityIssues);
const fresh=()=>({schema:2,profiles:[],active:null,settings:{reduced:false,lowStim:false,simpleMode:false,largeText:false,highContrast:false,readerRate:0.9,voiceSpeed:1,voicePitch:1,autoVoice:false,autoVoicePreferenceVersion:1,grid:4,backgroundAudio:false,audioVolume:0.25,musicTune:'gentle',academyDone:[],childMode:false,aacFavorites:{},aacRecent:{},practiceState:{}},sessions:[],observations:[],customAAC:[],goals:[],supports:[],course:{completed:[],quiz:{},journal:{},current:1,certificate:null},needs:{answers:{},scores:{},completed:null},difficultMoments:[],trace:{prefs:{},sessions:{},history:[]},conceptLearning:{prefs:{},sessions:{},history:[]},mathLearning:{prefs:{},sessions:{},history:[]},comprehensionLearning:{prefs:{},sessions:{},history:[]}});let S=(await load())||fresh();if(!S.schema||S.schema<2)S=fresh();S.settings={...fresh().settings,...(S.settings||{})};if(Number(S.settings.autoVoicePreferenceVersion||0)<1){S.settings.autoVoice=false;S.settings.autoVoicePreferenceVersion=1;save(S).catch(()=>{})}S.settings.aacFavorites=S.settings.aacFavorites||{};S.settings.aacRecent=S.settings.aacRecent||{};S.settings.practiceState=S.settings.practiceState||{};S.course={completed:[],quiz:{},journal:{},current:1,certificate:null,...(S.course||{})};S.course.completed=Array.isArray(S.course.completed)?S.course.completed:[];S.course.quiz=S.course.quiz||{};S.course.journal=S.course.journal||{};S.needs={answers:{},scores:{},completed:null,...(S.needs||{})};S.needs.answers=S.needs.answers||{};S.needs.scores=S.needs.scores||{};S.difficultMoments=Array.isArray(S.difficultMoments)?S.difficultMoments:[];S.supports=Array.isArray(S.supports)?S.supports:[];S.profiles=(S.profiles||[]).map(p=>({...p,interests:Array.isArray(p.interests)?p.interests:[],yesSignal:p.yesSignal||'',noSignal:p.noSignal||'',helpSignal:p.helpSignal||'',breakSignal:p.breakSignal||'',painSignal:p.painSignal||'',calms:p.calms||''}));const persist=async()=>save(S);const active=()=>S.profiles.find(p=>p.id===S.active)||null;const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));const now=()=>new Date().toISOString();let HIGHRES_MANIFEST={};try{let r=await fetch('./assets/concepts/highres/manifest.json',{cache:'no-store'});if(r.ok)HIGHRES_MANIFEST=await r.json()}catch{}const HIGHRES_CONCEPTS=new Set(Object.keys(HIGHRES_MANIFEST));function visualHTML(id,cls=''){let c=concept[id];if(!c)return '';if(HIGHRES_CONCEPTS.has(id))return `<span class="concept-hi ${cls}" role="img" aria-label="${esc(c.label)}"><img src="./assets/concepts/highres/${id}.webp" alt="${esc(c.label)}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${c.image}'"></span>`;return `<img class="${cls} concept-fallback" src="${c.image}" alt="${esc(c.label)}" loading="lazy" decoding="async">`;}
function conceptImageForWord(word){const raw=String(word||'').trim().toLowerCase(),aliases={mummy:'mum',mom:'mum',mommy:'mum',daddy:'dad',grandmother:'grandma',grandfather:'grandpa',television:'tv',bicycle:'bike'};const id=aliases[raw]||raw;if(!id||!concept[id]||!HIGHRES_CONCEPTS.has(id))return null;return {id,src:`./assets/concepts/highres/${id}.webp`,label:concept[id].label||word}}


const WAPS_MUSIC={
 gentle:{name:'Gentle Steps',mood:'Calm',src:'./assets/audio/waps-gentle-steps.mp3'},
 sunny:{name:'Sunny Play',mood:'Bright & bouncy',src:'./assets/audio/waps-sunny-play.wav'},
 adventure:{name:'Little Adventure',mood:'Playful & curious',src:'./assets/audio/waps-little-adventure.wav'},
 learning:{name:'Happy Learning',mood:'Upbeat learning',src:'./assets/audio/waps-happy-learning.wav'}
};
function currentMusic(){return WAPS_MUSIC[S.settings.musicTune]||WAPS_MUSIC.gentle}
let wapsMusic=null,wapsAudioDuck=0,wapsMusicStarted=false;
function musicBaseVolume(){return Math.max(0,Math.min(1,Number(S.settings.audioVolume??0.25)))}
function ensureWapsMusic(){
 const wanted=currentMusic().src;
 if(wapsMusic&&wapsMusic.dataset.wapsSrc===wanted)return wapsMusic;
 if(wapsMusic){try{wapsMusic.pause();wapsMusic.currentTime=0}catch{}}
 const a=new Audio(wanted);a.dataset.wapsSrc=wanted;
 a.loop=true;a.preload='auto';a.volume=0;
 a.addEventListener('play',()=>{wapsMusicStarted=true;document.documentElement.dataset.music='playing'});
 a.addEventListener('pause',()=>{document.documentElement.dataset.music='paused'});
 a.addEventListener('error',()=>{document.documentElement.dataset.music='error'});
 wapsMusic=a;return a;
}
function setBackgroundAudioLevel(mult=1,fast=false){
 const a=ensureWapsMusic(),target=musicBaseVolume()*(wapsAudioDuck?0.18:mult);
 if(fast){a.volume=target;return}
 const start=a.volume,steps=8,delta=(target-start)/steps;
 let n=0;clearInterval(a._wapsFade);a._wapsFade=setInterval(()=>{n++;a.volume=Math.max(0,Math.min(1,start+delta*n));if(n>=steps)clearInterval(a._wapsFade)},35);
}
async function syncBackgroundAudio(fromUserGesture=false){
 const a=ensureWapsMusic();
 if(!S.settings.backgroundAudio||S.settings.lowStim){a.pause();a.currentTime=a.currentTime||0;setBackgroundAudioLevel(0,true);return false}
 setBackgroundAudioLevel(1,true);
 try{
   await a.play();setBackgroundAudioLevel(1);return true;
 }catch(err){
   document.documentElement.dataset.music='blocked';
   if(fromUserGesture)toast('Music could not start on this device. Tap Preview and try again.');
   return false;
 }
}
function stopBackgroundAudio(){if(!wapsMusic)return;clearInterval(wapsMusic._wapsFade);wapsMusic.pause();wapsMusic.currentTime=0;wapsMusicStarted=false;document.documentElement.dataset.music='off'}
function duckBackgroundAudio(){wapsAudioDuck++;if(wapsMusic&&!wapsMusic.paused)setBackgroundAudioLevel()}
function restoreBackgroundAudio(){wapsAudioDuck=Math.max(0,wapsAudioDuck-1);if(wapsMusic&&!wapsMusic.paused)setBackgroundAudioLevel()}
const WAPSVoice=(()=>{
 let current=null,fallbackVoices=[],manifest=null,manifestPromise=null;
 const LIBRARY_ENABLED=true,MANIFEST_URL='./assets/audio/waps-voice/manifest.json';
 const modeRates={default:.88,learning:.86,communication:.92,encouragement:.9,reader:.9};
 const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
 function speechAvailable(){return 'speechSynthesis'in window&&typeof SpeechSynthesisUtterance!=='undefined'}
 function available(){return LIBRARY_ENABLED||speechAvailable()}
 function rateFor(opts={}){const base=opts.mode==='reader'?Number(S.settings.readerRate||modeRates.reader):(modeRates[opts.mode]??modeRates.default),local=Number(opts.rate??base)||base,mult=clamp(Number(opts.voiceSpeed??S.settings.voiceSpeed??1)||1,.75,1.15);return clamp(local*mult,.55,1.2)}
 function pitchFor(opts={}){const local=Number(opts.pitch??1)||1,mult=clamp(Number(opts.voicePitch??S.settings.voicePitch??1)||1,.8,1.2);return clamp(local*mult,.75,1.25)}
 function normalizeKey(text){return String(text??'').toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9' ]+/g,' ').replace(/\s+/g,' ').trim()}
 function chooseVoice(){
  if(!speechAvailable())return null;
  const voices=speechSynthesis.getVoices?.()||[];if(voices.length)fallbackVoices=voices;
  const source=fallbackVoices.length?fallbackVoices:voices,pool=source.filter(v=>/^en([_-]|$)/i.test(v.lang||''));
  const score=v=>{const n=(v.name||'').toLowerCase(),l=(v.lang||'').toLowerCase();let s=0;if(/natural|neural|premium|enhanced/.test(n))s+=50;if(/aria|ava|samantha|google us english|serena|sonia|jenny/.test(n))s+=24;if(l==='en-jm')s+=16;if(l==='en-us')s+=12;if(l==='en-gb')s+=8;if(v.localService)s+=2;return s};
  return [...pool].sort((a,b)=>score(b)-score(a))[0]||source[0]||null;
 }
 if(speechAvailable()){fallbackVoices=speechSynthesis.getVoices?.()||[];speechSynthesis.addEventListener?.('voiceschanged',()=>{fallbackVoices=speechSynthesis.getVoices?.()||[]})}
 async function loadManifest(){
  if(!LIBRARY_ENABLED)return null;
  if(manifest)return manifest;
  if(manifestPromise)return manifestPromise;
  manifestPromise=fetch(MANIFEST_URL,{cache:'no-store'}).then(r=>r.ok?r.json():null).then(m=>manifest=(m&&typeof m==='object')?m:{version:1,clips:{}}).catch(()=>manifest={version:1,clips:{}}).finally(()=>{manifestPromise=null});
  return manifestPromise;
 }
 function clipFor(text,opts={}){
  if(manifest?.enabled===false)return null;
  const clips=manifest?.clips;if(!clips||typeof clips!=='object')return null;
  const key=normalizeKey(opts.voiceKey||text),entry=clips[key];if(!entry)return null;
  if(typeof entry==='string')return {src:entry};
  if(typeof entry!=='object'||!entry.src)return null;
  if(Array.isArray(entry.modes)&&opts.mode&&!entry.modes.includes(opts.mode))return null;
  return entry;
 }
 function finishJob(job,ok,engine,error){
  if(current!==job)return;
  if(job.started)restoreBackgroundAudio();
  current=null;
  try{ok?job.opts.onend?.({type:'end',engine}):job.opts.onerror?.(error)}catch{}
  try{job.resolve?.(ok)}catch{}
 }
 function stop(){
  if(!current)return;
  const job=current;job.cancelled=true;
  try{speechSynthesis.cancel()}catch{}
  try{if(job.audio){job.audio.pause();job.audio.currentTime=0;job.audio.removeAttribute('src');job.audio.load?.()}}catch{}
  if(job.started)restoreBackgroundAudio();
  try{job.resolve?.(false)}catch{}
  current=null;
 }
 function speakDevice(text,opts,job){
  if(!speechAvailable()){finishJob(job,false,'device',new Error('speech-unavailable'));return}
  const u=new SpeechSynthesisUtterance(text),selected=chooseVoice();if(selected){u.voice=selected;u.lang=selected.lang||'en-US'}else u.lang='en-US';
  u.rate=rateFor(opts);u.pitch=pitchFor(opts);
  u.onstart=()=>{if(job.cancelled)return;if(!job.started){job.started=true;duckBackgroundAudio()}try{opts.onstart?.({type:'start',engine:'device'})}catch{}};
  u.onend=e=>finishJob(job,true,'device',e);u.onerror=e=>finishJob(job,false,'device',e);
  try{speechSynthesis.cancel();speechSynthesis.speak(u)}catch(e){finishJob(job,false,'device',e)}
 }
 function speakClip(entry,text,opts,job){
  let audio;try{audio=new Audio(entry.src)}catch{return false}
  job.audio=audio;audio.preload='auto';audio.playsInline=true;
  const fail=()=>{
   if(current!==job||job.cancelled)return;
   if(job.started){restoreBackgroundAudio();job.started=false}
   job.audio=null;
   if(opts.libraryOnly){finishJob(job,false,'library',new Error('clip-failed'));return}
   speakDevice(text,opts,job);
  };
  audio.onplay=()=>{if(job.cancelled)return;if(!job.started){job.started=true;duckBackgroundAudio();try{opts.onstart?.({type:'start',engine:'library'})}catch{}}};
  audio.onended=()=>finishJob(job,true,'library');
  audio.onerror=fail;
  const p=audio.play();if(p&&typeof p.catch==='function')p.catch(fail);
  return true;
 }
 function speak(text,opts={}){
  text=String(text??'').replace(/\s+/g,' ').trim();if(!text)return Promise.resolve(false);
  if(opts.interrupt!==false)stop();
  let resolve;const promise=new Promise(r=>{resolve=r}),job={text,opts,resolve,started:false,cancelled:false,audio:null};current=job;
  const begin=async()=>{
   if(LIBRARY_ENABLED&&!opts.forceDevice){await loadManifest();if(current!==job||job.cancelled)return;const clip=clipFor(text,opts);if(clip&&speakClip(clip,text,opts,job))return}
   speakDevice(text,opts,job);
  };
  begin().catch(()=>{if(current===job&&!job.cancelled)speakDevice(text,opts,job)});
  return promise;
 }
 function pause(){
  if(!current)return false;
  if(current.audio){try{current.audio.pause();return true}catch{return false}}
  if(!speechAvailable())return false;try{speechSynthesis.pause();return true}catch{return false}
 }
 function resume(){
  if(!current)return false;
  if(current.audio){try{const p=current.audio.play();if(p?.catch)p.catch(()=>{});return true}catch{return false}}
  if(!speechAvailable())return false;try{speechSynthesis.resume();return true}catch{return false}
 }
 function isPaused(){if(current?.audio)return !!current.audio.paused;return speechAvailable()?!!speechSynthesis.paused:false}
 function prepare(){return loadManifest().then(()=>true).catch(()=>false)}
 function unlock(){return Promise.resolve(true)}
 function status(){return {engine:LIBRARY_ENABLED?'hybrid-library':'device-safe',libraryEnabled:LIBRARY_ENABLED,libraryClips:Object.keys(manifest?.clips||{}).length,fallback:'device',neuralState:'disabled-for-stability'}}
 return {speak,stop,pause,resume,isPaused,available,prepare,unlock,status};
})();
WAPSVoice.prepare().catch(()=>{});
function wapsSpeak(u,opts={}){if(!u)return Promise.resolve(false);if(typeof u==='string')return WAPSVoice.speak(u,opts);return WAPSVoice.speak(u.text,{...opts,rate:u.rate||opts.rate,pitch:u.pitch||opts.pitch,onstart:u.onstart,onend:u.onend,onerror:u.onerror})}
function autoVoiceEnabled(){return S.settings.autoVoice===true}
function autoVoiceButtonHTML(){return '<button type="button" class="btn ghost auto-voice-toggle" data-action="toggleAutoVoice" aria-pressed="'+(autoVoiceEnabled()?'true':'false')+'">'+(autoVoiceEnabled()?'🔊 WAPS prompts on':'👩‍👧 Parent leads')+'</button>'}
function syncAutoVoiceButtons(){document.querySelectorAll('[data-action="toggleAutoVoice"]').forEach(b=>{b.setAttribute('aria-pressed',autoVoiceEnabled()?'true':'false');b.textContent=autoVoiceEnabled()?'🔊 WAPS prompts on':'👩‍👧 Parent leads'})}
async function toggleAutoVoice(){S.settings.autoVoice=!autoVoiceEnabled();S.settings.autoVoicePreferenceVersion=1;if(!autoVoiceEnabled())WAPSVoice.stop();await persist();syncAutoVoiceButtons();toast(autoVoiceEnabled()?'WAPS will read short activity prompts':'Parent-led mode · Hear and Read still work')}
document.addEventListener('visibilitychange',()=>{if(!wapsMusic)return;if(document.hidden){wapsMusic.pause()}else if(S.settings.backgroundAudio&&!S.settings.lowStim){syncBackgroundAudio(false)}});
document.addEventListener('pointerdown',()=>{WAPSVoice.unlock();if(S.settings.backgroundAudio&&!S.settings.lowStim&&(!wapsMusic||wapsMusic.paused))syncBackgroundAudio(true)},{passive:true});

function toast(t){let x=$('#toast');x.textContent=t;x.classList.add('show');setTimeout(()=>x.classList.remove('show'),1800)}function show(html,wide=false){modal.classList.toggle('wide-modal',!!wide);mb.innerHTML=html;if(!modal.open)modal.showModal()}
function whatsappSupportModal(){show(`<div class="whatsapp-support-sheet"><div class="whatsapp-sheet-icon" aria-hidden="true">WA</div><span class="eyebrow">WAPS SUPPORT</span><h2>WhatsApp Support</h2><p>Talk with other WAPS parents and caregivers.</p><div class="whatsapp-approval">New members need approval from a group admin.</div><div class="actions"><a class="btn whatsapp-join-btn" href="https://chat.whatsapp.com/DvI8bqupHVQD2lLQUgAKYK" target="_blank" rel="noopener noreferrer">Request to Join</a><button class="btn ghost" data-action="closeModal">Not now</button></div></div>`)}
const WAPS_FEEDBACK_WHATSAPP='18765029756';
const FEEDBACK_ROUTE_LABELS={home:'Home',talk:'Talk',practice:'Practice',coach:'Coach',progress:'Progress',more:'More'};
let pendingFeedbackContext=null;
function feedbackTechnicalScreen(){
 if(document.body.classList.contains('math-active'))return 'Numbers & Maths';
 if(document.body.classList.contains('trace-active'))return 'Tracing';
 if(document.body.classList.contains('concept-id-active'))return 'Concept Learning';
 if(document.body.classList.contains('mu-active'))return 'Reading & Understanding';
 return '';
}
function currentFeedbackContext(){
 const r=document.body.dataset.route||route();
 const routeLabel=FEEDBACK_ROUTE_LABELS[r]||r||'WAPS';
 const modalTitle=modal?.open?mb.querySelector('h1,h2,.eyebrow')?.textContent?.replace(/\s+/g,' ')?.trim():'';
 const special=feedbackTechnicalScreen();
 const pageTitle=main.querySelector('h1,h2,.prompt')?.textContent?.replace(/\s+/g,' ')?.trim()||'';
 const detail=modalTitle||special||pageTitle;
 return {
  route:r,
  screen:detail&&detail.toLowerCase()!==routeLabel.toLowerCase()?routeLabel+' → '+detail:routeLabel,
  url:window.location.href,
  viewport:window.innerWidth+' × '+window.innerHeight,
  orientation:window.matchMedia?.('(orientation: landscape)').matches?'landscape':'portrait',
  mode:isStandalone()?'Installed app':'Web browser',
  online:navigator.onLine?'Online':'Offline',
  platform:navigator.userAgentData?.platform||navigator.platform||'Unknown',
  browser:navigator.userAgent||'Unknown',
  at:new Date().toLocaleString()
 };
}
function pageFeedbackModal(){
 pendingFeedbackContext=currentFeedbackContext();
 const c=pendingFeedbackContext;
 show(`<div class="feedback-sheet"><span class="eyebrow">PAGE FEEDBACK</span><h2>Tell us what happened</h2><p>You are reporting: <b>${esc(c.screen)}</b></p><div class="field"><label>What kind of feedback?<select id="feedbackType"><option>Something broke</option><option>Something did not work</option><option>Visual / layout problem</option><option>Could be easier to use</option><option>Could be improved</option><option>Suggestion / new idea</option><option>Other</option></select></label></div><div class="field"><label>What happened or what could be better?<textarea id="feedbackIssue" rows="5" maxlength="1200" placeholder="Tell us exactly what you noticed."></textarea></label></div><div style="margin:12px 0;padding:12px;border-radius:14px;background:#f2f6ff;color:#425c79"><b>Automatically included:</b> this screen, page link, screen size/orientation, app/browser mode and time. No child profile or saved WAPS data is included.</div><div class="actions"><button class="btn" style="background:#16834f;border-color:#16834f" data-action="sendPageFeedback">Send on WhatsApp</button><button class="btn ghost" data-action="closeModal">Cancel</button></div><p class="mini">You can attach a screenshot after WhatsApp opens.</p></div>`,true);
}
function sendPageFeedback(){
 const c=pendingFeedbackContext||currentFeedbackContext(),type=$('#feedbackType')?.value||'Feedback',issue=$('#feedbackIssue')?.value.trim()||'';
 if(!issue){toast('Please tell us what happened.');$('#feedbackIssue')?.focus();return}
 const msg=['*WAPS PAGE FEEDBACK*','','*Screen:* '+c.screen,'*Route:* #'+c.route,'*Type:* '+type,'*Feedback:* '+issue,'','*Technical details*','Screen size: '+c.viewport+' · '+c.orientation,'Mode: '+c.mode+' · '+c.online,'Platform: '+c.platform,'Page: '+c.url,'Time: '+c.at,'Browser: '+c.browser].join('\n');
 const wa='https://wa.me/'+WAPS_FEEDBACK_WHATSAPP+'?text='+encodeURIComponent(msg);
 const opened=window.open(wa,'_blank','noopener,noreferrer');if(!opened)window.location.href=wa;
}
function installPageFeedbackButton(){
 if($('#feedbackFab'))return;
 const style=document.createElement('style');
 style.id='wapsFeedbackStyles';
 style.textContent=`
 #feedbackFab{position:fixed;left:18px;bottom:20px;z-index:88;min-height:50px;padding:0 15px;border:1px solid rgba(42,70,150,.14);border-radius:999px;background:rgba(255,255,255,.96);color:#2447a8;display:flex;align-items:center;gap:8px;font-weight:900;box-shadow:0 12px 30px rgba(25,55,115,.18);cursor:pointer}
 #feedbackFab svg{width:23px;height:23px}
 body:has(dialog[open])>#feedbackFab{display:none}
 @media(max-width:760px){#feedbackFab{left:10px;bottom:calc(74px + env(safe-area-inset-bottom));width:46px;height:46px;min-height:46px;padding:0;border-radius:15px;justify-content:center}#feedbackFab span{display:none}}
 body.math-active>#feedbackFab,body.trace-active>#feedbackFab,body.concept-id-active>#feedbackFab,body.mu-active>#feedbackFab{left:8px;bottom:max(8px,env(safe-area-inset-bottom));width:40px;height:40px;min-height:40px;padding:0;border-radius:13px;justify-content:center;opacity:.86}
 body.child-mode-active>#feedbackFab{width:40px;height:40px;min-height:40px;padding:0;border-radius:13px;justify-content:center;opacity:.72}body.child-mode-active>#feedbackFab span{display:none}
 @media print{#feedbackFab{display:none!important}}
 `;
 document.head.appendChild(style);
 const b=document.createElement('button');b.id='feedbackFab';b.type='button';b.dataset.action='pageFeedback';b.setAttribute('aria-label','Report a problem or share feedback about this page');b.title='Feedback';
 b.innerHTML='<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 6h20v15H14l-6 5v-5H6z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/><path d="M11 11h10M11 16h7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg><span>Feedback</span>';
 document.body.appendChild(b);
}

function appShareUrl(){let u=new URL('.',window.location.href);u.hash='';u.search='';return u.href}
async function copyAppLink(){let url=appShareUrl();try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(url)}else{let t=document.createElement('textarea');t.value=url;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();document.execCommand('copy');t.remove()}toast('WAPS link copied ✓')}catch{toast('Could not copy automatically. Press and hold the link to copy it.')}}
async function shareAppLink(){let url=appShareUrl(),data={title:'WAPS Communication',text:'WAPS Communication — caregiver-guided communication support.',url};if(navigator.share){try{await navigator.share(data);return}catch(e){if(e?.name==='AbortError')return}}await copyAppLink()}
function shareAppModal(){let url=appShareUrl();show(`<div class="app-share-sheet"><img class="official-share-logo" src="./assets/brand/waps-full.svg" alt="WAPS — Western Autism Parents Support"><span class="eyebrow">SHARE WAPS</span><h2>Share WAPS Communication</h2><p>Send the app link directly, copy it, or let someone scan a QR code.</p><div class="share-option-grid"><button class="share-option" data-action="shareAppLink"><span class="share-option-icon">↗</span><b>Share link</b><small>WhatsApp, Messages, email and more</small></button><button class="share-option" data-action="copyAppLink"><span class="share-option-icon">⧉</span><b>Copy link</b><small>Copy the WAPS web address</small></button><button class="share-option" data-action="showAppQr"><span class="share-option-icon">▦</span><b>QR code</b><small>Show a code another phone can scan</small></button></div><div class="share-url-preview"><span>${esc(url)}</span><button data-action="copyAppLink" aria-label="Copy WAPS link">Copy</button></div></div>`,true)}
function appQrModal(){let url=appShareUrl(),qr='https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=12&data='+encodeURIComponent(url);show(`<div class="app-qr-sheet"><button class="btn ghost qr-back" data-action="shareApp">← Share options</button><div class="qr-brand"><img class="official-qr-logo" src="./assets/brand/waps-mark.svg" alt="WAPS"><div><span class="eyebrow">WESTERN AUTISM PARENTS SUPPORT</span><h2>Scan to open WAPS</h2></div></div><div class="qr-frame"><img src="${qr}" alt="QR code for the WAPS app link" referrerpolicy="no-referrer" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><div class="qr-error" hidden>QR code needs an internet connection to load. You can still copy or share the link below.</div></div><p class="qr-help">Open the camera on another phone and point it at this code.</p><div class="share-url-preview"><span>${esc(url)}</span><button data-action="copyAppLink">Copy link</button></div><div class="actions"><button class="btn" data-action="shareAppLink">↗ Share link</button></div></div>`,true)}
let deferredInstallPrompt=null,installConfirmedThisSession=false;
const isStandalone=()=>window.matchMedia?.('(display-mode: standalone)').matches===true||window.navigator.standalone===true;
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const isAndroid=()=>/android/i.test(navigator.userAgent);
const isSamsungBrowser=()=>/samsungbrowser/i.test(navigator.userAgent);
const isFirefox=()=>/firefox|fxios/i.test(navigator.userAgent);
function markWapsInstalled(){
 installConfirmedThisSession=true;
 try{localStorage.setItem('wapsInstalled','1')}catch{}
}
async function detectInstalledWaps(){
 if(isStandalone()||installConfirmedThisSession)return true;
 if(deferredInstallPrompt)return false;
 try{
  if(navigator.getInstalledRelatedApps){
   const apps=await navigator.getInstalledRelatedApps();
   if(Array.isArray(apps)&&apps.some(x=>x?.platform==='webapp'||String(x?.url||'').includes(location.pathname)))return true;
  }
 }catch{}
 try{return localStorage.getItem('wapsInstalled')==='1'}catch{return false}
}
async function syncInstallFab(){
 const b=$('#installFab');if(!b)return;
 const installed=await detectInstalledWaps();
 b.classList.toggle('hidden',installed);
 b.setAttribute('aria-hidden',installed?'true':'false');
}
function installHelpModal(){
 let title='Install WAPS',steps=[];
 if(isIOS()){
  title='Install WAPS on iPhone or iPad';
  steps=[['1','Tap Share','Use the Share button in Safari.'],['2','Add to Home Screen','Scroll if needed and choose “Add to Home Screen”.'],['3','Tap Add','WAPS will appear with its own icon.']];
 }else if(isSamsungBrowser()){
  title='Install WAPS in Samsung Internet';
  steps=[['1','Open the menu','Tap the ☰ menu.'],['2','Add page to','Choose “Add page to” then “Home screen”.'],['3','Confirm','WAPS will appear with its own icon.']];
 }else if(isAndroid()){
  steps=[['1','Open the browser menu','Tap ⋮ if the Install prompt is not available.'],['2','Install app','Choose “Install app” or “Add to Home screen”.'],['3','Confirm','WAPS will open like an app from your device.']];
 }else if(isFirefox()){
  steps=[['1','Open the browser menu','Look for Install or Add to Home Screen.'],['2','Choose Install','Follow the browser confirmation.']];
 }else{
  steps=[['1','Look for Install','Use the Install icon in the address bar or browser menu.'],['2','Confirm Install','WAPS will then open in its own app window.']];
 }
 show(`<div class="install-help-sheet"><div class="install-brand"><img class="official-install-logo" src="./assets/brand/waps-mark.svg" alt="WAPS"><div><span class="eyebrow">WESTERN AUTISM PARENTS SUPPORT</span><h2>${esc(title)}</h2></div></div><p class="install-lead">WAPS can live on your home screen like an app. Your browser requires you to approve the final install.</p><div class="install-steps">${steps.map(x=>`<div class="install-step"><span>${x[0]}</span><div><b>${esc(x[1])}</b><small>${esc(x[2])}</small></div></div>`).join('')}</div><div class="notice"><b>Your WAPS data stays in this browser/device.</b> Installing does not reset child profiles or progress.</div></div>`,true);
}
async function installWaps(){
 if(await detectInstalledWaps()){markWapsInstalled();await syncInstallFab();toast('✓ WAPS is already installed');return}
 if(deferredInstallPrompt){
  const prompt=deferredInstallPrompt;
  deferredInstallPrompt=null;
  try{
   await prompt.prompt();
   const choice=await prompt.userChoice;
   if(choice?.outcome==='accepted'){
    $('#installFab')?.classList.add('hidden');
    toast('WAPS is being installed ✓');
   }else{
    await syncInstallFab();
   }
  }catch{
   deferredInstallPrompt=prompt;
   installHelpModal();
  }
  return;
 }
 installHelpModal();
}
window.addEventListener('beforeinstallprompt',e=>{
 e.preventDefault();deferredInstallPrompt=e;
 try{localStorage.removeItem('wapsInstalled')}catch{}
 syncInstallFab();
});
window.addEventListener('appinstalled',()=>{
 deferredInstallPrompt=null;markWapsInstalled();syncInstallFab();
 toast('✓ WAPS installed — open it from your home screen.');
});
try{
 const mq=window.matchMedia('(display-mode: standalone)');
 mq.addEventListener?.('change',()=>{if(mq.matches)markWapsInstalled();syncInstallFab()});
}catch{}
if(isStandalone())markWapsInstalled();
function route(){return location.hash.slice(1)||'home'}function uiIcon(id,extra=''){return `<svg class="v51-ui-icon ${extra}" viewBox="0 0 96 96" aria-hidden="true" focusable="false"><use href="./assets/ui/v51/icons.svg#${id}"></use></svg>`}
function go(r){if(route()===r){render()}else{location.hash=r}}function nav(){
  $$('.bottomnav button,.desktopnav button').forEach(b=>b.classList.toggle('active',b.dataset.route===route()));
  let p=active(),c=$('#childSwitcher');
  if(c)c.innerHTML=p?`<span class="child-avatar">${p.photo?`<img class="child-avatar-img" src="${p.photo}" alt="">`:(p.name||'?').slice(0,1).toUpperCase()}</span><span><b>${esc(p.name)}</b><small>My profile</small></span><span>⌄</span>`:'<b>Set up child</b>';
  if(c)c.onclick=e=>{e.preventDefault();e.stopPropagation();profileModal()};
}
function shell(title,lead,body){return `<div class="page-stage"><div class="section-head"><div><div class="eyebrow">WAPS Communication</div><h1>${title}</h1><p>${lead}</p></div></div>${body}</div>`}

const JAMAICA_HELP=[
 {name:'Early Stimulation Programme (MLSS)',tag:'Publicly funded · ages 0–6',desc:'Developmental assessment, parent training, community intervention, physiotherapy and part-time speech therapy. Children are seen from across Jamaica; centres include Kingston, Portland and St. James.',url:'https://mlss.gov.jm/departments/early-stimulation-programme/',phone:'876-922-5585'},
 {name:'Mico CARE Centre',tag:'Assessment & intervention',desc:'Psycho-educational and related assessment, therapeutic and academic intervention, resources and training for children with learning challenges.',url:'https://www.themicocarecentre.org/',phone:'876-929-7720'},
 {name:'Jamaica Autism Support Association',tag:'Parent support & advocacy',desc:'Parent support, autism information, advocacy, workshops and links to services.',url:'https://www.autismjamaica.org/',phone:'876-776-6827'},
 {name:'Bustamante Hospital for Children',tag:'Public paediatric services',desc:'Paediatric hospital with child mental health, ENT, neurology, social work and other specialist services. Ask about the appropriate referral pathway for communication or developmental concerns.',url:'https://www.serha.gov.jm/bustamante-hospital-for-children/1000',phone:'876-317-9580'},
 {name:'Ministry of Education Special Education Unit',tag:'School support',desc:'Information and support pathways for students with special educational needs in Jamaica.',url:'https://moey.gov.jm/wp-content/uploads/2023/09/Special-Education-Unit-Brochure-revised-2023.pdf',phone:''}
];
const profileKey=()=>S.active||'global';
const allAACItems=()=>[...AAC,...S.customAAC.filter(x=>!S.active||x.profile===S.active).map(x=>({...x,cat:'personal'}))];
const getFavIds=()=>S.settings.aacFavorites[profileKey()]||[];
const getRecentIds=()=>S.settings.aacRecent[profileKey()]||[];
function rememberAAC(id){if(!id)return;let k=profileKey(),r=(S.settings.aacRecent[k]||[]).filter(x=>x!==id);r.unshift(id);S.settings.aacRecent[k]=r.slice(0,12);persist().catch(()=>{})}
function progressInsightData(){
 let sessions=S.sessions.filter(x=>x.profile===S.active),obs=S.observations.filter(x=>x.profile===S.active),nowMs=Date.now(),week=7*86400000;
 let curr=sessions.filter(x=>nowMs-new Date(x.at).getTime()<=week),prev=sessions.filter(x=>{let d=nowMs-new Date(x.at).getTime();return d>week&&d<=2*week});
 let independent=a=>a.filter(x=>x.prompt==='Independent'||x.result==='Independent').length;
 let currPct=curr.length?Math.round(independent(curr)/curr.length*100):0,prevPct=prev.length?Math.round(independent(prev)/prev.length*100):null;
 let real7=obs.filter(x=>nowMs-new Date(x.at).getTime()<=week),sp7=real7.filter(x=>x.spontaneous).length;
 let supports=real7.map(x=>x.support).filter(Boolean),common=supports.sort((a,b)=>supports.filter(v=>v===a).length-supports.filter(v=>v===b).length).pop();
 let trend=prevPct===null?'A baseline is being built.':currPct>prevPct?`Independent communication in recorded sessions is up from ${prevPct}% to ${currPct}%.`:currPct<prevPct?`Recorded independence is ${currPct}% this week compared with ${prevPct}% last week. Try an easier example and pause before prompting.`:`Recorded independence is steady at ${currPct}% across the last two weeks.`;
 let next=real7.length===0?'Take one useful message into a real routine today and record what happened.':sp7===0?'Create one natural opportunity, model once, then wait to see whether the child initiates in any communication mode.':common&&common!=='Independent'?`Recent real-life communication often used ${common.toLowerCase()}. Try the same routine and pause briefly before giving that support.`:'Try the same communication purpose with a different person, place or routine.';
 return {sessions,obs,currPct,prevPct,real7,sp7,trend,next};
}
function quickBoard(ids,title='Useful words'){
 return `<div class="quick-board"><div class="quick-board-title">${esc(title)}</div><div class="quick-board-grid">${ids.map(id=>{let a=AAC.find(x=>x.id===id),co=concept[id];let label=a?.label||co?.label||id;return `<button class="quick-word" data-quickword="${esc(id)}">${a?aacSymbolHTML(a):visualHTML(id,'quick-photo')}<span>${esc(label)}</span></button>`}).join('')}</div></div>`;
}
function dailyPlanModal(minutes=5){
 let p=active();if(!p)return profileModal();let g=S.goals.find(x=>x.profile===p.id&&x.active),rec=recommendActivity(p,g),interest=(p.interests||[])[0],focus=g?.text||p.priority||'use one useful message';
 let steps=minutes<=2?[['CONNECT','30 sec',`Join what ${p.name} is already doing. No questions yet.`],['MODEL','45 sec',`Model one useful message connected to: ${focus}.`],['WAIT + RESPOND','45 sec','Pause. Notice speech, AAC, a look, reach, point, gesture, sign or other clear response. Respond to the message.']]:minutes<=5?[['CONNECT','1 min',`Join something ${interest||p.name+' enjoys'}. Comment more than you question.`],['MODEL','1 min',`Model one useful message for: ${focus}. Do not require repetition.`],['PRACTISE','2 min',`Use a few easy turns from “${rec.title}”. Stop while it is still positive.`],['REAL LIFE','1 min','Use the same purpose in a real routine and record only what happened.']]:[['CONNECT','2 min',`Join a preferred activity${interest?' involving '+interest:''}.`],['MODEL','2 min',`Model a short useful message for: ${focus}.`],['PRACTISE','3 min',`Use “${rec.title}” with the least help that works.`],['GENERALISE','3 min','Try the same purpose with a different item, person or routine.']];
 show(`<div class="eyebrow">WAPS DAILY PLAN</div><h2>${minutes}-minute plan for ${esc(p.name)}</h2><p>You do not need to become a therapist. Use one small communication opportunity inside ordinary life.</p><div class="daily-plan">${steps.map((s,i)=>`<div class="plan-step"><span>${i+1}</span><div><b>${s[0]} · ${s[1]}</b><p>${esc(s[2])}</p></div></div>`).join('')}</div><div class="actions"><button class="btn" data-action="startUnifiedPractice">Open WAPS Practice</button><button class="btn secondary" data-close-route="coach">Coach me through it</button><button class="btn ghost" data-action="observeToday">Record real-life use</button></div>`);
}
function guideMeModal(){
 show(`<div class="eyebrow">HELP NOW</div><h2>What is happening?</h2><div class="guide-grid">
 <button data-guide="upset">😣<b>My child is upset / overwhelmed</b></button>
 <button data-guide="wants">🙋<b>My child wants something</b></button>
 <button data-guide="unknown">❓<b>I cannot tell what is wrong</b></button>
 <button data-guide="meal">🍽️<b>Meal or snack time</b></button>
 <button data-guide="school">🎒<b>Getting ready for school</b></button>
 <button data-guide="bedtime">🌙<b>Bedtime</b></button>
 <button data-guide="teach">⭐<b>I want to teach a useful word</b></button>
 <button data-guide="pain">🩹<b>Something may hurt</b></button>
 </div><div id="guideResult"></div>`);
}
function renderGuide(type){
 let out=$('#guideResult');if(!out)return;
 const map={
  upset:['Reduce talking. Lower demands where possible. Make self-advocacy easy to reach and honour clear messages.',['no','stop','break','help']],
  wants:['Show a small number of real options you can honour. Name them once, then wait.',['eat','drink','play','more','help']],
  unknown:['Start with basic needs and discomfort. Accept looking, reaching, pointing, AAC, gesture or speech.',['hurts','toilet','drink','eat','help','break']],
  meal:['Offer real choices. Avoid turning the meal into a naming test.',['eat','drink','more','finished','no','help']],
  school:['Use a short visual sequence and keep HELP/BREAK available.',['uniform','bag','school','go','help','break']],
  bedtime:['Keep language short and predictable. Offer one last meaningful choice.',['toilet','drink','book','sleep','finished','help']],
  teach:['Choose one word that will make something easier today. Model it in a real moment instead of drilling it.',['help','more','break','go','finished']],
  pain:['Use the body/pain tool. If pain seems severe, sudden, persistent, or is accompanied by urgent symptoms, seek appropriate medical care.',['hurts','head','ear','mouth','hand','foot']]
 };
 let x=map[type]||map.unknown;
 out.innerHTML=`<div class="guide-result"><h3>Do this first</h3><p>${esc(x[0])}</p>${quickBoard(x[1],'Put these within reach')}${type==='pain'?'<button class="btn danger-soft" data-action="pain">Open “Where does it hurt?”</button>':''}${type==='upset'?'<button class="btn secondary" data-action="difficultMoments">Record what happened</button>':''}</div>`;
}
function passportModal(){
 let p=active();if(!p)return profileModal();
 const val=(x,fb)=>esc(x||fb);
 show(`<div id="passport" class="passport"><div class="passport-head">${p.photo?`<img src="${p.photo}" alt="">`:''}<div><div class="eyebrow">WAPS COMMUNICATION PASSPORT</div><h1>How ${esc(p.name)} communicates</h1><p>Keep this with people who support ${esc(p.name)}.</p></div></div>
 <div class="passport-grid"><section><h3>Communication</h3><p><b>I communicate using:</b> ${val((p.modes||[]).join(', '),'Please observe all of my communication.')}</p><p><b>My interests:</b> ${val((p.interests||[]).join(', '),'Ask my caregiver what I enjoy.')}</p><p><b>Current priority:</b> ${val(p.priority,'Help me communicate what matters in everyday life.')}</p></section>
 <section><h3>Important messages</h3><p><b>YES may look/sound like:</b> ${val(p.yesSignal,'Offer clear choices and watch my response.')}</p><p><b>NO may look/sound like:</b> ${val(p.noSignal,'Respect clear refusal, turning away, NO or STOP.')}</p><p><b>HELP:</b> ${val(p.helpSignal,'Make HELP easy to reach and respond when I use it.')}</p><p><b>BREAK:</b> ${val(p.breakSignal,'Make BREAK available and honour it when possible.')}</p><p><b>PAIN / discomfort:</b> ${val(p.painSignal,'Watch words, AAC, body movement, behaviour and facial expression.')}</p></section>
 <section class="wide"><h3>What helps</h3><p>${val(p.calms,'Give me time, reduce unnecessary language, use visual support, and respond to the message before correcting me.')}</p></section></div>
 <div class="passport-rule"><b>Partner reminder:</b> Communication can be speech, AAC, pointing, gesture, pictures, signs, writing/typing, vocalisation or another intentional response. Do not remove AAC to force speech.</div></div><div class="actions"><button class="btn" data-action="print">Print / Save PDF</button><button class="btn secondary" data-action="handoff">Create school/home handoff</button></div>`);
}
let painPart='',painLevel='';
function painModal(){
 let parts=['head','ear','mouth','hand','foot','hurts'];
 show(`<div class="eyebrow">COMMUNICATE DISCOMFORT</div><h2>Where does it hurt?</h2><p>This tool helps communicate discomfort; it does not diagnose the cause.</p><div class="pain-grid">${parts.map(id=>`<button data-pain-part="${id}">${visualHTML(id,'pain-photo')}<b>${id==='hurts'?'Somewhere else':esc(concept[id]?.label||id)}</b></button>`).join('')}</div><div class="pain-levels"><button data-pain-level="a little">Hurts a little</button><button data-pain-level="a lot">Hurts a lot</button></div><div id="painSummary" class="notice">Choose a body area and, if possible, how much it hurts.</div><div class="actions"><button class="btn" data-action="savePain">Record what was communicated</button><button class="btn ghost" data-close-route="talk">Open WAPS Talk</button></div><div class="notice warn">Seek urgent medical help for severe symptoms, breathing difficulty, serious injury, loss of consciousness, or other emergencies. WAPS is not a medical assessment.</div>`);
}
const ROUTINE_TEMPLATES={
 morning:['Wake up','Toilet','Brush teeth','Get dressed','Breakfast','Go / school'],
 bedtime:['Toilet','Wash','Pyjamas','Book / quiet activity','Drink if needed','Sleep'],
 school:['Get dressed','Breakfast','Bag','Shoes','Toilet','Go to school'],
 clinic:['Get ready','Travel','Wait','See clinician','Break if needed','Go home']
};
function openRoutineModal(id){
 let r=S.supports.find(x=>x.id===id&&x.type==='routine');if(!r)return;
 show(`<div id="printRoutine" class="routine-use"><div class="eyebrow">WAPS VISUAL ROUTINE</div><h2>${esc(r.name)}</h2><p>Tap each step when it is finished. HELP, BREAK and STOP stay available.</p><div class="routine-use-list">${r.steps.map((s,i)=>`<button class="routine-step" data-routine-step="${i}"><span>${i+1}</span><b>${esc(s)}</b><i>○</i></button>`).join('')}</div>${quickBoard(['help','break','stop','finished'],'Communication stays available')}</div><div class="actions"><button class="btn" data-action="print">Print / Save PDF</button></div>`);
}
function handoffModal(){
 let p=active();if(!p)return profileModal();let g=S.goals.find(x=>x.profile===p.id&&x.active),obs=S.observations.filter(x=>x.profile===p.id).slice(-1)[0];
 show(`<div class="eyebrow">HOME ↔ SCHOOL</div><h2>Quick communication handoff</h2><p>Create a short card that keeps the same strategy going across adults and settings.</p><div class="field"><label>We are working on<input id="handoffGoal" value="${esc(g?.text||p.priority||'useful communication')}"></label></div><div class="field"><label>What worked today<input id="handoffWorked" value="${esc(obs?obs.purpose+' — '+(obs.support||'support not recorded'):'')}"></label></div><div class="field"><label>Please try<input id="handoffTry" placeholder="e.g. show HELP, wait, then respond"></label></div><button class="btn" data-action="makeHandoff">Create handoff card</button><div id="handoffOut"></div>`);
}
function findHelpModal(){
 const cats=['All',...new Set(JAMAICA_RESOURCES.map(x=>x.cat))];
 show(`<div class="jamaica-help-shell"><span class="eyebrow">FIND HELP IN JAMAICA</span><h1>Start with public, community and lower-cost pathways.</h1><p>Use the directory to search by service, parish or need. Listings were migrated from the prior WAPS Family Support Hub; availability, fees and referral rules can change, so confirm before travelling or paying.</p><div class="cannot-afford"><span>💛</span><div><b>I cannot afford regular private therapy.</b><p>Start with public programmes, disability registration/benefits, school-support pathways and community organisations. WAPS can also help you practise useful communication at home.</p></div></div><div class="jamaica-search-row"><label><span>Search</span><input id="jamaicaSearch" type="search" placeholder="e.g. Hanover, school, grant, therapy, Montego Bay"></label><label><span>Category</span><select id="jamaicaCategory">${cats.map(x=>`<option>${esc(x)}</option>`).join('')}</select></label></div><div id="jamaicaDirectory" class="directory-grid"></div><div class="notice"><b>Before travelling:</b> call or check the official source. WAPS does not guarantee current availability or eligibility.</div></div>`,true);renderJamaicaDirectory();
}


const QUICK_NEEDS=Object.keys(NEEDS_DOMAINS).flatMap(d=>NEEDS_QUESTIONS.filter(q=>q[0]===d).slice(0,2));
const coursePercent=()=>Math.round(((S.course.completed?.length||0)/COURSE_MODULES.length)*100);
const nextCourseModule=()=>COURSE_MODULES.find(m=>!S.course.completed.includes(m.id))||COURSE_MODULES[COURSE_MODULES.length-1];
function courseHomeModal(){
 const pct=coursePercent(),next=nextCourseModule();
 show(`<div class="course-shell"><section class="course-hero-card"><div><span class="eyebrow">WAPS CAREGIVER SKILLS COURSE</span><h1>Learn practical support one module at a time.</h1><p>Fifteen structured modules migrated from the WAPS Family Support Hub. Your place, quiz results and journal notes stay on this device.</p></div><div class="course-ring" style="--p:${pct}%"><b>${pct}%</b><span>complete</span></div></section>
 <div class="course-progress-track"><span style="width:${pct}%"></span></div><div class="course-progress-copy"><b>${S.course.completed.length} of ${COURSE_MODULES.length} modules complete</b><span>Course version ${esc(COURSE_VERSION)}</span></div>
 <div class="course-actions"><button class="btn" data-course-module="${next.id}">${S.course.completed.length?'Continue course':'Start course'} →</button><button class="btn secondary" data-action="courseVideos">Video library</button><button class="btn ghost" data-action="printCentre">Print & use offline</button>${S.course.completed.length===COURSE_MODULES.length?'<button class="btn ghost" data-action="courseCertificate">Participation record</button>':''}</div>
 <div class="notice"><b>Important:</b> ${esc(COURSE_DISCLAIMER)}</div>
 <section class="course-module-grid">${COURSE_MODULES.map(m=>`<button class="course-module-card ${S.course.completed.includes(m.id)?'complete':''}" data-course-module="${m.id}"><span class="course-module-number">${S.course.completed.includes(m.id)?'✓':m.id}</span><span><b>${esc(m.title)}</b><small>About ${m.time} minutes · ${S.course.quiz[m.id]?.score!=null?'Quiz '+S.course.quiz[m.id].score+'/'+m.quiz.length:'Not completed'}</small></span><i>›</i></button>`).join('')}</section></div>`,true);
}
function courseModuleModal(id){
 const m=COURSE_MODULES.find(x=>x.id===Number(id));if(!m)return courseHomeModal();S.course.current=m.id;persist().catch(()=>{});
 const saved=S.course.quiz[m.id],journal=S.course.journal[m.id]||'',complete=S.course.completed.includes(m.id);
 show(`<div class="course-shell course-module-view"><div class="course-breadcrumb"><button class="btn ghost" data-action="courseHome">← Course home</button><button class="btn ghost" data-action="speakPage">🔊 Read this page</button><span>Module ${m.id} of ${COURSE_MODULES.length}</span></div>
 <section class="course-module-head"><div><span class="eyebrow">MODULE ${m.id}</span><h1>${esc(m.title)}</h1><p>${esc(m.why)}</p></div><span class="course-time">~${m.time} min</span></section>
 <section class="course-section-card"><h2>What you will work on</h2><ul>${m.objectives.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>
 ${m.lessons.map(l=>`<section class="course-section-card"><h2>${esc(l.title)}</h2><ul>${l.points.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>`).join('')}
 <section class="course-section-card examples"><h2>Real-life examples</h2>${m.examples.map(x=>`<div class="course-example">${esc(x)}</div>`).join('')}</section>
 <section class="course-section-card home-practice"><span class="eyebrow">TRY IT AT HOME</span><h2>${esc(m.home.title)}</h2><p><b>Materials:</b> ${esc(m.home.materials)}</p><ol>${m.home.steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><div class="notice"><b>Your voice matters:</b> WAPS can support the activity, but you are the communication partner. Sit where your child can comfortably see your face. Use short language at their level, pronounce and enunciate words slowly and clearly without exaggerating, then pause and give time to respond. When practising a sound or word, you can try a mirror together so your child can see your mouth and their own if they enjoy it. Model once or twice rather than repeatedly demanding imitation. Respond to meaningful speech, sounds, pointing, gesture, signs or AAC—perfect pronunciation is not required.</div><div class="notice"><b>What to look for:</b> ${esc(m.home.success)}</div><div class="notice warn"><b>Safety / adjustment:</b> ${esc(m.home.safety)}</div></section>
 ${m.special?`<section class="course-section-card"><h2>${esc(m.special.title)}</h2><div class="course-checklist">${(m.special.items||[]).map(x=>`<label><input type="checkbox"> <span>${esc(x)}</span></label>`).join('')}</div></section>`:''}
 <section class="course-section-card"><h2>Caregiver journal</h2><p>${esc(m.journal)}</p><textarea id="courseJournal" class="course-journal" placeholder="Private notes stored on this device…">${esc(journal)}</textarea><button class="btn secondary" data-action="saveCourseJournal" data-module="${m.id}">Save journal</button></section>
 <section class="course-section-card course-quiz"><h2>Quick knowledge check</h2>${m.quiz.map((q,qi)=>`<fieldset class="course-quiz-block"><legend>${qi+1}. ${esc(q.q)}</legend>${q.options.map((o,oi)=>`<label class="course-answer"><input type="radio" name="cq${qi}" value="${oi}" ${saved?.answers?.[qi]===oi?'checked':''}> <span>${esc(o)}</span></label>`).join('')}<div class="course-answer-explain ${saved?'show':''}">${saved?(saved.answers?.[qi]===q.answer?'✓ Correct. ':'Review: ')+esc(q.why):''}</div></fieldset>`).join('')}<div class="course-actions"><button class="btn" data-action="gradeCourseQuiz" data-module="${m.id}">${saved?'Check again':'Check answers'}</button>${saved?`<span class="course-score">Score: ${saved.score}/${m.quiz.length}</span>`:''}</div></section>
 <div class="course-bottom-actions"><button class="btn ghost" data-course-module="${Math.max(1,m.id-1)}" ${m.id===1?'disabled':''}>← Previous</button><button class="btn ${complete?'secondary':''}" data-action="completeCourseModule" data-module="${m.id}">${complete?'Completed ✓':'Mark module complete'}</button><button class="btn ghost" data-course-module="${Math.min(COURSE_MODULES.length,m.id+1)}" ${m.id===COURSE_MODULES.length?'disabled':''}>Next →</button></div></div>`,true);
}
function courseVideosModal(){
 show(`<div class="course-shell"><div class="course-breadcrumb"><button class="btn ghost" data-action="courseHome">← Course home</button></div><section class="course-module-head"><div><span class="eyebrow">VIDEO LIBRARY</span><h1>Watch a short demonstration.</h1><p>These links come from the prior WAPS caregiver-course library. Internet is required for external videos.</p></div></section><div class="course-video-grid">${COURSE_VIDEOS.map(v=>`<article class="course-video-card"><span class="service-tag">${esc(v.category||'Video')}</span><h3>${esc(v.title)}</h3><p>${esc(v.description)}</p><ul>${(v.keyPoints||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul><div class="actions"><a class="btn secondary" href="${v.originalUrl}" target="_blank" rel="noopener">Watch video ↗</a><small>${esc(v.provider||'External provider')}${v.captionsAvailable?' · Captions listed':''}</small></div></article>`).join('')}</div></div>`,true);
}
function courseCertificateModal(){
 if(S.course.completed.length<COURSE_MODULES.length){toast('Complete all 15 modules first.');return}
 let cert=S.course.certificate;
 show(`<div class="course-shell"><div class="eyebrow">WAPS COURSE</div><h1>Confirmation of Participation</h1>${cert?`<div id="printSheet" class="print-sheet certificate-sheet"><div class="certificate-mark">WAPS</div><p>Western Autism Parents Support</p><h1>Confirmation of Participation</h1><p>This confirms that</p><h2>${esc(cert.name)}</h2><p>completed the WAPS Caregiver Skills Course</p><h3>Using Play and Everyday Routines to Help Children Communicate, Learn and Participate</h3><p>15 modules completed · ${new Date(cert.date).toLocaleDateString()}</p><code>${esc(cert.code)}</code><p class="mini">This is a WAPS participation record, not a professional qualification or official WHO Academy award.</p></div><div class="actions"><button class="btn" data-action="printSheet">Print / Save PDF</button><button class="btn ghost" data-action="resetCourseCertificate">Change name</button></div>`:`<p>All 15 modules are complete. Enter the caregiver's name exactly as you want it on the participation record.</p><div class="field"><label>Caregiver name<input id="certificateName"></label></div><button class="btn" data-action="makeCourseCertificate">Create participation record</button>`}</div>`,true);
}
function printCentreModal(){
 const items=[['core','💬','Core communication board','A ready-to-print board with high-use messages.'],['safety','🛟','HELP / STOP / BREAK cards','Large safety and self-advocacy cards.'],['pain','🩹','Pain & body board','HURTS plus common body areas.'],['choices','↔','Choice board','Blank two-choice template.'],['firstThen','1→2','First → Then','Blank visual First/Then support.'],['morning','🌅','Morning routine','Simple six-step routine.'],['bedtime','🌙','Bedtime routine','Simple bedtime sequence.'],['school','🎒','School routine','Getting-ready-for-school sequence.'],['passport','🪪','Communication Passport','Print the active child’s communication information.'],['schoolMeeting','🏫','School meeting sheet','A one-page family preparation sheet.']];
 show(`<div class="print-centre"><span class="eyebrow">PRINT & USE OFFLINE</span><h1>Make WAPS useful away from the phone.</h1><p>Print communication supports for home, school, clinic, church, grandparents or another caregiver.</p><div class="print-centre-grid">${items.map(x=>`<button class="print-centre-card" data-printable="${x[0]}"><span>${x[1]}</span><b>${x[2]}</b><small>${x[3]}</small><i>›</i></button>`).join('')}</div></div>`,true);
}
function printableHTML(type){
 const p=active(),name=p?.name||'My child',board=(ids,title)=>`<h1>${esc(title)}</h1><div class="print-board-grid">${ids.map(id=>`<div class="print-symbol">${visualHTML(id,'print-photo')}<b>${esc(concept[id]?.label||id)}</b></div>`).join('')}</div>`;
 if(type==='core')return board(['yes','no','help','more','finished','toilet','hurts','drink','eat','play','go','break'],'My communication board');
 if(type==='safety')return board(['help','stop','break','no','toilet','hurts'],'Important messages');
 if(type==='pain')return board(['hurts','head','ear','mouth','hand','foot'],'Where does it hurt?');
 if(type==='morning')return `<h1>Morning routine</h1><ol class="print-routine">${ROUTINE_TEMPLATES.morning.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>`;
 if(type==='bedtime')return `<h1>Bedtime routine</h1><ol class="print-routine">${ROUTINE_TEMPLATES.bedtime.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>`;
 if(type==='school')return `<h1>Getting ready for school</h1><ol class="print-routine">${ROUTINE_TEMPLATES.school.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>`;
 if(type==='choices')return `<h1>My choices</h1><div class="print-two"><section><h2>CHOICE 1</h2><div class="blank-picture"></div></section><section><h2>CHOICE 2</h2><div class="blank-picture"></div></section></div>`;
 if(type==='firstThen')return `<h1>First → Then</h1><div class="print-two"><section><h2>FIRST</h2><div class="blank-picture"></div></section><section><h2>THEN</h2><div class="blank-picture"></div></section></div>`;
 if(type==='passport')return `<h1>How ${esc(name)} communicates</h1><div class="passport-print"><p><b>Communication modes:</b> ${esc((p?.modes||[]).join(', ')||'Not recorded')}</p><p><b>Interests:</b> ${esc((p?.interests||[]).join(', ')||'Not recorded')}</p><p><b>YES:</b> ${esc(p?.yesSignal||'Observe my response to clear choices.')}</p><p><b>NO / refusal:</b> ${esc(p?.noSignal||'Respect clear refusal or moving away.')}</p><p><b>HELP:</b> ${esc(p?.helpSignal||'Make HELP easy to reach.')}</p><p><b>BREAK:</b> ${esc(p?.breakSignal||'Make BREAK available and honour it when possible.')}</p><p><b>Pain / discomfort:</b> ${esc(p?.painSignal||'Watch all communication modes and body signals.')}</p><p><b>What helps:</b> ${esc(p?.calms||'Give me time, reduce unnecessary language and use visual support.')}</p></div>`;
 if(type==='schoolMeeting')return `<h1>School meeting — ${esc(name)}</h1><div class="meeting-sheet"><h2>What is going well?</h2><div></div><h2>What is difficult right now?</h2><div></div><h2>How does my child communicate?</h2><div></div><h2>What helps participation?</h2><div></div><h2>Important HELP / BREAK / NO / STOP signals</h2><div></div><h2>One shared goal for home and school</h2><div></div></div>`;
 return '<h1>WAPS printable</h1>';
}
function printableModal(type){show(`<div class="print-preview-shell"><button class="btn ghost" data-action="printCentre">← Print centre</button><div id="printSheet" class="print-sheet"><div class="print-brand">WAPS Communication</div>${printableHTML(type)}<footer>Use this as a communication support. WAPS does not diagnose or replace individualized professional care.</footer></div><div class="actions"><button class="btn" data-action="printSheet">Print / Save PDF</button></div></div>`,true)}
function needsSummaryHTML(){
 const entries=Object.entries(S.needs.scores||{}).sort((a,b)=>b[1]-a[1]),top=entries.slice(0,3);if(!S.needs.completed)return '';
 return `<div class="needs-summary"><span class="eyebrow">YOUR CURRENT PRIORITIES</span><h2>WAPS will put extra attention here.</h2><div class="needs-top">${top.map(([d,v])=>`<div><b>${esc(NEEDS_DOMAINS[d])}</b><span>${v}% reported support need</span></div>`).join('')}</div><p class="mini">These percentages summarize caregiver answers in WAPS. They are not a measure of autism severity, intelligence or future potential.</p></div>`;
}
function needsCheckModal(){
 show(`<div class="needs-check-shell"><span class="eyebrow">OPTIONAL FAMILY NEEDS CHECK</span><h1>What would make daily life easier?</h1><p>This is not a diagnostic test. It helps WAPS understand where your family wants more support.</p>${needsSummaryHTML()}<form id="needsForm">${QUICK_NEEDS.map((q,i)=>`<fieldset class="needs-question"><legend>${i+1}. How much support is currently needed to ${esc(q[1])}?</legend><small>${esc(q[2])}</small><div class="needs-scale">${[['0','Usually manages'],['1','Some help'],['2','Frequent help'],['3','High support']].map(([v,l])=>`<label><input type="radio" name="need${i}" value="${v}" ${String(S.needs.answers?.[i]??'')===v?'checked':''}><span>${l}</span></label>`).join('')}</div></fieldset>`).join('')}</form><div class="actions"><button class="btn" data-action="saveNeedsCheck">${S.needs.completed?'Update priorities':'Show my support priorities'}</button>${S.needs.completed?'<button class="btn ghost" data-action="resetNeedsCheck">Clear answers</button>':''}</div></div>`,true);
}
function difficultMomentsModal(){
 const recent=S.difficultMoments.filter(x=>!S.active||x.profile===S.active).slice(-5).reverse();
 show(`<div class="eyebrow">DIFFICULT MOMENTS</div><h1>Look for the message, not blame.</h1><p>Record what happened around a difficult moment so patterns may become easier to notice. This is observation, not diagnosis.</p><div class="field"><label>What happened just before?<textarea id="dmBefore" placeholder="Transition, noise, demand, waiting, hunger, pain…"></textarea></label></div><div class="field"><label>What did your child do?<textarea id="dmWhat"></textarea></label></div><div class="field"><label>What happened right after?<textarea id="dmAfter"></textarea></label></div><div class="field"><label>What might your child have needed?<input id="dmNeed" placeholder="break, help, more time, toilet, quiet, pain support…"></label></div><div class="field"><label>What helped?<input id="dmHelped"></label></div><button class="btn" data-action="saveDifficultMoment">Save observation</button>${recent.length?`<h2>Recent observations</h2><div class="list">${recent.map(x=>`<div class="list-item"><b>${new Date(x.at).toLocaleDateString()} · Possible need: ${esc(x.need||'not recorded')}</b><p><b>Before:</b> ${esc(x.before||'—')}</p><p><b>What happened:</b> ${esc(x.what||'—')}</p><p><b>What helped:</b> ${esc(x.helped||'—')}</p></div>`).join('')}</div>`:''}</div>`,true);
}
function schoolSupportModal(){
 let p=active();
 show(`<div class="school-support-shell"><span class="eyebrow">SCHOOL & SHADOW SUPPORT</span><h1>Keep communication consistent across adults.</h1><p>Use the same important messages, supports and respectful prompting at home and school.</p><div class="school-tool-grid"><button data-action="passport"><span>🪪</span><b>Communication Passport</b><small>How ${esc(p?.name||'the child')} communicates and what helps.</small></button><button data-action="handoff"><span>↔</span><b>Home ↔ School handoff</b><small>One goal, what worked and what to try next.</small></button><button data-printable="schoolMeeting"><span>🏫</span><b>Prepare for a school meeting</b><small>Print a one-page family planning sheet.</small></button><button data-action="needsCheck"><span>🧭</span><b>Family needs check</b><small>Clarify where support is most useful right now.</small></button></div><section class="course-section-card"><h2>Quick guide for teachers and shadows</h2><ul><li>Respond to communication before correcting form.</li><li>Keep AAC, HELP, BREAK, NO and STOP available.</li><li>Do not require eye contact as proof of attention.</li><li>Use the least help that works and reduce prompting when possible.</li><li>Share observable information with the family: what happened, what helped and how independent the communication was.</li></ul></section></div>`,true);
}
let readerSegments=[],readerIndex=0,readerPaused=false;
function readerText(){const source=modal.open?mb:main;if(!source)return '';const copy=source.cloneNode(true);copy.querySelectorAll('button,nav,[data-reader-ignore],.reader-dock,.bottom-nav,.desktop-nav').forEach(x=>x.remove());return copy.innerText?.replace(/\s+/g,' ').trim()||''}
function openReaderDock(autoStart=false){
 let old=$('#readerDock');if(old)old.remove();const text=readerText();if(!text){toast('There is nothing to read on this page.');return}
 readerSegments=(text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[text]).map(x=>x.trim()).filter(Boolean);readerIndex=0;readerPaused=false;
 let dock=document.createElement('section');dock.id='readerDock';dock.className='reader-dock';dock.innerHTML=`<div><b>🔊 Read this page</b><small id="readerStatus">Ready · ${readerSegments.length} sections</small></div><div class="reader-dock-controls"><button data-action="readerPlay">▶ Read</button><button data-action="readerPause">⏸ Pause</button><button data-action="readerStop">■ Stop</button><label>Speed <input id="readerRate" type="range" min="0.6" max="1.3" step="0.05" value="${S.settings.readerRate||0.9}"></label><button data-action="readerClose">✕</button></div>`;document.body.appendChild(dock);if(autoStart)startReader();
}
function startReader(){
  if(!WAPSVoice.available()){toast('Read-aloud is not available on this device.');return}
  WAPSVoice.stop();readerPaused=false;
  const speakNext=()=>{if(readerPaused||readerIndex>=readerSegments.length){if(readerIndex>=readerSegments.length){let st=$('#readerStatus');if(st)st.textContent='Finished'}return}WAPSVoice.speak(readerSegments[readerIndex],{mode:'reader',rate:Number(S.settings.readerRate||0.9),onstart:()=>{let st=$('#readerStatus');if(st)st.textContent=`Reading ${readerIndex+1} of ${readerSegments.length}`},onend:()=>{readerIndex++;speakNext()}})};speakNext();
}
function pauseReader(){if(readerPaused){readerPaused=false;WAPSVoice.resume();let st=$('#readerStatus');if(st)st.textContent='Reading resumed'}else{readerPaused=true;WAPSVoice.pause();let st=$('#readerStatus');if(st)st.textContent='Paused'}}
function stopReader(){WAPSVoice.stop();readerIndex=0;readerPaused=false;let st=$('#readerStatus');if(st)st.textContent='Stopped'}
function closeReader(){stopReader();$('#readerDock')?.remove()}
function renderJamaicaDirectory(){
 let out=$('#jamaicaDirectory');if(!out)return;let q=($('#jamaicaSearch')?.value||'').toLowerCase().trim(),cat=$('#jamaicaCategory')?.value||'All';
 let rows=JAMAICA_RESOURCES.filter(r=>(cat==='All'||r.cat===cat)&&(!q||[r.title,r.desc,r.parish,r.cat].join(' ').toLowerCase().includes(q)));
 out.innerHTML=rows.length?rows.map(r=>`<article class="directory-card"><div class="resource-meta"><span class="service-tag">${esc(r.cat)}</span><span class="service-tag muted-tag">${esc(r.parish)}</span></div><h3>${esc(r.title)}</h3><p>${esc(r.desc)}</p><div class="actions">${r.phone?`<a class="btn ghost" href="tel:${r.phone.replace(/[^0-9+]/g,'')}">Call ${esc(r.phone)}</a>`:''}<a class="btn secondary" href="${r.url}" target="_blank" rel="noopener">${esc(r.action||'Official information')} ↗</a></div></article>`).join(''):'<div class="friendly-empty"><span>⌕</span><div><b>No matching service.</b><p>Try a broader word such as school, grant, therapy, western, assessment or support.</p></div></div>';
}

/* WAPS v59 LOCKED HOME — approved portrait and landscape artwork only. */
let v59HomeArtPromise=null;
function v59Hotspot(cls,label,attrs){return '<button type="button" class="v59-hotspot '+cls+'" '+attrs+' aria-label="'+esc(label)+'"><span class="v59-sr">'+esc(label)+'</span></button>'}
function loadV59HomeArt(){
 if(!v59HomeArtPromise)v59HomeArtPromise=Promise.all([
  fetch('./assets/ui/v59/home-landscape.b64').then(r=>{if(!r.ok)throw Error('landscape art');return r.text()}),
  Promise.all([fetch('./assets/ui/v59/home-portrait-1.b64'),fetch('./assets/ui/v59/home-portrait-2.b64')]).then(async rs=>{if(rs.some(r=>!r.ok))throw Error('portrait art');return (await rs[0].text())+(await rs[1].text())})
 ]).then(([landscape,portrait])=>({landscape:landscape.trim(),portrait:portrait.trim()}));
 return v59HomeArtPromise
}
async function hydrateV59Home(){
 const p=document.querySelector('.v59-portrait-art'),l=document.querySelector('.v59-landscape-art');if(!p&&!l)return;
 try{const a=await loadV59HomeArt();if(p)p.src='data:image/webp;base64,'+a.portrait;if(l)l.src='data:image/webp;base64,'+a.landscape}
 catch(e){document.querySelector('.v59-home')?.classList.add('v59-art-error')}
}
function home(){
 const portrait=[
  v59Hotspot('v59-p-profile v59-caregiver','My Child','data-action="profile"'),
  v59Hotspot('v59-p-progress-top v59-caregiver','Progress','data-action="progressOpen"'),
  v59Hotspot('v59-p-settings v59-caregiver','Settings','data-action="settings"'),
  v59Hotspot('v59-p-more-top v59-caregiver','More','data-route="more"'),
  v59Hotspot('v59-p-talk','Talk — tell me what you need','data-route="talk"'),
  v59Hotspot('v59-p-practice','Practice Together — learn and play together','data-route="practice"'),
  v59Hotspot('v59-p-child-card v59-caregiver','My Child','data-action="profile"'),
  v59Hotspot('v59-p-progress-card v59-caregiver','Progress','data-action="progressOpen"'),
  v59Hotspot('v59-p-caregiver v59-caregiver','Caregiver Tools','data-action="homeCaregiverTools"'),
  v59Hotspot('v59-p-support v59-caregiver','WhatsApp Support','data-action="whatsappSupport"'),
  v59Hotspot('v59-p-install v59-caregiver','Install WAPS','data-action="installWaps"'),
  v59Hotspot('v59-p-share v59-caregiver','Share WAPS','data-action="shareApp"'),
  v59Hotspot('v59-p-nav-home','Home','data-route="home"'),
  v59Hotspot('v59-p-nav-talk','Talk','data-route="talk"'),
  v59Hotspot('v59-p-nav-practice','Practice','data-route="practice"'),
  v59Hotspot('v59-p-nav-progress v59-caregiver','Progress','data-action="progressOpen"'),
  v59Hotspot('v59-p-nav-child v59-caregiver','My Child','data-action="profile"'),
  v59Hotspot('v59-p-nav-more v59-caregiver','More','data-route="more"')
 ].join('');
 const landscape=[
  v59Hotspot('v59-l-profile v59-caregiver','My Child','data-action="profile"'),
  v59Hotspot('v59-l-progress-top v59-caregiver','Progress','data-action="progressOpen"'),
  v59Hotspot('v59-l-settings v59-caregiver','Settings','data-action="settings"'),
  v59Hotspot('v59-l-more-top v59-caregiver','More','data-route="more"'),
  v59Hotspot('v59-l-talk','Talk — tell me what you need','data-route="talk"'),
  v59Hotspot('v59-l-practice','Practice Together — learn and play together','data-route="practice"'),
  v59Hotspot('v59-l-child-card v59-caregiver','My Child','data-action="profile"'),
  v59Hotspot('v59-l-progress-card v59-caregiver','Progress','data-action="progressOpen"'),
  v59Hotspot('v59-l-caregiver v59-caregiver','Caregiver Tools','data-action="homeCaregiverTools"'),
  v59Hotspot('v59-l-support v59-caregiver','WhatsApp Support','data-action="whatsappSupport"'),
  v59Hotspot('v59-l-install v59-caregiver','Install WAPS','data-action="installWaps"'),
  v59Hotspot('v59-l-share v59-caregiver','Share WAPS','data-action="shareApp"'),
  v59Hotspot('v59-l-nav-home','Home','data-route="home"'),
  v59Hotspot('v59-l-nav-talk','Talk','data-route="talk"'),
  v59Hotspot('v59-l-nav-practice','Practice','data-route="practice"'),
  v59Hotspot('v59-l-nav-progress v59-caregiver','Progress','data-action="progressOpen"'),
  v59Hotspot('v59-l-nav-child v59-caregiver','My Child','data-action="profile"'),
  v59Hotspot('v59-l-nav-more v59-caregiver','More','data-route="more"')
 ].join('');
 return '<div class="v59-home" aria-label="WAPS Home">'+
  '<section class="v59-view v59-portrait-view" aria-label="WAPS portrait Home"><img class="v59-art v59-portrait-art" alt="" aria-hidden="true">'+portrait+'</section>'+
  '<section class="v59-view v59-landscape-view" aria-label="WAPS landscape Home"><img class="v59-art v59-landscape-art" alt="" aria-hidden="true">'+landscape+'</section>'+
  '<section class="v59-low-fallback" aria-label="WAPS Home"><h1>WAPS</h1><p>Communication, learning and support.</p><div><button class="btn primary" data-route="talk">Talk</button><button class="btn secondary" data-route="practice">Practice Together</button></div><button class="btn ghost" data-action="settings">Settings</button></section>'+
  '</div>'
}
function talk(){let p=active();let cats=["all","favorites","recent","core","safety","people","actions","food","places","feelings","body","social","repair","personal"];return `<div class="talk-stage mobile-aac">
<div class="talk-title compact-talk-title"><div><span class="eyebrow">TALK</span><h1>Talk</h1><p>Tap pictures or words.</p></div></div>
<div class="talk-sticky-zone">
  <div class="sentence-row"><div class="sentence" id="sentence" aria-live="polite"><span class="mini">Tap words to build a message.</span></div><button class="btn speak-big compact-speak" data-action="speak" aria-label="Speak message">${uiIcon('speak','v51-control-icon')} <span>Speak</span></button></div>
  <div class="aac-actions compact-aac-actions"><button class="btn ghost" data-action="backspace" aria-label="Remove last word">${uiIcon('backspace','v51-control-icon')}</button><button class="btn ghost" data-action="clearSentence">${uiIcon('clear','v51-control-icon')}<span>Clear</span></button><button class="btn secondary partner-compact" data-action="partner">${uiIcon('partner-mode','v51-control-icon')}<span>Partner: <span id="partnerState">Off</span></span></button></div>
  <div id="partnerTip" class="partner hidden"><b>Show, don’t test.</b> Tap a useful word as you say it.</div>
  <div class="quick-needs compact-quick"><span class="quick-label">QUICK</span>${["yes","no","help","stop","break","toilet","hurts"].map(id=>{let x=AAC.find(a=>a.id===id);return `<button data-quickword="${id}">${aacSymbolHTML(x)}<b>${esc(x.label)}</b></button>`}).join("")}</div>
  <div class="aac-search-row compact-search"><label class="aac-search">${uiIcon('search','v51-search-icon')}<input id="aacSearch" type="search" placeholder="Find a word…" value="${esc(aacSearch)}" aria-label="Find a word"></label><button class="btn ghost my-word-compact" data-action="customAAC" aria-label="Add my word">${uiIcon('add-word','v51-control-icon')} <span>My word</span></button></div>
  <div class="catbar compact-catbar">${cats.map(c=>`<button class="chip aac-cat" data-cat="${c}" aria-pressed="${c===aacCat}">${c==="all"?"All":c==="favorites"?"★ Favourites":c==="recent"?"↻ Recent":c[0].toUpperCase()+c.slice(1)}</button>`).join("")}</div>
</div>
<div class="aac-grid premium-grid" id="aacGrid" style="grid-template-columns:repeat(${S.settings.grid||4},1fr)"></div>
${p?"":'<div class="talk-profile-note"><button class="btn ghost" data-action="profile">Set up my child</button></div>'}</div>`}
let sentence=[],aacCat='all',partner=false,aacSearch='';function aacSymbolHTML(x){
 const id=x.id;
 const wrap=(tone,body)=>`<span class="waps-aac-symbol ${tone}" aria-hidden="true"><svg viewBox="0 0 64 64" focusable="false">${body}</svg></span>`;
 const icons={
  yes:['green','<circle cx="32" cy="32" r="25"/><path d="M20 33l8 8 17-20" class="stroke"/>'],
  no:['red','<circle cx="32" cy="32" r="25"/><path d="M22 22l20 20M42 22 22 42" class="stroke"/>'],
  help:['teal','<circle cx="32" cy="32" r="25"/><path d="M24 24c1-8 16-9 17 0 1 7-9 7-9 14" class="stroke"/><circle cx="32" cy="47" r="3" class="dot"/>'],
  stop:['red','<path d="M23 6h18l17 17v18L41 58H23L6 41V23z"/><rect x="18" y="28" width="28" height="8" rx="4" class="white"/>'],
  break:['amber','<rect x="7" y="7" width="50" height="50" rx="15"/><rect x="20" y="19" width="8" height="26" rx="4" class="white"/><rect x="36" y="19" width="8" height="26" rx="4" class="white"/>'],
  more:['blue','<circle cx="32" cy="32" r="25"/><path d="M32 18v28M18 32h28" class="stroke"/>'],
  finished:['green','<circle cx="32" cy="32" r="25"/><path d="M19 33l9 9 18-22" class="stroke"/>'],
  i:['purple','<circle cx="32" cy="22" r="10"/><path d="M16 52c2-14 9-21 16-21s14 7 16 21z"/>'],
  want:['blue','<path d="M9 32h36"/><path d="m36 20 13 12-13 12" class="stroke"/>'],
  like:['pink','<path d="M32 52 11 31C1 20 17 8 27 18l5 6 5-6c10-10 26 2 16 13z"/>'],
  dontlike:['red','<path d="M32 52 11 31C1 20 17 8 27 18l5 6 5-6c10-10 26 2 16 13z"/><path d="M14 50 50 14" class="stroke"/>'],
  go:['green','<circle cx="32" cy="32" r="25"/><path d="M18 32h28M37 22l10 10-10 10" class="stroke"/>'],
  scared:['amber','<path d="M32 7 59 55H5z"/><path d="M32 22v17" class="stroke"/><circle cx="32" cy="47" r="3" class="dot"/>'],
  loud:['orange','<path d="M10 27h10l13-11v32L20 37H10z"/><path d="M39 22c6 5 6 15 0 20M46 16c10 9 10 23 0 32" class="stroke"/>'],
  space:['purple','<path d="M8 32h48M18 22 8 32l10 10M46 22l10 10-10 10" class="stroke"/>'],
  understand:['teal','<circle cx="32" cy="32" r="25"/><path d="M23 24c1-8 17-9 18 0 1 7-9 8-9 14" class="stroke"/><circle cx="32" cy="47" r="3" class="dot"/>'],
  again:['blue','<path d="M17 19h23c9 0 14 6 14 13s-5 13-14 13H20" class="stroke"/><path d="m22 11-9 8 9 8" class="stroke"/>'],
  show:['teal','<path d="M7 32c8-12 16-18 25-18s17 6 25 18c-8 12-16 18-25 18S15 44 7 32z"/><circle cx="32" cy="32" r="8" class="white"/>'],
  mind:['purple','<path d="M45 18H25c-10 0-16 6-16 14s6 14 16 14h18" class="stroke"/><path d="m34 37 10 9-10 9" class="stroke"/>'],
  dontknow:['blue','<circle cx="32" cy="32" r="25"/><path d="M23 24c1-8 17-9 18 0 1 7-9 8-9 14" class="stroke"/><circle cx="32" cy="47" r="3" class="dot"/>'],
  notthat:['red','<circle cx="32" cy="32" r="25"/><path d="M21 21l22 22M43 21 21 43" class="stroke"/>'],
  myturn:['purple','<circle cx="32" cy="18" r="8"/><path d="M17 46c2-12 8-18 15-18s13 6 15 18z"/><circle cx="49" cy="47" r="10" class="badge"/><text x="49" y="52" text-anchor="middle" class="num">1</text>'],
  yourturn:['blue','<circle cx="32" cy="18" r="8"/><path d="M17 46c2-12 8-18 15-18s13 6 15 18z"/><circle cx="49" cy="47" r="10" class="badge"/><text x="49" y="52" text-anchor="middle" class="num">2</text>'],
  hello:['green','<path d="M17 48c-5-9-4-18 0-25l5 10V15c0-3 5-3 5 0v14-17c0-3 5-3 5 0v17-14c0-3 5-3 5 0v15-10c0-3 5-3 5 0v17c0 12-7 19-17 19z"/>'],
  goodbye:['orange','<path d="M17 48c-5-9-4-18 0-25l5 10V15c0-3 5-3 5 0v14-17c0-3 5-3 5 0v17-14c0-3 5-3 5 0v15-10c0-3 5-3 5 0v17c0 12-7 19-17 19z"/><path d="M44 13h13M52 7l6 6-6 6" class="stroke"/>'],
  isee:['teal','<path d="M7 32c8-12 16-18 25-18s17 6 25 18c-8 12-16 18-25 18S15 44 7 32z"/><circle cx="32" cy="32" r="8" class="white"/>']
 };
 const v=icons[id];if(v)return wrap(v[0],v[1]);if(x.visual)return muSpecialVisualHTML(x.visual,'aac-photo');if(x.img)return visualHTML(x.img,'aac-photo');return `<span class="symbol" aria-hidden="true">${esc(x.symbol||'•')}</span>`;
}
function drawAAC(){let g=$('#aacGrid');if(!g)return;let items=allAACItems(),fav=getFavIds(),recent=getRecentIds();if(aacCat==='favorites')items=items.filter(x=>fav.includes(x.id));else if(aacCat==='recent')items=recent.map(id=>items.find(x=>x.id===id)).filter(Boolean);else if(aacCat!=='all')items=items.filter(x=>x.cat===aacCat);let q=(aacSearch||'').trim().toLowerCase();if(q)items=items.filter(x=>(x.label||'').toLowerCase().includes(q)||(x.cat||'').toLowerCase().includes(q));g.innerHTML=items.length?items.map(x=>`<div class="aac-wrap"><button class="aac ${x.cat==='safety'?'safety':''}" data-aac-id="${esc(x.id)}" data-word="${esc(x.label)}" aria-label="${esc(x.label)}">${x.photo?`<img src="${x.photo}" alt="">`:aacSymbolHTML(x)}<span>${esc(x.label)}</span>${x.audio?'<small class="family-voice">🔊 family voice</small>':''}</button><button class="aac-star ${fav.includes(x.id)?'is-fav':''}" data-favorite-toggle="${esc(x.id)}" aria-label="${fav.includes(x.id)?'Remove from':'Add to'} favourites">${fav.includes(x.id)?'★':'☆'}</button></div>`).join(''):`<div class="friendly-empty aac-empty"><span>⌕</span><div><b>No matching words yet.</b><p>Try another search or add a personal word/photo.</p></div></div>`}
function drawSentence(){let el=$('#sentence');if(el)el.innerHTML=sentence.length?sentence.map(x=>`<span class="sentence-word">${esc(x)}</span>`).join(''):'<span class="mini">Tap words to build a message…</span>'}

function practiceProfileKey(){return S.active||'global'}
const ACTION_FORMS={run:'running',sleep:'sleeping',eat:'eating',drink:'drinking',walk:'walking',jump:'jumping',wash:'washing',read:'reading',write:'writing'};
const PERSON_FORMS={mum:'a mummy',dad:'a daddy',teacher:'a teacher',friend:'a friend',grandma:'a grandmother',grandpa:'a grandfather',sister:'a sister',brother:'a brother'};
function resolvedPracticeQuestion(a,target){const label=concept[target]?.label||target;return a.prompt.replaceAll('{target}',label.toLowerCase()).replaceAll('{TARGET}',label.toUpperCase()).replaceAll('{doing}',ACTION_FORMS[target]||label.toLowerCase()).replaceAll('{person}',PERSON_FORMS[target]||label.toLowerCase())}
function practicePool(){
 const seen=new Set(),pool=[];
 for(const a of ACTIVITY_SETS){
  (a.sets||[]).forEach((set,setIndex)=>{
   const target=set[0],q=resolvedPracticeQuestion(a,target),sig=(q+'|'+target).toLowerCase().replace(/\s+/g,' ').trim();
   if(seen.has(sig))return;
   seen.add(sig);pool.push({activityId:a.id,setIndex,target,q,domain:a.domain,title:a.title});
  });
 }
 return pool;
}
function shuffled(arr){let a=[...arr];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function celebrateCorrect(choiceEl){
 const reduce=S.settings.reduced||S.settings.lowStim||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 choiceEl?.classList.add('correct-bounce');
 setTimeout(()=>choiceEl?.classList.remove('correct-bounce'),700);
 if(reduce){toast('Great job! ✓');return}
 const layer=document.createElement('div');layer.className='practice-celebration-layer';layer.setAttribute('aria-hidden','true');
 const badge=document.createElement('div');badge.className='practice-celebration-badge';badge.innerHTML='<span>✓</span><b>Great job!</b>';layer.appendChild(badge);
 const colors=['#5b2ca0','#25a56f','#ffbd37','#ef6b4a','#35a9e0','#e9569b'];
 for(let i=0;i<34;i++){
   let p=document.createElement('i');p.className='confetti-piece';
   p.style.setProperty('--x',Math.round(Math.random()*100)+'vw');
   p.style.setProperty('--delay',(Math.random()*.25).toFixed(2)+'s');
   p.style.setProperty('--dur',(1.05+Math.random()*.7).toFixed(2)+'s');
   p.style.setProperty('--rot',Math.round(Math.random()*540)+'deg');
   p.style.setProperty('--c',colors[i%colors.length]);
   p.style.setProperty('--size',(7+Math.round(Math.random()*7))+'px');
   layer.appendChild(p);
 }
 document.body.appendChild(layer);
 setTimeout(()=>layer.remove(),1900);
}
function practiceState(){
 const k=practiceProfileKey(),pool=practicePool(),valid=new Set(pool.map(x=>x.activityId+'::'+x.setIndex));
 let st=S.settings.practiceState[k];
 if(!st||!Array.isArray(st.order)||st.order.length!==pool.length||st.order.some(x=>!valid.has(x))){
  st={order:shuffled(pool.map(x=>x.activityId+'::'+x.setIndex)),cursor:0,round:1,started:now()};
  S.settings.practiceState[k]=st;persist().catch(()=>{});
 }
 st.cursor=Math.max(0,Math.min(Number(st.cursor)||0,st.order.length));
 st.round=Math.max(1,Number(st.round)||1);
 return st;
}
function practiceProgress(){
 const st=practiceState(),total=st.order.length,done=Math.min(st.cursor,total),pct=total?Math.round(done/total*100):0;
 return {st,total,done,pct,complete:done>=total};
}
function resetPracticeRound(){
 const k=practiceProfileKey(),pool=practicePool(),old=S.settings.practiceState[k];
 S.settings.practiceState[k]={order:shuffled(pool.map(x=>x.activityId+'::'+x.setIndex)),cursor:0,round:(old?.round||1)+1,started:now()};
 return persist();
}
const EXTERNAL_LEARNING_RESOURCES=[
 {id:'toy-theater',title:'Toy Theater',description:'Play with maths, reading, puzzles, art and interactive learning tools.',url:'https://toytheater.com/',ageNote:'Early learning + primary',tag:'LEARN & PLAY',icon:'explore-more',external:true},
 {id:'level-one-reading',title:'Level One Reading',description:'Practise phonics, sounds, blending and early reading with simple decodable books.',url:'https://www.levelonereading.com/',ageNote:'Early readers',tag:'READ',icon:'words-names',external:true},
 {id:'unite-literacy',title:'Unite for Literacy',description:'Explore picture books with narration and language support.',url:'https://www.uniteforliteracy.com/',ageNote:'Early readers + shared reading',tag:'STORIES',icon:'learn-print',external:true},
 {id:'chrome-music-lab',title:'Chrome Music Lab',description:'Make music, explore sounds and discover rhythm through touch and play.',url:'https://musiclab.chromeexperiments.com/',ageNote:'All ages',tag:'MUSIC',icon:'background-music',external:true},
 {id:'quick-draw',title:'Quick, Draw!',description:'Draw simple pictures and see if the computer can guess what you are creating.',url:'https://quickdraw.withgoogle.com/',ageNote:'Children + families',tag:'DRAW',icon:'trace-say',external:true},
 {id:'learn-2-draw',title:'Learn 2 Draw Kids',description:'Follow simple step-by-step drawing activities and practise making pictures and shapes.',url:'https://learn2drawkids.com/',ageNote:'Early learning + primary',tag:'CREATE',icon:'trace-say',external:true},
 {id:'world-geography-games',title:'World Geography Games',description:'Explore the world through interactive maps, countries, flags and geography games.',url:'https://world-geography-games.com/',ageNote:'Primary + older learners',tag:'EXPLORE',icon:'explore-more',external:true},
 {id:'maggie-games',title:'Maggie Games',description:'Play calm, accessible learning games with large targets, spoken support and simple interactions.',url:'https://maggiegames.com/',ageNote:'Choose by skill rather than age',tag:'ACCESSIBLE PLAY',icon:'accessibility',external:true},
 {id:'kiddo-games',title:'Kiddo Games',description:'Choose from simple learning, thinking and just-for-fun browser games.',url:'https://kiddogames.fun/',ageNote:'Early learning + primary',tag:'GAMES',icon:'mixed-practice',external:true}
];
let practiceTab='waps';
function practice(){let p=practiceProgress();const tools=[
 ['mixed-practice','Mixed Practice',p.complete?"Start a new mixed round":p.done?`Continue · ${p.done} of ${p.total}`:"A little of everything",'startUnifiedPractice','mixed'],
 ['trace-say','Trace & Say','Letters · numbers · words','traceLaunch','trace'],
 ['words-names','Words & Names','Personal words and names','traceWordsLaunch','words'],
 ['colours-shapes','Colours & Shapes','Look · choose · learn','csLaunch','shapes'],
 ['numbers-maths','Numbers & Maths','Count · add · take away','mathLaunch','maths'],
 ['match-understand','Match & Understand','Find · match · sort','muLaunch','understand']
];const waps=`<section class="practice-tool-row practice-native-grid v51-practice-grid" data-practice-panel="waps">${tools.map(x=>`<button class="practice-tool-card v51-practice-card ${x[4]}" data-action="${x[3]}">${uiIcon(x[0],'practice-tool-icon')}<span><b>${x[1]}</b><small>${x[2]}</small></span><i>›</i></button>`).join('')}</section>`;
const explore=`<section class="explore-more-grid" data-practice-panel="explore"><div class="explore-more-intro"><span class="eyebrow">EXPLORE MORE</span><h2>More free places to read, create, explore and play.</h2><p>Carefully selected extras that complement WAPS learning and play.</p></div>${EXTERNAL_LEARNING_RESOURCES.map(r=>`<a class="external-learning-card v51-external-card resource-${r.id}" href="${r.url}" target="_blank" rel="noopener noreferrer" data-external-learning="${r.id}" aria-label="${esc(r.title)} — external website"><span class="external-card-icon">${uiIcon(r.icon||'explore-more','external-resource-icon')}</span><span class="external-card-copy"><span class="external-card-tag">${esc(r.tag||'EXPLORE')}</span><b>${esc(r.title)}</b><small>${esc(r.description)}</small><em><span>${esc(r.ageNote)}</span><span>External website ↗</span></em></span></a>`).join('')}<p class="external-resource-note">Explore More websites are separate from WAPS and need internet access. Their content, advertising, privacy practices and difficulty may differ. A caregiver should review a website before independent child use.</p></section>`;
return `<div class="reference-page practice-library tabbed-practice-home v51-practice-home">
<section class="practice-simple-head"><span class="eyebrow">PRACTICE</span><h1>Practice Together</h1><p>Choose an activity.</p></section>
<div class="practice-tabs" role="tablist" aria-label="Practice sections"><button role="tab" data-practice-tab="waps" aria-selected="${practiceTab==='waps'}">WAPS Activities</button><button role="tab" data-practice-tab="explore" aria-selected="${practiceTab==='explore'}">Explore More</button></div>
${practiceTab==='explore'?explore:waps}
</div>`}
let currentAct=null,currentSet=0,currentPracticeRef=null,practiceUnified=false,currentPracticeSessionId=null;
function unifiedActivity(){
 let p=practiceProgress();if(p.complete){go('practice');return}
 let key=p.st.order[p.st.cursor],[activityId,setIndexRaw]=key.split('::'),setIndex=Number(setIndexRaw),a=ACTIVITY_SETS.find(x=>x.id===activityId);
 if(!a||!a.sets?.[setIndex]){resetPracticeRound().then(()=>unifiedActivity());return}
 practiceUnified=true;currentPracticeRef=key;currentAct=a;currentSet=setIndex;
 drawActivity(a,setIndex,{unified:true,position:p.st.cursor+1,total:p.total,round:p.st.round});
}
function activity(id){let a=ACTIVITY_SETS.find(x=>x.id===id);if(!a)return;practiceUnified=false;currentPracticeRef=null;currentAct=a;currentSet=Math.floor(Math.random()*a.sets.length);drawActivity(a,currentSet,{unified:false,position:1,total:1,round:1})}
function drawActivity(a,setIndex,meta={}){
 document.body.dataset.view='focus';
 currentPracticeSessionId=null;
 let [target,choices]=a.sets[setIndex],q=resolvedPracticeQuestion(a,target),randomized=shuffled(choices),isMessage=a.domain==="Self-advocacy"||a.domain==="Communication repair"||a.engine==="communicate";
 main.innerHTML=`<div class="activity-shell premium-activity ${isMessage?"message-practice":""} ${meta.unified?"unified-question":""}">
 <div class="activity-breadcrumb"><button class="round-back btn ghost" data-route="practice" aria-label="Leave practice">←</button><span>PRACTICE TOGETHER</span><strong>${meta.unified?`${meta.position} / ${meta.total}`:""}</strong></div>
 <div class="activity-banner"><button class="listen-prompt" data-action="repeatPrompt" aria-label="Hear it">🔊</button><div class="prompt">${esc(q)}</div></div>
 <div class="choices choices-${randomized.length}">${randomized.map(c=>`<button class="choice ${isMessage?"message-choice":""}" data-choice="${c}" data-target="${target}">${isMessage?`<span class="message-symbol symbol-${c}" aria-hidden="true"></span>`:visualHTML(c,"activity-photo")}<span>${a.engine==="label"?"":esc(concept[c].label)}</span></button>`).join("")}</div>
 <section class="practice-response-panel" aria-live="polite"><div id="feedback"></div><div class="support-question"><h3>How much help?</h3><div class="support-buttons"><button type="button" class="support-choice" data-support="Independent"><span>By themselves</span></button><button type="button" class="support-choice" data-support="Gesture"><span>A little help</span></button><button type="button" class="support-choice" data-support="Verbal cue"><span>Spoken help</span></button><button type="button" class="support-choice" data-support="Direct assistance"><span>Full help</span></button></div><select id="promptLevel" class="visually-hidden" aria-label="How much help was needed?"><option selected>Not recorded</option><option>Independent</option><option>Gesture</option><option>Verbal cue</option><option>Direct assistance</option></select></div></section>
 <div class="activity-footer"><button class="activity-back btn ghost" data-route="practice">Leave</button>${autoVoiceButtonHTML()}<button class="activity-repeat btn" data-action="repeatPrompt">🔊 Hear again</button></div></div>`;nav();syncAutoVoiceButtons();
 if(meta.unified&&autoVoiceEnabled()&&WAPSVoice.available())setTimeout(()=>{if(practiceUnified&&currentPracticeRef&&autoVoiceEnabled())WAPSVoice.speak(q,{mode:'learning',rate:.86})},220)
}
function coach(){let icons=["◎","◷","●","↔","★","→","○","+"];let options=COACH_ROUTINES.map((x,i)=>`<button class="coach-simple-card" data-coach="${x.id}"><span class="coach-simple-icon" aria-hidden="true">${icons[i%icons.length]}</span><b>${esc(x.title)}</b><i>›</i></button>`).join("");return `<div class="reference-page coach-home"><section class="coach-simple-head"><span class="eyebrow">COACH</span><h1>What are you doing?</h1><p>Choose one. WAPS will guide you.</p></section><section class="coach-simple-grid">${options}</section><div class="coach-simple-note"><b>Watch. Wait. Respond.</b></div></div>`}
let coachRun=null,coachStep=0;function coachScreen(id){coachRun=COACH_ROUTINES.find(x=>x.id===id);coachStep=0;drawCoachStep()}function drawCoachStep(){let s=coachRun.steps[coachStep],isWait=s[0]==='Wait';main.innerHTML=`<div class="coach-wrap"><button class="btn ghost" data-route="coach">← Coach choices</button><div class="coach-card" style="margin-top:14px"><div class="coach-visual" aria-hidden="true">${isWait?'◷':'◎'}</div><div class="eyebrow" style="margin-top:18px">Step ${coachStep+1} of ${coachRun.steps.length}</div><h2>${esc(s[0])}</h2><p>${esc(s[1])}</p>${isWait?'<div class="timer" id="waitTimer">8</div><p class="mini">Eight seconds is only a gentle example—not a universal rule.</p>':''}<div class="actions" style="justify-content:center"><button class="btn ghost" data-action="coachPrev" ${coachStep===0?'disabled':''}>Back</button><button class="btn" data-action="coachNext">${coachStep===coachRun.steps.length-1?'Record interaction':'Next'}</button></div></div></div>`;if(isWait)startTimer();nav()}
let timerId;function startTimer(){clearInterval(timerId);let n=8;timerId=setInterval(()=>{let e=$('#waitTimer');if(!e){clearInterval(timerId);return}n--;e.textContent=Math.max(0,n);if(n<=0)clearInterval(timerId)},1000)}
function progress(){let p=active(),ins=progressInsightData(),sessions=ins.sessions,obs=ins.obs,real=obs.filter(x=>x.context==="real-life").length,sp=obs.filter(x=>x.spontaneous).length;return `<div class="reference-page progress-page simple-progress"><section class="progress-simple-head"><span class="eyebrow">PROGRESS</span><h1>${p?esc(p.name)+"’s progress":"Progress"}</h1></section><section class="story-stats"><article><strong>${sessions.length}</strong><b>Practice</b></article><article><strong>${ins.currPct}%</strong><b>By themselves</b></article><article><strong>${real}</strong><b>Everyday use</b></article><article><strong>${sp}</strong><b>Started it</b></article></section><section class="progress-insight-grid"><article class="insight-card"><span class="eyebrow">RECENT</span><p>${esc(ins.trend)}</p></article><article class="insight-card emphasis"><span class="eyebrow">TRY NEXT</span><p>${esc(ins.next)}</p></article></section>${Trace.progressHTML()}${ConceptLearning.progressHTML()}${MathLearning.progressHTML()}${ComprehensionLearning.progressHTML()}<div class="simple-progress-actions"><button class="btn" data-action="report">Print summary</button><button class="btn ghost" data-action="handoff">School handoff</button></div></div>`}
const MORE_GROUPS={
 child:{title:"My Child",items:[["Profile","profile"],["Goals","goals"],["Progress","progressOpen"],["Family check-in","needsCheck"],["Communication discovery","discovery"]]},
 school:{title:"School & Sharing",items:[["Communication passport","passport"],["School support","schoolSupport"],["Home ↔ School","handoff"],["Visual supports","supports"]]},
 learn:{title:"Learn & Print",items:[["Caregiver learning","academy"],["Print tools","printCentre"],["Everyday routines","routines"],["No materials","noMaterials"],["Caregiver handbook","handbook"]]},
 help:{title:"Find Help",items:[["Help now","guideMe"],["Coach","openCoach"],["School Shadow / Caregiver","shadowHelp"],["Where does it hurt?","pain"],["Find help in Jamaica","jamaicaHelp"],["Difficult moments","difficultMoments"]]},
 settings:{title:"App Settings",items:[["Settings","settings"],["Background music","settings"],["Install WAPS","installWaps"],["Share WAPS","shareApp"],["Backup & restore","backup"],["Child mode","childMode"]]},
 about:{title:"About WAPS",items:[["About WAPS","about"],["Professional view","professional"]]}
};
function moreGroupModal(key){const g=MORE_GROUPS[key];if(!g)return;show(`<div class="more-group-sheet"><button class="btn ghost" data-action="closeModal">← More</button><span class="eyebrow">MORE</span><h1>${esc(g.title)}</h1><div class="more-group-list">${g.items.map(x=>`<button data-action="${x[1]}"><b>${esc(x[0])}</b><i>›</i></button>`).join("")}</div></div>`,true)}
function more(){let groups=[["child","My Child","Profile & progress","child-profile"],["school","School & Sharing","School tools","school-sharing"],["learn","Learn & Print","Lessons & printables","learn-print"],["help","Find Help","Help for families","find-help"],["settings","App Settings","Accessibility & backup","settings"],["about","About WAPS","About this app","about-waps"]];return `<div class="reference-page more-page simple-more v51-more"><section class="more-simple-head"><span class="eyebrow">MORE</span><h1>More tools</h1><p>Caregiver tools and support.</p></section><section class="more-group-grid">${groups.map(x=>`<button class="more-group-card ${x[0]}" data-action="moreGroup" data-more-group="${x[0]}">${uiIcon(x[3],'more-group-icon')}<span><b>${x[1]}</b><small>${x[2]}</small></span><i>›</i></button>`).join("")}</section></div>`}
function render(){WAPSVoice.stop();document.body.dataset.view='page';Trace?.cleanup();ConceptLearning?.cleanup();MathLearning?.cleanup();ComprehensionLearning?.cleanup();clearInterval(timerId);let r=route();if(!['home','talk','practice','coach','progress','more'].includes(r))r='home';if(S.settings.childMode&&!['home','talk','practice'].includes(r))r='home';document.body.dataset.route=r;main.innerHTML={home:home,talk:talk,practice:practice,coach:coach,progress:progress,more:more}[r]();if(['practice','coach','progress','more'].includes(r)&&!S.settings.childMode)main.insertAdjacentHTML('afterbegin','<div class="actions" data-reader-ignore style="justify-content:flex-end;margin:0 0 10px">'+autoVoiceButtonHTML()+'<button class="btn ghost" data-action="speakPage">🔊 Read this page</button></div>');nav();if(r==='home')hydrateV59Home();if(r==='talk'){drawAAC();drawSentence()}syncChildModeUI()}
function profileModal(){let profiles=S.profiles.map(p=>`<div class="list-item"><b>${esc(p.name)}</b><div class="mini">${esc((p.modes||[]).join(', ')||'Modes not recorded')}${p.interests?.length?' · '+esc(p.interests.slice(0,3).join(', ')):''}</div><div class="actions"><button class="btn secondary choose-profile" data-id="${p.id}">Use profile</button><button class="btn ghost edit-profile" data-id="${p.id}">Edit</button></div></div>`).join('');show(`<h2>My child</h2><div class="list">${profiles||'<p>No profiles yet.</p>'}</div><hr><h3>Add a child</h3><div class="field"><label>Child name<input id="pname" maxlength="40"></label></div><div class="field"><label>Photo (optional)<input id="profilePhoto" type="file" accept="image/*"></label></div><div class="field"><label>What would help most?<input id="priority" maxlength="120" placeholder="e.g. ask for help more easily"></label></div><div class="field"><label>Likes<input id="interests" maxlength="180" placeholder="e.g. music, buses, water, letters"></label></div><div class="field"><label>How does your child communicate?</label><div class="checks">${['Speech','AAC','Pointing','Gesture','Pictures','Signs','Writing/typing','Vocalization'].map(x=>`<label class="check"><input type="checkbox" name="mode" value="${x}">${x}</label>`).join('')}</div></div><div class="field"><label>Language context<select id="lang"><option>English</option><option>Jamaican Creole / Patwa</option><option>English + Jamaican Creole / Patwa</option><option>Other / multilingual</option></select></label></div><details class="passport-details"><summary>More details (optional)</summary><div class="field"><label>How YES looks/sounds<input id="yesSignal" placeholder="e.g. nods, says yes, taps YES"></label></div><div class="field"><label>How NO/refusal looks/sounds<input id="noSignal" placeholder="e.g. says no, turns away, pushes away"></label></div><div class="field"><label>How HELP is requested<input id="helpSignal"></label></div><div class="field"><label>How BREAK is requested<input id="breakSignal"></label></div><div class="field"><label>How pain/discomfort may be shown<input id="painSignal"></label></div><div class="field"><label>What helps when overwhelmed<input id="calms"></label></div></details><button class="btn" data-action="saveProfile">Save profile</button>`)}
function editProfile(id){let p=S.profiles.find(x=>x.id===id);if(!p)return;show(`<h2>Edit ${esc(p.name)}</h2><div class="profile-edit-photo">${p.photo?`<img src="${p.photo}" alt="" class="profile-photo-preview">`:''}</div><div class="field"><label>Preferred name<input id="epname" value="${esc(p.name)}"></label></div><div class="field"><label>Change profile photo<input id="editProfilePhoto" type="file" accept="image/*"></label></div><div class="field"><label>Caregiver priority<input id="epriority" value="${esc(p.priority||'')}"></label></div><div class="field"><label>Interests<input id="einterests" value="${esc((p.interests||[]).join(', '))}" placeholder="music, cars, water play"></label></div><details class="passport-details" open><summary>Communication passport details</summary><div class="field"><label>YES<input id="eyesSignal" value="${esc(p.yesSignal||'')}"></label></div><div class="field"><label>NO / refusal<input id="enoSignal" value="${esc(p.noSignal||'')}"></label></div><div class="field"><label>HELP<input id="ehelpSignal" value="${esc(p.helpSignal||'')}"></label></div><div class="field"><label>BREAK<input id="ebreakSignal" value="${esc(p.breakSignal||'')}"></label></div><div class="field"><label>Pain / discomfort<input id="epainSignal" value="${esc(p.painSignal||'')}"></label></div><div class="field"><label>What helps when overwhelmed<input id="ecalms" value="${esc(p.calms||'')}"></label></div></details><div class="notice">WAPS does not score Jamaican Creole grammar as incorrect Standard English. Language difference and disorder are not the same thing.</div><div class="actions"><button class="btn" data-save-edit="${id}">Save</button><button class="btn danger" data-delete-profile="${id}">Delete profile</button></div>`)}
function goalsModal(){let p=active();if(!p){profileModal();return}let goals=S.goals.filter(x=>x.profile===p.id);show(`<h2>${esc(p.name)}’s goals</h2><div class="list">${goals.map(g=>`<div class="list-item"><b>${esc(g.text)}</b><div class="mini">${g.active?'Active':'Paused'}</div><button class="btn ghost toggle-goal" data-id="${g.id}">${g.active?'Pause':'Activate'}</button></div>`).join('')||'<p>No goals yet.</p>'}</div><div class="field"><label>New goal<input id="goalInput" maxlength="160" placeholder="e.g. Ask for HELP using any reliable communication mode"></label></div><button class="btn" data-action="saveGoal">Add goal</button>`)}
function recommendActivity(p,g){let text=((g?.text||'')+' '+(p?.priority||'')).toLowerCase();let rules=[['help','repair-choice'],['choice','functional-choice'],['food','food-choice'],['drink','drinks'],['body','body-parts'],['feeling','feelings-more'],['school','school-tools'],['people','people-choice'],['place','places2'],['routine','routine-choice'],['word','word-picture'],['action','more-actions'],['understand','food-identify'],['aac','more-finished']];for(const [k,id] of rules)if(text.includes(k))return ACTIVITY_SETS.find(x=>x.id===id);let recent=new Set(S.sessions.filter(x=>x.profile===p?.id).slice(-5).map(x=>x.activity));return ACTIVITY_SETS.find(x=>!recent.has(x.id))||ACTIVITY_SETS[0]}
function todayModal(){dailyPlanModal(5)}
function supportsModal(){let saved=S.supports.filter(x=>x.type==='routine'&&(!S.active||x.profile===S.active));show(`<h2>Visual supports & routines</h2><p>Build supports for real routines. These are communication aids—not behaviour-compliance charts.</p><div class="tool-grid"><div class="support-board"><h3>First → Then</h3><div class="field"><input id="firstText" placeholder="First"></div><div class="field"><input id="thenText" placeholder="Then"></div><button class="btn secondary" data-action="makeFirstThen">Create</button><div id="firstThenOut"></div></div><div class="support-board"><h3>Choice board</h3><div class="field"><input id="choiceA" placeholder="Choice 1"></div><div class="field"><input id="choiceB" placeholder="Choice 2"></div><button class="btn secondary" data-action="makeChoice">Create</button><div id="choiceOut"></div></div><div class="support-board"><h3>Visual timer</h3><div class="session-choice"><button class="btn secondary timer-start" data-seconds="60">1 min</button><button class="btn secondary timer-start" data-seconds="180">3 min</button><button class="btn secondary timer-start" data-seconds="300">5 min</button><button class="btn secondary timer-start" data-seconds="600">10 min</button></div><div id="visualTimer" class="big-timer">—</div></div></div><div class="support-board routine-builder" style="margin-top:14px"><span class="eyebrow">VISUAL ROUTINE BUILDER</span><h3>Build a routine the child can follow</h3><div class="template-chips"><button data-routine-template="morning">Morning</button><button data-routine-template="bedtime">Bedtime</button><button data-routine-template="school">School</button><button data-routine-template="clinic">Clinic visit</button></div><div class="field"><label>Routine name<input id="routineName" placeholder="e.g. Getting ready for school"></label></div><div class="routine-inputs">${[1,2,3,4,5,6].map(i=>`<label><span>${i}</span><input id="routine${i}" placeholder="Step ${i}"></label>`).join('')}</div><button class="btn" data-action="saveRoutine">Save routine</button>${saved.length?`<div class="saved-routines"><h4>Saved routines</h4>${saved.map(r=>`<button data-open-routine="${r.id}"><b>${esc(r.name)}</b><small>${r.steps.length} steps</small><i>›</i></button>`).join('')}</div>`:''}</div><div class="support-board" style="margin-top:14px"><h3>Feelings, body & needs</h3><div class="actions"><button class="btn secondary" data-support-board="feelings">Feelings</button><button class="btn secondary" data-support-board="body">Body / hurts</button><button class="btn secondary" data-support-board="safety">Help / break / stop</button><button class="btn secondary" data-action="pain">Where does it hurt?</button></div><div id="supportVisuals" class="tool-grid" style="margin-top:12px"></div></div><div class="support-board" style="margin-top:14px"><h3>Communication passport</h3><p>Print a simple summary of how the child communicates and what partners should know.</p><button class="btn secondary" data-action="passport">Create passport</button></div>`) }
function academyModal(){let done=S.settings.academyDone||[],pct=Math.round(done.length/LESSONS.length*100);show(`<div class="academy-launch"><span class="eyebrow">LEARN WITH WAPS</span><h1>Choose quick learning or the full caregiver course.</h1><div class="academy-path-grid"><button data-action="courseHome"><span>🎓</span><b>Full Caregiver Skills Course</b><small>15 structured modules, quizzes, journal, home activities and a participation record.</small></button><div><span>⚡</span><b>Quick Caregiver Academy</b><small>Short lessons you can use immediately.</small></div></div><h2>Quick Caregiver Academy</h2><div class="academy-progress"><span style="width:${pct}%"></span></div><p class="mini">${done.length} of ${LESSONS.length} practised</p><div class="academy-demo"><div><span>1</span><b>CONNECT</b><small>Join what already has attention.</small></div><i>→</i><div><span>2</span><b>MODEL</b><small>Show one useful message.</small></div><i>→</i><div><span>3</span><b>WAIT</b><small>Pause and watch the whole child.</small></div><i>→</i><div><span>4</span><b>RESPOND</b><small>Make communication work.</small></div></div>${LESSONS.map((x,i)=>`<details class="lesson"><summary><b>${done.includes(i)?'✓ ':''}${i+1}. ${esc(x[0])}</b></summary><p>${esc(x[1])}</p><div class="lesson-see"><b>SEE IT:</b><span>Model once → pause → notice any meaningful response → respond to the message.</span></div><div class="notice"><b>TRY IT:</b> ${esc(x[2])}</div><button class="btn secondary academy-done" data-lesson="${i}" style="margin-top:10px">${done.includes(i)?'Practised ✓':'I practised this'}</button></details>`).join('')}</div>`,true)}
function discoveryModal(){let p=active();if(!p)return profileModal();show(`<h2>Communication discovery</h2><p>This is not a test or diagnosis. Notice what ${esc(p.name)} already does and choose what would make daily life easier.</p><div class="discovery-step"><b>1 · How does communication happen now?</b><p>${esc((p.modes||[]).join(', ')||'Add communication modes in the profile.')}</p></div><div class="discovery-step"><b>2 · Watch for purpose</b><p>During one familiar routine, notice requesting, rejecting, commenting, asking for help, choosing, greeting or sharing attention.</p></div><div class="discovery-step"><b>3 · Notice independence</b><p>Did the message happen independently, after a natural cue, or after direct help?</p></div><div class="discovery-step"><b>4 · Choose one priority</b><p>Current caregiver priority: <strong>${esc(p.priority||'not recorded yet')}</strong></p></div><div class="actions"><button class="btn" data-action="goals">Turn priority into a goal</button><button class="btn secondary" data-observe="Communication discovery">Record what I noticed</button></div>`)}
function syncChildModeUI(){
 const on=!!S.settings.childMode;
 document.body.classList.toggle('child-mode-active',on);
 if(on){
   if(!document.querySelector('#childModeExitDock'))document.body.insertAdjacentHTML('beforeend','<button id="childModeExitDock" class="child-mode-exit-dock" aria-label="Hold to exit Child Mode">•••</button>');
 }else{
   document.querySelector('#childModeExitDock')?.remove();
   document.querySelector('#childLock')?.remove();
 }
}
async function enterChildMode(){
 S.settings.childMode=true;await persist();syncChildModeUI();
 document.querySelector('#childLock')?.remove();
 document.body.insertAdjacentHTML('beforeend',`<div class="child-lock" id="childLock"><div class="child-top"><div class="brand"><img src="./icon.svg" alt=""><span><b>WAPS</b><small>Child Mode</small></span></div><button class="btn ghost hold-exit" id="holdExit">Hold to exit</button></div><div class="child-content"><div class="hero"><h1>What do you want to do?</h1><p>Choose Talk or Practice.</p><div class="actions"><button class="btn light child-go" data-child-route="talk">Talk</button><button class="btn secondary child-go" data-child-route="practice">Practice Together</button></div></div><div class="notice"><b>Your communication matters.</b> You can say NO, STOP, HELP or BREAK at any time.</div></div></div>`);
}
async function exitChildMode(){
 S.settings.childMode=false;await persist();document.querySelector('#childLock')?.remove();syncChildModeUI();go('home');
}
function routinesModal(){show(`<h2>Everyday communication routines</h2><p>Choose a routine already happening today. Keep communication useful and natural.</p><div class="list">${ROUTINES.map(x=>`<details class="lesson"><summary><b>${esc(x[0])}</b></summary><p>${esc(x[1])}</p><button class="btn secondary" data-observe="${esc(x[0])}">Record real-life use</button></details>`).join('')}</div>`)}
function noMaterialsModal(){show(`<h2>No materials needed</h2><p>Use the people and environment already around you.</p>${NO_MATERIALS.map((x,i)=>`<div class="notice" style="margin:10px 0"><h3>${i+1}. ${esc(x[0])}</h3><p>${esc(x[1])}</p></div>`).join('')}<button class="btn" data-close-route="coach">Guide me through a routine</button>`)}
function handbookModal(){show(`<div id="handbook"><div class="eyebrow">WAPS caregiver handbook</div><h1>Helping communication grow in everyday life</h1><p>Plain-language principles for home communication support.</p>${HANDBOOK.map((x,i)=>`<section class="handbook-section"><h2>${i+1}. ${esc(x[0])}</h2><p>${esc(x[1])}</p></section>`).join('')}<div class="notice"><b>Clinical boundary:</b> WAPS supports home communication practice. It is not a standardized assessment, diagnosis, or substitute for individualized professional care when that is needed.</div></div><button class="btn" data-action="print">Print / Save PDF</button>`)}
function helpModal(){show(`<h2>Help now</h2><div class="help-shortcuts"><button class="btn" data-action="guideMe">💜 Guide me right now</button><button class="btn secondary" data-action="pain">🩹 Where does it hurt?</button><button class="btn secondary" data-action="jamaicaHelp">🇯🇲 Find help in Jamaica</button></div><div class="list">${HELP.map((x,i)=>`<button class="list-item help-item" data-help="${i}" style="text-align:left"><b>${esc(x[0])}</b></button>`).join('')}</div><div id="helpAnswer"></div>`)}

function makeTextPdf(title,sourceLines){
 const wrap=(s,n=88)=>{let words=String(s).split(/\s+/),rows=[],line='';for(const w of words){if((line+' '+w).trim().length>n){rows.push(line);line=w}else line=(line+' '+w).trim()}if(line)rows.push(line);return rows};
 const clean=s=>String(s).replace(/[\\()]/g,m=>'\\'+m).replace(/[^\x20-\x7E]/g,' ');
 const lines=[title,'',...sourceLines.flatMap(x=>wrap(x))],per=48,pages=[];for(let i=0;i<lines.length;i+=per)pages.push(lines.slice(i,i+per));
 const objs=[];objs[1]='<< /Type /Catalog /Pages 2 0 R >>';const kids=[];objs[3]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
 pages.forEach((pg,i)=>{let pid=4+i*2,cid=5+i*2;kids.push(pid+' 0 R');let stream='BT /F1 10 Tf 48 790 Td 14 TL '+pg.map(x=>'('+clean(x)+') Tj T*').join(' ')+' ET';objs[pid]=`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${cid} 0 R >>`;objs[cid]=`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`});
 objs[2]=`<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${pages.length} >>`;
 let pdf='%PDF-1.4\n',offset=[0];for(let i=1;i<objs.length;i++){offset[i]=pdf.length;pdf+=i+' 0 obj\n'+objs[i]+'\nendobj\n'}let xref=pdf.length;pdf+='xref\n0 '+objs.length+'\n0000000000 65535 f \n';for(let i=1;i<objs.length;i++)pdf+=String(offset[i]).padStart(10,'0')+' 00000 n \n';pdf+='trailer\n<< /Size '+objs.length+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF';return pdf;
}
const SHADOW_REQUIREMENTS_SOURCE=[
'Requirements for a Shadow/Caregiver',
'All candidates who will be engaged as Shadow/Caregivers MUST be between the ages 18 and 58 years.',
'MUST submit 2 Character References from a Justice of the Peace, Gazetted Police Officer, Minister of Religion, School Principal or Government Official. The references MUST be signed and stamped. Referees may be contacted and questioned prior to formal engagement of the shadow/caregiver.',
'MUST have at least a Grade Nine level of Education. Shadows/Caregivers for students at the secondary level may be required to demonstrate competence in English Language and Mathematics.',
'MUST attend the initial training session conducted by the Special Education Unit (SEU). Must agree to participate in any subsequent training sessions to which they are invited by the SEU. MUST attend any training sessions at the school, once invited.',
'Candidates may be recommended by the parent/s of the child needing the Shadow/Caregiver or by the Principal of the school which the child is attending or by MoEYI personnel. The candidate must be known personally to the person making the recommendation.',
'MUST be present at school every day, even if the student is absent. MUST sign a new contract at the start of each academic year in which they are engaged. The contract must be signed before assuming duties.',
'Documents to be Submitted',
'Two (2) Character References from a Justice of the Peace, Gazetted Police Officer, Minister of Religion, School Principal or Government Official. The references MUST be signed and stamped.',
'One (1) passport-sized photograph; Proof of qualifications; TRN; NIS Card; Government issued identification card; Medical Certificate; Bank Account Information Card from a commercial bank; Birth Certificate; Marriage Certificate (If Applicable).',
'A letter of assumption indicating that they have assumed the post and the commencement date. The assumption letter must be dated and submitted on the first day of engagement each school year and should be signed by the Shadow/Caregiver and their Supervisor at the school and be stamped with the school stamp.',
'WAPS note: This document was supplied to WAPS. Confirm current requirements with the Ministry of Education, Skills, Youth and Information or your Regional Special Needs Coordinator before applying.'
];
const SHADOW_JOB_SOURCE=[
'JOB DESCRIPTION - Special Needs CARE GIVER/Shadow',
'Under the immediate supervision of a school nurse, assigned supervisor or administrator, performs a variety of caregiving, learning support and mobility activities for a student or group of students. Work is performed based upon standard practices and clearly defined procedures.',
'The duties of a Care Giver/shadow will differ depending on the specific needs of the student(s), to which he or she is assigned, and the services required.',
'Essential Functions:',
'1. Assist teachers in meeting the educational needs of the assigned student(s), including accessing classrooms, writing, and attending to accidents related to body waste.',
'2. Assist and monitor students in various areas such as devotional exercises, classroom management, school projects and physical education.',
'3. Participate in co-curricular activities organized by the school to benefit the student(s).',
'4. Provide support during lunch and recess, field trips, play, and use of the school library, science/computer laboratory or other facilities.',
'5. Assist in keeping the school environment clean, particularly bathroom areas assigned for student(s) use.',
'6. Escort students using mobility devices from one on-site/classroom location to another.',
'7. Assist with general hygiene at school, including hand washing and toileting needs.',
'8. Assist students who have mobility/handwriting challenges.',
'9. Keep a daily log of job-related activities including toileting schedules.',
'10. Remain after school for a set period to ensure students are collected, or assist students to access transportation after school.',
'11. Participate in other activities aimed at programme development or parenting enhancement.',
'12. Collaborate with parents in providing support for student(s).',
'13. Use required devices appropriately to support learning, toileting and mobility.',
'14. Perform other related functions assigned and/or sanctioned by the supervisor.',
'Attendance and Punctuality: Care Givers are expected to be punctual and regular in attendance. Prior notice of absence should be given to the supervisor, student and parent. When absent, the appropriate leave form should be completed. Caregivers MUST attend training sessions organized to enhance competence on the job.',
'Job Summary: The function of the Care Giver/shadow is to support the learner to facilitate learning, mobility, personal care, safety and independent living. It is important that the Care Giver/shadow maintains good interpersonal relationships with student(s) in their charge, their families and other members of staff.',
'WAPS note: This job description was supplied to WAPS. Confirm current role requirements with the Ministry before relying on it for an application.'
];
function downloadShadowPdf(kind){const req=kind==='requirements',title=req?'Shadow-Caregiver Requirements':'Shadow-Caregiver Job Description',body=makeTextPdf(title,req?SHADOW_REQUIREMENTS_SOURCE:SHADOW_JOB_SOURCE);download(title.replaceAll(' ','-')+'.pdf',body,'application/pdf')}
function shadowHelpModal(){show(`<div class="shadow-help-sheet"><span class="eyebrow">FIND HELP · JAMAICA</span><h1>School Shadow / Caregiver Support</h1><p class="shadow-intro">A Shadow/Caregiver may support a learner at school with learning, mobility, personal care, safety and independence. Not every autistic child needs a shadow, and WAPS does not decide eligibility.</p>
<div class="shadow-grid">
<details open><summary>What does a Shadow/Caregiver do?</summary><ul><li>Supports classroom access and learning.</li><li>Helps across lunch, recess, trips, play and school facilities.</li><li>May assist with mobility, handwriting, hygiene and toileting where needed.</li><li>Keeps relevant daily activity records.</li><li>Collaborates with parents, teachers and school staff.</li><li>Supports safe participation and growing independence.</li></ul></details>
<details><summary>Who can become a Shadow/Caregiver?</summary><ul><li>Supplied requirements state ages 18–58.</li><li>At least Grade Nine education; secondary assignments may require English and Mathematics competence.</li><li>Two signed and stamped character references from an accepted referee.</li><li>Initial and subsequent Special Education Unit/school training.</li><li>New contract at the start of each academic year.</li></ul></details>
<details><summary>Documents you may need</summary><div class="shadow-checklist">${['2 signed/stamped character references','Passport-sized photograph','Proof of qualifications','TRN','NIS Card','Government-issued ID','Medical Certificate','Commercial-bank account information','Birth Certificate','Marriage Certificate if applicable','Assumption letter signed/stamped by the school'].map(x=>`<label><input type="checkbox"> <span>${x}</span></label>`).join('')}</div><p class="mini">This checklist stays on this screen only. Do not upload personal documents to WAPS.</p></details>
<details><summary>Training & school expectations</summary><p>The supplied requirements describe initial Special Education Unit training, later training when invited, school-based training, daily attendance expectations, and a new contract each academic year.</p></details>
</div>
<div class="shadow-downloads"><h2>Documents</h2><p>These downloadable PDFs reproduce the content supplied to WAPS. Their status as the latest 2026 Ministry versions could not be independently confirmed.</p><div class="actions"><button class="btn secondary" data-shadow-pdf="requirements">Download requirements PDF</button><button class="btn secondary" data-shadow-pdf="job">Download job description PDF</button></div></div>
<div class="notice warn"><b>Confirm before applying.</b> Requirements can change. Check the current Ministry Special Education Unit or your Regional Special Needs Coordinator.</div>
<div class="actions"><a class="btn" href="https://moey.gov.jm/special-education-unit/" target="_blank" rel="noopener noreferrer">Official Ministry Special Education Unit ↗</a></div></div>`,true)}

function settingsModal(page='home'){
 const back='<button class="settings-back" data-action="settingsPage" data-settings-page="home">← Settings</button>';
 if(page==='voice'){
  const speed=Number(S.settings.voiceSpeed??1);
  show(`<div class="settings-shell"><div class="settings-page-head">${back}<span class="eyebrow">VOICE & SOUND</span><h1>How WAPS sounds</h1><p>Keep it simple, then preview before saving.</p></div>
   <section class="settings-card"><h2>Who leads?</h2><div class="settings-choice-row two"><button class="${!autoVoiceEnabled()?'selected':''}" data-action="settingsAutoVoice" data-value="off"><b>👩‍👧 Parent leads</b><small>WAPS stays quiet until Hear is tapped</small></button><button class="${autoVoiceEnabled()?'selected':''}" data-action="settingsAutoVoice" data-value="on"><b>🔊 WAPS speaks</b><small>Short activity prompts play automatically</small></button></div><input id="autoVoiceSetting" type="hidden" value="${autoVoiceEnabled()?'on':'off'}"></section>
   <section class="settings-card"><h2>Speaking speed</h2><div class="field"><label>Speed <input id="voiceSpeedSetting" type="range" min="0.75" max="1.15" step="0.05" value="${speed}"></label><div class="mini"><span id="voiceSpeedSettingValue">${Math.round(speed*100)}%</span> · slower ↔ faster</div></div><div class="actions"><button class="btn secondary" data-action="previewVoice">🔊 Preview voice</button></div><details class="settings-fine"><summary>Fine-tune voice</summary><div class="field"><label>Pitch <input id="voicePitchSetting" type="range" min="0.8" max="1.2" step="0.05" value="${Number(S.settings.voicePitch??1)}"></label><div class="mini"><span id="voicePitchSettingValue">${Number(S.settings.voicePitch??1).toFixed(2)}</span> · deeper ↔ higher</div></div></details></section>
   <section class="settings-card"><h2>Background music</h2><label class="check audio-toggle"><input id="backgroundAudioSetting" type="checkbox" ${S.settings.backgroundAudio?'checked':''}><span><b>Play music softly</b><small>WAPS lowers it automatically while someone is speaking</small></span></label><div id="musicDetails" ${S.settings.backgroundAudio?'':'hidden'}><div class="settings-music-grid">${Object.entries(WAPS_MUSIC).map(([id,t])=>`<button class="${(S.settings.musicTune||'gentle')===id?'selected':''}" data-action="settingsMusicTune" data-value="${id}"><span>🎵</span><b>${t.name}</b><small>${t.mood}</small></button>`).join('')}</div><input id="musicTuneSetting" type="hidden" value="${S.settings.musicTune||'gentle'}"><div class="field"><label>Music volume <input id="audioVolumeSetting" type="range" min="0" max="1" step="0.05" value="${Number(S.settings.audioVolume??0.25)}"></label><div class="mini">Level: <span id="audioVolumeSettingValue">${Math.round(Number(S.settings.audioVolume??0.25)*100)}%</span></div></div></div></section>
   <div class="settings-savebar"><button class="btn" data-action="saveSettings">Save & back</button></div></div>`,true);return;
 }
 if(page==='display'){
  show(`<div class="settings-shell"><div class="settings-page-head">${back}<span class="eyebrow">DISPLAY</span><h1>Make the screen comfortable</h1><p>Choose only what helps.</p></div><section class="settings-card"><div class="simple-setting-list"><label class="check"><input id="simpleSetting" type="checkbox" ${S.settings.simpleMode?'checked':''}><span><b>Simple view</b><small>Less on the screen</small></span></label><label class="check"><input id="largeTextSetting" type="checkbox" ${S.settings.largeText?'checked':''}><span><b>Large text</b></span></label><label class="check"><input id="contrastSetting" type="checkbox" ${S.settings.highContrast?'checked':''}><span><b>High contrast</b></span></label><label class="check"><input id="reduceSetting" type="checkbox" ${S.settings.reduced?'checked':''}><span><b>Less movement</b></span></label><label class="check"><input id="stimSetting" type="checkbox" ${S.settings.lowStim?'checked':''}><span><b>Calmer screen</b><small>Quieter backgrounds and reduced stimulation</small></span></label></div></section><div class="settings-savebar"><button class="btn" data-action="saveSettings">Save & back</button></div></div>`,true);return;
 }
 if(page==='talk'){
  show(`<div class="settings-shell"><div class="settings-page-head">${back}<span class="eyebrow">TALK BOARD</span><h1>Choose a comfortable grid</h1><p>This changes how many communication cards appear across each row.</p></div><section class="settings-card"><div class="settings-choice-row three"><button class="${S.settings.grid==3?'selected':''}" data-action="settingsGrid" data-value="3"><b>3</b><small>Largest</small></button><button class="${S.settings.grid==4?'selected':''}" data-action="settingsGrid" data-value="4"><b>4</b><small>Balanced</small></button><button class="${S.settings.grid==5?'selected':''}" data-action="settingsGrid" data-value="5"><b>5</b><small>More cards</small></button></div><input id="gridSetting" type="hidden" value="${Number(S.settings.grid||4)}"></section><div class="settings-savebar"><button class="btn" data-action="saveSettings">Save & back</button></div></div>`,true);return;
 }
 if(page==='privacy'){
  show(`<div class="settings-shell"><div class="settings-page-head">${back}<span class="eyebrow">PRIVACY & APP DATA</span><h1>Your WAPS information</h1><p>WAPS saves your information on this device.</p></div><section class="settings-card"><div class="settings-privacy"><b>Stored locally</b><span>Profiles, preferences and activity records stay in this browser unless you choose to export or clear them.</span></div></section><section class="settings-card danger-zone"><span class="eyebrow">DANGER ZONE</span><h2>Reset WAPS</h2><p>This deletes WAPS data stored in this browser. It is kept away from everyday settings so it cannot be tapped accidentally.</p><button class="btn danger" data-action="resetAll">Reset WAPS data</button></section></div>`,true);return;
 }
 show(`<div class="settings-shell settings-home"><div class="settings-page-head"><span class="eyebrow">SETTINGS</span><h1>What would you like to change?</h1><p>Choose one area. No long settings list.</p></div><div class="settings-home-grid">
  <button data-action="settingsPage" data-settings-page="voice"><span>🔊</span><div><b>Voice & sound</b><small>Speaking speed, voice, music</small></div><i>›</i></button>
  <button data-action="settingsPage" data-settings-page="display"><span>👁️</span><div><b>Display</b><small>Text, movement, calmer screen</small></div><i>›</i></button>
  <button data-action="settingsPage" data-settings-page="talk"><span>💬</span><div><b>Talk board</b><small>Communication card layout</small></div><i>›</i></button>
  <button data-action="settingsPage" data-settings-page="privacy"><span>🔒</span><div><b>Privacy & app data</b><small>Local data and reset controls</small></div><i>›</i></button>
 </div></div>`,true);
}
function professionalModal(){let p=active(),g=S.goals.filter(x=>x.profile===S.active),ss=S.sessions.filter(x=>x.profile===S.active),obs=S.observations.filter(x=>x.profile===S.active);show(`<h2>Professional view</h2><div class="notice warn">Local collaboration view only. This is not secure remote clinical software and does not create a diagnosis.</div>${p?`<h3>${esc(p.name)}</h3><p><b>Caregiver priority:</b> ${esc(p.priority||'Not recorded')}</p><p><b>Communication modes:</b> ${esc((p.modes||[]).join(', ')||'Not recorded')}</p><p><b>Language context:</b> ${esc(p.language||'Not recorded')}</p><h3>Goals</h3>${g.map(x=>`<p>• ${esc(x.text)} ${x.active?'(active)':'(paused)'}</p>`).join('')||'<p>None recorded.</p>'}<h3>Recorded data</h3><p>${ss.length} sessions · ${obs.length} observations</p><button class="btn secondary" data-action="report">Print / save summary</button>`:'<p>Create a child profile first.</p>'}`)}
function customAACModal(){show(`<h2>Add personal communication</h2><div class="field"><label>Word or short phrase<input id="customLabel" maxlength="60"></label></div><div class="field"><label>Optional photo<input id="customPhoto" type="file" accept="image/*"></label></div><div class="field"><label>Optional familiar voice recording<input id="customAudio" type="file" accept="audio/*" capture></label><div class="mini">On many phones you can record a short voice clip here. Keep it brief. It stays on this device.</div></div><p class="mini">Personal photos and recordings are stored locally with WAPS data and are not silently uploaded by this static app.</p><button class="btn" data-action="saveCustomAAC">Add to WAPS Talk</button>`)}
function recordObservation(purpose='Communication'){show(`<h2>What happened?</h2><div class="field"><label>What did your child communicate?<input id="obsPurpose" value="${esc(purpose)}"></label></div><div class="field"><label>Support<select id="obsSupport"><option>Independent</option><option>Natural cue</option><option>Visual support</option><option>Gesture</option><option>Verbal cue</option><option>Model</option><option>Direct assistance</option></select></label></div><label class="check"><input id="obsSpont" type="checkbox"> Initiated spontaneously</label><button class="btn" data-action="saveObservation">Save observation</button>`)}
function report(){let p=active(),ss=S.sessions.filter(x=>x.profile===S.active),obs=S.observations.filter(x=>x.profile===S.active),goals=S.goals.filter(x=>x.profile===S.active),ins=progressInsightData();show(`<div id="printReport"><div class="eyebrow">WAPS Communication</div><h1>${esc(p?.name||'Child')} — communication summary</h1><p class="mini">Generated ${new Date().toLocaleString()}</p><p><b>Caregiver priority:</b> ${esc(p?.priority||'Not recorded')}</p><p><b>Communication modes:</b> ${esc((p?.modes||[]).join(', ')||'Not recorded')}</p><p><b>Interests:</b> ${esc((p?.interests||[]).join(', ')||'Not recorded')}</p><h3>What the records suggest</h3><p>${esc(ins.trend)}</p><p><b>Suggested next step:</b> ${esc(ins.next)}</p><h3>Goals</h3>${goals.map(x=>`<p>• ${esc(x.text)} — ${x.active?'active':'paused'}</p>`).join('')||'<p>None recorded.</p>'}<h3>Recorded activity</h3><p>${ss.length} WAPS sessions; ${obs.length} real-life/caregiver observations; ${obs.filter(x=>x.spontaneous).length} spontaneous moments recorded.</p><h3>Recent observations</h3>${obs.slice(-10).map(x=>`<p>• ${new Date(x.at).toLocaleDateString()}: ${esc(x.purpose)} — ${esc(x.support)}${x.spontaneous?' — spontaneous':''}</p>`).join('')||'<p>None recorded.</p>'}<div class="notice">This report summarizes WAPS activity and caregiver-recorded observations. It is not a standardized assessment or diagnosis.</div></div><button class="btn" data-action="print">Print / Save PDF</button>`)}
function download(name,text,type='application/json'){let u=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
async function photoData(file){if(!file)return null;return await new Promise((res,rej)=>{let img=new Image(),r=new FileReader();r.onload=()=>{img.onload=()=>{let max=360,scale=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',.78))};img.onerror=rej;img.src=r.result};r.onerror=rej;r.readAsDataURL(file)})}
async function audioData(file){if(!file)return null;if(file.size>1800000)throw Error('audio-too-large');return await new Promise((res,rej)=>{let r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)})}
const Trace=createTraceFeature({getState:()=>S,persist,active,show,toast,main,modal,go,esc,celebrate:celebrateCorrect,voice:WAPSVoice});
const TraceWords=createTraceWordsFeature({getState:()=>S,persist,active,show,toast,modal,esc,startWordSet:(ids,options)=>Trace.startWordSet(ids,options),conceptImageForWord});
const ConceptLearning=createConceptLearningFeature({getState:()=>S,persist,active,show,toast,main,modal,go,esc,celebrate:celebrateCorrect,voice:WAPSVoice});
const MathLearning=createMathLearningFeature({getState:()=>S,persist,active,show,toast,main,modal,go,esc,celebrate:celebrateCorrect,voice:WAPSVoice});
const ComprehensionLearning=createComprehensionLearningFeature({getState:()=>S,persist,active,show,toast,main,modal,go,esc,celebrate:celebrateCorrect,visualHTML,concept,voice:WAPSVoice});
document.addEventListener('click',async e=>{
  const el=e.target instanceof Element?e.target:null;if(!el)return;
  let routeBtn=el.closest('button[data-route],a[data-route]');if(routeBtn){e.preventDefault();go(routeBtn.dataset.route);return}
  if(await Trace.handleClick(el)){e.preventDefault();return}
  if(await TraceWords.handleClick(el)){e.preventDefault();return}
  if(await ConceptLearning.handleClick(el)){e.preventDefault();return}
  if(await MathLearning.handleClick(el)){e.preventDefault();return}
  if(await ComprehensionLearning.handleClick(el)){e.preventDefault();return}
  let st=el.closest('[data-start]');if(st){e.preventDefault();if(modal.open)modal.close();activity(st.dataset.start);return}
  let ch=el.closest('[data-choice]');if(ch){e.preventDefault();let choicesBox=ch.closest('.choices');if(choicesBox?.dataset.answered==='1')return;let correct=ch.dataset.choice===ch.dataset.target,a=currentAct,prompt=$('#promptLevel')?.value||'Not recorded',target=ch.dataset.target;if(choicesBox){choicesBox.dataset.answered='1';choicesBox.closest('.activity-shell')?.classList.add('answered');[...choicesBox.querySelectorAll('.choice')].forEach(b=>b.disabled=true);ch.classList.add(correct?'selected-correct':'selected-retry');let right=$(`.choice[data-choice="${target}"]`,choicesBox);if(right)right.classList.add('answer-key')}
 currentPracticeSessionId=crypto.randomUUID();
 S.sessions.push({id:currentPracticeSessionId,profile:S.active,at:now(),type:'practice',activity:a.id,domain:a.domain,target,result:correct?'correct':'supported/retry',prompt,source:practiceUnified?'WAPS unified practice':'WAPS activity'});
 let wasUnified=practiceUnified,roundComplete=false;if(wasUnified){let st=practiceState();if(st.order[st.cursor]===currentPracticeRef)st.cursor++;roundComplete=st.cursor>=st.order.length}
 if(correct)celebrateCorrect(ch);
 await persist();let fb=$('#feedback');if(fb){fb.innerHTML=`<div class="feedback ${correct?'good celebration-feedback':'support'}"><b>${correct?'✓ Great job!':'Let’s look together.'}</b><p>${correct?'Choose the help used, then go on.':'Show the answer, then try the next one.'}</p>${wasUnified?`<button class="btn" data-action="${roundComplete?'practiceFinish':'practiceNext'}">${roundComplete?'Finish this round':'Next question'} →</button>`:`<button class="btn secondary" data-observe="${esc(a.domain)}">Record real-life use</button>`}</div>`;if(window.innerWidth>760)setTimeout(()=>fb.scrollIntoView({behavior:(S.settings.reduced||S.settings.lowStim)?'auto':'smooth',block:'nearest'}),40)}return}
  let cr=el.closest('[data-coach]');if(cr){e.preventDefault();coachScreen(cr.dataset.coach);return}
  let ob=el.closest('[data-observe]');if(ob){e.preventDefault();recordObservation(ob.dataset.observe);return}
  let support=el.closest('.support-choice');if(support){e.preventDefault();[...document.querySelectorAll('.support-choice')].forEach(x=>x.classList.toggle('active',x===support));let sel=$('#promptLevel');if(sel)sel.value=support.dataset.support;if(currentPracticeSessionId){let rec=S.sessions.find(x=>x.id===currentPracticeSessionId);if(rec){rec.prompt=support.dataset.support;await persist();toast('Support level saved')}}return}
  let plan=el.closest('[data-plan]');if(plan){e.preventDefault();dailyPlanModal(Number(plan.dataset.plan)||5);return}
  let guide=el.closest('[data-guide]');if(guide){e.preventDefault();renderGuide(guide.dataset.guide);return}
  let qword=el.closest('[data-quickword]');if(qword){e.preventDefault();let id=qword.dataset.quickword,item=allAACItems().find(x=>x.id===id),label=item?.label||concept[id]?.label||id;sentence.push(label);rememberAAC(id);if(modal.open)modal.close();go('talk');return}
  let fav=el.closest('[data-favorite-toggle]');if(fav){e.preventDefault();e.stopPropagation();let id=fav.dataset.favoriteToggle,k=profileKey(),arr=[...(S.settings.aacFavorites[k]||[])];S.settings.aacFavorites[k]=arr.includes(id)?arr.filter(x=>x!==id):[id,...arr].slice(0,24);await persist();drawAAC();return}
  let rt=el.closest('[data-routine-template]');if(rt){e.preventDefault();let vals=ROUTINE_TEMPLATES[rt.dataset.routineTemplate]||[];vals.forEach((v,i)=>{let n=$('#routine'+(i+1));if(n)n.value=v});let rn=$('#routineName');if(rn&&!rn.value)rn.value=rt.dataset.routineTemplate[0].toUpperCase()+rt.dataset.routineTemplate.slice(1)+' routine';return}
  let or=el.closest('[data-open-routine]');if(or){e.preventDefault();openRoutineModal(or.dataset.openRoutine);return}
  let rs=el.closest('[data-routine-step]');if(rs){e.preventDefault();rs.classList.toggle('done');let icon=rs.querySelector('i');if(icon)icon.textContent=rs.classList.contains('done')?'✓':'○';return}
  let pp=el.closest('[data-pain-part]');if(pp){e.preventDefault();painPart=pp.dataset.painPart;[...document.querySelectorAll('[data-pain-part]')].forEach(x=>x.classList.toggle('selected',x===pp));let s=$('#painSummary');if(s)s.textContent='Selected: '+(concept[painPart]?.label||painPart)+(painLevel?' · '+painLevel:'');return}
  let pl=el.closest('[data-pain-level]');if(pl){e.preventDefault();painLevel=pl.dataset.painLevel;[...document.querySelectorAll('[data-pain-level]')].forEach(x=>x.classList.toggle('selected',x===pl));let s=$('#painSummary');if(s)s.textContent=(painPart?'Selected: '+(concept[painPart]?.label||painPart):'Pain/discomfort')+' · '+painLevel;return}
  let p=el.closest('.choose-profile');if(p){e.preventDefault();S.active=p.dataset.id;await persist();modal.close();render();return}
  let ep=el.closest('.edit-profile');if(ep){e.preventDefault();editProfile(ep.dataset.id);return}
  let sv=el.closest('[data-save-edit]');if(sv){e.preventDefault();let p=S.profiles.find(x=>x.id===sv.dataset.saveEdit);if(!p)return;p.name=$('#epname').value.trim()||p.name;p.priority=$('#epriority').value.trim();p.interests=$('#einterests').value.split(',').map(x=>x.trim()).filter(Boolean);p.yesSignal=$('#eyesSignal')?.value.trim()||'';p.noSignal=$('#enoSignal')?.value.trim()||'';p.helpSignal=$('#ehelpSignal')?.value.trim()||'';p.breakSignal=$('#ebreakSignal')?.value.trim()||'';p.painSignal=$('#epainSignal')?.value.trim()||'';p.calms=$('#ecalms')?.value.trim()||'';try{let file=$('#editProfilePhoto')?.files?.[0];if(file)p.photo=await photoData(file)}catch{}await persist();modal.close();render();toast('Profile updated');return}
  let del=el.closest('[data-delete-profile]');if(del){e.preventDefault();if(confirm('Delete this child profile and its WAPS records? This cannot be undone unless you have a backup.')){let id=del.dataset.deleteProfile;S.profiles=S.profiles.filter(x=>x.id!==id);S.sessions=S.sessions.filter(x=>x.profile!==id);S.observations=S.observations.filter(x=>x.profile!==id);S.goals=S.goals.filter(x=>x.profile!==id);S.customAAC=S.customAAC.filter(x=>x.profile!==id);S.active=S.profiles[0]?.id||null;await persist();modal.close();render()}return}
  let tg=el.closest('.toggle-goal');if(tg){e.preventDefault();let g=S.goals.find(x=>x.id===tg.dataset.id);if(g){g.active=!g.active;await persist();goalsModal()}return}
  let h=el.closest('.help-item');if(h){e.preventDefault();let x=HELP[Number(h.dataset.help)],out=$('#helpAnswer');if(out&&x)out.innerHTML=`<div class="notice" style="margin-top:14px"><h3>${esc(x[0])}</h3><p>${esc(x[1])}</p></div>`;return}
  let co=el.closest('.coach-outcome');if(co){e.preventDefault();S.sessions.push({id:crypto.randomUUID(),profile:S.active,at:now(),type:'coach',activity:coachRun.id,domain:'Caregiver coaching',result:co.dataset.result,prompt:co.dataset.result==='Independent'?'Independent':co.dataset.result,source:'Caregiver guided interaction'});await persist();modal.close();recordObservation(coachRun.title);return}
  let aac=el.closest('.aac');if(aac){e.preventDefault();let item=allAACItems().find(x=>x.id===aac.dataset.aacId);sentence.push(aac.dataset.word);rememberAAC(aac.dataset.aacId);drawSentence();if(item?.audio){try{new Audio(item.audio).play().catch(()=>{})}catch{}}return}
  let cat=el.closest('.aac-cat');if(cat){e.preventDefault();aacCat=cat.dataset.cat;$$('.aac-cat').forEach(x=>x.setAttribute('aria-pressed',x===cat?'true':'false'));drawAAC();return}
  let cm=el.closest('[data-course-module]');if(cm){e.preventDefault();courseModuleModal(Number(cm.dataset.courseModule));return}
  let pr=el.closest('[data-printable]');if(pr){e.preventDefault();printableModal(pr.dataset.printable);return}
  let closer=el.closest('[data-close-route]');if(closer){e.preventDefault();if(modal.open)modal.close();go(closer.dataset.closeRoute);return}
  let ad=el.closest('.academy-done');if(ad){e.preventDefault();let i=Number(ad.dataset.lesson);S.settings.academyDone=S.settings.academyDone||[];if(!S.settings.academyDone.includes(i))S.settings.academyDone.push(i);await persist();academyModal();return}
  let sb=el.closest('[data-support-board]');if(sb){e.preventDefault();let ids=sb.dataset.supportBoard==='feelings'?['happy','sad','tired','angry']:sb.dataset.supportBoard==='body'?['head','hand','foot','ear','mouth','hurts']:['help','break','stop','no'];let out=$('#supportVisuals');if(out)out.innerHTML=ids.map(id=>`<div class="visual-tile"><div>${visualHTML(id,'support-photo')}<div>${esc(concept[id].label)}</div></div></div>`).join('');return}
  let ts=el.closest('.timer-start');if(ts){e.preventDefault();clearInterval(timerId);let n=Number(ts.dataset.seconds),out=$('#visualTimer');let draw=()=>{let m=Math.floor(n/60),sec=n%60;if(out)out.textContent=`${m}:${String(sec).padStart(2,'0')}`};draw();timerId=setInterval(()=>{n--;draw();if(n<=0){clearInterval(timerId);if(out)out.textContent='Finished'}},1000);return}
  let cg=el.closest('.child-go');if(cg){e.preventDefault();document.querySelector('#childLock')?.remove();syncChildModeUI();go(cg.dataset.childRoute);return}
  let ptab=el.closest('[data-practice-tab]');if(ptab){e.preventDefault();practiceTab=ptab.dataset.practiceTab==='explore'?'explore':'waps';render();return}
  let ext=el.closest('[data-external-learning]');if(ext&&S.settings.childMode){e.preventDefault();toast('Ask a caregiver to open external websites.');return}
  let pdfBtn=el.closest('[data-shadow-pdf]');if(pdfBtn){e.preventDefault();downloadShadowPdf(pdfBtn.dataset.shadowPdf);return}
  let a=el.closest('[data-action]')?.dataset.action;if(!a)return;e.preventDefault();if(a==='toggleAutoVoice'){await toggleAutoVoice();return}
  if(a==='closeModal'){if(modal.open)modal.close();return}
  if(a==='moreGroup'){moreGroupModal(el.closest('[data-more-group]')?.dataset.moreGroup);return}
  if(a==='openCoach'){if(modal.open)modal.close();go('coach');return}
  if(a==='shadowHelp'){shadowHelpModal();return}
  if(a==='pageFeedback'){pageFeedbackModal();return}
  if(a==='sendPageFeedback'){sendPageFeedback();return}
  if(a==='whatsappSupport'){whatsappSupportModal();return}
  if(a==='courseHome'){courseHomeModal();return}
  if(a==='courseVideos'){courseVideosModal();return}
  if(a==='courseCertificate'){courseCertificateModal();return}
  if(a==='saveCourseJournal'){let id=Number(el.closest('[data-module]')?.dataset.module||S.course.current),t=$('#courseJournal')?.value||'';S.course.journal[id]=t;await persist();toast('Journal saved');return}
  if(a==='gradeCourseQuiz'){let id=Number(el.closest('[data-module]')?.dataset.module||S.course.current),m=COURSE_MODULES.find(x=>x.id===id);if(!m)return;let answers=[],missing=0;m.quiz.forEach((q,i)=>{let r=document.querySelector(`input[name="cq${i}"]:checked`);if(!r)missing++;else answers[i]=Number(r.value)});if(missing){toast('Answer each question first.');return}let score=m.quiz.reduce((n,q,i)=>n+(answers[i]===q.answer?1:0),0);S.course.quiz[id]={answers,score,at:now()};await persist();courseModuleModal(id);toast(`Quiz checked: ${score}/${m.quiz.length}`);return}
  if(a==='completeCourseModule'){let id=Number(el.closest('[data-module]')?.dataset.module||S.course.current);if(!S.course.quiz[id]){toast('Check the module quiz first.');return}if(!S.course.completed.includes(id))S.course.completed.push(id);S.course.completed.sort((x,y)=>x-y);await persist();if(id<COURSE_MODULES.length)courseModuleModal(id+1);else courseHomeModal();toast('Module completed ✓');return}
  if(a==='makeCourseCertificate'){let name=$('#certificateName')?.value.trim();if(!name){toast('Enter the caregiver name.');return}S.course.certificate={name,date:now(),code:'WAPS-'+new Date().getFullYear()+'-'+crypto.randomUUID().slice(0,6).toUpperCase()};await persist();courseCertificateModal();return}
  if(a==='resetCourseCertificate'){S.course.certificate=null;await persist();courseCertificateModal();return}
  if(a==='printCentre'){printCentreModal();return}
  if(a==='printSheet'){document.body.classList.add('printing-sheet');window.print();setTimeout(()=>document.body.classList.remove('printing-sheet'),800);return}
  if(a==='needsCheck'){needsCheckModal();return}
  if(a==='saveNeedsCheck'){let answers={},missing=0;QUICK_NEEDS.forEach((q,i)=>{let r=document.querySelector(`input[name="need${i}"]:checked`);if(!r)missing++;else answers[i]=Number(r.value)});if(missing){toast(`Answer ${missing} remaining question${missing===1?'':'s'}.`);return}let sums={},counts={};QUICK_NEEDS.forEach((q,i)=>{sums[q[0]]=(sums[q[0]]||0)+answers[i];counts[q[0]]=(counts[q[0]]||0)+1});let scores={};Object.keys(sums).forEach(k=>scores[k]=Math.round(sums[k]/(counts[k]*3)*100));S.needs={answers,scores,completed:now()};await persist();needsCheckModal();toast('WAPS priorities updated');return}
  if(a==='resetNeedsCheck'){S.needs={answers:{},scores:{},completed:null};await persist();needsCheckModal();return}
  if(a==='difficultMoments'){difficultMomentsModal();return}
  if(a==='saveDifficultMoment'){let rec={id:crypto.randomUUID(),profile:S.active,at:now(),before:$('#dmBefore')?.value.trim()||'',what:$('#dmWhat')?.value.trim()||'',after:$('#dmAfter')?.value.trim()||'',need:$('#dmNeed')?.value.trim()||'',helped:$('#dmHelped')?.value.trim()||''};if(!rec.what&&!rec.before){toast('Add a short description of what happened.');return}S.difficultMoments.push(rec);await persist();difficultMomentsModal();toast('Observation saved');return}
  if(a==='schoolSupport'){schoolSupportModal();return}
  if(a==='readerPlay'){readerIndex=0;startReader();return}
  if(a==='readerPause'){pauseReader();return}
  if(a==='readerStop'){stopReader();return}
  if(a==='readerClose'){closeReader();return}
  if(a==='startUnifiedPractice'){if(modal.open)modal.close();unifiedActivity();return}
  if(a==='practiceNext'){unifiedActivity();return}
  if(a==='practiceFinish'){go('practice');return}
  if(a==='newPracticeRound'){await resetPracticeRound();if(modal.open)modal.close();unifiedActivity();return}
  if(a==='practiceAbout'){show('<h2>Practice Together</h2><p>WAPS mixes different skills and remembers where you stopped.</p><div class="notice"><b>Come back anytime.</b> Your place is saved on this device.</div>');return}
  if(a==='guideMe'){guideMeModal();return}
  if(a==='progressOpen'){if(modal.open)modal.close();go('progress');return}
  if(a==='passport'){passportModal();return}
  if(a==='pain'){painPart='';painLevel='';painModal();return}
  if(a==='handoff'){handoffModal();return}
  if(a==='jamaicaHelp'){findHelpModal();return}
  if(a==='saveRoutine'){let name=$('#routineName')?.value.trim()||'My routine',steps=[1,2,3,4,5,6].map(i=>$('#routine'+i)?.value.trim()).filter(Boolean);if(!steps.length){toast('Add at least one routine step.');return}S.supports.push({id:crypto.randomUUID(),type:'routine',profile:S.active,name,steps,created:now()});await persist();supportsModal();toast('Routine saved');return}
  if(a==='savePain'){if(!painPart){toast('Choose where it hurts.');return}S.observations.push({id:crypto.randomUUID(),profile:S.active,at:now(),context:'real-life',purpose:`Pain/discomfort: ${concept[painPart]?.label||painPart}${painLevel?' ('+painLevel+')':''}`,support:'Caregiver-recorded communication',spontaneous:true,source:'WAPS pain communication tool'});await persist();toast('Pain communication recorded');if(modal.open)modal.close();go('talk');return}
  if(a==='makeHandoff'){let p=active(),goal=$('#handoffGoal')?.value.trim(),worked=$('#handoffWorked')?.value.trim(),tryIt=$('#handoffTry')?.value.trim(),out=$('#handoffOut');if(out)out.innerHTML=`<div id="handoffCard" class="handoff-card"><div class="eyebrow">WAPS HOME ↔ SCHOOL</div><h2>${esc(p?.name||'Child')}</h2><p><b>We are working on:</b> ${esc(goal||'useful communication')}</p><p><b>What worked:</b> ${esc(worked||'Please observe and record what helps.')}</p><p><b>Please try:</b> ${esc(tryIt||'Model the message, wait, and respond to any clear communication mode.')}</p><p><b>Keep available:</b> NO · STOP · HELP · BREAK</p><small>Share observations, not scores. This is a caregiver/school communication aid, not an assessment.</small></div><div class="actions"><button class="btn" data-action="print">Print / Save PDF</button><button class="btn secondary" data-action="shareHandoff">Share text</button></div>`;return}
  if(a==='shareHandoff'){let t=$('#handoffCard')?.innerText?.trim();if(!t)return;if(navigator.share){try{await navigator.share({title:'WAPS Home-School Handoff',text:t})}catch{}}else if(navigator.clipboard){await navigator.clipboard.writeText(t);toast('Handoff copied');}return}
  if(a==='shareApp'){shareAppModal();return}
  if(a==='shareAppLink'){await shareAppLink();return}
  if(a==='copyAppLink'){await copyAppLink();return}
  if(a==='showAppQr'){appQrModal();return}
  if(a==='installWaps'){await installWaps();return}
  if(a==='childMode'){if(modal.open)modal.close();enterChildMode();return}
  if(a==='discovery'){discoveryModal();return}
  if(a==='observeToday'){if(modal.open)modal.close();recordObservation('Today’s communication goal');return}
  if(a==='profile'){profileModal();return}
  if(a==='goals'){goalsModal();return}
  if(a==='today'){todayModal();return}
  if(a==='supports'){supportsModal();return}
  if(a==='academy'){academyModal();return}
  if(a==='help'){helpModal();return}
  if(a==='homeProgress'){if(modal.open)modal.close();go('progress');return}
  if(a==='homeCaregiverTools'){if(modal.open)modal.close();go('more');return}
  if(a==='homeSettings'){settingsModal();return}
  if(a==='settings'){settingsModal();return}
  if(a==='settingsPage'){settingsModal(el.closest('[data-settings-page]')?.dataset.settingsPage||'home');return}
  if(a==='settingsAutoVoice'){const v=el.closest('[data-value]')?.dataset.value==='on',input=$('#autoVoiceSetting');if(input)input.value=v?'on':'off';$('[data-action="settingsAutoVoice"]').forEach(b=>b.classList.toggle('selected',b.dataset.value===(v?'on':'off')));return}
  if(a==='settingsGrid'){const v=Number(el.closest('[data-value]')?.dataset.value||4),input=$('#gridSetting');if(input)input.value=String(v);$('[data-action="settingsGrid"]').forEach(b=>b.classList.toggle('selected',Number(b.dataset.value)===v));return}
  if(a==='settingsMusicTune'){const id=el.closest('[data-value]')?.dataset.value||'gentle',input=$('#musicTuneSetting');if(input)input.value=id;$('[data-action="settingsMusicTune"]').forEach(b=>b.classList.toggle('selected',b.dataset.value===id));const wasOn=S.settings.backgroundAudio,wasTune=S.settings.musicTune;S.settings.musicTune=id;S.settings.backgroundAudio=true;let ok=await syncBackgroundAudio(true);S.settings.backgroundAudio=wasOn;if(!wasOn)S.settings.musicTune=wasTune||'gentle';if(ok)toast('Playing '+(WAPS_MUSIC[id]?.name||'music'));return}
  if(a==='previewVoice'){const speed=Number($('#voiceSpeedSetting')?.value??S.settings.voiceSpeed??1),pitch=Number($('#voicePitchSetting')?.value??S.settings.voicePitch??1);WAPSVoice.speak('Touch each one. Great trying.',{mode:'learning',voiceSpeed:speed,voicePitch:pitch,forceDevice:true});return}
  if(a==='professional'){professionalModal();return}
  if(a==='routines'){routinesModal();return}
  if(a==='noMaterials'){noMaterialsModal();return}
  if(a==='handbook'){handbookModal();return}
  if(a==='about'){show('<h2>About WAPS</h2><p>WAPS supports caregiver-guided communication practice, AAC access and real-world generalization. It does not diagnose autism, language disorder, speech-sound disorder or motor-speech conditions, and it does not replace qualified professional care.</p>');return}
  if(a==='customAAC'){customAACModal();return}
  if(a==='speak'){let text=sentence.join(' ');if(text&&WAPSVoice.available())WAPSVoice.speak(text.toLowerCase(),{mode:'communication',rate:.92});else if(text)toast('Speech is not available on this device. The message remains visible.');return}
  if(a==='backspace'){if(sentence.length)sentence.pop();drawSentence();return}
  if(a==='clearSentence'){sentence.splice(0,sentence.length);drawSentence();return}
  if(a==='partner'){partner=!partner;let ps=$('#partnerState'),pt=$('#partnerTip');if(ps)ps.textContent=partner?'On':'Off';if(pt)pt.classList.toggle('hidden',!partner);return}
  if(a==='repeatPrompt'){let t=$('.prompt')?.textContent?.trim();if(t&&WAPSVoice.available())WAPSVoice.speak(t,{mode:'learning',rate:.86});else if(t)toast('Read-aloud is not available on this device.');return}
  if(a==='speakPage'){openReaderDock(true);return}
  if(a==='coachPrev'){if(coachStep>0){coachStep--;drawCoachStep()}return}
  if(a==='coachNext'){if(coachStep<coachRun.steps.length-1){coachStep++;drawCoachStep()}else{show('<h2>How did it go?</h2><div class="outcomes"><button class="btn secondary coach-outcome" data-result="Independent">Independent</button><button class="btn secondary coach-outcome" data-result="With help">With help</button><button class="btn secondary coach-outcome" data-result="Not yet">Not yet</button><button class="btn secondary coach-outcome" data-result="No opportunity">No opportunity</button></div>')}return}
  if(a==='saveProfile'){let name=$('#pname')?.value.trim();if(!name){toast('Add a preferred name.');return}let modes=$$('input[name=mode]:checked').map(x=>x.value),id=crypto.randomUUID(),photo=null;try{photo=await photoData($('#profilePhoto')?.files?.[0])}catch{}let priority=$('#priority')?.value.trim()||'',interests=($('#interests')?.value||'').split(',').map(x=>x.trim()).filter(Boolean);S.profiles.push({id,name,photo,priority,modes,language:$('#lang')?.value||'English',interests,yesSignal:$('#yesSignal')?.value.trim()||'',noSignal:$('#noSignal')?.value.trim()||'',helpSignal:$('#helpSignal')?.value.trim()||'',breakSignal:$('#breakSignal')?.value.trim()||'',painSignal:$('#painSignal')?.value.trim()||'',calms:$('#calms')?.value.trim()||'',created:now()});S.active=id;if(priority)S.goals.push({id:crypto.randomUUID(),profile:id,text:`Communicate about: ${priority}`,active:true,created:now()});await persist();modal.close();render();toast('Profile saved');return}
  if(a==='saveGoal'){let t=$('#goalInput')?.value.trim();if(t){S.goals.push({id:crypto.randomUUID(),profile:S.active,text:t,active:S.goals.filter(x=>x.profile===S.active&&x.active).length<3,created:now()});await persist();goalsModal()}return}
  if(a==='makeFirstThen'){let f=$('#firstText')?.value.trim(),t=$('#thenText')?.value.trim(),out=$('#firstThenOut');if(out)out.innerHTML=`<div class="support-grid" style="margin-top:12px"><div class="support-panel"><div><div class="eyebrow">FIRST</div><strong>${esc(f||'First activity')}</strong></div></div><div class="support-panel"><div><div class="eyebrow">THEN</div><strong>${esc(t||'Then activity')}</strong></div></div></div>`;return}
  if(a==='makeSchedule'){let vals=[$('#sched1')?.value,$('#sched2')?.value,$('#sched3')?.value].map(x=>(x||'').trim()).filter(Boolean),out=$('#scheduleOut');if(out)out.innerHTML='<div class="schedule-list" style="margin-top:12px">'+vals.map((v,i)=>`<div class="schedule-row"><b>${i+1}</b><span>${esc(v)}</span><span>○</span></div>`).join('')+'</div>';return}
  if(a==='makeChoice'){let x=$('#choiceA')?.value.trim(),y=$('#choiceB')?.value.trim(),out=$('#choiceOut');if(out)out.innerHTML=`<div class="support-grid" style="margin-top:12px"><div class="support-panel"><strong>${esc(x||'Choice 1')}</strong></div><div class="support-panel"><strong>${esc(y||'Choice 2')}</strong></div></div>`;return}
  if(a==='backup'){download(`WAPS-backup-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify({format:'WAPS-BACKUP',schema:2,appVersion:'1.0.0',exported:now(),data:S},null,2));return}
  if(a==='saveSettings'){
   const grid=$('#gridSetting'),simple=$('#simpleSetting'),large=$('#largeTextSetting'),contrast=$('#contrastSetting'),reduce=$('#reduceSetting'),stim=$('#stimSetting'),speed=$('#voiceSpeedSetting'),pitch=$('#voicePitchSetting'),auto=$('#autoVoiceSetting'),music=$('#backgroundAudioSetting'),tune=$('#musicTuneSetting'),volume=$('#audioVolumeSetting');
   if(grid)S.settings.grid=Number(grid.value||4);
   if(simple)S.settings.simpleMode=!!simple.checked;if(large)S.settings.largeText=!!large.checked;if(contrast)S.settings.highContrast=!!contrast.checked;if(reduce)S.settings.reduced=!!reduce.checked;if(stim)S.settings.lowStim=!!stim.checked;
   if(speed)S.settings.voiceSpeed=Number(speed.value||1);if(pitch)S.settings.voicePitch=Number(pitch.value||1);
   if(auto){S.settings.autoVoice=auto.value==='on';S.settings.autoVoicePreferenceVersion=1}
   if(music)S.settings.backgroundAudio=!!music.checked;if(tune&&WAPS_MUSIC[tune.value])S.settings.musicTune=tune.value;if(volume)S.settings.audioVolume=Number(volume.value??0.25);
   if(S.settings.backgroundAudio&&!S.settings.lowStim)await syncBackgroundAudio(true);else if(wapsMusic)wapsMusic.pause();
   await persist();document.documentElement.dataset.uiVersion='51';document.documentElement.dataset.lowStim=S.settings.lowStim?'1':'0';document.documentElement.dataset.simple=S.settings.simpleMode?'1':'0';document.documentElement.dataset.largeText=S.settings.largeText?'1':'0';document.documentElement.dataset.highContrast=S.settings.highContrast?'1':'0';settingsModal('home');toast('Settings saved');return
  }
  if(a==='resetAll'){if(confirm('Delete all WAPS data stored in this browser? Export a backup first if you need it.')){await clearAll();stopBackgroundAudio();S=fresh();modal.close();render();toast('Local WAPS data reset')}return}
  if(a==='report'){report();return}
  if(a==='print'){window.print();return}
  if(a==='saveCustomAAC'){let label=$('#customLabel')?.value.trim().toUpperCase();if(!label){toast('Add a word or phrase.');return}let file=$('#customPhoto')?.files?.[0],audioFile=$('#customAudio')?.files?.[0],photo=null,audio=null;try{photo=await photoData(file)}catch{}try{audio=await audioData(audioFile)}catch(err){if(String(err).includes('audio-too-large')){toast('Voice clip is too large. Record a shorter clip.');return}}S.customAAC.push({id:crypto.randomUUID(),profile:S.active,label,photo,audio,created:now()});await persist();modal.close();if(route()==='talk')drawAAC();toast(audio?'Personal word + familiar voice added':'Personal word added');return}
  if(a==='saveObservation'){S.observations.push({id:crypto.randomUUID(),profile:S.active,at:now(),context:'real-life',purpose:$('#obsPurpose')?.value.trim()||'Communication',support:$('#obsSupport')?.value||'Not recorded',spontaneous:!!$('#obsSpont')?.checked,source:'Caregiver real-world observation'});await persist();modal.close();toast('Observation saved');if(route()==='progress')render();return}
});
document.addEventListener('input',e=>{if(e.target.id==='aacSearch'){aacSearch=e.target.value||'';drawAAC()}if(e.target.id==='jamaicaSearch')renderJamaicaDirectory();if(e.target.id==='readerRate'){S.settings.readerRate=Number(e.target.value||0.9);persist().catch(()=>{})}if(e.target.id==='voiceSpeedSetting'){let o=$('#voiceSpeedSettingValue');if(o)o.textContent=Math.round(Number(e.target.value||1)*100)+'%'}if(e.target.id==='voicePitchSetting'){let o=$('#voicePitchSettingValue');if(o)o.textContent=Number(e.target.value||1).toFixed(2)}if(e.target.id==='backgroundAudioSetting'){let d=$('#musicDetails');if(d)d.hidden=!e.target.checked}if(e.target.id==='audioVolumeSetting'){let o=$('#audioVolumeSettingValue');if(o)o.textContent=Math.round(Number(e.target.value||0)*100)+'%';S.settings.audioVolume=Number(e.target.value||0);if(wapsMusic&&!wapsMusic.paused)setBackgroundAudioLevel()}});
document.addEventListener('change',async e=>{if(e.target.id==='jamaicaCategory'){renderJamaicaDirectory();return}if(e.target.id==='restoreFile'){let file=e.target.files[0];if(!file)return;try{let j=JSON.parse(await file.text());if(j.format!=='WAPS-BACKUP'||j.schema!==2||!j.data||!Array.isArray(j.data.profiles))throw Error('format');if(confirm(`Restore backup from ${new Date(j.exported).toLocaleString()}? This will replace current local WAPS data.`)){S=j.data;await persist();modal.close();render();toast('Backup restored')}}catch(err){alert('This is not a valid compatible WAPS backup. Current data were not changed.')}e.target.value=''}});

let holdTimer;document.addEventListener('pointerdown',e=>{if(e.target.closest('#holdExit,#childModeExitDock'))holdTimer=setTimeout(()=>{exitChildMode()},1700)});document.addEventListener('pointerup',()=>clearTimeout(holdTimer));document.addEventListener('pointercancel',()=>clearTimeout(holdTimer));
document.documentElement.dataset.lowStim=S.settings.lowStim?'1':'0';document.documentElement.dataset.simple=S.settings.simpleMode?'1':'0';document.documentElement.dataset.largeText=S.settings.largeText?'1':'0';document.documentElement.dataset.highContrast=S.settings.highContrast?'1':'0';window.addEventListener('afterprint',()=>document.body.classList.remove('printing-sheet'));window.addEventListener('hashchange',render);window.addEventListener('online',()=>$('#offlineBanner').classList.add('hidden'));window.addEventListener('offline',()=>$('#offlineBanner').classList.remove('hidden'));if(!navigator.onLine)$('#offlineBanner').classList.remove('hidden');if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(r=>r.update()).catch(console.warn);installPageFeedbackButton();syncInstallFab();render();
