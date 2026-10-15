'use strict';
const $=id=>document.getElementById(id);
const playbackClock=new PlaybackClock();
let p={...ML.defaults}, y, t, samples, running=true, last, fixedPoints=[],manifoldBranches=[];
const controls=[['I','Applied current','µA/cm²',0,400,.1],['gCa','Calcium conductance','mS/cm²',1,8,.1],['gK','Potassium conductance','mS/cm²',1,16,.1],['gL','Leak conductance','mS/cm²',.5,5,.1],['phi','Potassium rate φ','ms⁻¹',.01,.1,.001],['v3','Potassium half activation V₃','mV',-10,20,.1],['v4','Potassium slope V₄','mV',10,40,.1]];
for(const [key,label,unit,min,max,step] of controls){
  const row=document.createElement('div');
  row.innerHTML=`<label class="slider-label" for="${key}"><span>${label}</span><output id="${key}Value"></output></label><input type="range" id="${key}" min="${min}" max="${max}" step="${step}"><small>${unit}</small>`;
  $('sliders').append(row);
  $(key).addEventListener('input',()=>{
    const value=Number($(key).value);
    if(key==='I'&&value!==p.I){samples.push([t,...y,p.I],[t,...y,value]);}
    p[key]=value;
    $('regimeNote').textContent='Custom parameters. The selected example describes the starting set; edits can change its excitability class.';
    sync();
    if(key==='I'){$('status').textContent=`Applied current changed to ${p.I} µA/cm² at ${t.toFixed(1)} ms. State and history preserved.`;draw();}
    else restart();
  });
}
function sync(){fixedPoints=ML.equilibria(p);updateManifolds();for(const [key] of controls){$(key).value=p[key];$(key+'Value').textContent=String(p[key]);}}
function updateManifolds(){
 const saddles=fixedPoints.filter(r=>r.kind==='saddle').length;
 const relevant=$('preset').value.startsWith('type1')&&saddles>0;
 $('manifoldControls').hidden=!relevant;
 const enabled=relevant&&($('stableManifold').checked||$('unstableManifold').checked);
 manifoldBranches=enabled?ML.saddleManifolds(p,fixedPoints):[];
 $('manifoldNote').textContent=saddles?`${saddles} saddle detected. Stable (purple): approaches saddle forward in time. Unstable (orange): leaves saddle forward in time. Numerical branches traced for up to 2,000 ms; clipped to the view.`:'No saddle detected for these parameters in V = −80 to 60 mV. Try Type I below onset at I = 39 µA/cm².';
 $('stableLegend').hidden=!relevant||!$('stableManifold').checked;
 $('unstableLegend').hidden=!relevant||!$('unstableManifold').checked;
}
function restart(initial=[-60,ML.winf(-60,p)]){playbackClock.reset();y=initial;t=0;samples=[[t,...y,p.I]];last=undefined;$('status').textContent=running?'Running. Applied-current changes continue; other model parameter changes restart.':'Paused. Choose an initial condition or press Run.';draw();}
function axes(id,xmin,xmax,ymin,ymax,xlabel,ylabel){
 const canvas=$(id),dpr=window.devicePixelRatio||1,rect=canvas.getBoundingClientRect();canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);
 const c=canvas.getContext('2d');c.scale(dpr,dpr);const W=rect.width,H=rect.height,L=52,R=W-17,T=15,B=H-35;
 const X=x=>L+(x-xmin)/(xmax-xmin)*(R-L),Y=y=>B-(y-ymin)/(ymax-ymin)*(B-T);
 c.font='11px system-ui';c.lineWidth=1;
 for(let i=0;i<=4;i++){let a=xmin+(xmax-xmin)*i/4,b=ymin+(ymax-ymin)*i/4;c.strokeStyle='#e8e2d7';c.beginPath();c.moveTo(X(a),T);c.lineTo(X(a),B);c.moveTo(L,Y(b));c.lineTo(R,Y(b));c.stroke();c.fillStyle='#6b6e76';c.textAlign=i===0?'left':i===4?'right':'center';c.fillText(a.toFixed(0),X(a),B+16);c.textAlign='right';c.fillText(Number(b.toFixed(2)),L-6,Y(b)+4);}
 c.textAlign='center';c.fillText(xlabel,(L+R)/2,H-3);c.textAlign='left';c.fillText(ylabel,5,10);
 c.save();c.beginPath();c.rect(L,T,R-L,B-T);c.clip();
 return {c,X,Y,L,R,T,B,finish:()=>c.restore()};
}
function line(a,points,color,width=2){const {c,X,Y}=a;c.strokeStyle=color;c.lineWidth=width;c.beginPath();let connected=false;for(const [x,y] of points){if(!Number.isFinite(y)){connected=false;continue;}if(connected)c.lineTo(X(x),Y(y));else c.moveTo(X(x),Y(y));connected=true;}c.stroke();}
function draw(){
 const duration=Number($('window').value),end=Math.max(duration,t),start=end-duration;
 for(const [id,index,min,max,label] of [['voltage',1,-80,60,'V'],['gate',2,0,1,'w']]){const a=axes(id,start,end,min,max,'Time (ms)',label);line(a,samples.map(s=>[s[0],s[index]]),'#2557c7');a.finish();}
 const currentAxes=axes('current',start,end,0,400,'Time (ms)','I');
 const currentPoints=[];
 for(let i=0;i<samples.length;i++){
   const s=samples[i];
   if(i>0)currentPoints.push([s[0],samples[i-1][3]]);
   currentPoints.push([s[0],s[3]]);
 }
 currentPoints.push([t,p.I]);line(currentAxes,currentPoints,'#9a671d');currentAxes.finish();
 const zoom=$('phaseView').value==='onset',vmin=zoom?-65:-80,vmax=zoom?5:60,wmin=zoom?0:-.2,wmax=zoom?.15:1.2;
 const a=axes('phase',vmin,vmax,wmin,wmax,'V (mV)','w');
 if($('field').checked){for(let v=vmin+5;v<vmax;v+=(vmax-vmin)/14)for(let w=wmin+(wmax-wmin)/20;w<wmax;w+=(wmax-wmin)/10){const [dv,dw]=ML.rhs([v,w],p);let dx=dv*(a.R-a.L)/(vmax-vmin),dy=-dw*(a.B-a.T)/(wmax-wmin),n=Math.hypot(dx,dy);if(n<1e-9)continue;dx=dx/n*7;dy=dy/n*7;const x=a.X(v),z=a.Y(w),c=a.c;c.strokeStyle='#b7b1a6';c.lineWidth=1;c.beginPath();c.moveTo(x-dx/2,z-dy/2);c.lineTo(x+dx/2,z+dy/2);c.lineTo(x+dx/2-.4*dx+.4*dy,z+dy/2-.4*dy-.4*dx);c.moveTo(x+dx/2,z+dy/2);c.lineTo(x+dx/2-.4*dx-.4*dy,z+dy/2-.4*dy+.4*dx);c.stroke();}}
 const vs=Array.from({length:701},(_,i)=>vmin+i*(vmax-vmin)/700);
 if($('nullclines').checked)line(a,vs.map(v=>[v,ML.vnull(v,p)]),'#d33838',2.5);
 if($('wnullcline').checked)line(a,vs.map(v=>[v,ML.winf(v,p)]),'#1f7a4d',2.5);
 for(const branch of manifoldBranches){if(!$(branch.kind==='stable'?'stableManifold':'unstableManifold').checked)continue;a.c.setLineDash(branch.kind==='stable'?[7,4]:[3,3]);line(a,branch.points,branch.kind==='stable'?'#8051ad':'#c4730e',2);a.c.setLineDash([]);}
 const tailMs=Number($('tail').value);
 const tail=tailMs>0?samples.filter(s=>s[0]>=t-tailMs).map(s=>[s[1],s[2]]):[];
 if(tailMs>0)tail.push([...y]);
 line(a,tail,'#2557c7',2.5);a.c.beginPath();a.c.arc(a.X(y[0]),a.Y(y[1]),4,0,2*Math.PI);a.c.fillStyle='#2557c7';a.c.fill();a.c.strokeStyle='#fffdf8';a.c.lineWidth=1;a.c.stroke();
 if($('equilibria').checked)for(const r of fixedPoints){const c=a.c,x=a.X(r.v),z=a.Y(r.w);c.beginPath();if(r.kind==='saddle'){c.moveTo(x,z-6);c.lineTo(x+6,z);c.lineTo(x,z+6);c.lineTo(x-6,z);c.closePath();}else c.arc(x,z,5,0,2*Math.PI);c.fillStyle=r.kind==='stable'?'#202328':'#fffdf8';c.fill();c.strokeStyle='#202328';c.lineWidth=1.5;c.stroke();}
 a.finish();$('clock').textContent=`${t.toFixed(0)} ms`;
}
$('phase').addEventListener('pointerdown',e=>{const r=$('phase').getBoundingClientRect(),zoom=$('phaseView').value==='onset',lo=zoom?-65:-80,hi=zoom?5:60,bottom=zoom?0:-.2,top=zoom?.15:1.2,v=lo+(e.clientX-r.left-52)/(r.width-69)*(hi-lo),w=top-(top-bottom)*(e.clientY-r.top-15)/(r.height-50);if(v>=lo&&v<=hi&&w>=0&&w<=Math.min(1,top))restart([v,w]);});
$('play').onclick=()=>{running=!running;$('play').textContent=running?'Pause':'Run';last=undefined;playbackClock.reset();$('status').textContent=running?'Running.':'Paused. Click the phase plane to choose an initial condition.';};
$('restart').onclick=()=>restart();
$('kick').onclick=()=>{y=[y[0]+15,y[1]];samples.push([t,...y,p.I]);draw();$('status').textContent='Voltage increased by 15 mV; w is unchanged.';};
function applyPreset(){
 const key=$('preset').value;p={...ML.presets[key]};
 const type1=key.startsWith('type1');
 $('window').value=type1?'2000':'500';
 $('nullclines').checked=$('wnullcline').checked=$('equilibria').checked=true;
 $('regimeNote').textContent=key==='type2block'?'Type II depolarization block: at I = 250 µA/cm², initial spiking dies out and the voltage settles near +10.9 mV. Compare with sustained firing at I = 100 or 200 µA/cm². Strong drive holds the model at a depolarized stable equilibrium.':type1?'Type I (SNIC): frequency approaches zero at onset near I ≈ 39.96 µA/cm². Compare I = 40, 40.1, 41, and 45 µA/cm². A slow passage through the phase-plane bottleneck sets the long period.':'Type II (Hopf regime): onset has finite frequency. Compare I = 88 and 90 µA/cm² from the default initial state. Near onset, rest and firing can coexist, so initial conditions matter.';
 sync();restart();
}
$('preset').onchange=applyPreset;
$('reset').onclick=()=>{$('preset').value='spike';$('speed').value='.01';$('phaseView').value='full';$('field').checked=true;$('stableManifold').checked=$('unstableManifold').checked=false;setTail(100);applyPreset();};
for(const id of ['nullclines','wnullcline','equilibria','field','phaseView','window'])$(id).onchange=draw;
function setTail(value){const n=Number(value);if(!Number.isFinite(n))return;const ms=Math.max(0,Math.min(500,Math.round(n)));$('tail').value=$('tailMs').value=String(ms);$('tailValue').textContent=`${ms} ms`;draw();}
for(const id of ['stableManifold','unstableManifold'])$(id).onchange=()=>{updateManifolds();draw();};
$('tail').oninput=()=>setTail($('tail').value);
$('tailMs').oninput=()=>{if($('tailMs').value!==''&&$('tailMs').validity.valid)setTail($('tailMs').value);};
$('tailMs').onchange=()=>setTail($('tailMs').value);
$('export').onclick=()=>{const blob=new Blob(['time_ms,V_mV,w,I_uA_per_cm2\n'+samples.filter(s=>s[0]>=t-Number($('window').value)).map(s=>s.join(',')).join('\n')],{type:'text/csv'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='morris-lecar.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('snapshot').onclick=()=>{
  const button=$('snapshot');button.disabled=true;
  // Draw and copy all four plots synchronously so they represent one model time.
  draw();const capturedTime=t;
  const charts=[['phase','Phase plane · V (mV), w'],['voltage','Membrane voltage · V (mV)'],['gate','Potassium activation · w'],['current','Applied current · I (µA/cm²)']];
  const width=1000,pad=24,plotWidth=width-2*pad,scale=2;
  const heights=charts.map(([id])=>plotWidth*$(id).height/$(id).width);
  const height=Math.ceil(176+heights.reduce((a,b)=>a+b,0)+charts.length*48+44);
  const canvas=document.createElement('canvas');canvas.width=width*scale;canvas.height=height*scale;
  const c=canvas.getContext('2d');c.scale(scale,scale);c.fillStyle='#f7f4ed';c.fillRect(0,0,width,height);
  c.fillStyle='#202328';c.font='bold 27px system-ui';c.fillText('Morris–Lecar Simulator',pad,40);
  c.font='15px system-ui';c.fillText(`Time: ${capturedTime.toFixed(1)} ms   ·   Trace window: ${Number($('window').value).toLocaleString()} ms   ·   Trajectory tail: ${$('tail').value} ms`,pad,68);
  c.fillText(`I = ${p.I} µA/cm²   ·   gCa = ${p.gCa}, gK = ${p.gK}, gL = ${p.gL} mS/cm²   ·   φ = ${p.phi} ms⁻¹`,pad,93);
  c.fillText(`C = ${p.C} µF/cm²   ·   ECa = ${p.ECa}, EK = ${p.EK}, EL = ${p.EL} mV`,pad,116);
  c.fillText(`V₁ = ${p.v1}, V₂ = ${p.v2}, V₃ = ${p.v3}, V₄ = ${p.v4} mV   ·   Phase layers use the current I`,pad,139);
  let top=162;
  charts.forEach(([id,title],i)=>{
    c.fillStyle='#202328';c.font='bold 18px system-ui';c.fillText(title,pad,top+22);top+=32;
    c.fillStyle='#fffdf8';c.fillRect(pad,top,plotWidth,heights[i]);c.drawImage($(id),pad,top,plotWidth,heights[i]);top+=heights[i]+16;
    if(id==='phase'){
      const legends=[['Trajectory','#2557c7',true],['V nullcline','#d33838',$('nullclines').checked],['w nullcline','#1f7a4d',$('wnullcline').checked],['Stable manifold','#8051ad',!$('stableLegend').hidden],['Unstable manifold','#c4730e',!$('unstableLegend').hidden]];
      let left=pad;c.font='14px system-ui';
      for(const [label,color,visible] of legends){if(!visible)continue;c.fillStyle=color;c.fillText('━ '+label,left,top+3);left+=c.measureText('━ '+label).width+20;}
      top+=28;
    }
  });
  canvas.toBlob(blob=>{
    button.disabled=false;
    if(!blob){$('status').textContent='PNG could not be created. Please try again.';return;}
    const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`morris-lecar-${capturedTime.toFixed(1)}ms.png`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    $('status').textContent=`PNG snapshot downloaded for t = ${capturedTime.toFixed(1)} ms.`;
  },'image/png');
};
window.addEventListener('resize',draw);
function frame(now){if(running){const elapsed=last===undefined?0:Math.min(now-last,80);const steps=playbackClock.steps(elapsed,Number($('speed').value));for(let i=0;i<steps;i++){y=ML.step(y,p);t+=.05;if(!y.every(Number.isFinite)||Math.abs(y[0])>500||y[1]<0||y[1]>1){running=false;$('play').textContent='Run';$('status').textContent='Integration stopped: restart the trajectory.';break;}if(i%4===0)samples.push([t,...y,p.I]);}samples=samples.filter(s=>s[0]>=t-10000);draw();}last=now;requestAnimationFrame(frame);}
applyPreset();requestAnimationFrame(frame);
if('serviceWorker' in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
