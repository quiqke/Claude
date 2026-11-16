// Rig, springs, figure drawer, paper and text: copied from the Lemo-Opuscar stick-explainer demo (styles/stick-explainer/demo/index.html), canvas set to 1080x1920.
const W = 1080, H = 1920;
const cv = document.getElementById('c'), g = cv.getContext('2d');
const C = { paper:'#F3F0EA', ink:'#24242C', mute:'#9C978C', tint:'#E2DDD2', sig:'#EB4A2A', soft:'#F4C3B4' };
const LW = 7;                         // the one figure line width for the whole film (1080p)
const GUIDE = 3;                      // line width of guides (dashed boxes, ticks)
const EN = 'Jost', ZH = 'Jost';


const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)), lerp=(a,b,t)=>a+(b-a)*t;
const seg=(t,a,b)=>clamp((t-a)/(b-a)), ss=t=>{t=clamp(t);return t*t*(3-2*t)};
const bell=(t,a,b)=>{const u=seg(t,a,b);return Math.sin(Math.PI*u)**2};   // 0→1→0, smooth start and end
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function hex(h){return [1,3,5].map(i=>parseInt(h.slice(i,i+2),16))}
function mix(a,b,t){const A=hex(a),B=hex(b);return 'rgb('+A.map((v,i)=>Math.round(lerp(v,B[i],clamp(t)))).join(',')+')'}

// ---------------- Paper: only a very fine matte grain, no vignette, no fibres ----------------
let paperC=null;
function paper(){
  if(!paperC){
    paperC=document.createElement('canvas');paperC.width=W;paperC.height=H;
    const x=paperC.getContext('2d');x.fillStyle=C.paper;x.fillRect(0,0,W,H);
    const id=x.getImageData(0,0,W,H),d=id.data,r=mulberry(11);
    for(let i=0;i<d.length;i+=4){const n=(r()+r()-1)*3.2;d[i]+=n;d[i+1]+=n;d[i+2]+=n;}
    x.putImageData(id,0,0);
  }
  g.drawImage(paperC,0,0);
}

// ---------------- Skeleton ----------------
// Units: figure height = 1. Angle a has direction vector (sin a, cos a) (screen y points down): 0 points down, +π/2 right, ±π up.
const GEO = { thigh:.215, shin:.215, hipH:.42, spine:.285, sh:.065, upper:.18, fore:.155, gap:0, headR:.112, stance:.09 };
function rest(){ return { hx:0, hy:0, lean:0, bend:0, head:0,
  la:-.56, lb:.24, ra:.56, rb:-.24, lfx:0, lfy:0, rfx:0, rfy:0, hdx:0, hdy:0 }; }
const KEYS = Object.keys(rest());
const dirv=a=>[Math.sin(a),Math.cos(a)];

// Two-segment IK: hip H, foot F, knee toward side (-1 left / +1 right)
function ik(H,F,L1,L2,side){
  let dx=F[0]-H[0],dy=F[1]-H[1],d=Math.hypot(dx,dy);const m=(L1+L2)*.9995;
  if(d>m){F=[H[0]+dx/d*m,H[1]+dy/d*m];dx=F[0]-H[0];dy=F[1]-H[1];d=m;}
  const a=(L1*L1-L2*L2+d*d)/(2*d),h=Math.sqrt(Math.max(0,L1*L1-a*a));
  const px=H[0]+a*dx/d,py=H[1]+a*dy/d;let nx=-dy/d,ny=dx/d;
  if(nx*side<0){nx=-nx;ny=-ny}
  return [[px+nx*h,py+ny*h],F];
}
// Compute all joints of one figure (pixels). The head sits right on the neck (no gap); its lag only rotates, never translates, so the head always stays attached to the body.
function joints(f,p){
  const S=f.S, bx=f.x, gy=f.gy, prof=!!f.prof, face=f.face||1;
  const Hp=[bx+p.hx*S, gy-(GEO.hipH-p.hy)*S];
  const sd=dirv(Math.PI-p.lean);                      // spine points up: lean>0 leans right
  const N=[Hp[0]+sd[0]*GEO.spine*S, Hp[1]+sd[1]*GEO.spine*S];
  const mid=[(Hp[0]+N[0])/2,(Hp[1]+N[1])/2], perp=[-sd[1],sd[0]];
  const Cc=[mid[0]+perp[0]*p.bend*S, mid[1]+perp[1]*p.bend*S];
  const u=1-GEO.sh/GEO.spine;                           // shoulder point on the spine curve
  const Sh=[(1-u)*(1-u)*Hp[0]+2*(1-u)*u*Cc[0]+u*u*N[0],(1-u)*(1-u)*Hp[1]+2*(1-u)*u*Cc[1]+u*u*N[1]];
  const lag=clamp(p.hdx/GEO.headR*.9,-.35,.35);         // head follow-through: turns a little about the neck
  const hd=dirv(Math.PI-(p.lean+p.head+lag)), hr=GEO.headR*S;
  const Hd=[N[0]+hd[0]*hr, N[1]+hd[1]*hr];
  const arm=(a,b)=>{const e=dirv(a),E=[Sh[0]+e[0]*GEO.upper*S,Sh[1]+e[1]*GEO.upper*S];const w=dirv(a+b);return [E,[E[0]+w[0]*GEO.fore*S,E[1]+w[1]*GEO.fore*S]]};
  const st=prof?0:GEO.stance;
  const footL=[bx+(-st+p.lfx)*S, gy-p.lfy*S], footR=[bx+(st+p.rfx)*S, gy-p.rfy*S];
  const kL=prof?face:-1, kR=prof?face:1;
  return { Hp,N,Cc,Sh,Hd, aL:arm(p.la,p.lb), aR:arm(p.ra,p.rb),
    lL:ik(Hp,footL,GEO.thigh*S,GEO.shin*S,kL), lR:ik(Hp,footR,GEO.thigh*S,GEO.shin*S,kR) };
}

