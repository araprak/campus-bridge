import { GROUP_B_APARTMENT_PRICES, GROUP_B_ELECTRICITY_PRICES, GROUP_B_INTERNET_PRICES, GROUP_B_PHONE_PRICES, type PriceRange } from '../data/group-b-prices.ts';
import { SPRING_2027_CHARGES, SPRING_2027_SOURCES } from '../data/spring-2027.ts';
import { parseBudgetAmount } from './monthly-budget.ts';
import { readBudgetScenarios } from './group-b-budget.ts';

export const CONNECTED_BUDGET_FIELDS = [
  {id:'rent',label:'Rent (my share)',basis:'monthly'}, {id:'fees',label:'Required housing fees',basis:'monthly'},
  {id:'electricity',label:'Electricity',basis:'monthly'}, {id:'water',label:'Water, sewer and trash',basis:'monthly'},
  {id:'internet',label:'Internet',basis:'monthly'}, {id:'phone',label:'Phone',basis:'monthly'},
  {id:'transport',label:'Transport, parking and gas',basis:'monthly'}, {id:'insurance',label:'UT SHIP (monthly share)',basis:'monthly'},
  {id:'groceries',label:'Groceries and dining',basis:'monthly'}, {id:'personal',label:'Personal and other costs',basis:'monthly'},
  {id:'application',label:'Application fee',basis:'one-time'}, {id:'admin',label:'Admin and other move-in fees',basis:'one-time'},
  {id:'deposit',label:'Housing security deposit (refundable subject to terms)',basis:'refundable'},
  {id:'utilityDeposit',label:'Utility deposits (refundable subject to terms)',basis:'refundable'},
  {id:'setup',label:'Furniture, bedding and kitchen setup',basis:'one-time'}, {id:'tb',label:'TB test (if not covered)',basis:'one-time'},
  {id:'orientation',label:'International Student Orientation',basis:'one-time'},
] as const;
export type ConnectedBudgetField = typeof CONNECTED_BUDGET_FIELDS[number]['id'];
export type Eligibility = 'yes'|'no'|'unknown';
export type ConnectedBudgetScenario = { id:string;name:string;linked:boolean;communityId:string;floorPlanId:string;roommates:number|null;electricity:'included'|'not_included'|'unknown';internet:'included'|'not_included'|'unknown';electricityProvider:string;internetProvider:string;phoneProvider:string;transport:'transit'|'car'|'walking'|'undecided';f1:Eligibility;tbNotCovered:Eligibility;orientationRequired:Eligibility;overrides:Partial<Record<ConnectedBudgetField,string>> };
export type ConnectedBudgetDocument = {schema:2;scenarios:ConnectedBudgetScenario[]};
export type SharedBudgetAnswers = { housingCommunity?:string;household:'alone'|'roommates';electricity:'included'|'not_included'|'unknown';internet:'included'|'not_included'|'unknown';transport?:'transit'|'car'|'walking'|'undecided' };
export function newConnectedBudgetScenario(id:string,name:string,answers?:SharedBudgetAnswers):ConnectedBudgetScenario {return {id,name,linked:true,communityId:answers?.housingCommunity??'',floorPlanId:'quote',roommates:answers?.household==='alone'?1:null,electricity:answers?.electricity??'unknown',internet:answers?.internet??'unknown',electricityProvider:'',internetProvider:'',phoneProvider:'',transport:answers?.transport??'undecided',f1:'unknown',tbNotCovered:'unknown',orientationRequired:'unknown',overrides:{}};}
const member = (v:unknown, values:readonly unknown[]) => values.includes(v);
export function readConnectedBudgetDocument(value:unknown):ConnectedBudgetDocument|null {
  if (!value||typeof value!=='object'||!('schema'in value)||value.schema!==2||!('scenarios'in value)||!Array.isArray(value.scenarios)||value.scenarios.length<1||value.scenarios.length>3)return null;
  const result:ConnectedBudgetScenario[]=[];const ids=new Set<string>();
  for(const item of value.scenarios){
    if(!item||typeof item!=='object'||typeof item.id!=='string'||!/^[a-zA-Z0-9-]{1,80}$/.test(item.id)||ids.has(item.id)||typeof item.name!=='string'||!item.name.trim()||item.name.length>60||typeof item.linked!=='boolean')return null;
    if(typeof item.communityId!=='string'||(item.communityId!==''&&!GROUP_B_APARTMENT_PRICES.some(row=>row.communityId===item.communityId)))return null;
    const apartment=GROUP_B_APARTMENT_PRICES.find(row=>row.communityId===item.communityId);
    if(typeof item.floorPlanId!=='string'||(item.floorPlanId!=='quote'&&!apartment?.floorPlans.some(row=>row.id===item.floorPlanId)))return null;
    if(item.roommates!==null&&(!Number.isInteger(item.roommates)||item.roommates<1||item.roommates>8))return null;
    if(!member(item.electricity,['included','not_included','unknown'])||!member(item.internet,['included','not_included','unknown'])||!member(item.transport,['transit','car','walking','undecided'])||![item.f1,item.tbNotCovered,item.orientationRequired].every(entry=>member(entry,['yes','no','unknown'])))return null;
    for(const [field,records]of[['electricityProvider',GROUP_B_ELECTRICITY_PRICES],['internetProvider',GROUP_B_INTERNET_PRICES],['phoneProvider',GROUP_B_PHONE_PRICES]] as const){if(typeof item[field]!=='string'||(item[field]!==''&&!records.some(row=>row.id===item[field])))return null;}
    if(!item.overrides||typeof item.overrides!=='object'||Array.isArray(item.overrides))return null;
    const overrides:ConnectedBudgetScenario['overrides']={};
    for(const field of CONNECTED_BUDGET_FIELDS){const amount=item.overrides[field.id];if(amount!==undefined){if(typeof amount!=='string'||amount.length>32||amount.trim()&&parseBudgetAmount(amount)===null)return null;overrides[field.id]=amount;}}
    ids.add(item.id);result.push({id:item.id,name:item.name.trim(),linked:item.linked,communityId:item.communityId,floorPlanId:item.floorPlanId,roommates:item.roommates,electricity:item.electricity,internet:item.internet,electricityProvider:item.electricityProvider,internetProvider:item.internetProvider,phoneProvider:item.phoneProvider,transport:item.transport,f1:item.f1,tbNotCovered:item.tbNotCovered,orientationRequired:item.orientationRequired,overrides});
  }return {schema:2,scenarios:result};
}
export type BudgetLine = typeof CONNECTED_BUDGET_FIELDS[number] & PriceRange & {status:'Estimate'|'Confirmed'|'Included'|'Unknown';invalid:boolean};
const unpriced=(note='Unknown — ask for a current quote.'):PriceRange=>({lowCents:null,highCents:null,sourceUrl:'',checkedOn:null,note});
const zero=(note:string):PriceRange=>({lowCents:0,highCents:0,sourceUrl:'',checkedOn:null,note});
function divided(price:PriceRange,people:number|null):PriceRange {return people===null?unpriced('Confirm how many people split this household cost.'): {...price,lowCents:price.lowCents===null?null:Math.ceil(price.lowCents/people),highCents:price.highCents===null?null:Math.ceil(price.highCents/people),note:`${price.note} Household amount divided by ${people}.`};}
export function connectedBudgetEstimate(scenario:ConnectedBudgetScenario,answers?:SharedBudgetAnswers){
  const linked=scenario.linked&&answers;
  const communityId=linked?answers.housingCommunity??'':scenario.communityId;
  const property=GROUP_B_APARTMENT_PRICES.find(row=>row.communityId===communityId);
  const electricity=linked?answers.electricity:scenario.electricity,internet=linked?answers.internet:scenario.internet;
  const transport=linked?answers.transport??'undecided':scenario.transport;
  const people=linked&&answers.household==='alone'?1:scenario.roommates;
  const floorPlan=property?.floorPlans.find(row=>row.id===scenario.floorPlanId);
  const charge=(id:'utship'|'tb-test'|'orientation',eligible:Eligibility):PriceRange=>{
    if(eligible==='no')return zero('Marked not applicable by you.');
    if(eligible!=='yes')return unpriced('Confirm whether this charge applies; no health or immigration documents are collected.');
    const row=SPRING_2027_CHARGES.find(item=>item.id===id);if(!row)return unpriced();
    const source=SPRING_2027_SOURCES.find(item=>item.id===row.sourceId);
    return{lowCents:row.lowCents,highCents:row.highCents,sourceUrl:source?.url??'',checkedOn:source?.checkedOn??null,note:row.note};
  };
  const insurance=charge('utship',scenario.f1),policy=SPRING_2027_CHARGES.find(item=>item.id==='utship');
  const insuranceMonthly={...insurance,lowCents:insurance.lowCents===null?null:Math.ceil(insurance.lowCents/(policy?.months??5)),highCents:insurance.highCents===null?null:Math.ceil(insurance.highCents/(policy?.months??5)),note:`${insurance.note} Monthly share spreads a semester premium over ${policy?.months??5} months; billing may be upfront.`};
  const estimates:Record<ConnectedBudgetField,PriceRange>={
    rent:floorPlan?(floorPlan.basis==='person'?floorPlan:divided(floorPlan,people)):unpriced(),fees:property?divided(property.requiredMonthlyFees,people):unpriced(),
    electricity:electricity==='included'?zero('Included in rent according to your plan.'):electricity==='not_included'?divided(GROUP_B_ELECTRICITY_PRICES.find(row=>row.id===scenario.electricityProvider)??unpriced(),people):unpriced('Confirm whether electricity is included.'),
    water:unpriced('Ask whether water, sewer and trash are included or separately billed; avoid double counting housing fees.'),
    internet:internet==='included'?zero('Included in rent according to your plan.'):internet==='not_included'?divided(GROUP_B_INTERNET_PRICES.find(row=>row.id===scenario.internetProvider)??unpriced(),people):unpriced('Confirm whether internet is included.'),
    phone:GROUP_B_PHONE_PRICES.find(row=>row.id===scenario.phoneProvider)??unpriced(),transport:transport==='walking'?zero('Walking selected in your plan; add a quote for other travel you expect.'):{...unpriced(transport==='transit'?'Eligible enrolled UTD students can request a DART GoPass at no additional charge; other rides and eligibility are unconfirmed. Enter your expected out-of-pocket amount.':'Add parking, permit, fuel, insurance or rides as applicable.'),...(transport==='transit'?{sourceUrl:'https://services.utdallas.edu/transit/dart/',checkedOn:'2026-10-27'}:{})},
    insurance:insuranceMonthly,groceries:unpriced('Enter your own grocery and dining budget; no unsourced typical range is assumed.'),personal:unpriced(),application:property?.application??unpriced(),admin:property?.admin??unpriced(),deposit:property?.deposit??unpriced(),utilityDeposit:unpriced(),setup:unpriced('Include January bedding, kitchen items and furniture not covered by the lease.'),tb:charge('tb-test',scenario.tbNotCovered),orientation:charge('orientation',scenario.orientationRequired),
  };
  const lines:BudgetLine[]=CONNECTED_BUDGET_FIELDS.map(field=>{const raw=scenario.overrides[field.id],value=parseBudgetAmount(raw),invalid=!!raw?.trim()&&value===null;const price=value!==null?{...estimates[field.id],lowCents:value,highCents:value,note:'Your entered amount per person replaces the estimate. Confirm all taxes, fees and billing terms.'}:invalid?unpriced('Invalid amount; use a number from 0 to 1,000,000 with at most two decimal places.'):estimates[field.id];return{...price,...field,invalid,status:value!==null?'Confirmed':price.lowCents===null||price.highCents===null?'Unknown':price.lowCents===0&&price.highCents===0?'Included':'Estimate'};});
  const sum=(rows:BudgetLine[])=>({lowCents:rows.some(row=>row.lowCents!==null)?rows.reduce((total,row)=>total+(row.lowCents??0),0):null,highCents:rows.some(row=>row.highCents!==null)?rows.reduce((total,row)=>total+(row.highCents??0),0):null,unknownCount:rows.filter(row=>row.lowCents===null||row.highCents===null).length});
  const monthly=sum(lines.filter(row=>row.basis==='monthly'));const moveIn=sum(lines);
  // Monthly insurance is amortized. Upfront cash replaces that share with the full premium, without counting both.
  const insuranceLine=lines.find(row=>row.id==='insurance')!;
  if(scenario.f1==='yes'&&!scenario.overrides.insurance?.trim()&&insurance.lowCents!==null&&insuranceLine.lowCents!==null&&moveIn.lowCents!==null&&moveIn.highCents!==null){moveIn.lowCents+=insurance.lowCents-insuranceLine.lowCents;moveIn.highCents+=(insurance.highCents??insurance.lowCents)-(insuranceLine.highCents??insuranceLine.lowCents);}
  const phone=GROUP_B_PHONE_PRICES.find(row=>row.id===scenario.phoneProvider);const phoneLine=lines.find(row=>row.id==='phone')!;
  if(phone?.upfrontCents&&!scenario.overrides.phone?.trim()&&moveIn.lowCents!==null&&moveIn.highCents!==null&&phoneLine.lowCents!==null){moveIn.lowCents+=Math.max(0,phone.upfrontCents-phoneLine.lowCents);moveIn.highCents+=Math.max(0,phone.upfrontCents-(phoneLine.highCents??phoneLine.lowCents));}
  return{lines,monthly,moveIn,communityId,people};
}
export function importLegacyBudget(value:unknown,answers?:SharedBudgetAnswers):ConnectedBudgetDocument|null {
  const rows=readBudgetScenarios(value);if(!rows)return null;
  const keys={housing:'rent',utilities:'electricity',internet:'internet',phone:'phone',food:'groceries',transport:'transport',insurance:'insurance',other:'personal',oneTime:'setup',refundable:'deposit'} as const;
  const scenarios=rows.map(row=>{const scenario=newConnectedBudgetScenario(row.id,row.name||'Imported scenario',answers);for(const [old,next]of Object.entries(keys)){const raw=row.amounts[old as keyof typeof row.amounts];if(raw!==undefined)scenario.overrides[next]=raw;}return scenario;});
  return readConnectedBudgetDocument({schema:2,scenarios});
}
