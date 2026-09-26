import * as d from '../js/data.js';
import fs from 'fs';
const root=new URL('../',import.meta.url); const path=p=>new URL(p,root);
const assert=(x,m)=>{if(!x)throw new Error(m)};
assert(d.CONCEPTS.length>=140,'concept depth'); assert(d.ACTIVITY_SETS.length>=40,'activity depth'); assert(d.ROUTINES.length>=15,'routine depth'); assert(d.HANDBOOK.length>=12,'handbook depth');
const ids=new Set(d.CONCEPTS.map(x=>x.id)); assert(ids.size===d.CONCEPTS.length,'duplicate concept ids');
for(const c of d.CONCEPTS) assert(fs.existsSync(path(c.image.replace('./',''))),`missing visual ${c.id}`);
for(const a of d.ACTIVITY_SETS){assert(a.sets?.length,'empty activity '+a.id);for(const [t,cs] of a.sets){assert(ids.has(t),'missing target '+t);for(const c of cs)assert(ids.has(c),'missing choice '+c)}}
for(const a of d.AAC)if(a.img)assert(ids.has(a.img),'missing AAC visual '+a.img);
const critical=['NO','STOP','HELP','BREAK','HURTS','TOILET']; for(const w of critical)assert(d.AAC.some(a=>a.label===w),'missing critical AAC '+w);
console.log(JSON.stringify({concepts:d.CONCEPTS.length,aac:d.AAC.length,activities:d.ACTIVITY_SETS.length,coach:d.COACH_ROUTINES.length,lessons:d.LESSONS.length,help:d.HELP.length,routines:d.ROUTINES.length,noMaterials:d.NO_MATERIALS.length,handbook:d.HANDBOOK.length},null,2));
