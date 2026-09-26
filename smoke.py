from pathlib import Path
import json,re,xml.etree.ElementTree as ET
r=Path(__file__).parents[1]
required=['index.html','manifest.webmanifest','sw.js','css/app.css','js/app.js','js/data.js','js/storage.js','data/visual-manifest.json']
for f in required: assert (r/f).exists(),f
m=json.loads((r/'manifest.webmanifest').read_text()); assert m['start_url'].startswith('./')
v=json.loads((r/'data/visual-manifest.json').read_text()); assert len(v)>=20
for x in v: ET.parse(r/x['path'])
js=(r/'js/app.js').read_text();
for term in ['WAPS Talk','Coach Me','IndexedDB','backup','restore','Partner Mode','Jamaican Creole']:
    assert term.lower() in (js+(r/'js/storage.js').read_text()+(r/'js/data.js').read_text()).lower(),term
html=(r/'index.html').read_text();assert 'data-route="talk"' in html and 'manifest.webmanifest' in html
print('Static smoke checks passed:',len(v),'visual assets')
