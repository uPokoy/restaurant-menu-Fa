/* FA_CLOUD_SYNC_V16_FIX_400 */
(function(){
  'use strict';

  const API='https://jrpialhwbliicbsmzmvb.supabase.co/rest/v1/menu_data';
  const KEY='sb_publishable_KXwgGRgVxKUmlLvTlFs3HQ_3Wz6kcAt';
  const POLL_MS=5000;
  const SAVE_DEBOUNCE_MS=700;
  const REQUEST_TIMEOUT_MS=10000;

  let ready=false, applying=false, uploading=false, dirty=false, saveTimer=0;
  let lastState='', lastCloud='', lastCloudTime=0;

  function getState(){
    try{
      if(!Array.isArray(cats)||!Array.isArray(dishes)) return null;
      return {cats:cats.map(String),dishes:JSON.parse(JSON.stringify(dishes))};
    }catch(e){return null;}
  }
  function fp(s){try{return JSON.stringify(s)}catch(e){return ''}}
  function saveLocal(s){try{localStorage.setItem('restaurantCategories',JSON.stringify(s.cats));localStorage.setItem('restaurantMenu',JSON.stringify(s.dishes));}catch(e){}}
  function status(t,type){
    try{
      let el=document.getElementById('cloudSyncStatus');
      if(!el){el=document.createElement('div');el.id='cloudSyncStatus';el.style.cssText='position:fixed;right:12px;bottom:12px;z-index:99999;padding:7px 11px;border-radius:999px;background:rgba(20,20,20,.82);color:#fff;font:600 12px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.18);pointer-events:none;opacity:.9';document.body.appendChild(el)}
      el.textContent=t;el.dataset.state=type||'';
    }catch(e){}
  }
  async function request(method,body){
    const c=new AbortController(); const timer=setTimeout(()=>c.abort(),REQUEST_TIMEOUT_MS);
    const opt={method,cache:'no-store',signal:c.signal,headers:{apikey:KEY,Authorization:'Bearer '+KEY,Accept:'application/json'}};
    if(method==='POST'){opt.headers['Content-Type']='application/json';opt.headers['Prefer']='resolution=merge-duplicates,return=representation';}
    if(method==='POST') opt.body=JSON.stringify(body);
    try{
      // Не добавляем произвольные query-параметры: PostgREST отвечает 400 на неизвестный параметр t.
      const url=method==='GET'?API+'?id=eq.main&select=id,data,updated_at':API+'?on_conflict=id';
      const r=await fetch(url,opt); const text=await r.text(); let json=null; try{json=text?JSON.parse(text):null}catch(e){}
      return {ok:r.ok,status:r.status,text,json};
    }catch(e){return {ok:false,status:0,text:e&&e.name==='AbortError'?'timeout':String(e),json:null};}
    finally{clearTimeout(timer)}
  }
  function redraw(){
    try{renderNav()}catch(e){} try{fillCats()}catch(e){} try{drawMenu('all')}catch(e){} try{drawAdmin()}catch(e){} try{updateCartBadge()}catch(e){}
    try{applyTheme()}catch(e){} try{applyDishTransparency()}catch(e){} try{applyNavTransparency()}catch(e){} try{applyCategoryTransparency()}catch(e){} try{applyBackground()}catch(e){}
  }
  function replaceState(s){
    if(!Array.isArray(cats)||!Array.isArray(dishes)) return false;
    cats.splice(0,cats.length,...s.cats); dishes.splice(0,dishes.length,...s.dishes); return true;
  }
  async function readRemote(){
    const r=await request('GET');
    if(!r.ok){console.warn('FA direct GET failed',r.status,r.text);status('🔴 Облако: ошибка чтения '+(r.status||'сеть'),'offline');return null;}
    const row=Array.isArray(r.json)?r.json[0]:null;
    if(!row||!row.data||!Array.isArray(row.data.cats)||!Array.isArray(row.data.dishes)){console.warn('FA direct invalid data',r.text);status('🔴 Облако: неверные данные','offline');return null;}
    return {state:{cats:row.data.cats,dishes:row.data.dishes},fingerprint:fp({cats:row.data.cats,dishes:row.data.dishes}),updatedAt:Date.parse(row.updated_at||'')||0};
  }
  async function upload(){
    if(!ready||applying||uploading)return false;
    const s=getState(), f=fp(s); if(!s||!f)return false;
    uploading=true; status('🟡 Сохранение в облако...','saving');
    try{
      const r=await request('POST',{id:'main',data:s,updated_at:new Date().toISOString()});
      if(!r.ok){dirty=true;status('🔴 Ошибка облака '+(r.status||'сеть'),'offline');console.warn('FA direct POST failed',r.status,r.text);return false;}
      const row=Array.isArray(r.json)?r.json[0]:null;
      lastCloud=f; lastCloudTime=Date.parse(row&&row.updated_at||'')||Date.now();
      lastState=fp(getState()); dirty=false; saveLocal(s); status('🟢 Синхронизировано','ok'); return true;
    }finally{uploading=false;}
  }
  async function applyRemote(r,force){
    if(!r)return false;
    if(r.fingerprint===lastState){lastCloud=r.fingerprint;lastCloudTime=Math.max(lastCloudTime,r.updatedAt);if(!dirty&&!uploading)status('🟢 Синхронизировано','ok');return true;}
    if(applying||uploading)return false; if(!force&&dirty)return false;
    applying=true;
    try{status('🟡 Загрузка из облака...','loading');if(!replaceState(r.state))return false;saveLocal(r.state);lastState=r.fingerprint;lastCloud=r.fingerprint;lastCloudTime=r.updatedAt||Date.now();dirty=false;redraw();status('🟢 Синхронизировано','ok');return true;}
    finally{applying=false;}
  }
  async function initial(){
    status('🟡 Подключение к облаку...','loading');
    const r=await readRemote();
    if(r){
      lastCloud=r.fingerprint;lastCloudTime=r.updatedAt;
      const local=getState(), lf=fp(local);
      if(r.fingerprint!==lf){applying=true;try{replaceState(r.state);saveLocal(r.state);lastState=r.fingerprint;redraw();}finally{applying=false;}}
      else lastState=lf;
      dirty=false;status('🟢 Синхронизировано','ok');
    }else lastState=fp(getState());
    ready=true;
  }
  function scheduleUpload(){
    if(!ready||applying||uploading)return;
    const f=fp(getState()); if(!f||f===lastState||dirty)return;
    dirty=true;status('🟡 Есть изменения...','dirty');clearTimeout(saveTimer);saveTimer=setTimeout(()=>{saveTimer=0;upload()},SAVE_DEBOUNCE_MS);
  }
  async function poll(){if(!ready||applying||uploading||dirty)return;const r=await readRemote();if(r&&r.fingerprint!==lastState)await applyRemote(r,false);}
  function install(){
    let ok=false;try{ok=Array.isArray(cats)&&Array.isArray(dishes)}catch(e){} if(!ok){setTimeout(install,250);return;}
    initial().catch(e=>{console.warn('FA direct sync initial error',e);ready=true;lastState=fp(getState());status('🔴 Ошибка синхронизации','offline')});
    setInterval(()=>{if(ready&&!applying&&!uploading)scheduleUpload()},1000);
    setInterval(poll,POLL_MS);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!dirty&&!uploading)poll()});
    window.addEventListener('focus',()=>{if(!dirty&&!uploading)poll()});
    window.restaurantMenuCloudSync={upload,download:async()=>applyRemote(await readRemote(),true),forceUpload:upload,forceDownload:async()=>applyRemote(await readRemote(),true),status:()=>({ready,dirty,uploading,lastCloudTime,lastState})};
  }
  setTimeout(install,800);
})();
