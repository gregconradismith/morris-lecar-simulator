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
      const v=(a+b)/2,w=winf(v,p);
      if(roots.some(r=>Math.abs(r.v-v)<1e-3))continue;
      const [[A,B],[E,D]]=jacobian([v,w],p);
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
  function jacobian([v,w],p) {
    const e=1e-4,va=rhs([v+e,w],p),vb=rhs([v-e,w],p),wa=rhs([v,w+e],p),wb=rhs([v,w-e],p);
    return [[(va[0]-vb[0])/(2*e),(wa[0]-wb[0])/(2*e)],
      [(va[1]-vb[1])/(2*e),(wa[1]-wb[1])/(2*e)]];
  }
  // Stable branches are traced backward; unstable branches are traced forward.
  // Seeds lie 1e-5 full-plot units from each saddle along its eigenvectors.
  function saddleManifolds(p,roots=equilibria(p),options={}) {
    const dt=options.dt??0.05,maxTime=options.maxTime??2000,seed=options.seed??1e-5;
    const branches=[];
    for(const root of roots.filter(r=>r.kind==='saddle')) {
      const [[A,B],[E,D]]=jacobian([root.v,root.w],p),tr=A+D,det=A*D-B*E;
      const disc=Math.sqrt(tr*tr-4*det);
      for(const [kind,lambda,signTime] of [['stable',(tr-disc)/2,-1],['unstable',(tr+disc)/2,1]]) {
        let vector=[B,lambda-A];
        if(Math.hypot(...vector)<1e-12)vector=[lambda-D,E];
        const scale=Math.hypot(vector[0]/140,vector[1]/1.4);
        vector=vector.map(x=>x/scale);
        for(const sign of [-1,1]) {
          let state=[root.v+sign*seed*vector[0],root.w+sign*seed*vector[1]];
          const points=[[root.v,root.w],[...state]];
          for(let i=0;i<Math.ceil(maxTime/dt);i++) {
            const next=step(state,p,signTime*dt);
            if(!next.every(Number.isFinite))break;
            if(next[0]<-80||next[0]>60||next[1]<-0.2||next[1]>1.2) {
              // Intersect the last segment with the full plot boundary.
              let fraction=1;
              for(const [j,lo,hi] of [[0,-80,60],[1,-0.2,1.2]]) {
                if(next[j]<lo)fraction=Math.min(fraction,(lo-state[j])/(next[j]-state[j]));
                if(next[j]>hi)fraction=Math.min(fraction,(hi-state[j])/(next[j]-state[j]));
              }
              state=state.map((x,j)=>x+fraction*(next[j]-x));break;
            }
            state=next;
            if(i%4===0)points.push([...state]);
            const d=rhs(state,p);
            if(i>200&&Math.hypot(d[0]/140,d[1]/1.4)<1e-9)break;
          }
          points.push([...state]);
          branches.push({kind,lambda,sign,points});
        }
      }
    }
    return branches;
  }
  function vnull(v,p) { return (p.I-p.gCa*minf(v,p)*(v-p.ECa)-p.gL*(v-p.EL))/(p.gK*(v-p.EK)); }
  const api={defaults,presets,equilibria,jacobian,saddleManifolds,minf,winf,rhs,step,vnull};
  if(typeof module!=='undefined') module.exports=api;
  root.ML=api;
})(typeof window==='undefined'?globalThis:window);
