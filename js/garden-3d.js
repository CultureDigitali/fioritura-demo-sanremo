/**
 * FIORITURA / Il Giardino delle Persone
 * Preview Three.js scene — all inhabitants are fictional.
 * Motion sensors are opt-in, relative to the first valid reading, and never sent remotely.
 */
import * as THREE from 'three';
import { createDemoFlowers } from './garden.js';
import { computeTiltOffset } from './garden-tilt.js';

const viewport = document.getElementById('garden3dViewport');
const loading = document.getElementById('garden3dLoading');
const motionButton = document.getElementById('garden3dTilt');
const motionStatus = document.getElementById('garden3dSensorStatus');
const selectPanel = document.getElementById('garden3dSelected');
const listEl = document.getElementById('garden3dFlowerList');
const plantForm = document.getElementById('garden3dPlantForm');
const plantStatus = document.getElementById('garden3dPlantStatus');
const selectedTitle = document.getElementById('garden3dSelectedName');
const selectedText = document.getElementById('garden3dSelectedText');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarsePointer = matchMedia('(pointer: coarse)').matches;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const random = (seed) => { const f = Math.sin(seed * 187.419) * 43758.5453; return f - Math.floor(f); };

// A failing or unsupported WebGL environment still has a complete two-dimensional garden.
function fallback(message) {
  loading.hidden = false;
  loading.replaceChildren();
  const box = document.createElement('div');
  const heading = document.createElement('strong');
  const p = document.createElement('p');
  const a = document.createElement('a');
  heading.textContent = 'Il giardino 3D non è disponibile su questo dispositivo.';
  p.textContent = message;
  a.href = './giardino.html'; a.textContent = 'Visita il giardino illustrato 2D →';
  a.style.cssText = 'color:#d6ed8d;display:inline-block;margin-top:9px;text-decoration:underline';
  box.append(heading, p, a);
  loading.append(box);
  motionButton.disabled = true;
  motionStatus.textContent = 'Puoi comunque visitare il giardino illustrato, senza sensori.';
}

if (viewport) {
  try { startGarden(); }
  catch (error) { console.error('[FIORITURA 3D]', error); fallback('Il browser non ha potuto inizializzare la scena.'); }
}

