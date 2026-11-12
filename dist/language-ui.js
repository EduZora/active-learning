/* Complete bilingual presentation layer. English and Arabic remain separate editions. */
(function(){'use strict';
const EN=window.BOUSALA_LANG==='en', M=window.BOUSALA_UI_MAP||{};
const esc=s=>String(s??'');
function one(s){
 const z=esc(s),q=z.trim();if(!q||!/[\u0600-\u06FF]/.test(q))return z;
 if(Object.prototype.hasOwnProperty.call(M,q))return z.replace(q,M[q]);
 const pattern=[
 [/^الاستراتيجية\s+(\d+)$/,'Strategy $1'],
 [/^الاستراتيجية رقم\s+(\d+)$/,'Strategy #$1'],
 [/^دليل رقم\s+(\d+)$/,'Guide #$1'],
 [/^الخطوة\s+(\d+)\s+من\s+(\d+)$/,'Step $1 of $2'],
 [/^استراتيجية\s+(\d+)\s+من\s+(\d+)$/,'Strategy $1 of $2'],
 [/^(\d+)\s+من\s+(\d+)\s+نقاط جاهزة$/,'$1 of $2 checklist items ready'],
 [/^(\d+)\s+من\s+(\d+)$/,'$1 of $2'],
 [/^(\d+)\s+دقائق?\s+تقريبًا$/,'About $1 minutes'],
 [/^(\d+)\s+دقائق?$/,'$1 minutes'],
 [/^(\d+)\s+استراتيجيات?\s+محفوظة$/,'$1 saved strategies'],
 [/^(\d+)\s+استراتيجيات?$/,'$1 strategies'],
 [/^(\d+)\s+أدوات?\s+تقريبًا$/,'About $1 materials'],
 [/^ترشيح:\s*(.*)$/,'Suggested grade bands: $1'],
 [/^صفوف مقترحة:\s*(.*)$/,'Suggested grade bands: $1'],
 [/^الصفوف\s*(\d+[–-]\d+)(.*)$/,'Grades $1$2'],
 [/^الصف\s+(\d+)$/,'Grade $1'],
 [/^استراتيجية\s+(.*)$/,'Strategy: $1'],
 [/^الاستراتيجية المختارة من المعلم:\s*(.*)$/,'Teacher-selected strategy: $1'],
 [/^المتبقي:\s*(.*)$/,'Remaining: $1'],
 [/^الهدف:\s*(.*)$/,'Objective: $1'],
 [/^نعرض\s+(\d+)\s+من\s+(\d+)\s+استراتيجية مطابقة،\s+من أصل\s+(\d+)(.*)$/,'Showing $1 of $2 matching strategies, from $3 total$4'],
 [/^عرض\s+(\d+)\s+استراتيجية أخرى$/,'Show $1 more strategies'],
 [/^مفضلتي\s+—\s+(\d+)\s+استراتيجية محفوظة$/,'My favourites — $1 saved strategies'],
 [/^(\d+)\s+خطة محفوظة.*$/,'$1 saved plans'],
 [/^(\d+)\s+خطة$/,'$1 plans'],
 [/^اخترت\s+(\d+)\s+من\s+(\d+)\s+أقسام$/,'Selected $1 of $2 sections'],
 [/^مخطط الاستراتيجية:\s*(.*)$/,'Strategy diagram: $1'],
 [/^رمز QR لاستراتيجية\s+(.*)$/,'QR code for $1'],
 [/^عرض الدليل الكامل لاستراتيجية\s+(.*)$/,'Open full guide for $1'],
 [/^إضافة إلى المفضلة:\s*(.*)$/,'Add to favourites: $1'],
 [/^إزالة من المفضلة:\s*(.*)$/,'Remove from favourites: $1'],
 [/^مثال توضيحي:\s*(.*)$/,'Illustrative example: $1'],
 [/^صفحات مرجعية:\s*(.*)$/,'Reference pages: $1']
 ];
 for(const [re,repl] of pattern)if(re.test(q))return z.replace(q,q.replace(re,repl));
 // Translate labelled text and UI strings even when they contain icons or changing numbers.
 const suffix=[
  [/^([🎯⏱🧰👥📚📋📖▣◉⇄♥♡🔗🖼🗣🧩✅▶✓⬇⬆🖨⧉✦]\s*)(.+)$/u,1],
 ];
 for(const [re] of suffix){const mt=q.match(re);if(mt){const tr=one(mt[2]);if(tr!==mt[2])return z.replace(q,mt[1]+tr)}}
 if(/^مخطط تربوي مقترح لتوزيع الطلاب:\s*/.test(q))return z.replace('مخطط تربوي مقترح لتوزيع الطلاب:','Suggested classroom arrangement:');
 // Combined messages containing dynamic strategy titles or reference page numbers.
 if(/^الرسم التوضيحي لاستراتيجية\s+/.test(q))return z.replace('الرسم التوضيحي لاستراتيجية','Illustration of strategy');
 if(/^عرض دليل\s+/.test(q))return z.replace('عرض دليل','Open guide for');
 if(/^الإصدار\s+/.test(q)&&q.includes('البيانات الشخصية محفوظة محليًا'))return z.replace('الإصدار','Version').replace('البيانات الشخصية محفوظة محليًا','personal data is stored locally');
 if(q.includes('صفحات مرجعية:'))return z.replace('صفحات مرجعية:','Reference pages:').replace('الأمثلة والرسوم والأوقات مقترحات تطبيقية قابلة للتكييف.','Examples, diagrams and timings are suggested adaptations.').replace(/(\d+)،\s*(\d+)/g,'$1, $2');
 // Translate phrases inside mixed captions while preserving teacher-entered text verbatim.
 if(q.includes('يمكن تكييف ترتيب المقاعد أو تنفيذ النشاط دون حركة.'))return z.replace('يمكن تكييف ترتيب المقاعد أو تنفيذ النشاط دون حركة.','Adapt the seating arrangement or allow participation without moving.');
 if(q.includes('الصفوف')&&/^الصفوف\s+[\d–-]/.test(q))return z.replace('الصفوف','Grades');
 if(q.includes('من 4 نقاط جاهزة'))return z.replace('من 4 نقاط جاهزة','of 4 checklist items ready');
 return z;
}
function apply(root){if(!EN||!root)return;
 const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];let n;
 while(n=w.nextNode())nodes.push(n);
 for(const node of nodes){const e=node.parentElement;if(!e||e.closest('script,style,textarea,code,pre,.no-auto-translate'))continue;const text=one(node.nodeValue);if(text!==node.nodeValue)node.nodeValue=text;}
 const els=root.nodeType===1?[root,...root.querySelectorAll('*')]:root.querySelectorAll('*');
 for(const e of els){if(!e.getAttribute||e.closest('.no-auto-translate'))continue;
 for(const a of ['title','placeholder','aria-label','alt']){const x=e.getAttribute(a);if(x){const t=one(x);if(t!==x)e.setAttribute(a,t)}}
 }
}
function init(){if(!EN)return;
 document.body.classList.add('en-interface');document.title='Active Learning Compass — Active Learning Strategies';
 const brand=document.getElementById('heroTitle');if(brand)brand.innerHTML='Active Learning<br><span>Compass</span>';
 const man=document.querySelector('link[rel="manifest"]');if(man)man.href='manifest-en.webmanifest';
 document.querySelector('meta[name="application-name"]')?.setAttribute('content','Active Learning Compass');
 document.querySelector('meta[name="description"]')?.setAttribute('content','Explore, plan, apply and assess active learning strategies.');
 for(const a of document.querySelectorAll('a[href]')){
  const x=a.getAttribute('href');if(!x)continue;
  if(x.startsWith('booklet.html'))a.setAttribute('href',x.replace('booklet.html','booklet-en.html'));
  if(x.startsWith('./index.html?strategy='))a.setAttribute('href',x.replace('./index.html','./index-en.html'));
 }
 apply(document.body);
 let queued=[];let active=false;
 const observer=new MutationObserver(list=>{
   for(const m of list){if(m.type==='characterData')queued.push(m.target);
    else if(m.type==='attributes')queued.push(m.target);
    else if(m.addedNodes)for(const n of m.addedNodes)if(n.nodeType===1||n.nodeType===3)queued.push(n);}
   if(active)return;active=true;
   queueMicrotask(()=>{const batch=queued.splice(0,queued.length);for(const n of batch){if(n.nodeType===3){if(n.parentElement?.closest('script,style,textarea,code,pre,.no-auto-translate'))continue;const t=one(n.nodeValue||'');if(t!==n.nodeValue)n.nodeValue=t;}
    else if(n.nodeType===1){if(n.hasAttribute('href')&&n.getAttribute('href')?.startsWith('booklet.html'))n.setAttribute('href',n.getAttribute('href').replace('booklet.html','booklet-en.html'));apply(n);}}
    active=false;});
 });
 observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['title','placeholder','aria-label','alt']});
}
const target=EN?'index-ar.html':'index-en.html';
const btn=document.getElementById('langSwitch')||document.createElement('a');
btn.id='langSwitch';btn.href=target;btn.setAttribute('role','button');
btn.setAttribute('aria-label',EN?'Switch to Arabic':'التبديل إلى الإنجليزية');
btn.textContent=EN?'AR':'English';
btn.title=EN?'Switch to Arabic':'Switch to English';
btn.addEventListener('click',()=>{try{localStorage.setItem('bousla_lang',EN?'ar':'en')}catch(e){};const url=new URL(target,location.href);url.search=location.search;url.searchParams.delete('lang');url.hash=location.hash;btn.href=url.href});
if(!btn.parentElement){const h=document.querySelector('.header-actions');if(h)h.prepend(btn);else document.body.prepend(btn)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.BOUSALA_UI_TRANSLATE=one;
})();