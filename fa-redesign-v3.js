/* FA_REDESIGN_V3 — stable interaction layer */
(function(){
  'use strict';
  if(window.__FA_REDESIGN_V3__) return;
  window.__FA_REDESIGN_V3__=true;

  function localDayNumber(){
    var now=new Date();
    return Math.floor(Date.UTC(now.getFullYear(),now.getMonth(),now.getDate())/86400000);
  }

  function hashText(value){
    var h=0;
    var s=String(value||'');
    for(var i=0;i<s.length;i++) h=((h*31)+s.charCodeAt(i))>>>0;
    return h;
  }

  function cleanCartButtons(root){
    var scope=root||document;
    scope.querySelectorAll('.add-to-cart').forEach(function(btn){
      var text=String(btn.textContent||'').trim();
      if(text.indexOf('Добавить в корзину')!==-1 && text!=='Добавить в корзину'){
        btn.textContent='Добавить в корзину';
      }
    });
  }

  function decorateSection(section){
    if(!section) return;
    var grid=section.querySelector('.grid');
    var heading=section.querySelector('h2');
    if(!grid||!heading) return;

    var cards=Array.prototype.slice.call(grid.querySelectorAll(':scope > .card'));
    if(!cards.length) return;

    var cat=String(heading.textContent||'').trim();
    var list=[];
    try{
      if(typeof dishes!=='undefined' && Array.isArray(dishes)){
        list=dishes.filter(function(d){return d&&d.cat===cat;});
      }
    }catch(e){
      list=[];
    }

    cards.forEach(function(card,index){
      card.classList.remove('featured-card','wide-card');
      if(!card.dataset.faDishKey){
        var dish=list[index];
        card.dataset.faDishKey=dish&&dish.id!=null?String(dish.id):('idx-'+index);
      }
    });

    if(cards.length>=2){
      var selectedCard=null;
      if(list.length){
        var index=(localDayNumber()+(hashText(cat)%list.length))%list.length;
        var selected=list[index];
        if(selected){
          selectedCard=cards.find(function(card){
            return card.dataset.faDishKey===String(selected.id);
          })||null;
        }
      }
      if(!selectedCard){
        selectedCard=cards[(localDayNumber()+hashText(cat))%cards.length];
      }
      if(selectedCard){
        selectedCard.classList.add('featured-card');
        if(grid.firstElementChild!==selectedCard) grid.insertBefore(selectedCard,grid.firstElementChild);
      }
    }

    var visualCards=Array.prototype.slice.call(grid.querySelectorAll(':scope > .card'));
    if(visualCards.length>=6) visualCards[5].classList.add('wide-card');
    cleanCartButtons(grid);
  }

  function decorateMenu(){
    document.querySelectorAll('#menuPage section').forEach(decorateSection);
    cleanCartButtons(document);
  }

  function centerCard(card){
    if(!card||!card.isConnected||!card.classList.contains('expanded')) return;
    var rect=card.getBoundingClientRect();
    var nav=document.querySelector('nav');
    var navH=nav?nav.getBoundingClientRect().height:0;
    var available=Math.max(0,window.innerHeight-navH);
    var target=window.scrollY+rect.top-navH+((available-rect.height)/2);
    var max=Math.max(0,document.documentElement.scrollHeight-window.innerHeight);
    target=Math.max(0,Math.min(target,max));
    window.scrollTo({top:target,behavior:'smooth'});
  }

  function scheduleCenter(card){
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){centerCard(card);});
    });
  }

  function bindCentering(){
    document.addEventListener('click',function(event){
      if(event.target.closest('button,input,select,textarea,a')) return;
      var card=event.target.closest('#menuPage .card');
      if(!card) return;
      scheduleCenter(card);
    });

    document.addEventListener('keydown',function(event){
      if(event.key!=='Enter'&&event.key!==' ') return;
      var card=event.target.closest('#menuPage .card');
      if(!card||event.target!==card) return;
      scheduleCenter(card);
    });
  }

  function wrapDrawMenu(){
    try{
      if(typeof window.drawMenu!=='function'||window.drawMenu.__faV3Wrapped) return;
      var original=window.drawMenu;
      var wrapped=function(){
        var result=original.apply(this,arguments);
        decorateMenu();
        return result;
      };
      wrapped.__faV3Wrapped=true;
      window.drawMenu=wrapped;
    }catch(e){
      console.warn('[FA] V3 drawMenu wrap skipped',e);
    }
  }

  try{
    wrapDrawMenu();
    decorateMenu();
    bindCentering();
    window.addEventListener('pageshow',function(){
      decorateMenu();
    });
    console.info('[FA] Redesign V3 ready');
  }catch(e){
    console.error('[FA] Redesign V3 failed',e);
  }
})();
