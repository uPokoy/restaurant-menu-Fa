/* FA_CLOUD_SYNC_UNIQUE_LOADER_V28 */
(function(){
  'use strict';
  var s=document.createElement('script');
  s.src='fa-cloud-sync-v27.js?build=28.1';
  s.async=false;
  s.onload=function(){
    console.info('[FA] Cloud sync V27 loaded');
    var c=document.createElement('script');
    c.src='fa-cart-sync-v1.js?build=1.1';
    c.async=false;
    c.onload=function(){console.info('[FA] Shared cart sync loaded')};
    c.onerror=function(){console.error('[FA] Shared cart sync failed to load')};
    document.head.appendChild(c);
  };
  s.onerror=function(){console.error('[FA] Cloud sync V27 failed to load')};
  document.head.appendChild(s);
})();
