import test from 'node:test';
import assert from 'node:assert/strict';
import {groupDataTable,expectedGroupRevision} from '../src/domain/group-data-access.ts';
test('group storage is selected only by the exact assigned host and feature',()=>{
 const a='grp-a.campusbridgeguide.com',b='grp-b.campusbridgeguide.com';
 assert.equal(groupDataTable(a,'arrival'),'group_a_saved_tools');
 for(const kind of ['budget','reminders'])assert.equal(groupDataTable(b,kind),'group_b_saved_tools');
 for(const host of [null,'campusbridgeguide.com','www.campusbridgeguide.com',`${a}.evil.test`,`${b}:443`,'evil.test',`${a},${b}`])for(const kind of ['arrival','budget','reminders'])assert.equal(groupDataTable(host,kind),null);
 assert.equal(groupDataTable(a,'budget'),null);assert.equal(groupDataTable(a,'reminders'),null);assert.equal(groupDataTable(b,'arrival'),null);
 assert.equal(groupDataTable('grp-a.localhost:4180','arrival'),null);
 assert.equal(groupDataTable('grp-a.localhost:4180','arrival',true),'group_a_saved_tools');
 for(const value of [-1,1.2,'1',null,NaN,Infinity,2_147_483_647])assert.equal(expectedGroupRevision(value),false);
 for(const value of [0,1,100])assert.equal(expectedGroupRevision(value),true);
});
