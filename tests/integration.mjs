import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {readFile} from 'node:fs/promises';import worker from '../cloudflare-publicado/worker.mjs';
const db=new DatabaseSync(':memory:');for(const name of ['schema.sql','analytics.sql','texts.sql','engagement.sql'])db.exec(await readFile(new URL('../admin-source/'+name,import.meta.url),'utf8'));
const DB={prepare(sql){let args=[];return {bind(...a){args=a;return this},async first(){return db.prepare(sql).get(...args)||null},async all(){return {results:db.prepare(sql).all(...args)}},async run(){const r=db.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}}}}},async batch(stmts){return Promise.all(stmts.map(s=>s.all()))}};
const env={DB,AUTH_SALT:'test-only'};const origin='https://example.test';const visitor='b'.repeat(32),token='a'.repeat(64);const hash=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))).toString('hex');db.prepare('INSERT INTO sessions(hash,expires) VALUES(?,?)').run(hash,Date.now()+3600000);
function req(path,method='GET',data,headers={}){return worker.fetch(new Request(origin+path,{method,headers:{Origin:origin,'User-Agent':'Mozilla/5.0 Test','Cookie':'other=ok; __Host-arennea_visitor='+visitor,'Content-Type':'application/json',...headers},body:data===undefined?undefined:JSON.stringify(data)}),env)}
const auth={Cookie:'__Host-arennea_session='+token};const send=d=>req('/api/engagement','POST',d);
const base={visit:'11111111-1111-4111-8111-111111111111',seq:1,sections:['inicio'],last:'inicio',depth:10,clicks:{},reason:'visible'};
assert.equal((await send(base)).status,204);assert.equal(db.prepare('SELECT COUNT(*) n FROM landing_journeys').get().n,1);
const next={...base,seq:3,sections:['inicio','ganancias','faq'],last:'faq',depth:85,clicks:{flotante:2},reason:'calendly'};assert.equal((await send(next)).status,204);await send(next);await send({...base,seq:2});assert.equal(db.prepare('SELECT seq FROM landing_journeys').get().seq,3);
await send({...base,visit:'22222222-2222-4222-8222-222222222222',sections:['inicio','contacto'],last:'contacto',depth:100,clicks:{final:1},reason:'pagehide'});
assert.equal((await req('/api/engagement','POST',base,{Origin:'https://bad.example'})).status,403);
assert.equal((await send({...base,depth:101})).status,400);assert.equal((await send({...base,clicks:{bad:1}})).status,400);assert.equal((await send({...base,sections:['bad']})).status,400);
await req('/api/engagement','POST',{...base,visit:'33333333-3333-4333-8333-333333333333'},auth);await req('/api/engagement','POST',{...base,visit:'44444444-4444-4444-8444-444444444444'},{'User-Agent':'Googlebot'});assert.equal(db.prepare('SELECT COUNT(*) n FROM landing_journeys').get().n,2);
let r=await req('/api/admin/stats?start=2020-01-01&end=2099-12-31','GET',undefined,auth);assert.equal(r.status,200);let data=await r.json();assert.equal(data.engagement.totals.journeys,2);assert.equal(data.engagement.totals.visitors,1);assert.equal(data.engagement.totals.clicked,2);assert.equal(data.engagement.buttons.find(b=>b.id==='flotante').clicks,2);assert.equal(data.engagement.sections.find(s=>s.id==='inicio').reached,2);assert.equal(data.engagement.sections.find(s=>s.id==='faq').last,1);
r=await req('/api/admin/stats?start=2000-01-01&end=2000-01-02','GET',undefined,auth);assert.equal((await r.json()).engagement.totals.journeys,0);
assert.equal((await req('/api/admin/stats?start=2026-02-30')).status,401);assert.equal((await req('/api/admin/stats?start=2026-02-30','GET',undefined,auth)).status,400);
r=await req('/api/admin/texts','GET',undefined,auth);data=await r.json();assert.ok(data.fields.some(f=>f.kind==='url'));assert.equal((await req('/api/admin/texts','PUT',{revision:data.revision,values:{'v4-copy-001':'Título editado & seguro'}},auth)).status,200);assert.equal((await req('/api/admin/texts','PUT',{revision:data.revision,values:{}},auth)).status,409);data=await (await req('/api/admin/texts','GET',undefined,auth)).json();assert.equal(data.fields[0].value,'Título editado & seguro');
r=await req('/api/admin/images','GET',undefined,auth);assert.equal((await r.json()).images.length,24);
console.log('PASS: SQLite migrations, snapshot ordering and deduplication, button counts, section reach, last section, date filters, validation, bot/admin exclusion, text edit persistence and conflicts, image slots.');

db.prepare("UPDATE landing_texts SET body=? WHERE id=1").run(JSON.stringify({'reserved-legacy':'personalización anterior'}));
const revision=data.revision;
assert.equal((await req('/api/admin/texts','PUT',{revision,values:{'url-final':'javascript:alert(1)'}},auth)).status,400);
assert.equal((await req('/api/admin/texts','PUT',{revision,values:{'url-final':'https://example.com/cita'}},auth)).status,200);
const kept=JSON.parse(db.prepare('SELECT body FROM landing_texts WHERE id=1').get().body);
assert.equal(kept['reserved-legacy'],'personalización anterior');
assert.equal(kept['url-final'],'https://example.com/cita');
console.log('PASS: editable destination, unsafe URL rejection, preservation of legacy overrides.');
