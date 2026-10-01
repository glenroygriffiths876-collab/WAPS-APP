from pathlib import Path
import json,re
r=Path(__file__).parent
required=['index.html','manifest.webmanifest','sw.js','app.css','app.js','data.js','storage.js','math-learning.js','comprehension-learning.js','comprehension-data.js','visual-manifest.json']
for f in required:
    assert (r/f).exists(), f"missing {f}"
m=json.loads((r/'manifest.webmanifest').read_text(encoding='utf-8'))
assert m['start_url'].startswith('./') and m['display']=='standalone'
html=(r/'index.html').read_text(encoding='utf-8')
assert re.search(r'app\.css\?v=\d+',html), 'CSS cache version missing'
assert re.search(r'app\.js\?v=\d+',html), 'JS cache version missing'
for route in ['home','talk','practice','more']:
    assert f'data-route="{route}"' in html, f'missing primary route {route}'
app=(r/'app.js').read_text(encoding='utf-8')
assert 'integrityAudit()' in app
assert "'home','talk','practice','coach','progress','more'" in app, 'progress route missing from app router'
for brand_asset in ['assets/brand/waps-mark.svg','assets/brand/waps-full.svg','assets/brand/waps-icon.svg','assets/brand/waps-maskable.svg']:
    assert (r/brand_asset).exists(), f'missing official brand asset {brand_asset}'
assert 'official-brand-mark' in html, 'official WAPS header branding missing'
assert 'Mixed Practice' in app and 'EXTERNAL_LEARNING_RESOURCES' in app and 'Explore More' in app, 'v50 practice tabs missing'
assert 'School Shadow / Caregiver' in app, 'shadow resource missing'
assert 'Gentle Steps' in app and 'waps-gentle-steps.mp3' in app, 'v50 background music missing'
assert 'wireTalkControls' not in app and 'wirePracticeLaunch' not in app and 'wireCoachLaunch' not in app
assert not re.search(r"(?<!\\$)\\$\\('\.bottomnav button,\.desktopnav button'\\)\.forEach",app), 'single-query selector forEach crash regression'
actions=set(re.findall(r'data-action=["\']([^"\'$]+)["\']',app))
handled=set(re.findall(r"if\(a===['\"]([^'\"]+)['\"]",app))
delegated={'traceLaunch','traceWordsLaunch','csLaunch','mathLaunch','muLaunch'}
missing=sorted(actions-handled-delegated)
assert not missing, f'unhandled actions: {missing}'
sw=(r/'sw.js').read_text(encoding='utf-8')
assert 'networkFirst' in sw and 'OPTIONAL=' in sw and 'skipWaiting' in sw and 'clients.claim' in sw

# v51 production visual gate (includes v50 comprehension assets)
special=["supermarket","playground","clock","fork","glass","bottle","pen","marker","dress","hat","red-apple","red-car","blue-car","brown-dog","brown-horse","green-dotted-ball","hot-soup","ice-cream","calendar","snack","kite"]
comp=(r/'comprehension-data.js').read_text(encoding='utf-8')
css=(r/'app.css').read_text(encoding='utf-8')
visual_manifest=json.loads((r/'assets/concepts/highres/manifest.json').read_text(encoding='utf-8'))
assert 'app.css?v=51' in html and 'app.js?v=51' in html, 'v51 public asset references missing'
assert 'waps-reference-shell-v51' in sw, 'v51 cache name missing'
assert (r/'assets/fonts/fredoka-variable.woff2').exists(), 'Fredoka WOFF2 missing'
assert (r/'assets/fonts/OFL-Fredoka.txt').exists(), 'Fredoka OFL missing'
assert (r/'assets/fonts/nunito-variable.ttf').exists(), 'Nunito font missing'
assert (r/'assets/fonts/OFL-Nunito.txt').exists(), 'Nunito OFL missing'
assert (r/'assets/audio/waps-gentle-steps.mp3').exists(), 'Gentle Steps MP3 missing'
assert (r/'assets/audio/waps-gentle-steps.mp3').stat().st_size>100000, 'Gentle Steps MP3 suspiciously small'
assert (r/'assets/ui/v51/icons.svg').exists(), 'v51 icon sprite missing'
assert (r/'assets/ui/v51/manifest.json').exists(), 'v51 icon manifest missing'
v51_manifest=json.loads((r/'assets/ui/v51/manifest.json').read_text(encoding='utf-8'))
assert v51_manifest.get('release')=='v51', 'v51 manifest release mismatch'
assert len(v51_manifest.get('icons',{}))==48, 'v51 manifest must contain 48 icons'
assert './assets/ui/v51/icons.svg' in sw and './assets/ui/v51/manifest.json' in sw, 'v51 UI assets not cached'
assert 'WAPS v51 — joyful responsive visual identity' in css, 'v51 CSS layer missing'
assert 'fredoka-variable.woff2' in css, 'Fredoka not wired in CSS'
assert 'nunito-variable.ttf' in css, 'Nunito not wired in CSS'
assert './assets/audio/waps-gentle-steps.mp3' in sw, 'music not listed for runtime/offline cache'
for legacy in ['board-001-020.webp','board-041-060.webp','assets/comprehension/kite.webp','mu-sprite','BOARD_SRC']:
    assert legacy not in comp, f'legacy comprehension reference remains: {legacy}'
for legacy in ['.mu-sprite','.mu-snack-visual']:
    assert legacy not in css, f'legacy comprehension CSS remains: {legacy}'
for asset in ['board-001-020.webp','board-041-060.webp','assets/comprehension/kite.webp']:
    assert asset not in sw, f'legacy cached asset remains: {asset}'
for concept in special:
    rel=f'./assets/concepts/highres/{concept}.webp'
    p=r/'assets/concepts/highres'/f'{concept}.webp'
    assert p.exists(), f'missing v50 visual: {concept}'
    assert p.stat().st_size>4000, f'suspiciously small v50 visual: {concept}'
    assert rel in comp, f'v50 visual not wired: {concept}'
    assert rel in sw, f'v50 visual not cached: {concept}'
    meta=visual_manifest.get(concept)
    assert meta, f'v50 visual not registered in manifest: {concept}'
    assert meta.get('path')==rel, f'wrong manifest path: {concept}'
    assert meta.get('width')==1024 and meta.get('height')==1024, f'wrong manifest dimensions: {concept}'
print('WAPS smoke gate PASS:',{'actions':len(actions),'primary_routes':4,'progress_route':'app','cache_optional':sw.count('./')})
