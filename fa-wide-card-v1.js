/* FA_WIDE_CARD_V1 — wide cards match compact card details */
(function(){
  'use strict';
  if(window.__FA_WIDE_CARD_V1__) return;
  window.__FA_WIDE_CARD_V1__=true;

  var cartSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.1 9.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L20 7H6"/><circle cx="10" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/></svg>';

  function valid(value){
    return value!=='' && value!==null && value!==undefined && Number.isFinite(Number(value));
  }

  function dishFor(card){
    var key=card&&card.dataset&&card.dataset.faDishKey;
    if(!key) return null;
    try{
      if(typeof dishes!=='undefined' && Array.isArray(dishes)){
        for(var i=0;i<dishes.length;i++){
          if(dishes[i]&&String(dishes[i].id)===String(key)) return dishes[i];
        }
      }
    }catch(e){}
    return null;
  }

  function decorateWideCard(card){
    if(!card) return;
    var body=card.querySelector('.body');
    if(!body) return;

    var dish=dishFor(card);
    var n=dish&&dish.nutrition||{};
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
    }

    pill.innerHTML='';
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

    var button=body.querySelector('.add-to-cart');
    if(button){
      button.classList.remove('btn','primary');
      button.classList.add('compact-cart-button');
      button.setAttribute('aria-label','Добавить в корзину');
      button.setAttribute('title','Добавить в корзину');
      button.innerHTML=cartSvg;
      if(button.parentElement!==nutrition) nutrition.appendChild(button);
    }
  }

  function decorate(){
    document.querySelectorAll('#menuPage .card.wide-card').forEach(decorateWideCard);
  }

  function wrapDrawMenu(){
    if(typeof window.drawMenu!=='function'||window.drawMenu.__faWideWrapped) return;
    var previous=window.drawMenu;
    var wrapped=function(){
      var result=previous.apply(this,arguments);
      decorate();
      return result;
    };
    wrapped.__faWideWrapped=true;
    window.drawMenu=wrapped;
  }

  decorate();
  wrapDrawMenu();
  window.addEventListener('pageshow',decorate);
})();
