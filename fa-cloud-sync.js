/* FA_CLOUD_SYNC_V9 */
(function(){
  'use strict';

  const API='https://jrpialhwbliicbsmzmvb.supabase.co/functions/v1/menu-sync';
  const DIRTY_KEY='restaurantCloudSyncV9Dirty';
  const DEVICE_KEY='restaurantCloudSyncV9Device';
  const POLL_MS=3000;
  const SAVE_DEBOUNCE_MS=500;

  let ready=false;
  let applying=false;
  let dirty=false;
  let lastState='';
  let lastCloud='';
  let lastCloudTime=0;
  let saveTimer=0;
  let channel=null;

  function getState(){
    return {
      cats:Array.isArray(window.cats)?window.cats.map(String):[],
      dishes:Array.isArray(window.dishes)?JSON.parse(JSON.stringify(window.dishes)):[]
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

  function setDirty(value){
    dirty=!!value;
    try{localStorage.setItem(DIRTY_KEY,dirty?'1':'0')}catch(e){}
  }

  async function request(method,body){
    const headers={'Content-Type':'application/json','Cache-Control':'no-cache','x-sync-client':'FA_V9'};
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

  async function readRemote(){
    const r=await request('GET');
    if(!r.ok){console.warn('FA sync GET failed',r.status,r.text);return null;}
    const rows=Array.isArray(r.json)?r.json:[];
    const row=rows[0];
    if(!row||!row.data||!Array.isArray(row.data.cats)||!Array.isArray(row.data.dishes)){
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
    if(!fp)return false;
    const r=await request('POST',{id:'main',data:state,updated_at:new Date().toISOString()});
    if(!r.ok){
      setDirty(true);
      console.warn('FA sync POST failed',r.status,r.text);
      return false;
    }
    const row=Array.isArray(r.json)?r.json[0]:null;
    lastState=fp;
    lastCloud=fp;
    lastCloudTime=Date.parse(row?.updated_at||'')||Date.now();
    setDirty(false);
    saveLocal(state);
    broadcast({type:'uploaded',fingerprint:fp,updatedAt:lastCloudTime});
    console.log('FA sync V9: uploaded',reason||'change');
    return true;
  }

  async function applyRemote(remote,force){
    if(!remote)return false;
    if(remote.fingerprint===lastState){
      lastCloud=remote.fingerprint;
      lastCloudTime=Math.max(lastCloudTime,remote.updatedAt);
      return true;
    }
    if(applying)return false;
    if(!force&&dirty)return false;
    if(!force&&remote.updatedAt&&remote.updatedAt<=lastCloudTime)return true;

    applying=true;
    try{
      window.cats=remote.state.cats;
      window.dishes=remote.state.dishes;
      saveLocal(remote.state);
      lastState=remote.fingerprint;
      lastCloud=remote.fingerprint;
      lastCloudTime=remote.updatedAt||Date.now();
      setDirty(false);
      redraw();
      broadcast({type:'applied',fingerprint:remote.fingerprint,updatedAt:lastCloudTime});
      console.log('FA sync V9: downloaded cloud state');
      return true;
    }finally{applying=false;}
  }

  async function initial(){
    const remote=await readRemote();
    if(remote){
      lastCloud=remote.fingerprint;
      lastCloudTime=remote.updatedAt;
      const local=getState();
      const localFp=fingerprint(local);
      // Cloud is authoritative on startup. Never replace cloud with local storage here.
      if(remote.fingerprint!==localFp){
        applying=true;
        try{
          window.cats=remote.state.cats;
          window.dishes=remote.state.dishes;
          saveLocal(remote.state);
          lastState=remote.fingerprint;
          redraw();
        }finally{applying=false;}
      }else{
        lastState=localFp;
      }
      setDirty(false);
    }else{
      // If the cloud is temporarily unavailable, keep the current local menu and retry later.
      lastState=fingerprint(getState());
      console.warn('FA sync: cloud unavailable on startup, keeping local state');
    }
    ready=true;
    console.log('FA sync V9 ready');
  }

  function scheduleUpload(){
    if(!ready||applying)return;
    const fp=fingerprint(getState());
    if(!fp||fp===lastState)return;
    setDirty(true);
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
      return;
    }
    // If this device has a newer local edit, finish its upload before accepting cloud state.
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
    try{valid=Array.isArray(window.cats)&&Array.isArray(window.dishes)&&typeof window.persist==='function'}catch(e){}
    if(!valid){setTimeout(install,250);return;}

    installChannel();
    initial().catch(e=>{console.warn('FA sync V9 initial error',e);ready=true;lastState=fingerprint(getState())});

    // Detect menu changes made by the admin UI without depending on adminUnlocked scope.
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
      forceDownload:async()=>applyRemote(await readRemote(),true)
    };

    console.log('FA sync V9 installed');
  }

  setTimeout(install,800);
})();
