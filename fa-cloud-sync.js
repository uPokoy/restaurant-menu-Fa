/* FA_CLOUD_SYNC_V7 */
(function(){
  const API='https://jrpialhwbliicbsmzmvb.supabase.co/functions/v1/menu-sync';
  const DIRTY_KEY='restaurantCloudSyncDirty';
  let ready=false, applying=false, dirty=localStorage.getItem(DIRTY_KEY)==='1', lastFp='', lastRemoteUpdated=0, timer=0, installTimer=0;

  // cats/dishes are declared with top-level let in index.html. Such variables are
  // global lexical bindings, not window properties, so V6 could never install.
  function getState(){
    try{
      return {
        cats: Array.isArray(cats) ? cats : [],
        dishes: Array.isArray(dishes) ? dishes : []
      };
    }catch(e){ return {cats:[],dishes:[]}; }
  }
  function fp(){try{return JSON.stringify(getState())}catch(e){return ''}}
  function saveLocal(){try{const s=getState();localStorage.setItem('restaurantCategories',JSON.stringify(s.cats));localStorage.setItem('restaurantMenu',JSON.stringify(s.dishes))}catch(e){}}
  function setDirty(v){dirty=!!v;try{localStorage.setItem(DIRTY_KEY,v?'1':'0')}catch(e){}}
  function redraw(){try{window.renderNav&&window.renderNav()}catch(e){}try{window.fillCats&&window.fillCats()}catch(e){}try{window.drawMenu&&window.drawMenu('all')}catch(e){}try{window.drawAdmin&&window.drawAdmin()}catch(e){}try{window.updateCartBadge&&window.updateCartBadge()}catch(e){}try{window.applyTheme&&window.applyTheme()}catch(e){}try{window.applyDishTransparency&&window.applyDishTransparency()}catch(e){}try{window.applyNavTransparency&&window.applyNavTransparency()}catch(e){}try{window.applyCategoryTransparency&&window.applyCategoryTransparency()}catch(e){}try{window.applyBackground&&window.applyBackground()}catch(e){}}

  async function upload(force){
    if(applying)return false;
    const data=getState(), current=JSON.stringify(data);
    if(!force&&!dirty&&current===lastFp)return true;
    try{
      const r=await fetch(API,{method:'POST',cache:'no-store',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify({id:'main',data,updated_at:new Date().toISOString()})});
      const text=await r.text();
      if(!r.ok){console.warn('FA sync upload HTTP',r.status,text);setDirty(true);return false}
      lastFp=current;setDirty(false);saveLocal();console.log('FA sync upload OK',text.slice(0,120));return true;
    }catch(e){console.warn('FA sync upload error',e);setDirty(true);return false}
  }

  async function download(){
    try{
      const r=await fetch(API+'?t='+Date.now(),{cache:'no-store'});
      if(!r.ok){console.warn('FA sync download HTTP',r.status);return false}
      const rows=await r.json(),row=Array.isArray(rows)?rows[0]:null;
      if(!row||!row.data||!Array.isArray(row.data.cats)||!Array.isArray(row.data.dishes))return null;
      const remote={cats:row.data.cats,dishes:row.data.dishes},remoteFp=JSON.stringify(remote),remoteTime=Date.parse(row.updated_at||'')||0;
      if(remoteFp===fp()){lastFp=remoteFp;lastRemoteUpdated=Math.max(lastRemoteUpdated,remoteTime);return true}
      if(!ready||dirty)return false;
      if(remoteTime<=lastRemoteUpdated)return true;
      applying=true;
      cats=remote.cats;
      dishes=remote.dishes;
      saveLocal();lastFp=remoteFp;lastRemoteUpdated=remoteTime;redraw();
      console.log('FA sync download OK',row.updated_at||'');return true;
    }catch(e){console.warn('FA sync download error',e);return false}
    finally{applying=false}
  }

  async function initialSync(){
    const local=getState(),localFp=JSON.stringify(local);
    const r=await fetch(API+'?t='+Date.now(),{cache:'no-store'}).catch(()=>null);
    if(!r||!r.ok){ready=true;lastFp=localFp;return}
    const rows=await r.json().catch(()=>[]),row=Array.isArray(rows)?rows[0]:null;
    if(!row||!row.data||!Array.isArray(row.data.cats)||!Array.isArray(row.data.dishes)){
      ready=true;lastFp=localFp;setDirty(true);upload(true);return;
    }
    const remote={cats:row.data.cats,dishes:row.data.dishes},remoteFp=JSON.stringify(remote);
    lastRemoteUpdated=Date.parse(row.updated_at||'')||0;
    if(dirty){ready=true;lastFp=localFp;upload(true);return}
    if(localFp!==remoteFp&&local.dishes.length>remote.dishes.length){
      console.log('FA sync: local has more dishes, uploading local state');
      ready=true;lastFp=localFp;setDirty(true);upload(true);return;
    }
    if(localFp!==remoteFp){
      applying=true;cats=remote.cats;dishes=remote.dishes;saveLocal();lastFp=remoteFp;redraw();applying=false;
      console.log('FA sync: cloud state applied');
    }else lastFp=remoteFp;
    ready=true;setDirty(false);
  }

  function watch(){
    if(applying||!ready)return;
    const current=fp();
    if(current!==lastFp){setDirty(true);clearTimeout(timer);timer=setTimeout(()=>upload(false),120)}
  }

  function install(){
    let ok=false;
    try{ok=Array.isArray(cats)&&Array.isArray(dishes)&&typeof persist==='function'}catch(e){ok=false}
    if(!ok){clearTimeout(installTimer);installTimer=setTimeout(install,250);return}
    initialSync().catch(e=>{console.warn('FA initial sync error',e);ready=true;lastFp=fp();setDirty(true)});
    setInterval(watch,300);
    setInterval(()=>{if(ready&&!dirty)download()},5000);
    window.addEventListener('pagehide',()=>{if(!applying&&dirty)upload(true)});
    window.addEventListener('beforeunload',()=>{if(!applying&&dirty)upload(true)});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!dirty)download()});
    window.restaurantMenuCloudSync={upload,download,forceUpload:()=>upload(true),forceDownload:download};
    console.log('FA sync V7 installed');
  }
  setTimeout(install,1200);
})();