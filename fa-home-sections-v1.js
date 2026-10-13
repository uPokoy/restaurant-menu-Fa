/* FA_HOME_SECTIONS_V1 — home composition for New + Daily */
(function(){
  'use strict';
  if(window.__FA_HOME_SECTIONS_V1__) return;
  window.__FA_HOME_SECTIONS_V1__=true;

  var cartSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.1 9.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L20 7H6"/><circle cx="10" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/></svg>';
  var refreshSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6v5h-5"/><path d="M19.1 11a7.5 7.5 0 1 0-.9 5.1"/></svg>';
  var navObserver=null;

  function getMenuPage(){
    return document.getElementById('menuPage');
  }

  function getDishes(){
    try{return Array.isArray(dishes)?dishes:[];}catch(e){return [];}
  }

  function isSpecialNavButton(btn){
    var text=String(btn&&btn.textContent||'').replace(/\s+/g,' ').trim();
    text=text.replace(/^[^А-Яа-яA-Za-z0-9]+/,'').trim();
    return text==='Новинки'||text==='Блюда дня'||text==='Блюдо дня';
  }

  function stripSpecialNav(){
    var nav=document.querySelector('nav');
    if(!nav) return;
    Array.prototype.slice.call(nav.querySelectorAll('button')).forEach(function(btn){
      if(isSpecialNavButton(btn)) btn.remove();
    });
  }

  function watchNav(){
    var nav=document.querySelector('nav');
    if(!nav) return;
    if(navObserver) navObserver.disconnect();
    navObserver=new MutationObserver(function(){stripSpecialNav();});
    navObserver.observe(nav,{childList:true,subtree:true,characterData:true});
    stripSpecialNav();
  }

  function wrapBuildNav(){
    try{
      if(typeof window.buildNav!=='function'||window.buildNav.__faHomeWrapped) return;
      var original=window.buildNav;
      var wrapped=function(){
        var result=original.apply(this,arguments);
        stripSpecialNav();
        watchNav();
        return result;
      };
      wrapped.__faHomeWrapped=true;
      window.buildNav=wrapped;
    }catch(e){
      console.warn('[FA] Home nav wrap skipped',e);
    }
  }

  function pickRandom(category,list){
    var matches=list.filter(function(d){return d&&d.cat===category;});
    return matches.length?matches[Math.floor(Math.random()*matches.length)]:null;
  }

  function getDailySelection(){
    var list=getDishes();
    var saved=null;
    try{saved=JSON.parse(localStorage.getItem('dailyMenuSelection')||'null');}catch(e){saved=null;}

    var soup=saved&&saved.soupId?list.find(function(d){return d&&d.id===saved.soupId;})||pickRandom('Супы',list):pickRandom('Супы',list);
    var main=saved&&saved.mainId?list.find(function(d){return d&&d.id===saved.mainId;})||pickRandom('Вторые блюда',list):pickRandom('Вторые блюда',list);

    if(!saved||!saved.soupId||!saved.mainId||!soup||!main){
      try{
        localStorage.setItem('dailyMenuSelection',JSON.stringify({soupId:soup?soup.id:null,mainId:main?main.id:null}));
      }catch(e){}
    }
    return {soup:soup,main:main};
  }

  function nutritionValues(dish){
    var n=dish&&dish.nutrition||{};
    return [
      ['К',n.kcal,false],
      ['Б',n.protein,true],
      ['Ж',n.fat,true],
      ['У',n.carbs,true]
    ];
  }

  function validValue(value){
    return value!==''&&value!==null&&value!==undefined&&Number.isFinite(Number(value));
  }

  function compactifyCard(card,dish){
    if(!card||!dish) return;
    card.dataset.faDishKey=String(dish.id);
    var body=card.querySelector('.body');
    if(!body) return;

    var nutrition=body.querySelector('.nutrition');
    if(!nutrition){
      nutrition=document.createElement('div');
      nutrition.className='nutrition';
      body.appendChild(nutrition);
    }

    nutrition.innerHTML='';
    var pill=document.createElement('div');
    pill.className='nutrition-pill';
    nutritionValues(dish).forEach(function(item){
      var span=document.createElement('span');
      span.textContent=item[0]+': '+(validValue(item[1])?String(item[1])+(item[2]?' г':''):'—');
      pill.appendChild(span);
    });
    nutrition.appendChild(pill);

    var button=body.querySelector('.add-to-cart');
    if(button){
      button.classList.remove('btn','primary');
      button.classList.add('compact-cart-button');
      button.setAttribute('aria-label','Добавить в корзину');
      button.setAttribute('title','Добавить в корзину');
      button.innerHTML=cartSvg;
      nutrition.appendChild(button);
    }

    var photo=card.querySelector('img.photo');
    if(photo){
      photo.draggable=false;
      photo.setAttribute('draggable','false');
      photo.style.setProperty('-webkit-user-drag','none');
      photo.style.setProperty('user-select','none');
      photo.style.setProperty('-webkit-user-select','none');
    }
  }

  function buildNewSection(fresh){
    var count=fresh.length;
    var section=document.createElement('section');
    section.className='home-special-section home-new-section home-new-count-'+count;
    section.innerHTML='<h2>Новинки</h2><div class="grid home-new-grid home-new-grid-count-'+count+'">'+fresh.map(function(d){return card(d);}).join('')+'</div>';
    var cards=section.querySelectorAll('.card');
    Array.prototype.forEach.call(cards,function(el,index){
      compactifyCard(el,fresh[index]);
      if(count===1) el.classList.add('home-new-single');
      else if(count===2) el.classList.add('home-new-pair');
      else if(index===0) el.classList.add('home-new-featured');
      else el.classList.add('home-new-small');
    });
    return section;
  }

  function buildDailyCard(label,dish){
    var holder=document.createElement('div');
    holder.innerHTML=dailyCard(label,dish);
    var cardEl=holder.firstElementChild;
    if(cardEl){
      cardEl.classList.add('home-daily-card');
      if(dish) compactifyCard(cardEl,dish);
    }
    return cardEl;
  }

  function buildDailySection(){
    var daily=getDailySelection();
    var section=document.createElement('section');
    section.className='home-special-section home-daily-section';

    var titleRow=document.createElement('div');
    titleRow.className='home-section-title-row';
    var heading=document.createElement('h2');
    heading.textContent='Блюдо дня';
    titleRow.appendChild(heading);

    var refresh=document.createElement('button');
    refresh.type='button';
    refresh.className='home-daily-refresh';
    refresh.innerHTML=refreshSvg;
    var last=Number(localStorage.getItem('dailyMenuLastRefresh')||0);
    var remaining=Math.max(0,300000-(Date.now()-last));
    refresh.disabled=remaining>0;
    refresh.title=remaining>0?'Обновить можно позже':'Обновить блюда дня';
    refresh.setAttribute('aria-label',refresh.title);
    refresh.addEventListener('click',function(event){
      event.stopPropagation();
      if(refresh.disabled) return;
      if(typeof refreshDaily==='function') refreshDaily();
      window.setTimeout(function(){
        try{drawMenu('all');}catch(e){renderHomeSections();}
      },0);
    });
    titleRow.appendChild(refresh);
    section.appendChild(titleRow);

    var row=document.createElement('div');
    row.className='home-daily-row';
    var soupCard=buildDailyCard('Суп дня',daily.soup);
    var mainCard=buildDailyCard('Второе блюдо дня',daily.main);
    if(soupCard) row.appendChild(soupCard);
    if(mainCard) row.appendChild(mainCard);
    section.appendChild(row);
    return section;
  }

  function renderHomeSections(){
    var page=getMenuPage();
    if(!page) return;
    page.querySelectorAll(':scope > .home-special-section').forEach(function(el){el.remove();});

    var list=getDishes();
    var now=Date.now();
    var fresh=list.filter(function(d){
      return d&&d.addedAt&&(now-Number(d.addedAt))<7*24*60*60*1000;
    }).sort(function(a,b){return Number(b.addedAt)-Number(a.addedAt);}).slice(0,5);

    var fragment=document.createDocumentFragment();
    if(fresh.length) fragment.appendChild(buildNewSection(fresh));
    fragment.appendChild(buildDailySection());

    var firstRegular=page.querySelector(':scope > section:not(.home-special-section)');
    page.insertBefore(fragment,firstRegular||null);
  }

  function wrapDrawMenu(){
    try{
      if(typeof window.drawMenu!=='function'||window.drawMenu.__faHomeWrapped) return;
      var original=window.drawMenu;
      var wrapped=function(filter){
        var result=original.apply(this,arguments);
        var activeFilter=filter;
        if(activeFilter===undefined||activeFilter===null){
          try{activeFilter=currentFilter;}catch(e){activeFilter='all';}
        }
        if(activeFilter==='all') renderHomeSections();
        stripSpecialNav();
        return result;
      };
      wrapped.__faHomeWrapped=true;
      window.drawMenu=wrapped;
    }catch(e){
      console.warn('[FA] Home drawMenu wrap skipped',e);
    }
  }

  function init(){
    stripSpecialNav();
    watchNav();
    wrapBuildNav();
    wrapDrawMenu();
    try{
      if(typeof currentFilter!=='undefined'&&currentFilter==='all'&&!getMenuPage().classList.contains('hidden')){
        renderHomeSections();
      }
    }catch(e){
      renderHomeSections();
    }
    window.setTimeout(function(){stripSpecialNav();watchNav();},0);
    window.setTimeout(stripSpecialNav,250);
    window.setTimeout(stripSpecialNav,1000);
    console.info('[FA] Home sections ready');
  }

  init();
})();