// ---------------- Figure drawing (parameter): ?fig=A | B | C ----------------
// The three drawings share one skeleton and one set of springs and change only how the joints are joined into lines. Nowhere is there a polyline:
// A even hose: each limb is one quadratic curve (the joint as control point), one line width for the whole body.
// B tapered stroke: limbs grow out of the torso, thick at the root and thin at hands and feet, like one stroke of a brush or marker; curved at the joints too.
// C one-line body: both legs are one stroke (foot→knee→hip→knee→foot), both arms one stroke (hand→elbow→shoulder→elbow→hand), the spine runs on into the head circle in one stroke.
const FIGS = {
  A:{ kind:'hose',  name:'Even hose',      zh:'等粗软管', w:8, head:7.5, k:.8 },
  B:{ kind:'taper', name:'Tapered stroke', zh:'渐细笔触', torso:[12.5,8.5], leg:[12.5,3.6], arm:[10.5,3.4], head:7, k:.6 },
  C:{ kind:'line',  name:'One-line body',  zh:'一笔连体', w:6.5, head:6.5, soft:.7 },
};
const FIGKEY = new URLSearchParams(location.search).get('fig') || 'A';   // this style uses A, the even hose; B and C are two other drawings of the same skeleton
let FS = FIGS[FIGKEY] || FIGS.A;
// Joint control point: at k=0 the curve only bends toward the joint, at k=1 it passes exactly through it. In between = a soft bent hose.
function ctrl(A,B,E,k){ const m=[(A[0]+E[0])/2,(A[1]+E[1])/2]; return [B[0]+(B[0]-m[0])*k, B[1]+(B[1]-m[1])*k]; }
const qpt=(A,Q,E,t)=>{const s=1-t;return [s*s*A[0]+2*s*t*Q[0]+t*t*E[0], s*s*A[1]+2*s*t*Q[1]+t*t*E[1]]};
const qder=(A,Q,E,t)=>[2*(1-t)*(Q[0]-A[0])+2*t*(E[0]-Q[0]), 2*(1-t)*(Q[1]-A[1])+2*t*(E[1]-Q[1])];
// A tapered quadratic curve: w0 → w1, filled outline + round ends
function taper(A,Q,E,w0,w1,n=30){
  const L=[],R=[];
  for(let i=0;i<=n;i++){ const t=i/n, P=qpt(A,Q,E,t); let d=qder(A,Q,E,t), l=Math.hypot(d[0],d[1]);
    if(l<1e-6){d=[E[0]-A[0],E[1]-A[1]];l=Math.hypot(d[0],d[1])||1;}
    const w=lerp(w0,w1,Math.pow(t,.85))/2, nx=-d[1]/l*w, ny=d[0]/l*w;
    L.push([P[0]+nx,P[1]+ny]); R.push([P[0]-nx,P[1]-ny]); }
  g.beginPath(); g.moveTo(L[0][0],L[0][1]); for(const p of L)g.lineTo(p[0],p[1]);
  for(let i=R.length-1;i>=0;i--)g.lineTo(R[i][0],R[i][1]); g.closePath(); g.fill();
  g.beginPath(); g.arc(A[0],A[1],w0/2,0,Math.PI*2); g.fill();
  g.beginPath(); g.arc(E[0],E[1],w1/2,0,Math.PI*2); g.fill();
}
// Smooth curve through a list of points (Catmull-Rom → cubic Bézier); smaller soft = tighter
function spline(P,soft){
  const n=P.length, X=i=>P[Math.max(0,Math.min(n-1,i))];
  g.moveTo(P[0][0],P[0][1]);
  for(let i=0;i<n-1;i++){
    const p0=i===0?[2*P[0][0]-P[1][0],2*P[0][1]-P[1][1]]:X(i-1), p1=X(i), p2=X(i+1),
          p3=i+2>=n?[2*P[n-1][0]-P[n-2][0],2*P[n-1][1]-P[n-2][1]]:X(i+2), k=soft/3;
    g.bezierCurveTo(p1[0]+(p2[0]-p0[0])*k*.5,p1[1]+(p2[1]-p0[1])*k*.5, p2[0]-(p3[0]-p1[0])*k*.5,p2[1]-(p3[1]-p1[1])*k*.5, p2[0],p2[1]);
  }
}
function headDisc(j,S,fill){ g.beginPath();g.arc(j.Hd[0],j.Hd[1],GEO.headR*S,0,Math.PI*2);g.fillStyle=fill;g.fill(); }
function figure(f,p){
  const S=f.S, j=joints(f,p), col=f.col||C.ink, fill=f.fill||C.paper;
  // line width scales with the square root of figure size (big figures a little thicker, small ones thinner, but never so thin they blur); hand and foot tips at least 3 px
  // f.lws: in the film, line width scales in proportion to figure size (in the fractal ring big and small figures look equally thick); default is the square root
  const sc=(f.lws ?? clamp(Math.sqrt(S/380),.6,1.05))*(f.lwk??1), F0=f.fs||FS, W=(v,m=3)=>Math.max(m*(f.lwk??1)*(f.lws??1),v*sc);
  const fs={...F0, w:W(F0.w||0,5), head:W(F0.head,5)};
  if(F0.kind==='taper'){ fs.torso=[W(F0.torso[0]),W(F0.torso[1])]; fs.leg=[W(F0.leg[0]),W(F0.leg[1])]; fs.arm=[W(F0.arm[0]),W(F0.arm[1])]; }
  g.save(); g.strokeStyle=col; g.fillStyle=col; g.lineCap='round'; g.lineJoin='round';
  const legs=[j.lL,j.lR], arms=[j.aL,j.aR];
  if(fs.kind==='hose'){
    g.lineWidth=fs.w; g.beginPath();
    for(const [K,F] of legs){ const Q=ctrl(j.Hp,K,F,fs.k); g.moveTo(j.Hp[0],j.Hp[1]); g.quadraticCurveTo(Q[0],Q[1],F[0],F[1]); }
    g.moveTo(j.Hp[0],j.Hp[1]); g.quadraticCurveTo(j.Cc[0],j.Cc[1],j.N[0],j.N[1]);
    arms.forEach(([El,Hn],ai)=>{ if(ai===0&&f.noL||ai===1&&f.noR)return; const Q=ctrl(j.Sh,El,Hn,fs.k); g.moveTo(j.Sh[0],j.Sh[1]); g.quadraticCurveTo(Q[0],Q[1],Hn[0],Hn[1]); });
    g.stroke();
    headDisc(j,S,fill); g.lineWidth=fs.head; g.beginPath(); g.arc(j.Hd[0],j.Hd[1],GEO.headR*S,0,Math.PI*2); g.stroke();
  } else if(fs.kind==='taper'){
    for(const [K,F] of legs) taper(j.Hp,ctrl(j.Hp,K,F,fs.k),F,fs.leg[0],fs.leg[1]);
    taper(j.Hp,j.Cc,j.N,fs.torso[0],fs.torso[1]);
    for(const [El,Hn] of arms) taper(j.Sh,ctrl(j.Sh,El,Hn,fs.k),Hn,fs.arm[0],fs.arm[1]);
    headDisc(j,S,fill); g.lineWidth=fs.head; g.beginPath(); g.arc(j.Hd[0],j.Hd[1],GEO.headR*S,0,Math.PI*2); g.stroke();
  } else {
    g.lineWidth=fs.w; g.beginPath();
    spline([j.lL[1],j.lL[0],j.Hp,j.lR[0],j.lR[1]],fs.soft);                 // both legs in one stroke
    spline([j.aL[1],j.aL[0],j.Sh,j.aR[0],j.aR[1]],fs.soft);                 // both arms in one stroke
    g.stroke();
    headDisc(j,S,fill);
    // the spine is drawn up from the hip and, without lifting the pen, goes once round the head
    const a0=Math.atan2(j.N[1]-j.Hd[1],j.N[0]-j.Hd[0]);
    g.lineWidth=fs.head; g.beginPath(); g.moveTo(j.Hp[0],j.Hp[1]); g.quadraticCurveTo(j.Cc[0],j.Cc[1],j.N[0],j.N[1]);
    g.arc(j.Hd[0],j.Hd[1],GEO.headR*S,a0,a0+Math.PI*2); g.stroke();
  }
  g.restore();
  return j;
}

