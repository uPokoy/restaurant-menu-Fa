/* FA_SHARED_CART_SYNC_V2 */
(function(){
'use strict';
const VERSION='Shared Cart V2';
const URL='https://jrpialhwbliicbsmzmvb.supabase.co';
const KEY='sb_publishable_KXwgGRgVxKUmlLvTlFs3HQ_3Wz6kcAt';
const CDN='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
let client=null,channel=null,applying=false,saving=false,ready=false,saveTimer=0,lastCloud='';
function localCart(){try{return JSON.parse(localStorage.getItem('restaurantCart')||'{}')||{};}catch(e){return {};}}
function clean(c){const out={};if(!c||typeof c!=='object')return out;Object.keys(c).forEach(k=>{const n=Math.floor(Number(c[k])||0);if(n>0)out[String(k)]=n;});return out;}
function fp(c){return JSON.stringify(clean(c));}
function hasItems(c){return Object.keys(clean(c)).length>0;}
function apply(c){const x=clean(c);localStorage.setItem('restaurantCart',JSON.stringify(x));lastCloud=fp(x);try{if(typeof updateCartBadge==='function')updateCartBadge();}catch(e){}try{if(typeof drawCart==='function'&&typeof cartPage!=='undefined'&&!cartPage.classList.contains('hidden'))drawCart();}catch(e){}try{window.dispatchEvent(new Event('restaurant-cart-cloud-update'));}catch(e){}}
async function read(){const r=await client.from('restaurant_cart').select('id,data,updated_at').eq('id','main').maybeSingle();if(r.error)throw r.error;return r.data;}
async function save(c){if(!ready||applying||saving)return;const x=clean(c),f=fp(x);if(f===lastCloud)return;saving=true;try{const r=await client.rpc('save_restaurant_cart',{p_cart:x});if(r.error)throw r.error;lastCloud=f;console.info('[FA] Shared cart saved');}catch(e){console.error('[FA] shared cart save failed',e);}finally{saving=false;}}
function schedule(c){clearTimeout(saveTimer);saveTimer=setTimeout(()=>save(c),250);}
function hook(){if(typeof window.saveCart!=='function'){setTimeout(hook,300);return;}if(window.__FA_SHARED_CART_HOOKED)return;window.__FA_SHARED_CART_HOOKED=true;const original=window.saveCart;window.saveCart=function(c){original.apply(this,arguments);if(!applying)schedule(c);};}
function realtime(){channel=client.channel('restaurant-cart-sync-v2').on('postgres_changes',{event:'UPDATE',schema:'public',table:'restaurant_cart',filter:'id=eq.main'},payload=>{if(applying||saving)return;const c=payload&&payload.new&&payload.new.data;if(c==null)return;apply(c);console.info('[FA] Shared cart updated from another device');}).subscribe(status=>{if(status==='SUBSCRIBED')console.info('[FA] Shared cart realtime connected');else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT')console.warn('[FA] Shared cart realtime',status);});}
async function start(){try{const mod=await import(CDN);client=mod.createClient(URL,KEY,{auth:{persistSession:false,autoRefreshToken:false}});hook();const row=await read();const cloud=clean(row&&row.data);const local=clean(localCart());applying=true;if(hasItems(cloud)){apply(cloud);}else if(hasItems(local)){lastCloud=fp({});applying=false;ready=true;await save(local);applying=true;}else{apply({});}applying=false;ready=true;realtime();window.sharedCartCloudSync={read,save:()=>save(localCart()),status:()=>({version:VERSION,ready,realtime:!!channel})};console.info('[FA] '+VERSION+' ready');}catch(e){applying=false;console.error('[FA] '+VERSION+' failed',e);}}
setTimeout(start,1200);
})();