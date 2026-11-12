/* مخطط الحصة العُماني المحلي: لا يتصل بخادم أو خدمة خارجية. */
(() => {
  'use strict';
  const byId=id=>document.getElementById(id);
  const grades=['الأول','الثاني','الثالث','الرابع','الخامس','السادس','السابع','الثامن','التاسع','العاشر','الحادي عشر','الثاني عشر'];
  // فئات المواد لتسهيل الاختيار، وليست فهرسًا معتمدًا لعناوين الدروس.
  const common=['اللغة العربية','اللغة الإنجليزية','الرياضيات','التربية الإسلامية'];
  const all=['العلوم','الأحياء','الكيمياء','الفيزياء','الدراسات الاجتماعية','التاريخ','الجغرافيا','اللغة العربية','اللغة الإنجليزية','الرياضيات','التربية الإسلامية','المهارات الحياتية','تقنية المعلومات','الفنون التشكيلية','الرياضة المدرسية','المهارات الموسيقية'];
  const scientific=['الأحياء','الكيمياء','الفيزياء'];
  let selected=null, generated=null, lastSignature='';
  const fields=['lessonTitle','lessonSubject','lessonGrade','lessonObjective','lessonSemester','lessonTime','lessonUnit','lessonResources','lessonNotes'];
  function values(){return Object.fromEntries(fields.map(k=>[k,String(byId(k)?.value||'').trim()]));}
  function signature(){return JSON.stringify({strategyId:selected?.id,...values()});}
  function planLabel(text){byId('lessonPlanOrigin').textContent=text;}
  function setStatus(text){byId('lessonPlanStatus').textContent=text;}
  function chooseGrade(){
    const s=byId('lessonGrade');if(!s)return;
    s.innerHTML='<option value="">اختر الصف من 1 إلى 12</option>';
    grades.forEach((g,i)=>{const o=document.createElement('option');o.value=`الصف ${g}`;o.textContent=(window.BOUSALA_LANG==='en'?`Grade ${i+1}`:`الصف ${g}`);s.append(o);});
  }
  function chooseSubjects(preserved=''){
    const gr=byId('lessonGrade').value;
    const n=grades.findIndex(g=>gr===`الصف ${g}`)+1;
    let options=[];
    if(n>=1&&n<=4)options=[...common,'العلوم','الدراسات الاجتماعية','المهارات الحياتية','تقنية المعلومات','الفنون التشكيلية','الرياضة المدرسية','المهارات الموسيقية'];
    else if(n>=5&&n<=10)options=[...common,'العلوم','الدراسات الاجتماعية','المهارات الحياتية','تقنية المعلومات','الفنون التشكيلية','الرياضة المدرسية'];
    else if(n>=11)options=[...common,...scientific,'الدراسات الاجتماعية','التاريخ','الجغرافيا','تقنية المعلومات','الفنون التشكيلية'];
    else options=all;
    const select=byId('lessonSubject');select.replaceChildren();
    const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent=window.BOUSALA_LANG==='en'?'Choose a subject':'اختر المادة الدراسية';select.append(placeholder);
    options=[...new Set(options)];
    for(const x of options){const o=document.createElement('option');o.value=x;o.textContent=window.BOUSALA_LANG==='en'?({"اللغة العربية":"Arabic Language","اللغة الإنجليزية":"English Language","الرياضيات":"Mathematics","التربية الإسلامية":"Islamic Education","العلوم":"Science","الدراسات الاجتماعية":"Social Studies","الأحياء":"Biology","الكيمياء":"Chemistry","الفيزياء":"Physics","التاريخ":"History","الجغرافيا":"Geography","المهارات الحياتية":"Life Skills","تقنية المعلومات":"Information Technology","الفنون التشكيلية":"Visual Arts","الرياضة المدرسية":"Physical Education","المهارات الموسيقية":"Music Skills"}[x]||x):x;select.append(o);}
    const other=document.createElement('option');other.value='مادة أخرى';other.textContent=window.BOUSALA_LANG==='en'?'Other subject (add details below)':'مادة أخرى (اكتبها ضمن اعتبارات التنفيذ)';select.append(other);
    select.value=options.includes(preserved)?preserved:'';
  }
  function safeText(text,max=500){return String(text||'').trim().slice(0,max);}
  function localPlan(){
    if(!selected)return '';
    if(window.BOUSALA_LANG==='en'){
      const v=values();const time=Math.min(90,Math.max(10,Number(v.lessonTime)||40));const listed=Array.isArray(selected.steps)?selected.steps:[];
      const warm=Math.min(5,Math.max(2,Math.round(time*.12)));const exit=Math.min(5,Math.max(2,Math.round(time*.12)));
      const activity=time-warm-exit;const portions=listed.map((_,i)=>Math.floor(activity/listed.length)+(i<activity%listed.length?1:0));
      const grd=['الأول','الثاني','الثالث','الرابع','الخامس','السادس','السابع','الثامن','التاسع','العاشر','الحادي عشر','الثاني عشر'].findIndex(g=>v.lessonGrade==='الصف '+g)+1;
      const subjects={'اللغة العربية':'Arabic Language','اللغة الإنجليزية':'English Language','الرياضيات':'Mathematics','التربية الإسلامية':'Islamic Education','العلوم':'Science','الدراسات الاجتماعية':'Social Studies','الأحياء':'Biology','الكيمياء':'Chemistry','الفيزياء':'Physics','التاريخ':'History','الجغرافيا':'Geography','المهارات الحياتية':'Life Skills','تقنية المعلومات':'Information Technology','الفنون التشكيلية':'Visual Arts','الرياضة المدرسية':'Physical Education','المهارات الموسيقية':'Music Skills'};
      const subject=subjects[v.lessonSubject]||v.lessonSubject||'Subject not specified';
      const activities=listed.map(([label,desc],i)=>`${i+1}. ${label} (about ${portions[i]} min): ${desc}\n   Lesson link: connect this step to the concepts in “${v.lessonTitle||'the chosen lesson'}” and ask students to explain their reasoning.`);
      return ['ACTIVE LEARNING COMPASS — EDITABLE LESSON OUTLINE',`Teacher-selected strategy: ${selected.name}`,`Curriculum context: Sultanate of Oman • Grade ${grd||'not selected'} • ${subject} • Semester ${v.lessonSemester==='الثاني'?'2':'1'}`,`Unit/theme: ${v.lessonUnit||'Verify in the textbook'}`,`Lesson: ${v.lessonTitle||'Enter the lesson title from the official textbook'}`,`Learning objective: ${v.lessonObjective||'State an observable, measurable objective'}`,`Time available: ${time} minutes (suggested allocation)`,`Materials: ${v.lessonResources||selected.tools?.join(', ')||'Available classroom materials'}`,v.lessonNotes?`Teaching considerations: ${v.lessonNotes}`:'',`Warm-up (${warm} min): Ask an opening question to activate prior knowledge.`,'Steps for applying the chosen strategy:',...activities,'Visible learning outcome: A reasoned explanation, written response, or student product linked to the lesson.',`Final formative assessment (${exit} min): Ask each student to justify an answer or submit a short exit ticket.`,'Optional creative adaptation: Use relevant examples from the Omani context when educationally appropriate.','Important: This is a suggested plan, not an official curriculum document. Verify lesson content and adapt to your class.'].filter(Boolean).join('\n\n');
    }

    const v=values();
    const title=v.lessonTitle||'يُدخل المعلم عنوان الدرس كما في الكتاب';
    const subject=v.lessonSubject||'تُختار المادة';
    const grade=v.lessonGrade||'يُختار الصف';
    const mins=Math.min(90,Math.max(10,Number(v.lessonTime)||40));
    const warm=Math.min(5,Math.max(2,Math.round(mins*.12)));const exit=Math.min(5,Math.max(2,Math.round(mins*.12)));
    const steps=Array.isArray(selected.steps)?selected.steps:[];
    const active=mins-warm-exit;const portions=steps.map((_,i)=>Math.floor(active/steps.length)+(i<active%steps.length?1:0));
    const activities=steps.map(([label,description],idx)=>`${idx+1}. ${label} (نحو ${portions[idx]} دقائق): ${description}\n   ربط مقترح بالدرس: وجّه الطلبة إلى استخدام مفاهيم «${title}» في هذه الخطوة، مع تبرير استنتاجاتهم.`);
    return [
      'بوصلة التعلّم النشط | تصور أولي قابل للتعديل',
      `الاستراتيجية التي اختارها المعلم: ${selected.name}`,
      `سياق المنهج: سلطنة عُمان • ${grade} • ${subject} • الفصل ${v.lessonSemester||'الأول'}`,
      `الوحدة: ${v.lessonUnit||'تُحدَّد من الكتاب المدرسي'}`,
      `عنوان الدرس: ${title}`,
      `الهدف التعليمي: ${v.lessonObjective||'يُصاغ هدف قابل للملاحظة والقياس وفق موضوع الدرس'}`,
      `الوقت الكلي المتاح: ${mins} دقيقة (توزيع إرشادي)` ,
      `الموارد: ${v.lessonResources||selected.tools?.join('، ')||'أدوات صفية متاحة'}`,
      v.lessonNotes?`اعتبارات التنفيذ: ${v.lessonNotes}`:'',
      `تمهيد (${warm} دقائق): اطرح سؤالًا قصيرًا يرتبط بعنوان الدرس ويكشف أفكار المتعلمين السابقة.`,
      'خطوات تطبيق الاستراتيجية المختارة:',
      ...activities,
      `ناتج تعلّم ظاهر: إجابة معلَّلة أو بطاقة نشاط ترتبط بمفاهيم «${title}» وفق طبيعة الاستراتيجية.`,
      `تقويم ختامي (${exit} دقائق): اطلب من كل متعلم دليلًا أو تفسيرًا مختصرًا يبين تحقق هدف الدرس.`,
      'فكرة إبداعية اختيارية: استخدم صورة أو موقفًا من البيئة العُمانية إذا كان ذا صلة علمية حقيقية بالدرس؛ ولا تضحِّ بخطوات الاستراتيجية الأساسية.',
      'تنبيه: هذه مسودة إرشادية مبنية على بيانات الاستراتيجية، وليست نقلًا من الكتاب العُماني. تحقق من عنوان الدرس ودقة الأنشطة وعدّل الخطة وفق صفك.'
    ].filter(Boolean).join('\n\n');
  }
  function onOpen(strategy){selected=strategy;generated=null;lastSignature='';chooseSubjects();planLabel(window.BOUSALA_LANG==='en'?'Editable local draft':'مسودة محلية قابلة للتعديل');setStatus(window.BOUSALA_LANG==='en'?'Choose a grade and subject, then enter the textbook lesson title.':'اختر الصف والمادة وأدخل عنوان الدرس كما في الكتاب العُماني.');}
  function onFormChange(){
    if(!selected)return;
    const sig=signature();
    if(generated && sig!==lastSignature){generated=null;planLabel(window.BOUSALA_LANG==='en'?'Lesson details changed. Generate a new outline to update the plan.':'تم تعديل البيانات؛ أعد إنشاء التصور للحصول على خطة محدثة.');}
    if(!generated){byId('lessonPlanPreview').textContent=localPlan();}
  }
  function onRestored(item){
    const subject=byId('lessonSubject').value;chooseSubjects(subject);
    if(item?.proposal?.text){generated={text:safeText(item.proposal.text,16000),kind:item.proposal.kind||'local'};lastSignature=signature();byId('lessonPlanPreview').textContent=generated.text;planLabel(window.BOUSALA_LANG==='en'?'Previously saved outline':'تصور محفوظ سابقًا');}
  }
  function getPlanText(){return generated?.text||localPlan();}
  function getSavedProposal(){return generated?{text:generated.text,kind:generated.kind}:null;}
  function valid(){
    const v=values();
    if(!v.lessonGrade){setStatus(window.BOUSALA_LANG==='en'?'Please choose a grade.':'يرجى اختيار الصف الدراسي أولًا.');byId('lessonGrade').focus();return false;}
    if(!v.lessonSubject){setStatus(window.BOUSALA_LANG==='en'?'Please choose a subject.':'يرجى اختيار المادة الدراسية.');byId('lessonSubject').focus();return false;}
    if(!v.lessonTitle){setStatus(window.BOUSALA_LANG==='en'?'Enter the exact lesson title from the textbook.':'يرجى إدخال عنوان الدرس كما ورد في الكتاب المدرسي.');byId('lessonTitle').focus();return false;}
    return true;
  }
  function outline(){
    if(!valid())return;
    generated={kind:'local',text:localPlan()};lastSignature=signature();byId('lessonPlanPreview').textContent=generated.text;
    planLabel(window.BOUSALA_LANG==='en'?'Outline based on the chosen strategy':'تصور إرشادي مبني على خطوات الاستراتيجية');setStatus(window.BOUSALA_LANG==='en'?'✓ Local outline created. Review and edit before use.':'✓ أُعد تصور محلي باستخدام خطوات الاستراتيجية المختارة. يمكنك تعديله قبل الاستخدام.');
  }
  window.BOUSALA_OMAN_PLANNER={getPlanText,onOpen,onFormChange,onRestored,getSavedProposal};
  chooseGrade();chooseSubjects();
  byId('lessonGrade').addEventListener('change',()=>{chooseSubjects();onFormChange();});
  byId('localLessonPreview').addEventListener('click',outline);
})();
