/* FA_CLOUD_SYNC_UNIQUE_LOADER_V30 */
(function(){
  'use strict';

  function loadRedesignCss(){
    if(document.getElementById('fa-redesign-v3-css')) return;
    var link=document.createElement('link');
    link.id='fa-redesign-v3-css';
    link.rel='stylesheet';
    link.href='fa-redesign-v3.css?build=1.1';
    document.head.appendChild(link);
  }

  function loadRedesign(){
    if(document.getElementById('fa-redesign-v3-js')) return;
    var r=document.createElement('script');
    r.id='fa-redesign-v3-js';
    r.src='fa-redesign-v3.js?build=1.1';
    r.async=false;
    r.onload=function(){console.info('[FA] Redesign V3 loaded')};
    r.onerror=function(){console.warn('[FA] Redesign V3 failed to load')};
    document.head.appendChild(r);
  }

  function loadCloud(){
    var s=document.createElement('script');
    s.src='fa-cloud-sync-v27.js?build=28.2';
    s.async=false;
    s.onload=function(){console.info('[FA] Cloud sync V27 loaded');loadRedesign()};
    s.onerror=function(){console.error('[FA] Cloud sync V27 failed to load');loadRedesign()};
    document.head.appendChild(s);
  }

  loadRedesignCss();

  var o=document.createElement('script');
  o.src='fa-image-optimize.js?build=3.0';
  o.async=false;
  o.onload=function(){console.info('[FA] Image optimizer loaded');loadCloud()};
  o.onerror=function(){console.warn('[FA] Image optimizer failed to load');loadCloud()};
  document.head.appendChild(o);
})();