// ---------------- Spring drive ----------------
// One damped spring per parameter (ω angular frequency, ζ damping ratio). Upper arm fast, forearm slow, head loosest → natural follow-through and overlap.
const SPR = { hx:[20,.8], hy:[24,.62], lean:[13,.6], bend:[12,.55], head:[9,.42],
  la:[13,.58], ra:[13,.58], lb:[9.5,.46], rb:[9.5,.46], lfx:[30,.85], lfy:[30,.85], rfx:[30,.85], rfy:[30,.85] };
const HEADSPR=[16,.38];               // secondary follow of the head in world space (the body stops, the head arrives a little later)
function simulate(n,target,t0,t1){
  const dt=1/1200, every=5, out=[];   // record at 240 Hz
  const st=[];for(let i=0;i<n;i++){const p=target(i,t0),v={};for(const k in p)v[k]=0;
    st.push({p:{...p},v,hp:null,hv:[0,0]});}
  const rigidHead=p=>{const hy=GEO.hipH-p.hy,s=GEO.spine,r=GEO.headR;
    return [p.hx+Math.sin(p.lean)*s+Math.sin(p.lean+p.head)*r, hy+Math.cos(p.lean)*s+Math.cos(p.lean+p.head)*r]};
  let step=0;
  for(let t=t0;t<=t1+1e-9;t+=dt,step++){
    if(step%every===0) out.push(st.map(s=>({...s.p})));
    for(let i=0;i<n;i++){
      const s=st[i],tg=target(i,t);
      for(const k in SPR){const [w,z]=SPR[k];const a=w*w*(tg[k]-s.p[k])-2*z*w*s.v[k];s.v[k]+=a*dt;s.p[k]+=s.v[k]*dt;}
      const R=rigidHead(s.p);
      if(!s.hp)s.hp=[...R];
      const [w,z]=HEADSPR;
      for(let q=0;q<2;q++){const a=w*w*(R[q]-s.hp[q])-2*z*w*s.hv[q];s.hv[q]+=a*dt;s.hp[q]+=s.hv[q]*dt;}
      s.p.hdx=clamp(s.hp[0]-R[0],-.03,.03); s.p.hdy=clamp(s.hp[1]-R[1],-.03,.03);
    }
  }
  return {t0,rate:240,frames:out,at(t){const f=(t-this.t0)*this.rate,i=clamp(Math.floor(f),0,this.frames.length-2),u=clamp(f-i);
    const A=this.frames[i],B=this.frames[i+1];return A.map((p,k)=>{const q={};for(const key of KEYS)q[key]=lerp(p[key],B[k][key],u);return q})}};
}

