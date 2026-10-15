const assert=require('node:assert/strict');
const M=require('./model.js');
function run(p,h=.05,duration=1000){let y=[-60,M.winf(-60,p)],spikes=0,lo=Infinity,hi=-Infinity;for(let i=0;i<duration/h;i++){const old=y;y=M.step(y,p,h);assert(y.every(Number.isFinite));assert(y[1]>=0&&y[1]<=1);if(i*h>500){lo=Math.min(lo,y[0]);hi=Math.max(hi,y[0]);if(old[0]<0&&y[0]>=0)spikes++;}}return {y,spikes,lo,hi};}
const rest=run({...M.defaults,I:0});assert(rest.hi-rest.lo<.001);assert(Math.abs(M.rhs(rest.y,{...M.defaults,I:0})[0])<1e-8);
const firing=run(M.defaults);assert(firing.spikes>=3);assert(firing.hi-firing.lo>60);
for(const I of [0,400])for(const gCa of [1,8])for(const gK of [1,16])for(const gL of [.5,5])for(const phi of [.01,.1])run({...M.defaults,I,gCa,gK,gL,phi},.05,600);
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

const blockParams=M.presets.type2block;
let blocked=[-60,M.winf(-60,blockParams)],blockLo=Infinity,blockHi=-Infinity;
for(let i=0;i<100000;i++){
  blocked=M.step(blocked,blockParams);
  assert(blocked.every(Number.isFinite));assert(blocked[1]>=0&&blocked[1]<=1);
  if(i>60000){blockLo=Math.min(blockLo,blocked[0]);blockHi=Math.max(blockHi,blocked[0]);}
}
assert(blockHi-blockLo<1e-6);assert(blocked[0]>10&&blocked[0]<12);
assert(M.rhs(blocked,blockParams).every(x=>Math.abs(x)<1e-8));
assert(M.equilibria(blockParams).some(r=>r.kind==='stable'&&Math.abs(r.v-blocked[0])<1e-6));
console.log('PASS: Type II depolarization block settles at a stable depolarized equilibrium.',blocked);

const saddleParams=M.presets.type1rest,saddle=M.equilibria(saddleParams).find(r=>r.kind==='saddle');
const manifolds=M.saddleManifolds(saddleParams);
assert.equal(manifolds.length,4);assert.equal(M.saddleManifolds(M.presets.spike).length,0);
assert.equal(M.saddleManifolds(M.presets.type1onset).length,0);
const distance=y=>Math.hypot((y[0]-saddle.v)/140,(y[1]-saddle.w)/1.4);
for(const b of manifolds){
  assert.equal(b.kind==='stable',b.lambda<0);
  let y=b.points[1],initialDistance=distance(y);
  for(let i=0;i<200;i++)y=M.step(y,saddleParams);
  if(b.kind==='stable')assert(distance(y)<.5*initialDistance);
  else assert(distance(y)>1.4*initialDistance);
  for(const point of b.points)assert(point.every(Number.isFinite));
}
function section(points,v){for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];if((a[0]-v)*(b[0]-v)<=0&&a[0]!==b[0])return a[1]+(b[1]-a[1])*(v-a[0])/(b[0]-a[0]);}throw new Error('Manifold did not reach section');}
const refined=M.saddleManifolds(saddleParams,undefined,{dt:.025});
for(let i=0;i<4;i++){const v=saddle.v+Math.sign(manifolds[i].points[1][0]-saddle.v);assert(Math.abs(section(manifolds[i].points,v)-section(refined[i].points,v))<1e-5);}
console.log('PASS: both saddle branches, forward-time attraction/repulsion, no-saddle cases, and manifold section convergence.');
