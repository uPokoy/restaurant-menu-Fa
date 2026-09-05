/* FA_CLOUD_SYNC_V18_STABLE */
(function(){
  'use strict';

  const VERSION='V18';
  const API='https://jrpialhwbliicbsmzmvb.supabase.co/rest/v1/menu_data';
  const KEY='sb_publishable_KXwgGRgVxKUmlLvTlFs3HQ_3Wz6kcAt';
  const POLL_MS=7000;
  const SAVE_DEBOUNCE_MS=900;
  const REQUEST_TIMEOUT_MS=12000;
  const DATA_VERSION=1;

  let ready=false, applying=false, uploading=false, dirty=false, saveTimer=0;
  let lastState='', lastCloud='', lastCloudTime=0;
  let diagnostics={version:VERSION,action:'-',status:0,code:'',message:'',detail:'',time:0};

  function getState(){
    try{
      if(!Array.isArray(cats)||!Array.isArray(dishes)) return null;
      return {version:DATA_VERSION,cats:cats.map(String),dishes:JSON.parse(JSON.stringify(dishes))};
    }catch(e){return null;}
  }
  function normalizeState(s){
    if(!s||!Array.isArray(s.cats)||!Array.isArray(s.dishes)) return null;
    return {version:Number(s.version)||DATA_VERSION,cats:s.cats.map(String),dishes:s.dishes};
  }
  function fp(s){try{return JSON.stringify(s)}catch(e){return ''}}
  function saveLocal(s){try{localStorage.setItem('restaurantCategories',JSON.stringify(s.cats));localStorage.setItem('restaurantMenu',JSON.stringify(s.dishes));}catch(e){}}

  function setDiag(action,r){
    diagnostics={version:VERSION,action:action||'-',status:r&&r.status||0,code:r&&r.code||'',message:r&&r.message||'',detail:r&&r.text||'',time:Date.now()};
  }
  function esc(s){return String(s==null?'':s).replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\\':'\\\\','"':'&quot;'}[m]||m));}
  function showDiagnostics(){
    const d=diagnostics;
    const old=document.getElementById('cloudDiagModal'); if(old) old.remove();
    const box=document.createElement('div'); box.id='cloudDiagModal'; box.style.cssText='position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.58);display:grid;place-items:center;padding:18px;font:14px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
    box.innerHTML='<div style="width:min(680px,100%);max-height:85vh;overflow:auto;background:#fff;color:#171717;border-radius:18px;padding:18px;box-shadow:0 20px 60px rgba(0,0,0,.35)"><div style="display:flex;justify-content:space-between;gap:12px;align-items:center"><b style="font-size:18px">Диагностика облака '+esc(VERSION)+'</b><button id="cloudDiagClose" style="border:0;background:#eee;border-radius:10px;padding:8px 12px">Закрыть</button></div><div style="margin-top:14px;display:grid;gap:8px"><div><b>Операция:</b> '+esc(d.action)+'</div><div><b>HTTP:</b> '+esc(d.status||'—')+'</div><div><b>Код PostgREST:</b> '+esc(d.code||'—')+'</div><div><b>Сообщение:</b> '+esc(d.message||'—')+'</div><div><b>Время:</b> '+esc(d.time?new Date(d.time).toLocaleString():'—')+'</div><div><b>Endpoint:</b> '+esc(API)+'</div></div><pre style="white-space:pre-wrap;word-break:break-word;background:#f5f5f5;padding:12px;border-radius:10px;margin-top:14px">'+esc(d.detail||'Нет тела ответа')+'</pre></div>';
    document.body.appendChild(box); document.getElementById('cloudDiagClose').onclick=()=>box.remove(); box.onclick=e=>{if(e.target===box)box.remove()};
  }
  function status(t,type){
    try{
      let el=document.getElementById('cloudSyncStatus');
      if(!el){el=document.createElement('button');el.id='cloudSyncStatus';el.type='button';el.style.cssText='position:fixed;right:12px;bottom:12px;z-index:99999;padding:7px 11px;border:0;border-radius:999px;background:rgba(20,20,20,.86);color:#fff;font:600 12px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.18);cursor:pointer;opacity:.94';document.body.appendChild(el);el.onclick=showDiagnostics}
      el.textContent=t;el.dataset.state=type||'';
    }catch(e){}
  }

  async function request(action,method,url,body){
    const c=new AbortController(); const timer=setTimeout(()=>c.abort(),REQUEST_TIMEOUT_MS);
    const headers={apikey:KEY,Authorization:'Bearer '+KEY,Accept:'application/json'};
    const opt={method,cache:'no-store',signal:c.signal,headers};
    if(body!==undefined){headers['Content-Type']='application/json';opt.body=JSON.stringify(body)}
    try{
      const r=await fetch(url,opt); const text=await r.text(); let json=null; try{json=text?JSON.parse(text):null}catch(e){}
      const item=json&&typeof json==='object'&&!Array.isArray(json)?json:{};
      const result={ok:r.ok,status:r.status,text,json,code:item.code||'',message:item.message||item.error||item.hint||''};
      setDiag(action,result); return result;
    }catch(e){
      const result={ok:false,status:0,text:e&&e.name==='AbortError'?'timeout':String(e),json:null,code:'NETWORK',message:e&&e.message||String(e)}; setDiag(action,result); return result;
    }finally{clearTimeout(timer)}
  }

  function readUrl(){return API+'?id=eq.main&select=id%2Cdata%2Cupdated_at'}
  function rowData(row){
    const state=normalizeState(row&&row.data); if(!state)return null;
    return {state,fingerprint:fp({cats:state.cats,dishes:state.dishes}),updatedAt:Date.parse(row.updated_at||'')||0};
  }
  async function readRemote(){
    const r=await request('GET','GET',readUrl());
    if(!r.ok){status('🔴 Облако: '+(r.status||'сеть')+(r.code?' · '+r.code:''),'offline');return null}
    const rows=Array.isArray(r.json)?r.json:[];
    const item=rows.find(x=>x&&x.id==='main');
    const parsed=rowData(item);
    if(!parsed){setDiag('GET_INVALID',{status:r.status,code:'INVALID_DATA',message:'В облаке нет корректной строки main',text:r.text});status('🔴 Облако: неверные данные','offline');return null}
    return parsed;
  }

  async function insertRemote(s){
    return request('INSERT','POST',API, {id:'main',data:s,updated_at:new Date().toISOString()});
  }
  async function updateRemote(s){
    return request('UPDATE','PATCH',API+'?id=eq.main', {data:s,updated_at:new Date().toISOString()});
  }

  function redraw(){
    try{renderNav()}catch(e){} try{fillCats()}catch(e){} try{drawMenu('all')}catch(e){} try{drawAdmin()}catch(e){} try{updateCartBadge()}catch(e){}
    try{applyTheme()}catch(e){} try{applyDishTransparency()}catch(e){} try{applyNavTransparency()}catch(e){} try{applyCategoryTransparency()}catch(e){} try{applyBackground()}catch(e){}
  }
  function replaceState(s){
    if(!s||!Array.isArray(cats)||!Array.isArray(dishes)) return false;
    cats.splice(0,cats.length,...s.cats); dishes.splice(0,dishes.length,...s.dishes); return true;
  }

  async function upload(){
    if(!ready||applying||uploading)return false;
    const local=getState(), f=fp(local); if(!local||!f)return false;
    uploading=true; status('🟡 Проверка облака...','saving');
    try{
      const remote=await readRemote();
      if(remote && remote.fingerprint!==lastCloud && remote.updatedAt>lastCloudTime && remote.fingerprint!==f){
        status('🟡 Обнаружены изменения с другого устройства','loading');
        await applyRemote(remote,true); return false;
      }
      status('🟡 Сохранение в облако...','saving');
      let r=await updateRemote(local);
      if(!r.ok && (r.status===404 || r.status===406)) r=await insertRemote(local);
      if(!r.ok){dirty=true;status('🔴 Облако: ошибка '+(r.status||'сеть')+(r.code?' · '+r.code:''),'offline');return false}
      const responseRow=Array.isArray(r.json)?r.json[0]:null;
      lastCloud=f; lastCloudTime=Date.parse(responseRow&&responseRow.updated_at||'')||Date.now(); lastState=f; dirty=false; saveLocal(local); status('🟢 Синхронизировано '+VERSION,'ok'); return true;
    }finally{uploading=false}
  }

  async function applyRemote(r,force){
    if(!r)return false;
    if(r.fingerprint===lastState){lastCloud=r.fingerprint;lastCloudTime=Math.max(lastCloudTime,r.updatedAt);if(!dirty&&!uploading)status('🟢 Синхронизировано '+VERSION,'ok');return true}
    if(applying||(!force&&dirty))return false;
    applying=true;
    try{status('🟡 Загрузка из облака...','loading');if(!replaceState(r.state))return false;saveLocal(r.state);lastState=r.fingerprint;lastCloud=r.fingerprint;lastCloudTime=r.updatedAt||Date.now();dirty=false;redraw();status('🟢 Синхронизировано '+VERSION,'ok');return true}
    finally{applying=false}
  }

  async function initial(){
    status('🟡 Облако '+VERSION+': подключение...','loading');
    const r=await readRemote();
    if(r){
      lastCloud=r.fingerprint;lastCloudTime=r.updatedAt;
      const local=getState(), lf=fp(local);
      if(r.fingerprint!==lf){applying=true;try{replaceState(r.state);saveLocal(r.state);lastState=r.fingerprint;redraw()}finally{applying=false}}
      else lastState=lf;
      dirty=false;status('🟢 Синхронизировано '+VERSION,'ok');
    }else lastState=fp(getState());
    ready=true;
  }
  function scheduleUpload(){
    if(!ready||applying||uploading)return;
    const f=fp(getState()); if(!f||f===lastState||dirty)return;
    dirty=true;status('🟡 Есть изменения...','dirty');clearTimeout(saveTimer);saveTimer=setTimeout(()=>{saveTimer=0;upload()},SAVE_DEBOUNCE_MS);
  }
  async function poll(){if(!ready||applying||uploading||dirty)return;const r=await readRemote();if(r&&r.fingerprint!==lastState)await applyRemote(r,false)}

  function install(){
    let ok=false;try{ok=Array.isArray(cats)&&Array.isArray(dishes)}catch(e){} if(!ok){setTimeout(install,250);return}
    initial().catch(e=>{console.warn('FA V18 initial error',e);ready=true;lastState=fp(getState());status('🔴 Ошибка синхронизации','offline')});
    setInterval(()=>{if(ready&&!applying&&!uploading)scheduleUpload()},1000);
    setInterval(poll,POLL_MS);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!dirty&&!uploading)poll()});
    window.addEventListener('focus',()=>{if(!dirty&&!uploading)poll()});
    window.restaurantMenuCloudSync={upload,download:async()=>applyRemote(await readRemote(),true),forceUpload:upload,forceDownload:async()=>applyRemote(await readRemote(),true),diagnostics:showDiagnostics,status:()=>({ready,dirty,uploading,lastCloudTime,lastState,version:VERSION,diagnostics})};
  }
  setTimeout(install,800);
})();
