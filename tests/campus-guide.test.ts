import test from 'node:test';
import assert from 'node:assert/strict';
import { CAMPUS_PLACES, CAMPUS_DINING_AREAS, CAMPUS_ESSENTIALS, CAMPUS_TOOLS, COMET_CARD_OFFICE, campusPlace } from '../src/data/campus-guide.ts';

test('every campus guide location resolves to a sourced building pin',()=>{
  for (const place of CAMPUS_PLACES) {
    assert.ok(place.latitude>32.98&&place.latitude<33.0,place.name);
    assert.ok(place.longitude> -96.76&&place.longitude< -96.74,place.name);
    assert.ok(place.sourceUrl.startsWith('https://'));
    assert.ok(place.coordinateSourceUrl.startsWith('https://'));
  }
  for (const item of [...CAMPUS_DINING_AREAS,...CAMPUS_ESSENTIALS,COMET_CARD_OFFICE]) assert.ok(campusPlace(item.placeId));
  assert.equal(new Set(CAMPUS_PLACES.map(place=>place.id)).size,CAMPUS_PLACES.length);
});

test('dining covers the published campus building groups, not a blank link-out',()=>{
  assert.equal(CAMPUS_DINING_AREAS.length,7);
  assert.ok(CAMPUS_DINING_AREAS.reduce((total,area)=>total+area.options.length,0)>=20);
  assert.ok(CAMPUS_DINING_AREAS.some(area=>area.options.includes('Dining Hall West')));
  assert.ok(CAMPUS_DINING_AREAS.some(area=>area.options.includes('The Halal Shack')));
  assert.ok(CAMPUS_DINING_AREAS.every(area=>area.options.length>0));
});

test('campus support identifies actual offices and the current learning platform',()=>{
  assert.equal(COMET_CARD_OFFICE.room,'SSA 12.324');
  assert.ok(CAMPUS_ESSENTIALS.find(place=>place.id==='cupboard')?.location.includes('MC 1.608'));
  assert.ok(CAMPUS_TOOLS.find(tool=>tool.id==='canvas')?.action.includes('fall 2026'));
  for (const id of ['netid','duo','email','galaxy','canvas','isso','calendar','coursebook','mobile','health','tech']) assert.ok(CAMPUS_TOOLS.find(tool=>tool.id===id));
});

test('Andromeda pin uses its building, not the calendar generic campus address',()=>{
  assert.ok(campusPlace('rha').latitude>32.99);
  assert.ok(campusPlace('rha').coordinateSourceUrl.includes('598197612'));
});
