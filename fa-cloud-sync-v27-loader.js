/* FA_CLOUD_SYNC_UNIQUE_LOADER_V29 */
(function(){
  'use strict';

  function loadCloud(){
    var s=document.createElement('script');
    s.src='fa-cloud-sync-v27.js?build=28.2';
    s.async=false;
    s.onload=function(){console.info('[FA] Cloud sync V27 loaded')};
    s.onerror=function(){console.error('[FA] Cloud sync V27 failed to load')};
    document.head.appendChild(s);
  }

  var o=document.createElement('script');
  o.src='fa-image-optimize.js?build=3.0';
  o.async=false;
  o.onload=function(){console.info('[FA] Image optimizer loaded');loadCloud()};
  o.onerror=function(){console.warn('[FA] Image optimizer failed to load');loadCloud()};
  document.head.appendChild(o);
})();
