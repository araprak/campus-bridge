import assert from 'node:assert/strict';
const expected=process.argv.find(a=>a.startsWith('--expected='))?.slice(11);
const hosts=['campusbridgeguide.com','grp-a.campusbridgeguide.com','grp-b.campusbridgeguide.com'];
const results=await Promise.all(hosts.map(async host=>{
 const response=await fetch(`https://${host}/api/release`,{redirect:'error',cache:'no-store',signal:AbortSignal.timeout(20000)});
 assert.equal(response.status,200,`${host}: release endpoint`);const data=await response.json();
 assert.match(data.version,/^\d+\.\d+\.\d+$/);if(expected)assert.equal(data.version,expected,host);return {host,version:data.version};
}));
assert.equal(new Set(results.map(x=>x.version)).size,1,'Public hosts serve different versions');
console.log(JSON.stringify(results,null,2));
