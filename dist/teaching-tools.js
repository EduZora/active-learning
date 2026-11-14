/* Active Learning Compass — success-criteria assessment card.
 * One opt-in, locally saved checklist per strategy; no personal data fields.
 * Does not modify the old observation histories, favourites or lesson plans.
 */
(function(){
 'use strict';
 const KEY='bousla-success-criteria-v1';
 const en=()=>window.BOUSALA_LANG==='en';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const getAll=()=>{try{const x=JSON.parse(localStorage.getItem(KEY)||'{}');return x&&typeof x==='object'&&!Array.isArray(x)?x:{}}catch{return {}}};
 const find=id=>(window.STRATEGIES||[]).find(x=>x.id===Number(id));
 const scales=()=>en()?['Not observed','Developing','Met']:['لم يُرصد','قيد التقدم','متحقق'];
 const typeLabel=()=>en()?'Achievement status':'حالة التحقق';
 const records=()=>getAll();
 function renderAssessment(s){
   const criteria=s.qualityGuide?.success;
   if(!Array.isArray(criteria)||!criteria.length)return '';
   const current=getAll()[String(s.id)],statuses=Array.isArray(current?.levels)?current.levels:[];
   const labels=scales();
   return `<section class="assessment-card" data-success-id="${s.id}" aria-label="${en()?'Success-criteria assessment card':'بطاقة تقويم معايير النجاح'}">
     <div class="assessment-title-row"><div><span class="assessment-eyebrow">${en()?'Practical classroom tool':'أداة صفية عملية'}</span><h3>${en()?'Success-criteria checklist':'بطاقة تقويم معايير النجاح'}</h3><p>${en()?'Mark what you observed; the result stays on this device until you choose to save it.':'حدّد ما لاحظته، ولن تُحفظ النتائج على الجهاز إلا عند الضغط على «حفظ». '}</p></div><span aria-hidden="true" class="assessment-symbol">✓</span></div>
     <div class="assessment-criteria">${criteria.slice(0,4).map((item,i)=>`<label class="assessment-criterion"><span>${i+1}. ${esc(item)}</span><select data-success-level="${i}" aria-label="${typeLabel()} — ${esc(item)}">${labels.map((label,j)=>`<option value="${j}" ${String(statuses[i]??0)===String(j)?'selected':''}>${label}</option>`).join('')}</select></label>`).join('')}</div>
     <label class="assessment-note-label">${en()?'Teacher note (optional)':'ملاحظة المعلم (اختياري)'}<textarea rows="2" maxlength="500" data-success-note placeholder="${en()?'What should happen next?':'ما الخطوة التالية بعد التقويم؟'}">${esc(current?.note||'')}</textarea></label>
     <div class="assessment-card-actions"><button type="button" class="btn primary" data-success-save>${en()?'Save locally':'حفظ على الجهاز'}</button><button type="button" class="btn secondary" data-success-copy>${en()?'Copy assessment':'نسخ ملخص التقويم'}</button><button type="button" class="btn secondary" data-success-clear>${en()?'Clear current choices':'مسح الاختيارات'}</button></div>
     <p class="assessment-status" data-success-status role="status" aria-live="polite">${current?(en()?'A previous assessment was loaded from this device.':'تم استرجاع آخر بطاقة محفوظة على هذا الجهاز.'):(en()?'No assessment is stored for this strategy.':'لا توجد بطاقة محفوظة لهذه الاستراتيجية.')}</p>
     <p class="assessment-privacy">${en()?'Local-only checklist. Do not enter students’ full names or sensitive information. This is formative feedback, not a grade.':'بطاقة محلية للاسترشاد والتغذية الراجعة، وليست درجة نهائية. يُرجى عدم إدخال أسماء الطلاب أو بيانات حساسة.'}</p>
   </section>`;
 }
 function capture(box){
   const id=Number(box.dataset.successId),s=find(id);if(!s)return null;
   return {id,criteria:(s.qualityGuide?.success||[]).slice(0,4),levels:[...box.querySelectorAll('[data-success-level]')].map(x=>Number(x.value)),note:(box.querySelector('[data-success-note]')?.value||'').slice(0,500),language:en()?'en':'ar',recordedAt:new Date().toISOString()};
 }
 function textSummary(box){
   const x=capture(box),s=find(x?.id);if(!x||!s)return '';
   const labels=scales();return `${s.name}\n${en()?'Success-criteria assessment':'بطاقة تقويم معايير النجاح'}\n${x.criteria.map((v,i)=>`${i+1}. ${v}: ${labels[x.levels[i]]||labels[0]}`).join('\n')}\n${x.note?(en()?'Note: ':'ملاحظة: ')+x.note+'\n':''}${en()?'Formative guidance; adapt to the lesson.':'تقويم تكويني إرشادي قابل للتكييف.'}`;
 }
 async function copyText(value){
  if(navigator.clipboard?.writeText){try{await navigator.clipboard.writeText(value);return true}catch{}}
  const ta=document.createElement('textarea');ta.value=value;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();let ok=false;try{ok=document.execCommand('copy')}catch{}ta.remove();return ok;
 }
 document.addEventListener('click',async event=>{
  const btn=event.target.closest('button[data-success-save],button[data-success-copy],button[data-success-clear]');if(!btn)return;
  const box=btn.closest('[data-success-id]');if(!box)return;
  const status=box.querySelector('[data-success-status]');
  if(btn.hasAttribute('data-success-save')){
    const x=capture(box);if(!x)return;
    try{const all=getAll();all[String(x.id)]=x;localStorage.setItem(KEY,JSON.stringify(all));status.textContent=en()?'Saved on this device.':'✓ حُفظت بطاقة التقويم على هذا الجهاز.'}
    catch{status.textContent=en()?'Storage is unavailable; use Copy assessment instead.':'تعذر الحفظ؛ يمكنك نسخ ملخص التقويم بدلًا من ذلك.'}
  }else if(btn.hasAttribute('data-success-copy')){
    const ok=await copyText(textSummary(box));status.textContent=ok?(en()?'Assessment copied.':'✓ نُسخ ملخص التقويم.'):(en()?'Copy is unavailable in this browser.':'تعذّر النسخ تلقائيًا في هذا المتصفح.');
  }else if(btn.hasAttribute('data-success-clear')){
    box.querySelectorAll('[data-success-level]').forEach(x=>x.value='0');const n=box.querySelector('[data-success-note]');if(n)n.value='';status.textContent=en()?'Choices cleared but saved data remains until you save again.':'مُسحت الاختيارات الظاهرة فقط؛ تظل النسخة المحفوظة حتى تحفظ مجددًا.';
  }
 });
 window.BOUSALA_TEACHING={renderAssessment,getSavedAssessments:records};
})();
