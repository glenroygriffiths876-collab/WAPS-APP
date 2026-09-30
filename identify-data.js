export const COLOURS=[
 {id:'red',label:'Red',value:'#E53935'},
 {id:'blue',label:'Blue',value:'#1E88E5'},
 {id:'yellow',label:'Yellow',value:'#FDD835'},
 {id:'green',label:'Green',value:'#43A047'},
 {id:'orange',label:'Orange',value:'#FB8C00'},
 {id:'purple',label:'Purple',value:'#8E24AA'},
 {id:'pink',label:'Pink',value:'#EC407A'},
 {id:'brown',label:'Brown',value:'#795548'},
 {id:'black',label:'Black',value:'#111111'},
 {id:'white',label:'White',value:'#FFFFFF',outline:'#7B8790'},
 {id:'grey',label:'Grey',value:'#80868B'}
];

export const SHAPES=[
 {id:'circle',label:'Circle',level:'starter',svg:'<circle cx="100" cy="100" r="68"/>'},
 {id:'square',label:'Square',level:'starter',svg:'<rect x="35" y="35" width="130" height="130" rx="4"/>'},
 {id:'triangle',label:'Triangle',level:'early',svg:'<polygon points="100,28 174,166 26,166"/>'},
 {id:'rectangle',label:'Rectangle',level:'core',svg:'<rect x="24" y="52" width="152" height="96" rx="4"/>'},
 {id:'oval',label:'Oval',level:'core',svg:'<ellipse cx="100" cy="100" rx="76" ry="52"/>'},
 {id:'star',label:'Star',level:'expanded',svg:'<polygon points="100,18 123,70 180,74 136,111 150,168 100,138 50,168 64,111 20,74 77,70"/>'},
 {id:'heart',label:'Heart',level:'expanded',svg:'<path d="M100 170 C82 150 30 120 30 72 C30 40 55 24 78 30 C91 33 99 43 100 49 C101 43 109 33 122 30 C145 24 170 40 170 72 C170 120 118 150 100 170 Z"/>'},
 {id:'diamond',label:'Diamond',level:'expanded',svg:'<polygon points="100,24 176,100 100,176 24,100"/>'},
 {id:'pentagon',label:'Pentagon',level:'advanced',svg:'<polygon points="100,24 172,76 145,160 55,160 28,76"/>'},
 {id:'hexagon',label:'Hexagon',level:'advanced',svg:'<polygon points="55,30 145,30 180,100 145,170 55,170 20,100"/>'},
 {id:'octagon',label:'Octagon',level:'advanced',svg:'<polygon points="64,24 136,24 176,64 176,136 136,176 64,176 24,136 24,64"/>'},
 {id:'crescent',label:'Crescent',level:'advanced',svg:'<path d="M132 28 A76 76 0 1 0 132 172 A60 60 0 0 1 132 28 Z"/>'},
 {id:'semi-circle',label:'Semi-circle',level:'advanced',svg:'<path d="M26 120 A74 74 0 0 1 174 120 L26 120 Z"/>'}
];

export const COLOUR_PRESETS={
 starter:['red','blue','yellow'],
 early:['red','blue','yellow','green'],
 core:['red','blue','yellow','green','orange','purple'],
 full:COLOURS.map(x=>x.id)
};
export const SHAPE_PRESETS={
 starter:['circle','square'],
 early:['circle','square','triangle'],
 core:['circle','square','triangle','rectangle','oval'],
 expanded:['circle','square','triangle','rectangle','oval','star','heart','diamond'],
 advanced:SHAPES.map(x=>x.id)
};
export const COLOUR_BASE_SHAPES=['circle','square','triangle','rectangle'];
export const SHAPE_BASE_COLOURS=['blue','yellow','green','purple','orange','red'];
export function validateConceptData(){
 const errors=[];
 const colourIds=new Set(),shapeIds=new Set();
 for(const c of COLOURS){
   if(colourIds.has(c.id))errors.push('duplicate colour '+c.id);colourIds.add(c.id);
   if(!/^#[0-9A-F]{6}$/i.test(c.value))errors.push('bad colour '+c.id);
 }
 for(const s of SHAPES){
   if(shapeIds.has(s.id))errors.push('duplicate shape '+s.id);shapeIds.add(s.id);
   if(!s.svg||!/[<](circle|rect|polygon|ellipse|path)/.test(s.svg))errors.push('bad shape '+s.id);
 }
 for(const [name,set] of Object.entries(COLOUR_PRESETS))for(const id of set)if(!colourIds.has(id))errors.push('missing colour '+name+':'+id);
 for(const [name,set] of Object.entries(SHAPE_PRESETS))for(const id of set)if(!shapeIds.has(id))errors.push('missing shape '+name+':'+id);
 return errors;
}
