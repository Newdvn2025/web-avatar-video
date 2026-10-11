#!/usr/bin/env python3
"""macOS 14+ / ffmpeg / Swift / Pillow. Extract, matte and encode a video sequence."""
import argparse,json,subprocess,tempfile,shutil
from pathlib import Path
from PIL import Image
p=argparse.ArgumentParser();p.add_argument('video',type=Path);p.add_argument('output',type=Path);p.add_argument('--fps',type=int,default=12);a=p.parse_args()
if not a.video.is_file():p.error('Video does not exist')
if not 1<=a.fps<=30:p.error('fps must be 1..30')
if a.output.exists() and any(a.output.iterdir()):p.error('Output must be empty; preserve existing assets')
for tool in ['ffmpeg','ffprobe','swift']:
 if not shutil.which(tool):p.error(f'Missing {tool}')
a.output.mkdir(parents=True,exist_ok=True)
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height,duration','-of','json',str(a.video)]))['streams'][0]
with tempfile.TemporaryDirectory(prefix='avatar-frames-') as td:
 src=Path(td)/'source';matte=Path(td)/'matte';src.mkdir();matte.mkdir()
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-i',str(a.video),'-an','-vf',f'fps={a.fps}',str(src/'frame-%03d.png')],check=True)
 subprocess.run(['swift',str(Path(__file__).with_name('matte_video.swift')),str(src),str(matte)],check=True)
 originals=list(src.glob('*.png'));files=sorted(matte.glob('*.png'))
 if not files or len(files)!=len(originals):raise RuntimeError('Segmentation failed for one or more frames')
 for f in files:
  im=Image.open(f).convert('RGBA')
  if im.getextrema()[3][0]!=0:raise RuntimeError(f'No transparency: {f.name}')
  im.save(a.output/f.with_suffix('.webp').name,quality=92,method=4)
manifest={'source':a.video.name,'fps':a.fps,'count':len(files),'width':probe['width'],'height':probe['height'],'pattern':'frame-%03d.webp','directionKeys':None}
(a.output/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print(f'Created {len(files)} transparent frames; calibrate directionKeys by inspecting the video.')
