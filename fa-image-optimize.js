/* FA_IMAGE_OPTIMIZE_V1 */
(function(){
  'use strict';

  const MAX_DIMENSION=1280;
  const JPEG_QUALITY=0.82;
  const MIN_BYTES=550000;

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

  async function optimizeImageFile(file){
    if(!file || !String(file.type||'').startsWith('image/')) return file;
    if(file.size<=MIN_BYTES) return file;

    const img=await imageFromFile(file);
    const w=img.naturalWidth||img.width;
    const h=img.naturalHeight||img.height;
    if(!w||!h) return file;

    const scale=Math.min(1,MAX_DIMENSION/Math.max(w,h));
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

    const blob=await canvasToBlob(canvas,'image/jpeg',JPEG_QUALITY);
    if(blob.size>=file.size) return file;
    const base=(file.name||'dish-photo').replace(/\.[^.]+$/,'');
    return new File([blob],base+'.jpg',{type:'image/jpeg',lastModified:Date.now()});
  }

  function install(){
    if(typeof window.saveDish!=='function' || !window.fPhoto){
      setTimeout(install,200);
      return;
    }
    if(window.__FA_IMAGE_OPTIMIZE_INSTALLED) return;
    window.__FA_IMAGE_OPTIMIZE_INSTALLED=true;

    const original=window.saveDish;
    window.saveDish=async function(){
      const input=window.fPhoto;
      const file=input && input.files && input.files[0];
      if(!file) return original.apply(this,arguments);

      try{
        const optimized=await optimizeImageFile(file);
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
  }

  install();
})();
