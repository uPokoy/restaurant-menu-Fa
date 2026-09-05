/* FA_CLOUD_SYNC_V2 */
(function(){
  const API='https://jrpialhwbliicbsmzmvb.supabase.co/functions/v1/menu-sync';
  const TS='restaurantMenuCloudUpdatedAtFA';
  const FP='restaurantMenuCloudFingerprintFA';
  let applying=false;
  let ready=false;
  let lastLocal='';
  let uploadTimer=0;

  const readTs=()=>Number(localStorage.getItem(TS)||0);
  const setTs=t=>{try{localStorage.setItem(TS,String(t))}catch(e){}};
  const fingerprint=()=>{
    try{return JSON.stringify({cats:window.cats||[],dishes:window.dishes||[]})}
    catch(e){return ''}
  };
  const setFp=s=>{try{localStorage.setItem(FP,s)}catch(e){}};

  function redraw(){
    try{if(typeof window.renderNav==='function')window.renderNav()}catch(e){}
    try{if(typeof window.fillCats==='function')window.fillCats()}catch(e){}
    try{if(typeof window.drawMenu==='function')window.drawMenu('all')}catch(e){}
    try{if(typeof window.drawAdmin==='function')window.drawAdmin()}catch(e){}
    try{if(typeof window.updateCartBadge==='function')window.updateCartBadge()}catch(e){}
    try{if(typeof window.applyTheme==='function')window.applyTheme()}catch(e){}
    try{if(typeof window.applyDishTransparency==='function')window.applyDishTransparency()}catch(e){}
    try{if(typeof window.applyNavTransparency==='function')window.applyNavTransparency()}catch(e){}
    try{if(typeof window.applyCategoryTransparency==='function')window.applyCategoryTransparency()}catch(e){}
    try{if(typeof window.applyBackground==='function')window.applyBackground()}catch(e){}
  }

  async function upload(force){
    if(applying||!Array.isArray(window.cats)||!Array.isArray(window.dishes))return false;
    const fp=fingerprint();
    if(!force&&fp===lastLocal)return false;
    const t=new Date().toISOString();
    try{
      const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:'main',data:{cats:window.cats,dishes:window.dishes},updated_at:t})});
      if(!r.ok){console.warn('FA cloud upload HTTP',r.status);return false}
      lastLocal=fp;
      setFp(fp);
      setTs(Date.parse(t));
      console.log('FA cloud sync: uploaded');
      return true;
    }catch(e){console.warn('FA cloud upload',e);return false}
  }

  async function download(){
    try{
      const r=await fetch(API,{cache:'no-store'});
      if(!r.ok){console.warn('FA cloud download HTTP',r.status);return false}
      const rows=await r.json();
      const row=Array.isArray(rows)?rows[0]:null;
      if(!row||!row.data||!Array.isArray(row.data.dishes)||!Array.isArray(row.data.cats))return false;
      const remoteFp=JSON.stringify({cats:row.data.cats,dishes:row.data.dishes});
      const localFp=fingerprint();
      if(ready&&remoteFp===localFp)return true;

      applying=true;
      window.cats=row.data.cats;
      window.dishes=row.data.dishes;
      localStorage.setItem('restaurantMenu',JSON.stringify(window.dishes));
      if(localStorage.getItem('restaurantCategories')!==null)localStorage.setItem('restaurantCategories',JSON.stringify(window.cats));
      localStorage.setItem('restaurantMenuCats',JSON.stringify(window.cats));
      setTs(Date.parse(row.updated_at||'')||Date.now());
      setFp(remoteFp);
      lastLocal=remoteFp;
      redraw();
      ready=true;
      console.log('FA cloud sync: downloaded');
      return true;
    }catch(e){console.warn('FA cloud download',e);return false}
    finally{applying=false}
  }

  function detectLocalChanges(){
    if(applying||!Array.isArray(window.cats)||!Array.isArray(window.dishes))return;
    const fp=fingerprint();
    if(!ready){lastLocal=fp;return}
    if(fp!==lastLocal){
      clearTimeout(uploadTimer);
      uploadTimer=setTimeout(()=>upload(false),300);
    }
  }

  function install(){
    download().then(()=>{
      ready=true;
      lastLocal=fingerprint();
      setFp(lastLocal);
    });
    setInterval(detectLocalChanges,1000);
    setInterval(download,5000);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)download()});
  }

  setTimeout(install,1000);
  window.restaurantMenuCloudSync={upload,download};
})();
