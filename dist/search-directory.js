/* Strategy directory: complements, never replaces, the existing free-text search. */
(function () {
  'use strict';
  function init() {
    const input=document.getElementById('searchInput');
    const panel=document.getElementById('strategyDirectory');
    const toggle=document.getElementById('strategyDirectoryToggle');
    const cards=document.getElementById('strategyGrid');
    if(!input || !panel || !toggle || !Array.isArray(window.STRATEGIES))return;
    const lang=window.BOUSALA_LANG==='en'?'en':'ar';
    const ar=lang==='ar';
    const list=window.STRATEGIES;
    const normalise=s=>String(s||'').toLocaleLowerCase().normalize('NFKC').replace(/[\u064B-\u065F\u0670]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/[ـ–—\s]+/g,' ').trim();
    let open=false;
    const close=()=>{open=false;panel.hidden=true;toggle.setAttribute('aria-expanded','false');input.setAttribute('aria-expanded','false');};
    const openList=()=>{open=true;panel.hidden=false;toggle.setAttribute('aria-expanded','true');input.setAttribute('aria-expanded','true');render();};
    const render=()=>{
      const q=normalise(input.value);
      const matches=list.filter(s=>!q || normalise(s.name+' '+(s.english||'')+' '+(s.nameArabic||'')).includes(q));
      const frag=document.createDocumentFragment();
      if (!matches.length) {
        const p=document.createElement('p');p.className='directory-empty';p.textContent=ar?'لا توجد استراتيجية مطابقة. يمكنك مواصلة البحث النصي.':'No matching strategy; you can keep searching freely.';
        frag.appendChild(p);
      }
      for(const s of matches){
        const btn=document.createElement('button');btn.type='button';btn.className='directory-item';btn.dataset.strategyId=s.id;
        btn.setAttribute('role','option');btn.setAttribute('aria-selected','false');
        const number=document.createElement('span');number.className='directory-number';number.textContent=String(s.id);
        const title=document.createElement('span');title.className='directory-name';title.textContent=s.name;
        btn.append(number,title);frag.appendChild(btn);
      }
      panel.replaceChildren(frag);
    };
    const choose=id=>{
      const s=list.find(x=>x.id===id); if(!s)return;
      // Keep the old full-text search intact. Selecting narrows it by name.
      input.value=s.name;
      input.dispatchEvent(new Event('input',{bubbles:true}));
      close();
      // If the card is rendered, open its existing guide; otherwise scroll to search results.
      const card=cards?.querySelector(`[data-card="${id}"] [data-open="${id}"]`);
      if(card)card.click(); else cards?.scrollIntoView({behavior:'smooth',block:'start'});
    };
    toggle.addEventListener('click',event=>{event.stopPropagation();open?close():openList();});
    input.setAttribute('aria-controls','strategyDirectory');
    input.setAttribute('aria-autocomplete','list');
    input.addEventListener('input',()=>{if(open)render();});
    input.addEventListener('keydown',event=>{
      if(event.key==='Escape'){close();return;}
      if(event.key==='ArrowDown' && open){const first=panel.querySelector('.directory-item');if(first){event.preventDefault();first.focus();}}
    });
    panel.addEventListener('click',event=>{const target=event.target.closest('[data-strategy-id]');if(target)choose(Number(target.dataset.strategyId));});
    panel.addEventListener('keydown',event=>{
      if(event.key==='Escape'){event.preventDefault();close();input.focus();return;}
      if(event.key==='Enter'){const active=document.activeElement;if(active?.dataset?.strategyId){event.preventDefault();choose(Number(active.dataset.strategyId));}return;}
      if(event.key==='ArrowDown'||event.key==='ArrowUp'){
        const buttons=[...panel.querySelectorAll('.directory-item')];const i=buttons.indexOf(document.activeElement);
        const next=i+(event.key==='ArrowDown'?1:-1);
        if(next>=0&&next<buttons.length){event.preventDefault();buttons[next].focus();}
      }
    });
    document.addEventListener('pointerdown',event=>{if(!event.target.closest('.directory-search'))close();});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&open)close();});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
