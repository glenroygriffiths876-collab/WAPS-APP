// Stable release contract. Protects approved artwork, entry points and cache coherency.
// Changing the approved Home artwork requires an explicit review/update to this contract.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const root=process.cwd();
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const assert=(ok,message)=>{if(!ok)throw new Error('WAPS release blocked: '+message);};
const lockedArt={
  'assets/ui/v59/home-landscape.b64':'bc14ba8da70da8cb88cd324ccc621ead247f543f',
  'assets/ui/v59/home-portrait-1.b64':'fb486fe29df946ff809c33161574574d7fabeed3',
  'assets/ui/v59/home-portrait-2.b64':'7be6868245c75f56a3f9d49b8bedd4a12c1877fc'
};
for(const [file,expected] of Object.entries(lockedArt)){
 const raw=fs.readFileSync(path.join(root,file));
 const gitBlob=createHash('sha1').update('blob '+raw.length+'\0').update(raw).digest('hex');
 assert(gitBlob===expected,'locked approved Home image changed: '+file);
}

const html=read('index.html'),js=read('app.js'),css=read('app.css'),sw=read('sw.js'),manifest=JSON.parse(read('manifest.webmanifest'));
const cssVersion=Number(html.match(/app\.css\?v=(\d+)/)?.[1]);
const jsVersion=Number(html.match(/app\.js\?v=(\d+)/)?.[1]);
const shellVersion=Number(sw.match(/waps-reference-shell-v(\d+)/)?.[1]);
assert(cssVersion>0&&jsVersion>0&&shellVersion>0,'public JS/CSS/service-worker version missing');
assert(cssVersion===jsVersion&&cssVersion===shellVersion,'CSS, JS and offline cache versions are out of sync');
assert(manifest.orientation==='any','installed app is not allowed to rotate freely');
assert(!html.includes('home-art.css'),'missing obsolete Home CSS file referenced');
assert(js.includes('syncWapsHomeLayout()'),'Home orientation syncing removed');
assert(js.includes('v59-landscape-view')&&js.includes('v59-portrait-view'),'approved orientation view removed');
assert(css.includes('WAPS v78 — locked Home art'),'approved responsive Home stylesheet missing');
for(const route of ['talk','practice','coach','progress','more']){
 assert(js.includes("data-route=\""+route+"\"")||js.includes("'"+route+"'"),'missing route '+route);
}
for(const action of ['startUnifiedPractice','traceLaunch','traceWordsLaunch','csLaunch','mathLaunch','muLaunch','showPracticeAnswer']){
 assert(js.includes(action),'approved learning action removed: '+action);
}
for(const resource of ['data.js','math-learning.js','comprehension-learning.js','concept-learning.js','trace-words.js','storage.js']){
 assert(fs.existsSync(path.join(root,resource)),'missing core module '+resource);
}
// Any file directly linked from the HTML shell must exist locally.
for(const m of html.matchAll(/(?:src|href)="(\.\/[^"]+)"/g)){
 const url=m[1],local=url.split(/[?#]/)[0].replace(/^\.\//,'');
 assert(fs.existsSync(path.join(root,local)),'missing HTML asset: '+url);
}

// UI source changes must bump the installed app version; otherwise users may keep stale code.
// Uses the PR base for pull-request checks; uses the prior commit for push checks.
const base=process.env.WAPS_DIFF_BASE;
if(base){
 try{
  const changed=execFileSync('git',['diff','--name-only',base+'...HEAD'],{encoding:'utf8'}).split('\n').filter(Boolean);
  if(changed.some(p=>['app.js','app.css','index.html','manifest.webmanifest'].includes(p))){
   const oldIndex=execFileSync('git',['show',base+':index.html'],{encoding:'utf8'});
   const oldCssV=Number(oldIndex.match(/app\.css\?v=(\d+)/)?.[1]);
   const oldJsV=Number(oldIndex.match(/app\.js\?v=(\d+)/)?.[1]);
   if(changed.some(p=>['app.js','app.css','manifest.webmanifest'].includes(p))){
    assert(cssVersion>oldCssV&&jsVersion>oldJsV,'UI code changed without a new public asset version');
   }
   assert(changed.includes('sw.js'),'UI code changed without updating the offline shell cache');
  }
 }catch(e){
  if(e.message?.startsWith('WAPS release blocked:'))throw e;
  throw new Error('Cannot compare release with its baseline: '+e.message);
 }
}
console.log('WAPS release contract PASS: approved artwork, core features, orientation, cache versions');
