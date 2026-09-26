from pathlib import Path
import io, json, time, requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from PIL import Image, ImageOps
from rembg import remove, new_session

OUT=Path("assets/concepts/highres")
OUT.mkdir(parents=True, exist_ok=True)

FILES={
 "apple":"Apple-001.jpg",
 "banana":"Banana isolated on white.jpg",
 "mango":"Mango (1).jpg",
 "plantain":"Plantains on white background.png",
 "yam":"Yam tuber.jpg",
 "cup":"Plastic Cup no Ice.jpg",
 "shoe":"Airforce1.jpg",
 "book":"Open book color.jpg",
 "car":"2021 Nissan Rogue.jpg",
 "ball":"Ball white black.jpg",
 "water":"Glass-of-water.jpg",
 "breadfruit":"Artocarpus altilis (fruit).jpg",
 "patty":"Homemade Jamaican patties.jpg"
}
API="https://commons.wikimedia.org/w/api.php"
UA={"User-Agent":"WAPS-Communication/1.0 educational accessibility project (contact: repository maintainer)"}
http=requests.Session()
retry=Retry(total=5,connect=5,read=5,status=5,backoff_factor=1.4,status_forcelist=[429,500,502,503,504],allowed_methods=["GET"])
http.mount("https://",HTTPAdapter(max_retries=retry))
session_bg=new_session("u2netp")
credits={}

def commons_info(filename):
    params={"action":"query","format":"json","prop":"imageinfo","iiprop":"url|extmetadata","iiurlwidth":1800,
            "titles":"File:"+filename}
    resp=http.get(API,params=params,headers=UA,timeout=60)
    resp.raise_for_status()
    ctype=resp.headers.get("content-type","")
    if "json" not in ctype:
        raise RuntimeError(f"Commons API returned {ctype or 'unknown content type'}")
    j=resp.json()
    page=next(iter(j["query"]["pages"].values()))
    ii=page["imageinfo"][0]
    return ii.get("thumburl") or ii["url"], ii.get("extmetadata",{}), page.get("title","File:"+filename)

def val(meta,key):
    return meta.get(key,{}).get("value","")

def isolate(img):
    img=ImageOps.exif_transpose(img).convert("RGBA")
    img.thumbnail((1600,1600),Image.Resampling.LANCZOS)
    try:
        cut=remove(img,session=session_bg)
        if isinstance(cut,bytes):
            cut=Image.open(io.BytesIO(cut)).convert("RGBA")
        else:
            cut=cut.convert("RGBA")
        alpha=cut.getchannel("A")
        box=alpha.getbbox()
        if box:
            l,t,r,b=box
            px=max(10,int((r-l)*.06)); py=max(10,int((b-t)*.06))
            box=(max(0,l-px),max(0,t-py),min(cut.width,r+px),min(cut.height,b+py))
            cut=cut.crop(box)
    except Exception:
        cut=img
    canvas=Image.new("RGBA",(1024,1024),(255,255,255,255))
    cut.thumbnail((900,900),Image.Resampling.LANCZOS)
    x=(1024-cut.width)//2; y=(1024-cut.height)//2
    if cut.mode=="RGBA":
        canvas.alpha_composite(cut,(x,y))
    else:
        canvas.paste(cut,(x,y))
    return canvas.convert("RGB")

failed={}
for concept,filename in FILES.items():
    try:
        url,meta,title=commons_info(filename)
        time.sleep(.7)
        resp=http.get(url,headers=UA,timeout=120)
        resp.raise_for_status()
        ctype=resp.headers.get("content-type","")
        if "image" not in ctype:
            raise RuntimeError(f"Expected image response, got {ctype} from {url}")
        img=Image.open(io.BytesIO(resp.content))
        final=isolate(img)
        final.save(OUT/f"{concept}.webp","WEBP",quality=95,method=6)
        credits[concept]={
          "source_file":title,
          "source_url":"https://commons.wikimedia.org/wiki/"+title.replace(" ","_"),
          "artist":val(meta,"Artist"),
          "license":val(meta,"LicenseShortName"),
          "license_url":val(meta,"LicenseUrl"),
          "credit":val(meta,"Credit")
        }
        print("OK",concept,filename,img.size)
    except Exception as e:
        failed[concept]=str(e)
        print("FAILED",concept,filename,repr(e))

(OUT/"ATTRIBUTION.json").write_text(json.dumps(credits,indent=2,ensure_ascii=False),encoding="utf-8")
md=["# WAPS high-resolution concept image credits","",
    "These teaching images are derived from openly licensed Wikimedia Commons files. "
    "Backgrounds were removed/cropped and images were resized for clear in-app teaching use.",""]
for k,v in credits.items():
    md.append(f"- **{k.title()}** — {v['source_file']} — {v['license']} — {v['source_url']}")
(OUT/"ATTRIBUTIONS.md").write_text("\n".join(md)+"\n",encoding="utf-8")
print("Generated",len(credits),"of",len(FILES),"high-resolution isolated concept images.")
if failed:
    print("Failures:",json.dumps(failed,indent=2))
if len(credits)<8:
    raise SystemExit("Too few high-resolution concepts were generated.")
