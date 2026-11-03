function validDestination(value,kind){
 if(kind==='url' && /^#[a-z][a-z0-9-]*$/i.test(value))return true;
 try{
  const url=new URL(value);
  if(url.protocol!=='https:'||url.username||url.password)return false;
  if(kind==='map')return ['maps.google.com','www.google.com'].includes(url.hostname)&&url.pathname.startsWith('/maps');
  return true;
 }catch{return false}
}
const enc=new TextEncoder();
const hex=b=>[...new Uint8Array(b)].map(n=>n.toString(16).padStart(2,'0')).join('');
const sha=async s=>hex(await crypto.subtle.digest('SHA-256',enc.encode(s)));
const json=(data,status=200,extra={})=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra}});
const cookie=(token,age)=>'__Host-arennea_session='+token+'; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age='+age;
async function session(request,env){const token=request.headers.get('Cookie')?.match(/(?:^|;\s*)__Host-arennea_session=([a-f0-9]{64})(?:;|$)/)?.[1];if(!token)return null;const hash=await sha(token);return await env.DB.prepare('SELECT hash FROM sessions WHERE hash=? AND expires>?').bind(hash,Date.now()).first()}
async function readBounded(request,limit){const reader=request.body?.getReader();if(!reader)return new Uint8Array();const chunks=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit){await reader.cancel();throw Error('TOO_LARGE')}chunks.push(value)}const out=new Uint8Array(size);let offset=0;for(const c of chunks){out.set(c,offset);offset+=c.length}return out}

