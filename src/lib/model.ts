import catalog from '@/data/catalog.json';
import { effectiveHasCar, generatePlan, TRANSIT_MODE_OPTIONS, RENTAL_HELP_OPTIONS, type PlanAnswers, type TaskTemplate, type Progress, type Transport, type TransitMode, type RentalHelp } from '@/domain/plan';
export { TRANSIT_MODE_OPTIONS, RENTAL_HELP_OPTIONS, type TransitMode, type RentalHelp } from '@/domain/plan';
export const categoryLabels = { housing:'Housing & Move-In', transportation:'Transportation', services:'Services & Bills', campus:'Campus Support', daily_life:'Essential Daily Life' };
export const horizonLabels = { first_48_hours:'First 48 Hours', first_week:'First Week', first_30_days:'First Month' };
export const CAR_ARRIVAL_OPTIONS = ['drive','ship','here','undecided'] as const;
export type CarArrival = typeof CAR_ARRIVAL_OPTIONS[number];
export type Answers = PlanAnswers & { housingType: 'apartment'|'house'|'residence'|'temporary'; transport: Transport; housingCommunity?: string; housingZip?: string; carArrival?: CarArrival; leaseStartDate?: string };
export interface StudentState { version: 1; name: string; answers: Answers; progress: Progress; onboardingComplete: boolean; revision: number; email?: string; utdEmail?: string }
export type Task = TaskTemplate & { why: string; steps: string[]; help: string; resourceId: string };
export const tasks = catalog.tasks as Task[];
export const resources = catalog.resources;
export function dallasDate() { return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()); }
export function initialState(demo = false): StudentState { return { version:1,name:demo?'Alex':'',answers:{arrivalDate:dallasDate(),housingLocation:'off_campus',housingType:'apartment',household:'roommates',electricity:'unknown',internet:'unknown',hasCar:false,transport:'transit',transitMode:'undecided',rentalHelp:'undecided',priorities:[]},progress:{},onboardingComplete:false,revision:0 }; }

/** Keep hidden follow-up answers from reappearing after a transportation change. */
export function updateTransportAnswers(answers: Answers, patch: Partial<Answers> = {}): Answers {
  const next = { ...answers, ...patch };
  const hasCar = effectiveHasCar(next);
  return {
    ...next,
    hasCar,
    transitMode: next.transport === 'transit' ? next.transitMode ?? 'undecided' : 'undecided',
    rentalHelp: next.transport === 'car' && !hasCar ? next.rentalHelp ?? 'undecided' : 'undecided',
    ...('carArrival' in next ? { carArrival: hasCar ? next.carArrival : 'undecided' as const } : {}),
  };
}
export function validateState(value: unknown): StudentState {
  if (!value || typeof value !== 'object') throw new Error('Please check your profile details.');
  const s=value as StudentState;
  if (s.version!==1 || typeof s.name!=='string' || s.name.trim().length>60 || !s.answers
    || !['apartment','house','residence','temporary'].includes(s.answers.housingType)
    || !['transit','car','walking','undecided'].includes(s.answers.transport)
    || ('carArrival' in s.answers && !CAR_ARRIVAL_OPTIONS.includes(s.answers.carArrival as CarArrival))
    || ('transitMode' in s.answers && !TRANSIT_MODE_OPTIONS.includes(s.answers.transitMode as TransitMode))
    || ('rentalHelp' in s.answers && !RENTAL_HELP_OPTIONS.includes(s.answers.rentalHelp as RentalHelp))
    || ('housingCommunity' in s.answers && (typeof s.answers.housingCommunity!=='string' || (s.answers.housingCommunity!=='' && !/^[a-z0-9][a-z0-9-]{0,79}$/.test(s.answers.housingCommunity))))
    || ('leaseStartDate' in s.answers && (typeof s.answers.leaseStartDate!=='string' || (s.answers.leaseStartDate!=='' && (! /^(?!0000)\d{4}-\d{2}-\d{2}$/.test(s.answers.leaseStartDate) || !Number.isFinite(Date.parse(s.answers.leaseStartDate+'T12:00:00Z')) || new Date(s.answers.leaseStartDate+'T12:00:00Z').toISOString().slice(0,10)!==s.answers.leaseStartDate))))
    || ('housingZip' in s.answers && (typeof s.answers.housingZip!=='string' || (s.answers.housingZip!=='' && !/^\d{5}$/.test(s.answers.housingZip))))
    || typeof s.onboardingComplete!=='boolean' || !Number.isSafeInteger(s.revision) || s.revision<0
    || !s.progress || typeof s.progress!=='object' || Array.isArray(s.progress)) throw new Error('Please check your profile details.');
  generatePlan(s.answers,tasks,{},dallasDate());
  for (const [key,p] of Object.entries(s.progress)) {
    if (!tasks.some(t=>t.id===key) || !p || typeof p !== 'object' || Array.isArray(p)
      || (p.completedAt!==null && (typeof p.completedAt!=='string'||!Number.isFinite(Date.parse(p.completedAt))))
      || (p.notApplicableAt!==undefined && p.notApplicableAt!==null && (typeof p.notApplicableAt!=='string'||!Number.isFinite(Date.parse(p.notApplicableAt))))
      || (p.updatedAt!==undefined && (typeof p.updatedAt!=='string'||!Number.isFinite(Date.parse(p.updatedAt))))
      || (p.completedAt!==null && p.notApplicableAt!=null)) throw new Error('Your saved progress could not be read.');
  }
  return { version:1,name:s.name.trim(),answers:updateTransportAnswers({arrivalDate:s.answers.arrivalDate,housingLocation:s.answers.housingLocation,housingType:s.answers.housingLocation==='off_campus'&&s.answers.housingType==='residence'?'apartment':s.answers.housingType,household:s.answers.household,electricity:s.answers.electricity,internet:s.answers.internet,transport:s.answers.transport,hasCar:s.answers.hasCar,priorities:[...s.answers.priorities],...('carArrival' in s.answers?{carArrival:s.answers.carArrival}:{}),...('transitMode' in s.answers?{transitMode:s.answers.transitMode}:{}),...('rentalHelp' in s.answers?{rentalHelp:s.answers.rentalHelp}:{}),...('housingCommunity' in s.answers?{housingCommunity:s.answers.housingCommunity}:{}),...('housingZip' in s.answers?{housingZip:s.answers.housingZip}:{}),...('leaseStartDate' in s.answers?{leaseStartDate:s.answers.leaseStartDate}:{})}),progress:s.progress,onboardingComplete:s.onboardingComplete,revision:s.revision };
}
