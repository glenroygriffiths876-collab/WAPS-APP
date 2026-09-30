from PIL import Image, ImageDraw
from pathlib import Path
import numpy as np, base64, io

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'assets/brand/waps-official-source.png'
BRAND=ROOT/'assets/brand'
BRAND.mkdir(parents=True,exist_ok=True)

src=Image.open(SRC).convert('RGBA')
rgb=np.asarray(src.convert('RGB'))
mask=np.max(255-rgb,axis=2)>20
ys,xs=np.where(mask)
if not len(xs):
    raise RuntimeError('Official WAPS source appears blank')

# Two foreground bands are expected: the WAPS mark and the long organisation name.
row_counts=mask.sum(axis=1)
bands=[]; inside=False
for i,on in enumerate(row_counts>0):
    if on and not inside:
        start=i; inside=True
    elif not on and inside:
        bands.append((start,i)); inside=False
if inside: bands.append((start,len(row_counts)))
if len(bands)<2:
    raise RuntimeError(f'Could not identify WAPS mark/subtitle bands: {bands}')

def bounds_for(y0,y1,pad=12):
    section=mask[y0:y1]
    sy,sx=np.where(section)
    l=max(0,int(sx.min())-pad); r=min(src.width,int(sx.max())+1+pad)
    t=max(0,y0+int(sy.min())-pad); b=min(src.height,y0+int(sy.max())+1+pad)
    return (l,t,r,b)

mark_box=bounds_for(*bands[0],pad=14)
full_box=(max(0,int(xs.min())-18),max(0,int(ys.min())-18),min(src.width,int(xs.max())+1+18),min(src.height,int(ys.max())+1+18))
mark=src.crop(mark_box).convert('RGB')
full=src.crop(full_box).convert('RGB')

# Practical in-app masters; preserve official glossy design without stretching.
full.thumbnail((1200,720),Image.Resampling.LANCZOS)
mark.thumbnail((1200,560),Image.Resampling.LANCZOS)
full.quantize(colors=256,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.FLOYDSTEINBERG).save(BRAND/'waps-full.png',optimize=True)
mark.quantize(colors=256,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.FLOYDSTEINBERG).save(BRAND/'waps-mark.png',optimize=True)

BG=(255,253,248)
def square(size,maskable=False):
    canvas=Image.new('RGB',(size,size),BG)
    # Normal icons keep the mark large but with breathing room. Maskable keeps all
    # critical content inside a conservative central zone for circular/squircle crops.
    frac=.72 if maskable else (.94 if size<=48 else .88)
    maxw=round(size*frac)
    maxh=round(size*(.70 if maskable else .78))
    scale=min(maxw/mark.width,maxh/mark.height)
    w=max(1,round(mark.width*scale)); h=max(1,round(mark.height*scale))
    art=mark.resize((w,h),Image.Resampling.LANCZOS)
    canvas.paste(art,((size-w)//2,(size-h)//2))
    return canvas

sizes=(16,32,48,72,96,128,144,152,180,192,384,512)
for n in sizes:
    q=square(n).quantize(colors=128 if n<=96 else 256,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.FLOYDSTEINBERG)
    q.save(ROOT/f'icon-{n}.png',optimize=True)
square(180).quantize(colors=256).save(ROOT/'apple-touch-icon.png',optimize=True)
square(192,True).quantize(colors=256).save(ROOT/'maskable-192.png',optimize=True)
square(512,True).quantize(colors=256).save(ROOT/'maskable-512.png',optimize=True)
square(1024).quantize(colors=256).save(BRAND/'icon-master.png',optimize=True)
square(1024,True).quantize(colors=256).save(BRAND/'maskable-master.png',optimize=True)

# Self-contained SVG masters embed the exact derived WAPS mark.
def embedded_svg(maskable=False):
    im=square(1024,maskable)
    bio=io.BytesIO(); im.save(bio,format='PNG',optimize=True)
    b64=base64.b64encode(bio.getvalue()).decode('ascii')
    label='WAPS maskable app icon' if maskable else 'WAPS app icon'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" role="img" aria-label="{label}">
  <image width="1024" height="1024" href="data:image/png;base64,{b64}"/>
</svg>'''
(ROOT/'icon.svg').write_text(embedded_svg(False),encoding='utf-8')
(ROOT/'icon-master.svg').write_text(embedded_svg(False),encoding='utf-8')
(ROOT/'maskable-master.svg').write_text(embedded_svg(True),encoding='utf-8')

# Visual QA board retained in repo so future brand changes can be inspected.
qa=Image.new('RGB',(1200,820),'white'); d=ImageDraw.Draw(qa)
f=Image.open(BRAND/'waps-full.png').convert('RGB'); f.thumbnail((1100,280),Image.Resampling.LANCZOS)
qa.paste(f,((1200-f.width)//2,18))
x=38; y=330
for n in (512,192,96,48,32,16):
    im=Image.open(ROOT/f'icon-{n}.png').convert('RGB')
    preview=im.resize((160,160),Image.Resampling.NEAREST if n<=48 else Image.Resampling.LANCZOS)
    qa.paste(preview,(x,y)); d.text((x,y+166),f'{n}px',fill='black'); x+=185
for idx,n in enumerate((192,512)):
    im=Image.open(ROOT/f'maskable-{n}.png').convert('RGB').resize((180,180),Image.Resampling.LANCZOS)
    circ=Image.new('RGB',(180,180),(230,230,230)); m=Image.new('L',(180,180),0); ImageDraw.Draw(m).ellipse((0,0,179,179),fill=255)
    circ.paste(im,(0,0),m); qa.paste(circ,(38+idx*220,560)); d.text((38+idx*220,745),f'maskable {n} circle',fill='black')
qa.save(BRAND/'icon-qa-board.jpg',quality=90,optimize=True)

# Hard validation.
for n in sizes:
    im=Image.open(ROOT/f'icon-{n}.png')
    assert im.size==(n,n), (n,im.size)
for n in (192,512):
    im=Image.open(ROOT/f'maskable-{n}.png')
    assert im.size==(n,n)
assert Image.open(ROOT/'apple-touch-icon.png').size==(180,180)
print('Generated official WAPS brand assets from',SRC)
print('mark box',mark_box,'full box',full_box,'bands',bands)
