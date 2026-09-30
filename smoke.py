from pathlib import Path
import json,re
r=Path(__file__).parent
required=['index.html','manifest.webmanifest','sw.js','app.css','app.js','data.js','storage.js','visual-manifest.json']
for f in required:
    assert (r/f).exists(), f"missing {f}"
m=json.loads((r/'manifest.webmanifest').read_text(encoding='utf-8'))
assert m['start_url'].startswith('./') and m['display']=='standalone'
html=(r/'index.html').read_text(encoding='utf-8')
assert re.search(r'app\.css\?v=\d+',html), 'CSS cache version missing'
assert re.search(r'app\.js\?v=\d+',html), 'JS cache version missing'
for route in ['home','talk','practice','coach','more']:
    assert f'data-route="{route}"' in html, f'missing primary route {route}'
app=(r/'app.js').read_text(encoding='utf-8')
assert 'integrityAudit()' in app
assert "'home','talk','practice','coach','progress','more'" in app, 'progress route missing from app router'
for brand_asset in ['assets/brand/waps-mark.svg','assets/brand/waps-full.svg','assets/brand/waps-icon.svg','assets/brand/waps-maskable.svg']:
    assert (r/brand_asset).exists(), f'missing official brand asset {brand_asset}'
assert 'official-brand-mark' in html, 'official WAPS header branding missing'
assert 'wireTalkControls' not in app and 'wirePracticeLaunch' not in app and 'wireCoachLaunch' not in app
assert not re.search(r"(?<!\\$)\\$\\('\.bottomnav button,\.desktopnav button'\\)\.forEach",app), 'single-query selector forEach crash regression'
actions=set(re.findall(r'data-action=["\']([^"\'$]+)["\']',app))
handled=set(re.findall(r"if\(a===['\"]([^'\"]+)['\"]",app))
missing=sorted(actions-handled)
assert not missing, f'unhandled actions: {missing}'
sw=(r/'sw.js').read_text(encoding='utf-8')
assert 'networkFirst' in sw and 'OPTIONAL=' in sw and 'skipWaiting' in sw and 'clients.claim' in sw
print('WAPS smoke gate PASS:',{'actions':len(actions),'primary_routes':5,'progress_route':'app','cache_optional':sw.count('./')})
