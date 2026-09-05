/* FA_CLOUD_SYNC_V8 */
(function(){
  'use strict';

  const API='https://jrpialhwbliicbsmzmvb.supabase.co/functions/v1/menu-sync';
  const DIRTY_KEY='restaurantCloudSyncV8Dirty';
  const DEVICE_KEY='restaurantCloudSyncV8Device';
  const POLL_MS=3000;
  const SAVE_DEBOUNCE_MS=350;

  let ready=false;
  let applying=false;
  let dirty=false;
  let lastLocal='';
  let lastRemote='';
  let lastRemoteTime=0;
  let saveTimer=0;
  let pollTimer=0;
  let channel=null;

  function getState(){
    return {
      cats:Array.isArray(cats)?cats.map(String):[],
      dishes:Array.isArray(dishes)?JSON.parse(JSON.stringify(dishes)):[]
    };
  }

  function fingerprint(state){
    try{return JSON.stringify(state)}catch(e){return ''}
  }

  function saveLocal(state){
    try{
      localStorage.setItem('restaurantCategories',JSON.stringify(state.cats));
      localStorage.setItem('restaurantMenu',JSON.stringify(state.dishes));
    }catch(e){console.warn('FA sync local save failed',e)}
  }

  function markDirty(value){
    dirty=!!value;
    try{localStorage.setItem(DIRTY_KEY,dirty?'1':'0')}catch(e){}
  }

  function adminCanWrite(){
    try{
      return typeof adminUnlocked!=='undefined' && adminUnlocked===true &&
             typeof ADMIN_PASSWORD!=='undefined' && String(ADMIN_PASSWORD);
    }catch(e){return false}
  }

  function writePassword(){
    try{return adminCanWrite()?String(ADMIN_PASSWORD):''}catch(e){return ''}
  }

  function redraw(){
    try{renderNav()}catch(e){}
    try{fillCats()}catch(e){}
    try{drawMenu('all')}catch(e){}
    try{drawAdmin()}catch(e){}
    try{updateCartBadge()}catch(e){}
    try{applyTheme()}catch(e){}
    try{applyDishTransparency()}catch(e){}
    try{applyNavTransparency()}catch(e){}
    try{applyCategoryTransparency()}catch(e){}
    try{applyBackground()}catch(e){}
  }

  async function request(method,url,body){
    const headers={'Content-Type':'application/json','Cache-Control':'no-cache','x-sync-client':'FA_V8'};
    if(method==='POST'){
      const password=writePassword();
      if(!password)return {ok:false,status:401,text:'admin_required'};
      headers['x-admin-password']=password;
    }
    try{
      const r=await fetch(url,{method,headers,body:body?JSON.stringify(body):undefined,cache:'no-store'});
      const text=await r.text();
      let json=null;
      try{json=text?JSON.parse(text):null}catch(e){}
      return {ok:r.ok,status:r.status,text,json};
    }catch(error){
      return {ok:false,status:0,text:String(error),json:null};
    }
  }

  async function readRemote(){
    const r=await request('GET',API+'?t='+Date.now());
    if(!r.ok){console.warn('FA sync GET failed',r.status,r.text);return null;}
    const rows=Array.isArray(r.json)?r.json:[];
    const row=rows[0];
    if(!row || !row.data || !Array.isArray(row.data.cats) || !Array.isArray(row.data.dishes)) return null;
    return {
      state:{cats:row.data.cats,dishes:row.data.dishes},
      fingerprint:fingerprint({cats:row.data.cats,dishes:row.data.dishes}),
      updatedAt:Date.parse(row.updated_at||'')||0
    };
  }

  async function upload(reason){
    if(!ready || applying || !adminCanWrite()) return false;
    const state=getState();
    const localFp=fingerprint(state);
    const r=await request('POST',API,{id:'main',data:state});
    if(!r.ok){
      markDirty(true);
      console.warn('FA sync POST failed',r.status,r.text);
      return false;
    }
    const row=Array.isArray(r.json)?r.json[0]:null;
    lastLocal=localFp;
    lastRemote=localFp;
    lastRemoteTime=Date.parse(row?.updated_at||'')||Date.now();
    markDirty(false);
    saveLocal(state);
    broadcast({type:'uploaded',fingerprint:localFp,updatedAt:lastRemoteTime});
    console.log('FA sync: uploaded',reason||'change');
    return true;
  }

  async function applyRemote(remote){
    if(!remote)return false;
    if(remote.fingerprint===lastLocal){
      lastRemote=remote.fingerprint;
      lastRemoteTime=Math.max(lastRemoteTime,remote.updatedAt);
      return true;
    }
    if(dirty || applying)return false;
    if(remote.updatedAt && remote.updatedAt<=lastRemoteTime)return true;

    applying=true;
    try{
      cats=remote.state.cats;
      dishes=remote.state.dishes;
      saveLocal(remote.state);
      lastLocal=remote.fingerprint;
      lastRemote=remote.fingerprint;
      lastRemoteTime=remote.updatedAt||Date.now();
      redraw();
      broadcast({type:'applied',fingerprint:remote.fingerprint,updatedAt:lastRemoteTime});
      console.log('FA sync: downloaded cloud state');
      return true;
    }finally{applying=false;}
  }

  async function initial(){
    const local=getState();
    lastLocal=fingerprint(local);
    markDirty(false);

    const remote=await readRemote();
    if(!remote){
      ready=true;
      lastRemote=lastLocal;
      if(adminCanWrite()){
        markDirty(true);
        await upload('initial-seed');
      }
      return;
    }

    lastRemote=remote.fingerprint;
    lastRemoteTime=remote.updatedAt;

    // Cloud is the source of truth on first load. This deliberately removes the
    // old "which device has more dishes" guessing logic that caused overwrites.
    if(remote.fingerprint!==lastLocal){
      applying=true;
      try{
        cats=remote.state.cats;
        dishes=remote.state.dishes;
        saveLocal(remote.state);
        lastLocal=remote.fingerprint;
        redraw();
      }finally{applying=false;}
    }

    ready=true;
    markDirty(false);
    console.log('FA sync V8 ready',remote.updatedAt?new Date(remote.updatedAt).toISOString():'no timestamp');
  }

  function scheduleUpload(){
    if(!ready || applying)return;
    if(!adminCanWrite())return;
    const now=fingerprint(getState());
    if(now===lastLocal)return;
    markDirty(true);
    clearTimeout(saveTimer);
    saveTimer=setTimeout(()=>upload('local-change'),SAVE_DEBOUNCE_MS);
  }

  async function poll(){
    if(!ready || applying || dirty)return;
    const remote=await readRemote();
    if(!remote)return;
    if(remote.fingerprint===lastLocal){
      lastRemote=remote.fingerprint;
      lastRemoteTime=Math.max(lastRemoteTime,remote.updatedAt);
      return;
    }
    await applyRemote(remote);
  }

  function broadcast(message){
    try{channel?.postMessage(message)}catch(e){}
  }

  function installChannel(){
    try{
      if('BroadcastChannel' in window){
        channel=new BroadcastChannel(DEVICE_KEY);
        channel.onmessage=async()=>{if(ready&&!dirty)await poll();};
      }
    }catch(e){}

    window.addEventListener('storage',e=>{
      if(e.key==='restaurantMenu'||e.key==='restaurantCategories'){
        if(ready&&!dirty)scheduleUpload();
      }
    });
  }

  function install(){
    let valid=false;
    try{valid=Array.isArray(cats)&&Array.isArray(dishes)&&typeof persist==='function'}catch(e){}
    if(!valid){setTimeout(install,250);return;}

    installChannel();

    initial().catch(e=>{
      console.warn('FA sync initial error',e);
      ready=true;
      lastLocal=fingerprint(getState());
    });

    setInterval(()=>{
      if(!ready || applying)return;
      const current=fingerprint(getState());
      if(current!==lastLocal) scheduleUpload();
    },500);

    pollTimer=setInterval(poll,POLL_MS);

    document.addEventListener('visibilitychange',()=>{
      if(!document.hidden)poll();
    });

    window.addEventListener('focus',()=>poll());

    window.restaurantMenuCloudSync={
      upload:()=>upload('manual'),
      download:async()=>applyRemote(await readRemote()),
      forceUpload:()=>upload('manual-force'),
      forceDownload:async()=>applyRemote(await readRemote())
    };

    console.log('FA sync V8 installed');
  }

  setTimeout(install,800);
})();
