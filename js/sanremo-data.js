// Pure client-side data validation and filtering. No credentials, tracking or remote submission.
export const CATEGORIES = Object.freeze({
  musica:'Musica',teatro:'Teatro e spettacoli',cultura:'Cultura e visite',gusto:'Enogastronomia',tradizioni:'Tradizioni',sport:'Sport'
});
const DATE=/^\d{4}-\d{2}-\d{2}$/;
const HOSTS=new Set(['www.comune.sanremo.im.it','comune.sanremo.im.it']);
const IMAGE_HOSTS=new Set(['commons.wikimedia.org','upload.wikimedia.org']);
export function safeUrl(input,hosts=HOSTS){
  try{const u=new URL(input);return u.protocol==='https:'&&hosts.has(u.hostname)?u.href:null}catch{return null}
}
export function validateEvent(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
  const {id,title,category,start,end,location,description,sourceUrl}=raw;
  if(!/^[a-z\d-]{3,90}$/i.test(id||'')||!title||String(title).length>180||!Object.hasOwn(CATEGORIES,category))return null;
  if(!DATE.test(start||'')||!DATE.test(end||'')||Number.isNaN(Date.parse(start))||Number.isNaN(Date.parse(end))||end<start)return null;
  if(!location||!description||String(description).length>700||!safeUrl(sourceUrl))return null;
  if(raw.status!=='confermato'||!raw.verifiedOn||!DATE.test(raw.verifiedOn))return null;
  return {id,title:String(title),category,start,end,location:String(location),description:String(description),time:String(raw.time||''),sourceUrl:safeUrl(sourceUrl),photo:safeUrl(raw.photo,IMAGE_HOSTS),imageCredit:String(raw.imageCredit||''),publisher:'Comune di Sanremo',verifiedOn:raw.verifiedOn,endDateTime:raw.endDateTime||null};
}
export function cleanEvents(rows){
  const map=new Map();
  for(const raw of Array.isArray(rows)?rows:[]){
    const e=validateEvent(raw);if(!e)continue;
    const unique=e.id+'|'+e.start;const existing=map.get(unique);
    if(!existing||existing.verifiedOn<e.verifiedOn)map.set(unique,e);
  }
  return [...map.values()].sort((a,b)=>a.start.localeCompare(b.start)||a.title.localeCompare(b.title,'it'));
}
export function romeToday(now=new Date()){
  const f=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'});
  const x=Object.fromEntries(f.formatToParts(now).map(p=>[p.type,p.value]));
  return x.year+'-'+x.month+'-'+x.day;
}
export function isFinished(e,now=new Date()){
  const today=romeToday(now);
  if(e.end<today)return true;if(e.end>today)return false;
  return !!(e.endDateTime&&Date.parse(e.endDateTime)<now.getTime());
}
export function filterEvents(events,{period='upcoming',category='all',year=null,month=null,query='',now=new Date()}={}){
  const q=query.trim().toLocaleLowerCase('it');
  return events.filter(e=>(category==='all'||e.category===category)&&
    (period==='all'||(period==='archive'?isFinished(e,now):!isFinished(e,now)))&&
    (!year||e.start.slice(0,4)===String(year)||e.end.slice(0,4)===String(year))&&
    (month===null||month===undefined||(e.start.slice(0,7)<=String(year)+'-'+String(month).padStart(2,'0')&&e.end.slice(0,7)>=String(year)+'-'+String(month).padStart(2,'0')))&&
    (!q||[e.title,e.description,e.location].some(v=>v.toLocaleLowerCase('it').includes(q))));
}
export function monthCounts(events,year){
  return Array.from({length:12},(_,i)=>{
    const key=String(year)+'-'+String(i+1).padStart(2,'0');
    return events.filter(e=>e.start.slice(0,7)<=key&&e.end.slice(0,7)>=key).length;
  });
}
