/* FA_NOVELTY_CARD_FIX_V1 — keep novelty card roles separate */
(function(){
  'use strict';
  if(window.__FA_NOVELTY_CARD_FIX_V1__) return;
  window.__FA_NOVELTY_CARD_FIX_V1__=true;

  var cartSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.1 9.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L20 7H6"/><circle cx="10" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/></svg>';
  var observer=null;
  var scheduled=false;

  function valid(value){
    return value!==''&&value!==null&&value!==undefined&&Number.isFinite(Number(value));
  }

  function dishFor(card){
    var key=card&&card.dataset&&card.dataset.faDishKey;
    if(!key) return null;
    try{
      if(typeof dishes!=='undefined'&&Array.isArray(dishes)){
        for(var i=0;i<dishes.length;i++){
          if(dishes[i]&&String(dishes[i].id)===String(key)) return dishes[i];
        }
      }
    }catch(e){}
    return null;
  }

  function ensureNutrition(card){
    var body=card&&card.querySelector('.body');
    if(!body) return null;
    var nutrition=body.querySelector('.nutrition');
    if(!nutrition){
      nutrition=document.createElement('div');
      nutrition.className='nutrition';
      body.appendChild(nutrition);
    }
    var pill=nutrition.querySelector(':scope > .nutrition-pill');
    if(!pill){
      pill=document.createElement('div');
      pill.className='nutrition-pill';
      nutrition.insertBefore(pill,nutrition.firstChild||null);
      var dish=dishFor(card);
      var n=dish&&dish.nutrition||{};
      [
        ['К',n.kcal,false],
        ['Б',n.protein,true],
        ['Ж',n.fat,true],
        ['У',n.carbs,true]
      ].forEach(function(item){
        var span=document.createElement('span');
        span.textContent=item[0]+': '+(valid(item[1])?String(item[1])+(item[2]?' г':''):'—');
        pill.appendChild(span);
      });
    }
    return nutrition;
  }

  function protectPhoto(card){
    var photo=card&&card.querySelector('img.photo');
    if(!photo) return;
    photo.draggable=false;
    photo.setAttribute('draggable','false');
    photo.style.setProperty('-webkit-user-drag','none');
    photo.style.setProperty('user-select','none');
    photo.style.setProperty('-webkit-user-select','none');
  }

  function makeCompact(card){
    if(!card) return;
    card.classList.remove('featured-card','wide-card');
    var body=card.querySelector('.body');
    var nutrition=ensureNutrition(card);
    if(!body||!nutrition) return;
    var button=body.querySelector('.add-to-cart');
    if(button){
      if(button.parentElement!==nutrition) nutrition.appendChild(button);
      if(!button.classList.contains('compact-cart-button')||button.classList.contains('btn')||button.classList.contains('primary')){
        button.classList.remove('btn','primary');
        button.classList.add('compact-cart-button');
      }
      button.setAttribute('aria-label','Добавить в корзину');
      button.setAttribute('title','Добавить в корзину');
      if(!button.querySelector('svg')) button.innerHTML=cartSvg;
    }
    protectPhoto(card);
  }

  function makeFeatured(card){
    if(!card) return;
    card.classList.remove('wide-card');
    card.classList.add('featured-card');
    var body=card.querySelector('.body');
    var nutrition=ensureNutrition(card);
    if(!body||!nutrition) return;
    var name=body.querySelector('.name');
    if(name&&name.nextElementSibling!==nutrition) name.insertAdjacentElement('afterend',nutrition);
    var button=body.querySelector('.add-to-cart');
    if(button){
      if(button.parentElement===nutrition) body.appendChild(button);
      button.classList.remove('compact-cart-button');
      button.classList.add('btn','primary');
      if(button.textContent!=='Добавить в корзину') button.textContent='Добавить в корзину';
      button.setAttribute('aria-label','Добавить в корзину');
      button.setAttribute('title','Добавить в корзину');
    }
    protectPhoto(card);
  }

  function apply(){
    scheduled=false;
    var section=document.querySelector('#menuPage .home-new-section');
    if(!section) return;
    section.querySelectorAll('.home-new-single,.home-new-pair,.home-new-small').forEach(makeCompact);
    section.querySelectorAll('.home-new-featured').forEach(makeFeatured);
  }

  function schedule(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(apply);
  }

  function observe(){
    var page=document.getElementById('menuPage');
    if(!page) return;
    if(observer) observer.disconnect();
    observer=new MutationObserver(schedule);
    observer.observe(page,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  }

  apply();
  observe();
  window.addEventListener('pageshow',schedule);
})();
