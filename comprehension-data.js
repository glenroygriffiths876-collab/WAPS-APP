export const MU_SPECIAL_VISUALS={
  supermarket:{label:'Supermarket',board:'001',col:0,row:0},
  playground:{label:'Playground',board:'001',col:1,row:0},
  clock:{label:'Clock',board:'001',col:3,row:0},
  calendar:{label:'Calendar',board:'001',col:4,row:0},
  fork:{label:'Fork',board:'001',col:0,row:1},
  glass:{label:'Drinking glass',board:'001',col:2,row:1},
  bottle:{label:'Water bottle',board:'001',col:3,row:1},
  pen:{label:'Pen',board:'001',col:4,row:1},
  marker:{label:'Marker',board:'001',col:0,row:2},
  dress:{label:'Dress',board:'001',col:1,row:2},
  hat:{label:'Hat',board:'001',col:2,row:2},
  'red-apple':{label:'Red apple',board:'041',col:0,row:0},
  'red-car':{label:'Red car',board:'041',col:2,row:0},
  'blue-car':{label:'Blue car',board:'041',col:3,row:0},
  'brown-dog':{label:'Brown dog',board:'041',col:4,row:0},
  'brown-horse':{label:'Brown horse',board:'041',col:0,row:1},
  'green-dotted-ball':{label:'Green ball with dots',board:'041',col:2,row:1},
  'hot-soup':{label:'Hot soup',board:'041',col:3,row:1},
  'ice-cream':{label:'Ice cream',board:'041',col:4,row:1},
  kite:{label:'Kite',src:'./assets/comprehension/kite.webp'}
};
const BOARD_SRC={
  '001':'./assets/comprehension/board-001-020.webp',
  '041':'./assets/comprehension/board-041-060.webp'
};
const h=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
export function muSpecialVisualHTML(id,cls=''){
  if(id==='snack')return '<span class="mu-snack-visual '+h(cls)+'" role="img" aria-label="Snack"><img src="./assets/concepts/highres/apple.webp" alt=""><img src="./assets/concepts/highres/cookie.webp" alt=""><img src="./assets/concepts/highres/banana.webp" alt=""></span>';
  const v=MU_SPECIAL_VISUALS[id];if(!v)return '';
  if(v.src)return '<span class="mu-direct-visual '+h(cls)+'" role="img" aria-label="'+h(v.label)+'"><img src="'+v.src+'" alt="'+h(v.label)+'" loading="lazy" decoding="async"></span>';
  const x=v.col*25,y=v.row*(100/3);
  return '<span class="mu-sprite '+h(cls)+'" role="img" aria-label="'+h(v.label)+'" style="--mu-board:url(\''+BOARD_SRC[v.board]+'\');--mu-x:'+x+'%;--mu-y:'+y+'%"><i aria-hidden="true"></i></span>';
}
export const MU_FIND_POOL=['apple','kite','doll','pencil','car','book','cup','ball','spoon','shirt','doctor','school','banana','shoe','bird','bus'];
export const MU_MATCH_TASKS=[
  {id:'apple-circle',stimulus:'apple',answer:'circle',prompt:'Which shape is most like the apple?'},
  {id:'kite-diamond',stimulus:'kite',answer:'diamond',prompt:'Which shape is most like the kite?'}
];
export const MU_SORT_FAMILIES=[
  {id:'fruit-cars',title:'Fruits and cars',left:'Fruit',right:'Car',items:[
    ['apple','left'],['banana','left'],['mango','left'],['orange','left'],['car','right'],['red-car','right'],['blue-car','right']
  ]},
  {id:'clothes-animals',title:'Clothes and animals',left:'Clothes we wear',right:'Animals',items:[
    ['shirt','left'],['pants','left'],['shoe','left'],['dress','left'],['dog','right'],['cat','right'],['bird','right']
  ]},
  {id:'writing-food',title:'Writing tools and food',left:'Things we write with',right:'Things we eat',items:[
    ['pencil','left'],['crayon','left'],['pen','left'],['marker','left'],['apple','right'],['banana','right'],['patty','right'],['mango','right']
  ]},
  {id:'bath-transport',title:'Bathroom and transportation',left:'Bathroom',right:'Transportation',items:[
    ['toothbrush','left'],['soap','left'],['towel','left'],['toilet','left'],['car','right'],['bus','right'],['taxi','right'],['bike','right']
  ]},
  {id:'dots-brown',title:'Green dots and brown animals',left:'Green things with dots',right:'Brown animals',items:[
    ['green-dotted-ball','left'],['brown-dog','right'],['brown-horse','right']
  ]},
  {id:'hot-red',title:'Hot food and red things',left:'Hot food',right:'Red things',items:[
    ['hot-soup','left'],['red-apple','right'],['red-car','right']
  ]}
];
export const MU_GROUP_TASKS=[
  {id:'kitchen',prompt:'Find the things we use in the kitchen.',correct:['spoon','plate','cup'],distractors:['car','shoe','book','ball']},
  {id:'school',prompt:'Find the things we see at school.',correct:['book','pencil','bag','desk'],distractors:['apple','car','plate','bed']},
  {id:'doors',prompt:'Find the things that have doors.',correct:['house','car','clinic'],distractors:['apple','ball','spoon','bird']},
  {id:'numbers',prompt:'Find the things that have numbers.',correct:['clock','calendar'],distractors:['apple','ball','shoe','bird']},
  {id:'eat-with',prompt:'Find the things we use when we eat.',correct:['spoon','plate','fork','cup'],distractors:['car','shoe','pencil','ball']},
  {id:'drink-from',prompt:'Find the things we drink from.',correct:['cup','glass','bottle'],distractors:['shoe','book','car','pencil']}
];
export const MU_MODE_LABELS={find:'Find It',match:'Match It',sort:'Sort It',group:'Find the Group',rules:'Two Rules'};
