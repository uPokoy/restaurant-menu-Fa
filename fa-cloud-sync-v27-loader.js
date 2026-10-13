/* FA_CLOUD_SYNC_UNIQUE_LOADER_V31 */
(function(){
  'use strict';

  var FINAL_STYLE_IDS=[
    'fa-redesign-v3-css',
    'fa-compact-card-v1-css',
    'fa-wide-card-v1-css',
    'fa-scroll-stability-v1-css',
    'fa-home-sections-v1-css',
    'fa-home-polish-v1-css',
    'fa-novelty-card-fix-v1-css'
  ];

  function revealUi(){
    var started=Date.now();
    function check(){
      var ready=FINAL_STYLE_IDS.every(function(id){
        var link=document.getElementById(id);
        return !!(link&&link.sheet);
      });
      if(ready||Date.now()-started>1800){
        requestAnimationFrame(function(){
          requestAnimationFrame(function(){
            if(typeof window.__faRevealUI==='function') window.__faRevealUI();
          });
        });
        return;
      }
      setTimeout(check,30);
    }
    check();
  }

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
    if(!document.getElementById('fa-home-polish-v1-css')){
      var polish=document.createElement('link');
      polish.id='fa-home-polish-v1-css';
      polish.rel='stylesheet';
      polish.href='fa-home-polish-v1.css?build=1.0';
      document.head.appendChild(polish);
    }
    if(!document.getElementById('fa-novelty-card-fix-v1-css')){
      var novelty=document.createElement('link');
      novelty.id='fa-novelty-card-fix-v1-css';
      novelty.rel='stylesheet';
      novelty.href='fa-novelty-card-fix-v1.css?build=1.0';
      document.head.appendChild(novelty);
    }
  }

  function loadNavPolish(){
    if(document.getElementById('fa-nav-polish-v1-js')){
      revealUi();
      return;
    }
    var n=document.createElement('script');
    n.id='fa-nav-polish-v1-js';
    n.src='fa-nav-polish-v1.js?build=1.0';
    n.async=false;
    n.onload=function(){console.info('[FA] Navigation polish loaded');revealUi()};
    n.onerror=function(){console.warn('[FA] Navigation polish failed to load');revealUi()};
    document.head.appendChild(n);
  }

  function loadNoveltyFix(){
    if(document.getElementById('fa-novelty-card-fix-v1-js')){
      loadNavPolish();
      return;
    }
    var f=document.createElement('script');
    f.id='fa-novelty-card-fix-v1-js';
    f.src='fa-novelty-card-fix-v1.js?build=1.0';
    f.async=false;
    f.onload=function(){console.info('[FA] Novelty card fix loaded');loadNavPolish()};
    f.onerror=function(){console.warn('[FA] Novelty card fix failed to load');loadNavPolish()};
    document.head.appendChild(f);
  }

  function loadHomeSections(){
    if(document.getElementById('fa-home-sections-v1-js')){
      loadNoveltyFix();
      return;
    }
    var h=document.createElement('script');
    h.id='fa-home-sections-v1-js';
    h.src='fa-home-sections-v1.js?build=1.3';
    h.async=false;
    h.onload=function(){console.info('[FA] Home sections loaded');loadNoveltyFix()};
    h.onerror=function(){console.warn('[FA] Home sections failed to load');loadNoveltyFix()};
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

  function loadAdminSession(){
    if(document.getElementById('fa-admin-session-v1-js')){
      loadRedesign();
      return;
    }
    var a=document.createElement('script');
    a.id='fa-admin-session-v1-js';
    a.src='fa-admin-session-v1.js?build=1.0';
    a.async=false;
    a.onload=function(){console.info('[FA] Admin session guard loaded');loadRedesign()};
    a.onerror=function(){console.warn('[FA] Admin session guard failed to load');loadRedesign()};
    document.head.appendChild(a);
  }

  function loadCloud(){
    var s=document.createElement('script');
    s.src='fa-cloud-sync-v27.js?build=28.3';
    s.async=false;
    s.onload=function(){console.info('[FA] Cloud sync V27 loaded');loadAdminSession()};
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