const localDate=(date=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Merida',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
const validDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'')&&!isNaN(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
async function analytics(request,env,url){
 const today=localDate(),start=url.searchParams.get('start')||today,end=url.searchParams.get('end')||today;
 if(!validDate(start)||!validDate(end)||start>end)return json({error:'Selecciona un rango de fechas válido.'},400);
 const result=await env.DB.batch([
  env.DB.prepare('SELECT COUNT(DISTINCT visitor) AS visitors,COALESCE(SUM(views),0) AS views FROM daily_visits WHERE day>=? AND day<=?').bind(start,end),
  env.DB.prepare('SELECT day,COUNT(*) AS visitors,SUM(views) AS views FROM daily_visits WHERE day>=? AND day<=? GROUP BY day ORDER BY day DESC').bind(start,end),
  env.DB.prepare("SELECT value FROM analytics_meta WHERE key='started_at'")
 ]);
 return json({start,end,today,timezone:'America/Merida',startedAt:result[2].results[0]?.value,totals:result[0].results[0],days:result[1].results,engagement:await engagementStats(env,start,end)});
}
async function recordVisit(request,env){
 const ua=request.headers.get('User-Agent')||'';
 if(/bot|crawler|spider|preview|facebookexternalhit|headless|curl|wget|python/i.test(ua)||request.headers.get('Purpose')==='prefetch'||request.headers.get('Sec-Purpose')?.includes('prefetch'))return null;
 if(await session(request,env))return null;
 let id=request.headers.get('Cookie')?.match(/(?:^|;\s*)__Host-arennea_visitor=([a-f0-9]{32})(?:;|$)/)?.[1];
 const fresh=!id;if(fresh)id=hex(crypto.getRandomValues(new Uint8Array(16)));
 const visitor=await sha(env.AUTH_SALT+':analytics:'+id);
 await env.DB.prepare('INSERT INTO daily_visits(day,visitor,views) VALUES(?,?,1) ON CONFLICT(day,visitor) DO UPDATE SET views=views+1').bind(localDate(),visitor).run();
 return fresh?'__Host-arennea_visitor='+id+'; Path=/; Max-Age=31536000; Secure; HttpOnly; SameSite=Lax':null;
}

async function handle(request,env){
 const url=new URL(request.url),path=url.pathname,method=request.method;
 if(path==='/api/engagement'){if(method!=='POST')return json({error:'Método no permitido.'},405);return engagement(request,env)}
 if(path==='/admin'||path==='/admin/'){if(method!=='GET'&&method!=='HEAD')return json({error:'Método no permitido'},405);return new Response(method==='HEAD'?null:adminHTML,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','X-Frame-Options':'DENY','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob:; frame-ancestors 'none'; form-action 'self'; base-uri 'none'"}})}
 if(path.startsWith('/api/admin/')){
  if(!['GET','HEAD'].includes(method)&&request.headers.get('Origin')!==url.origin)return json({error:'Origen no permitido.'},403);
  if(path==='/api/admin/login'&&method==='POST'){
   const ip=await sha(request.headers.get('CF-Connecting-IP')||'unknown'),window=Math.floor(Date.now()/600000),key=ip+':'+window;
   const attempt=await env.DB.prepare('INSERT INTO attempts (id,count,expires) VALUES (?,1,?) ON CONFLICT(id) DO UPDATE SET count=count+1 RETURNING count').bind(key,Date.now()+600000).first();
   if(attempt.count>10)return json({error:'Demasiados intentos. Espera 10 minutos.'},429);
   let body;try{body=JSON.parse(new TextDecoder().decode(await readBounded(request,2048)))}catch{return json({error:'Solicitud no válida.'},400)}
   const candidate=typeof body.password==='string'?body.password:'';
   const keyMaterial=await crypto.subtle.importKey('raw',enc.encode(candidate),'PBKDF2',false,['deriveBits']);
   const derived=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:enc.encode(env.AUTH_SALT),iterations:100000,hash:'SHA-256'},keyMaterial,256));
   const expected=Uint8Array.from(env.AUTH_HASH.match(/../g),h=>parseInt(h,16));
   if(!crypto.subtle.timingSafeEqual(derived,expected))return json({error:'Contraseña incorrecta.'},401);
   const token=hex(crypto.getRandomValues(new Uint8Array(32)));
   await env.DB.batch([env.DB.prepare('INSERT INTO sessions (hash,expires) VALUES (?,?)').bind(await sha(token),Date.now()+8*3600000),env.DB.prepare('DELETE FROM sessions WHERE expires<?').bind(Date.now()),env.DB.prepare('DELETE FROM attempts WHERE expires<? OR id=?').bind(Date.now(),key)]);
   return json({ok:true},200,{'Set-Cookie':cookie(token,8*3600)});
  }
  const active=await session(request,env);if(!active)return json({error:'Inicia sesión para continuar.'},401);
  if(path==='/api/admin/texts'){
   const row=await env.DB.prepare('SELECT body,revision,updated FROM landing_texts WHERE id=1').first();
   if(method==='GET'){const saved=JSON.parse(row.body);return json({revision:row.revision,updated:row.updated,fields:textFields.map(f=>({...f,value:Object.hasOwn(saved,f.id)?saved[f.id]:f.default}))})}
   if(method!=='PUT')return json({error:'Método no permitido.'},405);
   let data;try{data=JSON.parse(new TextDecoder().decode(await readBounded(request,512*1024)))}catch{return json({error:'Contenido inválido o demasiado extenso.'},400)}
   if(!data||!Number.isSafeInteger(data.revision)||!data.values||typeof data.values!=='object'||Array.isArray(data.values))return json({error:'Contenido no válido.'},400);
   const clean=JSON.parse(row.body);
   for(const [id,value] of Object.entries(data.values)){
    const field=textFields.find(f=>f.id===id);
    if(!field||typeof value!=='string'||value.length>4000||value.includes('\0'))return json({error:'Texto no válido: máximo 4,000 caracteres por campo.'},400);
    if((field.kind==='url'||field.kind==='map')&&!validDestination(value,field.kind))return json({error:'Revisa el destino de '+field.label+'. Usa HTTPS o un ancla válida.'},400);
    if(value!==field.default)clean[id]=value;else delete clean[id];
   }
   const updated=new Date().toISOString();
   const result=await env.DB.prepare('UPDATE landing_texts SET body=?,revision=revision+1,updated=? WHERE id=1 AND revision=?').bind(JSON.stringify(clean),updated,data.revision).run();
   if(!result.meta.changes)return json({error:'Hay una versión más reciente. Copia tus cambios y recarga los textos antes de guardar.'},409);
   return json({ok:true,revision:data.revision+1,updated});
  }
  if(path==='/api/admin/logout'&&method==='POST'){await env.DB.prepare('DELETE FROM sessions WHERE hash=?').bind(active.hash).run();return json({ok:true},200,{'Set-Cookie':cookie('',0)})}
  if(path==='/api/admin/images'&&method==='GET'){const rows=await env.DB.prepare('SELECT name,updated FROM images').all();return json({images:slots.map(s=>({...s,updated:rows.results.find(r=>r.name===s.name)?.updated||null}))})}
  if(path==='/api/admin/stats'&&method==='GET')return analytics(request,env,url);
  const name=decodeURIComponent(path.slice('/api/admin/images/'.length));
  if(!path.startsWith('/api/admin/images/')||!slots.some(s=>s.name===name))return json({error:'Imagen no encontrada.'},404);
  if(method==='DELETE'){await env.DB.prepare('DELETE FROM images WHERE name=?').bind(name).run();return json({ok:true})}
  if(method!=='PUT')return json({error:'Método no permitido.'},405);
  const data=await readBounded(request,1024*1024);
  const ascii=(a,b)=>String.fromCharCode(...data.slice(a,b));
  const mime=ascii(0,4)==='RIFF'&&ascii(8,12)==='WEBP'?'image/webp':data[0]===137&&ascii(1,4)==='PNG'?'image/png':data[0]===255&&data[1]===216&&data[2]===255?'image/jpeg':null;
  if(!mime||data.length<32)return json({error:'Imagen no válida. Usa JPG, PNG o WebP.'},400);
  await env.DB.prepare('INSERT INTO images(name,mime,body,updated) VALUES(?,?,?,?) ON CONFLICT(name) DO UPDATE SET mime=excluded.mime,body=excluded.body,updated=excluded.updated').bind(name,mime,data.buffer,new Date().toISOString()).run();
  return json({ok:true});
 }
 if(method!=='GET'&&method!=='HEAD')return json({error:'Método no permitido.'},405);
 const key=path==='/'?'/index.html':path;
 if(slots.some(s=>'/'+s.name===key)){
  const row=await env.DB.prepare('SELECT mime,body FROM images WHERE name=?').bind(key.slice(1)).first();
  if(row)return new Response(method==='HEAD'?null:new Uint8Array(row.body),{headers:{'Content-Type':row.mime,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 }
 let visitorCookie=null;
 if(method==='GET'&&(path==='/'||path==='/index.html')){
  try{visitorCookie=await recordVisit(request,env)}catch(e){console.error('Analytics unavailable',e.message)}
 }
 const found=Object.hasOwn(assets,key),asset=found?assets[key]:assets['/404.html'];
 const response=new Response(method==='HEAD'?null:Uint8Array.from(atob(asset.body),c=>c.charCodeAt(0)),{status:found?200:404,headers:{'Content-Type':asset.type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin',...(visitorCookie?{'Set-Cookie':visitorCookie}:{})}});
 if(key==='/index.html'&&method==='GET'){
  const row=await env.DB.prepare('SELECT body FROM landing_texts WHERE id=1').first();
  const saved=JSON.parse(row?.body||'{}');
  const textHandler={element(el){const id=el.getAttribute('data-copy');if(Object.hasOwn(saved,id))el.setInnerContent(saved[id]);}};
  const destination=(key,attr,kind)=>({element(el){const value=saved[el.getAttribute(key)];if(value&&validDestination(value,kind))el.setAttribute(attr,value)}});
  return new HTMLRewriter().on('[data-link]',destination('data-link','href','url')).on('[data-map]',destination('data-map','src','map')).on('[data-copy]',textHandler).on('[data-copy-meta]',{element(el){const id=el.getAttribute('data-copy-meta');if(Object.hasOwn(saved,id))el.setAttribute('content',saved[id]);}}).on('[data-copy-alt]',{element(el){const id=el.getAttribute('data-copy-alt');if(Object.hasOwn(saved,id))el.setAttribute('alt',saved[id]);}}).transform(response);
 }
 return response;
}
export default {async fetch(request,env){try{return await handle(request,env)}catch(e){if(e.message==='TOO_LARGE')return json({error:'La imagen optimizada supera 1 MB.'},413);console.error('Request failed',e.message);return json({error:'No se pudo completar la operación. Intenta de nuevo.'},500)}}};
