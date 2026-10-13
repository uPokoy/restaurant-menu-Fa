/* FA_CLOUD_SYNC_UNIQUE_LOADER_V30 */
(function(){
  'use strict';

  function loadRedesignCss(){
    if(!document.getElementById('fa-redesign-v3-css')){
      var link=document.createElement('link');
      link.id='fa-redesign-v3-css';
      link.rel='stylesheet';
      link.href='fa-redesign-v3.css?build=1.1';
      document.head.appendChild(link);
    }
    if(!document.getElementById('fa-compact-card-v1-css')){
      var compact=document.createElement('link');
      compact.id='fa-compact-card-v1-css';
      compact.rel='stylesheet';
      compact.href='fa-compact-card-v1.css?build=1.4';
      document.head.appendChild(compact);
    }
    if(!document.getElementById('fa-wide-card-v1-css')){
      var wide=document.createElement('link');
      wide.id='fa-wide-card-v1-css';
      wide.rel='stylesheet';
      wide.href='fa-wide-card-v1.css?build=1.0';
      document.head.appendChild(wide);
    }
    if(!document.getElementById('fa-scroll-stability-v1-css')){
      var stable=document.createElement('link');
      stable.id='fa-scroll-stability-v1-css';
      stable.rel='stylesheet';
      stable.href='fa-scroll-stability-v1.css?build=1.1';
      document.head.appendChild(stable);
    }
    if(!document.getElementById('fa-home-sections-v1-css')){
      var home=document.createElement('link');
      home.id='fa-home-sections-v1-css';
      home.rel='stylesheet';
      home.href='fa-home-sections-v1.css?build=1.2';
      document.head.appendChild(home);
    }
  }

  function loadHomeSections(){
    if(document.getElementById('fa-home-sections-v1-js')) return;
    var h=document.createElement('script');
    h.id='fa-home-sections-v1-js';
    h.src='fa-home-sections-v1.js?build=1.2';
    h.async=false;
    h.onload=function(){console.info('[FA] Home sections loaded')};
    h.onerror=function(){console.warn('[FA] Home sections failed to load')};
    document.head.appendChild(h);
  }

  function loadScrollStability(){
    if(document.getElementById('fa-scroll-stability-v1-js')){
      loadHomeSections();
      return;
    }
    var s=document.createElement('script');
    s.id='fa-scroll-stability-v1-js';
    s.src='fa-scroll-stability-v1.js?build=1.1';
    s.async=false;
    s.onload=function(){console.info('[FA] Scroll stability loaded');loadHomeSections()};
    s.onerror=function(){console.warn('[FA] Scroll stability failed to load');loadHomeSections()};
    document.head.appendChild(s);
  }

  function loadWideCards(){
    if(document.getElementById('fa-wide-card-v1-js')){
      loadScrollStability();
      return;
    }
    var w=document.createElement('script');
    w.id='fa-wide-card-v1-js';
    w.src='fa-wide-card-v1.js?build=1.0';
    w.async=false;
    w.onload=function(){console.info('[FA] Wide card refinements loaded');loadScrollStability()};
    w.onerror=function(){console.warn('[FA] Wide card refinements failed to load');loadScrollStability()};
    document.head.appendChild(w);
  }

  function loadRedesign(){
    if(document.getElementById('fa-redesign-v3-js')){
      loadWideCards();
      return;
    }
    var r=document.createElement('script');
    r.id='fa-redesign-v3-js';
    r.src='fa-redesign-v3.js?build=1.8';
    r.async=false;
    r.onload=function(){console.info('[FA] Redesign V3 loaded');loadWideCards()};
    r.onerror=function(){console.warn('[FA] Redesign V3 failed to load');loadWideCards()};
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
