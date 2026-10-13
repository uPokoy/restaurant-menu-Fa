/* FA_CART_SYNC_LOADER_V5 */
(function(){
'use strict';

function installStartupGuard(){
  var root=document.documentElement;
  var style=document.getElementById('fa-startup-guard');
  if(!style){
    style=document.createElement('style');
    style.id='fa-startup-guard';
    style.textContent='html.fa-ui-boot{background:#0e0e0f}html.fa-ui-boot body{visibility:hidden!important}';
    document.head.appendChild(style);
  }
  root.classList.add('fa-ui-boot');
  var released=false;
  function reveal(){
    if(released)return;
    released=true;
    root.classList.remove('fa-ui-boot');
    if(style&&style.parentNode)style.parentNode.removeChild(style);
  }
  window.__faRevealUI=reveal;
  setTimeout(reveal,5000);
}
installStartupGuard();

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

function addStylesheet(href,id){
  var link=document.getElementById(id);
  if(!link){
    link=document.createElement('link');
    link.id=id;
    link.rel='stylesheet';
    document.head.appendChild(link);
  }
  link.href=href;
}

addLink('icon','favicon.png?v=2','32x32');
addLink('apple-touch-icon','apple-touch-icon.png?v=2','180x180');
addStylesheet('fa-cart-badge-fix-v1.css?build=1.0','fa-cart-badge-fix-v1-css');

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
