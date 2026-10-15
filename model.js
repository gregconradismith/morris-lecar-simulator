/* Reduced Morris–Lecar model; m is at instantaneous equilibrium. */
(function (root) {
  'use strict';
  const defaults = { C:20, gCa:4.4, gK:8, gL:2, ECa:120, EK:-84, EL:-60,
    v1:-1.2, v2:18, v3:2, v4:30, phi:0.04, I:90 };
  const presets = {
    rest: {...defaults, I:0},
    type1rest: {...defaults, gCa:4, v3:12, v4:17.4, phi:0.067, I:39},
    type1onset: {...defaults, gCa:4, v3:12, v4:17.4, phi:0.067, I:40},
    type1firing: {...defaults, gCa:4, v3:12, v4:17.4, phi:0.067, I:45},
    type2rest: {...defaults, I:88},
    spike: {...defaults, I:90},
    fast: {...defaults, I:100},
    type2block: {...defaults, I:250}
  };
  // Bracket roots of the steady-state current balance and classify the local Jacobian.
  function equilibria(p) {
    const balance=v=>rhs([v,winf(v,p)],p)[0], roots=[];
    for(let left=-80;left<60;left+=0.1){
      let a=left,b=left+0.1;
      if(balance(a)*balance(b)>0)continue;
      for(let i=0;i<40;i++){const m=(a+b)/2;if(balance(a)*balance(m)<=0)b=m;else a=m;}
      const v=(a+b)/2,w=winf(v,p),e=1e-4;
      if(roots.some(r=>Math.abs(r.v-v)<1e-3))continue;
      const va=rhs([v+e,w],p),vb=rhs([v-e,w],p),wa=rhs([v,w+e],p),wb=rhs([v,w-e],p);
      const A=(va[0]-vb[0])/(2*e),B=(wa[0]-wb[0])/(2*e),D=(wa[1]-wb[1])/(2*e),E=(va[1]-vb[1])/(2*e);
      const tr=A+D,det=A*D-B*E;
      roots.push({v,w,kind:det<0?'saddle':tr<0?'stable':'unstable'});
    }
    return roots;
  }
  const minf = (v,p) => (1+Math.tanh((v-p.v1)/p.v2))/2;
  const winf = (v,p) => (1+Math.tanh((v-p.v3)/p.v4))/2;
  function rhs([v,w],p,I=p.I) {
    return [(I-p.gCa*minf(v,p)*(v-p.ECa)-p.gK*w*(v-p.EK)-p.gL*(v-p.EL))/p.C,
      p.phi*Math.cosh((v-p.v3)/(2*p.v4))*(winf(v,p)-w)];
  }
  function step(y,p,h=0.05,I=p.I) {
    const add=(a,b,s)=>a.map((x,i)=>x+s*b[i]);
    const a=rhs(y,p,I), b=rhs(add(y,a,h/2),p,I), c=rhs(add(y,b,h/2),p,I), d=rhs(add(y,c,h),p,I);
    return y.map((x,i)=>x+h*(a[i]+2*b[i]+2*c[i]+d[i])/6);
  }
  function vnull(v,p) { return (p.I-p.gCa*minf(v,p)*(v-p.ECa)-p.gL*(v-p.EL))/(p.gK*(v-p.EK)); }
  const api={defaults,presets,equilibria,minf,winf,rhs,step,vnull};
  if(typeof module!=='undefined') module.exports=api;
  root.ML=api;
})(typeof window==='undefined'?globalThis:window);
