from pathlib import Path
import io, json, time, requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from PIL import Image, ImageOps
from rembg import remove, new_session

OUT=Path("assets/concepts/highres")
OUT.mkdir(parents=True, exist_ok=True)
API="https://commons.wikimedia.org/w/api.php"
UA={"User-Agent":"WAPS-Communication/2.0 educational accessibility project (contact: repository maintainer)"}
http=requests.Session()
retry=Retry(total=5,connect=5,read=5,status=5,backoff_factor=1.3,status_forcelist=[429,500,502,503,504],allowed_methods=["GET"])
http.mount("https://",HTTPAdapter(max_retries=retry))
session_bg=new_session("u2netp")

CURATED={
 "apple":"Apple-001.jpg","banana":"Banana isolated on white.jpg","mango":"Mango (1).jpg",
 "plantain":"Plantains on white background.png","yam":"Yam tuber.jpg","cup":"Plastic Cup no Ice.jpg",
 "shoe":"Airforce1.jpg","book":"Open book color.jpg","car":"2021 Nissan Rogue.jpg",
 "ball":"Ball white black.jpg","water":"Glass-of-water.jpg",
 "breadfruit":"Artocarpus altilis (fruit).jpg","patty":"Homemade Jamaican patties.jpg"
}

# Search only for highly concrete concepts where a literal photograph is the clearest teaching visual.
SEARCHES={
 "orange":"orange fruit isolated white background",
 "spoon":"metal spoon isolated white background",
 "plate":"white plate isolated white background",
 "toothbrush":"toothbrush isolated white background",
 "shirt":"t shirt isolated white background",
 "pants":"trousers isolated white background",
 "bed":"bed furniture isolated white background",
 "chair":"chair furniture isolated white background",
 "door":"door isolated white background",
 "bag":"school backpack isolated white background",
 "pencil":"pencil isolated white background",
 "juice":"glass of fruit juice isolated white background",
 "milk":"glass of milk isolated white background",
 "rice":"bowl cooked rice isolated white background",
 "chicken":"cooked chicken food isolated white background",
 "fish":"fish food isolated white background",
 "egg":"chicken egg isolated white background",
 "bread":"loaf of bread isolated white background",
 "cookie":"biscuit cookie isolated white background",
 "soap":"bar soap isolated white background",
 "towel":"towel isolated white background",
 "comb":"hair comb isolated white background",
 "phone":"smartphone isolated white background",
 "tablet":"tablet computer isolated white background",
 "tv":"television isolated white background",
 "bike":"bicycle isolated white background",
 "tree":"tree isolated white background",
 "flower":"flower isolated white background",
 "cat":"cat white background",
 "dog":"dog white background",
 "bird":"bird white background",
 "toy":"children toy isolated white background",
 "doll":"doll toy isolated white background",
 "blocks":"toy building blocks isolated white background",
 "puzzle":"jigsaw puzzle isolated white background",
 "crayon":"crayon isolated white background",
 "scissors":"scissors isolated white background",
 "glue":"glue bottle isolated white background",
 "desk":"school desk isolated white background",
 "computer":"laptop computer isolated white background",
 "uniform":"school uniform isolated white background"
}

def val(meta,key):
    return meta.get(key,{}).get("value","")

def commons_info(title):
    title=title if title.startswith("File:") else "File:"+title
    params={"action":"query","format":"json","prop":"imageinfo","iiprop":"url|extmetadata|size","iiurlwidth":1800,"titles":title}
    resp=http.get(API,params=params,headers=UA,timeout=60); resp.raise_for_status()
    page=next(iter(resp.json()["query"]["pages"].values()))
    ii=page["imageinfo"][0]
    return ii.get("thumburl") or ii["url"], ii.get("extmetadata",{}), page.get("title",title), ii

def commons_search(query):
    params={"action":"query","format":"json","list":"search","srnamespace":6,"srlimit":10,"srsearch":query}
    resp=http.get(API,params=params,headers=UA,timeout=60); resp.raise_for_status()
    hits=resp.json().get("query",{}).get("search",[])
    bad=("svg","diagram","map","logo","flag","icon")
    for hit in hits:
        title=hit.get("title","")
        low=title.lower()
        if any(x in low for x in bad):
            continue
        try:
            url,meta,full,ii=commons_info(title)
            mime=(ii.get("mime") or "").lower()
            if mime and not mime.startswith("image/"):
                continue
            if ii.get("width",0)<500 or ii.get("height",0)<500:
                continue
            return url,meta,full
        except Exception:
            continue
    raise RuntimeError("No suitable Commons image found for "+query)

