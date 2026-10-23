export const HOUSING_COST_FIELDS = [
  { id: 'rent', label: 'Base rent' },
  { id: 'fees', label: 'Mandatory monthly fees' },
  { id: 'electricity', label: 'Electricity' },
  { id: 'internet', label: 'Internet' },
  { id: 'water', label: 'Water, sewer & trash' },
  { id: 'insurance', label: 'Renter’s insurance' },
  { id: 'optional', label: 'Optional monthly charges' },
] as const;
export type HousingCostField = typeof HOUSING_COST_FIELDS[number]['id'];
export type CostItem = { status: 'unknown' | 'included' | 'amount'; amount: string };
export type HousingCostInput = { basis: 'whole_unit' | 'per_person'; people: string; monthly: Record<HousingCostField, CostItem>; oneTime: CostItem };
export function initialHousingCost(): HousingCostInput {
  return { basis: 'per_person', people: '1', monthly: Object.fromEntries(HOUSING_COST_FIELDS.map(field => [field.id, { status: 'unknown', amount: '' }])) as HousingCostInput['monthly'], oneTime: { status: 'unknown', amount: '' } };
}
function amount(item: CostItem): number | null {
  if (item.status === 'included') return 0;
  if (item.status !== 'amount' || !/^\d+(?:\.\d{1,2})?$/.test(item.amount.trim())) return null;
  const number = Number(item.amount);
  return Number.isFinite(number) && number >= 0 && number <= 1_000_000 ? number : null;
}
export function estimateHousingCost(input: HousingCostInput) {
  const people = input.basis === 'whole_unit' ? Number(input.people) : 1;
  const validShare = Number.isInteger(people) && people >= 1 && people <= 20;
  const divisor = validShare ? people : 1;
  const unknown = HOUSING_COST_FIELDS.filter(field => amount(input.monthly[field.id]) === null).map(field => field.label);
  const subtotal = HOUSING_COST_FIELDS.reduce((total, field) => total + (amount(input.monthly[field.id]) ?? 0), 0);
  const knownCount = HOUSING_COST_FIELDS.length - unknown.length;
  const oneTime = amount(input.oneTime);
  return { monthly: validShare && knownCount > 0 ? subtotal / divisor : null, unknown, knownCount, complete: validShare && unknown.length === 0, validShare, oneTime: validShare && oneTime !== null ? oneTime / divisor : null };
}
