/* بوصلة التعلّم النشط — v8.4 : versioned offline shell + optional QR cache.
 * This service worker caches only public, same-origin app files.
 * User-generated lesson plans are stored separately in localStorage and NEVER cached here.
 */
'use strict';
const VERSION='9.2.4-scientific-review-2';
const CACHE_PREFIX='al101-app-shell-';
const CACHE_NAME=`${CACHE_PREFIX}v${VERSION}`;
const CORE=[
 './design-refinement.css','./vendor/qrcode.min.js','./qr-code.js',
  './','./index.html','./index-ar.html','./index-en.html','./language-boot-ar.js','./language-boot-en.js','./style.css', './website.css','./atelier.css','./app.js','./oman-lesson-planner.js','./oman-lesson-planner.css','./language-boot.js','./english-strategies.js','./english-content-polish.js','./pedagogy-review.js','./search-directory.js','./strategy-directory.css','./strategy-advisor.js','./teaching-tools.js','./teaching-tools.css','./english-diagrams.js','./english-ui-map.js','./language-ui.js','./english.css','./manifest-en.webmanifest','./booklet-en.html','./booklet-ar.html','./visuals.js','./new-visuals.js',
  './data.js','./v63-data.js','./v63.js','./v63.css','./v64.js','./v64.css','./v8-unified.css','./vision.css','./qa-polish.css','./ui-polish.css','./feature.js','./assets/strategy-universe.webp','./manifest.webmanifest','./booklet.html','./credits-v646.css','./qr-gallery.html','./qr-gallery-en.html',
  './icons/icon-192.png','./icons/icon-512.png',
  './icons/icon-maskable-512.png','./icons/apple-touch-icon.png'
];
const PDF_FILES=['./booklet.pdf','./booklet-ar.pdf','./booklet-en.pdf']; // optional, cached only after the user opens it
const QR_FILES=Array.from({length:122},(_,i)=>`./qr/${String(i+1).padStart(3,'0')}.png`);
const ALL_FILES=[...CORE,...QR_FILES];
const ROOT=new URL('./',self.registration.scope);
const assetPaths=new Set([...ALL_FILES,...PDF_FILES].map(path=>new URL(path,ROOT).pathname));
const cacheKeyFor=(request)=>{
  const url=new URL(request.url);
  // Never cache a separate copy of each deep-link query.
  if(url.searchParams.has('strategy') && url.pathname===new URL('index.html',ROOT).pathname)url.search='';
  if(url.pathname===ROOT.pathname)url.search='';
  return url.href;
};
async function preCache(includeQR=false){
  const cache=await caches.open(CACHE_NAME);
  // Keep the app itself atomic even if an optional QR image is missing.
  await cache.addAll(CORE);
  let qrSaved=0;
  for(let i=0;includeQR&&i<QR_FILES.length;i+=20){
    const outcomes=await Promise.allSettled(QR_FILES.slice(i,i+20).map(async file=>{
      const req=new Request(new URL(file,ROOT),{cache:'reload'});
      const response=await fetch(req);
      if(!response.ok)throw Error('QR not found');
      await cache.put(req,response);return true;
    }));
    qrSaved+=outcomes.filter(out=>out.status==='fulfilled').length;
  }
  return {count:CORE.length+qrSaved,expected:ALL_FILES.length};
}
self.addEventListener('install',event=>{
  // Don't force an automatic swap in the middle of a user's lesson-plan edit.
  event.waitUntil(preCache(false));
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(name=>name.startsWith(CACHE_PREFIX)&&name!==CACHE_NAME).map(name=>caches.delete(name)));
    await self.clients.claim();
  })());
});
async function consistentShellNavigation(request,event){
  const target=new URL(request.url);
  const indexPath=new URL('index.html',ROOT).pathname;
  const indexArPath=new URL('index-ar.html',ROOT).pathname;
  const indexEnPath=new URL('index-en.html',ROOT).pathname;
  const bookletArPath=new URL('booklet-ar.html',ROOT).pathname;
  const bookletPath=new URL('booklet.html',ROOT).pathname;
  const bookletEnPath=new URL('booklet-en.html',ROOT).pathname;
  const pdfPath=new URL('booklet.pdf',ROOT).pathname;
  const pdfEnPath=new URL('booklet-en.pdf',ROOT).pathname;
  const pdfArPath=new URL('booklet-ar.pdf',ROOT).pathname;
  // PDF is an optional large asset: cache only after its first successful opening.
  if(target.pathname===pdfPath || target.pathname===pdfArPath || target.pathname===pdfEnPath){
    const key=new URL(target.pathname===pdfEnPath?'booklet-en.pdf':target.pathname===pdfArPath?'booklet-ar.pdf':'booklet.pdf',ROOT).href;
    const cached=await caches.match(key);
    if(cached)return cached;
    try{
      const response=await fetch(request);
      if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.put(key,copy)).catch(()=>{}));}
      return response;
    }catch{return new Response('ملف PDF غير متاح دون إنترنت قبل فتحه مرة عبر الإنترنت.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});}
  }
  // Only canonical app pages get the offline fallback; unknown paths remain 404s.
  const pagePath=target.pathname===ROOT.pathname||target.pathname===indexPath?'./index.html':
    target.pathname===indexArPath?'./index-ar.html':target.pathname===indexEnPath?'./index-en.html':
    target.pathname===bookletPath?'./booklet.html':target.pathname===bookletArPath?'./booklet-ar.html':
    target.pathname===bookletEnPath?'./booklet-en.html':null;
  if(!pagePath)return fetch(request);
  const key=new URL(pagePath,ROOT).href;
  // Cache-first for a controlled client avoids loading a new HTML shell with old cached JS/CSS.
  // The page checks for a new service worker and invites the user to activate the complete update.
  const cached=await caches.match(key);
  if(cached)return cached;
  try{
    const response=await fetch(request);
    if(response.ok){
      const copy=response.clone();
      event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.put(key,copy)).catch(()=>{}));
    }
    return response;
  }catch{
    return new Response('التطبيق غير متاح دون إنترنت قبل التحميل الأول. افتحه عند توفر الشبكة.',{
      status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}
    });
  }
}
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin||!url.pathname.startsWith(ROOT.pathname))return;
  if(request.mode==='navigate'){
    event.respondWith(consistentShellNavigation(request,event));return;
  }
  // Unknown URLs, API calls and user content are not cached.
  if(!assetPaths.has(url.pathname))return;
  event.respondWith((async()=>{
    const key=cacheKeyFor(request);
    const cached=await caches.match(key);
    if(cached)return cached;
    try{
      const response=await fetch(request);
      if(response.ok){event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.put(key,response.clone())).catch(()=>{}));}
      return response;
    }catch{ return new Response('',{status:503,statusText:'Offline'}); }
  })());
});
self.addEventListener('message',event=>{
  const msg=event.data;
  if(!msg || !['SKIP_WAITING','PRECACHE','CACHE_STATUS','CLEAR_APP_CACHE'].includes(msg.type))return;
  if(msg.type==='SKIP_WAITING'){self.skipWaiting();return;}
  const reply=event.ports?.[0];
  event.waitUntil((async()=>{
    try{
      let payload={ok:true,version:VERSION};
      if(msg.type==='PRECACHE')payload={...payload,...await preCache(true)};
      if(msg.type==='CACHE_STATUS'){
        const cache=await caches.open(CACHE_NAME);
        payload={...payload,count:(await cache.keys()).length};
      }
      if(msg.type==='CLEAR_APP_CACHE'){
        const keys=(await caches.keys()).filter(name=>name.startsWith(CACHE_PREFIX));
        await Promise.all(keys.map(name=>caches.delete(name)));
        payload={...payload,count:keys.length};
      }
      reply?.postMessage(payload);
    }catch(error){reply?.postMessage({ok:false,error:String(error?.message||error)});}
  })());
});
