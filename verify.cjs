const assert=require('node:assert/strict');
const M=require('./model.js');
function run(p,h=.05,duration=1000){let y=[-60,M.winf(-60,p)],spikes=0,lo=Infinity,hi=-Infinity;for(let i=0;i<duration/h;i++){const old=y;y=M.step(y,p,h);assert(y.every(Number.isFinite));assert(y[1]>=0&&y[1]<=1);if(i*h>500){lo=Math.min(lo,y[0]);hi=Math.max(hi,y[0]);if(old[0]<0&&y[0]>=0)spikes++;}}return {y,spikes,lo,hi};}
const rest=run({...M.defaults,I:0});assert(rest.hi-rest.lo<.001);assert(Math.abs(M.rhs(rest.y,{...M.defaults,I:0})[0])<1e-8);
const firing=run(M.defaults);assert(firing.spikes>=3);assert(firing.hi-firing.lo>60);
for(const I of [0,200])for(const gCa of [1,8])for(const gK of [1,16])for(const gL of [.5,5])for(const phi of [.01,.1])run({...M.defaults,I,gCa,gK,gL,phi},.05,600);
const a=run(M.defaults,.05,300).y,b=run(M.defaults,.025,300).y;assert(Math.abs(a[0]-b[0])<.01);assert(Math.abs(a[1]-b[1])<.0001);
console.log('PASS: rest, firing, 32 slider corners, and timestep convergence.',{rest:rest.y,firingSpikes:firing.spikes,voltageDifference:Math.abs(a[0]-b[0])});
function frequency(p){let y=[-60,M.winf(-60,p)],times=[];for(let i=0;i<160000;i++){const old=y;y=M.step(y,p);if(i*.05>2000&&old[0]<0&&y[0]>=0)times.push(i*.05);}return times.length>1?1000*(times.length-1)/(times.at(-1)-times[0]):0;}
const f1=frequency(M.presets.type1onset),f1fast=frequency(M.presets.type1firing),f2=frequency(M.presets.spike);
assert.equal(frequency(M.presets.type1rest),0);assert.equal(frequency(M.presets.type2rest),0);
assert(f1>0&&f1<2);assert(f1fast>8);assert(f2>8);assert(f2>5*f1);
assert(M.equilibria(M.presets.type1rest).some(r=>r.kind==='saddle'));
assert(M.equilibria(M.presets.type1rest).some(r=>r.kind==='stable'));
for(const p of Object.values(M.presets)){
  for(const r of M.equilibria(p)){const d=M.rhs([r.v,r.w],p);assert(Math.abs(d[0])<1e-8);assert(Math.abs(d[1])<1e-8);}
  for(const v of [-60,-40,-20,0,20])assert(Math.abs(M.rhs([v,M.vnull(v,p)],p)[0])<1e-10);
}
console.log('PASS: nullcline residuals, equilibrium classification, and finite onset comparison (2 s transient + 6 s observation).', {type1nearHz:f1,type1higherHz:f1fast,type2nearHz:f2});
const PlaybackClock=require('./timing.js');
for(const speed of [.001,.002,.005,.01,.02,.05,.1,.25,.5,1,2,3,5,10]){
  const clock=new PlaybackClock();let steps=0;
  for(let frame=0;frame<600;frame++)steps+=clock.steps(1000/60,speed);
  assert(Math.abs(steps*.05-10000*speed)<.050001);
  clock.reset();assert.equal(clock.steps(0,speed),0);
}
console.log('PASS: all 14 playback speeds preserve elapsed model time, including 0.001×.');