function startGarden() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: !coarsePointer, alpha: false, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarsePointer ? 1.4 : 1.7));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
  } catch { fallback('Prova a usare Safari o Chrome aggiornato, oppure il giardino 2D.'); return; }

  viewport.append(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', 'Vista tridimensionale del giardino FIORITURA');
  renderer.domElement.tabIndex = 0;
  const scene = new THREE.Scene();
  const nightSky = new THREE.Color('#1c3242');
  const daySky = new THREE.Color('#b4dacf');
  scene.background = nightSky.clone();
  const fog = new THREE.Fog(nightSky, 20, 77);
  scene.fog = fog;
  const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 110);
  const hemi = new THREE.HemisphereLight('#ffe8d4', '#294e47', 2.1);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#ffe4b9', 2.0);
  sun.position.set(-14, 23, 5); scene.add(sun);
  const fillLight = new THREE.DirectionalLight('#a8b7eb', 0.8);
  fillLight.position.set(9, 8, -14); scene.add(fillLight);
  const isDay = { value: false };

  const mat = (color, options = {}) => new THREE.MeshLambertMaterial({ color, ...options });
  const grass = mat('#255849');
  const turf = new THREE.Mesh(new THREE.PlaneGeometry(190, 190), grass);
  turf.rotation.x = -Math.PI / 2; turf.position.y = -0.085; scene.add(turf);

  const pathMaterial = mat('#b48b88', { side: THREE.DoubleSide });
  const ribbonVertices = [];
  const ribbonIndices = [];
  const trace = z => Math.sin((z + 10) * 0.125) * 0.45;
  for (let i = 0; i <= 46; i++) {
    const z = 17 - i * 1.35;
    const width = 2.4 + Math.max(0, z + 17) * 0.038;
    ribbonVertices.push(trace(z) - width, -0.052, z, trace(z) + width, -0.052, z);
    if (i < 46) { const n = i * 2; ribbonIndices.push(n, n+1, n+2, n+1, n+3, n+2); }
  }
  const pathGeo = new THREE.BufferGeometry();
  pathGeo.setAttribute('position', new THREE.Float32BufferAttribute(ribbonVertices, 3));
  pathGeo.setIndex(ribbonIndices); pathGeo.computeVertexNormals();
  scene.add(new THREE.Mesh(pathGeo, pathMaterial));

  // Decorative hillside layers, carefully avoiding detailed photographic terrain.
  for (let i = 0; i < 8; i++) {
    const hill = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8), mat(i % 2 ? '#537f70' : '#688d7f'));
    hill.position.set(-25 + i * 8, -3.9 + random(i + 8), -46 - random(i + 17) * 5);
    hill.scale.set(11.4, 6.3 + random(i + 3) * 3, 7.2); scene.add(hill);
  }

  const moon = new THREE.Mesh(new THREE.SphereGeometry(2.7, 20, 14), new THREE.MeshBasicMaterial({ color: '#ffe7c3' }));
  moon.position.set(20, 17, -55); scene.add(moon);
  const moonGlow = new THREE.PointLight('#f7ddb3', 9.0, 42);
  moonGlow.position.copy(moon.position); scene.add(moonGlow);
  const sunDisc = new THREE.Mesh(new THREE.SphereGeometry(3.6, 20, 12), new THREE.MeshBasicMaterial({ color:'#ffe5aa' }));
  sunDisc.position.set(-21, 16, -56); sunDisc.visible=false; scene.add(sunDisc);

  // Archway at the end of the path — an invented artwork, not a city landmark.
  const stone = mat('#dbc5ac');
  const arch = new THREE.Group();
  for (const x of [-2.5, 2.5]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.31,0.37,5.2,8), stone);
    post.position.set(x, 2.6, -29); arch.add(post);
  }
  const archPoints=[];
  for(let i=0;i<=20;i++) {const a=Math.PI - i/20*Math.PI;archPoints.push(new THREE.Vector3(Math.cos(a)*2.53, 5.14+Math.sin(a)*1.45, -29));}
  const archTube=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(archPoints), 28, .34, 8, false),stone); arch.add(archTube);
  scene.add(arch);

  const coneGeo = new THREE.ConeGeometry(0.75,3.7,7);
  const trunkGeo = new THREE.CylinderGeometry(0.14,0.22,2,5);
  for(let i=0;i<28;i++) {
    const z = 11 - i*1.8;
    const x = (i%2 ? 1 : -1) * (10.5 + 2 * random(i+13));
    const trunk = new THREE.Mesh(trunkGeo,mat('#654c3a')); trunk.position.set(x,1,z);
    const conifer = new THREE.Mesh(coneGeo,mat(i%3?'#326951':'#427d61'));
    conifer.position.set(x,3.7,z);conifer.scale.set(.9+random(i+1)*.6,1+random(i+9)*.4,.9+random(i+7)*.7);
    scene.add(trunk,conifer);
  }

  const plantColors={
    pink:['#fa9ab7','#e67ca9','#ffc4c4'],
    gold:['#ffd373','#f4a859','#ffde9e'],
    violet:['#beb0f6','#94bdf1','#d7b3e9']
  };
  const demoFlowers=createDemoFlowers();
  let flowers=demoFlowers.map((f,i)=>({ ...f, x3:[-8.1,-6.1,-4.0,-2.7,2.7,4.5,7.6][i%7]+(random(i+35)-.5)*.62,
    z3:5-Math.floor(i/7)*7.5+(random(i+83)-.5)*1.5,
    size:0.82+random(i+8)*.24 }));
  let person=null;
  const storageKey='fioritura3d-personal-demo-v1';
  try {
    const saved=JSON.parse(localStorage.getItem(storageKey)||'null');
    if(saved && saved.id==='mine' && typeof saved.name==='string' && saved.name.length>=2 && saved.name.length<=24 && plantColors[saved.palette]) {
      person={...saved,x3:3.1,z3:8.5,size:1.1,seed:220,petals:9,demo:true}; flowers.push(person);
    }
  } catch { /* localStorage is optional */ }
  const bloomGroups=[];
  const clickTargets=[];
  const flowerMeshes=new Map();
  const sharedGeometry={
    stem:new THREE.CylinderGeometry(.085,.105,1.36,7),
    petal:new THREE.SphereGeometry(1,11,8),
    center:new THREE.SphereGeometry(.39,16,10),
    eye:new THREE.SphereGeometry(.075,8,6),
    cheek:new THREE.SphereGeometry(.105,8,6),
    leaf:new THREE.SphereGeometry(1,8,6)
  };
  const leafMat=mat('#72b98b');
  const stemMat=mat('#5da477');
  const faceMat=mat('#ffe2b1');
  const eyeMat=mat('#323331');
  const cheekMat=mat('#ed9b96');
  const smileMat=mat('#8e5e61');
  const smileCurve=new THREE.QuadraticBezierCurve3(new THREE.Vector3(-.16,-.12,.332),new THREE.Vector3(0,-.29,.415),new THREE.Vector3(.16,-.12,.332));
  const smileGeo=new THREE.TubeGeometry(smileCurve,10,.018,5,false);

  function buildFlower(f) {
    const g=new THREE.Group();
    g.position.set(f.x3,0,f.z3);
    g.scale.setScalar(f.size||1); g.userData.flowerSize=f.size||1;
    const stem=new THREE.Mesh(sharedGeometry.stem,stemMat);stem.position.y=.7;g.add(stem);
    for(const side of [-1,1]) {
      const leaf=new THREE.Mesh(sharedGeometry.leaf,leafMat);
      leaf.position.set(side*.36,.58+(side===1?.13:0),0);
      leaf.scale.set(.45,.13,.24);leaf.rotation.z=side*.36;g.add(leaf);
    }
    const head=new THREE.Group();head.position.y=1.69;g.add(head);
    const colors=plantColors[f.palette]||plantColors.pink;
    const paletteMats=colors.map(c=>mat(c,{emissive:c,emissiveIntensity:.13}));
    const petals=clamp(f.petals||8,6,11);
    for(let i=0;i<petals;i++) {
      const a=Math.PI*2*i/petals;
      const petal=new THREE.Mesh(sharedGeometry.petal,paletteMats[i%paletteMats.length]);
      petal.position.set(Math.sin(a)*.57,Math.cos(a)*.57,-.09);
      petal.scale.set(.31,.7,.2);petal.rotation.z=-a;
      petal.userData.flower=f;head.add(petal);clickTargets.push(petal);
    }
    const center=new THREE.Mesh(sharedGeometry.center,faceMat);center.position.z=.22;center.userData.flower=f;head.add(center);clickTargets.push(center);
    for(const side of [-1,1]){
      const eye=new THREE.Mesh(sharedGeometry.eye,eyeMat);
      eye.position.set(side*.155,.06,.545);head.add(eye);
      const cheek=new THREE.Mesh(sharedGeometry.cheek,cheekMat);
      cheek.position.set(side*.25,-.125,.465);cheek.scale.set(.84,.5,.3);head.add(cheek);
    }
    const smile=new THREE.Mesh(smileGeo,smileMat);smile.position.z=.238;head.add(smile);
    scene.add(g);bloomGroups.push({g,head,seed:f.seed||7});flowerMeshes.set(f.id,g);
    return g;
  }
  flowers.forEach(buildFlower);

  // Instanced meadow buds keep the draw-call count predictable on phones.
  const budGeo=new THREE.SphereGeometry(.09,6,5);
  const budMat=new THREE.MeshLambertMaterial({color:'#edb2c0',vertexColors:false});
  const buds=new THREE.InstancedMesh(budGeo,budMat,240);
  const tmp=new THREE.Object3D();
  for(let i=0;i<240;i++){
    const z = -31 + random(i+111)*48;
    const x = -13 + random(i+219)*26;
    if(Math.abs(x - trace(z))<2.8) { tmp.position.set(x>0?x+3.4:x-3.4,.12,z); }
    else tmp.position.set(x,.12,z);
    const scale=.75+random(i+410)*1.2;
    tmp.scale.set(scale,scale,scale);tmp.updateMatrix();buds.setMatrixAt(i,tmp.matrix);
    buds.setColorAt(i,new THREE.Color(['#f5bbce','#f5d38a','#c6b0f3'][i%3]));
  }
  buds.instanceMatrix.needsUpdate=true;scene.add(buds);

  const fireflyPositions=new Float32Array(84*3);
  for(let i=0;i<84;i++) {
    fireflyPositions[i*3]=-12+random(i*4+71)*24;
    fireflyPositions[i*3+1]=1.2+random(i+81)*6;
    fireflyPositions[i*3+2]=-30+random(i+401)*47;
  }
  const fireflyGeo=new THREE.BufferGeometry();fireflyGeo.setAttribute('position',new THREE.BufferAttribute(fireflyPositions,3));
  const firefly=new THREE.Points(fireflyGeo,new THREE.PointsMaterial({color:'#fee8ad',size:.11,transparent:true,opacity:.75,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(firefly);

  const raycaster=new THREE.Raycaster();const pointerNDC=new THREE.Vector2();
  const state={ yaw:0,pitch:-.1,travel:0,tilt:{x:0,y:0},target:{x:0,y:0},active:false,base:null,sensorSeen:false,day:false,selected:null,pinch:0,fov:62 };
  let sensorTimer=null;let frameId=0;let frameLast=0;let visible=!document.hidden;
  const fingerMap=new Map();let gesture=null;
  const announce=t=>{motionStatus.textContent=t;};

  function addItemList(){
    listEl.replaceChildren();
    document.getElementById('garden3dCount').textContent=
      String(flowers.length)+' fiori da scoprire';
    for(const f of flowers){
      const b=document.createElement('button');b.type='button';
      b.textContent=f.name;
      b.setAttribute('aria-label','Raggiungi il fiore '+f.name);
      b.setAttribute('aria-pressed',String(state.selected?.id===f.id));
      const swatch=document.createElement('span');swatch.style.backgroundColor=(plantColors[f.palette]||plantColors.pink)[0];
      b.prepend(swatch);b.addEventListener('click',()=>selectFlower(f));listEl.append(b);
    }
  }
  function selectFlower(f){
    state.selected=f;
    selectedTitle.textContent=f.name;
    selectedText.textContent=f.id==='mine'?'Questo è il tuo fiore di prova, salvato soltanto sul dispositivo.':'Un fiore-personaggio dimostrativo. Nessuna persona reale è rappresentata.';
    selectPanel.hidden=false;
    addItemList();
    document.getElementById('garden3dSelected').scrollIntoView({block:'nearest',behavior:reducedMotion?'instant':'smooth'});
  }
  function clearFlower(){state.selected=null;selectPanel.hidden=true;addItemList();}
  document.getElementById('garden3dCloseSelection').addEventListener('click',clearFlower);
  addItemList();

  function setLighting(day){
    state.day=day;
    scene.background=day?daySky:nightSky;fog.color.copy(scene.background);
    hemi.intensity=day?2.25:1.6;
    sun.intensity=day?3.0:1.7; fillLight.intensity=day?.65:.85;
    sunDisc.visible=day;moon.visible=!day;moonGlow.visible=!day;
    firefly.visible=!day;grass.color.set(day?'#4b8b63':'#255849');
    pathMaterial.color.set(day?'#d6b99a':'#b48b88');
  }
  setLighting(false);
  const lightingButton=document.getElementById('garden3dLighting');
  lightingButton.addEventListener('click',()=>{
    setLighting(!state.day);lightingButton.setAttribute('aria-pressed',String(state.day));
    lightingButton.textContent=state.day?'Visione notturna':'Visione diurna';
    requestFrame();
  });

  function walk(step){ state.travel=clamp(state.travel+step,0,16);requestFrame(); }
  document.getElementById('garden3dWalk')?.addEventListener('click',()=>walk(3.6));
  document.getElementById('garden3dBack')?.addEventListener('click',()=>walk(-3.6));
  document.getElementById('garden3dRecenter').addEventListener('click',()=>{
    state.yaw=0;state.pitch=-.1;state.travel=0;state.fov=62;
    state.base=null;state.target={x:0,y:0};state.tilt={x:0,y:0};
    camera.fov=62;camera.updateProjectionMatrix();clearFlower();requestFrame();
    if(state.active)announce('Vista centrata. Muovi di nuovo il telefono per cambiare prospettiva.');
  });

  function onOrientation(event){
    if(!state.active||!Number.isFinite(event.beta)||!Number.isFinite(event.gamma)) return;
    state.sensorSeen=true;
    if(!state.base){state.base={beta:event.beta,gamma:event.gamma};announce('Movimento attivo. Inclina lentamente lo smartphone per guardarti intorno.');}
    const orientationAngle=screen.orientation?.angle??window.orientation??0;
    state.target=computeTiltOffset({beta:event.beta,gamma:event.gamma},state.base,orientationAngle);
    requestFrame();
  }
  function stopSensor(){
    state.active=false;state.base=null;state.sensorSeen=false;state.target={x:0,y:0};
    if(sensorTimer)clearTimeout(sensorTimer);sensorTimer=null;
    window.removeEventListener('deviceorientation',onOrientation);
    motionButton.setAttribute('aria-pressed','false');motionButton.textContent='Muovi il telefono';
    announce('Movimento disattivato. Puoi ancora esplorare trascinando con il dito.');
  }
  motionButton.addEventListener('click',async()=>{
    if(state.active){stopSensor();return;}
    if(!window.isSecureContext){announce('Serve una pagina HTTPS per usare il movimento. Continua con i controlli touch.');return;}
    const orientationClass=window.DeviceOrientationEvent;
    if(typeof orientationClass==='undefined'){
      announce('Questo browser non espone i sensori di orientamento. Puoi esplorare con il dito.');return;
    }
    // MUST be called synchronously during the click on iOS (before any await).
    let permissionPromise;
    try { permissionPromise=typeof orientationClass.requestPermission==='function' ? orientationClass.requestPermission() : Promise.resolve('granted'); }
    catch {announce('Impossibile richiedere il permesso per il movimento.');return;}
    motionButton.disabled=true;
    try {
      const granted=await permissionPromise;
      if(granted!=='granted'){
        announce('Permesso non concesso: la visita touch rimane disponibile.');return;
      }
      state.active=true;state.sensorSeen=false;state.base=null;
      motionButton.setAttribute('aria-pressed','true');motionButton.textContent='Disattiva movimento';
      announce('In attesa dei sensori… mantieni lo smartphone davanti a te.');
      window.addEventListener('deviceorientation',onOrientation,{passive:true});
      sensorTimer=setTimeout(()=>{
        if(state.active&&!state.sensorSeen){stopSensor();announce('Nessun dato dai sensori. Abilita l’accesso al movimento nelle impostazioni del browser o usa il dito.');}
      },4000);
    } catch {announce('L’accesso al movimento non è disponibile su questo dispositivo.');}
    finally{motionButton.disabled=false;}
  });

  const getCanvasPoint=e=>{const rect=renderer.domElement.getBoundingClientRect();return {x:e.clientX-rect.left,y:e.clientY-rect.top};};
  function pickFlower(e){
    const rect=renderer.domElement.getBoundingClientRect();
    pointerNDC.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
    raycaster.setFromCamera(pointerNDC,camera);
    const hit=raycaster.intersectObjects(clickTargets,false).find(h=>h.object.userData.flower);
    if(hit)selectFlower(hit.object.userData.flower);
  }
  renderer.domElement.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse' && e.button!==0)return;
    renderer.domElement.setPointerCapture(e.pointerId);
    const p=getCanvasPoint(e);fingerMap.set(e.pointerId,p);
    if(fingerMap.size===1)gesture={start:p,last:p,moved:false,time:performance.now()};
    else if(fingerMap.size===2){const[a,b]=[...fingerMap.values()];state.pinch=Math.hypot(a.x-b.x,a.y-b.y);gesture=null;}
  });
  renderer.domElement.addEventListener('pointermove',e=>{
    if(!fingerMap.has(e.pointerId))return;
    const p=getCanvasPoint(e);const previous=fingerMap.get(e.pointerId);fingerMap.set(e.pointerId,p);
    if(fingerMap.size===1 && previous){
      const dx=p.x-previous.x,dy=p.y-previous.y;
      state.yaw=clamp(state.yaw-dx*.0045,-1.12,1.12);
      state.pitch=clamp(state.pitch+dy*.0034,-.72,.37);
      if(gesture && Math.hypot(p.x-gesture.start.x,p.y-gesture.start.y)>8)gesture.moved=true;
    } else if(fingerMap.size===2){
      const[a,b]=[...fingerMap.values()];const dist=Math.hypot(a.x-b.x,a.y-b.y);
      if(state.pinch>0){state.fov=clamp(state.fov*state.pinch/Math.max(1,dist),44,75);camera.fov=state.fov;camera.updateProjectionMatrix();}
      state.pinch=dist;
    }
    requestFrame();
  });
  function endGesture(e){
    if(!fingerMap.has(e.pointerId))return;
    fingerMap.delete(e.pointerId);
    if(fingerMap.size<2)state.pinch=0;
    if(gesture&&!gesture.moved && performance.now()-gesture.time<420)pickFlower(e);
    gesture=null;
  }
  renderer.domElement.addEventListener('pointerup',endGesture);
  renderer.domElement.addEventListener('pointercancel',endGesture);
  renderer.domElement.addEventListener('wheel',e=>{
    e.preventDefault();state.fov=clamp(state.fov+(e.deltaY>0?2:-2),44,75);
    camera.fov=state.fov;camera.updateProjectionMatrix();requestFrame();
  },{passive:false});
  renderer.domElement.addEventListener('keydown',e=>{
    let handled=true;
    switch(e.key){
      case'ArrowLeft':state.yaw=clamp(state.yaw+.12,-1.12,1.12);break;
      case'ArrowRight':state.yaw=clamp(state.yaw-.12,-1.12,1.12);break;
      case'ArrowUp':walk(2.2);break;
      case'ArrowDown':walk(-2.2);break;
      case'Escape':clearFlower();break;
      default:handled=false;
    }
    if(handled){e.preventDefault();requestFrame();}
  });

  plantForm.addEventListener('submit',e=>{
    e.preventDefault();const form=new FormData(plantForm);
    const name=String(form.get('name')??'').trim().slice(0,24);
    const palette=String(form.get('palette')??'pink');
    if(name.length<2 || !plantColors[palette]){plantStatus.textContent='Scegli un nome di almeno due caratteri e un colore.';return;}
    if(person){
      const old=flowerMeshes.get('mine');
      if(old){
        scene.remove(old);
        const index=bloomGroups.findIndex(entry=>entry.g===old);if(index>=0)bloomGroups.splice(index,1);
        old.traverse(child=>{
          if(child.isMesh && child.material && ![stemMat,leafMat,faceMat,eyeMat,cheekMat,smileMat].includes(child.material))child.material.dispose();
        });
        flowerMeshes.delete('mine');
      }
      flowers=flowers.filter(f=>f.id!=='mine');
      for(let i=clickTargets.length-1;i>=0;i--)if(clickTargets[i].userData.flower?.id==='mine')clickTargets.splice(i,1);
    }
    person={id:'mine',name,palette,x3:3.1,z3:8.5,size:1.1,seed:220,petals:9,demo:true};
    flowers.push(person);const mesh=buildFlower(person);
    if(!reducedMotion){mesh.scale.setScalar(.05);mesh.userData.bloomAt=performance.now();}
    try{localStorage.setItem(storageKey,JSON.stringify({id:'mine',name,palette}));}catch{}
    addItemList();plantStatus.textContent='Il tuo fiore è sbocciato. Rimane solo su questo dispositivo.';
    state.travel=0;state.yaw=-.27;state.pitch=-.12;selectFlower(person);requestFrame();
  });

  // Interaction-driven, capped rendering is more battery-friendly than a full 60fps loop.
  const frameRate=coarsePointer?29:40;
  function frame(time){
    frameId=0;
    if(!visible)return;
    if(time-frameLast < 1000/frameRate){frameId=requestAnimationFrame(frame);return;}
    const dt=Math.min(.1,(time-frameLast)/1000||.03);frameLast=time;
    if(state.active){
      state.tilt.x+=(state.target.x-state.tilt.x)*Math.min(1,dt*7);
      state.tilt.y+=(state.target.y-state.tilt.y)*Math.min(1,dt*7);
    } else {state.tilt.x*=.9;state.tilt.y*=.9;}
    camera.position.set(trace(11-state.travel),2.75,12.2-state.travel);
    const yaw=state.yaw-state.tilt.x*.34;
    const pitch=state.pitch-state.tilt.y*.24;
    camera.lookAt(camera.position.x+Math.sin(yaw)*18,camera.position.y+Math.sin(pitch)*18,camera.position.z-Math.cos(yaw)*18);
    if(!reducedMotion){
      for(const obj of bloomGroups){
        obj.head.rotation.z=Math.sin(time*.00068+obj.seed*.77)*.045;
        if(obj.g.userData.bloomAt){
          const f=clamp((time-obj.g.userData.bloomAt)/900,0,1);
          const eased=1-Math.pow(1-f,3);
          obj.g.scale.setScalar((obj.g.userData.flowerSize||1)*(.08+eased*.92));
          if(f>=1)delete obj.g.userData.bloomAt;
        }
      }
      firefly.rotation.y=Math.sin(time*.00011)*.014;
    }
    renderer.render(scene,camera);
    if(!reducedMotion || state.active || fingerMap.size){frameId=requestAnimationFrame(frame);}
  }
  function requestFrame(){ if(!visible||frameId)return;frameId=requestAnimationFrame(frame); }
  function resize(){
    const rect=viewport.getBoundingClientRect();
    if(!rect.width||!rect.height)return;
    renderer.setSize(rect.width,rect.height,false);
    camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();requestFrame();
  }
  const ro=new ResizeObserver(resize);ro.observe(viewport);resize();
  function visibility(){visible=!document.hidden;if(!visible){cancelAnimationFrame(frameId);frameId=0;}else requestFrame();}
  document.addEventListener('visibilitychange',visibility);
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();visible=false;stopSensor();fallback('Il dispositivo ha sospeso l’accelerazione grafica.');});
  loading.hidden=true;
  requestFrame();
}
