import {CATEGORIES,cleanEvents,filterEvents,monthCounts,romeToday,isFinished} from './sanremo-data.js';
const $=id=>document.getElementById(id);
const monthNames=['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
const state={events:[],period:'upcoming',category:'all',year:null,month:null,query:''};
const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
const append=(parent,...children)=>{for(const c of children)parent.append(c);return parent};
const dayLabel=s=>new Intl.DateTimeFormat('it-IT',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(s+'T12:00:00Z'));
const rangeLabel=e=>e.start===e.end?dayLabel(e.start):dayLabel(e.start)+' — '+dayLabel(e.end);
const image=e=>{
  const fig=node('figure','territory-card-image');
  if(e.photo){const img=node('img');img.src=e.photo;img.alt='Fotografia di Sanremo usata come immagine di contesto, non locandina dell’evento';img.loading='lazy';img.decoding='async';img.width=960;img.height=650;append(fig,img)}
  else append(fig,node('span','territory-placeholder','Sanremo · Riviera dei Fiori'));
  return fig;
};
function card(e){
  const a=node('article','event-card');
  const picture=image(e);
  const content=node('div','event-card-body');
  const top=node('div','event-card-meta');
  const cat=node('span','category-tag',CATEGORIES[e.category]);
  const status=node('span',isFinished(e)?'event-ended':'event-upcoming',isFinished(e)?'Concluso':'In programma');
  append(top,cat,status);
  const title=node('h3','',e.title), date=node('p','event-date',rangeLabel(e)+(e.time?' · '+e.time:''));
  const place=node('p','event-place','◉ '+e.location);
  const desc=node('p','event-description',e.description);
  const footer=node('div','event-card-footer');
  const source=node('a','event-source','Scheda ufficiale ↗');source.href=e.sourceUrl;source.target='_blank';source.rel='noopener noreferrer';
  const sourceDate=node('small','','Verificato il '+dayLabel(e.verifiedOn));append(footer,source,sourceDate);
  append(content,top,title,date,place,desc,footer);
  if(e.imageCredit)append(content,node('small','image-credit','Foto di contesto · '+e.imageCredit));
  return append(a,picture,content);
}
function empty(message){
 const n=node('div','territory-empty');append(n,node('h3','','Nessun appuntamento trovato'),node('p','',message),node('a','text-link','Consulta gli eventi sul sito del Comune ↗'));
 const a=n.querySelector('a');a.href='https://www.comune.sanremo.im.it/it/eventi';a.rel='noopener noreferrer';a.target='_blank';
 return n;
}
function fillCalendar(){
 const year=Number($('eventYear').value||new Date().getFullYear());
 const counts=monthCounts(state.events,year);
 const parent=$('monthGrid');parent.replaceChildren();
 const all=node('button',state.month===null?'month-tab active':'month-tab','Tutto l’anno');
 all.type='button';all.setAttribute('aria-pressed',state.month===null?'true':'false');
 all.addEventListener('click',()=>{state.month=null;state.year=null;$('eventYear').value='';render()});
 parent.append(all);
 monthNames.forEach((m,i)=>{
   const b=node('button',state.month===i+1?'month-tab active':'month-tab');
   b.type='button';b.setAttribute('aria-pressed',String(state.month===i+1));
   append(b,node('span','',m.slice(0,3)),node('small','',String(counts[i])));
   b.addEventListener('click',()=>{state.month=i+1;state.year=year;render()});parent.append(b);
 });
}
function render(){
 fillCalendar();
 document.querySelectorAll('[data-period]').forEach(b=>{const on=b.dataset.period===state.period;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});
 const matches=filterEvents(state.events,state);
 $('eventsCount').textContent=matches.length+' '+(matches.length===1?'evento':'eventi')+' in questa selezione';
 const grid=$('eventList');grid.replaceChildren();
 if(!matches.length)grid.append(empty('Prova un altro mese o categoria. Gli appuntamenti senza data confermata non vengono inseriti come eventi in programma.'));
 else{const fragment=document.createDocumentFragment();matches.forEach(e=>fragment.append(card(e)));grid.append(fragment)}
 const upcoming=filterEvents(state.events,{period:'upcoming'}).slice(0,3);
 const highlight=$('eventHighlights');highlight.replaceChildren();
 if(!upcoming.length)highlight.append(empty('Non risultano appuntamenti futuri nel dataset verificato. Controlla il calendario del Comune.'));
 else upcoming.forEach(e=>{
   const li=node('article','event-teaser');
   append(li,node('span','event-teaser-date',dayLabel(e.start)),node('h3','',e.title),node('p','',e.location));
   const l=node('a','inline-arrow','Fonte ufficiale ↗');l.href=e.sourceUrl;l.target='_blank';l.rel='noopener noreferrer';li.append(l);highlight.append(li);
 });
}
async function init(){
 const today=romeToday();
 $('todayLabel').textContent='Oggi '+dayLabel(today);
 $('eventYear').innerHTML='<option value="">Tutti gli anni</option>';
 const current=Number(today.slice(0,4));
 for(let y=current-1;y<=current+3;y++){$('eventYear').add(new Option(String(y),String(y)))}
 $('eventYear').value='';
 document.querySelectorAll('[data-period]').forEach(b=>b.addEventListener('click',()=>{state.period=b.dataset.period;render()}));
 $('eventCategory').addEventListener('change',e=>{state.category=e.target.value;render()});
 $('eventSearch').addEventListener('input',e=>{state.query=e.target.value;render()});
 $('eventYear').addEventListener('change',e=>{state.year=e.target.value?Number(e.target.value):null;state.month=null;render()});
 try{
  const response=await fetch('./data/sanremo-events.json',{cache:'no-cache'});
  if(!response.ok)throw Error('HTTP '+response.status);
  const payload=await response.json();
  state.events=cleanEvents(payload.events);
  if(payload.updatedAt){
    const date=new Date(payload.updatedAt);
    $('lastChecked').textContent='Ultimo controllo editoriale: '+new Intl.DateTimeFormat('it-IT',{dateStyle:'long',timeZone:'Europe/Rome'}).format(date);
    if(Date.now()-date.getTime()>14*86400000){$('staleWarning').hidden=false}
  }
  render();
 }catch{
  $('eventsCount').textContent='Agenda momentaneamente non disponibile';
  $('eventList').replaceChildren(empty('Non è stato possibile caricare i dati locali. Puoi consultare direttamente il calendario ufficiale.'));
  $('eventHighlights').replaceChildren(empty('Aggiornamento non disponibile.'));
  fillCalendar();
 }
}
init();
