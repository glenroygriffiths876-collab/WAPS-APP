export const MU_SPECIAL_VISUALS={
  supermarket:{label:'Supermarket',src:'./assets/concepts/highres/supermarket.webp'},
  playground:{label:'Playground',src:'./assets/concepts/highres/playground.webp'},
  clock:{label:'Clock',src:'./assets/concepts/highres/clock.webp'},
  calendar:{label:'Calendar',src:'./assets/concepts/highres/calendar.webp'},
  fork:{label:'Fork',src:'./assets/concepts/highres/fork.webp'},
  glass:{label:'Drinking glass',src:'./assets/concepts/highres/glass.webp'},
  bottle:{label:'Water bottle',src:'./assets/concepts/highres/bottle.webp'},
  pen:{label:'Pen',src:'./assets/concepts/highres/pen.webp'},
  marker:{label:'Marker',src:'./assets/concepts/highres/marker.webp'},
  dress:{label:'Dress',src:'./assets/concepts/highres/dress.webp'},
  hat:{label:'Hat',src:'./assets/concepts/highres/hat.webp'},
  'red-apple':{label:'Red apple',src:'./assets/concepts/highres/red-apple.webp'},
  'red-car':{label:'Red car',src:'./assets/concepts/highres/red-car.webp'},
  'blue-car':{label:'Blue car',src:'./assets/concepts/highres/blue-car.webp'},
  'brown-dog':{label:'Brown dog',src:'./assets/concepts/highres/brown-dog.webp'},
  'brown-horse':{label:'Brown horse',src:'./assets/concepts/highres/brown-horse.webp'},
  'green-dotted-ball':{label:'Green ball with dots',src:'./assets/concepts/highres/green-dotted-ball.webp'},
  'hot-soup':{label:'Hot soup',src:'./assets/concepts/highres/hot-soup.webp'},
  'ice-cream':{label:'Ice cream',src:'./assets/concepts/highres/ice-cream.webp'},
  snack:{label:'Snack',src:'./assets/concepts/highres/snack.webp'},
  kite:{label:'Kite',src:'./assets/concepts/highres/kite.webp'}
};
const h=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
export function muSpecialVisualHTML(id,cls=''){
  const v=MU_SPECIAL_VISUALS[id];if(!v)return '';
  return '<span class="mu-direct-visual '+h(cls)+'" role="img" aria-label="'+h(v.label)+'"><img src="'+v.src+'" alt="'+h(v.label)+'" loading="lazy" decoding="async"></span>';
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
