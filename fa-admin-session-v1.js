/* FA_ADMIN_SESSION_V1 */
(function(){
  'use strict';
  if(window.__FA_ADMIN_SESSION_V1) return;
  window.__FA_ADMIN_SESSION_V1=true;

  const CHECK_INTERVAL=60000;

  function lockAdmin(){
    try{if(typeof adminUnlocked!=='undefined') adminUnlocked=false;}catch(e){}
  }

  async function verifyAndPrompt(){
    const cloud=window.restaurantMenuCloudSync;
    if(!cloud || typeof cloud.adminCheck!=='function') return true;

    let valid=false;
    try{valid=await cloud.adminCheck();}catch(e){valid=false;}
    if(valid) return true;

    lockAdmin();
    if(typeof requireAdmin!=='function') return false;
    try{return !!(await requireAdmin());}catch(e){return false;}
  }

  function wrap(name){
    const current=window[name];
    if(typeof current!=='function' || current.__faAdminSessionWrapped) return;

    const wrapped=async function(){
      if(!(await verifyAndPrompt())) return;
      return current.apply(this,arguments);
    };
    wrapped.__faAdminSessionWrapped=true;
    window[name]=wrapped;
  }

  function install(){
    ['showAdd','addCategory','deleteCategory','saveDish','editDish','deleteDish'].forEach(wrap);
  }

  async function checkActiveSession(){
    const cloud=window.restaurantMenuCloudSync;
    if(!cloud || typeof cloud.hasAdminSession!=='function' || typeof cloud.adminCheck!=='function') return;
    if(!cloud.hasAdminSession()){
      lockAdmin();
      return;
    }
    try{
      if(!(await cloud.adminCheck())) lockAdmin();
    }catch(e){}
  }

  install();
  setTimeout(install,500);
  setTimeout(install,1500);
  setInterval(checkActiveSession,CHECK_INTERVAL);
  window.addEventListener('focus',checkActiveSession);
  document.addEventListener('visibilitychange',function(){if(!document.hidden) checkActiveSession();});
})();
