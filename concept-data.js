// WAPS Colours & Shapes concept library.
// Core identification rule:
//   COLOURS -> same shape, different colours.
//   SHAPES  -> same colour, different shapes.

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
 {id:'circle',label:'Circle',level:'starter',svg:'<circle cx="50" cy="50" r="34"/>'},
 {id:'square',label:'Square',level:'starter',svg:'<rect x="18" y="18" width="64" height="64" rx="2"/>'},
 {id:'triangle',label:'Triangle',level:'early',svg:'<polygon points="50,14 87,82 13,82"/>'},
 {id:'rectangle',label:'Rectangle',level:'core',svg:'<rect x="12" y="28" width="76" height="44" rx="2"/>'},
 {id:'oval',label:'Oval',level:'core',svg:'<ellipse cx="50" cy="50" rx="39" ry="27"/>'},
 {id:'star',label:'Star',level:'expanded',svg:'<polygon points="50,10 61,37 90,39 68,58 75,87 50,71 25,87 32,58 10,39 39,37"/>'},
 {id:'heart',label:'Heart',level:'expanded',svg:'<path d="M50 86 C42 77 16 61 16 39 C16 24 27 15 40 15 C47 15 53 19 58 26 C63 19 69 15 77 15 C90 15 98 25 98 39 C98 61 69 78 50 86 Z" transform="translate(-7 0) scale(1.07 1)"/>'},
 {id:'diamond',label:'Diamond',level:'expanded',svg:'<polygon points="50,10 90,50 50,90 10,50"/>'},
 {id:'pentagon',label:'Pentagon',level:'advanced',svg:'<polygon points="50,9 90,39 75,87 25,87 10,39"/>'},
 {id:'hexagon',label:'Hexagon',level:'advanced',svg:'<polygon points="28,12 72,12 94,50 72,88 28,88 6,50"/>'},
 {id:'octagon',label:'Octagon',level:'advanced',svg:'<polygon points="30,8 70,8 92,30 92,70 70,92 30,92 8,70 8,30"/>'},
 {id:'crescent',label:'Crescent',level:'advanced',svg:'<path d="M68 10 C37 16 22 39 27 62 C33 87 61 96 84 79 C63 80 48 66 48 47 C48 30 56 18 68 10 Z"/>'},
 {id:'semicircle',label:'Semi-circle',level:'advanced',svg:'<path d="M10 72 A40 40 0 0 1 90 72 L10 72 Z"/>'}
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
export const SHAPE_BASE_COLOURS=['blue','yellow','green','orange','purple','red'];

export function validateConceptLearningData(){
 const errors=[];
 const colourIds=new Set(),shapeIds=new Set();
 for(const c of COLOURS){
   if(colourIds.has(c.id))errors.push('Duplicate colour '+c.id);
   colourIds.add(c.id);
   if(!/^#[0-9A-F]{6}$/i.test(c.value))errors.push('Invalid colour value '+c.id);
 }
 for(const s of SHAPES){
   if(shapeIds.has(s.id))errors.push('Duplicate shape '+s.id);
   shapeIds.add(s.id);
   if(!s.svg||!/[<](circle|rect|ellipse|polygon|path)\b/.test(s.svg))errors.push('Invalid shape SVG '+s.id);
 }
 for(const [name,list] of Object.entries(COLOUR_PRESETS))for(const id of list)if(!colourIds.has(id))errors.push('Colour preset '+name+' missing '+id);
 for(const [name,list] of Object.entries(SHAPE_PRESETS))for(const id of list)if(!shapeIds.has(id))errors.push('Shape preset '+name+' missing '+id);
 if(new Set(COLOUR_BASE_SHAPES).size!==COLOUR_BASE_SHAPES.length)errors.push('Duplicate colour base shape');
 if(new Set(SHAPE_BASE_COLOURS).size!==SHAPE_BASE_COLOURS.length)errors.push('Duplicate shape base colour');
 return errors;
}
