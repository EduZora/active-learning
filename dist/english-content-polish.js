/* v9.1: Editorial content is canonical in english-strategies.js and the books.
   Do not overwrite step headings or summaries after load. */
(function(){'use strict'; if(window.BOUSALA_LANG!=='en')return;
 for(const s of window.STRATEGIES||[]){
  if(Array.isArray(s.tools))s.tools=s.tools.map(t=>String(t).replace(/\bQuestion question\b/gi,'Question prompt').replace(/\bCard card\b/gi,'Cards'));
 }
})();
