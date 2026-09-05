/* FA_CLOUD_SYNC_BOOTSTRAP_V26 */
(function(){
  'use strict';
  var src='fa-cloud-sync-v18.js?build=26.1';
  var s=document.createElement('script');
  s.src=src;
  s.async=false;
  s.onload=function(){console.info('[FA] Cloud sync V26 Storage loaded')};
  s.onerror=function(){console.error('[FA] Cloud sync V26 Storage failed to load',src)};
  document.head.appendChild(s);
})();
