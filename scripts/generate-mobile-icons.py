"""Package the supplied Tally artwork into web and native platform assets."""
import json
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
assets = root / 'assets'
# Fixed bounds preserve the supplied artwork and remove only surrounding whitespace.
mark = Image.open(assets / 'tally loggo.jpg').convert('RGB').crop((378, 150, 646, 409))
logo = Image.open(assets / 'tally logo.jpg').convert('RGB').crop((214, 156, 818, 401))
mark.save(assets / 'tally-mark.png')
logo.save(assets / 'tally-wordmark.png')
background = '#f8f5eb'
base = Image.new('RGB', (1024, 1024), background)
mark.thumbnail((760, 760), Image.Resampling.LANCZOS)
# Resize from the source so icon dimensions are reproducible.
mark = mark.resize((760, round(760 * mark.height / mark.width)), Image.Resampling.LANCZOS)
base.paste(mark, ((1024-mark.width)//2, (1024-mark.height)//2))
base.save(root / 'mobile/resources/icon-1024.png')
base.resize((64, 64), Image.Resampling.LANCZOS).save(assets / 'favicon.png')
android = root / 'mobile/android/app/src/main/res'
for density, size in [('mdpi',48),('hdpi',72),('xhdpi',96),('xxhdpi',144),('xxxhdpi',192)]:
    folder = android / f'mipmap-{density}'
    folder.mkdir(parents=True, exist_ok=True)
    for name in ['ic_launcher.png', 'ic_launcher_round.png']:
        base.resize((size,size), Image.Resampling.LANCZOS).save(folder/name)
    # Keep the artwork within the adaptive icon's central safe area.
    dimension = round(size * 2.25)
    foreground = Image.new('RGB', (dimension, dimension), background)
    inner = base.resize((round(dimension*.72),)*2, Image.Resampling.LANCZOS)
    foreground.paste(inner, ((dimension-inner.width)//2, (dimension-inner.height)//2))
    foreground.save(folder/'ic_launcher_foreground.png')
ios = root / 'mobile/ios/App/App/Assets.xcassets/AppIcon.appiconset'
base.save(ios/'AppIcon-1024.png')
(ios/'Contents.json').write_text(json.dumps({'images':[{'filename':'AppIcon-1024.png','idiom':'universal','platform':'ios','size':'1024x1024'}],'info':{'author':'xcode','version':1}},indent=2))
for path in list((root/'mobile/ios/App/App/Assets.xcassets/Splash.imageset').glob('*.png')) + list(android.glob('drawable*/splash.png')):
    with Image.open(path) as previous:
        width, height = previous.size
    splash = Image.new('RGB', (width,height), background)
    size = max(48, round(min(width,height)*.18))
    badge = base.resize((size,size), Image.Resampling.LANCZOS)
    splash.paste(badge, ((width-size)//2,(height-size)//2))
    splash.save(path)
print('Packaged supplied Tally logos for web, Android, and iOS.')
