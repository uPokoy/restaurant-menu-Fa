/* FA_CLOUD_SYNC_V1 */
(function(){
  const API='https://jrpialhwbliicbsmzmvb.supabase.co/functions/v1/menu-sync';
  const TS='restaurantMenuCloudUpdatedAtFA';
  let applying=false;
  const setTs=t=>{try{localStorage.setItem(TS,String(t))}catch(e){}};
  const getTs=()=>Number(localStorage.getItem(TS)||0);
  async function upload(){
    if(applying||!Array.isArray(window.cats)||!Array.isArray(window.dishes))return;
    const t=new Date().toISOString();
    try{
      const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:'main',data:{cats:window.cats,dishes:window.dishes},updated_at:t})});
      if(r.ok)setTs(Date.parse(t));
    }catch(e){console.warn('cloud upload',e)}
  }
  async function download(){
    try{
      const r=await fetch(API,{cache:'no-store'});
      if(!r.ok)return;
      const rows=await r.json();
      const row=Array.isArray(rows)?rows[0]:null;
      if(!row||!row.data)return;
      const remoteTs=Date.parse(row.updated_at||'')||0;
      if(remoteTs<=getTs())return;
      applying=true;
      window.cats=Array.isArray(row.data.cats)?row.data.cats:[];
      window.dishes=Array.isArray(row.data.dishes)?row.data.dishes:[];
      localStorage.setItem('restaurantMenu',JSON.stringify(window.dishes));
      localStorage.setItem('restaurantMenuCats',JSON.stringify(window.cats));
      setTs(remoteTs);
      if(typeof window.renderNav==='function')window.renderNav();
      if(typeof window.fillCats==='function')window.fillCats();
      if(typeof window.drawMenu==='function')window.drawMenu('all');
      if(typeof window.drawAdmin==='function')window.drawAdmin();
      if(typeof window.updateCartBadge==='function')window.updateCartBadge();
      if(typeof window.applyTheme==='function')window.applyTheme();
      if(typeof window.applyDishTransparency==='function')window.applyDishTransparency();
      if(typeof window.applyNavTransparency==='function')window.applyNavTransparency();
      if(typeof window.applyCategoryTransparency==='function')window.applyCategoryTransparency();
      if(typeof window.applyBackground==='function')window.applyBackground();
    }catch(e){console.warn('cloud download',e)}
    finally{applying=false}
  }
  function install(){
    const p=window.persist;
    if(typeof p==='function'&&!p.__faCloud){
      function wrapped(){
        const result=p.apply(this,arguments);
        if(!applying){setTs(Date.now());clearTimeout(wrapped.timer);wrapped.timer=setTimeout(upload,250)}
        return result;
      }
      wrapped.__faCloud=true;
      window.persist=wrapped;
    }
    download();
  }
  setTimeout(install,0);
  setInterval(download,5000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)download()});
  window.restaurantMenuCloudSync={upload,download};
})();
