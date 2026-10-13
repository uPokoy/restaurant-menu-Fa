/* FA_PHOTO_SCALE_V1 — independent zoom per dish card type */
(function(){
  'use strict';
  if(window.__FA_PHOTO_SCALE_V1__) return;
  window.__FA_PHOTO_SCALE_V1__=true;

  const KINDS=['small','tall','wide'];
  const MIN_SCALE=100;
  const MAX_SCALE=200;
  let scaleDraft=defaultScales();
  let saveContext=null;
  let saveContextTimer=0;

  function clampScale(value){
    const n=Number(value);
    return Number.isFinite(n)?Math.max(MIN_SCALE,Math.min(MAX_SCALE,Math.round(n))):100;
  }

  function defaultScales(){
    return {small:100,tall:100,wide:100};
  }

  function scalesFromPositions(positions){
    const source=positions&&typeof positions==='object'?positions:{};
    const out=defaultScales();
    KINDS.forEach(kind=>{
      const item=source[kind]&&typeof source[kind]==='object'?source[kind]:{};
      out[kind]=clampScale(item.scale);
    });
    return out;
  }

  function currentDish(){
    try{
      if(typeof editId==='undefined'||editId===null||!Array.isArray(dishes)) return null;
      return dishes.find(d=>d&&String(d.id)===String(editId))||null;
    }catch(e){return null;}
  }

  function scaleStyle(dish){
    const scales=scalesFromPositions(dish&&dish.photoPosition);
    return '--photo-small-scale:'+(scales.small/100)+';--photo-tall-scale:'+(scales.tall/100)+';--photo-wide-scale:'+(scales.wide/100)+';';
  }

  function installMarkupScale(){
    if(typeof window.photoMarkup!=='function') return false;
    if(window.photoMarkup.__faPhotoScaleWrapped) return true;
    const previous=window.photoMarkup;
    const wrapped=function(dish){
      let markup=previous.apply(this,arguments);
      if(!dish||!dish.photo||typeof markup!=='string') return markup;
      const vars=scaleStyle(dish);
      if(markup.indexOf('<img class="photo" style="')!==-1){
        markup=markup.replace('<img class="photo" style="','<img class="photo" style="'+vars);
      }else{
        markup=markup.replace('<img class="photo"','<img class="photo" style="'+vars+'"');
      }
      return markup;
    };
    wrapped.__faPhotoScaleWrapped=true;
    window.photoMarkup=wrapped;
    return true;
  }

  function installStyles(){
    if(document.getElementById('faPhotoScaleStyles')) return;
    const style=document.createElement('style');
    style.id='faPhotoScaleStyles';
    style.textContent=`
      #menuPage .card .photo,.daily-card .photo{
        transform:scale(var(--photo-small-scale,1));
        transform-origin:var(--photo-small-x,50%) var(--photo-small-y,50%);
      }
      #menuPage .card.featured-card .photo{
        transform:scale(var(--photo-tall-scale,1))!important;
        transform-origin:var(--photo-tall-x,50%) var(--photo-tall-y,50%)!important;
      }
      #menuPage .card.wide-card .photo{
        transform:scale(var(--photo-wide-scale,1))!important;
        transform-origin:var(--photo-wide-x,50%) var(--photo-wide-y,50%)!important;
      }
      .dish-photo-preview-card img{transition:transform .12s ease,object-position .12s ease}
      @media(max-width:900px){
        #menuPage .card .photo{
          transform:scale(var(--photo-small-scale,1))!important;
          transform-origin:var(--photo-small-x,50%) var(--photo-small-y,50%)!important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function editorElement(){
    return document.getElementById('dishPhotoEditor');
  }

  function ensureScaleControls(){
    const editor=editorElement();
    if(!editor) return false;
    editor.querySelectorAll('[data-photo-kind]').forEach(item=>{
      const kind=item.getAttribute('data-photo-kind');
      if(!KINDS.includes(kind)||item.querySelector('[data-photo-scale]')) return;
      const controls=item.querySelector('.dish-photo-editor-controls');
      if(!controls) return;
      const row=document.createElement('div');
      row.className='dish-photo-editor-control';
      row.innerHTML='<label>Масштаб</label><input type="range" min="'+MIN_SCALE+'" max="'+MAX_SCALE+'" step="1" value="100" data-photo-scale><span class="dish-photo-editor-value" data-photo-scale-value>100%</span>';
      controls.appendChild(row);
      const range=row.querySelector('[data-photo-scale]');
      range.addEventListener('input',()=>{
        scaleDraft[kind]=clampScale(range.value);
        renderKind(kind);
      });
    });
    renderAll();
    return true;
  }

  function renderKind(kind){
    const editor=editorElement();
    if(!editor) return;
    const item=editor.querySelector('[data-photo-kind="'+kind+'"]');
    if(!item) return;
    const scale=clampScale(scaleDraft[kind]);
    const range=item.querySelector('[data-photo-scale]');
    const value=item.querySelector('[data-photo-scale-value]');
    const img=item.querySelector('[data-photo-preview]');
    if(range) range.value=String(scale);
    if(value) value.textContent=scale+'%';
    if(img){
      img.style.transform='scale('+(scale/100)+')';
      const x=item.querySelector('[data-photo-axis="x"]');
      const y=item.querySelector('[data-photo-axis="y"]');
      img.style.transformOrigin=(x?x.value:50)+'% '+(y?y.value:50)+'%';
    }
  }

  function renderAll(){
    KINDS.forEach(renderKind);
  }

  function loadScales(dish){
    scaleDraft=scalesFromPositions(dish&&dish.photoPosition);
    renderAll();
  }

  function resetScales(){
    scaleDraft=defaultScales();
    renderAll();
  }

  function installEditorHooks(){
    if(!ensureScaleControls()) return false;
    const editor=editorElement();
    const input=document.getElementById('fPhoto');

    if(input&&!input.__faPhotoScaleChangeBound){
      input.__faPhotoScaleChangeBound=true;
      input.addEventListener('change',()=>{
        const file=input.files&&input.files[0];
        if(file) resetScales();
        else loadScales(currentDish());
        setTimeout(renderAll,0);
      });
    }

    const reset=editor&&editor.querySelector('[data-photo-reset]');
    if(reset&&!reset.__faPhotoScaleResetBound){
      reset.__faPhotoScaleResetBound=true;
      reset.addEventListener('click',resetScales);
    }

    if(typeof window.editDish==='function'&&!window.editDish.__faPhotoScaleWrapped){
      const previous=window.editDish;
      const wrapped=function(id){
        const result=previous.apply(this,arguments);
        let dish=null;
        try{dish=Array.isArray(dishes)?dishes.find(d=>d&&String(d.id)===String(id)):null;}catch(e){}
        loadScales(dish);
        setTimeout(renderAll,0);
        return result;
      };
      wrapped.__faPhotoScaleWrapped=true;
      window.editDish=wrapped;
    }

    if(typeof window.cancelEdit==='function'&&!window.cancelEdit.__faPhotoScaleWrapped){
      const previous=window.cancelEdit;
      const wrapped=function(){
        const result=previous.apply(this,arguments);
        resetScales();
        return result;
      };
      wrapped.__faPhotoScaleWrapped=true;
      window.cancelEdit=wrapped;
    }
    return true;
  }

  function clearSaveContext(){
    saveContext=null;
    if(saveContextTimer){clearTimeout(saveContextTimer);saveContextTimer=0;}
  }

  function installPersistHook(){
    if(typeof window.persist!=='function') return false;
    if(window.persist.__faPhotoScaleWrapped) return true;
    const previous=window.persist;
    const wrapped=function(){
      if(saveContext){
        try{
          let dish=null;
          if(Array.isArray(dishes)){
            if(saveContext.editId!==null){
              dish=dishes.find(d=>d&&String(d.id)===String(saveContext.editId))||null;
            }else{
              dish=dishes.find(d=>d&&d.id!=null&&!saveContext.ids.has(String(d.id)))||dishes[dishes.length-1]||null;
            }
          }
          if(dish){
            if(!dish.photoPosition||typeof dish.photoPosition!=='object') dish.photoPosition={};
            KINDS.forEach(kind=>{
              const current=dish.photoPosition[kind]&&typeof dish.photoPosition[kind]==='object'?dish.photoPosition[kind]:{};
              dish.photoPosition[kind]=Object.assign({},current,{scale:clampScale(scaleDraft[kind])});
            });
          }
        }catch(e){console.warn('[FA] Photo scale save skipped',e);}
        clearSaveContext();
      }
      return previous.apply(this,arguments);
    };
    wrapped.__faPhotoScaleWrapped=true;
    window.persist=wrapped;
    return true;
  }

  function installSaveHook(){
    if(typeof window.saveDish!=='function') return false;
    if(window.saveDish.__faPhotoScaleWrapped) return true;
    const previous=window.saveDish;
    const wrapped=function(){
      try{
        const name=document.getElementById('fName');
        if(!name||!String(name.value||'').trim()||!Array.isArray(cats)||!cats.length||!adminUnlocked){
          return previous.apply(this,arguments);
        }
        const ids=new Set(Array.isArray(dishes)?dishes.filter(Boolean).map(d=>String(d.id)):[]);
        saveContext={editId:(typeof editId!=='undefined'&&editId!==null)?editId:null,ids};
        if(saveContextTimer) clearTimeout(saveContextTimer);
        saveContextTimer=setTimeout(clearSaveContext,30000);
      }catch(e){clearSaveContext();}
      try{return previous.apply(this,arguments);}catch(e){clearSaveContext();throw e;}
    };
    wrapped.__faPhotoScaleWrapped=true;
    window.saveDish=wrapped;
    return true;
  }

  function syncPreviewOrigins(){
    const editor=editorElement();
    if(!editor) return;
    editor.addEventListener('input',event=>{
      if(event.target&&event.target.matches('[data-photo-axis]')){
        const item=event.target.closest('[data-photo-kind]');
        const kind=item&&item.getAttribute('data-photo-kind');
        if(kind) renderKind(kind);
      }
    });
  }

  function install(){
    installStyles();
    const markupReady=installMarkupScale();
    const editorReady=installEditorHooks();
    const persistReady=installPersistHook();
    const saveReady=installSaveHook();
    if(editorReady&&!window.__FA_PHOTO_SCALE_ORIGIN_SYNC__){
      window.__FA_PHOTO_SCALE_ORIGIN_SYNC__=true;
      syncPreviewOrigins();
    }
    if(markupReady){
      try{if(typeof drawMenu==='function') drawMenu(typeof currentFilter==='undefined'?'all':currentFilter);}catch(e){}
    }
    if(!markupReady||!editorReady||!persistReady||!saveReady) setTimeout(install,200);
  }

  install();
})();