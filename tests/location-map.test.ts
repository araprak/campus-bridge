import test from 'node:test';
import assert from 'node:assert/strict';
import {mapEmbedUrl} from '../src/domain/location-map.ts';
test('maps point to the chosen public location and reject invalid coordinates',()=>{
 const url=new URL(mapEmbedUrl(32.98,-96.75));assert.equal(url.origin,'https://www.openstreetmap.org');assert.equal(url.searchParams.get('marker'),'32.98,-96.75');assert.equal(url.searchParams.get('bbox')?.split(',').length,4);
 for(const pair of [[NaN,1],[1,Infinity],[91,1],[1,-181]])assert.throws(()=>mapEmbedUrl(pair[0],pair[1]));
});
