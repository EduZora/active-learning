/* الإصدار 6.3: تدرج الأمثلة، المقارنة، الملاحظة، القياس المحلي — لا يرسل أي بيانات إلى خادم. */
(()=>{'use strict';
 const STRATEGIES=window.STRATEGIES||[];
 const primaryTopics=window.AL101_PRIMARY_TOPICS||{};
 // Dynamic, content-aware scaffolds: no separate 240 KB duplicate of the original 101 descriptions.
 const methods={
  collab:['يتبادل المتعلمون ملاحظاتهم في مجموعات صغيرة ثم يتفقون على مثال واحد.','تقدّم المجموعة تفسيرًا مشتركًا يظهر مساهمة أعضائها.'],
  thinking:['يفكر كل متعلم أولًا، ثم يشرح فكرته ويقارنها ببديل.','يبرّر المتعلم اختياره ويبيّن سبب تفضيل تفسير على آخر.'],
  assessment:['يعرض كل متعلم إجابته ويراجعها وفق معيار واضح.','يصحّح المتعلم إجابته ويشرح سبب التعديل.'],
  movement:['ينتقل المتعلمون بين المحطات أو الزملاء ويتبادلون إجابات قصيرة.','يسجّل المتعلم فكرة جديدة اكتسبها أثناء التبادل.'],
  reading:['يقرأ المتعلم نصًا قصيرًا أو ينظر إلى رسم ويحدّد المعلومات المهمة.','يسند المتعلم إجابته إلى كلمة أو تفصيل من النص.'],
  organizing:['يرتّب المتعلمون بطاقات أو أفكارًا في مجموعات ذات معنى.','يوضح المتعلم سبب تصنيفه ويصحّح أي تعارض.'],
  creativity:['يقترح المتعلمون حلولًا متنوعة ثم يختارون الأنسب.','يشرح المتعلم الفكرة الجديدة وكيف يمكن تجربتها.'],
  writing:['يدوّن المتعلمون أفكارًا موجزة ثم يراجعونها مع زميل.','يعيد المتعلم صياغة فكرته على نحو أوضح بعد المراجعة.']};
 // Curriculum-aligned *examples*, not copied curriculum questions. Every level uses the
 // same strategy sequence while cognitive demand and evidence are differentiated by age.
 function discipline(subject){
  if(/رياضيات/.test(subject))return 'math';
  if(/اللغة العربية/.test(subject))return 'arabic';
  if(/اللغة الإنجليزية/.test(subject))return 'english';
  if(/الاجتماعية/.test(subject))return 'social';
  if(/حياتية/.test(subject))return 'life';
  return 'science';
 }
 function earlyTask(subject,topic){
  switch(discipline(subject)){
   case 'math':return `استخدم بطاقات أو أشياء ملموسة لتمثيل «${topic}». اعرض مثالًا واحدًا، ثم اشرح كيف تأكدت من الإجابة.`;
   case 'arabic':return `استمع إلى نص قصير أو انظر إلى صورة ترتبط بموضوع «${topic}». استخرج فكرة واحدة وعبر عنها بكلماتك أو برسم مع تعليق.`;
   case 'english':return `انظر إلى بطاقات مصورة حول «${topic}». اختر كلمتين مناسبتين، وانطق كل كلمة أو استخدمها في عبارة قصيرة.`;
   case 'social':return `انظر إلى صورة أو خريطة مبسطة عن «${topic}». حدّد عنصرين تراهما، ثم أخبر زميلًا بما تلاحظه.`;
   case 'life':return `تأمل موقفًا قصيرًا عن «${topic}». اختر تصرفًا مناسبًا، وقل سبب اختيارك بجملة بسيطة.`;
   default:return `شاهد صورة أو رسمًا آمنًا يوضح «${topic}». لاحظ عنصرين، وصنّفهما أو ارسمهما، ثم فسّر فكرتك بجملة واحدة.`;
  }
 }
 function taskForMiddle(s,topic,ex){
  const intro=`في موضوع «${topic}»، انطلق من هذا الموقف: ${ex.prompt||'ما الفكرة التي تريد فهمها؟'}`;
  switch(discipline(ex.subject||'')){
   case 'math': return `${intro} حلّ مثالًا ثم تحقّق من إجابتك بخطوة مستقلة، وقارن طريقة الحل مع زميل.`;
   case 'arabic': return `${intro} استخرج شاهدًا من النص، وناقش كيف يدعم فكرتك مع زميل.`;
   case 'english': return /مفردات/.test(topic)?`${intro} وظّف مفردتين في عبارتين بسيطتين باللغة الإنجليزية، وتحقق من المعنى بالسياق مع زميل.`:`${intro} اكتب استجابة قصيرة باللغة الإنجليزية، وراجع المعنى والمفردات مع زميل.`;
   case 'social': return `${intro} استخدم خريطة أو نصًا موثوقًا أو صورة تاريخية لتفسير إجابتك، ثم قارنها بتفسير آخر.`;
   case 'life': return `${intro} قارن بين خيارين مناسبين، وبرّر قرارك في موقف يومي قريب من بيئة الطلاب.`;
   default:return `${intro} استند إلى مشاهدة أو معلومة علمية مناسبة لعمرك لتفسير الفكرة، وناقش تفسيرك مع زميل.`;
  }
 }
 function taskForUpper(s,topic,ex){
  const situation=`في موضوع «${topic}»: ${ex.prompt||'كيف يمكن تفسير الفكرة؟'}`;
  switch(discipline(ex.subject||'')){
   case 'math':return `${situation} قارن طريقتين للحل من حيث الدقة والكفاءة، وقدّم تبريرًا أو مثالًا مضادًا عند الحاجة.`;
   case 'arabic':return `${situation} قارن تأويلين للنص مستندًا إلى شواهد لغوية محددة، واكتب استنتاجًا يوضح أثر السياق.`;
   case 'english':return /مفردات/.test(topic)?`${situation} استخدم المفردات في موقفين مختلفين باللغة الإنجليزية، وفسّر اختلاف المعنى أو الصياغة بحسب السياق.`:`${situation} قدّم حجة قصيرة باللغة الإنجليزية، واستخدم مثالًا نصيًا واضحًا وراجع دقة التعبير.`;
   case 'social':return `${situation} قارن مصدرين مناسبين للموضوع، وميّز المعلومة المؤكدة من التفسير، وحدّد نقطة تحتاج تحققًا.`;
   case 'life':return `${situation} حلّل نتائج بدائل القرار، ووازن بين المزايا والمخاطر، ثم اقترح اختيارًا مبررًا.`;
   default:return `${situation} فسّر الموقف بدليلين مناسبين، وناقش حدود ما يمكن الاستنتاج منهما أو تفسيرًا بديلًا.`;
  }
 }
 function evidenceFor(level,subject,method,ex){
  const d=discipline(subject);
  if(level==='1-4')return d==='math'?'يُمثّل المتعلم مثالًا صحيحًا ويتحقق منه شفهيًا أو عمليًا.':d==='arabic'||d==='english'?'ينتج المتعلم عبارة مناسبة للموقف ويستطيع شرح معناها.':'يسمي المتعلم ملاحظة أو اختيارًا صحيحًا ويذكر سببًا بسيطًا.';
  if(level==='4-8')return d==='math'?'خطوات حل واضحة مع تحقق مستقل من الناتج.':d==='arabic'||d==='english'?'إجابة ترتبط بفكرة الدرس مع شاهد أو مثال لغوي.':method[1];
  if(d==='math')return 'تبرير رياضي لطريقتين أو تحقق مدعوم بأمثلة.';
  if(d==='arabic'||d==='english')return 'استنتاج مكتوب بشواهد محددة يميّز الدليل من الرأي.';
  return 'استنتاج مرتبط بدليلين، وتوضيح حدود الاستنتاج أو تفسير بديل.';
 }
 function makeGrades(s){
  if(window.BOUSALA_LANG==='en'){
    const ex=s.visual?.example||{},topic=ex.topic||'this lesson',titles=(s.steps||[]).map(x=>x[0]).join(' → ');
    const task=(level)=>`${level}: Use ${s.name} to investigate ${topic}. Ask learners to explain a decision and check its supporting evidence.`;
    const procedure=`Keep the strategy sequence: ${titles}.`;
    return {'1-4':{topic,task:task('Grades 1–4: Use pictures and oral explanations'),procedure,support:'Use pictures, objects, and short questions. Accept oral or drawn responses.',evidence:'A clear observation and a simple reason.'},'4-8':{topic,task:task('Grades 4–8: Discuss and compare explanations'),procedure,support:'Offer vocabulary support and partner discussion.',evidence:'A justified response connected to the lesson objective.'},'9-12':{topic,task:task('Grades 9–12: Evaluate alternative explanations'),procedure,support:'Use credible information, a clear evidence criterion, and opportunities to revise.',evidence:'An evidence-based conclusion and explanation of its limits.'}};
  }
  const ex=s.visual?.example||{}, topic=ex.topic||s.goal, early=primaryTopics[s.id]||topic;
  const method=methods[s.visual?.category]||methods.thinking;
  const titles=(s.steps||[]).slice(0,4).map(step=>step[0]).filter(Boolean);
  const procedure=`طبّق المراحل الأصلية للاستراتيجية بالترتيب: ${titles.join(' ← ')}. ${method[0]}`;
  return {
   '1-4':{topic:early,task:earlyTask(ex.subject||'',early),procedure,support:'اعرض نموذجًا بصريًا، وامنح وقتًا إضافيًا للتفكير. اسمح بإجابة شفهية أو رسم موجّه.',evidence:evidenceFor('1-4',ex.subject||'',method,ex)},
   '4-8':{topic,task:taskForMiddle(s,topic,ex),procedure,support:'وفّر سؤالًا متدرجًا ومنظمًا بصريًا، ثم تعاونًا ثنائيًا أو جماعيًا حسب آلية الاستراتيجية.',evidence:evidenceFor('4-8',ex.subject||'',method,ex)},
   '9-12':{topic,task:taskForUpper(s,topic,ex),procedure,support:'وفّر مصدرًا أو بيانات ذات موثوقية، ومعيارًا للحجة، وفرصة لتفسير بديل أو تحسين الإجابة.',evidence:evidenceFor('9-12',ex.subject||'',method,ex)}
  };
 }
 const BANK=new Map(STRATEGIES.map(s=>[s.id,makeGrades(s)]));
 const OBS_KEY='al101-classroom-observations-v63',LEVELS=['1-4','4-8','9-12'];
 const $=id=>document.getElementById(id), esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const byId=id=>STRATEGIES.find(s=>s.id===Number(id));
 function readObs(){try{const d=JSON.parse(localStorage.getItem(OBS_KEY)||'[]');return Array.isArray(d)?d:[]}catch{return []}}
 function cleanObs(list){return (Array.isArray(list)?list:[]).slice(0,50).filter(o=>o && Number.isInteger(Number(o.strategyId)) && byId(o.strategyId)).map(o=>({strategyId:Number(o.strategyId),date:/^\d{4}-\d{2}-\d{2}$/.test(String(o.date))?String(o.date):'',criteria:(Array.isArray(o.criteria)?o.criteria:[]).slice(0,4).map(x=>['لم يُرصد','في تقدم','متحقق'].includes(x)?x:'لم يُرصد'),note:String(o.note||'').slice(0,500),recordedAt:String(o.recordedAt||'').slice(0,30)}));}
 function saveObs(data){try{localStorage.setItem(OBS_KEY,JSON.stringify(cleanObs(data)));return true}catch{return false}}
 function renderGuide(s){const grades=BANK.get(s.id);if(!grades)return '';
 return `<section class="v63-panel v8-grades-section" aria-label="أمثلة بحسب الصفوف وأدوات المعلم">
   <details class="v8-graded-accordion">
     <summary>أمثلة إضافية بحسب الصفوف (اختياري)</summary>
     <div class="v8-graded-body">
       <p class="v63-disclaimer">اختر الصفّ المناسب لعرض مهمة تطبيقية وتكييفها دون إعادة شرح الخطوات.</p>
       <div class="v63-tier-tabs" role="group" aria-label="اختيار نطاق الصفوف للمثال">${LEVELS.map((k,i)=>`<button type="button" data-tier="${k}" aria-pressed="${i===1}">${k.replace('-', '–')}</button>`).join('')}</div>
       <div class="v63-tier-content" role="region" aria-label="المثال المتدرج" aria-live="polite"></div>
     </div>
   </details>
   <div class="v63-actions"><button type="button" class="btn primary" data-v63-observe="${s.id}">▣ بطاقة ملاحظة الأداء</button><button type="button" class="btn secondary" data-v63-compare-add="${s.id}">⇄ أضف إلى المقارنة</button></div>
 </section>`;}
 function mountGuide(s,root){const tabs=[...root.querySelectorAll('[data-tier]')],panel=root.querySelector('.v63-tier-content'),grades=BANK.get(s.id);if(!panel||!grades)return;
 const show=k=>{const g=grades[k];if(!g)return;tabs.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tier===k)));panel.innerHTML=`<h4>الصفوف ${esc(k.replace('-','–'))} • ${esc(g.topic)}</h4><dl><div><dt>المهمة الصفية</dt><dd>${esc(g.task)}</dd></div><div><dt>الدعم والتمايز</dt><dd>${esc(g.support)}</dd></div><div><dt>دليل تعلّم قابل للملاحظة</dt><dd>${esc(g.evidence)}</dd></div></dl>`;};
 tabs.forEach(b=>b.addEventListener('click',()=>show(b.dataset.tier)));show('4-8');
 root.querySelector('[data-v63-observe]')?.addEventListener('click',()=>openObservation(s.id));
 root.querySelector('[data-v63-compare-add]')?.addEventListener('click',e=>{addToCompare(s.id);e.currentTarget.textContent='✓ أضيفت للمقارنة — انتقل إلى الدليل';});}
 function selectOptions(select){
  const order=window.AL101_DISPLAY_ORDER||STRATEGIES.map(s=>s.id);
  const lookup=new Map(STRATEGIES.map(s=>[s.id,s]));
  select.innerHTML='<option value="">اختر الاستراتيجية</option>'+order.map((id,i)=>{
    const s=lookup.get(id);return s?`<option value="${id}">${i+1} — ${esc(s.name)}</option>`:'';
  }).join('');
 }
 function addToCompare(id){const a=$('compareA'),b=$('compareB');if(!a||!b)return;if(a.value===String(id)||b.value===String(id))return;if(!a.value)a.value=String(id);else b.value=String(id);$('compareStatus').textContent='تمت إضافة الاستراتيجية؛ اختر الثانية ثم اضغط «عرض المقارنة».';}
 function comparison(s){return [['الهدف',s.goal],['الوقت المقترح',s.minutes+' دقيقة'],['طريقة المشاركة',s.visual?.category==='collab'?'تعاون وحوار':(s.visual?.category==='thinking'?'تفكير واستدلال':s.goal)],['الأدوات',(s.tools||[]).join('، ')||'أدوات بسيطة'],['خطوات التنفيذ',s.steps.length+' خطوات: '+s.steps.map(x=>x[0]).join(' ← ')],['دليل تعلم مقترح',s.visual?.example?.outcome||'مؤشر قابل للملاحظة']];}
 function showCompare(){const a=byId($('compareA').value),b=byId($('compareB').value);const status=$('compareStatus');if(!a||!b){status.textContent='اختر استراتيجيتين أولًا.';return}if(a.id===b.id){status.textContent='اختر استراتيجيتين مختلفتين.';return}
 const A=comparison(a),B=comparison(b),body=$('compareBody');body.innerHTML=`<p class="v63-disclaimer">المقارنة استرشادية بحسب توصيف التطبيق، ولا تعني أن إحدى الاستراتيجيتين أفضل دائمًا.</p><div class="v63-compare-wrap"><table><caption>مقارنة ${esc(a.name)} و${esc(b.name)}</caption><thead><tr><th scope="col">الجانب</th><th scope="col">${esc(a.name)}</th><th scope="col">${esc(b.name)}</th></tr></thead><tbody>${A.map((entry,i)=>`<tr><th scope="row">${esc(entry[0])}</th><td>${esc(entry[1])}</td><td>${esc(B[i][1])}</td></tr>`).join('')}</tbody></table></div>`;
 const dlg=$('compareDialog');if(!dlg.open)dlg.showModal();$('closeCompare').focus();status.textContent='';}
 const indicators=['فهم المطلوب والمبادرة بالمشاركة','التعاون والاستماع واحترام الدور','تفسير الفكرة باستخدام دليل ملائم','تقديم ناتج يحقق هدف النشاط'];
 let observationId=null;
 function openObservation(id){const s=byId(id),dlg=$('observationDialog');if(!s||!dlg)return;observationId=s.id;$('observationName').textContent=s.name;$('observationDate').value=new Date().toISOString().slice(0,10);
 $('observationCriteria').innerHTML=indicators.map((text,i)=>`<label class="v63-criterion"><span>${i+1}. ${esc(text)}</span><select data-obs-index="${i}" aria-label="مستوى ${esc(text)}"><option>لم يُرصد</option><option>في تقدم</option><option>متحقق</option></select></label>`).join('');$('observationNote').value='';$('observationMessage').textContent='';const saved=readObs().filter(x=>x.strategyId===s.id);$('observationHistory').textContent=saved.length?`لديك ${saved.length} ملاحظة محفوظة محليًا لهذه الاستراتيجية.`:'لا توجد ملاحظات محفوظة لهذه الاستراتيجية.';
 if(!dlg.open)dlg.showModal();$('observationCriteria').querySelector('select')?.focus();}
 function collectObservation(){return {strategyId:observationId,date:$('observationDate').value,criteria:[...$('observationCriteria').querySelectorAll('select')].map(x=>x.value),note:$('observationNote').value.slice(0,500),recordedAt:new Date().toISOString()}}
 function saveObservation(){const list=readObs();list.unshift(collectObservation());if(!saveObs(list.slice(0,50))){$('observationMessage').textContent='تعذّر الحفظ في هذا المتصفح؛ يمكن طباعة البطاقة بدلًا من ذلك.';return}$('observationMessage').textContent='✓ حُفظت بطاقة الملاحظة محليًا على جهازك.';$('observationHistory').textContent=`لديك ${readObs().filter(x=>x.strategyId===observationId).length} ملاحظات محفوظة لهذه الاستراتيجية.`;}
 const performance={lcp:null,cls:0,inp:null};
 function observeVitals(){if(!('PerformanceObserver' in window))return;
  const types=PerformanceObserver.supportedEntryTypes||[];
  if(types.includes('largest-contentful-paint'))try{new PerformanceObserver(list=>{const e=list.getEntries().at(-1);if(e)performance.lcp=e.startTime}).observe({type:'largest-contentful-paint',buffered:true})}catch{}
  if(types.includes('layout-shift'))try{new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)performance.cls+=e.value}).observe({type:'layout-shift',buffered:true})}catch{}
  if(types.includes('event'))try{new PerformanceObserver(list=>{const max=new Map();for(const e of list.getEntries())if(e.interactionId)max.set(e.interactionId,Math.max(e.duration,max.get(e.interactionId)||0));performance.inp=Math.max(performance.inp||0,...max.values())}).observe({type:'event',buffered:true,durationThreshold:40})}catch{}
 }
 function renderPerformance(){const info=$('performanceStatus');if(!info)return;const f=(v,d)=>v==null?'غير متاح في هذا المتصفح':Number(v).toFixed(d);
 info.textContent=`LCP: ${performance.lcp==null?'غير متاح':f(performance.lcp/1000,2)+' ث'} — CLS: ${f(performance.cls,3)} — INP: ${performance.inp==null?'لا توجد تفاعلات مقاسة بعد':f(performance.inp,0)+' مللي ثانية'}. هذه قيم محلية أثناء الجلسة وليست تدقيقًا شاملًا أو نتيجة لجميع المستخدمين.`;}
 function setup(){selectOptions($('compareA'));selectOptions($('compareB'));$('compareStart').addEventListener('click',showCompare);$('compareA').addEventListener('change',()=>{$('compareStatus').textContent='';});$('compareB').addEventListener('change',()=>{$('compareStatus').textContent='';});
 $('closeCompare').addEventListener('click',()=>$('compareDialog').close());$('compareDialog').addEventListener('click',e=>{if(e.target===$('compareDialog'))e.target.close();});
 $('closeObservation').addEventListener('click',()=>$('observationDialog').close());$('observationDialog').addEventListener('click',e=>{if(e.target===$('observationDialog'))e.target.close();});
 $('saveObservation').addEventListener('click',saveObservation);$('printObservation').addEventListener('click',()=>window.print());$('performanceCheck').addEventListener('click',renderPerformance);observeVitals();}
 window.AL101_V63={renderGuide,mountGuide,getGradedExamples:makeGrades,addToCompare,openObservation,getObservations:()=>cleanObs(readObs()),setObservations:saveObs,cleanObservations:cleanObs};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();
