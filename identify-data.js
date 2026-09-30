// WAPS Colours & Shapes identification data.
export const IDENTIFY_COLOURS=[
 {id:'red',label:'Red',value:'#E53935'},
 {id:'blue',label:'Blue',value:'#1E88E5'},
 {id:'yellow',label:'Yellow',value:'#FDD835'},
 {id:'green',label:'Green',value:'#43A047'},
 {id:'orange',label:'Orange',value:'#FB8C00'},
 {id:'purple',label:'Purple',value:'#8E24AA'},
 {id:'pink',label:'Pink',value:'#EC407A'},
 {id:'brown',label:'Brown',value:'#795548'},
 {id:'black',label:'Black',value:'#111111'},
 {id:'white',label:'White',value:'#FFFFFF',outline:'#6B7280'},
 {id:'grey',label:'Grey',value:'#80868B'}
];

export const IDENTIFY_SHAPES=[
 {id:'circle',label:'Circle',level:'starter',svg:'<circle cx="50" cy="50" r="31"/>'},
 {id:'square',label:'Square',level:'starter',svg:'<rect x="19" y="19" width="62" height="62" rx="2"/>'},
 {id:'triangle',label:'Triangle',level:'early',svg:'<polygon points="50,15 86,82 14,82"/>'},
 {id:'rectangle',label:'Rectangle',level:'core',svg:'<rect x="11" y="28" width="78" height="44" rx="2"/>'},
 {id:'oval',label:'Oval',level:'core',svg:'<ellipse cx="50" cy="50" rx="38" ry="25"/>'},
 {id:'star',label:'Star',level:'expanded',svg:'<polygon points="50,9 61,37 91,39 68,58 76,88 50,71 24,88 32,58 9,39 39,37"/>'},
 {id:'heart',label:'Heart',level:'expanded',svg:'<path d="M50 84 C42 76 16 58 16 36 C16 22 27 14 39 14 C46 14 51 18 55 24 C59 18 64 14 72 14 C84 14 94 23 94 36 C94 58 67 76 50 84 Z" transform="translate(-3 0)"/>'},
 {id:'diamond',label:'Diamond',level:'expanded',svg:'<polygon points="50,12 88,50 50,88 12,50"/>'},
 {id:'pentagon',label:'Pentagon',level:'advanced',svg:'<polygon points="50,10 88,38 73,84 27,84 12,38"/>'},
 {id:'hexagon',label:'Hexagon',level:'advanced',svg:'<polygon points="28,12 72,12 92,50 72,88 28,88 8,50"/>'},
 {id:'octagon',label:'Octagon',level:'advanced',svg:'<polygon points="32,9 68,9 91,32 91,68 68,91 32,91 9,68 9,32"/>'},
 {id:'crescent',label:'Crescent',level:'advanced',svg:'<path fill-rule="evenodd" d="M62 10 A40 40 0 1 0 62 90 A33 33 0 0 1 62 10 Z"/>'},
 {id:'semicircle',label:'Semi-circle',level:'advanced',svg:'<path d="M12 72 A38 38 0 0 1 88 72 L12 72 Z"/>'}
];

export const COLOUR_PRESETS={
 starter:['red','blue','yellow'],
 early:['red','blue','yellow','green'],
 core:['red','blue','yellow','green','orange','purple'],
 full:IDENTIFY_COLOURS.map(x=>x.id)
};

export const SHAPE_PRESETS={
 starter:['circle','square'],
 early:['circle','square','triangle'],
 core:['circle','square','triangle','rectangle','oval'],
 expanded:['circle','square','triangle','rectangle','oval','star','heart','diamond'],
 advanced:IDENTIFY_SHAPES.map(x=>x.id)
};

export const COLOUR_BASE_SHAPES=['circle','square','triangle','rectangle'];
export const SHAPE_COMMON_COLOURS=['blue','yellow','green','orange','purple','red'];

export function validateIdentifyData(){
 const errors=[];
 const colourIds=new Set(),shapeIds=new Set();
 for(const c of IDENTIFY_COLOURS){
   if(!c.id||!c.label||!/^#[0-9A-F]{6}$/i.test(c.value||''))errors.push('Invalid colour: '+JSON.stringify(c));
   if(colourIds.has(c.id))errors.push('Duplicate colour '+c.id);colourIds.add(c.id);
 }
 for(const s of IDENTIFY_SHAPES){
   if(!s.id||!s.label||!s.svg)errors.push('Invalid shape: '+JSON.stringify(s));
   if(shapeIds.has(s.id))errors.push('Duplicate shape '+s.id);shapeIds.add(s.id);
 }
 for(const [name,list] of Object.entries(COLOUR_PRESETS))for(const id of list)if(!colourIds.has(id))errors.push('Colour preset '+name+' missing '+id);
 for(const [name,list] of Object.entries(SHAPE_PRESETS))for(const id of list)if(!shapeIds.has(id))errors.push('Shape preset '+name+' missing '+id);
 return errors;
}
