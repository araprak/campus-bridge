'use client';
import { useId, useState } from 'react';
import { HOUSING_COST_FIELDS, estimateHousingCost, initialHousingCost, type CostItem, type HousingCostField } from '@/domain/housing-cost';
const dollars = (amount: number) => amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
export function HousingCostEstimator() {
  const id = useId();
  const [input, setInput] = useState(initialHousingCost);
  const estimate = estimateHousingCost(input);
  function setItem(key: HousingCostField | 'oneTime', patch: Partial<CostItem>) {
    setInput(current => key === 'oneTime' ? { ...current, oneTime: { ...current.oneTime, ...patch } } : { ...current, monthly: { ...current.monthly, [key]: { ...current.monthly[key], ...patch } } });
  }
  function item(key: HousingCostField | 'oneTime', label: string) {
    const value = key === 'oneTime' ? input.oneTime : input.monthly[key];
    return <div className="housing-cost-item" key={key}><label htmlFor={`${id}-${key}`}>{label}</label><select id={`${id}-${key}`} value={value.status} onChange={e => setItem(key, { status: e.target.value as CostItem['status'] })}><option value="unknown">Unknown</option><option value="included">{key === 'rent' || key === 'oneTime' ? 'No charge' : 'Included / no extra charge'}</option><option value="amount">Enter amount</option></select>{value.status === 'amount' && <input aria-label={`${label} in US dollars`} type="number" min="0" max="1000000" step="0.01" inputMode="decimal" placeholder="USD" value={value.amount} onChange={e => setItem(key, { amount: e.target.value })}/>}</div>;
  }
  return <details className="housing-cost-estimator"><summary>Estimate my housing costs</summary><p>Optional planning tool using amounts you enter. These are your estimates, not verified property quotes. Entries last until you leave this housing view.</p>
    <div className="housing-cost-basis"><label htmlFor={`${id}-basis`}>Amounts describe<select id={`${id}-basis`} value={input.basis} onChange={e => setInput(current => ({ ...current, basis: e.target.value as typeof current.basis }))}><option value="per_person">My per-person / per-bed costs</option><option value="whole_unit">Whole household, shared equally</option></select></label>{input.basis === 'whole_unit' && <label htmlFor={`${id}-people`}>People sharing all entered costs<input id={`${id}-people`} type="number" min="1" max="20" step="1" value={input.people} onChange={e => setInput(current => ({ ...current, people: e.target.value }))}/></label>}</div>
    <p className="discovery-note">{input.basis === 'whole_unit' ? 'Every amount below is divided equally among the number of people entered. Use per-person mode if costs have different shares.' : 'Enter only your share of each cost; do not add a whole-unit rent to your per-person bills.'}</p>
    <fieldset><legend>Recurring monthly costs · USD</legend>{HOUSING_COST_FIELDS.map(field => item(field.id, field.label))}</fieldset>
    <fieldset><legend>Separate move-in costs · USD</legend>{item('oneTime', 'One-time fees and deposits')}<small>Include application fees, deposits and other move-in charges here. Refundable deposits still require cash upfront.</small></fieldset>
    <div className="housing-cost-result" aria-live="polite">{!estimate.validShare ? <p>Enter a whole number from 1 to 20 people.</p> : <><strong>{estimate.monthly === null ? 'Monthly estimate unavailable' : `${estimate.complete ? 'Entered monthly estimate' : 'Known monthly subtotal'}: ${dollars(estimate.monthly)} per person`}</strong>{estimate.unknown.length > 0 && <p>Still unknown or incomplete: {estimate.unknown.join(', ')}. This subtotal is not a complete housing budget.</p>}<p>One-time move-in costs: {estimate.oneTime === null ? 'Unknown' : `${dollars(estimate.oneTime)} per person`}. Separate from the monthly estimate.</p></>}</div>
    <p className="discovery-note">Confirm rent, required fees, utility inclusions and lease terms with the community. Other costs may apply. Blank or invalid amounts stay unknown.</p>
  </details>;
}