def isolate(img):
    img=ImageOps.exif_transpose(img).convert("RGBA")
    img.thumbnail((1800,1800),Image.Resampling.LANCZOS)
    try:
        cut=remove(img,session=session_bg)
        if isinstance(cut,bytes): cut=Image.open(io.BytesIO(cut)).convert("RGBA")
        else: cut=cut.convert("RGBA")
        alpha=cut.getchannel("A"); box=alpha.getbbox()
        if box:
            l,t,r,b=box; px=max(12,int((r-l)*.07)); py=max(12,int((b-t)*.07))
            cut=cut.crop((max(0,l-px),max(0,t-py),min(cut.width,r+px),min(cut.height,b+py)))
    except Exception:
        cut=img
    canvas=Image.new("RGBA",(1024,1024),(255,255,255,255))
    cut.thumbnail((900,900),Image.Resampling.LANCZOS)
    canvas.alpha_composite(cut,((1024-cut.width)//2,(1024-cut.height)//2))
    return canvas.convert("RGB")

def fetch_image(url):
    resp=http.get(url,headers=UA,timeout=120); resp.raise_for_status()
    ctype=resp.headers.get("content-type","")
    if "image" not in ctype: raise RuntimeError("Expected image response, got "+ctype)
    return Image.open(io.BytesIO(resp.content))

try:
    credits=json.loads((OUT/"ATTRIBUTION.json").read_text(encoding="utf-8"))
except Exception:
    credits={}
failed={}

targets=[(k,("file",v)) for k,v in CURATED.items()]+[(k,("search",v)) for k,v in SEARCHES.items()]
for concept,(kind,value) in targets:
    try:
        if kind=="file":
            url,meta,title,_=commons_info(value)
        else:
            url,meta,title=commons_search(value)
        time.sleep(.45)
        img=fetch_image(url)
        final=isolate(img)
        final.save(OUT/f"{concept}.webp","WEBP",quality=94,method=6)
        credits[concept]={
          "source_file":title,
          "source_url":"https://commons.wikimedia.org/wiki/"+title.replace(" ","_"),
          "artist":val(meta,"Artist"),
          "license":val(meta,"LicenseShortName"),
          "license_url":val(meta,"LicenseUrl"),
          "credit":val(meta,"Credit"),
          "visual_type":"isolated real-world teaching photograph",
          "review_status":"automated technical QA complete; human concept-recognition review required"
        }
        print("OK",concept,title,img.size)
    except Exception as e:
        failed[concept]=str(e); print("FAILED",concept,repr(e))

(OUT/"ATTRIBUTION.json").write_text(json.dumps(credits,indent=2,ensure_ascii=False),encoding="utf-8")
md=["# WAPS high-resolution concept image credits","",
    "These teaching images are derived from openly licensed Wikimedia Commons files. "
    "Backgrounds are removed/cropped and images are normalized to 1024×1024 for clear in-app teaching use.",
    "",
    "Every image must still pass human concept-recognition review before it is treated as clinically validated content.",""]
for k,v in sorted(credits.items()):
    md.append(f"- **{k.title()}** — {v.get('source_file','')} — {v.get('license','')} — {v.get('source_url','')}")
(OUT/"ATTRIBUTIONS.md").write_text("\n".join(md)+"\n",encoding="utf-8")

# Small machine-readable production manifest.
manifest={k:{
  "path":f"./assets/concepts/highres/{k}.webp",
  "source":v.get("source_url",""),
  "license":v.get("license",""),
  "review_status":v.get("review_status","human review required")
} for k,v in sorted(credits.items()) if (OUT/f"{k}.webp").exists()}
(OUT/"manifest.json").write_text(json.dumps(manifest,indent=2,ensure_ascii=False),encoding="utf-8")
print("Generated",len(manifest),"high-resolution concept images.")
if failed: print("Failures:",json.dumps(failed,indent=2))
if len(manifest)<20: raise SystemExit("Too few high-resolution concepts were generated.")
