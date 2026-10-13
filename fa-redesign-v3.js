/* FA_REDESIGN_V3 — stable interaction layer */
(function(){
  'use strict';
  if(window.__FA_REDESIGN_V3__) return;
  window.__FA_REDESIGN_V3__=true;

  var cartSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.1 9.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L20 7H6"/><circle cx="10" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/></svg>';

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
    scope.querySelectorAll('.add-to-cart:not(.compact-cart-button)').forEach(function(btn){
      var text=String(btn.textContent||'').trim();
      if(text.indexOf('Добавить в корзину')!==-1 && text!=='Добавить в корзину'){
        btn.textContent='Добавить в корзину';
      }
    });
  }

  function protectDishImages(root){
    var scope=root||document;
    scope.querySelectorAll('#menuPage .card img.photo,.daily-card img.photo').forEach(function(img){
      img.draggable=false;
      img.setAttribute('draggable','false');
      img.style.setProperty('-webkit-user-drag','none');
      img.style.setProperty('user-select','none');
      img.style.setProperty('-webkit-user-select','none');
      if(img.dataset.faDragProtected==='1') return;
      img.dataset.faDragProtected='1';
      img.addEventListener('dragstart',function(event){event.preventDefault();});
    });
  }

  function prepareCompactCard(card){
    if(!card) return;
    var body=card.querySelector('.body');
    if(!body) return;
    var name=body.querySelector('.name');
    var nutrition=body.querySelector('.nutrition');
    var button=body.querySelector('.add-to-cart');
    if(!name||!nutrition||!button) return;

    if(name.nextElementSibling!==nutrition){
      name.insertAdjacentElement('afterend',nutrition);
    }
    if(button.parentElement!==nutrition){
      nutrition.appendChild(button);
    }

    button.classList.remove('btn','primary');
    button.classList.add('compact-cart-button');
    button.setAttribute('aria-label','Добавить в корзину');
    button.setAttribute('title','Добавить в корзину');
    button.innerHTML=cartSvg;
  }

  function restoreNormalCard(card){
    if(!card) return;
    var body=card.querySelector('.body');
    if(!body) return;
    var button=body.querySelector('.add-to-cart');
    var nutrition=body.querySelector('.nutrition');
    if(!button||!button.classList.contains('compact-cart-button')) return;

    button.classList.remove('compact-cart-button');
    button.classList.add('btn','primary');
    button.textContent='Добавить в корзину';
    if(nutrition) body.appendChild(nutrition);
    body.appendChild(button);
  }

  function styleCategories(){
    document.querySelectorAll('#menuPage section h2').forEach(function(el){
      el.style.setProperty('background','transparent','important');
      el.style.setProperty('box-shadow','none','important');
      el.style.setProperty('-webkit-backdrop-filter','none','important');
      el.style.setProperty('backdrop-filter','none','important');
      el.style.setProperty('color','#f4eee6','important');
      el.style.setProperty('text-shadow','0 2px 8px rgba(0,0,0,.50)','important');
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

    visualCards.forEach(function(card){
      if(!card.classList.contains('featured-card')&&!card.classList.contains('wide-card')){
        prepareCompactCard(card);
      }else{
        restoreNormalCard(card);
      }
    });

    cleanCartButtons(grid);
    protectDishImages(grid);
  }

  function decorateMenu(){
    document.querySelectorAll('#menuPage section').forEach(decorateSection);
    styleCategories();
    cleanCartButtons(document);
    protectDishImages(document);
  }

  function centerCard(card){
    if(!card||!card.isConnected||!card.classList.contains('expanded')) return;
    var rect=card.getBoundingClientRect();
    var nav=document.querySelector('nav');
    var navH=nav?nav.getBoundingClientRect().height:0;
    var visibleHeight=Math.max(1,window.innerHeight-navH);
    var visibleCenter=navH+(visibleHeight/2);
    var absoluteCardCenter=window.scrollY+rect.top+(rect.height/2);
    var target=absoluteCardCenter-visibleCenter;
    var max=Math.max(0,document.documentElement.scrollHeight-window.innerHeight);
    target=Math.max(0,Math.min(target,max));
    window.scrollTo({top:target,behavior:'smooth'});
  }

  function scheduleCenter(card){
    window.setTimeout(function(){
      requestAnimationFrame(function(){centerCard(card);});
    },30);
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
    if(typeof window.applyCategoryTransparency==='function'){
      window.applyCategoryTransparency=styleCategories;
    }
    wrapDrawMenu();
    decorateMenu();
    bindCentering();
    window.addEventListener('pageshow',function(){decorateMenu();});
    console.info('[FA] Redesign V3 ready');
  }catch(e){
    console.error('[FA] Redesign V3 failed',e);
  }
})();
