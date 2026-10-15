const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=__dirname;
const elements=new Map();
const defaults={preset:'spike',window:'500',speed:'.01',phaseView:'full',tail:'100',tailMs:'100'};
function element(id){
  if(!elements.has(id))elements.set(id,{value:defaults[id]??'',checked:['nullclines','wnullcline','equilibria','field'].includes(id),hidden:false,textContent:'',handlers:{},validity:{valid:true},
    addEventListener(name,fn){this.handlers[name]=fn;},append(){},click(){},getBoundingClientRect(){return {width:1000,height:300,left:0,top:0};},
    getContext(){return new Proxy({},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});}});
  return elements.get(id);
}
let exported='';
const sandbox={console,document:{getElementById:element,createElement:()=>element(Symbol())},window:{addEventListener(){},devicePixelRatio:1},navigator:{},location:{protocol:'file:'},requestAnimationFrame(){},setTimeout(){},
  Blob:class{constructor(parts){this.content=parts.join('');}},URL:{createObjectURL(blob){exported=blob.content;return 'blob:test';},revokeObjectURL(){}}};
Object.assign(sandbox,sandbox.window);sandbox.window=sandbox;vm.createContext(sandbox);
for(const file of ['model.js','timing.js','app.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),sandbox);
const evaluate=code=>vm.runInContext(code,sandbox);
const state=()=>JSON.parse(evaluate('JSON.stringify({t,y,samples,I:p.I,running})'));
assert.equal(element('speed').value,'.01');
assert.equal(element('manifoldControls').hidden,true);
element('preset').value='type1rest';element('preset').onchange();
assert.equal(element('manifoldControls').hidden,false);
element('stableManifold').checked=true;element('stableManifold').onchange();
assert.equal(element('stableLegend').hidden,false);
element('I').value='45';element('I').handlers.input();
assert.equal(element('manifoldControls').hidden,true);assert.equal(element('stableLegend').hidden,true);
element('tailMs').value='999';element('tailMs').onchange();assert.equal(element('tail').value,'500');
element('tailMs').value='-1';element('tailMs').onchange();assert.equal(element('tail').value,'0');
element('reset').onclick();assert.equal(element('speed').value,'.01');
element('speed').value='1';
evaluate('frame(0); for(let i=1;i<=100;i++)frame(i);');
element('play').onclick();
const before=state();assert(before.t>90);assert.equal(before.running,false);
element('I').value='150';element('I').handlers.input();
const changed=state();assert.equal(changed.t,before.t);assert.deepEqual(changed.y,before.y);assert.equal(changed.running,false);assert.deepEqual(changed.samples.slice(0,before.samples.length),before.samples);
assert.deepEqual(changed.samples.at(-2),[before.t,...before.y,90]);assert.deepEqual(changed.samples.at(-1),[before.t,...before.y,150]);
element('export').onclick();const rows=exported.trim().split('\n').slice(1).map(r=>r.split(',').map(Number));assert(rows.some(r=>r[3]===90));assert(rows.some(r=>r[3]===150));assert(rows.every(r=>r.length===4));
element('play').onclick();evaluate('frame(200);frame(220);');const after=state();assert(after.t>changed.t+19);assert.notDeepEqual(after.y,changed.y);assert.equal(after.samples.at(-1)[3],150);
let expected=[...changed.y];const M=require(path.join(root,'model.js'));for(let i=0;i<400;i++)expected=M.step(expected,{...M.defaults,I:150});assert(Math.abs(after.y[0]-expected[0])<1e-9);assert(Math.abs(after.y[1]-expected[1])<1e-9);
const beforeRunning=state();element('I').value='80';element('I').handlers.input();const changedRunning=state();assert.equal(changedRunning.t,beforeRunning.t);assert.deepEqual(changedRunning.y,beforeRunning.y);assert(changedRunning.running);
element('restart').onclick();const reset=state();assert.equal(reset.t,0);assert.equal(reset.samples.length,1);assert.equal(reset.samples[0][3],80);
console.log('PASS: paused and running current changes preserve time, state, history; subsequent integration uses new current; CSV preserves historical current; explicit restart clears history.');
