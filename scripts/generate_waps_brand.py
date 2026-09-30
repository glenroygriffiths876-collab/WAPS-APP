from pathlib import Path
from PIL import Image, ImageDraw
import cairosvg

ROOT=Path(__file__).resolve().parents[1]
BRAND=ROOT/'assets/brand'
BRAND.mkdir(parents=True,exist_ok=True)
ICON=BRAND/'waps-icon.svg'
MASK=BRAND/'waps-maskable.svg'
FULL=BRAND/'waps-full.svg'
MARK=BRAND/'waps-mark.svg'
for p in (ICON,MASK,FULL,MARK):
    if not p.exists():
        raise RuntimeError(f'Missing official WAPS brand asset: {p}')

sizes=(16,32,48,72,96,128,144,152,180,192,384,512)
for n in sizes:
    cairosvg.svg2png(url=str(ICON),write_to=str(ROOT/f'icon-{n}.png'),output_width=n,output_height=n)
cairosvg.svg2png(url=str(MASK),write_to=str(ROOT/'maskable-192.png'),output_width=192,output_height=192)
cairosvg.svg2png(url=str(MASK),write_to=str(ROOT/'maskable-512.png'),output_width=512,output_height=512)
cairosvg.svg2png(url=str(ICON),write_to=str(ROOT/'apple-touch-icon.png'),output_width=180,output_height=180)

# Keep SVG masters in sync with the official square compositions.
(ROOT/'icon.svg').write_text(ICON.read_text(encoding='utf-8'),encoding='utf-8')
(ROOT/'icon-master.svg').write_text(ICON.read_text(encoding='utf-8'),encoding='utf-8')
(ROOT/'maskable-master.svg').write_text(MASK.read_text(encoding='utf-8'),encoding='utf-8')

# Visual QA board: full logo, progressively smaller normal icons and circular
# previews of both maskable outputs.
qa=Image.new('RGB',(1200,820),'white'); d=ImageDraw.Draw(qa)
full_png=BRAND/'_qa_full.png'
cairosvg.svg2png(url=str(FULL),write_to=str(full_png),output_width=1000)
f=Image.open(full_png).convert('RGB'); f.thumbnail((1100,280),Image.Resampling.LANCZOS)
qa.paste(f,((1200-f.width)//2,18))
x=38; y=330
for n in (512,192,96,48,32,16):
    im=Image.open(ROOT/f'icon-{n}.png').convert('RGB')
    preview=im.resize((160,160),Image.Resampling.NEAREST if n<=48 else Image.Resampling.LANCZOS)
    qa.paste(preview,(x,y)); d.text((x,y+166),f'{n}px',fill='black'); x+=185
for idx,n in enumerate((192,512)):
    im=Image.open(ROOT/f'maskable-{n}.png').convert('RGB').resize((180,180),Image.Resampling.LANCZOS)
    circ=Image.new('RGB',(180,180),(232,232,232)); m=Image.new('L',(180,180),0)
    ImageDraw.Draw(m).ellipse((0,0,179,179),fill=255); circ.paste(im,(0,0),m)
    qa.paste(circ,(38+idx*220,560)); d.text((38+idx*220,745),f'maskable {n} circle',fill='black')
qa.save(BRAND/'icon-qa-board.jpg',quality=90,optimize=True)
full_png.unlink(missing_ok=True)

# Hard size validation.
for n in sizes:
    assert Image.open(ROOT/f'icon-{n}.png').size==(n,n)
for n in (192,512):
    assert Image.open(ROOT/f'maskable-{n}.png').size==(n,n)
assert Image.open(ROOT/'apple-touch-icon.png').size==(180,180)
print('Official WAPS icon generation and crop QA passed')
