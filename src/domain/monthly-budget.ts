export const MONTHLY_BUDGET_FIELDS = [
  {id: 'housing', label: 'Your share of rent / housing'},
  {id: 'utilities', label: 'Electricity, water & other utilities'},
  {id: 'internet', label: 'Home internet'},
  {id: 'phone', label: 'Phone'},
  {id: 'food', label: 'Groceries & dining'},
  {id: 'transport', label: 'Transport & parking'},
  {id: 'insurance', label: 'Insurance (monthly share)'},
  {id: 'other', label: 'Other monthly costs'},
] as const;
export type BudgetField = typeof MONTHLY_BUDGET_FIELDS[number]['id'];
export type BudgetDraft = Partial<Record<BudgetField | 'funds' | 'setup', string>>;
export function parseBudgetAmount(value: string | undefined): number | null {
  if (value === undefined || value.trim() === '') return null;
  if (!/^\d+(?:\.\d{1,2})?$/.test(value.trim())) return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount <= 1000000 ? Math.round(amount * 100) : null;
}
/** Money is added as whole cents; an unentered line is unknown, not a price estimate. */
export function calculateMonthlyBudget(draft: BudgetDraft) {
  const entries = MONTHLY_BUDGET_FIELDS.map(field => ({...field, cents: parseBudgetAmount(draft[field.id])}));
  const entered = entries.filter(entry => entry.cents !== null);
  const invalid = Object.entries(draft).filter(([, value]) => value?.trim() && parseBudgetAmount(value) === null).map(([key]) => key);
  const monthlyCents = entered.reduce((sum, entry) => sum + entry.cents!, 0);
  const setupCents = parseBudgetAmount(draft.setup);
  const fundsCents = parseBudgetAmount(draft.funds);
  return {monthlyCents, setupCents, firstMonthCents: monthlyCents + (setupCents ?? 0), balanceCents: fundsCents === null ? null : fundsCents - monthlyCents, enteredCount: entered.length, missingCount: entries.length - entered.length, invalid};
}