// Target poses of the signature move: figure s changes first (anticipation crouch → jump with arms up → lands with one hand left on top of the head), the wave spreads to both sides, and finally the whole row turns toward it.
const UP = { la:-2.25, lb:-.5, ra:2.25, rb:.5 };
function rowTarget(N,s,T0,STEP,o={}){
  return (i,t)=>{
    const p=rest(), ph=i*1.93+.4;
    // breathing and a very slight sway: every figure has its own phase, so the row doesn't look copy-pasted
    p.hx+=.005*Math.sin(t*1.25+ph); p.lean+=.012*Math.sin(t*1.05+ph*1.3);
    p.hy+=.004*(.5+.5*Math.sin(t*2.1+ph)); p.la-=.03*Math.sin(t*1.5+ph); p.ra+=.03*Math.sin(t*1.5+ph+.7);
    const d=Math.abs(i-s), dir=Math.sign(s-i);
    if(i===s){
      const c=ss(seg(t,T0-.4,T0-.12))*(1-ss(seg(t,T0-.1,T0-.02)));      // anticipation: crouch, arms in
      p.hy+=.042*c; p.la-=.12*c; p.ra+=.12*c; p.lb+=.12*c; p.rb-=.12*c; p.head+=.06*c;
      if(t>=T0-.08&&t<T0+.8){ Object.assign(p,{la:UP.la,lb:UP.lb,ra:UP.ra,rb:UP.rb}); }
      const hop=Math.sin(Math.PI*seg(t,T0-.08,T0+.2));                    // small hop
      if(t>T0-.08&&t<T0+.2){p.lfy=p.rfy=.055*hop;p.hy-=.055*hop;}
      if(o.wave&&t>=T0+.15&&t<T0+1.75){                                    // wave: forearms swing back and forth, the hose bends from one side to the other
        const w=Math.sin(2*Math.PI*1.7*(t-T0-.15))*ss(seg(t,T0+.15,T0+.45))*(1-ss(seg(t,T0+1.4,T0+1.75)));
        p.lb=UP.lb+.75*w; p.rb=UP.rb+.75*w; p.la=UP.la+.18*w; p.ra=UP.ra+.18*w; p.lean=.04*w; }
      if(t>=T0+(o.wave?1.75:.8)){ p.ra=2.62; p.rb=.18; p.lean=-.025; p.head=-.05;       // settle: one hand stays on top of the head, as if saying "it's me"
        if(o.wave){ p.ra=2.5; p.rb=.55; p.la=-.72; p.lb=.62; p.lean=-.04; } }           // the other hand relaxes, with a soft bend

    } else {
      const Ti=T0+STEP*d, tau=t-Ti, amp=1-.045*(d-1);
      const c=bell(tau,-.2,.02);                                         // anticipation: dip down first
      p.hy+=.022*c; p.la-=.06*c; p.ra+=.06*c;
      const hold=o.wave?.6:.36;
      if(tau>=0&&tau<hold){ p.la=lerp(p.la,UP.la,amp);p.lb=lerp(p.lb,UP.lb,amp);p.ra=lerp(p.ra,UP.ra,amp);p.rb=lerp(p.rb,UP.rb,amp);
        if(o.wave){const w=Math.sin(2*Math.PI*1.7*tau)*ss(seg(tau,0,.2));p.lb+=.5*w;p.rb+=.5*w;} }
      p.lean+=-dir*.05*bell(tau,0,.5);                                    // nudged by the wave
      const tl=T0+1.45+.07*d, L=ss(seg(t,tl,tl+.45)), k=1-.07*(d-1);      // finally: the whole row looks at the one that changed
      p.lean+=dir*.12*L*k; p.head+=dir*.22*L*k; p.hx+=dir*.018*L;
    }
    return p;
  };
}

