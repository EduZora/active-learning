/* v6.4.0 — خطوة بخطوة داخل الحصة؛ بلا تسجيل أو تقويم جديد. */
(()=>{'use strict';
  const $=id=>document.getElementById(id);
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]));
  let current=null,index=0,timerId=null,seconds=300,running=false;
  const categoryNotes={
    collab:'نظّم أدوار المشاركة، وامنح كل متعلم فرصة ليُسمع صوته.',
    thinking:'اطلب تفسيرًا ودليلًا، وأعط وقتًا كافيًا للتفكير.',
    assessment:'ركّز على وضوح الاستجابة والتغذية الراجعة أثناء سير النشاط.',
    movement:'وفّر مسارًا واضحًا للحركة مع بديل للمشاركة من مكان الجلوس.',
    reading:'أبرز شاهدًا مناسبًا في النص قبل الانتقال إلى الاستنتاج.',
    organizing:'اطلب توضيح معيار الترتيب أو التصنيف.',
    creativity:'افصل توليد الأفكار عن اختيارها وتنقيحها.',
    writing:'اسمح بمرحلة مسودة، ثم مشاركة الأفكار وتحسين الصياغة.'
  };
  const EN=window.BOUSALA_LANG==='en';
  const L=(ar,en)=>EN?en:ar;
  if(EN){Object.assign(categoryNotes,{collab:'Make room for every learner to contribute.',thinking:'Ask for reasoning and evidence; allow thinking time.',assessment:'Check responses and provide timely feedback.',movement:'Plan accessible movement and seated alternatives.',reading:'Ask learners to cite evidence from the text.',organizing:'Ask for the basis of each grouping or order.',creativity:'Separate idea generation from selection and revision.',writing:'Allow drafting, peer feedback and revision.'});}
  const pad=n=>String(n).padStart(2,'0');
  function formatted(){return `${pad(Math.floor(seconds/60))}:${pad(seconds%60)}`;}
  function clock(){ $('classroomClock').value=formatted(); $('classroomClock').textContent=formatted(); }
  function pause(){clearInterval(timerId);timerId=null;running=false;$('classroomTimerToggle').textContent=L('بدء المؤقت','Start timer');}
  function timePreset(){let n=Number($('classroomTimerMinutes').value);n=Number.isFinite(n)?Math.max(1,Math.min(45,Math.round(n))):5;$('classroomTimerMinutes').value=n;return n*60;}
  function resetTimer(){pause();seconds=timePreset();clock();$('classroomTimerNotice').textContent='';}
  function toggleTimer(){if(running){pause();$('classroomTimerNotice').textContent=L('المؤقت متوقف مؤقتًا.','Timer paused.');return;}
    if(seconds<=0)seconds=timePreset();
    running=true;$('classroomTimerToggle').textContent=L('إيقاف مؤقت','Pause timer');$('classroomTimerNotice').textContent=L('المؤقت يعمل.','Timer running.');
    timerId=setInterval(()=>{seconds=Math.max(0,seconds-1);clock();if(seconds===0){pause();$('classroomTimerNotice').textContent=L('انتهى الوقت المحدد لهذه الخطوة.','Time for this step has ended.');}},1000);
  }
  function render(){if(!current)return;
    const step=current.steps[index]||['خطوة التنفيذ','اتبع الإرشادات الأساسية.'];
    $('classroomTitle').textContent=`${current.name}`;
    $('classroomStrategyName').textContent=L(`استراتيجية ${current.id} من ${(window.STRATEGIES||[]).length}`,`Strategy ${current.id} of ${(window.STRATEGIES||[]).length}`);
    $('classroomIntro').textContent=L(`الهدف: ${current.goal}. اختر الخطوة وشغّل مؤقتها بجوارها.`,`Objective: ${current.goal}. Select a step and use its timer alongside the instructions.`);
    $('classroomProgress').textContent=L(`الخطوة ${index+1} من ${current.steps.length}`,`Step ${index+1} of ${current.steps.length}`);
    $('classroomProgressBar').max=current.steps.length;$('classroomProgressBar').value=index+1;
    $('classroomStepNumber').textContent=pad(index+1);
    $('classroomStepTitle').textContent=step[0];$('classroomStepDesc').textContent=step[1];
    $('classroomStepHint').textContent=categoryNotes[current.visual?.category]||L('راقب مشاركة الجميع وقدّم دعمًا مناسبًا عند الحاجة.','Monitor participation and support learners as needed.');
    $('classroomPrev').disabled=index===0;$('classroomNext').disabled=index===current.steps.length-1;
    $('classroomNext').textContent=index===current.steps.length-1?L('وصلت إلى الخطوة الأخيرة','Final step reached'):L('الخطوة التالية','Next step');
    const art=$('classroomArt');
    // Use each strategy's existing, distinct pedagogical diagram; do not replace it with generic artwork.
    if(art.dataset.strategy!==String(current.id)){
      art.innerHTML=`<div class="classroom-art-inner">${window.AL101_VISUALS.diagram(current,{large:true})}</div><p>${L('مخطط الاستراتيجية:','Strategy diagram:')} ${esc(current.name)}</p>`;
      art.dataset.strategy=String(current.id);
    }
    // An accessible, instruction-based visual route for the actual step labels of each strategy.
    $('classroomStepMap').innerHTML=current.steps.map((item,i)=>`<button type="button" data-classroom-step="${i}" class="classroom-map-step${i===index?' is-active':''}" ${i===index?'aria-current="step"':''}><span>${pad(i+1)}</span>${esc(item[0])}</button>`).join('');
    $('classroomStepMap').querySelectorAll('[data-classroom-step]').forEach(b=>b.addEventListener('click',()=>stepTo(Number(b.dataset.classroomStep))));
    const lbl=$('classroomStepTitle');lbl.focus({preventScroll:true});
  }
  function stepTo(next){if(!current || next<0||next>=current.steps.length)return;index=next;pause();$('classroomTimerNotice').textContent=L('اضبط زمن الخطوة وشغّل المؤقت عند الحاجة.','Set the duration and start the timer as needed.');render();}
  function openClassroom(strategy){if(!strategy||!Array.isArray(strategy.steps)||!strategy.steps.length)return;
    current=strategy;index=0;resetTimer();const dialog=$('classroomDialog');if(!dialog)return;
    dialog.showModal();render();
  }
  function setup(){
    $('classroomClose')?.addEventListener('click',()=>$('classroomDialog').close());
    $('classroomDialog')?.addEventListener('close',()=>{pause();current=null;const launch=$('startClassroom');if(launch && launch.isConnected)launch.focus({preventScroll:true});});
    $('classroomNext')?.addEventListener('click',()=>stepTo(index+1));
    $('classroomPrev')?.addEventListener('click',()=>stepTo(index-1));
    $('classroomTimerToggle')?.addEventListener('click',toggleTimer);
    $('classroomTimerReset')?.addEventListener('click',resetTimer);
    $('classroomTimerMinutes')?.addEventListener('change',()=>{if(!running)resetTimer();});
    document.addEventListener('visibilitychange',()=>{if(document.hidden && running){pause();$('classroomTimerNotice').textContent=L('توقف المؤقت عند مغادرة الصفحة؛ يمكنك استئنافه.','Timer paused when the page became inactive; you can resume it.');}});
  }
  window.AL101_V64={openClassroom};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();
