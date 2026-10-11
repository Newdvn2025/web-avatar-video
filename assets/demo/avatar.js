const stage=document.querySelector('.avatar-stage'),canvas=document.querySelector('#avatar-canvas');
const context=canvas.getContext('2d');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const scenes=[...document.querySelectorAll('.story-scene')];
canvas.width=834;canvas.height=1112;
let dirty=true,hidden=false,active=0,currentPhase=0,targetPhase=0,neutral=true,actionCurrent=0,actionTarget=0;
function loadSequence(folder,count,extension="png"){return Array.from({length:count},(_,i)=>{const image=new Image();image.onload=()=>dirty=true;image.src=`./assets/character/${folder}/frame-${String(i+1).padStart(3,'0')}.${extension}`;return image;});}
const sequences=[loadSequence("orbit",145,"webp"),null,null,null];
function ensureSequence(index){if(!sequences[index])sequences[index]=loadSequence(`action-${index}`,73,"webp");}
function orbitFrame(){const keys=[15,28,42,53,64,76,86,100,109];const p=((currentPhase%96+96)%96)/12;const k=Math.floor(p);return Math.round(keys[k]+(keys[k+1]-keys[k])*(p-k));}
function draw(){const sequence=sequences[active];const index=active===0?(neutral?0:orbitFrame()):Math.round(actionCurrent);let image=sequence?.[index];if(!image?.naturalWidth)image=sequence?.find(frame=>frame.naturalWidth);if(image){context.clearRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);}}
window.addEventListener('pointermove',event=>{if(reduced||event.pointerType==='touch')return;const dx=event.clientX/innerWidth*2-1,dy=event.clientY/innerHeight*2-1;const wasNeutral=neutral;neutral=Math.hypot(dx,dy)<.16;targetPhase=((Math.atan2(dy,dx)-Math.PI+Math.PI*2)%(Math.PI*2))/(Math.PI*2)*96;if(wasNeutral&&!neutral)currentPhase=targetPhase;dirty=true;},{passive:true});
document.documentElement.addEventListener('pointerleave',()=>{neutral=true;dirty=true;});
function scrollUpdate(){let closest=Infinity,next=0;scenes.forEach((section,i)=>{const r=section.getBoundingClientRect(),distance=Math.abs(r.top+r.height/2-innerHeight/2);if(distance<closest){closest=distance;next=i;}});
 if(next!==active){active=next;ensureSequence(active);actionCurrent=0;dirty=true;}
 const r=scenes[active].getBoundingClientRect();
 // Play the gesture as its chapter passes through the viewport; reverse with scrolling.
 actionTarget=reduced?0:Math.max(0,Math.min(1,(innerHeight*.5-r.top)/(r.height*.9)))*72;
 document.querySelector('.about-story').dataset.active=active;stage.dataset.pose=active;
 document.querySelectorAll('.story-progress a').forEach((a,i)=>a.classList.toggle('active',i===active));
 document.querySelector('.avatar-hint').textContent=active===0?(matchMedia('(pointer:coarse)').matches?'向下滑动，继续认识我 ↓':'上下左右移动鼠标，人物跟着你转头 ↓'):'上下滚动，控制人物动作 ↓';
 if(active<3)ensureSequence(active+1);
}
window.addEventListener('scroll',scrollUpdate,{passive:true});window.addEventListener('resize',scrollUpdate);scrollUpdate();
document.addEventListener('visibilitychange',()=>hidden=document.hidden);
function loop(){requestAnimationFrame(loop);if(hidden)return;let delta=active===0?((targetPhase-currentPhase+144)%96+96)%96-48:actionTarget-actionCurrent;if(Math.abs(delta)>.05){if(active===0)currentPhase=(currentPhase+delta*.16+96)%96;else actionCurrent+=delta*.14;dirty=true;}if(dirty){draw();dirty=false;}}
loop();

const stars=document.querySelector('.stars');if(stars){for(let i=0;i<36;i++){const dot=document.createElement('i');dot.style.left=`${(i*37.7)%100}%`;dot.style.top=`${(i*23.3)%100}%`;dot.style.animationDelay=`-${i*.7}s`;stars.append(dot);}}