// ---------------- Text ----------------
let TXT=null;   // for window.TEXTS: which text this frame drew, and where
function text(s,x,y,{size=28,w=500,col=C.ink,font=EN,align='left',track=0,a=1}={}){
  if(a<=0)return;
  g.save();g.globalAlpha=clamp(a);g.font=`${w} ${size}px ${font}`;g.fillStyle=col;g.textAlign=align;g.textBaseline='alphabetic';
  g.letterSpacing=track+'px';g.fillText(s,x,y);
  if(TXT){const m=g.measureText(s),x0=align==='left'?x:align==='right'?x-m.width:x-m.width/2,T=g.getTransform(),P=(px,py)=>[T.a*px+T.c*py+T.e,T.b*px+T.d*py+T.f],A=P(x0,y-size*.8),B=P(x0+m.width,y+size*.25);TXT.push({id:s,text:s,x0:A[0],y0:A[1],x1:B[0],y1:B[1]});}
  g.restore();
}
function arrowHead(x,y,ang,len,col,lw){
  g.save();g.strokeStyle=col;g.lineWidth=lw;g.lineCap='round';g.lineJoin='round';
  g.beginPath();g.moveTo(x+Math.cos(ang+2.55)*len,y+Math.sin(ang+2.55)*len);g.lineTo(x,y);
  g.lineTo(x+Math.cos(ang-2.55)*len,y+Math.sin(ang-2.55)*len);g.stroke();g.restore();
}

// Step response of a damped spring (from the demo): 0 → 1, overshoots once and settles
function popS(tau,w=17,z=.45){ if(tau<=0)return 0; const wd=w*Math.sqrt(1-z*z); return 1-Math.exp(-z*w*tau)*(Math.cos(wd*tau)+z*w/wd*Math.sin(wd*tau)); }
