/* FA_REDESIGN_V3 — stable interaction layer */
(function(){
  'use strict';
  if(window.__FA_REDESIGN_V3__) return;
  window.__FA_REDESIGN_V3__=true;

  var cartSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.1 9.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L20 7H6"/><circle cx="10" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/></svg>';
  var activeExpandedKey=null;
  var pendingWheelDelta=0;
  var wheelFrame=0;

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

  function normalizeNutritionLabels(root){
    var scope=root||document;
    scope.querySelectorAll('.nutrition span').forEach(function(span){
      var text=String(span.textContent||'');
      if(text.indexOf('Ккал:')===0){
        span.textContent='К:'+text.slice(5);
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

  function validNutritionValue(value){
    return value!=='' && value!==null && value!==undefined && Number.isFinite(Number(value));
  }

  function ensureNutrition(card,dish){
    if(!card) return null;
    var body=card.querySelector('.body');
    if(!body) return null;

    var nutrition=body.querySelector('.nutrition');
    if(!nutrition){
      nutrition=document.createElement('div');
      nutrition.className='nutrition';
      body.appendChild(nutrition);
    }

    var button=body.querySelector('.add-to-cart');
    var n=dish&&dish.nutrition||{};
    var values=[
      ['К',n.kcal,false],
      ['Б',n.protein,true],
      ['Ж',n.fat,true],
      ['У',n.carbs,true]
    ];

    nutrition.innerHTML='';
    values.forEach(function(item){
      var span=document.createElement('span');
      var present=validNutritionValue(item[1]);
      span.textContent=item[0]+': '+(present?String(item[1])+(item[2]?' г':''):'—');
      nutrition.appendChild(span);
    });

    if(button && button.classList.contains('compact-cart-button')){
      nutrition.appendChild(button);
    }
    return nutrition;
  }

  function dishForCard(card,list){
    if(!card||!Array.isArray(list)) return null;
    var key=card.dataset.faDishKey;
    if(!key) return null;
    for(var i=0;i<list.length;i++){
      if(list[i]&&String(list[i].id)===String(key)) return list[i];
    }
    return null;
  }

  function prepareCompactCard(card,dish){
    if(!card) return;
    var body=card.querySelector('.body');
    if(!body) return;
    var nutrition=ensureNutrition(card,dish);
    var button=body.querySelector('.add-to-cart');
    if(!nutrition||!button) return;

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

  function prepareFeaturedCard(card,dish){
    if(!card) return;
    var body=card.querySelector('.body');
    if(!body) return;
    var name=body.querySelector('.name');
    var nutrition=ensureNutrition(card,dish);
    if(!name||!nutrition) return;
    if(name.nextElementSibling!==nutrition){
      name.insertAdjacentElement('afterend',nutrition);
    }
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
      var dish=dishForCard(card,list);
      if(!card.classList.contains('featured-card')&&!card.classList.contains('wide-card')){
        prepareCompactCard(card,dish);
      }else{
        restoreNormalCard(card);
        if(card.classList.contains('featured-card')) prepareFeaturedCard(card,dish);
      }
    });

    cleanCartButtons(grid);
    normalizeNutritionLabels(grid);
    protectDishImages(grid);
  }

  function decorateMenu(){
    document.querySelectorAll('#menuPage section').forEach(decorateSection);
    styleCategories();
    cleanCartButtons(document);
    normalizeNutritionLabels(document);
    protectDishImages(document);
  }

  function closeExpandedExcept(keep){
    document.querySelectorAll('.card.expanded,.daily-card.expanded').forEach(function(card){
      if(card===keep) return;
      card.classList.remove('expanded');
      card.setAttribute('aria-expanded','false');
    });
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

  function flushWheelScroll(){
    wheelFrame=0;
    if(!pendingWheelDelta) return;
    var delta=pendingWheelDelta;
    pendingWheelDelta=0;
    var scroller=document.scrollingElement||document.documentElement;
    scroller.scrollTop+=delta;
  }

  function bindInteractions(){
    document.addEventListener('click',function(event){
      if(event.target.closest('button,input,select,textarea,a')) return;

      var card=event.target.closest('.card,.daily-card');
      if(!card){
        closeExpandedExcept(null);
        activeExpandedKey=null;
        return;
      }

      closeExpandedExcept(card);
      if(card.classList.contains('expanded')){
        activeExpandedKey=card.dataset.faDishKey||null;
        if(card.matches('#menuPage .card')) scheduleCenter(card);
      }else{
        activeExpandedKey=null;
      }
    });

    document.addEventListener('keydown',function(event){
      if(event.key!=='Enter'&&event.key!==' ') return;
      var card=event.target.closest('.card,.daily-card');
      if(!card||event.target!==card) return;
      window.setTimeout(function(){
        closeExpandedExcept(card.classList.contains('expanded')?card:null);
        activeExpandedKey=card.classList.contains('expanded')?(card.dataset.faDishKey||null):null;
        if(card.classList.contains('expanded')&&card.matches('#menuPage .card')) scheduleCenter(card);
      },0);
    });

    document.addEventListener('wheel',function(event){
      var card=event.target.closest('#menuPage .card.expanded,.daily-card.expanded');
      if(!card) return;
      var factor=1;
      if(event.deltaMode===1) factor=16;
      else if(event.deltaMode===2) factor=window.innerHeight;
      var delta=event.deltaY*factor;
      if(!delta) return;
      event.preventDefault();
      pendingWheelDelta+=delta;
      if(!wheelFrame) wheelFrame=requestAnimationFrame(flushWheelScroll);
    },{passive:false});
  }

  function restoreExpandedCard(key){
    if(!key) return false;
    var cards=document.querySelectorAll('#menuPage .card[data-fa-dish-key]');
    for(var i=0;i<cards.length;i++){
      if(cards[i].dataset.faDishKey===String(key)){
        closeExpandedExcept(cards[i]);
        cards[i].classList.add('expanded');
        cards[i].setAttribute('aria-expanded','true');
        return true;
      }
    }
    return false;
  }

  function wrapDrawMenu(){
    try{
      if(typeof window.drawMenu!=='function'||window.drawMenu.__faV3Wrapped) return;
      var original=window.drawMenu;
      var wrapped=function(){
        var openCard=document.querySelector('#menuPage .card.expanded');
        var preserveKey=(openCard&&openCard.dataset.faDishKey)||activeExpandedKey;
        var result=original.apply(this,arguments);
        decorateMenu();
        if(preserveKey){
          if(restoreExpandedCard(preserveKey)) activeExpandedKey=String(preserveKey);
          else activeExpandedKey=null;
        }
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
    bindInteractions();
    window.addEventListener('pageshow',function(){decorateMenu();});
    console.info('[FA] Redesign V3 ready');
  }catch(e){
    console.error('[FA] Redesign V3 failed',e);
  }
})();
