'use strict';
const $=id=>document.getElementById(id);
const playbackClock=new PlaybackClock();
let p={...ML.defaults}, y, t, samples, running=true, last, fixedPoints=[];
const controls=[['I','Applied current','µA/cm²',0,200,.1],['gCa','Calcium conductance','mS/cm²',1,8,.1],['gK','Potassium conductance','mS/cm²',1,16,.1],['gL','Leak conductance','mS/cm²',.5,5,.1],['phi','Potassium rate φ','ms⁻¹',.01,.1,.001],['v3','Potassium half activation V₃','mV',-10,20,.1],['v4','Potassium slope V₄','mV',10,40,.1]];
for(const [key,label,unit,min,max,step] of controls){
  const row=document.createElement('div');
  row.innerHTML=`<label class="slider-label" for="${key}"><span>${label}</span><output id="${key}Value"></output></label><input type="range" id="${key}" min="${min}" max="${max}" step="${step}"><small>${unit}</small>`;
  $('sliders').append(row);
  $(key).addEventListener('input',()=>{p[key]=Number($(key).value);$('regimeNote').textContent='Custom parameters. The selected example describes the starting set; edits can change its excitability class.';sync();restart();});
}
function sync(){fixedPoints=ML.equilibria(p);for(const [key] of controls){$(key).value=p[key];$(key+'Value').textContent=String(p[key]);}}
function restart(initial=[-60,ML.winf(-60,p)]){playbackClock.reset();y=initial;t=0;samples=[[t,...y]];last=undefined;$('status').textContent=running?'Running. Parameter changes restart the trajectory.':'Paused. Choose an initial condition or press Run.';draw();}
function axes(id,xmin,xmax,ymin,ymax,xlabel,ylabel){
 const canvas=$(id),dpr=window.devicePixelRatio||1,rect=canvas.getBoundingClientRect();canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);
 const c=canvas.getContext('2d');c.scale(dpr,dpr);const W=rect.width,H=rect.height,L=52,R=W-17,T=15,B=H-35;
 const X=x=>L+(x-xmin)/(xmax-xmin)*(R-L),Y=y=>B-(y-ymin)/(ymax-ymin)*(B-T);
 c.font='11px system-ui';c.lineWidth=1;
 for(let i=0;i<=4;i++){let a=xmin+(xmax-xmin)*i/4,b=ymin+(ymax-ymin)*i/4;c.strokeStyle='#e8e2d7';c.beginPath();c.moveTo(X(a),T);c.lineTo(X(a),B);c.moveTo(L,Y(b));c.lineTo(R,Y(b));c.stroke();c.fillStyle='#6b6e76';c.textAlign='center';c.fillText(a.toFixed(0),X(a),B+16);c.textAlign='right';c.fillText(Number(b.toFixed(2)),L-6,Y(b)+4);}
 c.textAlign='center';c.fillText(xlabel,(L+R)/2,H-3);c.textAlign='left';c.fillText(ylabel,5,10);
 c.save();c.beginPath();c.rect(L,T,R-L,B-T);c.clip();
 return {c,X,Y,L,R,T,B,finish:()=>c.restore()};
}
function line(a,points,color,width=2){const {c,X,Y}=a;c.strokeStyle=color;c.lineWidth=width;c.beginPath();let connected=false;for(const [x,y] of points){if(!Number.isFinite(y)){connected=false;continue;}if(connected)c.lineTo(X(x),Y(y));else c.moveTo(X(x),Y(y));connected=true;}c.stroke();}
function draw(){
 const duration=Number($('window').value),end=Math.max(duration,t),start=end-duration;
 for(const [id,index,min,max,label] of [['voltage',1,-80,60,'V'],['gate',2,0,1,'w']]){const a=axes(id,start,end,min,max,'Time (ms)',label);line(a,samples.map(s=>[s[0],s[index]]),'#2557c7');a.finish();}
 const zoom=$('phaseView').value==='onset',vmin=zoom?-65:-80,vmax=zoom?5:60,wmin=zoom?0:-.2,wmax=zoom?.15:1.2;
 const a=axes('phase',vmin,vmax,wmin,wmax,'V (mV)','w');
 if($('field').checked){for(let v=vmin+5;v<vmax;v+=(vmax-vmin)/14)for(let w=wmin+(wmax-wmin)/20;w<wmax;w+=(wmax-wmin)/10){const [dv,dw]=ML.rhs([v,w],p);let dx=dv*(a.R-a.L)/(vmax-vmin),dy=-dw*(a.B-a.T)/(wmax-wmin),n=Math.hypot(dx,dy);if(n<1e-9)continue;dx=dx/n*7;dy=dy/n*7;const x=a.X(v),z=a.Y(w),c=a.c;c.strokeStyle='#b7b1a6';c.lineWidth=1;c.beginPath();c.moveTo(x-dx/2,z-dy/2);c.lineTo(x+dx/2,z+dy/2);c.lineTo(x+dx/2-.4*dx+.4*dy,z+dy/2-.4*dy-.4*dx);c.moveTo(x+dx/2,z+dy/2);c.lineTo(x+dx/2-.4*dx-.4*dy,z+dy/2-.4*dy+.4*dx);c.stroke();}}
 const vs=Array.from({length:701},(_,i)=>vmin+i*(vmax-vmin)/700);
 if($('nullclines').checked)line(a,vs.map(v=>[v,ML.vnull(v,p)]),'#d33838',2.5);
 if($('wnullcline').checked)line(a,vs.map(v=>[v,ML.winf(v,p)]),'#1f7a4d',2.5);
 if($('equilibria').checked)for(const r of fixedPoints){const c=a.c,x=a.X(r.v),z=a.Y(r.w);c.beginPath();if(r.kind==='saddle'){c.moveTo(x,z-6);c.lineTo(x+6,z);c.lineTo(x,z+6);c.lineTo(x-6,z);c.closePath();}else c.arc(x,z,5,0,2*Math.PI);c.fillStyle=r.kind==='unstable'?'#fffdf8':'#202328';c.fill();c.strokeStyle='#202328';c.lineWidth=1.5;c.stroke();}
 const tailMs=Number($('tail').value);
 const tail=tailMs>0?samples.filter(s=>s[0]>=t-tailMs).map(s=>[s[1],s[2]]):[];
 if(tailMs>0)tail.push([...y]);
 line(a,tail,'#2557c7',2.5);a.c.beginPath();a.c.arc(a.X(y[0]),a.Y(y[1]),4,0,2*Math.PI);a.c.fillStyle='#2557c7';a.c.fill();a.c.strokeStyle='#fffdf8';a.c.lineWidth=1;a.c.stroke();a.finish();$('clock').textContent=`${t.toFixed(0)} ms`;
}
$('phase').addEventListener('pointerdown',e=>{const r=$('phase').getBoundingClientRect(),zoom=$('phaseView').value==='onset',lo=zoom?-65:-80,hi=zoom?5:60,bottom=zoom?0:-.2,top=zoom?.15:1.2,v=lo+(e.clientX-r.left-52)/(r.width-69)*(hi-lo),w=top-(top-bottom)*(e.clientY-r.top-15)/(r.height-50);if(v>=lo&&v<=hi&&w>=0&&w<=Math.min(1,top))restart([v,w]);});
$('play').onclick=()=>{running=!running;$('play').textContent=running?'Pause':'Run';last=undefined;playbackClock.reset();$('status').textContent=running?'Running.':'Paused. Click the phase plane to choose an initial condition.';};
$('restart').onclick=()=>restart();
$('kick').onclick=()=>{y=[y[0]+15,y[1]];samples.push([t,...y]);draw();$('status').textContent='Voltage increased by 15 mV; w is unchanged.';};
function applyPreset(){
 const key=$('preset').value;p={...ML.presets[key]};
 const type1=key.startsWith('type1');
 $('window').value=type1?'2000':'500';
 $('nullclines').checked=$('wnullcline').checked=$('equilibria').checked=true;
 $('regimeNote').textContent=type1?'Type I (SNIC): frequency approaches zero at onset near I ≈ 39.96 µA/cm². Compare I = 40, 40.1, 41, and 45 µA/cm². A slow passage through the phase-plane bottleneck sets the long period.':'Type II (Hopf regime): onset has finite frequency. Compare I = 88 and 90 µA/cm² from the default initial state. Near onset, rest and firing can coexist, so initial conditions matter.';
 sync();restart();
}
$('preset').onchange=applyPreset;
$('reset').onclick=()=>{$('preset').value='spike';$('speed').value='1';$('phaseView').value='full';$('field').checked=true;setTail(100);applyPreset();};
for(const id of ['nullclines','wnullcline','equilibria','field','phaseView','window'])$(id).onchange=draw;
function setTail(value){const n=Number(value);if(!Number.isFinite(n))return;const ms=Math.max(0,Math.min(2000,Math.round(n)));$('tail').value=$('tailMs').value=String(ms);$('tailValue').textContent=`${ms} ms`;draw();}
$('tail').oninput=()=>setTail($('tail').value);
$('tailMs').oninput=()=>{if($('tailMs').value!==''&&$('tailMs').validity.valid)setTail($('tailMs').value);};
$('tailMs').onchange=()=>setTail($('tailMs').value);
$('export').onclick=()=>{const blob=new Blob(['time_ms,V_mV,w,I_uA_per_cm2\n'+samples.filter(s=>s[0]>=t-Number($('window').value)).map(s=>[...s,p.I].join(',')).join('\n')],{type:'text/csv'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='morris-lecar.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
window.addEventListener('resize',draw);
function frame(now){if(running){const elapsed=last===undefined?0:Math.min(now-last,80);const steps=playbackClock.steps(elapsed,Number($('speed').value));for(let i=0;i<steps;i++){y=ML.step(y,p);t+=.05;if(!y.every(Number.isFinite)||Math.abs(y[0])>500||y[1]<0||y[1]>1){running=false;$('play').textContent='Run';$('status').textContent='Integration stopped: restart the trajectory.';break;}if(i%4===0)samples.push([t,...y]);}samples=samples.filter(s=>s[0]>=t-10000);draw();}last=now;requestAnimationFrame(frame);}
applyPreset();requestAnimationFrame(frame);
if('serviceWorker' in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
