/* FA_CART_SYNC_LOADER_V3 */
(function(){
'use strict';

function addLink(rel,href,sizes){
  var link=document.querySelector('link[rel="'+rel+'"]');
  if(!link){
    link=document.createElement('link');
    link.rel=rel;
    document.head.appendChild(link);
  }
  link.href=href;
  if(sizes) link.sizes=sizes;
}

addLink('icon','favicon.png?v=1','32x32');
addLink('apple-touch-icon','apple-touch-icon.png?v=1','180x180');

function applySiteTitle(){
  document.title='Меню';
}
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',applySiteTitle,{once:true});
}else{
  applySiteTitle();
}
window.addEventListener('pageshow',applySiteTitle);

var s=document.createElement('script');
s.src='fa-cart-sync-v1.js?build=1.2';
s.async=false;
s.onload=function(){console.info('[FA] Shared cart sync loader loaded')};
s.onerror=function(){console.error('[FA] Shared cart sync loader failed')};
document.head.appendChild(s);
})();