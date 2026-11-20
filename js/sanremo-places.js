// Geographic editorial explorer: static curated JSON + opt-in OpenStreetMap embed.
const $=id=>document.getElementById(id);
const el=(tag,cls,value)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(value!==undefined)n.textContent=value;return n};
const put=(parent,...children)=>{children.forEach(n=>parent.append(n));return parent};
const safe=(url,hosts)=>{
 try{const u=new URL(url);return u.protocol==='https:'&&hosts.includes(u.hostname)?u.href:null}catch{return null}
};
const allowedCategories=new Set(['mare','natura','storia','itinerari']);
const imageHosts=['commons.wikimedia.org','upload.wikimedia.org'];
let places=[],filter='all',selected=null,loadedMap=false;
function valid(p){
 if(!p||!/^[a-z0-9-]{3,40}$/.test(p.id||'')||!allowedCategories.has(p.category)||!p.name||!p.description)return null;
 if(!Number.isFinite(p.lat)||!Number.isFinite(p.lon)||p.lat<43.7||p.lat>43.95||p.lon<7.6||p.lon>8)return null;
 const img=safe(p.image,imageHosts),source=safe(p.photoPage,['commons.wikimedia.org']);
 if(!img||!source||!p.author||!p.license||!safe(p.licenseUrl,['creativecommons.org']))return null;
 return {...p,image:img,photoPage:source,
    site:safe(p.url,['www.italia.it','rivieradeifiori.travel','www.comune.sanremo.im.it','comune.sanremo.im.it']),
    coordinateSource:safe(p.coordinateSourceUrl,['www.navily.com','cdn.distanzechilometriche.net'])};
}
function mapLink(p){
 return 'https://www.openstreetmap.org/?mlat='+p.lat.toFixed(6)+'&mlon='+p.lon.toFixed(6)+'#map=16/'+p.lat.toFixed(6)+'/'+p.lon.toFixed(6);
}
function embed(p){
 const w=.018,h=.009;
 const bbox=[p.lon-w,p.lat-h,p.lon+w,p.lat+h].map(x=>x.toFixed(6)).join('%2C');
 return 'https://www.openstreetmap.org/export/embed.html?bbox='+bbox+'&layer=mapnik&marker='+encodeURIComponent(p.lat+','+p.lon);
}
function updateMap(){
 const p=places.find(p=>p.id===selected);
 if(!p)return;
 $('mapSpot').textContent=p.name;
 $('mapDescription').textContent=p.subtitle+(p.coordinateNote?' · '+p.coordinateNote:'');
 $('mapExternal').href=mapLink(p);
 if(loadedMap){$('mapFrame').src=embed(p);$('mapFrame').title='Mappa OpenStreetMap: '+p.name}
 document.querySelectorAll('[data-place]').forEach(b=>{const on=b.dataset.place===p.id;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});
}
function placeCard(p){
 const article=el('article','place-card');
 const figure=el('figure','place-photo');
 const img=el('img');img.src=p.image;img.alt=p.imageAlt||'Fotografia reale del territorio di Sanremo: '+p.name;img.loading='lazy';img.decoding='async';img.width=960;img.height=700;
 const figcap=el('figcaption','','Foto: '+p.author+' · '+p.license);
 figure.append(img,figcap);
 const body=el('div','place-card-body');
 const tag=el('span','place-tag',p.tag);
 const title=el('h3','',p.name);
 const subtitle=el('p','place-subtitle',p.subtitle);
 const desc=el('p','',p.description);
 const curiosity=el('p','place-curiosity','Lo sapevi? '+p.curiosity);
 const footer=el('div','place-links');
 const choice=el('button','map-pick','Mostra sulla mappa ↗');choice.type='button';choice.dataset.place=p.id;choice.setAttribute('aria-pressed',String(selected===p.id));choice.addEventListener('click',()=>{selected=p.id;updateMap();$('territoryMap').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'})});
 const credit=el('a','','Foto originale ↗');credit.href=p.photoPage;credit.target='_blank';credit.rel='noopener noreferrer';
 const license=el('a','','Licenza '+p.license+' ↗');license.href=p.licenseUrl;license.target='_blank';license.rel='noopener noreferrer';
 put(footer,choice,credit,license);
 if(p.coordinateSource){const locSource=el('a','','Fonte posizione ↗');locSource.href=p.coordinateSource;locSource.target='_blank';locSource.rel='noopener noreferrer';footer.append(locSource)}
 if(p.site){const source=el('a','','Approfondisci ↗');source.href=p.site;source.target='_blank';source.rel='noopener noreferrer';footer.append(source)}
 put(body,tag,title,subtitle,desc,curiosity,footer);
 return put(article,figure,body);
}
function render(){
 document.querySelectorAll('[data-place-filter]').forEach(b=>{const on=b.dataset.placeFilter===filter;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});
 const found=places.filter(p=>filter==='all'||p.category===filter);
 const grid=$('placesGrid');grid.replaceChildren();
 if(!found.length){grid.append(el('p','territory-empty','Non ci sono luoghi da mostrare per questo filtro.'));return}
 const frag=document.createDocumentFragment();found.forEach(p=>frag.append(placeCard(p)));grid.append(frag);
 $('placesCount').textContent=found.length+' '+(found.length===1?'luogo':'luoghi')+' da esplorare';
 if(!found.some(p=>p.id===selected))selected=found[0].id;
 updateMap();
}
document.querySelectorAll('[data-place-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.placeFilter;render()}));
$('enableMap').addEventListener('click',()=>{
 if(!selected||loadedMap)return;
 loadedMap=true;
 $('mapFrame').hidden=false;$('enableMap').hidden=true;$('mapIntro').hidden=true;
 updateMap();
});
(async()=>{
 try{
  const response=await fetch('./data/sanremo-places.json',{cache:'no-cache'});
  if(!response.ok)throw Error('HTTP '+response.status);
  const payload=await response.json();
  const seen=new Set();
  places=(Array.isArray(payload.places)?payload.places:[]).map(valid).filter(p=>{if(!p||seen.has(p.id))return false;seen.add(p.id);return true});
  if(!places.length)throw Error('Nessun luogo valido');
  const jump=new URLSearchParams(location.search).get('categoria');
  if(allowedCategories.has(jump))filter=jump;
  selected=places[0].id;render();
 }catch{
  $('placesCount').textContent='I luoghi non sono temporaneamente disponibili.';
  $('placesGrid').textContent='Non è stato possibile caricare la guida locale. Riprova oppure visita il portale turismo della Riviera dei Fiori.';
 }
})();
