/* FA_IMAGE_OPTIMIZE_V4 — image optimization + per-card photo framing */
(function(){
  'use strict';

  const DISH_MAX_DIMENSION=1280;
  const DISH_JPEG_QUALITY=0.82;
  const DISH_MIN_BYTES=550000;

  const BG_MAX_DIMENSION=1920;
  const BG_JPEG_QUALITY=0.82;
  const BG_MIN_BYTES=700000;

  const POSITION_KINDS=['small','tall','wide'];
  let photoPositionDraft=defaultPositions();
  let photoPreviewSource='';

  function clampPosition(value){
    const n=Number(value);
    return Number.isFinite(n)?Math.max(0,Math.min(100,Math.round(n))):50;
  }

  function defaultPositions(){
    return {small:{x:50,y:50},tall:{x:50,y:50},wide:{x:50,y:50}};
  }

  function normalizePositions(value){
    const source=value&&typeof value==='object'?value:{};
    const out=defaultPositions();
    POSITION_KINDS.forEach(kind=>{
      const current=source[kind]&&typeof source[kind]==='object'?source[kind]:{};
      out[kind]={x:clampPosition(current.x),y:clampPosition(current.y)};
    });
    return out;
  }

  function copyPositions(value){
    return normalizePositions(value);
  }

  function photoStyle(dish){
    const p=normalizePositions(dish&&dish.photoPosition);
    return '--photo-small-x:'+p.small.x+'%;--photo-small-y:'+p.small.y+'%;--photo-tall-x:'+p.tall.x+'%;--photo-tall-y:'+p.tall.y+'%;--photo-wide-x:'+p.wide.x+'%;--photo-wide-y:'+p.wide.y+'%;';
  }

  function installPhotoMarkup(){
    if(typeof window.photoMarkup!=='function') return false;
    if(window.__FA_PHOTO_POSITION_MARKUP_INSTALLED) return true;
    window.__FA_PHOTO_POSITION_MARKUP_INSTALLED=true;
    const original=window.photoMarkup;
    window.photoMarkup=function(dish){
      const markup=original.apply(this,arguments);
      if(!dish||!dish.photo||typeof markup!=='string') return markup;
      return markup.replace('<img class="photo"','<img class="photo" style="'+photoStyle(dish)+'"');
    };
    return true;
  }

  function installPhotoPositionStyles(){
    if(document.getElementById('faPhotoPositionStyles')) return;
    const style=document.createElement('style');
    style.id='faPhotoPositionStyles';
    style.textContent=`
      #menuPage .card .photo,.daily-card .photo{object-position:var(--photo-small-x,50%) var(--photo-small-y,50%)}
      #menuPage .card.featured-card .photo{object-position:var(--photo-tall-x,50%) var(--photo-tall-y,50%)!important}
      #menuPage .card.wide-card .photo{object-position:var(--photo-wide-x,50%) var(--photo-wide-y,50%)!important}
      .dish-photo-editor{margin-top:16px;padding:16px;border:1px solid var(--line);border-radius:16px;background:rgba(12,12,12,.30)}
      .dish-photo-editor.hidden{display:none!important}
      .dish-photo-editor-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:14px}
      .dish-photo-editor-head h4{margin:0 0 4px;font-size:18px;color:var(--ink)}
      .dish-photo-editor-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;align-items:start}
      .dish-photo-editor-item{min-width:0;padding:14px;border:1px solid var(--line);border-radius:14px;background:rgba(18,17,16,.62)}
      .dish-photo-editor-item.wide{grid-column:1/-1}
      .dish-photo-editor-label{font-weight:800;margin-bottom:10px;color:var(--ink)}
      .dish-photo-preview-card{overflow:hidden;border:1px solid rgba(255,255,255,.13);border-radius:14px;background:#121212;box-shadow:0 8px 24px rgba(0,0,0,.22)}
      .dish-photo-preview-card img{display:block;width:100%;object-fit:cover;background:#151515;cursor:crosshair;touch-action:none;user-select:none;-webkit-user-drag:none}
      .dish-photo-preview-small img{aspect-ratio:1.62/1}
      .dish-photo-preview-tall{max-width:380px;margin:0 auto}
      .dish-photo-preview-tall img{aspect-ratio:.76/1}
      .dish-photo-preview-wide{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(180px,.65fr)}
      .dish-photo-preview-wide img{height:250px}
      .dish-photo-preview-body{min-height:58px;padding:13px 15px;display:flex;align-items:center;background:rgba(18,18,18,.96)}
      .dish-photo-preview-wide .dish-photo-preview-body{min-height:250px;align-items:center;padding:18px 20px}
      .dish-photo-preview-title{font-weight:800;color:var(--ink);line-height:1.25}
      .dish-photo-editor-controls{display:grid;gap:8px;margin-top:12px}
      .dish-photo-editor-control{display:grid;grid-template-columns:92px minmax(0,1fr) 42px;gap:9px;align-items:center}
      .dish-photo-editor-control label{margin:0;color:var(--muted);font-size:12px}
      .dish-photo-editor-control input[type=range]{padding:0;border:0;background:transparent;accent-color:var(--accent)}
      .dish-photo-editor-value{text-align:right;color:var(--muted);font-size:12px;font-variant-numeric:tabular-nums}
      .dish-photo-editor-tip{margin-top:10px;color:var(--muted);font-size:12px}
      @media(max-width:900px){#menuPage .card .photo{object-position:var(--photo-small-x,50%) var(--photo-small-y,50%)!important}}
      @media(max-width:760px){.dish-photo-editor-grid{grid-template-columns:1fr}.dish-photo-editor-item.wide{grid-column:auto}.dish-photo-preview-wide{grid-template-columns:1fr}.dish-photo-preview-wide img{height:auto;aspect-ratio:1.62/1}.dish-photo-preview-wide .dish-photo-preview-body{min-height:58px}.dish-photo-editor-head{flex-direction:column}.dish-photo-editor-control{grid-template-columns:82px minmax(0,1fr) 40px}}
    `;
    document.head.appendChild(style);
  }

  function editorMarkup(){
    return `
      <div class="dish-photo-editor-head">
        <div><h4>Расположение фото на карточках</h4><div class="small">Настройте кадр отдельно для каждого размера карточки.</div></div>
        <button type="button" class="btn" data-photo-reset>По центру</button>
      </div>
      <div class="dish-photo-editor-grid">
        ${editorItem('small','Маленькая карточка','dish-photo-preview-small')}
        ${editorItem('tall','Высокая карточка','dish-photo-preview-tall')}
        ${editorItem('wide','Широкая карточка','dish-photo-preview-wide','wide')}
      </div>
      <div class="dish-photo-editor-tip">Ползунками или прямо по фото укажите, какой участок должен оставаться в кадре.</div>
    `;
  }

  function editorItem(kind,label,previewClass,extraClass){
    return `<div class="dish-photo-editor-item ${extraClass||''}" data-photo-kind="${kind}">
      <div class="dish-photo-editor-label">${label}</div>
      <div class="dish-photo-preview-card ${previewClass}">
        <img alt="Предпросмотр фото блюда" draggable="false" data-photo-preview="${kind}">
        <div class="dish-photo-preview-body"><div class="dish-photo-preview-title" data-photo-preview-title>Название блюда</div></div>
      </div>
      <div class="dish-photo-editor-controls">
        <div class="dish-photo-editor-control"><label>Горизонталь</label><input type="range" min="0" max="100" step="1" data-photo-axis="x"><span class="dish-photo-editor-value" data-photo-value="x">50%</span></div>
        <div class="dish-photo-editor-control"><label>Вертикаль</label><input type="range" min="0" max="100" step="1" data-photo-axis="y"><span class="dish-photo-editor-value" data-photo-value="y">50%</span></div>
      </div>
    </div>`;
  }

  function currentDish(){
    try{
      if(typeof editId==='undefined'||editId===null||!Array.isArray(dishes)) return null;
      return dishes.find(d=>d&&String(d.id)===String(editId))||null;
    }catch(e){return null;}
  }

  function editorElement(){
    return document.getElementById('dishPhotoEditor');
  }

  function updatePreviewTitles(){
    const title=(document.getElementById('fName')&&document.getElementById('fName').value.trim())||'Название блюда';
    const editor=editorElement();
    if(!editor) return;
    editor.querySelectorAll('[data-photo-preview-title]').forEach(el=>{el.textContent=title;});
  }

  function renderKind(kind){
    const editor=editorElement();
    if(!editor||!photoPreviewSource) return;
    const item=editor.querySelector('[data-photo-kind="'+kind+'"]');
    if(!item) return;
    const pos=photoPositionDraft[kind]||{x:50,y:50};
    const img=item.querySelector('[data-photo-preview]');
    if(img){
      if(img.src!==photoPreviewSource) img.src=photoPreviewSource;
      img.style.objectPosition=pos.x+'% '+pos.y+'%';
    }
    ['x','y'].forEach(axis=>{
      const input=item.querySelector('[data-photo-axis="'+axis+'"]');
      const value=item.querySelector('[data-photo-value="'+axis+'"]');
      if(input) input.value=String(pos[axis]);
      if(value) value.textContent=pos[axis]+'%';
    });
  }

  function renderEditor(){
    POSITION_KINDS.forEach(renderKind);
    updatePreviewTitles();
  }

  function openEditor(source,positions){
    const editor=editorElement();
    if(!editor||!source){closeEditor();return;}
    photoPreviewSource=String(source);
    photoPositionDraft=normalizePositions(positions);
    editor.classList.remove('hidden');
    renderEditor();
  }

  function closeEditor(){
    const editor=editorElement();
    if(editor) editor.classList.add('hidden');
    photoPreviewSource='';
    photoPositionDraft=defaultPositions();
  }

  function setDraftPosition(kind,axis,value){
    if(!POSITION_KINDS.includes(kind)||(axis!=='x'&&axis!=='y')) return;
    photoPositionDraft[kind][axis]=clampPosition(value);
    renderKind(kind);
  }

  function resetDraftPositions(){
    photoPositionDraft=defaultPositions();
    renderEditor();
  }

  function bindPreviewPointer(img,kind){
    let dragging=false;
    const update=event=>{
      const rect=img.getBoundingClientRect();
      if(!rect.width||!rect.height) return;
      setDraftPosition(kind,'x',((event.clientX-rect.left)/rect.width)*100);
      setDraftPosition(kind,'y',((event.clientY-rect.top)/rect.height)*100);
    };
    img.addEventListener('pointerdown',event=>{
      dragging=true;
      try{img.setPointerCapture(event.pointerId);}catch(e){}
      update(event);
    });
    img.addEventListener('pointermove',event=>{if(dragging) update(event);});
    img.addEventListener('pointerup',()=>{dragging=false;});
    img.addEventListener('pointercancel',()=>{dragging=false;});
  }

  function installPhotoEditor(){
    const input=document.getElementById('fPhoto');
    if(!input) return false;
    if(editorElement()) return true;

    installPhotoPositionStyles();
    const editor=document.createElement('div');
    editor.id='dishPhotoEditor';
    editor.className='dish-photo-editor hidden';
    editor.innerHTML=editorMarkup();
    input.insertAdjacentElement('afterend',editor);

    editor.querySelectorAll('[data-photo-kind]').forEach(item=>{
      const kind=item.getAttribute('data-photo-kind');
      item.querySelectorAll('[data-photo-axis]').forEach(range=>{
        range.addEventListener('input',()=>setDraftPosition(kind,range.getAttribute('data-photo-axis'),range.value));
      });
      const img=item.querySelector('[data-photo-preview]');
      if(img) bindPreviewPointer(img,kind);
    });
    const reset=editor.querySelector('[data-photo-reset]');
    if(reset) reset.addEventListener('click',resetDraftPositions);

    input.addEventListener('change',()=>{
      const file=input.files&&input.files[0];
      if(!file){
        const dish=currentDish();
        if(dish&&dish.photo) openEditor(dish.photo,dish.photoPosition);
        else closeEditor();
        return;
      }
      const reader=new FileReader();
      reader.onload=()=>openEditor(reader.result,defaultPositions());
      reader.onerror=()=>closeEditor();
      reader.readAsDataURL(file);
    });

    const nameInput=document.getElementById('fName');
    if(nameInput) nameInput.addEventListener('input',updatePreviewTitles);

    if(typeof window.editDish==='function'&&!window.editDish.__faPhotoEditorWrapped){
      const originalEdit=window.editDish;
      const wrappedEdit=function(id){
        const result=originalEdit.apply(this,arguments);
        const dish=Array.isArray(dishes)?dishes.find(d=>d&&String(d.id)===String(id)):null;
        if(dish&&dish.photo) openEditor(dish.photo,dish.photoPosition);
        else closeEditor();
        return result;
      };
      wrappedEdit.__faPhotoEditorWrapped=true;
      window.editDish=wrappedEdit;
    }

    if(typeof window.cancelEdit==='function'&&!window.cancelEdit.__faPhotoEditorWrapped){
      const originalCancel=window.cancelEdit;
      const wrappedCancel=function(){
        const result=originalCancel.apply(this,arguments);
        closeEditor();
        return result;
      };
      wrappedCancel.__faPhotoEditorWrapped=true;
      window.cancelEdit=wrappedCancel;
    }
    return true;
  }

  function imageFromFile(file){
    return new Promise((resolve,reject)=>{
      const url=URL.createObjectURL(file);
      const img=new Image();
      img.onload=()=>{URL.revokeObjectURL(url);resolve(img)};
      img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Не удалось прочитать изображение'))};
      img.src=url;
    });
  }

  function canvasToBlob(canvas,type,quality){
    return new Promise((resolve,reject)=>{
      canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Не удалось сжать изображение')),type,quality);
    });
  }

  async function optimizeImageFile(file,maxDimension,quality,minBytes){
    if(!file || !String(file.type||'').startsWith('image/')) return file;
    if(file.size<=minBytes) return file;

    const img=await imageFromFile(file);
    const w=img.naturalWidth||img.width;
    const h=img.naturalHeight||img.height;
    if(!w||!h) return file;

    const scale=Math.min(1,maxDimension/Math.max(w,h));
    const outW=Math.max(1,Math.round(w*scale));
    const outH=Math.max(1,Math.round(h*scale));
    const canvas=document.createElement('canvas');
    canvas.width=outW;
    canvas.height=outH;
    const ctx=canvas.getContext('2d',{alpha:false});
    if(!ctx) return file;
    ctx.fillStyle='#fff';
    ctx.fillRect(0,0,outW,outH);
    ctx.drawImage(img,0,0,outW,outH);

    const blob=await canvasToBlob(canvas,'image/jpeg',quality);
    if(blob.size>=file.size) return file;
    const base=(file.name||'image').replace(/\.[^.]+$/,'');
    return new File([blob],base+'.jpg',{type:'image/jpeg',lastModified:Date.now()});
  }

  function readAsDataURL(file){
    return new Promise((resolve,reject)=>{
      const r=new FileReader();
      r.onload=()=>resolve(r.result);
      r.onerror=()=>reject(r.error||new Error('Не удалось прочитать изображение'));
      r.readAsDataURL(file);
    });
  }

  function applyLoadingHints(root){
    const base=root&&root.querySelectorAll?root:document;
    base.querySelectorAll('img.photo, img.cart-thumb').forEach(img=>{
      img.loading='lazy';
      img.decoding='async';
    });
    if(root&&root.matches&&root.matches('img.photo, img.cart-thumb')){
      root.loading='lazy';
      root.decoding='async';
    }
  }

  function installLoadingHints(){
    if(window.__FA_IMAGE_LOADING_HINTS_INSTALLED) return;
    window.__FA_IMAGE_LOADING_HINTS_INSTALLED=true;
    applyLoadingHints(document);
    const observer=new MutationObserver(mutations=>{
      for(const mutation of mutations){
        for(const node of mutation.addedNodes){
          if(node&&node.nodeType===1) applyLoadingHints(node);
        }
      }
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }

  function installDishOptimizer(){
    if(typeof window.saveDish!=='function') return false;
    if(window.__FA_DISH_IMAGE_OPTIMIZER_INSTALLED) return true;
    window.__FA_DISH_IMAGE_OPTIMIZER_INSTALLED=true;

    window.saveDish=async function(){
      if(!adminUnlocked)return alert('Сначала откройте раздел «Добавить» и введите пароль.');
      const name=fName.value.trim();
      if(!name)return alert('Введите название блюда.');
      if(!cats.length)return alert('Сначала создайте хотя бы одну категорию.');

      let file=fPhoto.files&&fPhoto.files[0];
      if(file){
        try{
          const optimized=await optimizeImageFile(file,DISH_MAX_DIMENSION,DISH_JPEG_QUALITY,DISH_MIN_BYTES);
          if(optimized!==file){
            if(typeof DataTransfer!=='undefined'){
              const dt=new DataTransfer();
              dt.items.add(optimized);
              fPhoto.files=dt.files;
            }
            console.info('[FA] Dish photo optimized',file.size,'->',optimized.size);
            file=optimized;
          }
        }catch(e){
          console.warn('[FA] Dish photo optimization skipped',e);
        }
      }

      const finish=photo=>{
        const existing=editId!==null?dishes.find(x=>String(x.id)===String(editId)):null;
        const positions=copyPositions(photoPositionDraft);
        const obj={
          id:editId!==null?editId:Date.now(),
          cat:fCat.value,
          name,
          desc:fDesc.value.trim(),
          ing:fIng.value.trim(),
          nutrition:{kcal:fKcal.value.trim(),protein:fProtein.value.trim(),fat:fFat.value.trim(),carbs:fCarbs.value.trim()},
          photo:photo||'',
          photoPosition:positions,
          addedAt:existing?.addedAt||(editId!==null?undefined:Date.now())
        };
        if(editId!==null){
          const i=dishes.findIndex(x=>String(x.id)===String(editId));
          if(i>=0)dishes[i]=obj;
        }else dishes.push(obj);
        persist();
        cancelEdit();
        renderNav();
        fillCats();
        drawAdmin();
        syncNavActive();
      };

      if(file){
        const reader=new FileReader();
        reader.onload=()=>finish(reader.result);
        reader.onerror=()=>alert('Не удалось прочитать фотографию.');
        reader.readAsDataURL(file);
      }else{
        finish(editId!==null?(dishes.find(x=>String(x.id)===String(editId))||{}).photo:'');
      }
    };
    return true;
  }

  function installBackgroundOptimizer(){
    if(typeof window.saveBackground!=='function') return false;
    if(window.__FA_BG_IMAGE_OPTIMIZER_INSTALLED) return true;
    window.__FA_BG_IMAGE_OPTIMIZER_INSTALLED=true;

    const original=window.saveBackground;
    window.saveBackground=async function(){
      const input=document.getElementById('bgFile');
      const file=input&&input.files&&input.files[0];
      if(!file) return original.apply(this,arguments);

      try{
        const optimized=await optimizeImageFile(file,BG_MAX_DIMENSION,BG_JPEG_QUALITY,BG_MIN_BYTES);
        if(optimized!==file){
          const dataUrl=await readAsDataURL(optimized);
          localStorage.setItem('restaurantMenuBackground',String(dataUrl));
          if(typeof window.applyBackground==='function') window.applyBackground();
          if(typeof window.drawAppearance==='function') window.drawAppearance();
          console.info('[FA] Background optimized',file.size,'->',optimized.size);
          return;
        }
      }catch(e){
        console.warn('[FA] Background optimization skipped',e);
      }
      return original.apply(this,arguments);
    };
    return true;
  }

  function install(){
    installLoadingHints();
    const markupReady=installPhotoMarkup();
    const editorReady=installPhotoEditor();
    const dishReady=installDishOptimizer();
    const bgReady=installBackgroundOptimizer();
    if(markupReady&&editorReady){
      try{if(typeof drawMenu==='function') drawMenu(typeof currentFilter==='undefined'?'all':currentFilter);}catch(e){}
    }
    if(!markupReady||!editorReady||!dishReady||!bgReady) setTimeout(install,200);
  }

  install();
})();
