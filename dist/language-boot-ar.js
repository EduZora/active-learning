/* Fixed-language entry point. Switching does not rely on URL query strings. */
(function(){const lang="ar";window.BOUSALA_LANG=lang;document.documentElement.lang=lang;
document.documentElement.dir=lang==='en'?'ltr':'rtl';
document.documentElement.classList.toggle('bousala-en',lang==='en');
try{localStorage.setItem('bousla_lang',lang)}catch(e){}})();
