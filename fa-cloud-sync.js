/* FA_CLOUD_SYNC_V5 */
(function(){
  const API='https://jrpialhwbliicbsmzmvb.supabase.co/functions/v1/menu-sync';
  const DIRTY_KEY='restaurantCloudSyncDirty';
  let ready=false, applying=false, dirty=localStorage.getItem(DIRTY_KEY)==='1', lastFp='', lastRemoteUpdated=0, timer=0, installTimer=0, pollTimer=0;

  function state(){return {cats:Array.isArray(window.cats)?window.cats:[],dishes:Array.isArray(window.dishes)?window.dishes:[]};}
  function fp(){try{return JSON.stringify(state())}catch(e){return ''}}
  function saveLocal(){try{const s=state();localStorage.setItem('restaurantCategories',JSON.stringify(s.cats));localStorage.setItem('restaurantMenu',JSON.stringify(s.dishes))}catch(e){}}
  function setDirty(v){dirty=!!v;try{localStorage.setItem(DIRTY_KEY,v?'1':'0')}catch(e){}}
  function redraw(){try{window.renderNav&&window.renderNav()}catch(e){}try{window.fillCats&&window.fillCats()}catch(e){}try{window.drawMenu&&window.drawMenu('all')}catch(e){}try{window.drawAdmin&&window.drawAdmin()}catch(e){}try{window.updateCartBadge&&window.updateCartBadge()}catch(e){}try{window.applyTheme&&window.applyTheme()}catch(e){}try{window.applyDishTransparency&&window.applyDishTransparency()}catch(e){}try{window.applyNavTransparency&&window.applyNavTransparency()}catch(e){}try{window.applyCategoryTransparency&&window.applyCategoryTransparency()}catch(e){}try{window.applyBackground&&window.applyBackground()}catch(e){}}

  async function upload(force){
    if(applying||!Array.isArray(window.cats)||!Array.isArray(window.dishes))return false;
    const data=state(), current=JSON.stringify(data);
    if(!force&&!dirty&&current===lastFp)return true;
    try{
      const r=await fetch(API,{method:'POST',cache:'no-store',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify({id:'main',data,updated_at:new Date().toISOString()})});
      if(!r.ok){console.warn('FA sync upload HTTP',r.status);setDirty(true);return false}
      lastFp=current; setDirty(false); saveLocal(); console.log('FA sync upload OK'); return true;
    }catch(e){console.warn('FA sync upload error',e);setDirty(true);return false}
  }

  async function download(){
    try{
      const r=await fetch(API+'?t='+Date.now(),{cache:'no-store'});
      if(!r.ok){console.warn('FA sync download HTTP',r.status);return false}
      const rows=await r.json(), row=Array.isArray(rows)?rows[0]:null;
      if(!row||!row.data||!Array.isArray(row.data.cats)||!Array.isArray(row.data.dishes))return null;
      const remote={cats:row.data.cats,dishes:row.data.dishes};
      const remoteFp=JSON.stringify(remote);
      const remoteTime=Date.parse(row.updated_at||'')||0;
      lastRemoteUpdated=Math.max(lastRemoteUpdated,remoteTime);
      if(!ready||dirty)return remoteFp===fp();
      if(remoteFp===fp()){lastFp=remoteFp;return true}
      if(remoteTime<=lastRemoteUpdated)return true;
      applying=true; window.cats=remote.cats; window.dishes=remote.dishes; saveLocal(); lastFp=remoteFp; redraw(); console.log('FA sync download OK',row.updated_at||''); return true;
    }catch(e){console.warn('FA sync download error',e);return false}
    finally{applying=false}
  }

  async function initialSync(){
    const local=state(), localFp=JSON.stringify(local);
    const r=await fetch(API+'?t='+Date.now(),{cache:'no-store'}).catch(()=>null);
    if(!r||!r.ok){ready=true;lastFp=localFp;return}
    const rows=await r.json().catch(()=>[]), row=Array.isArray(rows)?rows[0]:null;
    if(!row||!row.data||!Array.isArray(row.data.cats)||!Array.isArray(row.data.dishes)){
      ready=true;lastFp=localFp;setDirty(true);upload(true);return;
    }
    const remote={cats:row.data.cats,dishes:row.data.dishes}, remoteFp=JSON.stringify(remote);
    lastRemoteUpdated=Date.parse(row.updated_at||'')||0;
    if(dirty){ready=true;lastFp=localFp;upload(true);return}
    if(localFp!==remoteFp && local.dishes.length>remote.dishes.length){
      console.log('FA sync: local has more dishes, uploading local state');
      ready=true;lastFp=localFp;setDirty(true);upload(true);return;
    }
    if(localFp!==remoteFp){applying=true;window.cats=remote.cats;window.dishes=remote.dishes;saveLocal();lastFp=remoteFp;redraw();applying=false;console.log('FA sync: cloud state applied');}
    else lastFp=remoteFp;
    ready=true;setDirty(false);
  }

  function watch(){
    if(applying||!Array.isArray(window.cats)||!Array.isArray(window.dishes)||!ready)return;
    const current=fp();
    if(current!==lastFp){setDirty(true);clearTimeout(timer);timer=setTimeout(()=>upload(false),120)}
  }

  function install(){
    if(!Array.isArray(window.cats)||!Array.isArray(window.dishes)||typeof window.persist!=='function'){
      clearTimeout(installTimer);installTimer=setTimeout(install,250);return;
    }
    if(!window.persist.__faSyncV5){
      const originalPersist=window.persist;
      function wrappedPersist(){
        const result=originalPersist.apply(this,arguments);
        if(!applying){saveLocal();setDirty(true);clearTimeout(timer);timer=setTimeout(()=>upload(false),60)}
        return result;
      }
      wrappedPersist.__faSyncV5=true;
      window.persist=wrappedPersist;
    }
    initialSync().catch(e=>{console.warn('FA initial sync error',e);ready=true;lastFp=fp()});
    setInterval(watch,500);
    pollTimer=setInterval(()=>{if(ready&&!dirty)download()},5000);
    window.addEventListener('pagehide',()=>{if(!applying&&dirty)upload(true)});
    window.addEventListener('beforeunload',()=>{if(!applying&&dirty)upload(true)});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!dirty)download()});
    window.restaurantMenuCloudSync={upload,download,forceUpload:()=>upload(true),forceDownload:download};
  }
  setTimeout(install,1200);
})();