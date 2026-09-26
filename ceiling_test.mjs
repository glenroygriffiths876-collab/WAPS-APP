import fs from 'fs';
const source=fs.readFileSync(new URL('./data.js',import.meta.url),'utf8');
const d=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const assert=(x,m)=>{if(!x)throw new Error(m)};
assert(d.CONCEPTS.length>=150,'concept depth');
assert(d.AAC.length>=50,'AAC depth');
assert(d.ACTIVITY_SETS.length>=40,'activity depth');
assert(d.COACH_ROUTINES.length>=8,'coach depth');
assert(d.LESSONS.length>=20,'academy depth');
assert(d.HELP.length>=10,'Help Me Now depth');
assert(d.ROUTINES.length>=15,'routine depth');
assert(d.HANDBOOK.length>=12,'handbook depth');
const ids=new Set(d.CONCEPTS.map(x=>x.id));
assert(ids.size===d.CONCEPTS.length,'duplicate concept ids');
const root=new URL('./',import.meta.url);
for(const c of d.CONCEPTS){
  const p=new URL(c.image.replace('./',''),root);
  assert(fs.existsSync(p),'missing fallback visual '+c.id+' -> '+c.image);
}
let referenced=new Set();
for(const a of d.ACTIVITY_SETS){
  assert(a.sets?.length,'empty activity '+a.id);
  for(const [t,cs] of a.sets){
    referenced.add(t); assert(ids.has(t),'missing target '+t+' in '+a.id);
    assert(Array.isArray(cs)&&cs.length>=2,'too few choices in '+a.id);
    for(const c of cs){referenced.add(c);assert(ids.has(c),'missing choice '+c+' in '+a.id)}
  }
}
for(const a of d.AAC)if(a.img){referenced.add(a.img);assert(ids.has(a.img),'missing AAC visual '+a.img)}
for(const w of ['NO','STOP','HELP','BREAK','HURTS','TOILET']) assert(d.AAC.some(a=>a.label===w),'missing critical AAC '+w);
const app=fs.readFileSync(new URL('./app.js',import.meta.url),'utf8');
assert(!/function wire(?:TalkControls|PracticeLaunch|CoachLaunch|ActivityControls|CoachStepControls)/.test(app),'obsolete duplicate wiring remains');
assert(!/\$\('\.bottomnav button,\.desktopnav button'\)\.forEach/.test(app),'querySelector forEach crash regression');
const sw=fs.readFileSync(new URL('./sw.js',import.meta.url),'utf8');
assert(/networkFirst/.test(sw),'network-first shell missing');
assert(/const OPTIONAL=\[/.test(sw),'offline teaching cache list missing');
console.log(JSON.stringify({
 concepts:d.CONCEPTS.length,aac:d.AAC.length,activities:d.ACTIVITY_SETS.length,
 coach:d.COACH_ROUTINES.length,lessons:d.LESSONS.length,help:d.HELP.length,
 routines:d.ROUTINES.length,noMaterials:d.NO_MATERIALS.length,handbook:d.HANDBOOK.length,
 referencedConcepts:referenced.size
},null,2));
