/** FIORITURA: authored, deterministic canvas landscape. No external tracking or image requests. */
export const WORLD_W = 1240;
export const WORLD_H = 860;

const seeded = (x) => { let n = Math.sin(x * 157.29 + 48.32) * 43239.13; return n - Math.floor(n); };
const arc = (g,x,y,r) => {g.beginPath();g.arc(x,y,r,0,Math.PI*2);};
const fillOval=(g,x,y,rx,ry,color,angle=0)=>{g.save();g.translate(x,y);g.rotate(angle);g.fillStyle=color;g.beginPath();g.ellipse(0,0,rx,ry,0,0,Math.PI*2);g.fill();g.restore();};
function hill(g,points,fill){g.fillStyle=fill;g.beginPath();g.moveTo(0,WORLD_H);for(const [x,y] of points){g.lineTo(x,y);}g.lineTo(WORLD_W,WORLD_H);g.closePath();g.fill();}
function bezHill(g,start,control,end,fill){g.fillStyle=fill;g.beginPath();g.moveTo(0,WORLD_H);g.lineTo(...start);for(const a of control){g.bezierCurveTo(...a);}g.lineTo(...end);g.lineTo(WORLD_W,WORLD_H);g.closePath();g.fill();}
function cloud(g,x,y,s,alpha){g.save();g.globalAlpha=alpha;for(const [dx,dy,rx,ry] of [[0,0,65,16],[-37,4,40,13],[32,5,46,12],[10,-11,39,20]])fillOval(g,x+dx*s,y+dy*s,rx*s,ry*s,'#ffe9d8');g.restore();}
function cypress(g,x,y,s,isDay){g.save();g.translate(x,y);g.scale(s,s);g.fillStyle=isDay?'#315f50':'#173d39';g.beginPath();g.moveTo(-16,0);g.bezierCurveTo(-25,-40,-22,-98,-7,-150);g.quadraticCurveTo(0,-192,9,-151);g.bezierCurveTo(27,-92,25,-36,15,0);g.fill();g.fillStyle=isDay?'#619071':'#40736b';g.beginPath();g.moveTo(-5,-144);g.quadraticCurveTo(-16,-64,-6,-7);g.quadraticCurveTo(0,-45,1,-90);g.fill();g.restore();}
function flowerSpecks(g,x,y,s,day,seed){g.save();g.translate(x,y);g.scale(s,s);for(let i=0;i<13;i++){const a=seeded(i*5+seed)*6.28;const r=Math.sqrt(seeded(i*9+seed))*35;fillOval(g,Math.cos(a)*r,Math.sin(a)*r*.38,4+seeded(i+seed)*3,3,day?['#de78a5','#f7d7a1','#e8b0de'][i%3]:['#ef9eb6','#f4ca86','#b4a1d9'][i%3]);}g.restore();}
function shrub(g,x,y,s,day,seed){g.save();g.translate(x,y);g.scale(s,s);const p=day?['#30674c','#4d845a','#6a9870']:['#214d45','#2e6656','#477468'];for(let i=0;i<16;i++){const xx=(seeded(i*10+seed)-.5)*100;const yy=(seeded(i*11+seed+3)-.5)*46;fillOval(g,xx,yy,28,14,p[i%p.length],seeded(i+7)*.9);}
flowerSpecks(g,-18,-8,.65,day,seed);flowerSpecks(g,28,3,.62,day,seed+10);g.restore();}
function arch(g,day){
  g.save();g.translate(640,276);
  // Distant garden gate, not an official Sanremo landmark.
  g.strokeStyle=day?'#cdb59e':'#a7a3aa';g.lineWidth=13;g.lineCap='round';g.beginPath();g.moveTo(-65,98);g.lineTo(-65,-28);g.quadraticCurveTo(0,-130,65,-28);g.lineTo(65,98);g.stroke();
  g.strokeStyle=day?'#f2e1c2':'#d0b3ae';g.lineWidth=3;g.beginPath();g.moveTo(-66,98);g.lineTo(-66,-28);g.quadraticCurveTo(0,-132,66,-28);g.lineTo(66,98);g.stroke();
  for(let i=0;i<12;i++){const a=i/11*Math.PI;const x=Math.cos(a)*66,y=-28-Math.sin(a)*62;fillOval(g,x,y,9,6,i%2?'#d09ac4':'#f2b9a3',a+.3);}
  g.fillStyle=day?'#eadbbd':'#ffe3b5';g.font='700 19px sans-serif';g.textAlign='center';g.fillText('IL GIARDINO',0,12);
  g.font='500 12px sans-serif';g.fillText('delle persone',0,30);
  g.restore();
}
function pathway(g,day){
  const grd=g.createLinearGradient(620,350,620,860);
  if(day){grd.addColorStop(0,'#d7bea8');grd.addColorStop(1,'#f7d5bd');}else{grd.addColorStop(0,'#876d77');grd.addColorStop(1,'#c59899');}
  g.fillStyle=grd;g.beginPath();g.moveTo(620,350);g.bezierCurveTo(560,530,490,615,369,860);g.lineTo(890,860);g.bezierCurveTo(760,648,679,509,655,350);g.closePath();g.fill();
  g.strokeStyle=day?'#cfae99':'#957e80';g.lineWidth=4;g.beginPath();g.moveTo(620,350);g.bezierCurveTo(560,530,490,615,369,860);g.moveTo(655,350);g.bezierCurveTo(679,509,760,648,890,860);g.stroke();
  g.save();g.beginPath();g.moveTo(620,350);g.bezierCurveTo(560,530,490,615,369,860);g.lineTo(890,860);g.bezierCurveTo(760,648,679,509,655,350);g.closePath();g.clip();
  for(let i=0;i<17;i++){const y=370+i*i*1.66;const w=20+i*24;g.lineWidth=1+i*.16;g.strokeStyle=day?'#b6938466':'#453d5566';g.beginPath();g.moveTo(630-w,y);g.bezierCurveTo(630,y+6,630+w,y-4,650+w*.4,y+4);g.stroke();}
  g.restore();
}
function fireflies(g,t,day){if(day)return;for(let i=0;i<60;i++){const x=seeded(i+140)*WORLD_W;const y=270+seeded(i+800)*550;const alpha=.22+.30*(1+Math.sin(t/760+i*2))/2;g.globalAlpha=alpha;fillOval(g,x,y,1.4+seeded(i+31)*2,1.4,'#ffeabe');}g.globalAlpha=1;}
export function paintWorld(g,day,t=0){
  const sky=g.createLinearGradient(0,0,0,WORLD_H);
  if(day){sky.addColorStop(0,'#a4dce1');sky.addColorStop(.29,'#e4e8cc');sky.addColorStop(.5,'#ffdfbf');sky.addColorStop(1,'#9ab894');}
  else{sky.addColorStop(0,'#111e3b');sky.addColorStop(.32,'#594565');sky.addColorStop(.52,'#c37d86');sky.addColorStop(.78,'#9c7d81');sky.addColorStop(1,'#3a604c');}
  g.fillStyle=sky;g.fillRect(0,0,WORLD_W,WORLD_H);
  if(day){cloud(g,230,118,1.12,.28);cloud(g,912,107,.82,.35);cloud(g,1054,204,.5,.22);}
  else{
    const moon=g.createRadialGradient(970,140,8,970,140,94);moon.addColorStop(0,'#fff8d88a');moon.addColorStop(1,'#fff8d800');g.fillStyle=moon;g.fillRect(870,40,200,200);
    g.fillStyle='#ffefc8';arc(g,971,141,28);g.fill();for(let i=0;i<90;i++){g.globalAlpha=seeded(i+22)*.5+.15;fillOval(g,seeded(i+24)*WORLD_W,seeded(i+48)*260,1,1,'#ffedd8');}g.globalAlpha=1;
    cloud(g,202,143,1.16,.13);cloud(g,1167,220,.8,.1);
  }
  // Receding layered mountains.
  hill(g,[[0,330],[155,288],[338,339],[546,262],[746,315],[934,250],[1120,304],[1240,265]],day?'#9db5a9':'#6a687b');
  hill(g,[[0,380],[160,329],[310,364],[534,310],[700,367],[912,308],[1080,363],[1240,323]],day?'#7fae9c':'#4d6172');
  // Small distant village skyline as a poetic, non-literal landscape.
  for(let i=0;i<28;i++){const x=i*49+(seeded(i+70)*18);const y=358+seeded(i+18)*30;const w=18+seeded(i+22)*25;const h=26+seeded(i+25)*27;
    g.fillStyle=day?['#e9d5be','#eedcc9','#e5cbb3'][i%3]:['#ae8790','#c0989a','#937b8c'][i%3];g.fillRect(x,y-h,w,h);
    g.fillStyle=day?'#799a94':'#ffcf9d';for(let j=0;j<2;j++)g.fillRect(x+5+j*9,y-h+9,3,5);
  }
  hill(g,[[0,385],[155,373],[275,408],[480,389],[690,420],[845,386],[1050,420],[1240,374]],day?'#659b83':'#345d58');
  hill(g,[[0,460],[155,440],[320,470],[500,432],[725,450],[930,438],[1100,455],[1240,425]],day?'#37765b':'#274d48');
  for(let i=0;i<18;i++){const x=40+i*71;const y=431+seeded(i*9)*45;cypress(g,x,y,.5+seeded(i+2)*.44,day);}
  // Middle garden terrace, hillside bands.
  const hedge=g.createLinearGradient(0,470,0,860);hedge.addColorStop(0,day?'#6f9e69':'#2a5849');hedge.addColorStop(1,day?'#456f4c':'#193f3b');g.fillStyle=hedge;g.fillRect(0,472,WORLD_W,388);
  for(let i=0;i<34;i++){const x=i*40-8;const y=488+Math.sin(i*.9)*18;fillOval(g,x,y,31,22,i%3===0?(day?'#4d8958':'#2e6855'):(day?'#568f5c':'#275f52'));}
  arch(g,day);pathway(g,day);
  // Bushes and flowering embankments on both sides of path.
  for(let i=0;i<31;i++){const x=i<16?seeded(i+3)*475:777+seeded(i+3)*520;const y=555+seeded(i+55)*280;const s=.55+(y/860)*.9;shrub(g,x,y,s,day,i*31);}
  for(let i=0;i<18;i++){const x=i<9?seeded(i+32)*420:820+seeded(i+32)*390;const y=640+seeded(i+83)*235;flowerSpecks(g,x,y,1.1+(y-640)/400,day,i*6);}
  // Ground fog and light catches.
  const mist=g.createLinearGradient(0,690,0,860);mist.addColorStop(0,'#eadad600');mist.addColorStop(1,day?'#c8d1ab28':'#f3c7c61d');g.fillStyle=mist;g.fillRect(0,690,WORLD_W,170);
  fireflies(g,t,day);
}

export function paintForeground(g,day){
  for(let i=0;i<12;i++){
    const x=i<6?seeded(i+201)*400:837+seeded(i+210)*404;
    const y=832+seeded(i+300)*72;
    shrub(g,x,y,1.15+seeded(i+33)*.65,day,i*71);
  }
  g.save();g.globalAlpha=.22;g.fillStyle=day?'#193e30':'#b1bdb1';
  for(let i=0;i<40;i++){const x=seeded(i+902)*WORLD_W;const y=650+seeded(i+1003)*210;g.beginPath();g.ellipse(x,y,1.5,9+seeded(i+10)*8,seeded(i+3)*.8,0,Math.PI*2);g.fill();}g.restore();
}
