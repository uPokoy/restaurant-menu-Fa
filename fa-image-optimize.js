/* FA_IMAGE_OPTIMIZE_V2 */
(function(){
  'use strict';

  const DISH_MAX_DIMENSION=1280;
  const DISH_JPEG_QUALITY=0.82;
  const DISH_MIN_BYTES=550000;

  const BG_MAX_DIMENSION=1920;
  const BG_JPEG_QUALITY=0.82;
  const BG_MIN_BYTES=700000;

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

  function installDishOptimizer(){
    if(typeof window.saveDish!=='function') return false;
    if(window.__FA_DISH_IMAGE_OPTIMIZER_INSTALLED) return true;
    window.__FA_DISH_IMAGE_OPTIMIZER_INSTALLED=true;

    const original=window.saveDish;
    window.saveDish=async function(){
      const input=document.getElementById('fPhoto');
      const file=input&&input.files&&input.files[0];
      if(!file) return original.apply(this,arguments);

      try{
        const optimized=await optimizeImageFile(file,DISH_MAX_DIMENSION,DISH_JPEG_QUALITY,DISH_MIN_BYTES);
        if(optimized!==file && typeof DataTransfer!=='undefined'){
          const dt=new DataTransfer();
          dt.items.add(optimized);
          input.files=dt.files;
          console.info('[FA] Dish photo optimized',file.size,'->',optimized.size);
        }
      }catch(e){
        console.warn('[FA] Dish photo optimization skipped',e);
      }
      return original.apply(this,arguments);
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
    const dishReady=installDishOptimizer();
    const bgReady=installBackgroundOptimizer();
    if(!dishReady||!bgReady) setTimeout(install,200);
  }

  install();
})();
