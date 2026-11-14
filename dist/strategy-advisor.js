/* Active Learning Compass — purpose-based advisory selector.
 * Curated choices are editorial, not evidence tiers or efficacy rankings.
 * Keeps all 122 strategy entries and never changes current filters or saved user data.
 */
(function(){
 'use strict';
 const el=id=>document.getElementById(id), lang=window.BOUSALA_LANG==='en'?'en':'ar';
 const en=lang==='en';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 // Entry IDs are stable and cross-reference the provided curriculum review's selector.
 const PURPOSES=[
  {id:'prior',ar:'معرفة الخبرات السابقة',en:'Find prior knowledge',ids:[62,43,20,64,115]},
  {id:'misconception',ar:'كشف التصورات البديلة وتصحيحها',en:'Address misconceptions',ids:[112,20,103,122]},
  {id:'build',ar:'بناء فهم جديد',en:'Build new understanding',ids:[107,109,13,57,59,31]},
  {id:'read',ar:'فهم النصوص المقروءة',en:'Read and comprehend',ids:[76,84,79,69,74]},
  {id:'practice',ar:'التدرب على مهارة',en:'Practise a skill',ids:[105,40,8,117,70]},
  {id:'transfer',ar:'تطبيق المعرفة ونقل أثرها',en:'Apply and transfer knowledge',ids:[102,27,113,111,119]},
  {id:'discussion',ar:'الحوار والحجاج بالأدلة',en:'Discuss using evidence',ids:[24,119,12,45]},
  {id:'review',ar:'المراجعة واسترجاع التعلم',en:'Review and retrieve learning',ids:[106,47,52,54,70]},
  {id:'assess',ar:'تقويم الفهم بسرعة',en:'Quickly assess understanding',ids:[17,70,104,86,11]},
  {id:'reflect',ar:'التلخيص والتأمل',en:'Summarise and reflect',ids:[99,95,110,41,25]},
  {id:'create',ar:'توليد الأفكار والإبداع',en:'Generate and create',ids:[115,73,46,72]}
 ];
 const catalog=new Map((window.STRATEGIES||[]).map(s=>[s.id,s]));
 const purpose=el('recPurpose'),grade=el('recGrade'),time=el('recTime'),button=el('recFind'),results=el('recResults');
 if(!purpose||!grade||!time||!button||!results)return;
 const label=x=>x[lang];
 for(const x of PURPOSES){const o=document.createElement('option');o.value=x.id;o.textContent=label(x);purpose.appendChild(o)}
 const message=txt=>{results.innerHTML='';const p=document.createElement('p');p.className='decision-guide-hint';p.textContent=txt;results.appendChild(p)};
 const strategyLink=id=>{
   try { if(window.BOUSALA_LINKS?.strategy)return window.BOUSALA_LINKS.strategy(id,window.BOUSALA_LANG);
   const url=new URL(window.location.href);url.searchParams.set('strategy',String(id));return url.href; }
   catch { return `${en?'index-en.html':'index-ar.html'}?strategy=${encodeURIComponent(id)}`; }
 };
 function recommend(){
  const criterion=PURPOSES.find(x=>x.id===purpose.value);
  if(!criterion){message(en?'Choose a lesson purpose first.':'اختر هدف الدرس أولًا.');purpose.focus();return}
  const band=grade.value,minutes=Number(time.value)||null;
  const options=criterion.ids.map((id,order)=>{
    const s=catalog.get(id);if(!s)return null;
    const eligible=(s.stages||[]).includes(band)||!band;
    const duration=Number(s.minutes)||0;
    // Prefer the selected purpose first, then time and suggested grade; no evidence-strength score.
    const inTime=!minutes||duration<=minutes;
    const distance=minutes?Math.max(0,duration-minutes):0;
    const score=(inTime?40:0)+(eligible?20:0)-distance*4-order;
    return {s,score,inTime,eligible};
  }).filter(Boolean).sort((a,b)=>b.score-a.score).slice(0,4);
  results.replaceChildren();
  const heading=document.createElement('p');heading.className='decision-guide-summary';heading.textContent=en?'Suggestions for this lesson purpose:':'استراتيجيات مقترحة لهذا الهدف:';results.appendChild(heading);
  const list=document.createElement('div');list.className='decision-guide-cards';
  for(const {s,inTime,eligible} of options){
    const card=document.createElement('article');card.className='decision-guide-card';
    const title=document.createElement('h4');title.textContent=s.name;
    const meta=document.createElement('p');meta.className='decision-guide-meta';meta.textContent=`${s.minutes} ${en?'min':'دقيقة'} · ${s.steps.length} ${en?'steps':'خطوات'}`;
    const desc=document.createElement('p');desc.className='decision-guide-description';desc.textContent=s.summary;
    const note=document.createElement('p');note.className='decision-guide-note';
    const notes=[];
    if(inTime&&minutes)notes.push(en?'Fits the selected time estimate':'ضمن الوقت الإرشادي');
    else if(minutes)notes.push(en?'May need extra time or adaptation':'قد تحتاج وقتًا إضافيًا أو تكييفًا');
    if(band)notes.push(eligible?(en?'Listed for the selected grade band':'مقترحة للمرحلة المختارة'):(en?'Adapt for the selected grade band':'يحتاج تكييفًا للمرحلة المختارة'));
    note.textContent=notes.join(' · ');
    const a=document.createElement('a');a.className='decision-guide-open';a.href=strategyLink(s.id);a.textContent=en?'Open strategy guide':'افتح دليل الاستراتيجية';
    card.append(title,meta,desc,note,a);list.appendChild(card);
  }
  results.appendChild(list);
  const disclaimer=document.createElement('p');disclaimer.className='decision-guide-footnote';disclaimer.textContent=en?
   'Suggested grade bands and durations are flexible estimates. The list is a starting point, not a scientific ranking; check your learning goal and classroom needs.':
   'الصفوف والأوقات ترشيحات مرنة وليست قيودًا، والقائمة نقطة بداية وليست ترتيبًا علميًا؛ راجع ناتج التعلم وظروف الصف.';
  results.appendChild(disclaimer);
 }
 button.addEventListener('click',recommend);
 purpose.addEventListener('change',()=>{if(purpose.value)recommend()});
 grade.addEventListener('change',()=>{if(purpose.value)recommend()});
 time.addEventListener('change',()=>{if(purpose.value)recommend()});
 window.BOUSALA_ADVISOR={purposes:PURPOSES.map(({id,ids})=>({id,ids:[...ids]})),recommend};
})();
