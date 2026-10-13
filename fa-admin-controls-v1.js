/* FA_ADMIN_CONTROLS_V1 — custom category select, accordion tools and dish search */
(function(){
  'use strict';
  if(window.__FA_ADMIN_CONTROLS_V1__) return;
  window.__FA_ADMIN_CONTROLS_V1__=true;

  const nativeSelect=document.getElementById('fCat');
  const addPage=document.getElementById('addPage');
  if(!nativeSelect||!addPage) return;

  let customRoot=null;
  let customButton=null;
  let customLabel=null;
  let customMenu=null;
  let searchInput=null;

  function closeSelect(){
    if(!customRoot) return;
    customRoot.classList.remove('open');
    if(customButton) customButton.setAttribute('aria-expanded','false');
  }

  function openSelect(){
    if(!customRoot) return;
    customRoot.classList.add('open');
    if(customButton) customButton.setAttribute('aria-expanded','true');
    const selected=customMenu&&customMenu.querySelector('[aria-selected="true"]');
    if(selected) selected.focus({preventScroll:true});
  }

  function selectedIndex(){
    const options=Array.from(nativeSelect.options||[]);
    const index=options.findIndex(o=>o.value===nativeSelect.value);
    return index>=0?index:0;
  }

  function selectAt(index){
    const options=Array.from(nativeSelect.options||[]);
    if(!options.length) return;
    const safe=Math.max(0,Math.min(options.length-1,index));
    nativeSelect.value=options[safe].value;
    nativeSelect.dispatchEvent(new Event('change',{bubbles:true}));
    syncSelect();
  }

  function ensureSelect(){
    if(customRoot&&document.documentElement.contains(customRoot)) return;
    customRoot=document.createElement('div');
    customRoot.className='fa-cat-select';

    customButton=document.createElement('button');
    customButton.type='button';
    customButton.className='fa-cat-select-button';
    customButton.setAttribute('aria-haspopup','listbox');
    customButton.setAttribute('aria-expanded','false');

    customLabel=document.createElement('span');
    customLabel.className='fa-cat-select-label';
    const chevron=document.createElement('span');
    chevron.className='fa-cat-select-chevron';
    chevron.setAttribute('aria-hidden','true');
    customButton.append(customLabel,chevron);

    customMenu=document.createElement('div');
    customMenu.className='fa-cat-select-menu';
    customMenu.setAttribute('role','listbox');

    customRoot.append(customButton,customMenu);
    nativeSelect.insertAdjacentElement('afterend',customRoot);
    nativeSelect.classList.add('fa-native-select-hidden');

    customButton.addEventListener('click',()=>{
      if(customRoot.classList.contains('open')) closeSelect();
      else openSelect();
    });

    customButton.addEventListener('keydown',event=>{
      if(event.key==='ArrowDown'||event.key==='ArrowUp'){
        event.preventDefault();
        const delta=event.key==='ArrowDown'?1:-1;
        selectAt(selectedIndex()+delta);
        openSelect();
      }else if(event.key==='Escape'){
        closeSelect();
      }
    });

    customMenu.addEventListener('keydown',event=>{
      const item=event.target.closest('.fa-cat-select-option');
      if(!item) return;
      const options=Array.from(customMenu.querySelectorAll('.fa-cat-select-option'));
      const index=options.indexOf(item);
      if(event.key==='ArrowDown'||event.key==='ArrowUp'){
        event.preventDefault();
        const next=event.key==='ArrowDown'?Math.min(options.length-1,index+1):Math.max(0,index-1);
        options[next]?.focus();
      }else if(event.key==='Escape'){
        event.preventDefault();
        closeSelect();
        customButton.focus();
      }
    });
  }

  function syncSelect(){
    ensureSelect();
    const options=Array.from(nativeSelect.options||[]);
    const current=nativeSelect.value;
    if(customLabel){
      const selected=options.find(o=>o.value===current)||options[0];
      customLabel.textContent=selected?selected.textContent:'Выберите категорию';
    }
    if(!customMenu) return;
    customMenu.innerHTML='';
    options.forEach(option=>{
      const button=document.createElement('button');
      button.type='button';
      button.className='fa-cat-select-option';
      button.setAttribute('role','option');
      button.setAttribute('aria-selected',option.value===current?'true':'false');
      button.textContent=option.textContent;
      button.addEventListener('click',()=>{
        nativeSelect.value=option.value;
        nativeSelect.dispatchEvent(new Event('change',{bubbles:true}));
        syncSelect();
        closeSelect();
        customButton.focus();
      });
      customMenu.appendChild(button);
    });
  }

  function findDetailsByContent(id){
    const content=document.getElementById(id);
    return content?content.closest('details.collapsible-list'):null;
  }

  function moveCategoryForm(){
    const input=document.getElementById('newCat');
    const categoryDetails=findDetailsByContent('catList');
    if(!input||!categoryDetails) return;
    if(categoryDetails.querySelector('.category-manage')) return;

    const source=input.closest('.add-card');
    const actions=input.closest('.category-actions');
    if(!source||!actions) return;

    const manage=document.createElement('div');
    manage.className='category-manage';
    const helper=source.querySelector('.small');
    if(helper) manage.appendChild(helper);
    manage.appendChild(actions);

    const summary=categoryDetails.querySelector('summary');
    if(summary) summary.insertAdjacentElement('afterend',manage);
    else categoryDetails.prepend(manage);
    source.remove();
  }

  function ensureSearch(){
    const dishDetails=findDetailsByContent('dishAdmin');
    const dishAdmin=document.getElementById('dishAdmin');
    if(!dishDetails||!dishAdmin) return;

    searchInput=document.getElementById('dishSearch');
    if(!searchInput){
      const wrap=document.createElement('div');
      wrap.className='dish-search-wrap';
      searchInput=document.createElement('input');
      searchInput.id='dishSearch';
      searchInput.type='search';
      searchInput.autocomplete='off';
      searchInput.placeholder='Поиск по добавленным блюдам';
      searchInput.setAttribute('aria-label','Поиск по добавленным блюдам');
      wrap.appendChild(searchInput);
      const summary=dishDetails.querySelector('summary');
      if(summary) summary.insertAdjacentElement('afterend',wrap);
      else dishDetails.prepend(wrap);
    }
    if(!searchInput.__faDishSearchBound){
      searchInput.__faDishSearchBound=true;
      searchInput.addEventListener('input',filterDishes);
    }
  }

  function filterDishes(){
    const dishAdmin=document.getElementById('dishAdmin');
    if(!dishAdmin) return;
    const query=String(searchInput&&searchInput.value||'').trim().toLocaleLowerCase('ru-RU');
    let visible=0;
    dishAdmin.querySelectorAll('.admin-item').forEach(item=>{
      const match=!query||String(item.textContent||'').toLocaleLowerCase('ru-RU').includes(query);
      item.hidden=!match;
      if(match) visible++;
    });
    let empty=dishAdmin.querySelector('.dish-search-empty');
    if(query&&visible===0){
      if(!empty){
        empty=document.createElement('div');
        empty.className='dish-search-empty';
        empty.textContent='Ничего не найдено';
        dishAdmin.appendChild(empty);
      }
    }else if(empty){
      empty.remove();
    }
  }

  function renameCancel(){
    const button=addPage.querySelector('button[onclick*="cancelEdit"]');
    if(button) button.textContent='Отменить';
  }

  function wrapFunction(name,after){
    const current=window[name];
    if(typeof current!=='function'||current['__faAdminControls_'+name]) return;
    const wrapped=function(){
      const result=current.apply(this,arguments);
      if(result&&typeof result.then==='function'){
        return result.then(value=>{after();return value;});
      }
      after();
      return result;
    };
    wrapped['__faAdminControls_'+name]=true;
    window[name]=wrapped;
  }

  function installWrappers(){
    wrapFunction('fillCats',syncSelect);
    wrapFunction('drawAdmin',filterDishes);
    wrapFunction('editDish',()=>setTimeout(syncSelect,0));
    wrapFunction('cancelEdit',()=>setTimeout(syncSelect,0));
  }

  function install(){
    moveCategoryForm();
    ensureSearch();
    renameCancel();
    syncSelect();
    filterDishes();
    installWrappers();
  }

  nativeSelect.addEventListener('change',syncSelect);
  document.addEventListener('click',event=>{
    if(customRoot&&!customRoot.contains(event.target)) closeSelect();
  });
  window.addEventListener('resize',closeSelect);
  install();
})();
