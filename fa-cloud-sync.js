/* FA_CLOUD_SYNC_BOOTSTRAP_V27 */
(function(){
  'use strict';
  var src='fa-cloud-sync-v27.js?build=27.1';
  var s=document.createElement('script');
  s.src=src;
  s.async=false;
  s.onload=function(){console.info('[FA] Cloud sync V27 RPC loaded')};
  s.onerror=function(){console.error('[FA] Cloud sync V27 RPC failed to load',src)};
  document.head.appendChild(s);
})();
