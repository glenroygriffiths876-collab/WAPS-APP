export function createTraceWordsFeature(ctx){
  const {getState,persist,active,show,toast,modal,esc,startWordSet,conceptImageForWord}=ctx;
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  let editorId=null,pendingImage=null,pendingPreviewUrl=null;

  function state(){
    const S=getState();
    if(!S.trace||typeof S.trace!=='object')S.trace={prefs:{},sessions:{},history:[]};
    S.trace.wordLibrary=S.trace.wordLibrary||{};
    S.trace.wordPrefs=S.trace.wordPrefs||{};
    return S.trace;
  }
  const profileKey=()=>getState().active||'global';
  function library(){
    const t=state(),k=profileKey();
    if(!Array.isArray(t.wordLibrary[k]))t.wordLibrary[k]=[];
    return t.wordLibrary[k];
  }
  function prefs(){
    const t=state(),k=profileKey();
    if(!t.wordPrefs[k])t.wordPrefs[k]={selected:[],guidance:'guided',lineSize:'medium',showPictureDuringTrace:true,showWordGuide:true,orderMode:'chosen'};
    const p=t.wordPrefs[k];
    p.selected=Array.isArray(p.selected)?p.selected:[];
    if(typeof p.showWordGuide!=='boolean')p.showWordGuide=true;
    if(!['chosen','shuffle'].includes(p.orderMode))p.orderMode='chosen';
    return p;
  }
  function cleanWord(value){return String(value||'').trim()}
  function traceableWord(value){return /^[A-Za-z]{1,24}$/.test(cleanWord(value))}
  function findWord(id){return library().find(x=>x.id===id)||null}
  function pictureFor(rec){
    if(!rec?.image)return '';
    if(rec.image.source==='waps'&&rec.image.id){
      return `./assets/concepts/highres/${encodeURIComponent(rec.image.id)}.webp`;
    }
    if(rec.image.source==='upload'&&rec.image.data)return rec.image.data;
    return '';
  }
  function pictureHTML(rec,cls=''){
    const src=pictureFor(rec);
    return src?`<img class="${cls}" src="${src}" alt="${esc(rec.word)} picture">`:'';
  }
  function selectedIds(){
    const ids=new Set(library().map(x=>x.id));
    return prefs().selected.filter(id=>ids.has(id));
  }
  function saveSelected(ids){
    prefs().selected=[...new Set(ids)].filter(id=>findWord(id));
  }
  function selectionSummary(){
    const n=selectedIds().length;
    const el=$('#traceWordsSelectedCount');
    if(el)el.textContent=n+' selected';
  }
  function selectedOrderHTML(p){
    const ids=selectedIds();
    if(!ids.length)return '<div class="trace-word-today-empty">Tap words below to choose today’s practice.</div>';
    return '<div class="trace-word-order-list">'+ids.map((id,i)=>{
      const rec=findWord(id);if(!rec)return '';
      return '<div class="trace-word-order-row"><span class="trace-word-order-num">'+(i+1)+'</span><b>'+esc(rec.word)+'</b><div class="trace-word-order-actions"><button data-trace-word-move="'+id+'" data-dir="-1" '+(i===0?'disabled':'')+' aria-label="Move '+esc(rec.word)+' earlier">↑</button><button data-trace-word-move="'+id+'" data-dir="1" '+(i===ids.length-1?'disabled':'')+' aria-label="Move '+esc(rec.word)+' later">↓</button></div></div>';
    }).join('')+'</div>';
  }
  function render(){
    const list=library(),p=prefs();
    p.selected=selectedIds();
    const child=active(),childName=cleanWord(child?.name||'');
    const canAddName=traceableWord(childName)&&!list.some(x=>x.word.toLowerCase()===childName.toLowerCase());
    show(`<div class="trace-words-config">
      <button class="btn ghost" data-action="traceLaunch">← Trace & Say</button>
      <span class="eyebrow">WORDS & NAMES</span>
      <h1>Choose today’s words.</h1>
      <p class="trace-word-help">Your word bank stays saved. Tap only the words you want to practise now.</p>
      <div class="trace-word-toolbar">
        <button class="btn" data-action="traceWordsAdd">+ Add a word</button>
        ${canAddName?`<button class="btn secondary" data-action="traceWordsAddName">Add ${esc(childName)}</button>`:''}
      </div>
      <section class="trace-word-today">
        <div class="trace-word-today-head"><div><span class="eyebrow">TODAY’S PRACTICE</span><b id="traceWordsSelectedCount">${p.selected.length} selected</b></div><button class="btn ghost" data-action="traceWordsClearSelection" ${p.selected.length?'':'disabled'}>Clear</button></div>
        <div class="trace-word-order-mode"><button class="${p.orderMode==='chosen'?'selected':''}" data-trace-word-order-mode="chosen"><b>My order</b><small>Use the order below</small></button><button class="${p.orderMode==='shuffle'?'selected':''}" data-trace-word-order-mode="shuffle"><b>Shuffle each round</b><small>Mix the selected words</small></button></div>
        ${p.orderMode==='chosen'?selectedOrderHTML(p):'<div class="trace-word-shuffle-note">WAPS will mix the selected words each time this set is practised.</div>'}
      </section>
      <div class="trace-word-privacy"><b>Word bank</b><span>Tap a word to add or remove it from today’s practice.</span></div>
      <div class="trace-word-list">
        ${list.length?list.map(rec=>`<article class="trace-word-card ${p.selected.includes(rec.id)?'selected':''}">
          <button class="trace-word-select" data-trace-word-select="${rec.id}" aria-pressed="${p.selected.includes(rec.id)?'true':'false'}">
            <span class="trace-word-thumb">${pictureHTML(rec,'trace-word-thumb-img')||'<span class="trace-word-text-thumb">Aa</span>'}</span>
            <span class="trace-word-card-copy"><b>${esc(rec.word)}</b><small>${p.selected.includes(rec.id)?'In today’s practice':rec.image?.source==='waps'?'WAPS picture':rec.image?.source==='upload'?'Personal picture':'Text only'}</small></span>
            <span class="trace-word-check">${p.selected.includes(rec.id)?'✓':'○'}</span>
          </button>
          <div class="trace-word-card-actions"><button class="trace-word-only" data-trace-word-only="${rec.id}">Only this</button><button class="trace-word-edit" data-trace-word-edit="${rec.id}" aria-label="Edit ${esc(rec.word)}">Edit</button></div>
        </article>`).join(''):`<div class="friendly-empty trace-word-empty"><span>Aa</span><div><b>No words added yet.</b><p>Add a spelling word, sight word, or name to begin.</p></div></div>`}
      </div>
      <details class="trace-word-more"><summary>Practice options</summary><div class="trace-setting-grid trace-word-settings">
        <label>Help<select id="traceWordsGuidance"><option value="guided" ${p.guidance==='guided'?'selected':''}>Guided</option><option value="standard" ${p.guidance==='standard'?'selected':''}>Standard</option><option value="fade" ${p.guidance==='fade'?'selected':''}>Fade the guide</option></select></label>
        <label>Trace line<select id="traceWordsLineSize"><option value="small" ${p.lineSize==='small'?'selected':''}>Small</option><option value="medium" ${p.lineSize==='medium'?'selected':''}>Medium</option><option value="large" ${p.lineSize==='large'?'selected':''}>Large</option></select></label>
        <label class="trace-word-picture-toggle"><input id="traceWordsPictureDuringTrace" type="checkbox" ${p.showPictureDuringTrace!==false?'checked':''}> Show picture while tracing</label>
        <label class="trace-word-picture-toggle"><input id="traceWordsShowGuide" type="checkbox" ${p.showWordGuide!==false?'checked':''}> Show full word as a guide <small>Turn this off for a harder memory/spelling challenge.</small></label>
      </div></details>
      <div class="actions trace-word-start-actions"><button class="btn" data-action="traceWordsStart" ${p.selected.length?'':'disabled'}>Start today’s practice</button>${list.length?'<button class="btn ghost" data-action="traceWordsSelectAll">Select all</button>':''}</div>
    </div>`,true);
  }
  function currentEditorRecord(){return editorId?findWord(editorId):null}
  function clearPreviewUrl(){
    if(pendingPreviewUrl){URL.revokeObjectURL(pendingPreviewUrl);pendingPreviewUrl=null}
  }
  function editorImage(){
    if(pendingImage){
      if(pendingImage.source==='none')return '';
      if(pendingImage.source==='waps')return `<img src="${pendingImage.src}" alt="Selected WAPS picture">`;
      if(pendingImage.source==='upload'&&pendingImage.data)return `<img src="${pendingImage.data}" alt="Selected personal picture">`;
    }
    const rec=currentEditorRecord();
    return pictureHTML(rec,'');
  }
  function editorImageLabel(){
    if(pendingImage)return pendingImage.source==='none'?'No picture selected':pendingImage.source==='waps'?'WAPS picture selected':'Personal picture selected';
    const rec=currentEditorRecord();
    return rec?.image?.source==='waps'?'WAPS picture selected':rec?.image?.source==='upload'?'Personal picture selected':'No picture selected';
  }
  function openEditor(id=null){
    editorId=id;pendingImage=null;clearPreviewUrl();
    const rec=currentEditorRecord(),word=rec?.word||'';
    show(`<div class="trace-word-editor">
      <button class="btn ghost" data-action="traceWordsCancel">← Words & Names</button>
      <span class="eyebrow">${rec?'EDIT WORD':'ADD WORD'}</span>
      <h1>${rec?'Edit word':'Add word'}</h1>
      <div class="field"><label>Word<input id="traceWordText" maxlength="24" autocomplete="off" autocapitalize="words" value="${esc(word)}" placeholder="e.g. Genesis, dog, school"></label></div>
      <div class="trace-word-picture-editor">
        <div id="traceWordPicturePreview" class="trace-word-picture-preview">${editorImage()||'<span>Aa</span>'}</div>
        <div><b id="traceWordPictureLabel">${editorImageLabel()}</b><small>Picture (optional)</small></div>
      </div>
      <div id="traceWordWapsSuggestion"></div>
      <div class="trace-word-picture-actions">
        <button class="btn secondary" data-action="traceWordsChoosePhoto">Choose photo</button>
        <button class="btn secondary" data-action="traceWordsTakePhoto">Take photo</button>
        <button class="btn ghost" data-action="traceWordsRemovePicture">No picture</button>
      </div>
      <input id="traceWordFile" class="trace-hidden-file" type="file" accept="image/jpeg,image/png,image/webp">
      <input id="traceWordCamera" class="trace-hidden-file" type="file" accept="image/*" capture="environment">
      <div class="trace-photo-note">Pictures stay in WAPS on this device.</div>
      <div class="actions"><button class="btn" data-action="traceWordsSave">Save</button>${rec?'<button class="btn danger-soft" data-action="traceWordsDelete">Delete word</button>':''}</div>
    </div>`,true);
    bindEditor();
  }
  function bindEditor(){
    const input=$('#traceWordText');
    input?.addEventListener('input',updateWapsSuggestion);
    $('#traceWordFile')?.addEventListener('change',e=>handleFile(e.target.files?.[0]));
    $('#traceWordCamera')?.addEventListener('change',e=>handleFile(e.target.files?.[0]));
    updateWapsSuggestion();
  }
  function updateWapsSuggestion(){
    const box=$('#traceWordWapsSuggestion'),word=cleanWord($('#traceWordText')?.value||'');
    if(!box)return;
    const pic=conceptImageForWord?.(word);
    if(!pic){box.innerHTML='';return}
    box.innerHTML=`<button class="trace-waps-picture-option" data-action="traceWordsUseWaps"><img src="${pic.src}" alt="${esc(pic.label||word)}"><span><b>Use WAPS picture</b><small>${esc(pic.label||word)}</small></span></button>`;
  }
  function updateEditorPicture(){
    const preview=$('#traceWordPicturePreview'),label=$('#traceWordPictureLabel');
    if(preview)preview.innerHTML=editorImage()||'<span>Aa</span>';
    if(label)label.textContent=editorImageLabel();
  }
  function fileToDataUrl(file){
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onload=()=>resolve(reader.result);
      reader.onerror=()=>reject(reader.error||new Error('file-read'));
      reader.readAsDataURL(file);
    });
  }
  async function processImage(file){
    if(!file)return null;
    if(!/^image\/(jpeg|png|webp)$/i.test(file.type||'')){throw new Error('type')}
    if(file.size>20*1024*1024)throw new Error('size');
    const raw=await fileToDataUrl(file);
    const img=await new Promise((resolve,reject)=>{
      const im=new Image();
      im.onload=()=>resolve(im);
      im.onerror=()=>reject(new Error('decode'));
      im.src=raw;
    });
    const max=960,scale=Math.min(1,max/Math.max(img.naturalWidth||img.width,img.naturalHeight||img.height));
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round((img.naturalWidth||img.width)*scale));
    canvas.height=Math.max(1,Math.round((img.naturalHeight||img.height)*scale));
    const g=canvas.getContext('2d',{alpha:false});
    g.drawImage(img,0,0,canvas.width,canvas.height);
    let out='';
    try{out=canvas.toDataURL('image/webp',.82)}catch{}
    if(!out||!out.startsWith('data:image/webp'))out=canvas.toDataURL('image/jpeg',.84);
    return out;
  }
  async function handleFile(file){
    if(!file)return;
    try{
      const data=await processImage(file);
      pendingImage={source:'upload',data};
      updateEditorPicture();
      toast('Picture added ✓');
    }catch(err){
      toast(err?.message==='size'?'That picture is too large. Try a smaller image.':'That picture could not be added. Try a JPEG, PNG or WebP image.');
    }
  }
  async function saveEditor(){
    const word=cleanWord($('#traceWordText')?.value||'');
    if(!word){toast('Type a word first.');return}
    if(!traceableWord(word)){toast('Use one word with letters A–Z only for tracing.');return}
    const list=library(),existing=currentEditorRecord(),now=new Date().toISOString();
    let image=existing?.image||null;
    if(pendingImage){
      if(pendingImage.source==='none')image=null;
      else if(pendingImage.source==='waps')image={source:'waps',id:pendingImage.id};
      else if(pendingImage.source==='upload')image={source:'upload',data:pendingImage.data};
    }
    if(existing){
      existing.word=word;existing.image=image;existing.updatedAt=now;
    }else{
      const id=crypto.randomUUID();
      list.push({id,word,image,createdAt:now,updatedAt:now});
      saveSelected([...selectedIds(),id]);
    }
    await persist();
    editorId=null;pendingImage=null;clearPreviewUrl();
    render();
    toast('Word saved ✓');
  }
  async function deleteEditor(){
    const rec=currentEditorRecord();if(!rec)return;
    if(!confirm(`Delete “${rec.word}” from this child's word library?`))return;
    const t=state(),k=profileKey();
    t.wordLibrary[k]=library().filter(x=>x.id!==rec.id);
    saveSelected(selectedIds().filter(id=>id!==rec.id));
    await persist();editorId=null;pendingImage=null;render();
  }
  async function addChildName(){
    const name=cleanWord(active()?.name||'');
    if(!traceableWord(name)){toast('This profile name includes characters WAPS cannot trace yet. Add a traceable version manually.');return}
    const list=library(),existing=list.find(x=>x.word.toLowerCase()===name.toLowerCase());
    if(existing){saveSelected([...selectedIds(),existing.id]);await persist();render();return}
    const id=crypto.randomUUID(),pic=conceptImageForWord?.(name);
    list.push({id,word:name,image:pic?{source:'waps',id:pic.id}:null,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
    saveSelected([...selectedIds(),id]);await persist();render();
  }
  async function start(){
    const p=prefs();
    p.guidance=$('#traceWordsGuidance')?.value||'guided';
    p.lineSize=$('#traceWordsLineSize')?.value||'medium';
    p.showPictureDuringTrace=$('#traceWordsPictureDuringTrace')?.checked!==false;
    p.showWordGuide=$('#traceWordsShowGuide')?.checked!==false;
    p.selected=selectedIds();
    if(!p.selected.length){toast('Choose at least one word first.');return}
    await persist();
    await startWordSet(p.selected,{guidance:p.guidance,lineSize:p.lineSize,showPictureDuringTrace:p.showPictureDuringTrace,showWordGuide:p.showWordGuide,orderMode:p.orderMode});
  }
  async function handleClick(el){
    const select=el.closest('[data-trace-word-select]');
    if(select){
      const id=select.dataset.traceWordSelect,p=prefs(),ids=new Set(selectedIds());
      ids.has(id)?ids.delete(id):ids.add(id);saveSelected([...ids]);await persist();
      select.closest('.trace-word-card')?.classList.toggle('selected',ids.has(id));
      select.setAttribute('aria-pressed',ids.has(id)?'true':'false');
      const mark=select.querySelector('.trace-word-check');if(mark)mark.textContent=ids.has(id)?'✓':'○';
      selectionSummary();
      const startBtn=$('[data-action="traceWordsStart"]');if(startBtn)startBtn.disabled=!ids.size;
      return true;
    }
    const only=el.closest('[data-trace-word-only]');
    if(only){saveSelected([only.dataset.traceWordOnly]);await persist();render();return true}
    const move=el.closest('[data-trace-word-move]');
    if(move){
      const ids=selectedIds(),id=move.dataset.traceWordMove,from=ids.indexOf(id),dir=Number(move.dataset.dir||0),to=from+dir;
      if(from>=0&&to>=0&&to<ids.length){[ids[from],ids[to]]=[ids[to],ids[from]];saveSelected(ids);await persist();render()}
      return true;
    }
    const mode=el.closest('[data-trace-word-order-mode]');
    if(mode){const p=prefs();p.orderMode=mode.dataset.traceWordOrderMode==='shuffle'?'shuffle':'chosen';await persist();render();return true}
    const edit=el.closest('[data-trace-word-edit]');
    if(edit){openEditor(edit.dataset.traceWordEdit);return true}
    const a=el.closest('[data-action]')?.dataset.action;
    if(!a||!a.startsWith('traceWords'))return false;
    if(a==='traceWordsLaunch'){render();return true}
    if(a==='traceWordsAdd'){openEditor();return true}
    if(a==='traceWordsAddName'){await addChildName();return true}
    if(a==='traceWordsCancel'){editorId=null;pendingImage=null;clearPreviewUrl();render();return true}
    if(a==='traceWordsChoosePhoto'){$('#traceWordFile')?.click();return true}
    if(a==='traceWordsTakePhoto'){$('#traceWordCamera')?.click();return true}
    if(a==='traceWordsRemovePicture'){pendingImage={source:'none'};updateEditorPicture();return true}
    if(a==='traceWordsUseWaps'){
      const word=cleanWord($('#traceWordText')?.value||''),pic=conceptImageForWord?.(word);
      if(pic){pendingImage={source:'waps',id:pic.id,src:pic.src};updateEditorPicture()}
      return true;
    }
    if(a==='traceWordsSave'){await saveEditor();return true}
    if(a==='traceWordsDelete'){await deleteEditor();return true}
    if(a==='traceWordsClearSelection'){saveSelected([]);await persist();render();return true}
    if(a==='traceWordsSelectAll'){saveSelected(library().map(x=>x.id));await persist();render();return true}
    if(a==='traceWordsStart'){await start();return true}
    return false;
  }
  function cleanup(){clearPreviewUrl()}
  return {launch:render,handleClick,cleanup};
}
