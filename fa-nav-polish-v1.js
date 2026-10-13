/* FA_NAV_POLISH_V1 — site-native utility navigation icons */
(function(){
  'use strict';
  if(window.__FA_NAV_POLISH_V1__) return;
  window.__FA_NAV_POLISH_V1__=true;

  var plusSvg='<svg class="fa-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
  var cartSvg='<svg class="fa-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.1 9.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L20 7H6"/><circle cx="10" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/></svg>';
  var settingsSvg='<svg class="fa-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h7M15 7h5M4 17h4M12 17h8"/><circle cx="13" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>';

  function getCount(button){
    if(!button) return '';
    var badge=button.querySelector('.cart-count');
    if(badge) return String(badge.textContent||'').trim();
    var text=String(button.textContent||'');
    var match=text.match(/\d+/);
    return match?match[0]:'';
  }

  function decorate(){
    var nav=document.querySelector('nav');
    if(!nav) return;

    var add=nav.querySelector('button[title="Добавить"]');
    if(add){
      add.classList.add('fa-nav-utility','fa-nav-add');
      if(!add.querySelector('.fa-nav-icon')) add.innerHTML=plusSvg;
    }

    var cart=nav.querySelector('#cartNav,.cart-btn');
    if(cart){
      var count=getCount(cart);
      cart.classList.add('fa-nav-utility','fa-nav-cart');
      cart.innerHTML=cartSvg+(count?'<span class="cart-count">'+count+'</span>':'');
    }

    var settings=nav.querySelector('.settings-gear,button[title="Настройки"]');
    if(settings){
      settings.classList.add('fa-nav-utility','fa-nav-settings');
      if(!settings.querySelector('.fa-nav-icon')) settings.innerHTML=settingsSvg;
    }
  }

  function wrap(name,flag){
    var current=window[name];
    if(typeof current!=='function'||current[flag]) return;
    var wrapped=function(){
      var result=current.apply(this,arguments);
      decorate();
      return result;
    };
    wrapped[flag]=true;
    window[name]=wrapped;
  }

  wrap('renderNav','__faNavPolishWrapped');
  wrap('updateCartBadge','__faCartBadgePolishWrapped');
  decorate();
  window.addEventListener('pageshow',decorate);
})();
