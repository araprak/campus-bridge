import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import {request as httpRequest} from 'node:http';
const start=process.argv.includes('--start');
const base=process.argv.find(arg=>arg.startsWith('--base='))?.slice(7)??'http://127.0.0.1:4189';
const child=start?spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',new URL(base).port],{stdio:'ignore'}):null;
const request=(host,path,extra={})=>new Promise((resolve,reject)=>{const call=httpRequest(`${base}${path}`,{headers:{...extra,host},timeout:20000},result=>{let body='';result.setEncoding('utf8');result.on('data',chunk=>body+=chunk);result.on('end',()=>resolve(new Response(body,{status:result.statusCode,headers:Object.fromEntries(Object.entries(result.headers).filter(([,value])=>typeof value==='string'))})));});call.on('error',reject);call.on('timeout',()=>call.destroy(new Error('Timed out')));call.end();});
try{
 if(start){let ready=false;for(let n=0;n<60;n++){try{await request('campusbridgeguide.com','/api/release');ready=true;break;}catch{await new Promise(resolve=>setTimeout(resolve,500));}}assert.ok(ready,'Built server did not start');}
 for(const [host,group]of[['grp-a.campusbridgeguide.com','A'],['grp-b.campusbridgeguide.com','B'],['campusbridgeguide.com',null],['grp-a.campusbridgeguide.com.evil.test',null],['grp-b.campusbridgeguide.com:443',null]]){
  const result=await request(host,'/group-tools?group=a');const html=await result.text();
  if(group){assert.ok([200,307].includes(result.status),host);if(result.status===307)assert.equal(result.headers.get('location'),'/login',`${host} keeps tools protected`);else assert.ok(html.includes('NEXT_REDIRECT')&&html.includes('/login'),`${host} streams the sign-in redirect`);}
  else{assert.ok([200,404].includes(result.status),host);assert.match(html,/<title>Page not found<\/title>/,host);assert.ok(html.includes('NEXT_HTTP_ERROR_FALLBACK;404')||result.status===404,host);}
  const home=await request(host,'/');const page=await home.text();
  assert.equal(home.status,200);
  for(const lane of ['A','B'])assert.equal(page.includes(`Open Group <!-- -->${lane}<!-- --> tools`),group===lane,`${host} landing preview belongs only to its lane`);
  for(const kind of ['arrival','budget','reminders']){
   const api=await request(host,`/api/group-data/${kind}`);const allowed=group==='A'?kind==='arrival':group==='B'?kind!=='arrival':false;
   if(allowed)assert.ok([401,403,503].includes(api.status),`${host}/${kind} requires a verified account`);else assert.equal(api.status,404,`${host}/${kind} is hidden`);
  }
  console.log(`PASS ${host}: ${group?`Group ${group} only; sign-in required`:'group tools unavailable'}`);
 }
 // Spoofed proxy headers and query strings do not select a lane.
 const spoof=await request('campusbridgeguide.com','/api/group-data/arrival?group=a',{'X-Forwarded-Host':'grp-a.campusbridgeguide.com'});assert.equal(spoof.status,404);
}finally{child?.kill('SIGTERM');}
