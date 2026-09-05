/* FA_CLOUD_SYNC_BOOTSTRAP_V20 */
(function(){
  'use strict';
  var src='fa-cloud-sync-v18.js?build=20.1';
  var s=document.createElement('script');
  s.src=src;
  s.async=false;
  s.onload=function(){console.info('[FA] Cloud sync V20 loaded')};
  s.onerror=function(){console.error('[FA] Cloud sync V20 failed to load',src)};
  document.head.appendChild(s);
})();
