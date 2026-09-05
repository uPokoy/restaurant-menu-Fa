/* FA_CLOUD_SYNC_V3 */
(function(){
  const API='https://jrpialhwbliicbsmzmvb.supabase.co/functions/v1/menu-sync';
  let applying=false, ready=false, lastFp='', timer=0, originalPersist=null;

  function fp(){
    try{return JSON.stringify({cats:Array.isArray(window.cats)?window.cats:[],dishes:Array.isArray(window.dishes)?window.dishes:[]})}catch(e){return ''}
  }
  function saveLocal(){
    try{
      localStorage.setItem('restaurantCategories',JSON.stringify(window.cats||[]));
      localStorage.setItem('restaurantMenu',JSON.stringify(window.dishes||[]));
    }catch(e){}
  }
  function redraw(){
    try{window.renderNav&&window.renderNav()}catch(e){}
    try{window.fillCats&&window.fillCats()}catch(e){}
    try{window.drawMenu&&window.drawMenu('all')}catch(e){}
    try{window.drawAdmin&&window.drawAdmin()}catch(e){}
    try{window.updateCartBadge&&window.updateCartBadge()}catch(e){}
    try{window.applyTheme&&window.applyTheme()}catch(e){}
    try{window.applyDishTransparency&&window.applyDishTransparency()}catch(e){}
    try{window.applyNavTransparency&&window.applyNavTransparency()}catch(e){}
    try{window.applyCategoryTransparency&&window.applyCategoryTransparency()}catch(e){}
    try{window.applyBackground&&window.applyBackground()}catch(e){}
  }
  async function upload(force){
    if(applying||!Array.isArray(window.cats)||!Array.isArray(window.dishes))return false;
    const data={cats:window.cats,dishes:window.dishes};
    const current=JSON.stringify(data);
    if(!force&&current===lastFp)return true;
    try{
      const r=await fetch(API,{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:'main',data,updated_at:new Date().toISOString()})});
      if(!r.ok){console.warn('FA sync upload HTTP',r.status);return false}
      lastFp=current;
      console.log('FA sync upload OK');
      return true;
    }catch(e){console.warn('FA sync upload error',e);return false}
  }
  async function download(){
    try{
      const r=await fetch(API+'?t='+Date.now(),{cache:'no-store'});
      if(!r.ok){console.warn('FA sync download HTTP',r.status);return false}
      const rows=await r.json();
      const row=Array.isArray(rows)?rows[0]:null;
      if(!row||!row.data||!Array.isArray(row.data.cats)||!Array.isArray(row.data.dishes))return false;
      const remote=JSON.stringify({cats:row.data.cats,dishes:row.data.dishes});
      if(ready&&remote===fp())return true;
      applying=true;
      window.cats=row.data.cats;
      window.dishes=row.data.dishes;
      saveLocal();
      lastFp=remote;
      redraw();
      console.log('FA sync download OK',row.updated_at||'');
      return true;
    }catch(e){console.warn('FA sync download error',e);return false}
    finally{applying=false}
  }
  function watch(){
    if(applying||!Array.isArray(window.cats)||!Array.isArray(window.dishes))return;
    const current=fp();
    if(!ready){lastFp=current;return}
    if(current!==lastFp){
      clearTimeout(timer);
      timer=setTimeout(()=>upload(false),150);
    }
  }
  function install(){
    if(typeof window.persist==='function'&&!window.persist.__faSyncV3){
      originalPersist=window.persist;
      function wrappedPersist(){
        const result=originalPersist.apply(this,arguments);
        if(!applying){clearTimeout(timer);timer=setTimeout(()=>upload(false),50)}
        return result;
      }
      wrappedPersist.__faSyncV3=true;
      window.persist=wrappedPersist;
    }
    download().then(()=>{ready=true;lastFp=fp()});
    setInterval(watch,500);
    setInterval(download,3000);
    window.addEventListener('pagehide',()=>{if(!applying)upload(true)});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)download()});
    window.restaurantMenuCloudSync={upload,download,forceUpload:()=>upload(true),forceDownload:download};
  }
  setTimeout(install,0);
})();