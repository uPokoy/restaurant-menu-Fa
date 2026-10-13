/* FA_SCROLL_STABILITY_V1 — smooth page scrolling while pointer is over expanded cards */
(function(){
  'use strict';
  if(window.__FA_SCROLL_STABILITY_V1__) return;
  window.__FA_SCROLL_STABILITY_V1__=true;

  var targetY=window.scrollY||0;
  var frame=0;
  var scrollCheckFrame=0;
  var lastScrollY=window.scrollY||0;
  var watchedCard=null;
  var watchedSince=0;

  function maxScroll(){
    var root=document.documentElement;
    return Math.max(0,root.scrollHeight-window.innerHeight);
  }

  function stopAnimation(){
    if(frame){
      cancelAnimationFrame(frame);
      frame=0;
    }
    targetY=window.scrollY||0;
    document.documentElement.classList.remove('fa-card-wheel-smoothing');
  }

  function animate(){
    var current=window.scrollY||0;
    var diff=targetY-current;
    if(Math.abs(diff)<0.6){
      window.scrollTo(0,targetY);
      frame=0;
      document.documentElement.classList.remove('fa-card-wheel-smoothing');
      return;
    }
    window.scrollTo(0,current+(diff*0.28));
    frame=requestAnimationFrame(animate);
  }

  function clearExpandedState(card){
    if(!card||!card.classList.contains('expanded')) return;
    card.classList.remove('expanded');
    card.setAttribute('aria-expanded','false');
    watchedCard=null;
    watchedSince=0;

    /* Let the main interaction layer clear its remembered expanded-card key too. */
    if(document.body){
      document.body.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:false}));
    }
  }

  function topBoundary(){
    var edge=24;
    var nav=document.querySelector('nav');
    if(nav){
      var rect=nav.getBoundingClientRect();
      if(rect.top<=1&&rect.bottom>0){
        edge=Math.max(edge,rect.bottom+18);
      }
    }
    return Math.min(edge,Math.max(24,window.innerHeight*0.35));
  }

  function checkExpandedCardBoundary(){
    scrollCheckFrame=0;
    var currentY=window.scrollY||0;
    var delta=currentY-lastScrollY;
    lastScrollY=currentY;

    var card=document.querySelector('#menuPage .card.expanded,.daily-card.expanded');
    if(!card){
      watchedCard=null;
      watchedSince=0;
      return;
    }

    if(card!==watchedCard){
      watchedCard=card;
      watchedSince=performance.now();
      return;
    }

    /* Ignore layout settling immediately after opening a card. */
    if(performance.now()-watchedSince<220||Math.abs(delta)<0.5) return;

    var rect=card.getBoundingClientRect();
    if(delta>0 && rect.top<=topBoundary()){
      clearExpandedState(card);
      return;
    }
    if(delta<0 && rect.bottom>=window.innerHeight-28){
      clearExpandedState(card);
    }
  }

  document.addEventListener('wheel',function(event){
    var card=event.target.closest&&event.target.closest('#menuPage .card.expanded,.daily-card.expanded');
    if(!card){
      stopAnimation();
      return;
    }

    var factor=1;
    if(event.deltaMode===1) factor=16;
    else if(event.deltaMode===2) factor=window.innerHeight;
    var delta=event.deltaY*factor;
    if(!delta) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    if(!frame) targetY=window.scrollY||0;
    targetY=Math.max(0,Math.min(targetY+delta,maxScroll()));
    document.documentElement.classList.add('fa-card-wheel-smoothing');
    if(!frame) frame=requestAnimationFrame(animate);
  },{capture:true,passive:false});

  window.addEventListener('scroll',function(){
    if(!scrollCheckFrame) scrollCheckFrame=requestAnimationFrame(checkExpandedCardBoundary);
  },{passive:true});

  document.addEventListener('pointerdown',stopAnimation,true);
  document.addEventListener('keydown',function(event){
    if(event.key==='PageDown'||event.key==='PageUp'||event.key==='Home'||event.key==='End'||event.key==='ArrowDown'||event.key==='ArrowUp'||event.key===' '){
      stopAnimation();
    }
  },true);
})();
