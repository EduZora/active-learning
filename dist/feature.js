(()=>{'use strict';
const selected=(window.AL101_DISPLAY_ORDER || [1,46,13,57]).slice(0,4);
const items=selected.map(id=>(window.STRATEGIES||[]).find(s=>s.id===id)).filter(Boolean);
if(!items.length||!window.AL101_VISUALS)return;
const byId=id=>document.getElementById(id), description=byId('featureDescription'),meta=byId('featureMeta'),visual=byId('featureVisual'),title=byId('featureTitle'),link=byId('featureOpen'),position=byId('featurePosition');
if(!visual||!title||!link)return;
let current=0;
const clean=s=>String(s||'').replace(/[&<>\"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
function render(){const s=items[current];title.textContent=s.name;description.textContent=s.summary;meta.innerHTML=`<span>${clean(s.goal)}</span><span>⏱ ${Number(s.minutes)||15} ${window.BOUSALA_LANG==='en'?'minutes (approx.)':'دقيقة تقريبًا'}</span>`;visual.innerHTML=window.AL101_VISUALS.diagram(s,{large:true});link.href=`./${window.BOUSALA_LANG==='en'?'index-en.html':'index-ar.html'}?strategy=${s.id}`;link.setAttribute('aria-label',`${window.BOUSALA_LANG==='en'?'Open full guide for':'عرض الدليل الكامل لاستراتيجية'} ${s.name}`);position.textContent=`${current+1} ${window.BOUSALA_LANG==='en'?'of':'من'} ${items.length}`;}
byId('featurePrev')?.addEventListener('click',()=>{current=(current+items.length-1)%items.length;render();});
byId('featureNext')?.addEventListener('click',()=>{current=(current+1)%items.length;render();});
render();
})();