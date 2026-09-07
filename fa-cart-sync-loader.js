/* FA_CART_SYNC_LOADER_V1 */
(function(){
'use strict';
var s=document.createElement('script');
s.src='fa-cart-sync-v1.js?build=1.1';
s.async=false;
s.onload=function(){console.info('[FA] Shared cart sync loader loaded')};
s.onerror=function(){console.error('[FA] Shared cart sync loader failed')};
document.head.appendChild(s);
})();