async function engagement(request,env){
 if(request.headers.get('Origin')!==new URL(request.url).origin)return json({error:'Origen no permitido.'},403);
 const ua=request.headers.get('User-Agent')||'';
 if(/bot|crawler|spider|preview|facebookexternalhit|headless|curl|wget|python/i.test(ua)||await session(request,env))return new Response(null,{status:204});
 const cookieId=request.headers.get('Cookie')?.match(/(?:^|;\s*)__Host-arennea_visitor=([a-f0-9]{32})(?:;|$)/)?.[1];
 if(!cookieId)return new Response(null,{status:204});
 let d;try{d=JSON.parse(new TextDecoder().decode(await readBounded(request,8192)))}catch{return json({error:'Datos no válidos.'},400)}
 const sectionIds=trackingConfig.sections.map(s=>s.id),buttonIds=trackingConfig.buttons.map(b=>b.id);
 if(!d||typeof d.visit!=='string'||!/^[a-f0-9-]{36}$/.test(d.visit)||!Number.isInteger(d.seq)||d.seq<1||d.seq>1000000||!Array.isArray(d.sections)||d.sections.length>sectionIds.length||d.sections.some(s=>!sectionIds.includes(s))||!sectionIds.includes(d.last)||!Number.isInteger(d.depth)||d.depth<0||d.depth>100||!d.clicks||typeof d.clicks!=='object'||Array.isArray(d.clicks)||Object.entries(d.clicks).some(([k,v])=>!buttonIds.includes(k)||!Number.isInteger(v)||v<0||v>100)||!['visible','hidden','pagehide','calendly'].includes(d.reason))return json({error:'Datos no válidos.'},400);
 const visitor=await sha(env.AUTH_SALT+':analytics:'+cookieId),day=localDate(),now=new Date().toISOString();
 const prior=await env.DB.prepare('SELECT visitor,seq FROM landing_journeys WHERE id=?').bind(d.visit).first();
 if(prior&&prior.visitor!==visitor)return json({error:'Recorrido no válido.'},403);
 if(prior&&prior.seq>=d.seq)return new Response(null,{status:204});
 if(!prior){const count=await env.DB.prepare('SELECT COUNT(*) AS n FROM landing_journeys WHERE visitor=? AND day=?').bind(visitor,day).first();if(count.n>=200)return new Response(null,{status:204})}
 await env.DB.prepare(`INSERT INTO landing_journeys(id,visitor,day,started,updated,seq,reached,clicks,last_section,depth,reason) VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET updated=excluded.updated,seq=excluded.seq,reached=excluded.reached,clicks=excluded.clicks,last_section=excluded.last_section,depth=MAX(landing_journeys.depth,excluded.depth),reason=excluded.reason WHERE landing_journeys.visitor=excluded.visitor AND landing_journeys.seq<excluded.seq`).bind(d.visit,visitor,day,now,now,d.seq,JSON.stringify([...new Set(d.sections)]),JSON.stringify(d.clicks),d.last,d.depth,d.reason).run();
 return new Response(null,{status:204,headers:{'Cache-Control':'no-store'}});
}
async function engagementStats(env,start,end){
 const result=await env.DB.batch([
 env.DB.prepare('SELECT COUNT(*) AS journeys,COUNT(DISTINCT visitor) AS visitors,COALESCE(AVG(depth),0) AS avg_depth,COALESCE(SUM(CASE WHEN depth>=90 THEN 1 ELSE 0 END),0) AS near_end FROM landing_journeys WHERE day>=? AND day<=?').bind(start,end),
 env.DB.prepare('SELECT j.key AS button,SUM(j.value) AS clicks,COUNT(DISTINCT t.id) AS journeys,COUNT(DISTINCT t.visitor) AS visitors FROM landing_journeys t,json_each(t.clicks) j WHERE t.day>=? AND t.day<=? AND j.value>0 GROUP BY j.key').bind(start,end),
 env.DB.prepare('SELECT j.value AS section,COUNT(DISTINCT t.id) AS journeys FROM landing_journeys t,json_each(t.reached) j WHERE t.day>=? AND t.day<=? GROUP BY j.value').bind(start,end),
 env.DB.prepare('SELECT last_section AS section,COUNT(*) AS journeys,COALESCE(SUM(CASE WHEN reason IN (\'hidden\',\'pagehide\') THEN 1 ELSE 0 END),0) AS hidden FROM landing_journeys WHERE day>=? AND day<=? GROUP BY last_section').bind(start,end),
 env.DB.prepare('SELECT COUNT(*) AS clicked FROM landing_journeys t WHERE day>=? AND day<=? AND EXISTS(SELECT 1 FROM json_each(t.clicks) WHERE value>0)').bind(start,end),
 env.DB.prepare("SELECT value FROM engagement_meta WHERE key='started_at'")
 ]);
 return {totals:{...result[0].results[0],...result[4].results[0]},buttons:trackingConfig.buttons.map(b=>({...b,...result[1].results.find(r=>r.button===b.id)})),sections:trackingConfig.sections.map(s=>({...s,reached:result[2].results.find(r=>r.section===s.id)?.journeys||0,last:result[3].results.find(r=>r.section===s.id)?.journeys||0,hidden:result[3].results.find(r=>r.section===s.id)?.hidden||0})),startedAt:result[5].results[0]?.value};
}
