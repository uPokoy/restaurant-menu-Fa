/* FA_CLOUD_SYNC_BOOTSTRAP_V25 */
(function(){
  'use strict';
  var src='fa-cloud-sync-v18.js?build=25.1';
  var s=document.createElement('script');
  s.src=src;
  s.async=false;
  s.onload=function(){console.info('[FA] Cloud sync V25 Realtime loaded')};
  s.onerror=function(){console.error('[FA] Cloud sync V25 Realtime failed to load',src)};
  document.head.appendChild(s);
})();
