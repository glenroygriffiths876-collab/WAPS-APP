from pathlib import Path
import json, math
from PIL import Image, ImageDraw, ImageFilter, ImageOps

OUT=Path("assets/concepts/highres")
OUT.mkdir(parents=True,exist_ok=True)
S=1024

def canvas():
    im=Image.new("RGB",(S,S),(255,255,255))
    # very subtle studio floor/background
    bg=Image.new("RGBA",(S,S),(255,255,255,0))
    d=ImageDraw.Draw(bg)
    for r,a in [(470,8),(390,7),(310,6)]:
        d.ellipse((512-r,560-r//3,512+r,560+r//3),fill=(70,120,150,a))
    return Image.alpha_composite(im.convert("RGBA"),bg)

def load_asset(name):
    p=OUT/f"{name}.webp"
    if not p.exists(): return None
    return Image.open(p).convert("RGBA")

def shadow_layer(box,blur=28,alpha=45):
    lay=Image.new("RGBA",(S,S),(0,0,0,0));d=ImageDraw.Draw(lay)
    d.ellipse(box,fill=(20,45,65,alpha))
    return lay.filter(ImageFilter.GaussianBlur(blur))

def place(im,obj,size,xy):
    if obj is None:return
    o=obj.copy();o.thumbnail(size,Image.Resampling.LANCZOS)
    x=int(xy[0]-o.width/2);y=int(xy[1]-o.height/2)
    im.alpha_composite(o,(x,y))

ball=load_asset("ball")
car=load_asset("car")
cup=load_asset("cup")

def big_small(name,big):
    im=canvas()
    if ball:
        target=(690,690) if big else (330,330)
        place(im,ball,target,(512,500 if big else 535))
    else:
        d=ImageDraw.Draw(im);r=285 if big else 135
        d.ellipse((512-r,500-r,512+r,500+r),fill=(238,102,77,255))
    im.save(OUT/f"{name}.webp","WEBP",quality=95,method=6)

def box_scene(name,relation):
    im=canvas(); d=ImageDraw.Draw(im)
    # studio box with subtle 3D shading
    x1,y1,x2,y2=280,300,740,720
    d.rounded_rectangle((x1,y1,x2,y2),radius=35,fill=(231,201,147),outline=(154,116,72),width=10)
    d.rectangle((x1+24,y1+24,x2-24,y2-24),fill=(246,226,189))
    d.line((x1+25,y1+25,x1+90,y1-35,x2-90,y1-35,x2-25,y1+25),fill=(176,135,88),width=9)
    pos={"inside":(510,515),"outside":(820,545),"behind":(512,350),"beside":(815,540)}[relation]
    if relation=="behind":
        # ball first, then box over it to make occlusion explicit
        if ball: place(im,ball,(310,310),pos)
        else:d.ellipse((405,245,619,459),fill=(222,73,67))
        # redraw box lower portion in front
        d.rounded_rectangle((x1,y1+120,x2,y2),radius=35,fill=(231,201,147),outline=(154,116,72),width=10)
        d.rectangle((x1+24,y1+144,x2-24,y2-24),fill=(246,226,189))
    else:
        if ball: place(im,ball,(300,300),pos)
        else:
            px,py=pos;d.ellipse((px-105,py-105,px+105,py+105),fill=(222,73,67))
    im.save(OUT/f"{name}.webp","WEBP",quality=95,method=6)

def cup_state(name,full):
    im=canvas(); d=ImageDraw.Draw(im)
    # consistent transparent tumbler with realistic gradients
    x1,y1,x2,y2=330,210,695,790
    d.rounded_rectangle((x1,y1,x2,y2),radius=55,fill=(236,248,255,220),outline=(95,157,196,255),width=12)
    if full:
        d.rounded_rectangle((x1+22,350,x2-22,y2-22),radius=38,fill=(83,183,232,210))
        d.ellipse((x1+22,330,x2-22,390),fill=(135,219,250,230))
    # glossy highlights
    d.rounded_rectangle((x1+45,y1+50,x1+78,y2-70),radius=16,fill=(255,255,255,160))
    im.alpha_composite(shadow_layer((330,770,700,850),20,40))
    im.save(OUT/f"{name}.webp","WEBP",quality=95,method=6)

def door_state(name,open_):
    im=canvas();d=ImageDraw.Draw(im)
    # same frame across both states
    frame=(270,150,760,825)
    d.rounded_rectangle(frame,radius=18,fill=(240,235,222),outline=(120,92,65),width=18)
    d.rectangle((310,195,720,790),fill=(226,206,175))
    if open_:
        # dark interior and perspective door leaf
        d.rectangle((330,220,700,785),fill=(82,95,102))
        poly=[(350,225),(600,285),(600,745),(350,785)]
        d.polygon(poly,fill=(156,96,56),outline=(94,56,33))
        d.ellipse((555,510,580,535),fill=(222,181,73))
    else:
        d.rounded_rectangle((335,220,695,785),radius=10,fill=(164,99,58),outline=(100,59,35),width=8)
        for y in [350,600]:d.line((360,y,670,y),fill=(124,73,43),width=8)
        d.ellipse((625,500,650,525),fill=(222,181,73))
    im.alpha_composite(shadow_layer((285,790,750,855),18,38))
    im.save(OUT/f"{name}.webp","WEBP",quality=95,method=6)

def speed_state(name,fast):
    im=canvas();d=ImageDraw.Draw(im)
    if fast:
        for yy,w in [(390,260),(470,330),(550,220),(630,285)]:
            d.rounded_rectangle((90,yy,90+w,yy+18),radius=9,fill=(91,178,226,170))
    else:
        # visual "slow" path markers, no text
        for x in [190,280,370]:
            d.ellipse((x,600,x+22,622),fill=(104,164,117))
    if car: place(im,car,(650,500),(580,520))
    else:d.rounded_rectangle((300,400,760,650),radius=70,fill=(45,139,220))
    im.save(OUT/f"{name}.webp","WEBP",quality=95,method=6)

def weather(name,kind):
    im=canvas();d=ImageDraw.Draw(im)
    if kind=="sun":
        center=(512,460);r=185
        for ang in range(0,360,30):
            x1=center[0]+math.cos(math.radians(ang))*245;y1=center[1]+math.sin(math.radians(ang))*245
            x2=center[0]+math.cos(math.radians(ang))*330;y2=center[1]+math.sin(math.radians(ang))*330
            d.line((x1,y1,x2,y2),fill=(255,194,31),width=28)
        d.ellipse((center[0]-r,center[1]-r,center[0]+r,center[1]+r),fill=(255,205,48))
    elif kind=="rain":
        # soft clouds + distinct rain drops
        d.ellipse((250,250,520,470),fill=(183,201,217));d.ellipse((420,190,720,480),fill=(170,191,211));d.ellipse((560,280,800,480),fill=(183,201,217))
        for x,y in [(320,540),(430,610),(540,540),(650,620),(745,545)]:
            d.line((x,y,x-30,y+95),fill=(64,156,220),width=18)
    else:
        # lamp/light concept: illuminated bulb and glow
        glow=Image.new("RGBA",(S,S),(0,0,0,0));gd=ImageDraw.Draw(glow)
        for r,a in [(270,20),(220,30),(170,42)]:gd.ellipse((512-r,420-r,512+r,420+r),fill=(255,211,61,a))
        im=Image.alpha_composite(im,glow.filter(ImageFilter.GaussianBlur(22)));d=ImageDraw.Draw(im)
        d.ellipse((360,230,665,535),fill=(255,222,90),outline=(220,177,37),width=12)
        d.polygon([(430,495),(590,495),(560,650),(460,650)],fill=(218,218,210))
        d.rounded_rectangle((455,640,565,720),radius=20,fill=(96,109,119))
    im.save(OUT/f"{name}.webp","WEBP",quality=95,method=6)

big_small("big",True);big_small("small",False)
for r in ["inside","outside","behind","beside"]:box_scene(r,r)
cup_state("full",True);cup_state("empty",False)
door_state("open",True);door_state("closed",False)
speed_state("fast",True);speed_state("slow",False)
weather("rain","rain");weather("sun","sun");weather("light","light")

manifest_path=OUT/"manifest.json"
try: manifest=json.loads(manifest_path.read_text())
except Exception: manifest={}
for name in ["big","small","inside","outside","behind","beside","full","empty","open","closed","fast","slow","rain","sun","light"]:
    manifest[name]={
      "path":f"./assets/concepts/highres/{name}.webp",
      "source":"Original WAPS controlled teaching visual",
      "license":"Original WAPS asset",
      "review_status":"controlled visual; human concept-recognition review required",
      "visual_type":"controlled teaching visual"
    }
manifest_path.write_text(json.dumps(manifest,indent=2,ensure_ascii=False))
print("Controlled WAPS visuals generated:",15)
