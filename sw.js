const V='codex-v2';
const FILES=['./','index.html','manifest.json','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
// Дома с интернетом: берём свежую версию (до 3 сек). Без интернета: из памяти телефона.
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin||!u.pathname.startsWith(new URL(self.registration.scope).pathname))return;
  e.respondWith((async()=>{
    const c=await caches.open(V);
    const net=fetch(r).then(res=>{if(res.ok)c.put(r,res.clone());return res}).catch(()=>null);
    const hit=await c.match(r,{ignoreSearch:true});
    if(r.mode==='navigate'){
      const res=await Promise.race([net,new Promise(k=>setTimeout(()=>k(null),3000))]);
      return res||hit||await c.match('index.html');
    }
    return hit||await net||await c.match('index.html');
  })());
});
