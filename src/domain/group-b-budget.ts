import { MONTHLY_BUDGET_FIELDS, parseBudgetAmount, type BudgetField } from './monthly-budget.ts';

export { MONTHLY_BUDGET_FIELDS };
export type ScenarioField = BudgetField | 'oneTime' | 'refundable';
export type BudgetScenario = { id: string; name: string; amounts: Partial<Record<ScenarioField, string>> };
export const SCENARIO_FIELDS = [...MONTHLY_BUDGET_FIELDS.map(field => field.id), 'oneTime', 'refundable'] as const;

export function newBudgetScenario(id: string, name: string): BudgetScenario {
  return { id, name, amounts: {} };
}

/** All arithmetic uses integer cents. Missing lines never become a complete total. */
export function compareBudgetScenario(scenario: BudgetScenario) {
  const monthly = MONTHLY_BUDGET_FIELDS.map(field => ({ ...field, cents: parseBudgetAmount(scenario.amounts[field.id]) }));
  const known = monthly.filter(field => field.cents !== null);
  const monthlySubtotalCents = known.length ? known.reduce((sum, field) => sum + field.cents!, 0) : null;
  const oneTimeCents = parseBudgetAmount(scenario.amounts.oneTime);
  const refundableCents = parseBudgetAmount(scenario.amounts.refundable);
  const monthlyComplete = known.length === MONTHLY_BUDGET_FIELDS.length;
  const knownCosts = [monthlySubtotalCents, oneTimeCents, refundableCents].filter((value): value is number => value !== null);
  const moveInSubtotalCents = knownCosts.length ? knownCosts.reduce((sum, value) => sum + value, 0) : null;
  const complete = monthlyComplete && oneTimeCents !== null && refundableCents !== null;
  const invalid = SCENARIO_FIELDS.filter(key => scenario.amounts[key]?.trim() && parseBudgetAmount(scenario.amounts[key]) === null);
  return { monthlySubtotalCents, oneTimeCents, refundableCents, moveInSubtotalCents, monthlyComplete, complete, unknownMonthlyCount: monthly.length - known.length, invalid };
}

export function readBudgetScenarios(value: unknown): BudgetScenario[] | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > 3) return null;
  const ids = new Set<string>();
  const scenarios: BudgetScenario[] = [];
  for (const row of value) {
    if (!row || typeof row !== 'object' || typeof row.id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(row.id) || ids.has(row.id)
      || typeof row.name !== 'string' || row.name.length > 60 || !row.amounts || typeof row.amounts !== 'object' || Array.isArray(row.amounts)) return null;
    const amounts: BudgetScenario['amounts'] = {};
    for (const key of SCENARIO_FIELDS) {
      const entry = row.amounts[key];
      if (entry !== undefined && (typeof entry !== 'string' || entry.length > 32)) return null;
      if (entry !== undefined) amounts[key] = entry;
    }
    ids.add(row.id);
    scenarios.push({ id: row.id, name: row.name, amounts });
  }
  return scenarios;
}

export function groupBStorageKey(accountId: string, host: string, feature: 'budget' | 'reminders') {
  return `campusbridge:group-b:v1:${encodeURIComponent(host)}:${encodeURIComponent(accountId)}:${feature}`;
}

/** Called after account deletion; only this account's Group B records are removed. */
export function clearGroupBLocalData(storage: Storage, accountId: string) {
  const suffixes = [`:${encodeURIComponent(accountId)}:budget`, `:${encodeURIComponent(accountId)}:reminders`];
  const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index));
  for (const key of keys) {
    if (key?.startsWith('campusbridge:group-b:v1:') && suffixes.some(suffix => key.endsWith(suffix))) storage.removeItem(key);
  }
}
