from pathlib import Path
from PIL import Image, ImageChops, ImageFilter

SRC=Path("assets/concepts/waps-concepts-sprite-v2.webp")
OUT=Path("assets/concepts/individual")
OUT.mkdir(parents=True, exist_ok=True)

POS={
"apple":(0,0),"banana":(1,0),"mango":(2,0),"plantain":(3,0),"yam":(4,0),"water":(5,0),"cup":(6,0),"bread":(8,0),"juice":(9,0),
"shoe":(0,1),"book":(1,1),"car":(2,1),"ball":(3,1),"bus":(4,1),"taxi":(5,1),"house":(6,1),"school":(7,1),"church":(8,1),"clinic":(9,1),
"park":(0,2),"beach":(1,2),"market":(2,2),"bedroom":(3,2),"kitchen":(4,2),"toilet":(5,2),"bed":(6,2),"chair":(8,2),"door":(9,2),
"mum":(0,3),"dad":(1,3),"brother":(2,3),"sister":(3,3),"teacher":(4,3),"friend":(5,3),"doctor":(6,3),"nurse":(7,3),"grandma":(8,3),"grandpa":(9,3),
"eat":(0,4),"drink":(1,4),"write":(2,4),"read":(3,4),"play":(4,4),"wash":(5,4),"walk":(6,4),"run":(7,4),"jump":(8,4),"sleep":(9,4),
"happy":(0,5),"sad":(1,5),"angry":(2,5),"scared":(3,5),"tired":(4,5),"hurts":(5,5),"calm":(6,5),"excited":(9,5),
"ear":(1,6),"hand":(2,6),"foot":(3,6),"mouth":(5,6),"head":(6,6),"stop":(8,6),"yes":(9,6)
}

img=Image.open(SRC).convert("RGB")
W,H=img.size
cols,rows=10,7

def cell_bounds(x,y):
    left=round(x*W/cols); right=round((x+1)*W/cols)
    top=round(y*H/rows); bottom=round((y+1)*H/rows)
    return left,top,right,bottom

def trim_white(tile):
    white=Image.new("RGB",tile.size,"white")
    diff=ImageChops.difference(tile,white).convert("L")
    mask=diff.point(lambda p: 255 if p>10 else 0)
    box=mask.getbbox()
    if not box: return tile
    l,t,r,b=box
    px=max(8,int((r-l)*.08)); py=max(8,int((b-t)*.08))
    l=max(0,l-px); t=max(0,t-py); r=min(tile.width,r+px); b=min(tile.height,b+py)
    return tile.crop((l,t,r,b))

for name,(x,y) in POS.items():
    tile=img.crop(cell_bounds(x,y))
    tile=trim_white(tile)
    canvas=Image.new("RGB",(1024,1024),"white")
    scale=min(900/tile.width,900/tile.height)
    size=(max(1,round(tile.width*scale)),max(1,round(tile.height*scale)))
    tile=tile.resize(size,Image.Resampling.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.1,percent=115,threshold=3))
    canvas.paste(tile,((1024-size[0])//2,(1024-size[1])//2))
    canvas.save(OUT/f"{name}.webp","WEBP",quality=96,method=6)

print(f"Generated {len(POS)} individual concept images from {W}x{H} source atlas.")
