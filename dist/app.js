(() => {
  'use strict';

  const DATA = Array.isArray(window.STRATEGIES) ? window.STRATEGIES : [];
  // Unified display sequence; original strategy IDs remain unchanged for stable links and saved data.
  const DISPLAY_IDS=[1,46,13,57,28,12,47,52,17,62,34,45,16,24,59,90,3,18,35,23,26,76,20,11,9,32,42,10,2,31,38,75,50,54,61,29,4,5,14,6,8,7,15,70,39,44,56,25,36,53,37,48,72,66,101,21,82,85,67,40,27,89,19,58,41,69,74,87,78,77,63,84,83,91,64,92,73,68,97,95,96,88,81,65,60,55,94,80,93,99,98,100,33,30,22,49,43,71,86,51,79,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122];
  const DISPLAY_RANK=new Map(DISPLAY_IDS.map((id,index)=>[id,index]));
  window.AL101_DISPLAY_ORDER=DISPLAY_IDS.slice();
  const displayNumber=(id)=>(DISPLAY_RANK.get(id)??-1)+1;
  const compareByName=(a,b)=>(DISPLAY_RANK.get(a.id)??999)-(DISPLAY_RANK.get(b.id)??999);

  const V = window.AL101_VISUALS;
  const CATEGORIES = window.STRATEGY_CATEGORIES || {};
  const colorStyle = s => {const c = V.category(s); return `--cat-color:${c.color};--cat-soft:${c.light};`;};
  const FAV_KEY = 'active-learning-favs-v2';
  const THEME_KEY = 'active-learning-theme-v2';
  const SHARE_KEY = 'active-learning-share-sections-v1';
  const BAG_KEY='al101-teaching-bag-v4';
  const LAST_KEY='al101-last-viewed-v4';
  const APP_VERSION='9.2';
  const durationLabel = n => window.BOUSALA_LANG==='en'?`${n} minutes`:`${n} ${Number(n) >= 3 && Number(n) <= 10 ? 'دقائق' : 'دقيقة'}`;
  let bag=safeJSON(safeRead(BAG_KEY),{schema:1,plans:[]});
  if(!bag || !Array.isArray(bag.plans))bag={schema:1,plans:[]};
  let editingPlanId=null;
  let reactingToHistory=false;

  const state = {
    onlyFavorites: false,
    favorites: new Set(safeJSON(safeRead(FAV_KEY), [])),
    currentId: null,
    shareStrategyId: null,
    visibleLimit: 18,
    shareSelection: safeJSON(safeRead(SHARE_KEY), { idea:true, steps:true, example:true, tools:false, details:false, tip:false, source:false })
  };

  const el = {
    search: byId('searchInput'),
    quickName: byId('quickNameSearch'),
    suggestions: byId('nameSuggestions'),
    clearQuick: byId('clearQuickName'),
    goal: byId('goalFilter'),
    category: byId('categoryFilter'),
    time: byId('timeFilter'),
    stage: byId('stageFilter'),
    grid: byId('strategyGrid'),
    info: byId('resultsInfo'),
    empty: byId('emptyState'),
    all: byId('allTab'),
    favs: byId('favTab'),
    dialog: byId('strategyDialog'),
    content: byId('dialogContent'),
    theme: byId('themeBtn')
  };

  function byId(id) { return document.getElementById(id); }
  function safeJSON(text, fallback) {
    try { return text ? JSON.parse(text) : fallback; } catch { return fallback; }
  }
  function save(key, value) { try { localStorage.setItem(key, value); } catch {} }
  function safeRead(key) { try { return localStorage.getItem(key); } catch { return null; } }
  function norm(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/[ىئ]/g, 'ي')
      .replace(/ؤ/g, 'و')
      .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
      .replace(/[،؛!؟,.;:()–ـ-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  function escapeHTML(value) {
    return String(value).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  }
  // النطاقات الرقمية؛ الصف الرابع وارد في النطاقين الأول والثاني حسب التقسيم المطلوب.
  // هذه ترشيحات تنظيمية فقط ولا تعني أن الاستراتيجيات لا تصلح لصفوف أخرى.
  const STAGE_LABELS = Object.freeze({
    '1-4': '1–4',
    '4-8': '4–8',
    '9-12': '9–12'
  });
  function stageNames(stages) { return (stages || []).map(stage => STAGE_LABELS[stage] || stage).join(' • '); }
  function stageSupports(strategy, stage) { return !stage || (strategy.stages || []).includes(stage); }
  function wordDistanceWithinOne(a, b) {
    if (a === b) return true;
    if (Math.abs(a.length - b.length) > 1 || Math.min(a.length, b.length) < 4) return false;
    let i=0,j=0,edits=0;
    while(i<a.length && j<b.length) {
      if(a[i]===b[j]){i++;j++;continue;}
      if(++edits>1)return false;
      if(a.length>b.length)i++;
      else if(b.length>a.length)j++;
      else {i++;j++;}
    }
    return edits+(a.length-i)+(b.length-j)<=1;
  }
  function smartMatch(haystack, q) {
    if (!q) return true;
    if (haystack.includes(q)) return true;
    const words=haystack.split(/\s+/).filter(Boolean);
    const parts=q.split(/\s+/).filter(Boolean).slice(0,8);
    return parts.every(part => words.some(word => word.includes(part) || wordDistanceWithinOne(part,word)));
  }
  function nameMatches(strategy, q) {
    return smartMatch(norm(strategy.name),q) || String(displayNumber(strategy.id))===q;
  }

  function timeGroup(minutes) {
    if (minutes <= 10) return 'short';
    if (minutes <= 20) return 'medium';
    return 'long';
  }
  function timeLabel(minutes) {
    return timeGroup(minutes) === 'short' ? 'سريعة ومباشرة' : timeGroup(minutes) === 'medium' ? 'متوسطة' : 'نشاط ممتد';
  }

  const TOOL_LIBRARY = [
    { match: ['ورق', 'ورقة', 'أوراق'], icon: '📄', label: 'ورقة عمل', hint: 'جهّز ورقة واضحة تتضمن المطلوب أو مساحة لتدوين الأفكار.', note: 'تنظيم' },
    { match: ['بطاقات', 'بطاقة', 'كروت'], icon: '🗂️', label: 'بطاقات', hint: 'استخدم بطاقات قصيرة ليسهل السحب والتصنيف والمناقشة.', note: 'ترتيب' },
    { match: ['سبورة'], icon: '🧑‍🏫', label: 'سبورة', hint: 'اكتب السؤال أو التعليمات الرئيسية أمام الجميع.', note: 'عرض' },
    { match: ['أقلام', 'قلم', 'ماركر'], icon: '🖍️', label: 'أقلام', hint: 'وفر أقلامًا للكتابة أو التمييز أو رسم الروابط.', note: 'تدوين' },
    { match: ['مؤقت', 'ساعة'], icon: '⏱️', label: 'مؤقت', hint: 'اضبط الزمن لكل مرحلة حتى يحافظ النشاط على إيقاعه.', note: 'ضبط الوقت' },
    { match: ['ملصقات', 'لاصقة', 'ستيكر'], icon: '🏷️', label: 'ملصقات', hint: 'تساعد في الترميز البصري والتجميع السريع.', note: 'ترميز' },
    { match: ['جهاز', 'حاسوب', 'هاتف', 'تابلت'], icon: '💻', label: 'جهاز', hint: 'استخدمه للعرض أو التفاعل أو التوثيق السريع.', note: 'تقنية' },
    { match: ['عرض', 'شاشة', 'بروجكتر', 'شريحة'], icon: '📽️', label: 'عرض مرئي', hint: 'اعرض السؤال أو النماذج أو التعليمات بصريًا.', note: 'إيضاح' },
    { match: ['صورة', 'صور'], icon: '🖼️', label: 'صور', hint: 'الصور تختصر الفكرة وتثير النقاش وتدعم الفهم.', note: 'إثارة' },
    { match: ['نص', 'قراءة', 'مقال'], icon: '📚', label: 'نص/قراءة', hint: 'اختر نصًا مناسبًا لمستوى الطلاب ومباشر الهدف.', note: 'محتوى' },
    { match: ['جدول', 'منظم'], icon: '📋', label: 'منظم بصري', hint: 'يساعد في تقسيم الأفكار أو المقارنة أو التلخيص.', note: 'تنظيم' },
    { match: ['كرة', 'مجسم'], icon: '🔵', label: 'أداة حركية', hint: 'استخدمها لكسر الجمود وتحريك المشاركة.', note: 'حركة' },
    { match: ['سؤال'], icon: '❓', label: 'سؤال محفز', hint: 'ابدأ بسؤال يفتح التفكير ولا يقتصر على إجابة واحدة.', note: 'إطلاق' },
    { match: ['ملف', 'مغلف', 'صندوق'], icon: '📦', label: 'حاوية نشاط', hint: 'ضع فيها البطاقات أو المهمات أو الأدلة.', note: 'تجهيز' },
    { match: ['لوحة', 'جدارية'], icon: '🧱', label: 'لوحة عرض', hint: 'تعرض نتائج المجموعات وتُسهل المقارنة.', note: 'إبراز' }
  ];

  const GOAL_META = [
    { match: ['تفكير', 'حل المشكلات'], icon: '🧠', text: 'تنشّط التفكير العميق وتمنح الطالب فرصة للتأمل.' },
    { match: ['مناقشة', 'تواصل'], icon: '🗣️', text: 'تعتمد على الحوار وتبادل الرأي بصورة آمنة وموجَّهة.' },
    { match: ['تعاون', 'مجموعات'], icon: '🤝', text: 'تعزز العمل الجماعي وتقاسم الأدوار والمسؤولية.' },
    { match: ['تقويم', 'تغذية'], icon: '✅', text: 'تفيد في التحقق السريع من الفهم وتقديم تغذية راجعة.' },
    { match: ['إبداع', 'ابتكار'], icon: '✨', text: 'تفتح المجال للأفكار الجديدة والتعبير بطرائق متنوعة.' },
    { match: ['استرجاع', 'مراجعة'], icon: '🔁', text: 'ممتازة للمراجعة واستدعاء المعلومات وتثبيت التعلم.' }
  ];

  function unique(list) { return [...new Set(list.filter(Boolean))]; }
  function getToolMeta(rawTool) {
    const tool = String(rawTool || '').trim();
    if(window.BOUSALA_LANG==='en')return {icon:'🧰',label:tool,hint:'Prepare this item before the activity begins.',note:'Materials',raw:tool};
    const hit = TOOL_LIBRARY.find(item => item.match.some(keyword => tool.includes(keyword)));
    return hit ? { ...hit, raw: tool } : { icon: '🧰', label: tool, hint: 'أداة مساندة تسهّل تنفيذ الاستراتيجية داخل الصف.', note: 'تطبيق', raw: tool };
  }
  function getGoalMeta(goal) {
    if(window.BOUSALA_LANG==='en')return {icon:'🎯',text:'Engage learners actively and assess progress toward the stated learning objective.'};
    const hit = GOAL_META.find(item => item.match.some(keyword => String(goal || '').includes(keyword)));
    return hit || { icon: '🎯', text: 'استراتيجية عملية تساعد المعلم على إدارة المشاركة وتحقيق هدف الدرس.' };
  }
  function stageTone(stages) {
    return window.BOUSALA_LANG==='en'?'Adaptable to all grades':'قابلة للتكييف لجميع الصفوف';
  }
  function inferRole(title, desc, index) {
    if(window.BOUSALA_LANG==='en')return index===0?'Teacher introduces':index===1?'Students engage':'Practice and reflection';
    const source = `${title} ${desc}`;
    if (/اطرح|وزع|وجه|حدد|اشرح|اعرض|اطلب|قسم|اختر/.test(source)) return 'المعلم يقود';
    if (/ناقش|فكر|اكتب|شارك|تحاور|بادل|اعرضوا|لخص|رتب|استنتج/.test(source)) return 'الطلاب ينجزون';
    if (index === 0) return 'تهيئة النشاط';
    if (index === 1) return 'انطلاق التفاعل';
    return 'تطبيق ومتابعة';
  }
  function stepSignal(title, desc) {
    if(window.BOUSALA_LANG==='en')return ['✓','Active participation'];
    const source = `${title} ${desc}`;
    if (/فكر|استنتج|حلل/.test(source)) return ['🧠', 'فكر'];
    if (/ناقش|تحاور|تبادل|شارك/.test(source)) return ['💬', 'ناقش'];
    if (/اكتب|سجل|دون|لخص/.test(source)) return ['✍️', 'دوّن'];
    if (/اعرض|قدم|شارك الصف/.test(source)) return ['📣', 'اعرض'];
    if (/رتب|صنف|جمع/.test(source)) return ['🧩', 'نظم'];
    return ['✨', 'نفّذ'];
  }
  function shorten(text, max = 96) {
    const t = String(text || '');
    return t.length > max ? `${t.slice(0, max - 1)}…` : t;
  }
  function titleToFlowLabel(text) {
    const t = String(text || '');
    if (t.length <= 14) return t;
    const parts = t.split(/\s+/);
    return parts.slice(0, 2).join(' ');
  }

  function strategyPreviewTags(strategy) {
    const meta = getGoalMeta(strategy.goal);
    return unique([
      `${meta.icon} ${timeLabel(strategy.minutes)}`,
      `👥 ${stageTone(strategy.stages)}`,
      `🧰 ${Math.min(strategy.tools.length, 5)} أدوات تقريبًا`
    ]);
  }

  function createIllustration(strategy, large = false) {
    return V.diagram(strategy, { large });
  }

  function favoriteButton(strategy) {
    const fav = state.favorites.has(strategy.id);
    return `<button class="fav-btn ${fav ? 'is-fav' : ''}" type="button" data-fav="${strategy.id}" aria-label="${fav ? 'إزالة من' : 'إضافة إلى'} المفضلة: ${escapeHTML(strategy.name)}" aria-pressed="${fav}" title="${fav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}">${fav ? '♥' : '♡'}</button>`;
  }

  // Render diagrams as they approach the viewport instead of generating SVGs for
  // all search results up front. The content and accessible card controls are immediate.
  const cardArtObserver = ('IntersectionObserver' in window) ? new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      const target=entry.target;
      const strategy=DATA.find(s=>s.id===Number(target.dataset.diagramId));
      if(strategy)target.innerHTML=createIllustration(strategy);
      cardArtObserver.unobserve(target);
    });
  },{rootMargin:'400px 0px',threshold:0}):null;
  function hydrateCardVisuals(){
    el.grid.querySelectorAll('[data-diagram-id]').forEach(target=>{
      if(!cardArtObserver){const item=DATA.find(s=>s.id===Number(target.dataset.diagramId));if(item)target.innerHTML=createIllustration(item);}
      else cardArtObserver.observe(target);
    });
  }
  if(cardArtObserver)window.addEventListener('beforeprint',()=>{
    el.grid.querySelectorAll('[data-diagram-id]').forEach(target=>{
      if(!target.querySelector('svg')){
        const item=DATA.find(s=>s.id===Number(target.dataset.diagramId));if(item)target.innerHTML=createIllustration(item);
      }
    });
  });
  function strategyCardVisual(strategy) {
    return `<div class="diagram-wrap" data-diagram-id="${strategy.id}" role="img" aria-label="الرسم التوضيحي لاستراتيجية ${escapeHTML(strategy.name)}"></div>`;
  }

  function categoryLegend() {
    const all = Object.entries(CATEGORIES);
    const counts = Object.fromEntries(all.map(([key]) => [key, DATA.filter(s => s.visual?.category === key).length]));
    const container = byId('categoryLegend');
    if (!container) return;
    container.innerHTML = `<span class="legend-label">دليل الألوان:</span>` + all.map(([key, c]) => `
      <button class="legend-chip ${el.category.value === key ? 'selected' : ''}" type="button" data-category="${key}" style="--cat-color:${c.color};--cat-soft:${c.light};" aria-pressed="${el.category.value===key}"><span class="legend-dot"></span>${escapeHTML(c.label)} <small>${counts[key]}</small></button>`).join('');
  }

  function render() {
    const query = norm(el.search.value);
    const quick = norm(el.quickName.value);
    const filtered = DATA.filter(strategy => {
      const haystack = norm([
        strategy.name,
        strategy.english,
        strategy.summary,
        strategy.goal,
        strategy.visual?.example?.subject,
        strategy.visual?.example?.context,
        strategy.visual?.example?.grade,
        strategy.visual?.example?.topic,
        strategy.visual?.example?.prompt,
        strategy.visual?.example?.procedure,
        strategy.tools.join(' '),
        strategy.steps.flat().join(' ')
      ].join(' '));
      return (!state.onlyFavorites || state.favorites.has(strategy.id)) &&
        (!el.goal.value || strategy.goal === el.goal.value) &&
        (!el.category.value || strategy.visual?.category === el.category.value) &&
        (!el.time.value || timeGroup(strategy.minutes) === el.time.value) &&
        stageSupports(strategy, el.stage.value) &&
        (!quick || nameMatches(strategy, quick)) &&
        (!query || smartMatch(haystack,query));
    });
    filtered.sort(compareByName);
    const visible = filtered.slice(0, state.visibleLimit);
    if(cardArtObserver)cardArtObserver.disconnect();
    el.grid.innerHTML = visible.map(strategy => `
      <article class="strategy-card" style="${colorStyle(strategy)}" data-card="${strategy.id}">
        <div class="card-top">
          <span class="card-num">الاستراتيجية ${displayNumber(strategy.id)}</span>
          ${favoriteButton(strategy)}
        </div>
        <div class="card-visual">${strategyCardVisual(strategy)}</div>
        <span class="category-ribbon"><span class="category-bullet"></span>${escapeHTML(V.category(strategy).label)}</span>
        <h3>${escapeHTML(strategy.name)}</h3>
        <p class="en-name" lang="en">${escapeHTML(strategy.english)}</p>
        <p class="summary">${escapeHTML(strategy.summary)}</p>
        <p class="card-example"><strong>مثال توضيحي:</strong> ${escapeHTML(strategy.visual?.example?.subject || '')} • ${escapeHTML(strategy.visual?.example?.grade || '')} — ${escapeHTML(strategy.visual?.example?.topic || '')}</p>
        <div class="card-meta">
          <span class="chip">⏱ ${durationLabel(strategy.minutes)}</span>
          <span class="chip">${escapeHTML(strategy.goal)}</span>
        </div>
        <div class="card-bottom">
          <span>صفوف مقترحة: ${escapeHTML(stageNames(strategy.stages))}</span>
          <button class="open-btn" type="button" data-open="${strategy.id}" aria-label="عرض دليل ${escapeHTML(strategy.name)}">استكشف الدليل ←</button>
        </div>
      </article>
    `).join('');
    hydrateCardVisuals();

    el.info.textContent = `نعرض ${visible.length} من ${filtered.length} استراتيجية مطابقة، من أصل ${DATA.length}${quick ? ' • نتائج البحث بالاسم' : ''}`;
    const more=byId('loadMoreBtn');
    more.hidden = visible.length >= filtered.length;
    more.textContent = `عرض ${Math.min(18, filtered.length-visible.length)} استراتيجية أخرى`;
    el.empty.hidden = filtered.length !== 0;
    const favNotice=byId('favoritesNotice');
    if(favNotice){
      favNotice.hidden=!state.onlyFavorites;
      if(state.onlyFavorites){
        const total=state.favorites.size;
        byId('favoritesNoticeTitle').textContent=total ? `مفضلتي — ${total} استراتيجية محفوظة` : 'مفضلتي فارغة حاليًا';
        byId('favoritesNoticeText').textContent=total
          ? 'هذه استراتيجياتك المحفوظة. اضغط «استكشف الدليل» لعرضها أو ♡ لإزالتها من المفضلة.'
          : 'لم تحفظ أي استراتيجية بعد. اضغط زر القلب ♡ في إحدى بطاقات الاستراتيجيات لتظهر هنا.';
      }
    }
    if(state.onlyFavorites && !filtered.length){
      el.empty.querySelector('h3').textContent='لا توجد استراتيجيات محفوظة في المفضلة';
      el.empty.querySelector('p').textContent='يمكنك الرجوع إلى جميع الاستراتيجيات وإضافة ما يناسبك باستخدام رمز القلب ♡.';
    }else{
      el.empty.querySelector('h3').textContent='لم نعثر على استراتيجية مطابقة';
      el.empty.querySelector('p').textContent='جرّب تغيير كلمات البحث أو إعادة ضبط الفلاتر.';
    }
    syncCounts();
    categoryLegend();
  }

  function syncCounts() {
    const favCount = state.favorites.size;
    byId('favCount').textContent = favCount;
    byId('favTabCount').textContent = favCount;
    byId('loadedCount').textContent = DATA.length;
    byId('stepsCount').textContent = DATA.reduce((sum, item) => sum + item.steps.length, 0);
  }

  function toggleFavorite(id) {
    if (!DATA.some(item => item.id === id)) return;
    if (state.favorites.has(id)) state.favorites.delete(id); else state.favorites.add(id);
    save(FAV_KEY, JSON.stringify([...state.favorites]));
    render();
    if (state.currentId === id && el.dialog.open) openGuide(id, false);
  }

  function buildFactCards(strategy) {
    const meta = getGoalMeta(strategy.goal);
    const toolCount = Math.min(strategy.tools.length, 5);
    return [
      { icon: '🎯', title: 'جوهر الاستراتيجية', value: meta.text },
      { icon: '⏱️', title: 'إيقاع التنفيذ', value: `${durationLabel(strategy.minutes)} — ${timeLabel(strategy.minutes)}` },
      { icon: '👥', title: 'صفوف مقترحة فقط', value: `${stageNames(strategy.stages)} — يمكن تطبيقها في جميع الصفوف بتكييف مناسب` },
      { icon: '🧰', title: 'الأدوات المحورية', value: `${toolCount} عناصر أساسية لبدء التطبيق بسرعة.` }
    ].map(card => `
      <div class="fact-card">
        <div class="fact-icon">${card.icon}</div>
        <strong>${escapeHTML(card.title)}</strong>
        <span>${escapeHTML(card.value)}</span>
      </div>
    `).join('');
  }

  function buildToolsGallery(strategy) {
    const tools = strategy.tools.length ? strategy.tools.map(getToolMeta) : [{ icon: '🧰', label: 'أدوات بسيطة', hint: 'يمكن تنفيذها بأدوات صفية اعتيادية.', note: 'مرونة' }];
    return tools.map(tool => `
      <article class="tool-card">
        <div class="tool-icon" aria-hidden="true">${tool.icon}</div>
        <strong>${escapeHTML(tool.raw || tool.label)}</strong>
        <p>${escapeHTML(tool.hint)}</p>
        <span class="tool-mini-note">${escapeHTML(tool.note)}</span>
      </article>
    `).join('');
  }

  function buildVisualFlow(strategy) {
    return strategy.steps.slice(0, 4).map(([title, desc], index) => {
      const signal = stepSignal(title, desc);
      return `
        <article class="flow-box">
          <span class="flow-index">${index + 1}</span>
          <h4>${escapeHTML(titleToFlowLabel(title))}</h4>
          <p>${escapeHTML(shorten(desc, 76))}</p>
          <div class="step-helpers" style="margin-top:10px"><span class="helper-chip">${signal[0]} ${signal[1]}</span></div>
        </article>
      `;
    }).join('');
  }

  function buildStepList(strategy) {
    return strategy.steps.map(([title, desc], index) => {
      const role = inferRole(title, desc, index);
      const signal = stepSignal(title, desc);
      const redundantEnglishStep = window.BOUSALA_LANG==='en' && title.trim().replace(/[.!?]+$/,'').toLowerCase()===desc.trim().replace(/[.!?]+$/,'').toLowerCase();
      return `
        <article class="step-card">
          <div class="step-marker">
            <div class="step-index">${index + 1}</div>
            <span class="role-badge">${escapeHTML(role)}</span>
          </div>
          <div>
            <strong>${escapeHTML(title)}</strong>
            ${redundantEnglishStep?'':`<p>${escapeHTML(desc)}</p>`}
          </div>
        </article>
      `;
    }).join('');
  }

  function buildPrepList(strategy) {
    const mainTools = strategy.tools.slice(0, 4).map(tool => `
      <div class="prep-item">
        <span>🧰</span>
        <div><strong>${escapeHTML(tool)}</strong><div>${escapeHTML(getToolMeta(tool).hint)}</div></div>
      </div>`);
    const extra = [
      `<div class="prep-item"><span>🎯</span><div><strong>حدد ناتجًا بسيطًا</strong><div>حدّد ماذا تريد من الطلاب في النهاية: فكرة، إجابة، بطاقة، تلخيص، أو مشاركة شفوية.</div></div></div>`,
      `<div class="prep-item"><span>⏱️</span><div><strong>قسّم الزمن بوضوح</strong><div>ضع لكل جزء من النشاط وقتًا مناسبًا حتى لا يطغى جزء على آخر.</div></div></div>`
    ];
    return [...mainTools, ...extra].join('');
  }

  function buildTeacherNotes(strategy) {
    const noteA = strategy.minutes <= 10 ? 'اجعل التعليمات مختصرة وابدأ بسرعة حتى تحافظ على الحماس.' : 'هيّئ الطلاب أولًا ووزّع الأدوار قبل البدء لتضمن انسياب التنفيذ.';
    const noteB = strategy.stages.includes('1-4') ? 'استخدم مثالًا محسوسًا أو صورة مساعدة خصوصًا مع الصفوف الأولى.' : 'شجّع على التبرير والتفسير لا مجرد الإجابة السريعة.';
    const noteC = strategy.goal.includes('تقويم') ? 'دوّن ملاحظاتك أثناء التطبيق لأن هذه الاستراتيجية مفيدة للتغذية الراجعة الفورية.' : 'راقب التفاعل بين الطلاب، وادعم الخجولين بأسئلة صغيرة أو أدوار واضحة.';
    return [noteA, noteB, noteC].map((note, i) => `
      <div class="note-item">
        <span>${['💡', '👂', '📌'][i]}</span>
        <div>${escapeHTML(note)}</div>
      </div>
    `).join('');
  }


  // إضافات تربوية تحريرية: مستقلة عن النصوص المنسوبة للمصدر الأساسي.
  const CLASSROOM_PATTERNS = Object.freeze({
    pairs:{label:'عمل ثنائي',sub:'طالبان يتبادلان الأدوار والتفسير',seats:[ [114,105],[178,105],[346,105],[410,105] ],links:[[114,178],[346,410]],roles:'يوضح المعلم السؤال ومعيار الإجابة، ثم يترك وقتًا للتفكير الفردي قبل تبادل الحديث.',students:'يفكر كل متعلم أولًا، ثم يشرح لزميله ويصغي لتفسيره قبل تقديم الإجابة المشتركة.'},
    groups:{label:'مجموعات صغيرة',sub:'أدوار واضحة ومشاركة متوازنة',seats:[[120,87],[173,87],[120,147],[173,147],[340,87],[393,87],[340,147],[393,147]],links:[[120,173],[340,393]],roles:'يحدد المعلم مهمة مشتركة وأدوارًا قصيرة، ثم ينتقل بين المجموعات لمتابعة دليل التعلم.',students:'يقسم الطلاب المسؤوليات داخل المجموعة ويقدم كل فرد مساهمة يمكن ملاحظتها.'},
    circle:{label:'حلقة حوار',sub:'استماع ثم رد مدعوم بالدليل',seats:[[170,67],[252,52],[334,67],[384,121],[334,173],[252,194],[170,173],[120,121]],links:[[170,334],[120,384]],roles:'يعرض المعلم سؤالًا واضحًا وقواعد الحديث ويخصص وقتًا للاستماع قبل التعقيب.',students:'يتبادل الطلاب الرأي بالدور ويدعمون حديثهم بمثال أو شاهد.'},
    fishbowl:{label:'دائرة داخلية وخارجية',sub:'نقاش في الداخل وملاحظة بالأدلة في الخارج',seats:[[234,103],[292,103],[234,149],[292,149],[115,74],[178,39],[340,39],[410,74],[115,170],[178,204],[340,204],[410,170]],links:[[234,292]],roles:'يوضح المعلم دور المتحاورين داخل الدائرة ومعايير الملاحظة للطلاب خارجها، ثم يتيح تبادل الأدوار.',students:'تتناقش المجموعة الداخلية، وتوثّق الخارجية جودة الاستدلال والمشاركة ثم تقدم تغذية راجعة.'},
    movement:{label:'محطات أو أركان',sub:'حركة هادفة وفق مهمة وزمن محددين',seats:[[104,85],[104,157],[252,85],[252,157],[399,85],[399,157]],links:[[104,252],[252,399]],roles:'يهيّئ المعلم المحطات ويشرح اتجاه الانتقال والوقت ومعيار السلامة وإمكانية المشاركة دون انتقال.',students:'يتنقل الطلاب بين المهام أو تتنقل الأفكار بين المجموعات، ويسجلون حصيلة كل محطة.'},
    individual:{label:'تفكير فردي ثم مشاركة',sub:'مساحة للتفكير والكتابة قبل النقاش',seats:[[111,88],[249,88],[387,88],[111,164],[249,164],[387,164]],links:[],roles:'يقدّم المعلم سؤالًا محددًا وزمنًا هادئًا للإجابة ثم يختار شكلًا مناسبًا للمشاركة.',students:'يسجل كل متعلم استجابته بصورة أو كتابة أو شفهيًا، ثم يراجعها في ضوء التعقيبات.'},
    whole:{label:'تفاعل صفّي منظّم',sub:'إظهار الاستجابات ثم مناقشة أسبابها',seats:[[114,93],[208,93],[302,93],[396,93],[114,168],[208,168],[302,168],[396,168]],links:[],roles:'يشرح المعلم المطلوب ويعرض معيار النجاح، ثم يجمع استجابات الطلاب كافة.',students:'يقدم كل متعلم استجابة ظاهرة ثم يقارنها بحل أو دليل ويتأمل ما يمكن تحسينه.'}
  });
  function classroomPattern(strategy) {
    const layout = strategy.visual?.layout || '';
    const cat = strategy.visual?.category || '';
    if (layout === 'fishbowl') return 'fishbowl';
    if (['movement','circles','gallery','corners','messenger','exchange','snowball','clock','seasons','match','back2back','magnet'].includes(layout)) return 'movement';
    if (['circle','roundtable','socratic','hotseat','sage','roundtable','rounds','talk'].includes(layout)) return 'circle';
    if (['thinkpair','coach','partners','triangle','peer','gap','draw','qa','back2back'].includes(layout)) return 'pairs';
    if (['jigsaw','groups','relay','roles','groupnotes','investigation','numbered','puzzle','funnel','cluster','envelope','feedback'].includes(layout)) return 'groups';
    if (['minute','writing','reading','gist','notes','author','predict','list','organizer','mindmap','kwl','twocol','markup','why','frayer'].includes(layout) || cat === 'writing') return 'individual';
    if (cat === 'collab') return 'groups';
    if (cat === 'movement') return 'movement';
    return 'whole';
  }
  function pedagogicalAdvice(s) {
    const kind = classroomPattern(s), p = CLASSROOM_PATTERNS[kind], cat = s.visual?.category || '';
    const ex = s.visual?.example || {};
    if(window.BOUSALA_LANG==='en'){
      const modes={pairs:['Pair Work','Partners explain and exchange ideas'],groups:['Small Groups','Clear roles and balanced participation'],circle:['Discussion Circle','Listen, speak and justify with evidence'],fishbowl:['Fishbowl Discussion','Inner discussion and outer observation'],movement:['Learning Stations','Purposeful movement with timed tasks'],individual:['Individual Work and Sharing','Quiet reflection followed by discussion'],whole:['Whole-Class Response','Everyone responds and explains why']};
      const [label,sub]=modes[kind]||modes.whole;
      return {pattern:{...p,label,sub,roles:'Explain the task, set success criteria, and monitor participation.',students:'Follow the strategy steps, exchange ideas, and support their conclusions.'},key:kind,
        start:ex.prompt||'What do we need to understand or investigate in this lesson?',evidence:ex.outcome||'An individual response showing learning.',
        teacher:'Explain the question, organize the classroom, and give constructive feedback.',
        student:'Engage in the assigned roles, share reasoning and complete the learning task.',
        focus:'Ensure that everyone contributes and makes progress toward the objective.',
        reflection:'What changed in your thinking after hearing other ideas?',
        observer:'Look for participation, clear explanations, and evidence of learning.',
        scaffold:'Provide visual examples, key vocabulary, or a supportive partner; allow spoken, written, or drawn responses as appropriate.',
        stretch:'Ask learners to compare explanations, test counterexamples, or transfer the idea to a new situation.',
        feedback:'Give one specific strength and one actionable next step; allow revision.',
        closure:'Ask each learner to finish: “Today I learned… and I still need to check…” or complete a brief exit ticket.'};
    }

    const template = {
      collab:['أعطِ وقتًا للتفكير الفردي قبل تبادل الأفكار، ثم تأكد أن لكل عضو دورًا واضحًا.','اسأل: ما الفكرة التي تطورت بعد سماع رأي زميلك؟','راقب ما إذا ساهم كل فرد في النتيجة وليس المتحدث فقط.'],
      thinking:['اطلب تفسير الإجابة ودليلها قبل الحكم على صحتها.','اسأل: ما الدليل؟ وهل يوجد تفسير آخر؟','لاحظ وضوح الحجة وطريقة الاستدلال أكثر من سرعة الإجابة.'],
      writing:['اسمح بالتخطيط في كلمات مفتاحية أو رسم قبل كتابة الإجابة الكاملة.','اسأل: ما الفكرة الأهم في نصك؟ وكيف يمكن تحسينها؟','راجع وضوح الفكرة وصلتها بالهدف لا طول النص.'],
      assessment:['اجمع استجابة فردية من الجميع، ثم ناقش سبب الصواب والخطأ دون إحراج.','اسأل: ما الذي غيّر إجابتك بعد التعقيب؟','دوّن التصورات غير الدقيقة لتحديد الخطوة التالية للتدريس.'],
      movement:['وفّر مسارًا واضحًا للحركة أو بديلًا ثابتًا، وضع وقتًا لكل مهمة.','اسأل: ماذا أضافت المحطة أو المجموعة الأخرى لفهمك؟','تحقق من التعلم الناتج عن الانتقال، لا عدد المحطات التي زارها الطالب.'],
      creativity:['افصل وقت توليد الأفكار عن وقت مناقشتها أو تقويمها.','اسأل: أي فكرة جديدة تستحق التجربة؟ ولماذا؟','لاحظ تنوع الأفكار وتبرير الاختيارات بدل مكافأة الفكرة الأكثر غرابة.'],
      reading:['جهّز غرضًا واضحًا للقراءة ونموذجًا للعثور على شاهد في النص.','اسأل: أي عبارة تدعم استنتاجك من النص؟','لاحظ الاستدلال بالشواهد لا التذكر الحرفي وحده.'],
      organizing:['اطلب توضيح المعيار الذي بُني عليه التصنيف أو التلخيص.','اسأل: لماذا وضعت هذه الفكرة هنا؟ وما العلاقة بينها وبين غيرها؟','تحقق من منطق التنظيم ودقته وعلاقته بالمحتوى.']
    }[cat] || ['ابدأ بسؤال واضح ووقت كافٍ للمشاركة.', 'اسأل: ماذا تعلمت؟ وما دليلك؟', 'راقب استجابات الطلاب الفعلية.'];
    return {
      pattern:p,
      key:kind,
      start:ex.prompt || `ما الذي نريد فهمه من موضوع ${ex.topic || 'الدرس'}؟`,
      evidence:ex.outcome || 'استجابة فردية واضحة مرتبطة بهدف الدرس.',
      teacher:p.roles,
      student:p.students,
      focus:template[0], reflection:template[1], observer:template[2],
      scaffold:'لمن يحتاج دعمًا: قدم مثالًا محلولًا جزئيًا، أو مفردات مفتاحية، أو شريكًا داعمًا. اسمح بالتعبير شفهيًا أو كتابيًا أو بالرسم وفق هدف التعلم.',
      stretch:'لمن يحتاج تحديًا إضافيًا: اطلب مقارنة تفسيرين، أو تقديم دليل مضاد، أو تطبيق الفكرة في موقف جديد.',
      feedback:'امنح تعقيبًا قصيرًا يحدد ما تحقق وما الخطوة التالية، ثم اسمح بتعديل الاستجابة.',
      closure:'اطلب من كل متعلم إكمال عبارة: «تعلمتُ… وأحتاج أن أتحقق من…» أو تقديم بطاقة خروج قصيرة.'
    };
  }
  function classroomMap(strategy) {
    const a=pedagogicalAdvice(strategy), kind=a.key, p=a.pattern;
    const seat=(x,y,i)=>`<g><rect x="${x-17}" y="${y+12}" width="34" height="12" rx="6" fill="#cce8e9" stroke="#1f808a" stroke-width="1.6"/><circle cx="${x}" cy="${y}" r="12" fill="${i%2?'#d8eeff':'#e4f7ed'}" stroke="#277c8b" stroke-width="1.7"/><circle cx="${x}" cy="${y-2}" r="3.3" fill="#277c8b"/></g>`;
    const special=kind==='fishbowl'?'<ellipse cx="263" cy="126" rx="65" ry="54" fill="none" stroke="#de9b55" stroke-width="3" stroke-dasharray="8 7"/><ellipse cx="263" cy="124" rx="180" ry="104" fill="none" stroke="#9fcad0" stroke-width="2" stroke-dasharray="5 8"/>':kind==='groups'?'<rect x="80" y="58" width="132" height="122" rx="20" fill="#e9f8f4"/><rect x="301" y="58" width="132" height="122" rx="20" fill="#e8f5fc"/>':kind==='movement'?'<path d="M146 119 H214 M293 119 H359" stroke="#db9650" stroke-width="4" stroke-linecap="round" stroke-dasharray="8 9"/><path d="M204 110 L218 119 L204 128 M349 110 L363 119 L349 128" fill="none" stroke="#db9650" stroke-width="3"/>':'';
    const teacher='<g><rect x="491" y="30" width="130" height="53" rx="13" fill="#e2f3f5" stroke="#7aa9b0"/><text x="556" y="51" font-size="15" font-weight="bold" fill="#174a55" text-anchor="middle">المعلم</text><text x="556" y="71" font-size="12" fill="#386878" text-anchor="middle">يوجّه ويلاحظ</text></g>';
    const links=(kind==='pairs'||kind==='circle')?p.links.map(([x1,x2])=>`<path d="M${x1+22} 126 H${x2-22}" stroke="#cda36d" stroke-dasharray="4 5" stroke-width="2.5"/>`).join(''):'';
    const desks=kind==='groups'?'<rect x="113" y="107" width="68" height="22" rx="10" fill="#b8e3dd"/><rect x="335" y="107" width="68" height="22" rx="10" fill="#b8e3dd"/>':'';
    return `<figure class="class-map"><svg viewBox="0 0 640 245" role="img" aria-label="مخطط تربوي مقترح لتوزيع الطلاب: ${escapeHTML(p.label)}"><rect x="4" y="4" width="632" height="237" rx="22" fill="#f8fcfd" stroke="#cfe1e7"/><rect x="33" y="25" width="445" height="195" rx="18" fill="#fff" stroke="#e1edf0"/>${special}${links}${desks}${p.seats.map(([x,y],i)=>seat(x,y,i)).join('')}${teacher}<text x="555" y="121" text-anchor="middle" font-size="15" font-weight="bold" fill="#1b5d69">${escapeHTML(p.label)}</text><text x="555" y="149" text-anchor="middle" font-size="12" fill="#456c77">رسم تنظيمي</text><text x="555" y="168" text-anchor="middle" font-size="12" fill="#456c77">وليس ترتيبًا إلزاميًا</text></svg><figcaption><strong>${escapeHTML(p.label)}:</strong> ${escapeHTML(p.sub)}. يمكن تكييف ترتيب المقاعد أو تنفيذ النشاط دون حركة.</figcaption></figure>`;
  }
  function buildPedagogyPanel(strategy) {
    const a=pedagogicalAdvice(strategy);
    return `<section class="panel pedagogy-panel" aria-label="خريطة التنفيذ التربوي">
      <div class="panel-head"><div><span class="eyebrow">إضافة تربوية تطبيقية</span><h3>كيف أطبّقها فعلًا داخل الفصل؟</h3><p>توزيع مقترح للمتعلمين، مع أدوار وأدلة تعلم واضحة مستمدة من هدف ومثال هذه الاستراتيجية.</p></div></div>
      <div class="pedagogy-layout"><div>${classroomMap(strategy)}</div><div class="pedagogy-role-grid">
        <article><span>👩‍🏫 دور المعلم</span><p>${escapeHTML(a.teacher)}</p></article>
        <article><span>👥 دور المتعلمين</span><p>${escapeHTML(a.student)}</p></article>
        <article><span>🔍 ما الذي ألاحظه؟</span><p>${escapeHTML(a.observer)}</p></article>
        <article><span>🎯 دليل تعلم قابل للملاحظة</span><p>${escapeHTML(a.evidence)}</p></article>
      </div></div>
      <details class="teacher-details"><summary>🧩 تكييف النشاط لجميع المتعلمين + التغذية الراجعة</summary><div class="teacher-details-body"><p><strong>دعم:</strong> ${escapeHTML(a.scaffold)}</p><p><strong>إثراء:</strong> ${escapeHTML(a.stretch)}</p><p><strong>تغذية راجعة:</strong> ${escapeHTML(a.feedback)}</p><p><strong>تأمل ختامي:</strong> ${escapeHTML(a.closure)}</p></div></details>
      <p class="pedagogy-disclaimer">مقترحات تربوية تحريرية لتطبيق الاستراتيجية، وليست ترتيبًا إلزاميًا للمقاعد أو نصًا من الكتاب الأصلي.</p>
    </section>`;
  }

  const SHARE_OPTIONS = [
    { key:'idea', label:'الفكرة المختصرة', icon:'💡', description:'نبذة الاستراتيجية' },
    { key:'steps', label:'خطوات التنفيذ', icon:'🪜', description:'الخطوات مرقمة مع الشرح' },
    { key:'tools', label:'الأدوات المطلوبة', icon:'🧰', description:'قائمة أدوات التجهيز' },
    { key:'example', label:'مثال توضيحي', icon:'📘', description:'المادة والصف والموقف والسؤال والتطبيق والناتج' },
    { key:'details', label:'الهدف والوقت والمراحل', icon:'🎯', description:'معلومات التخطيط السريع' },
    { key:'tip', label:'النصيحة الذهبية', icon:'✨', description:'إرشاد عملي للمعلم' },
    { key:'source', label:'مرجع الاستراتيجيات', icon:'📚', description:'إسناد الكتاب ومصدر المناهج' }
  ];

  function shareText(strategy, selected=state.shareSelection) {
    const ex=strategy.visual?.example;
    if(window.BOUSALA_LANG==='en'){
      const lines=[`🌟 *${strategy.name}*`,'📚 Active Learning Compass'];
      if(selected.idea)lines.push(`💡 *Overview:* ${strategy.summary}`);
      if(selected.steps)lines.push(`🪜 *Steps:*\n${strategy.steps.map(([a,b],i)=>`${i+1}. *${a}:* ${b}`).join('\n')}`);
      if(selected.tools)lines.push(`🧰 *Materials:* ${strategy.tools.join(', ')}`);
      if(selected.example&&ex)lines.push(`📘 *Example:* ${ex.subject}, ${ex.grade} • ${ex.topic}\nQuestion: ${ex.prompt}\nOutcome: ${ex.outcome}`);
      if(selected.details)lines.push(`🎯 *Objective:* ${strategy.goal} • ⏱ ${durationLabel(strategy.minutes)} • Suggested grades: ${stageNames(strategy.stages)}`);
      if(selected.tip)lines.push(`✨ *Teacher tip:* ${strategy.tip}`);
      if(selected.source)lines.push(`📖 *Reference:* ${strategy.reference||''} ${strategy.sourceUrl||''}`);
      lines.push('Biology Unit, Al Buraimi Directorate of Education');return lines.join('\n\n');
    }

    const parts=[`🌟 *${strategy.name}*`, `📚 من بوصلة التعلّم النشط`];
    if(selected.idea) parts.push(`💡 *الفكرة:* ${strategy.summary}`);
    if(selected.steps) parts.push(`🪜 *خطوات التنفيذ:*\n${strategy.steps.map(([title, desc],i)=>`${i+1}. *${title}:* ${desc}`).join('\n')}`);
    if(selected.tools) parts.push(`🧰 *الأدوات:* ${strategy.tools.join('، ')||'أدوات صفية بسيطة'}`);
    if(selected.example && ex) parts.push(`📘 *مثال توضيحي:*\n📘 المادة: ${ex.subject} | ${ex.grade}\n📌 الموضوع: ${ex.topic}\n🏫 الموقف: ${ex.context}\n❓ السؤال: ${ex.prompt}\n👩‍🏫 آلية التنفيذ: ${ex.procedure}\n✅ الناتج: ${ex.outcome}`);
    if(selected.details) parts.push(`🎯 *الهدف:* ${strategy.goal}\n⏱ *الوقت المقترح:* ${durationLabel(strategy.minutes)}\n👥 *صفوف مقترحة فقط:* ${stageNames(strategy.stages)}\n*تنبيه:* جميع الاستراتيجيات قابلة للتطبيق في جميع المراحل مع التكييف المناسب`);
    if(selected.tip) parts.push(`✨ *نصيحة للمعلم:* ${strategy.tip}`);
    if(selected.source) parts.push(`📖 *المرجع:* ${strategy.reference || 'ماشي بن محمد الشمري، 101 استراتيجية في التعلم النشط'}. ${strategy.sourceUrl||''}`);
    parts.push('وحدة الأحياء بتعليمية البريمي\nإعداد\nد. سمية بنت سالم بن محمد النعيمية\nأ. محمد سيد عبد الستار سليم');
    return parts.join('\n\n');
  }

  function openShareOptions(strategyId) {
    const strategy=DATA.find(s=>s.id===strategyId);
    const dlg=byId('shareDialog');
    if(!strategy||!dlg) return;
    state.shareStrategyId=strategyId;
    byId('shareStrategyName').textContent=strategy.name;
    const opts=byId('shareSections');
    opts.innerHTML=SHARE_OPTIONS.map(opt=>`<label class="share-choice"><input type="checkbox" data-share-key="${opt.key}" ${state.shareSelection[opt.key]?'checked':''}><span class="share-choice-icon">${opt.icon}</span><span class="share-choice-content"><strong>${opt.label}</strong><small>${opt.description}</small></span></label>`).join('');
    updateSharePreview();
    if(!dlg.open)dlg.showModal();
    byId('shareSections').querySelector('input')?.focus();
  }

  function updateSharePreview(){
    const strategy=DATA.find(s=>s.id===state.shareStrategyId);
    if(!strategy)return;
    state.shareSelection=Object.fromEntries(SHARE_OPTIONS.map(opt=>[opt.key,Boolean(byId('shareSections').querySelector(`[data-share-key="${opt.key}"]`)?.checked)]));
    save(SHARE_KEY,JSON.stringify(state.shareSelection));
    const content=shareText(strategy,state.shareSelection);
    byId('sharePreview').value=content;
    const total=SHARE_OPTIONS.filter(opt=>state.shareSelection[opt.key]).length;
    byId('shareSelectionCount').textContent=`اخترت ${total} من ${SHARE_OPTIONS.length} أقسام`;
    byId('shareWaSend').disabled=total===0;
    byId('shareNative').disabled=total===0;
    byId('shareCopy').disabled=total===0;
    byId('shareWarning').hidden=total!==0;
  }

  function setupShare(){
    const dlg=byId('shareDialog');
    if(!dlg)return;
    byId('shareSections').addEventListener('change',updateSharePreview);
    byId('selectAllShare').addEventListener('click',()=>{dlg.querySelectorAll('[data-share-key]').forEach(x=>x.checked=true);updateSharePreview()});
    byId('selectNoneShare').addEventListener('click',()=>{dlg.querySelectorAll('[data-share-key]').forEach(x=>x.checked=false);updateSharePreview()});
    byId('closeShare').addEventListener('click',()=>dlg.close());
    byId('shareCancel').addEventListener('click',()=>dlg.close());
    dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close()});
    byId('shareWaSend').addEventListener('click',()=>{
      const strategy=DATA.find(s=>s.id===state.shareStrategyId);if(!strategy)return;
      const text=shareText(strategy,state.shareSelection);
      window.open('https://wa.me/?text='+encodeURIComponent(text),'_blank','noopener,noreferrer');
    });
    byId('shareNative').addEventListener('click',async()=>{
      const strategy=DATA.find(s=>s.id===state.shareStrategyId);if(!strategy)return;
      if(!navigator.share){byId('shareStatus').textContent='المشاركة من الجهاز غير متاحة هنا؛ استخدم واتساب أو نسخ النص.';return}
      try{await navigator.share({title:strategy.name,text:shareText(strategy,state.shareSelection)});byId('shareStatus').textContent='تم فتح قائمة المشاركة.';}
      catch(e){if(e.name!=='AbortError')byId('shareStatus').textContent='لم تكتمل المشاركة، جرّب خيار النسخ.'}
    });
    byId('shareCopy').addEventListener('click',async()=>{
      const text=byId('sharePreview').value;
      try{await navigator.clipboard.writeText(text);byId('shareStatus').textContent='✓ تم نسخ الأقسام المحددة';}
      catch{const area=byId('sharePreview');area.focus();area.select();try{document.execCommand('copy');byId('shareStatus').textContent='✓ تم نسخ الأقسام المحددة';}catch{byId('shareStatus').textContent='تعذر النسخ؛ يمكنك تحديد النص ونسخه يدويًا.'}}
    });
  }

  function classroomExample(strategy) {
    const ex = strategy.visual?.example;
    if (!ex) return '';
    return `<section class="example-panel panel" aria-label="مثال توضيحي">
      <div class="example-head"><div><span class="example-kicker">تطبيق فوري قابل للتكييف</span><h3>مثال توضيحي</h3></div><span class="example-badge">نشاط مقترح</span></div>
      <div class="example-subject"><span>📚 ${escapeHTML(ex.subject)}</span><span>🎓 ${escapeHTML(ex.grade||'صف مقترح')}</span><span>📌 ${escapeHTML(ex.topic)}</span></div>
      <p class="oman-context"><strong>🏫 الموقف:</strong> ${escapeHTML(ex.context||'نشاط تطبيقي مرتبط بموضوع الدرس.')}</p>
      <div class="example-prompts">
        <div class="example-unit"><span class="example-number">01</span><div><strong>السؤال أو الموقف</strong><p>${escapeHTML(ex.prompt)}</p></div></div>
        <div class="example-unit"><span class="example-number">02</span><div><strong>هكذا ينفّذها المعلم مع الطلاب</strong><p>${escapeHTML(ex.procedure)}</p></div></div>
        <div class="example-unit"><span class="example-number">03</span><div><strong>الأثر الذي نتحقق منه</strong><p>${escapeHTML(ex.outcome)}</p></div></div>
      </div>
      <p class="example-disclaimer">مثال توضيحي مقترح؛ يمكن تكييف الموقف والصف والموضوع بما يلائم أهداف الدرس، ولا يمثل نقلًا حرفيًا من كتاب مدرسي.</p>
    </section>`;
  }

  function buildEvaluationPanel(strategy) {
    const ex = strategy.visual?.example || {};
    const outcome = ex.outcome ? String(ex.outcome) : 'استجابة توضح فهم الفكرة الأساسية.';
    return `<section class="panel evaluation-panel" aria-label="التقويم والتمايز">
      <div class="panel-head"><div><h3>كيف أتحقق من التعلم؟</h3><p>مؤشرات سريعة يقترحها التطبيق بعد تنفيذ النشاط.</p></div></div>
      <div class="evaluation-grid">
        <div><strong>✅ دليل تحقق مقترح</strong><p>${escapeHTML(outcome)}</p></div>
        <div><strong>🗣 التقويم</strong><p>${escapeHTML(strategy.assessment || 'ما الفكرة التي تعلمتها وما الدليل؟')}</p></div>
        <div><strong>🧩 التكييف للفروق الفردية</strong><p>${escapeHTML(strategy.adaptation || 'نوّع مستوى الدعم وطريقة الاستجابة')}</p></div>
      </div>
      <p class="evaluation-note">هذه أفكار مساندة للمعلم، تُكيّف وفق الهدف والصف والأدلة المتاحة.</p>
    </section>`;
  }

  function strategyURL(id) {
    const url=new URL(location.href);
    url.searchParams.set('strategy',String(id));url.hash='';return url.href;
  }
  function canonicalStrategyURL(id){return window.BOUSALA_LINKS.strategy(id,window.BOUSALA_LANG);}
  function getStrategyParam(){ const n=Number(new URL(location.href).searchParams.get('strategy'));return Number.isInteger(n)&&DATA.some(s=>s.id===n)?n:null; }
  function syncStrategyURL(id){if(location.protocol==='file:' || reactingToHistory) return; if(getStrategyParam()===id)return;const url=new URL(location.href);url.searchParams.set('strategy',String(id));history.pushState({strategy:id},'',url);}
  function clearStrategyURL(){if(location.protocol==='file:'||reactingToHistory||!getStrategyParam())return;const url=new URL(location.href);url.searchParams.delete('strategy');history.replaceState({},'',url);}

  function openGuide(id, show = true) {
    const strategy = DATA.find(item => item.id === id);
    if (!strategy) return;
    state.currentId = id;
    save(LAST_KEY,String(id));
    if(show)syncStrategyURL(id);
    const fav = state.favorites.has(id);
    const previewTags = strategyPreviewTags(strategy);

    el.content.innerHTML = `
      <div class="category-banner" style="${colorStyle(strategy)}"><span class="category-bullet"></span> ${escapeHTML(V.category(strategy).label)} <span class="category-banner-number">دليل رقم ${displayNumber(strategy.id)}</span></div>
      <section class="dialog-hero" style="${colorStyle(strategy)}">
        <div class="hero-panel">
          <span class="chip">الاستراتيجية رقم ${displayNumber(strategy.id)}</span>
          <h2 id="dialogTitle">${escapeHTML(strategy.name)}</h2>
          <p lang="en" dir="ltr" style="text-align:right;color:var(--primary);font-weight:700">${escapeHTML(strategy.english)}</p>
          <p>${escapeHTML(strategy.summary)}</p>
          <div class="dialog-badges" style="margin-top:14px">
            <span class="chip">🎯 ${escapeHTML(strategy.goal)}</span>
            <span class="chip">⏱ ${durationLabel(strategy.minutes)}</span>
            <span class="chip">👥 ترشيح: ${escapeHTML(stageNames(strategy.stages))}</span>
          </div>
        </div>
        <div class="hero-preview">
          <div class="large-illustration">${createIllustration(strategy, true)}</div>
          <div class="preview-tags">${previewTags.map(tag => `<span class="preview-tag">${escapeHTML(tag)}</span>`).join('')}</div>
          <p class="preview-note">مخطط متجهي خاص بآلية الاستراتيجية؛ يوضح شكل التفاعل وتسلسل الخطوات.</p>
        </div>
      </section>


      <section class="dialog-grid">
        <div class="info-stack">
          <article class="panel">
            <div class="panel-head">
              <div>
                <h3>الأدوات المصوّرة</h3>
                <p>ماذا أحتاج قبل أن أبدأ؟</p>
              </div>
            </div>
            <div class="tool-gallery">${buildToolsGallery(strategy)}</div>
          </article>

          <article class="panel">
            <div class="panel-head">
              <div>
                <h3>خطوات التنفيذ</h3>
                <p>خطوات مرتبة وواضحة لتطبيق الاستراتيجية مباشرة.</p>
              </div>
            </div>
            <div class="step-list">${buildStepList(strategy)}</div>
          </article>
        </div>

        <div class="side-stack">

          <article class="panel">
            <div class="panel-head">
              <div>
                <h3>إرشادات تطبيق للمعلم</h3>
                <p>ملحوظات تربوية قصيرة ترفع فاعلية التنفيذ.</p>
              </div>
            </div>
            <div class="teacher-notes">${buildTeacherNotes(strategy)}</div>
          </article>

          <article class="tip-card">
            <div class="tip-mark">✨</div>
            <div>
              <strong>نصيحة ذهبية للمعلم</strong>
              <p>${escapeHTML(strategy.tip)}</p>
            </div>
          </article>
        </div>
      </section>

      ${classroomExample(strategy)}
      ${buildPedagogyPanel(strategy)}
      ${buildEvaluationPanel(strategy)}
      ${window.AL101_V63?.renderGuide(strategy)||''}
      <section class="readiness-panel panel" aria-labelledby="readinessTitle"><h3 id="readinessTitle">بطاقة جاهزية الاستراتيجية للتطبيق</h3><p>تحقّق من أربع نقاط قبل بدء الحصة. هذه قائمة إرشادية وليست حكمًا على جاهزية الطلاب.</p>
        <div class="readiness-grid"><label><input type="checkbox" class="readiness-check" /> <span><b>ناتج التعلم واضح</b><small>${escapeHTML(strategy.goal)}</small></span></label><label><input type="checkbox" class="readiness-check" /><span><b>تنظيم المشاركة محدد</b><small>${escapeHTML(pedagogicalAdvice(strategy).pattern.label)}</small></span></label><label><input type="checkbox" class="readiness-check" /><span><b>التقويم جاهز</b><small>كيف أعرف أن الطلاب تعلموا؟</small></span></label><label><input type="checkbox" class="readiness-check" /><span><b>بدائل المشاركة متاحة</b><small>إجابة شفوية أو كتابية أو بصرية</small></span></label></div><p id="readinessStatus" role="status" aria-live="polite">0 من 4 نقاط جاهزة</p></section>



      <div class="dialog-actions">
        <button id="shareWhatsApp" class="btn primary" type="button">◉ اختر ما تريد مشاركته</button>
        <button id="modalFav" class="btn secondary" type="button" aria-pressed="${fav}">${fav ? '♥ إزالة من المفضلة' : '♡ أضف إلى المفضلة'}</button>
        <button id="copySummary" class="btn secondary" type="button">تحديد أقسام للنسخ</button>
        <button id="makeLessonPlan" class="btn secondary lesson-plan-trigger" type="button">📋 استخدمها في درسي</button>
        <button id="startClassroom" class="btn primary classroom-trigger" type="button">▶ ابدأ التطبيق في الصف</button>
        <button id="makeShareImage" class="btn secondary" type="button">🖼 حفظ / مشاركة بطاقة مصوّرة</button>
        <button id="shareStrategyLink" class="btn secondary" type="button">🔗 رابط وQR لهذه الاستراتيجية</button>
      </div>
<p id="shareCardStatus" class="share-card-status" role="status" aria-live="polite"></p>
      <p class="dialog-note">📚 <strong>المرجع:</strong> ${escapeHTML(strategy.reference || 'ماشي بن محمد الشمري، 101 استراتيجية في التعلم النشط')}${strategy.sourcePages?.length ? ` • صفحات مرجعية: ${strategy.sourcePages.join('، ')}` : ''}${strategy.sourceUrl ? ` • <a href="${escapeHTML(strategy.sourceUrl)}" target="_blank" rel="noopener noreferrer">عرض المصدر</a>` : ''}. الأمثلة والرسوم والأوقات مقترحات تطبيقية قابلة للتكييف.</p>
    `;

    el.content.querySelectorAll('.readiness-check').forEach(input=>input.addEventListener('change',()=>{const count=el.content.querySelectorAll('.readiness-check:checked').length;byId('readinessStatus').textContent=`${count} من 4 نقاط جاهزة`; }));
    byId('modalFav').addEventListener('click', () => toggleFavorite(id));
    byId('shareWhatsApp').addEventListener('click',()=>openShareOptions(id));
    byId('copySummary').addEventListener('click',()=>openShareOptions(id));
    byId('makeLessonPlan').addEventListener('click',()=>openLessonPlan(id));
    byId('startClassroom').addEventListener('click',()=>window.AL101_V64?.openClassroom(strategy));
    byId('makeShareImage').addEventListener('click',()=>createShareCard(strategy));
    byId('shareStrategyLink').addEventListener('click',()=>openQRCode(id));
    window.AL101_V63?.mountGuide(strategy,el.content);

    if (show && !el.dialog.open) {
      el.dialog.showModal();
      byId('closeDialog').focus();
    }
  }

  function resetFilters() {
    el.search.value = '';
    el.quickName.value = '';
    closeNameSuggestions();
    updateClearQuick();
    el.goal.value = '';
    el.category.value = '';
    el.time.value = '';
    el.stage.value = '';
    state.onlyFavorites = false;
    state.visibleLimit = 18;
    updateTabs();
    render();
  }

  function syncStagePills() {
    document.querySelectorAll('[data-stage-chip]').forEach(btn=>{
      const active=btn.dataset.stageChip===el.stage.value;
      btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active));
    });
  }

  function updateTabs() {
    el.all.classList.toggle('active', !state.onlyFavorites);
    el.favs.classList.toggle('active', state.onlyFavorites);
    el.all.setAttribute('aria-pressed', String(!state.onlyFavorites));
    el.favs.setAttribute('aria-pressed', String(state.onlyFavorites));
    const dock=byId('dockFavorites');if(dock){dock.setAttribute('aria-pressed',String(state.onlyFavorites));dock.classList.toggle('active',state.onlyFavorites);}
  }

  function applyTheme(mode) {
    document.body.classList.toggle('dark', mode === 'dark');
    el.theme.textContent = mode === 'dark' ? '☀' : '☾';
    el.theme.setAttribute('aria-label', mode === 'dark' ? 'تفعيل الوضع النهاري' : 'تفعيل الوضع الليلي');
    save(THEME_KEY, mode);
  }

  function closeNameSuggestions() {
    el.suggestions.hidden = true;
    el.suggestions.innerHTML = '';
    el.quickName.setAttribute('aria-expanded', 'false');
  }
  function updateClearQuick() { el.clearQuick.hidden = !el.quickName.value; }
  function renderNameSuggestions() {
    const q = norm(el.quickName.value);
    updateClearQuick();
    if (!q) { closeNameSuggestions(); return; }
    const matches = DATA.filter(strategy => nameMatches(strategy, q))
      .sort((a, b) => Number(norm(b.name).startsWith(q)) - Number(norm(a.name).startsWith(q)) || a.id - b.id)
      .slice(0, 6);
    el.suggestions.innerHTML = matches.length
      ? matches.map(s => `<button class="name-option" type="button" data-quick-open="${s.id}"><span class="name-option-num">${displayNumber(s.id)}</span><span>${escapeHTML(s.name)}</span><span class="name-option-arrow" aria-hidden="true">↗</span></button>`).join('')
      : '<p class="name-empty">لا توجد استراتيجية بهذا الاسم. جرّب جزءًا آخر من الاسم.</p>';
    el.suggestions.hidden = false;
    el.quickName.setAttribute('aria-expanded', 'true');
  }
  function setupNameSearch() {
    el.quickName.addEventListener('input', () => { if(el.quickName.value.trim())el.search.value='';state.visibleLimit=18;renderNameSuggestions(); render(); });
    el.quickName.addEventListener('focus', () => { if (el.quickName.value) renderNameSuggestions(); });
    el.clearQuick.addEventListener('click', () => { el.quickName.value = ''; closeNameSuggestions(); updateClearQuick(); render(); el.quickName.focus(); });
    el.suggestions.addEventListener('click', event => {
      const target = event.target.closest('[data-quick-open]');
      if (!target) return;
      const id = Number(target.dataset.quickOpen);
      closeNameSuggestions();
      openGuide(id);
    });
    el.quickName.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeNameSuggestions();
      if (event.key === 'Enter') {
        const first = el.suggestions.querySelector('[data-quick-open]');
        if (first) { event.preventDefault(); closeNameSuggestions(); openGuide(Number(first.dataset.quickOpen)); }
      }
      if (event.key === 'ArrowDown') {
        const first = el.suggestions.querySelector('[data-quick-open]');
        if (first) { event.preventDefault(); first.focus(); }
      }
    });
    el.suggestions.addEventListener('keydown', event => {
      if (event.key === 'Escape') { closeNameSuggestions(); el.quickName.focus(); }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        const opts = [...el.suggestions.querySelectorAll('[data-quick-open]')];
        const i = opts.indexOf(document.activeElement);
        const next = event.key === 'ArrowDown' ? i + 1 : i - 1;
        if (next >= 0 && next < opts.length) { event.preventDefault(); opts[next].focus(); }
      }
    });
    document.addEventListener('click', event => {
      if (!event.target.closest('.name-finder')) closeNameSuggestions();
    });
  }


  let planStrategyId = null;
  function getPlanText() {
    const personalized = window.BOUSALA_OMAN_PLANNER?.getPlanText?.();
    if(personalized) return personalized;
    const s = DATA.find(x=>x.id===planStrategyId);
    if(!s) return '';
    const title=byId('lessonTitle').value.trim()||'يحدده المعلم';
    const subject=byId('lessonSubject').value.trim()||'بحسب المادة الدراسية';
    const grade=byId('lessonGrade').value.trim()||'يحدده المعلم';
    const objective=byId('lessonObjective').value.trim()||s.goal;
    const ex=s.visual?.example;
    const a=pedagogicalAdvice(s);
    return [
      `خطة نشاط تعليمي — ${s.name}`,
      `عنوان الدرس: ${title}`,
      `المادة: ${subject} | الصف: ${grade}`,
      `الهدف التعليمي: ${objective}`,
      `الاستراتيجية: ${s.name} | الزمن المقترح: ${durationLabel(s.minutes)}`,
      `الأدوات: ${s.tools.join('، ')||'أدوات صفية بسيطة'}`,
      'خطوات التنفيذ:',
      ...s.steps.map(([name,desc],i)=>`${i+1}- ${name}: ${desc}`),
      ex ? `مثال توضيحي قابل للتكييف: ${ex.topic} — ${ex.prompt}` : '',
      `توزيع الطلاب المقترح: ${a.pattern.label} — ${a.pattern.sub}`,
      `دور المعلم: ${a.teacher}`,
      `دور المتعلمين: ${a.student}`,
      `سؤال البداية: ${a.start}`,
      ex ? `مؤشر تحقق مقترح: ${ex.outcome}` : `مؤشر تحقق: ${a.evidence}`,
      `ما ألاحظه: ${a.observer}`,
      `تقويم ختامي: سؤال شفهي أو بطاقة خروج قصيرة تبين أهم ما تعلمه الطالب.`,
      `دعم: ${a.scaffold}`,
      `إثراء: ${a.stretch}`,
      `تغذية راجعة: ${a.feedback}`,
      `تأمل ختامي: ${a.closure}`,
      `ملاحظة: هذه مسودة إرشادية وليست نموذج تحضير رسميًا.`,
      `وحدة الأحياء بتعليمية البريمي`,
      `إعداد: د. سمية بنت سالم بن محمد النعيمية — أ. محمد سيد عبد الستار سليم`,
      `المرجع: ${s.reference || 'ماشي بن محمد الشمري، 101 استراتيجية في التعلم النشط'}.`
    ].filter(Boolean).join('\n\n');
  }

  function refreshPlan() {
    byId('lessonPlanPreview').textContent=getPlanText();
    byId('lessonPlanStatus').textContent='';
    window.BOUSALA_OMAN_PLANNER?.onFormChange?.();
  }

  function openLessonPlan(id) {
    const s=DATA.find(x=>x.id===id);
    if(!s) return;
    planStrategyId=id;
    editingPlanId=null;
    byId('lessonStrategyName').textContent=(window.BOUSALA_LANG==='en'?'Teacher-selected strategy: ':'الاستراتيجية المختارة من المعلم: ')+s.name;
    for(const field of ['lessonTitle','lessonSubject','lessonGrade','lessonObjective','lessonUnit','lessonResources','lessonNotes'])byId(field).value='';
    byId('lessonSemester').value='الأول';
    byId('lessonTime').value='40';
    window.BOUSALA_OMAN_PLANNER?.onOpen?.(s);
    refreshPlan();
    const dlg=byId('lessonPlanDialog');
    if(!dlg.open) dlg.showModal();
  }

  async function copyText(text) {
    if(navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return; }
    const temp=document.createElement('textarea'); temp.value=text;temp.style.position='fixed';temp.style.opacity='0';document.body.append(temp);temp.select();
    const copied=document.execCommand('copy');temp.remove();if(!copied)throw new Error('Copy unsuccessful');
  }

  function setupLessonPlan() {
    const dlg=byId('lessonPlanDialog');
    const close=()=>{dlg.close();planStrategyId=null;};
    byId('closeLessonPlan').addEventListener('click',close);
    byId('closeLessonPlanBottom').addEventListener('click',close);
    dlg.addEventListener('click',event=>{if(event.target===dlg)close();});
    byId('lessonPlanForm').addEventListener('submit',event=>event.preventDefault());
    byId('lessonPlanForm').addEventListener('input',refreshPlan);
    byId('lessonPlanForm').addEventListener('change',refreshPlan);
    byId('saveLessonPlan').addEventListener('click',()=>{
      if(!planStrategyId)return;
      const fields=Object.fromEntries(['lessonTitle','lessonSubject','lessonGrade','lessonObjective','lessonSemester','lessonTime','lessonUnit','lessonResources','lessonNotes'].map(k=>[k,String(byId(k)?.value||'').trim()]));
      const item={id:editingPlanId||`p-${Date.now()}-${Math.floor(Math.random()*1e5)}`,strategyId:planStrategyId,fields,proposal:window.BOUSALA_OMAN_PLANNER?.getSavedProposal?.()||null,updatedAt:new Date().toISOString()};
      bag.plans=bag.plans.filter(p=>p.id!==item.id);bag.plans.unshift(item);bag.plans=bag.plans.slice(0,120);
      if(persistBag()){editingPlanId=item.id;byId('lessonPlanStatus').textContent='✓ حُفظت الخطة داخل حقيبتي التعليمية على هذا الجهاز.';}
      else byId('lessonPlanStatus').textContent='تعذر حفظ الخطة. تحقق من مساحة التخزين أو إعدادات المتصفح.';
    });
    byId('copyLessonPlan').addEventListener('click',async()=>{
      try{await copyText(getPlanText());byId('lessonPlanStatus').textContent='✓ تم نسخ خطة النشاط.';}
      catch{byId('lessonPlanStatus').textContent='تعذر النسخ التلقائي. حدد النص من المعاينة وانسخه يدويًا.';}
    });
    byId('printLessonPlan').addEventListener('click',()=>{
      const text=getPlanText();
      let sheet=byId('lessonPrintSheet');
      if(!sheet){sheet=document.createElement('section');sheet.id='lessonPrintSheet';sheet.setAttribute('aria-label','خطة النشاط للطباعة');document.body.append(sheet);}
      sheet.replaceChildren();
      const heading=document.createElement('h1');heading.textContent=window.BOUSALA_LANG==='en'?'Active Learning Compass — Classroom Activity Plan':'بوصلة التعلّم النشط — خطة نشاط';
      const details=document.createElement('pre');details.textContent=text;
      const credits=document.createElement('p');credits.textContent=window.BOUSALA_LANG==='en'?'Biology Unit — Al Buraimi Directorate of Education':'وحدة الأحياء بتعليمية البريمي — إعداد: د. سمية بنت سالم بن محمد النعيمية، أ. محمد سيد عبد الستار سليم';
      sheet.append(heading,details,credits);
      document.body.classList.add('printing-lesson');
      byId('lessonPlanStatus').textContent='سيظهر خيار الطباعة أو حفظ PDF من المتصفح. إذا لم يظهر، يمكنك نسخ الخطة.';
      const cleanup=()=>{document.body.classList.remove('printing-lesson');window.removeEventListener('afterprint',cleanup);};
      window.addEventListener('afterprint',cleanup,{once:true});
      try{window.print();}
      catch{cleanup();byId('lessonPlanStatus').textContent='لم تفتح الطباعة في هذا المتصفح؛ استخدم زر نسخ الخطة أو افتح الموقع في Safari أو Chrome.';}
      setTimeout(cleanup,120000);
    });
  }

  function setupFilters() {
    const goals = [...new Set(DATA.map(item => item.goal))].sort((a, b) => a.localeCompare(b, 'ar'));
    goals.forEach(goal => {
      const option = document.createElement('option');
      option.value = goal;
      option.textContent = goal;
      el.goal.append(option);
    });

    Object.entries(CATEGORIES).forEach(([key, c]) => { const opt = document.createElement('option'); opt.value = key; opt.textContent = c.label; el.category.append(opt); });

    [el.search, el.goal, el.category, el.time, el.stage].forEach(control => {
      control.addEventListener(control === el.search ? 'input' : 'change', () => {if(control===el.search&&el.search.value.trim()&&el.quickName.value){el.quickName.value='';closeNameSuggestions();updateClearQuick();}state.visibleLimit=18;syncStagePills();render();});
    });
    byId('loadMoreBtn').addEventListener('click', () => {state.visibleLimit += 18;render();});
    document.querySelectorAll('[data-stage-chip]').forEach(btn=>btn.addEventListener('click',()=>{el.stage.value=btn.dataset.stageChip;state.visibleLimit=18;syncStagePills();render();}));

    byId('categoryLegend').addEventListener('click', event => {
      const target = event.target.closest('[data-category]');
      if (!target) return;
      el.category.value = el.category.value === target.dataset.category ? '' : target.dataset.category;
      state.visibleLimit = 18;
      render();
      el.grid.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
    });

    el.grid.addEventListener('click', event => {
      const fav = event.target.closest('[data-fav]');
      const open = event.target.closest('[data-open]');
      if (fav) toggleFavorite(Number(fav.dataset.fav));
      else if (open) openGuide(Number(open.dataset.open));
      else {
        const card = event.target.closest('[data-card]');
        if (card) openGuide(Number(card.dataset.card));
      }
    });

    el.all.addEventListener('click', () => { state.onlyFavorites = false; state.visibleLimit=18; updateTabs(); render(); });
    el.favs.addEventListener('click', () => { state.onlyFavorites = true; state.visibleLimit=18; updateTabs(); render(); });
    byId('resetBtn').addEventListener('click', resetFilters);
    byId('emptyReset').addEventListener('click', resetFilters);
  }

  function setupDialog() {
    byId('closeDialog').addEventListener('click', () => el.dialog.close());
    el.dialog.addEventListener('click', event => { if (event.target === el.dialog) el.dialog.close(); });
    el.dialog.addEventListener('close', () => { state.currentId = null; clearStrategyURL(); });
    window.addEventListener('popstate',()=>{reactingToHistory=true;try{const id=getStrategyParam();if(id){openGuide(id,false);if(!el.dialog.open)el.dialog.showModal();}else if(el.dialog.open)el.dialog.close();}finally{reactingToHistory=false;}});
  }

  function setupThemeAndInstall() {
    applyTheme(safeRead(THEME_KEY) || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
    el.theme.addEventListener('click', () => applyTheme(document.body.classList.contains('dark') ? 'light' : 'dark'));

    const installBtn = byId('installBtn');
    const installDialog = byId('installDialog');
    const installNowBtn = byId('installNowBtn');
    const installState = byId('installState');
    let pendingInstallPrompt = null;
    let serviceReady = false;
    const connectionBadge = byId('connectivityStatus');
    function refreshConnection() {
      if (!connectionBadge) return;
      const online = navigator.onLine;
      connectionBadge.textContent = online ? '● متصل' : '● دون إنترنت';
      connectionBadge.classList.toggle('is-offline', !online);
      connectionBadge.title = online ? 'الاتصال متاح' : 'يمكن استخدام المحتوى المحفوظ دون إنترنت';
    }
    window.addEventListener('online', refreshConnection);
    window.addEventListener('offline', refreshConnection);
    refreshConnection();

    const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    const hasSecureOrigin = () => window.isSecureContext && (location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname));

    function refreshInstallStatus() {
      const isLocalFile=location.protocol==='file:';
      const isApple=/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
      const secure=hasSecureOrigin();
      const hasWorker='serviceWorker' in navigator;
      let message='';
      if(isStandalone()){
        message='✓ التطبيق مفتوح في وضع التثبيت بالفعل.';
        installBtn.textContent='✓ التطبيق مثبت';
        installNowBtn.hidden=true;
      }else if(isLocalFile){
        message='⚠ الملف المحلي يسمح بالمعاينة فقط، ولا يمكن تثبيته كتطبيق. ارفع ملفات المشروع إلى GitHub Pages ثم افتح رابط الموقع HTTPS.';
        installNowBtn.hidden=true;
      }else if(!secure){
        message='⚠ التثبيت يحتاج رابطًا آمنًا HTTPS أو بيئة اختبار localhost.';
        installNowBtn.hidden=true;
      }else if(isApple){
        message='📱 على iPhone وiPad: افتح الموقع من Safari ثم اضغط مشاركة ← إضافة إلى الشاشة الرئيسية.';
        installNowBtn.hidden=true;
      }else if(pendingInstallPrompt){
        message='✓ هذا المتصفح أتاح التثبيت المباشر. اضغط «تثبيت الآن».';
        installNowBtn.hidden=false;
      }else{
        message='التطبيق جاهز للعمل كموقع. إن لم يظهر خيار «تثبيت الآن»، افتح قائمة Chrome أو Edge واختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».';
        installNowBtn.hidden=true;
      }
      installState.textContent=message;
      const checks=[
        `${secure?'✅':'⚠️'} اتصال آمن: ${secure?'نعم':'مطلوب HTTPS للاستضافة'}`,
        `${serviceReady?'✅':hasWorker?'ℹ️':'⚠️'} تخزين للاستخدام دون إنترنت: ${serviceReady?'جاهز':hasWorker?'يتفعّل بعد التحميل الأول':'غير متاح'}`,
        `${isStandalone()?'✅':'ℹ️'} حالة التثبيت: ${isStandalone()?'مثبت':'لم يتم تأكيد التثبيت'}`
      ];
      const check=byId('installCheck');
      if(check)check.replaceChildren(...checks.map(msg=>{const line=document.createElement('span');line.textContent=msg;return line;}));
    }

    installBtn.addEventListener('click', () => { refreshInstallStatus(); installDialog.showModal(); });
    byId('closeInstall').addEventListener('click', () => installDialog.close());
    byId('dismissInstall').addEventListener('click', () => installDialog.close());
    installDialog.addEventListener('click', event => { if (event.target === installDialog) installDialog.close(); });

    window.addEventListener('beforeinstallprompt', event => {
      event.preventDefault();
      pendingInstallPrompt = event;
      refreshInstallStatus();
    });

    window.addEventListener('appinstalled', () => {
      pendingInstallPrompt = null;
      refreshInstallStatus();
      installDialog.close();
    });

    installNowBtn.addEventListener('click', async () => {
      if (!pendingInstallPrompt) return;
      const prompt = pendingInstallPrompt;
      pendingInstallPrompt = null;
      installNowBtn.hidden = true;
      try {
        await prompt.prompt();
        const choice = await prompt.userChoice;
        installState.textContent = choice.outcome === 'accepted'
          ? 'تمت الموافقة على التثبيت. ابحث عن أيقونة التطبيق على جهازك.'
          : 'يمكنك تثبيت التطبيق لاحقًا من قائمة المتصفح.';
      } catch {
        installState.textContent = 'لم يبدأ التثبيت. جرّب التثبيت من قائمة المتصفح.';
      }
    });

    refreshInstallStatus();

    if ('serviceWorker' in navigator && hasSecureOrigin()) {
      navigator.serviceWorker.addEventListener('controllerchange',()=>{serviceReady=true;refreshInstallStatus();});
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js', { scope: './' }).then(registration => {
          const check=byId('installCheck');
          if(check){const line=document.createElement('span');line.textContent='✅ ملفات العمل دون إنترنت: تم تسجيلها';check.append(line);}
          registration.update().catch(()=>{});
          navigator.serviceWorker.ready.then(()=>{serviceReady=true;refreshInstallStatus();}).catch(()=>{});
        }).catch(error => {
          installState.textContent='يمكن تصفح التطبيق، لكن تشغيله دون إنترنت لم يتفعّل. تأكد من وجود ملف sw.js ومن فتح الرابط عبر HTTPS.';
          console.warn('تعذر تفعيل العمل دون اتصال:', error);
        });
      });
    }
  }


  const FONT_KEY='active-learning-reader-font-v1';
  function setupMobileNavigation() {
    const button=byId('textSizeBtn');
    function setReaderLarge(large){document.documentElement.classList.toggle('reader-large',large);button.setAttribute('aria-pressed',String(large));button.setAttribute('aria-label',large?'إرجاع حجم الخط العادي':'تكبير الخط');button.textContent=large?'أ−':'أ+';const mobile=byId('mobileTextSizeBtn');if(mobile){mobile.setAttribute('aria-pressed',String(large));mobile.setAttribute('aria-label',large?'إرجاع خط القراءة إلى الحجم العادي':'تكبير خط القراءة');mobile.textContent=large?'أ− الحجم العادي':'أ+ تكبير الخط';}save(FONT_KEY,large?'large':'normal');}
    setReaderLarge(safeRead(FONT_KEY)==='large');
    button.addEventListener('click',()=>setReaderLarge(!document.documentElement.classList.contains('reader-large')));
    byId('mobileTextSizeBtn')?.addEventListener('click',()=>setReaderLarge(!document.documentElement.classList.contains('reader-large')));
    byId('dockFavorites').addEventListener('click',()=>{
      // Favorites is an independent view: old search criteria must not hide saved items.
      el.search.value='';el.quickName.value='';closeNameSuggestions();updateClearQuick();
      el.goal.value='';el.category.value='';el.time.value='';el.stage.value='';syncStagePills();
      state.onlyFavorites=true;state.visibleLimit=18;updateTabs();render();
      const destination=byId('favoritesNotice');
      (destination && !destination.hidden ? destination : byId('catalogTitle')).scrollIntoView({
        behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',block:'start'
      });
    });
    byId('favoritesBrowseAll')?.addEventListener('click',()=>{
      resetFilters();byId('catalogTitle').scrollIntoView({behavior:'auto',block:'start'});
    });
    document.querySelectorAll('.dock-link[href]').forEach(link=>link.addEventListener('click',()=>{
      document.querySelectorAll('.dock-link').forEach(x=>{if(x.tagName==='A')x.removeAttribute('aria-current');});
      link.setAttribute('aria-current','page');
    }));
    syncStagePills();
  }
  function wrapCanvasText(ctx, text, x, y, width, lineHeight, maxLines) {
    const words=String(text||'').split(/\s+/);let line='',n=0;
    for(const word of words){const proposal=line?line+' '+word:word;
      if(ctx.measureText(proposal).width>width && line){ctx.fillText(line,x,y+n*lineHeight);n++;line=word;if(n>=maxLines-1)break;}else line=proposal;}
    if(n<maxLines)ctx.fillText(line.length>115?line.slice(0,115)+'…':line,x,y+n*lineHeight);
    return n+1;
  }
  async function createShareCard(strategy) {
    const status=byId('shareCardStatus');if(status)status.textContent='جارٍ تجهيز بطاقة مصوّرة…';
    try {
      if(document.fonts?.ready)await document.fonts.ready;
      const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1420;
      const c=canvas.getContext('2d');if(!c)throw new Error('canvas');
      const color=V.category(strategy).color || '#087c77';
      const rounded=(x,y,w,h,r,fill)=>{c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();};
      c.fillStyle='#f2f8fa';c.fillRect(0,0,1080,1420);rounded(50,50,980,1320,38,'#ffffff');
      rounded(50,50,980,22,11,color);
      c.direction='rtl';c.textAlign='right';c.fillStyle='#164359';
      c.font='bold 35px Cairo, Tajawal, Arial';c.fillText('بوصلة التعلّم النشط',960,136);
      c.font='bold 23px Cairo, Tajawal, Arial';c.fillStyle=color;c.fillText(`الاستراتيجية رقم ${displayNumber(strategy.id)}`,960,208);
      c.font='bold 51px Cairo, Tajawal, Arial';c.fillStyle='#173447';
      let count=wrapCanvasText(c,strategy.name,950,286,850,76,2);
      let y=286+count*76+40;
      rounded(110,y,860,84,20,'#e8f5f5');c.fillStyle='#224e5f';c.font='bold 28px Tajawal, Arial';c.fillText(`⏱ ${durationLabel(strategy.minutes)}    •    ${strategy.goal}`,930,y+54);y+=140;
      c.font='bold 29px Cairo, Arial';c.fillStyle=color;c.fillText('الفكرة الأساسية',950,y);y+=53;
      c.font='27px Tajawal, Arial';c.fillStyle='#365666';count=wrapCanvasText(c,strategy.summary,950,y,840,44,3);y+=count*44+38;
      c.fillStyle=color;c.font='bold 30px Cairo, Arial';c.fillText('خطوات التنفيذ',950,y);y+=62;
      for(const [i,step] of strategy.steps.slice(0,4).entries()){
        rounded(850,y-34,80,57,15,'#e4f2f3');c.font='bold 27px Tajawal, Arial';c.fillStyle=color;c.fillText(String(i+1),904,y+5);
        c.font='bold 27px Tajawal, Arial';c.fillStyle='#173447';
        const shortName=step[0].length>33?step[0].slice(0,32)+'…':step[0];c.fillText(shortName,815,y+7);y+=77;
      }
      c.fillStyle='#4f6979';c.font='25px Tajawal, Arial';
      c.fillText('كل الاستراتيجيات صالحة لجميع المراحل؛ الاختيار إرشادي.',950,1190);
      rounded(90,1240,900,2,1,'#dde9ee');
      c.font='bold 25px Tajawal, Arial';c.fillStyle='#245a6b';c.fillText('وحدة الأحياء بتعليمية البريمي',950,1290);
      c.font='20px Tajawal, Arial';c.fillStyle='#536e7b';c.fillText('إعداد: د. سمية بنت سالم بن محمد النعيمية | أ. محمد سيد عبد الستار سليم',950,1332);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
      if(!blob)throw new Error('blob');
      const filename=`استراتيجية-${displayNumber(strategy.id)}-بطاقة.png`;
      if(navigator.canShare && navigator.share){const file=new File([blob],filename,{type:'image/png'});
        if(navigator.canShare({files:[file]})){
          try{await navigator.share({title:strategy.name,files:[file]});if(status)status.textContent='تم فتح خيارات مشاركة البطاقة المصوّرة.';return;}
          catch(e){if(e?.name==='AbortError'){if(status)status.textContent='أُلغيت المشاركة؛ يمكنك المحاولة مرة أخرى.';return;}}
        }
      }
      const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
      if(status)status.textContent='تم تجهيز ملف الصورة؛ يمكنك مشاركته من معرض الصور أو الملفات.';
    }catch(err){if(status)status.textContent='تعذر إنشاء الصورة في هذا المتصفح. استخدم زر مشاركة النص أو نسخة الكتيب.';console.warn('Image card failed:',err);}
  }

  function persistBag(){
    try{localStorage.setItem(BAG_KEY,JSON.stringify({schema:1,plans:bag.plans}));return true;}
    catch(error){console.warn('تعذر حفظ الحقيبة',error);return false;}
  }
  function downloadBlob(blob,filename){
    const url=URL.createObjectURL(blob); const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);
  }
  function closeBag(){const d=byId('bagDialog');if(d.open)d.close();}
  function renderBag(){
    const plans=bag.plans.filter(p=>DATA.some(s=>s.id===Number(p.strategyId)));
    byId('savedPlansCount').textContent=`${plans.length} خطة`;
    const container=byId('savedPlansList');
    container.replaceChildren();
    if(!plans.length){const p=document.createElement('p');p.className='bag-empty';p.textContent='لم تحفظ خططًا بعد. افتح أي استراتيجية واضغط «استخدمها في درسي»، ثم «حفظ في حقيبتي».';container.append(p);}
    for(const plan of plans){
      const s=DATA.find(x=>x.id===Number(plan.strategyId));
      const row=document.createElement('article');row.className='saved-plan';
      const details=document.createElement('div');
      const title=document.createElement('strong');title.textContent=String(plan.fields?.lessonTitle||s.name).slice(0,120);
      const desc=document.createElement('p');desc.textContent=`استراتيجية ${s.name} • ${String(plan.fields?.lessonGrade||'صف غير محدد').slice(0,80)} • ${Number.isFinite(Date.parse(plan.updatedAt)) ? new Date(plan.updatedAt).toLocaleDateString('ar') : 'بدون تاريخ'}`;
      details.append(title,desc);
      const tools=document.createElement('div');tools.className='bag-row-actions';
      const open=document.createElement('button');open.type='button';open.textContent='فتح وتعديل';open.dataset.planEdit=plan.id;
      const del=document.createElement('button');del.type='button';del.textContent='حذف';del.dataset.planDelete=plan.id;del.className='danger-text';
      tools.append(open,del);row.append(details,tools);container.append(row);
    }
    const favs=[...state.favorites].filter(id=>DATA.some(s=>s.id===id));
    const raw=Number(safeRead(LAST_KEY));const last=DATA.find(s=>s.id===raw);
    byId('bagSummary').textContent=`${plans.length} خطة محفوظة • ${favs.length} في المفضلة`;
    const links=byId('bagLinks');links.replaceChildren();
    if(last){const b=document.createElement('button');b.type='button';b.dataset.bagOpen=String(last.id);b.textContent=`↗ متابعة القراءة: ${last.name}`;links.append(b);}
    for(const id of favs.slice(0,8)){
      const s=DATA.find(x=>x.id===id);const b=document.createElement('button');b.type='button';b.dataset.bagOpen=String(id);b.textContent=`♡ ${s.name}`;links.append(b);
    }
    if(!links.children.length){const p=document.createElement('p');p.className='hint';p.textContent='افتح استراتيجية أو أضفها إلى المفضلة لتظهر هنا.';links.append(p);}
  }
  function openBag(){renderBag();const dlg=byId('bagDialog');if(!dlg.open)dlg.showModal();byId('dockBag')?.classList.add('active');}
  function qrImagePath(id){return window.BOUSALA_LINKS.qr(canonicalStrategyURL(id));}
  function openQRCode(id){
    const s=DATA.find(item=>item.id===id);if(!s)return;
    byId('qrStrategyName').textContent=`الاستراتيجية ${displayNumber(id)}: ${s.name}`;
    byId('qrUrl').value=canonicalStrategyURL(id);
    byId('qrImage').src=qrImagePath(id);
    byId('qrImage').alt=`رمز QR لفتح استراتيجية ${s.name}`;
    const link=byId('downloadQr');link.href=qrImagePath(id);link.download=`استراتيجية-${displayNumber(id)}-QR.png`;
    byId('qrStatus').textContent=window.BOUSALA_LANG==='en'?'This code uses the current website address. Open the published site before sharing.':'يستخدم الرمز عنوان هذا الموقع. افتح الموقع المنشور قبل مشاركة الرمز.';
    const dlg=byId('qrDialog');if(!dlg.open)dlg.showModal();
  }
  function setupBagAndQR(){
    const bagDialog=byId('bagDialog');
    bagDialog.addEventListener('close',()=>byId('dockBag')?.classList.remove('active'));
    byId('bagBtn').addEventListener('click',openBag);
    byId('dockBag').addEventListener('click',openBag);
    byId('closeBag').addEventListener('click',closeBag);
    byId('closeBagBottom').addEventListener('click',closeBag);
    bagDialog.addEventListener('click',e=>{if(e.target===bagDialog)closeBag();});
    byId('savedPlansList').addEventListener('click',event=>{
      const edit=event.target.closest('[data-plan-edit]');
      const del=event.target.closest('[data-plan-delete]');
      if(edit){
        const p=bag.plans.find(x=>x.id===edit.dataset.planEdit);if(!p)return;
        closeBag();openLessonPlan(Number(p.strategyId));editingPlanId=p.id;
        for(const field of ['lessonTitle','lessonSubject','lessonGrade','lessonObjective','lessonSemester','lessonTime','lessonUnit','lessonResources','lessonNotes'])if(byId(field))byId(field).value=String(p.fields?.[field]|| (field==='lessonSemester'?'الأول': field==='lessonTime'?'40':''));
        window.BOUSALA_OMAN_PLANNER?.onRestored?.(p);refreshPlan();byId('lessonTitle').focus();
      }
      if(del){const p=bag.plans.find(x=>x.id===del.dataset.planDelete);if(!p)return;
        if(!confirm(window.BOUSALA_LANG==='en'?'Delete this plan from this device?':'هل تريد حذف هذه الخطة من هذا الجهاز؟'))return;
        bag.plans=bag.plans.filter(x=>x.id!==p.id);persistBag();renderBag();byId('bagStatus').textContent='حُذفت الخطة.';
      }
    });
    byId('bagLinks').addEventListener('click',e=>{
      const btn=e.target.closest('[data-bag-open]');if(!btn)return;
      closeBag();openGuide(Number(btn.dataset.bagOpen));
    });
    byId('exportBag').addEventListener('click',()=>{
      const backup={app:'101-active-learning',schema:1,exportedAt:new Date().toISOString(),plans:bag.plans,favorites:[...state.favorites],lastViewed:Number(safeRead(LAST_KEY))||null,observations:window.AL101_V63?.getObservations()||[]};
      downloadBlob(new Blob([JSON.stringify(backup,null,2)],{type:'application/json;charset=utf-8'}),`101-backup-${new Date().toISOString().slice(0,10)}.json`);
      byId('bagStatus').textContent='تم إعداد ملف النسخة الاحتياطية. احتفظ به في مكان آمن.';
    });
    byId('importBagTrigger').addEventListener('click',()=>byId('importBag').click());
    byId('importBag').addEventListener('change',async e=>{
      const file=e.target.files?.[0];e.target.value='';if(!file)return;
      const status=byId('bagStatus');
      if(file.size>2*1024*1024){status.textContent='الملف كبير جدًا. الحد الأقصى 2 ميجابايت.';return;}
      try{
        const imported=JSON.parse(await file.text());
        if(imported?.app!=='101-active-learning'||imported.schema!==1||!Array.isArray(imported.plans)||!Array.isArray(imported.favorites))throw Error('bad format');
        if(imported.plans.length>120)throw Error('too many plans');
        const valid=imported.plans.filter(p=>p&&typeof p.id==='string'&&p.id.length<100&&Number.isInteger(Number(p.strategyId))&&DATA.some(s=>s.id===Number(p.strategyId))&&p.fields&&typeof p.fields==='object').map(p=>({
          id:p.id,strategyId:Number(p.strategyId),updatedAt:Number.isFinite(Date.parse(p.updatedAt))?p.updatedAt:new Date().toISOString(),
          fields:Object.fromEntries(['lessonTitle','lessonSubject','lessonGrade','lessonObjective','lessonSemester','lessonTime','lessonUnit','lessonResources','lessonNotes'].map(k=>[k,String(p.fields[k]||'').slice(0,k==='lessonObjective'?320:250)])),proposal: p.proposal&&typeof p.proposal==='object'?{text:String(p.proposal.text||'').slice(0,16000),kind:p.proposal.kind==='ai'?'ai':'local'}:null
        }));
        const favs=imported.favorites.map(Number).filter(id=>DATA.some(s=>s.id===id));
        if(!confirm(window.BOUSALA_LANG==='en'?`This will replace your saved plans and favourites with ${valid.length} plans and ${favs.length} favourites. Continue?`:`سيتم استبدال خططك ومفضلتك الحالية بـ${valid.length} خطة و${favs.length} مفضلة. هل توافق؟`))return;
        const oldBag=bag,oldFav=new Set(state.favorites);
        bag={schema:1,plans:valid};state.favorites=new Set(favs);
        if(!persistBag()){bag=oldBag;state.favorites=oldFav;status.textContent='تعذر تخزين البيانات المستوردة في هذا المتصفح.';return;}
        save(FAV_KEY,JSON.stringify([...state.favorites]));
        const last=Number(imported.lastViewed);if(DATA.some(s=>s.id===last))save(LAST_KEY,String(last));
        if(Array.isArray(imported.observations))window.AL101_V63?.setObservations(imported.observations);
        render();renderBag();status.textContent='✓ استُعيدت الحقيبة والمفضلة بنجاح.';
      }catch(error){status.textContent='الملف غير صالح. اختر نسخة احتياطية صدّرتها من هذا التطبيق.';}
    });
    const qrDialog=byId('qrDialog');
    byId('closeQr').addEventListener('click',()=>qrDialog.close());
    qrDialog.addEventListener('click',e=>{if(e.target===qrDialog)qrDialog.close();});
    byId('copyQr').addEventListener('click',async()=>{
      try{await copyText(byId('qrUrl').value);byId('qrStatus').textContent='✓ تم نسخ الرابط المباشر.';}
      catch{const field=byId('qrUrl');field.focus();field.select();byId('qrStatus').textContent='تعذّر النسخ التلقائي؛ تم تحديد الرابط، ويمكنك نسخه يدويًا.';}
    });
    if(location.hash==='#my-bag'){
      window.addEventListener('load',()=>{openBag();}, {once:true});
    }
    setupAppMaintenance();
  }
  function setupAppMaintenance(){
    const status=byId('cacheStatus'), versionStatus=byId('versionStatus');
    versionStatus.textContent=`الإصدار ${APP_VERSION} • البيانات الشخصية محفوظة محليًا`;
    const banner=byId('updateBanner');
    let reg=null;
    const maybeUpdate=(registration)=>{
      reg=registration;
      if(registration?.waiting && navigator.serviceWorker.controller){banner.hidden=false;}
      registration?.addEventListener('updatefound',()=>{
        const installing=registration.installing;
        if(!installing)return;
        installing.addEventListener('statechange',()=>{
          if(installing.state==='installed' && navigator.serviceWorker.controller){banner.hidden=false;status.textContent='تم تحميل تحديث جديد. يمكنك تفعيله من إشعار التحديث.';}
        });
      });
    };
    if('serviceWorker' in navigator && location.protocol!=='file:'){
      navigator.serviceWorker.getRegistration('./').then(maybeUpdate).catch(()=>{});
      navigator.serviceWorker.ready.then(maybeUpdate).catch(()=>{});
      navigator.serviceWorker.addEventListener('controllerchange',()=>{
        if(sessionStorage.getItem('al101-updating')==='1'){
          sessionStorage.removeItem('al101-updating');location.reload();
        }
      });
    }
    byId('applyUpdate').addEventListener('click',()=>{
      if(!reg?.waiting){banner.hidden=true;return;}
      sessionStorage.setItem('al101-updating','1');
      reg.waiting.postMessage({type:'SKIP_WAITING'});
    });
    byId('dismissUpdate').addEventListener('click',()=>{banner.hidden=true;});
    async function messageWorker(type){
      const worker=navigator.serviceWorker.controller || (await navigator.serviceWorker.ready).active;
      if(!worker)throw new Error('no worker');
      return new Promise((resolve,reject)=>{
        const channel=new MessageChannel();
        const timeout=setTimeout(()=>{channel.port1.close();reject(Error('timeout'));},16000);
        channel.port1.onmessage=e=>{clearTimeout(timeout);channel.port1.close();e.data?.ok?resolve(e.data):reject(Error(e.data?.error||'worker failed'));};
        worker.postMessage({type},[channel.port2]);
      });
    }
    async function storageInfo(){
      if(!navigator.storage?.estimate)return '';
      const {usage,quota}=await navigator.storage.estimate();
      return ` • التخزين الكلي التقريبي: ${Math.round((usage||0)/1024/1024*10)/10} ميجابايت من ${Math.round((quota||0)/1024/1024)} ميجابايت متاحة`;
    }
    byId('checkAppUpdate').addEventListener('click',async()=>{
      status.textContent='يُجرى التحقق من التحديثات…';
      try{if(!('serviceWorker' in navigator))throw Error();reg=await navigator.serviceWorker.getRegistration('./');if(!reg)throw Error();await reg.update();maybeUpdate(reg);status.textContent=reg.waiting?'يتوفر إصدار جديد. استخدم زر «تحديث الآن».':'تم التحقق. لا يوجد تحديث جاهز للتفعيل حاليًا.';}
      catch{status.textContent='تعذر التحقق. افتح النسخة المنشورة عبر HTTPS واتصل بالإنترنت.';}
    });
    byId('refreshOffline').addEventListener('click',async()=>{
      if(!navigator.onLine){status.textContent='يلزم الاتصال بالإنترنت لإصلاح الملفات المحفوظة.';return;}
      status.textContent='جارٍ تجهيز ملفات التطبيق للعمل دون إنترنت…';
      try{const data=await messageWorker('PRECACHE');status.textContent=`✓ حُفظ ${data.count} ملفًا للعمل دون إنترنت${await storageInfo()}`;}
      catch{status.textContent='تعذر إصلاح الملفات. حدّث الصفحة عبر HTTPS وأعد المحاولة.';}
    });
    byId('clearAppCache').addEventListener('click',async()=>{
      if(!confirm(window.BOUSALA_LANG==='en'?'Clear cached app files? Your saved plans and favourites will remain. Internet access may be needed before offline use works again.':'مسح ملفات التطبيق المؤقتة؟ لن تُحذف خططك أو المفضلة. ستحتاج الاتصال مجددًا لتحميل ملفات التطبيق قبل استخدامه دون إنترنت.'))return;
      status.textContent='جارٍ مسح ملفات التطبيق المؤقتة…';
      try{const data=await messageWorker('CLEAR_APP_CACHE');status.textContent=`✓ مُسحت ${data.count} ذاكرة مؤقتة خاصة بالتطبيق. خططك والمفضلة محفوظة. لإعادة التخزين اضغط «إصلاح ملفات دون إنترنت».`;}
      catch{status.textContent='تعذر مسح ذاكرة التطبيق تلقائيًا في هذا المتصفح.';}
    });
  }

  setupBagAndQR();
  setupMobileNavigation();
  setupNameSearch();
  setupLessonPlan();
  setupFilters();
  setupDialog();
  setupShare();
  setupThemeAndInstall();
  updateTabs();
  render();
  const incoming=getStrategyParam();if(incoming){openGuide(incoming,false);el.dialog.showModal();}
})();
