import test from 'node:test';
import assert from 'node:assert/strict';
import type { Answers } from '../src/lib/model.ts';
import { transportationLabel, wantsRentalGuide } from '../src/data/transport-options.ts';

const answers: Answers = {arrivalDate:'2027-01-15',housingLocation:'off_campus',housingType:'apartment',household:'roommates',electricity:'unknown',internet:'unknown',transport:'car',hasCar:false,priorities:[]};

test('rental help does not imply a car is available and only applies to drivers without a car', () => {
  const rental: Answers = {...answers,rentalHelp:'yes'};
  assert.equal(wantsRentalGuide(rental),true);
  assert.equal(transportationLabel(rental),'Driving · exploring rentals');
  for(const transport of ['transit','walking','undecided'] as const) assert.equal(wantsRentalGuide({...rental,transport}),false);
  assert.equal(wantsRentalGuide({...rental,hasCar:true}),false);
  assert.equal(wantsRentalGuide({...rental,rentalHelp:'no'}),false);
  assert.equal(wantsRentalGuide(answers),false);
  assert.equal(transportationLabel({...rental,hasCar:true}),'Car available');
});

test('saved ride choices are described without implying private car access', () => {
  for (const transitMode of ['campus_bus','public_transit','rideshare','carpool','mixed','undecided'] as const) {
    assert.doesNotMatch(transportationLabel({...answers,transport:'transit',transitMode,hasCar:true}),/Car available/);
  }
  assert.equal(transportationLabel({...answers,transport:'transit',transitMode:'carpool'}),'Rides with friends / carpool');
  assert.equal(transportationLabel({...answers,transport:'transit'}),'Public transport or getting a ride');
  assert.equal(transportationLabel(answers),'Driving · car not arranged');
});
