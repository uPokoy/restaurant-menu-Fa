/* FA_CLOUD_SYNC_V10 */
(function(){
  'use strict';

  const API='https://jrpialhwbliicbsmzmvb.supabase.co/functions/v1/menu-sync';
  const DIRTY_KEY='restaurantCloudSyncV10Dirty';
  const DEVICE_KEY='restaurantCloudSyncV10Device';
  const POLL_MS=3000;
  const SAVE_DEBOUNCE_MS=700;

  let ready=false;
  let applying=false;
  let dirty=false;
  let lastState='';
  let lastCloud='';
  let lastCloudTime=0;
  let saveTimer=0;
  let channel=null;

  // IMPORTANT: cats/dishes are the application's actual global lexical bindings.
  // Do not use window.cats/window.dishes: top-level let/const variables are not
  // properties of window, which made the previous V9 implementation never become ready.
  function getState(){
    try{
      if(!Array.isArray(cats)||!Array.isArray(dishes)) return null;
      return {
        cats:cats.map(String),
        dishes:JSON.parse(JSON.stringify(dishes))
      };
    }catch(e){
      return null;
    }
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

  function setDirty(value){
    dirty=!!value;
    try{localStorage.setItem(DIRTY_KEY,dirty?'1':'0')}catch(e){}
  }

  function setStatus(text,type){
    try{
      let el=document.getElementById('cloudSyncStatus');
      if(!el){
        el=document.createElement('div');
        el.id='cloudSyncStatus';
        el.style.cssText='position:fixed;right:12px;bottom:12px;z-index:99999;padding:7px 11px;border-radius:999px;background:rgba(20,20,20,.82);color:#fff;font:600 12px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.18);pointer-events:none;opacity:.9';
        document.body.appendChild(el);
      }
      el.textContent=text;
      el.dataset.state=type||'';
    }catch(e){}
  }

  async function request(method,body){
    const headers={'Content-Type':'application/json','Cache-Control':'no-cache','x-sync-client':'FA_V10'};
    try{
      const r=await fetch(method==='GET'?API+'?t='+Date.now():API,{
        method,
        headers,
        body:method==='POST'?JSON.stringify(body):undefined,
        cache:'no-store'
      });
      const text=await r.text();
      let json=null;
      try{json=text?JSON.parse(text):null}catch(e){}
      return {ok:r.ok,status:r.status,text,json};
    }catch(error){
      return {ok:false,status:0,text:String(error),json:null};
    }
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

  function replaceState(remoteState){
    if(!Array.isArray(cats)||!Array.isArray(dishes)) return false;
    // Mutate in place so this works whether the app declared these as let, var,
    // or const. Every function holding a reference sees the new data immediately.
    cats.splice(0,cats.length,...remoteState.cats);
    dishes.splice(0,dishes.length,...remoteState.dishes);
    return true;
  }

  async function readRemote(){
    const r=await request('GET');
    if(!r.ok){
      setStatus('🔴 Ошибка синхронизации','error');
      console.warn('FA sync GET failed',r.status,r.text);
      return null;
    }
    const rows=Array.isArray(r.json)?r.json:[];
    const row=rows[0];
    if(!row||!row.data||!Array.isArray(row.data.cats)||!Array.isArray(row.data.dishes)){
      setStatus('🔴 Ошибка данных','error');
      console.warn('FA sync: invalid cloud response',r.text);
      return null;
    }
    const state={cats:row.data.cats,dishes:row.data.dishes};
    return {state,fingerprint:fingerprint(state),updatedAt:Date.parse(row.updated_at||'')||0};
  }

  async function upload(reason){
    if(!ready||applying)return false;
    const state=getState();
    const fp=fingerprint(state);
    if(!state||!fp)return false;
    setStatus('🟡 Сохранение в облако...','saving');
    const r=await request('POST',{id:'main',data:state,updated_at:new Date().toISOString()});
    if(!r.ok){
      setDirty(true);
      setStatus('🔴 Ошибка сохранения','error');
      console.warn('FA sync POST failed',r.status,r.text);
      return false;
    }
    const row=Array.isArray(r.json)?r.json[0]:null;
    lastState=fp;
    lastCloud=fp;
    lastCloudTime=Date.parse(row?.updated_at||'')||Date.now();
    setDirty(false);
    saveLocal(state);
    setStatus('🟢 Синхронизировано','ok');
    broadcast({type:'uploaded',fingerprint:fp,updatedAt:lastCloudTime});
    console.log('FA sync V10: uploaded',reason||'change');
    return true;
  }

  async function applyRemote(remote,force){
    if(!remote)return false;
    if(remote.fingerprint===lastState){
      lastCloud=remote.fingerprint;
      lastCloudTime=Math.max(lastCloudTime,remote.updatedAt);
      setStatus('🟢 Синхронизировано','ok');
      return true;
    }
    if(applying)return false;
    if(!force&&dirty)return false;
    if(!force&&remote.updatedAt&&remote.updatedAt<=lastCloudTime)return true;

    applying=true;
    try{
      setStatus('🟡 Загрузка из облака...','loading');
      if(!replaceState(remote.state))return false;
      saveLocal(remote.state);
      lastState=remote.fingerprint;
      lastCloud=remote.fingerprint;
      lastCloudTime=remote.updatedAt||Date.now();
      setDirty(false);
      redraw();
      setStatus('🟢 Синхронизировано','ok');
      broadcast({type:'applied',fingerprint:remote.fingerprint,updatedAt:lastCloudTime});
      console.log('FA sync V10: downloaded cloud state');
      return true;
    }finally{applying=false;}
  }

  async function initial(){
    setStatus('🟡 Подключение к облаку...','loading');
    const remote=await readRemote();
    if(remote){
      lastCloud=remote.fingerprint;
      lastCloudTime=remote.updatedAt;
      const local=getState();
      const localFp=fingerprint(local);
      // Cloud is authoritative on startup. Local storage never overwrites cloud here.
      if(remote.fingerprint!==localFp){
        applying=true;
        try{
          if(replaceState(remote.state)){
            saveLocal(remote.state);
            lastState=remote.fingerprint;
            redraw();
          }
        }finally{applying=false;}
      }else{
        lastState=localFp;
      }
      setDirty(false);
      setStatus('🟢 Синхронизировано','ok');
    }else{
      lastState=fingerprint(getState());
      console.warn('FA sync: cloud unavailable on startup, keeping local state');
    }
    ready=true;
    console.log('FA sync V10 ready');
  }

  function scheduleUpload(){
    if(!ready||applying)return;
    const state=getState();
    const fp=fingerprint(state);
    if(!state||!fp||fp===lastState)return;
    setDirty(true);
    setStatus('🟡 Есть изменения...','dirty');
    clearTimeout(saveTimer);
    saveTimer=setTimeout(()=>upload('local-change'),SAVE_DEBOUNCE_MS);
  }

  async function poll(){
    if(!ready||applying)return;
    const remote=await readRemote();
    if(!remote)return;
    if(remote.fingerprint===lastState){
      lastCloud=remote.fingerprint;
      lastCloudTime=Math.max(lastCloudTime,remote.updatedAt);
      if(!dirty)setStatus('🟢 Синхронизировано','ok');
      return;
    }
    // A local edit always wins until it has successfully uploaded.
    if(dirty){
      await upload('retry-local-change');
      return;
    }
    await applyRemote(remote,false);
  }

  function broadcast(message){
    try{if(channel)channel.postMessage(message)}catch(e){}
  }

  function installChannel(){
    try{
      if('BroadcastChannel' in window){
        channel=new BroadcastChannel(DEVICE_KEY);
        channel.onmessage=async()=>{if(ready&&!dirty)await poll();};
      }
    }catch(e){}
    window.addEventListener('storage',e=>{
      if((e.key==='restaurantMenu'||e.key==='restaurantCategories')&&!applying)scheduleUpload();
    });
  }

  function install(){
    let valid=false;
    try{valid=Array.isArray(cats)&&Array.isArray(dishes)}catch(e){}
    if(!valid){setTimeout(install,250);return;}

    installChannel();
    initial().catch(e=>{
      console.warn('FA sync V10 initial error',e);
      ready=true;
      lastState=fingerprint(getState());
      setStatus('🔴 Ошибка синхронизации','error');
    });

    // Detect changes made by the existing admin UI without touching its code.
    setInterval(()=>{
      if(!ready||applying)return;
      scheduleUpload();
    },500);

    setInterval(poll,POLL_MS);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)poll()});
    window.addEventListener('focus',()=>poll());

    window.restaurantMenuCloudSync={
      upload:()=>upload('manual'),
      download:async()=>applyRemote(await readRemote(),true),
      forceUpload:()=>upload('manual-force'),
      forceDownload:async()=>applyRemote(await readRemote(),true),
      status:()=>({ready,dirty,lastCloudTime,lastState})
    };

    console.log('FA sync V10 installed');
  }

  setTimeout(install,800);
})();
