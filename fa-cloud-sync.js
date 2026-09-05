/* FA_CLOUD_SYNC_BOOTSTRAP_V21 */
(function(){
  'use strict';
  var src='fa-cloud-sync-v18.js?build=21.1';
  var s=document.createElement('script');
  s.src=src;
  s.async=false;
  s.onload=function(){console.info('[FA] Cloud sync V21 loaded')};
  s.onerror=function(){console.error('[FA] Cloud sync V21 failed to load',src)};
  document.head.appendChild(s);
})();
