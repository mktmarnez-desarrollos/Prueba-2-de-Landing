import {readFile,writeFile,readdir} from 'node:fs/promises';
const root=new URL('../',import.meta.url),publicRoot=new URL('public/',root);
const assets={};
async function scan(dir,prefix=''){for(const e of await readdir(dir,{withFileTypes:true})){const rel=prefix+e.name;if(e.isDirectory()){await scan(new URL(e.name+'/',dir),rel+'/');continue}if(!/\.(html|css|js|png|jpg|webp)$/.test(e.name)||e.name.startsWith('qa-'))continue;const body=await readFile(new URL(e.name,dir));const ext=e.name.split('.').pop();const type=['jpg','png','webp'].includes(ext)?'image/webp':({html:'text/html; charset=utf-8',css:'text/css; charset=utf-8',js:'text/javascript; charset=utf-8'})[ext];assets['/'+rel]={type,body:body.toString('base64')}}}
await scan(publicRoot);
const slots=JSON.parse(await readFile(new URL('admin-source/slots.json',root),'utf8'));
const textFields=JSON.parse(await readFile(new URL('admin-source/text-fields.json',root),'utf8'));
const trackingConfig=JSON.parse(await readFile(new URL('admin-source/tracking-config.json',root),'utf8'));
const admin=await readFile(new URL('admin-source/admin.html',root),'utf8');
const engagement=await readFile(new URL('admin-source/engagement.mjs',root),'utf8');
const handler=await readFile(new URL('admin-source/handler.mjs',root),'utf8');
const base='const assets='+JSON.stringify(assets)+';\n';
await writeFile(new URL('admin-source/original-assets.mjs',root),base);
await writeFile(new URL('cloudflare-publicado/worker.mjs',root),base+'const slots='+JSON.stringify(slots)+';\nconst adminHTML='+JSON.stringify(admin)+';\nconst textFields='+JSON.stringify(textFields)+';\nconst trackingConfig='+JSON.stringify(trackingConfig)+';\n'+engagement+'\n'+handler);
console.log('Built',Object.keys(assets).length,'assets,',slots.length,'images,',textFields.length,'text fields');
