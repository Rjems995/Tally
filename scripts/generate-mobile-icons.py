"""Render the existing Tally receipt mark at the native platform icon sizes."""
import json
from pathlib import Path
from PIL import Image, ImageDraw

root=Path(__file__).resolve().parents[1]
base=Image.new('RGB',(1024,1024),'#267553')
draw=ImageDraw.Draw(base)
outline=[(328,267),(374,288),(420,267),(466,288),(512,267),(558,288),(604,267),(650,288),(696,267),(696,757),(650,736),(604,757),(558,736),(512,757),(466,736),(420,757),(374,736),(328,757),(328,267)]
draw.line(outline,fill='white',width=30,joint='curve')
for end,y in [(610,405),(610,489),(537,573)]:
    draw.line([(414,y),(end,y)],fill='white',width=30)
    for x in [414,end]: draw.ellipse((x-15,y-15,x+15,y+15),fill='white')
base.save(root/'mobile/resources/icon-1024.png')
android=root/'mobile/android/app/src/main/res'
for density,size in [('mdpi',48),('hdpi',72),('xhdpi',96),('xxhdpi',144),('xxxhdpi',192)]:
    folder=android/f'mipmap-{density}';folder.mkdir(parents=True,exist_ok=True)
    for name in ['ic_launcher.png','ic_launcher_round.png']:
        base.resize((size,size),Image.Resampling.LANCZOS).save(folder/name)
    foreground=base.convert('RGBA').resize((int(size*2.25),int(size*2.25)),Image.Resampling.LANCZOS)
    foreground.save(folder/'ic_launcher_foreground.png')
ios=root/'mobile/ios/App/App/Assets.xcassets/AppIcon.appiconset'
ios.mkdir(parents=True,exist_ok=True)
base.save(ios/'AppIcon-1024.png')
(ios/'Contents.json').write_text(json.dumps({'images':[{'filename':'AppIcon-1024.png','idiom':'universal','platform':'ios','size':'1024x1024'}],'info':{'author':'xcode','version':1}},indent=2))
splash=Image.new('RGB',(2732,2732),'#f7f8fa')
mark=base.resize((400,400),Image.Resampling.LANCZOS)
splash.paste(mark,(1166,1166))
for image in (root/'mobile/ios/App/App/Assets.xcassets/Splash.imageset').glob('*.png'): splash.save(image)
print('Generated Android and iOS Tally icons.')
