/** Pure domain logic. No account authorization, storage, UI, or network dependencies. */
export const CATEGORIES = [
  'housing', 'transportation', 'services', 'campus', 'daily_life',
] as const;
export type Category = typeof CATEGORIES[number];
export const DEFAULT_CATEGORY_ORDER: readonly Category[] = [
  'housing', 'services', 'transportation', 'campus', 'daily_life',
];
export type Transport = 'transit' | 'car' | 'walking' | 'undecided';
export const TRANSIT_MODE_OPTIONS = ['campus_bus','public_transit','rideshare','carpool','mixed','undecided'] as const;
export type TransitMode = typeof TRANSIT_MODE_OPTIONS[number];
export const RENTAL_HELP_OPTIONS = ['yes','no','undecided'] as const;
export type RentalHelp = typeof RENTAL_HELP_OPTIONS[number];
export type Horizon = 'first_48_hours' | 'first_week' | 'first_30_days';
export type PlanStage = 'before_arrival' | Horizon;
export type TaskState = 'pending' | 'completed' | 'not_applicable';
export type Inclusion = 'included' | 'not_included' | 'unknown';
export type RuleKey = 'always' | 'off_campus' | 'on_campus' | 'electricity_setup'
  | 'internet_setup' | 'electricity_unknown' | 'internet_unknown' | 'roommates'
  | 'parking' | 'campus_transport' | 'dart_pass';

export interface PlanAnswers {
  arrivalDate: string;
  housingLocation: 'on_campus' | 'off_campus';
  household: 'alone' | 'roommates';
  electricity: Inclusion;
  internet: Inclusion;
  hasCar: boolean;
  transport?: Transport;
  transitMode?: TransitMode;
  rentalHelp?: RentalHelp;
  priorities: readonly Category[];
}
export interface TaskTemplate {
  id: string;
  title: string;
  category: Category;
  horizon: Horizon;
  priority: 'high' | 'standard';
  rule: RuleKey;
}
export interface ProgressRecord {
  completedAt: string | null;
  notApplicableAt?: string | null;
  updatedAt?: string;
}
export type Progress = Readonly<Record<string, ProgressRecord>>;
export interface PlanTask extends TaskTemplate {
  reasons: string[];
  completedAt: string | null;
  notApplicableAt: string | null;
  state: TaskState;
  stage: PlanStage;
  urgencyReason: string | null;
  timing: 'upcoming' | 'current' | 'earlier';
}


/** Retain both historical IDs for persisted progress and rollback clients. */
export const UTILITY_TASK_ALIASES: Readonly<Record<string, string>> = {
  'confirm-electricity-responsibility': 'arrange-electricity',
  'confirm-internet-responsibility': 'arrange-home-internet',
};
export function canonicalTaskId(id: string): string { return UTILITY_TASK_ALIASES[id] ?? id; }
export function taskState(record?: ProgressRecord): TaskState {
  return record?.notApplicableAt ? 'not_applicable' : record?.completedAt ? 'completed' : 'pending';
}
/** updatedAt includes explicit undo. Ties prefer the canonical row, as in SQL. */
export function taskProgress(progress: Progress, id: string): ProgressRecord {
  const canonical = canonicalTaskId(id);
  const ids = [canonical, ...Object.keys(UTILITY_TASK_ALIASES).filter(alias => UTILITY_TASK_ALIASES[alias] === canonical)];
  let selected: ProgressRecord | undefined;
  let latest = -1n;
  for (const key of ids) {
    const row = progress[key];
    if (!row) continue;
    const date = row.updatedAt ?? row.notApplicableAt ?? row.completedAt;
    // PostgreSQL timestamps carry microseconds; retain them when JS milliseconds tie.
    const fraction = date?.match(/\.(\d+)(?:Z|[+-]\d{2}:?\d{2})$/)?.[1] ?? '';
    const updated = date ? BigInt(Date.parse(date)) * 1_000_000n + BigInt(fraction.slice(3, 9).padEnd(6, '0') || '0') : 0n;
    if (!selected || updated > latest) { selected = row; latest = updated; }
  }
  return selected ?? { completedAt: null };
}
export function progressForState(state: TaskState, now = new Date().toISOString()): ProgressRecord {
  return { completedAt: state === 'completed' ? now : null, notApplicableAt: state === 'not_applicable' ? now : null, updatedAt: now };
}
export function updateTaskProgress(progress: Progress, id: string, state: TaskState, now = new Date().toISOString()): Progress {
  const canonical = canonicalTaskId(id);
  const record = progressForState(state, now);
  const next = { ...progress, [canonical]: record };
  for (const [alias, target] of Object.entries(UTILITY_TASK_ALIASES)) if (target === canonical) next[alias] = record;
  return next;
}
export function summarizeTasks(tasks: readonly Pick<PlanTask, 'state'>[]) {
  const completed = tasks.filter(task => task.state === 'completed').length;
  const pending = tasks.filter(task => task.state === 'pending').length;
  const notApplicable = tasks.filter(task => task.state === 'not_applicable').length;
  const total = completed + pending;
  return { completed, total, percent: total ? Math.round(completed / total * 100) : 0, pending, notApplicable };
}
export const PLAN_STAGES: readonly { id: PlanStage; label: string }[] = [
  { id: 'before_arrival', label: 'Before arrival' },
  { id: 'first_48_hours', label: 'First 48 hours' },
  { id: 'first_week', label: 'First week' },
  { id: 'first_30_days', label: 'First month' },
];
const preparationTasks = new Set(['confirm-off-campus-move-in', 'prepare-on-campus-check-in', 'arrange-electricity', 'arrange-home-internet', 'plan-campus-transit', 'arrange-campus-parking', 'check-student-tech']);
const essentialTasks = new Set(['confirm-off-campus-move-in', 'prepare-on-campus-check-in', 'arrange-electricity', 'arrange-home-internet', 'plan-campus-transit']);
function stageTiming(stage: PlanStage, days: number): PlanTask['timing'] {
  if (stage === 'before_arrival') return days < 0 ? 'current' : 'earlier';
  return days > endDay[stage] ? 'earlier' : days < startDay[stage] ? 'upcoming' : 'current';
}
function utilityReason(utility: 'electricity' | 'internet', a: PlanAnswers): string {
  if (a.housingLocation === 'on_campus') return `Use your housing instructions to confirm ${utility} is ready; contact housing support if needed.`;
  if (a[utility] === 'included') return `Your housing includes ${utility}; confirm how to access it with your housing provider.`;
  if (a[utility] === 'unknown') return `Confirm who provides ${utility}, then follow the appropriate housing or separate-service setup instructions.`;
  return `You are responsible for ${utility}; confirm activation and access for your move-in date.`;
}

const horizons: readonly Horizon[] = ['first_48_hours', 'first_week', 'first_30_days'];
const endDay: Record<Horizon, number> = { first_48_hours: 1, first_week: 6, first_30_days: 29 };
const startDay: Record<Horizon, number> = { first_48_hours: 0, first_week: 2, first_30_days: 7 };

function calendarDay(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Use a valid calendar date.');
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error('Use a valid calendar date.');
  }
  return date.getTime() / 86_400_000;
}

function validateAnswers(a: PlanAnswers): void {
  calendarDay(a.arrivalDate);
  if (!['on_campus', 'off_campus'].includes(a.housingLocation)
    || !['alone', 'roommates'].includes(a.household)
    || !['included', 'not_included', 'unknown'].includes(a.electricity)
    || !['included', 'not_included', 'unknown'].includes(a.internet)
    || typeof a.hasCar !== 'boolean'
    || !Array.isArray(a.priorities)
    || (a.transport !== undefined && !['transit', 'car', 'walking', 'undecided'].includes(a.transport))
    || ('transitMode' in a && !TRANSIT_MODE_OPTIONS.includes(a.transitMode as TransitMode))
    || ('rentalHelp' in a && !RENTAL_HELP_OPTIONS.includes(a.rentalHelp as RentalHelp))
    || a.priorities.length > CATEGORIES.length
    || new Set(a.priorities).size !== a.priorities.length
    || a.priorities.some(p => !CATEGORIES.includes(p))) {
    throw new Error('The plan answers contain an unsupported value.');
  }
}

/** Older saved answers can contain car access from a previously selected mode. */
export function effectiveHasCar(a: Pick<PlanAnswers, 'hasCar' | 'transport'>): boolean {
  return a.hasCar && (a.transport === undefined || a.transport === 'car');
}

/** Calendar arithmetic stays stable across timezones, daylight saving, and leap days. */
export function arrivalTimeline(arrivalDate: string, todayDallas: string) {
  const daysSinceArrival = calendarDay(todayDallas) - calendarDay(arrivalDate);
  const daysUntilArrival = Math.max(0, -daysSinceArrival);
  const phase = daysSinceArrival < 0 ? 'before_arrival' as const
    : daysSinceArrival === 0 ? 'arrival_day' as const : 'settling_in' as const;
  return {
    daysUntilArrival, daysSinceArrival, phase,
    label: phase === 'before_arrival'
      ? `${daysUntilArrival} ${daysUntilArrival === 1 ? 'day' : 'days'} until your arrival`
      : phase === 'arrival_day' ? 'Your arrival day'
        : `${daysSinceArrival} ${daysSinceArrival === 1 ? 'day' : 'days'} since your arrival`,
    description: phase === 'before_arrival'
      ? 'Your arrival countdown: find a home, arrange the essentials, and prepare for campus.'
      : phase === 'arrival_day' ? 'Welcome to Dallas. Use your plan to settle in at your own pace.'
        : 'Keep your plan moving at your own pace. Unfinished steps stay available.',
  };
}

/** Selected topics lead without hiding essentials from the rest of the plan. */
export function orderedCategories(priorities: readonly Category[]): Category[] {
  return [
    ...DEFAULT_CATEGORY_ORDER.filter(category => priorities.includes(category)),
    ...DEFAULT_CATEGORY_ORDER.filter(category => !priorities.includes(category)),
  ];
}

const taskOrder = [
  'confirm-off-campus-move-in', 'prepare-on-campus-check-in', 'review-roommate-routine',
  'confirm-electricity-responsibility', 'arrange-electricity',
  'confirm-internet-responsibility', 'arrange-home-internet', 'set-up-mobile-service',
  'plan-campus-transit', 'check-dart-pass', 'arrange-campus-parking',
  'check-student-tech', 'get-comet-card', 'find-campus-destinations',
  'plan-campus-meals', 'save-essentials-support',
];
const taskRank = (id: string) => {
  const rank = taskOrder.indexOf(id);
  return rank < 0 ? taskOrder.length : rank;
};

/** Registry keys are stable and can be seeded as task_rules metadata. */
const rules: Record<RuleKey, (a: PlanAnswers, beforeArrival: boolean) => string | null> = {
  always: () => 'This is a general starting point for your arrival plan.',
  off_campus: (a, beforeArrival) => a.housingLocation === 'off_campus'
    ? beforeArrival ? 'You said you plan to live off campus.' : 'You said you live off campus.' : null,
  on_campus: (a, beforeArrival) => a.housingLocation === 'on_campus'
    ? beforeArrival ? 'You said you plan to live on campus.' : 'You said you live on campus.' : null,
  electricity_setup: (a, beforeArrival) => a.housingLocation === 'off_campus' && a.electricity === 'not_included'
    ? beforeArrival ? 'You plan to live off campus and electricity will not be included.'
      : 'You live off campus and electricity is not included.' : null,
  internet_setup: (a, beforeArrival) => a.housingLocation === 'off_campus' && a.internet === 'not_included'
    ? beforeArrival ? 'You plan to live off campus and internet will not be included.'
      : 'You live off campus and internet is not included.' : null,
  electricity_unknown: (a, beforeArrival) => a.electricity === 'unknown'
    ? beforeArrival ? 'Confirm whether electricity will be included in your housing before arranging service.'
      : 'Confirm whether your housing provides electricity before arranging service.' : null,
  internet_unknown: (a, beforeArrival) => a.internet === 'unknown'
    ? beforeArrival ? 'Confirm whether internet will be included in your housing before arranging service.'
      : 'Confirm whether your housing provides internet before arranging service.' : null,
  roommates: (a, beforeArrival) => a.household === 'roommates'
    ? beforeArrival ? 'You plan to share your home; agree who will handle shared services.'
      : 'You share your home; agree who handles shared services.' : null,
  dart_pass: a => a.transport==='car' ? null : 'Use a student transit pass if your plans include DART buses or trains.',
  parking: (a, beforeArrival) => effectiveHasCar(a)
    ? beforeArrival ? 'You said you will have access to a car; check official campus parking guidance.'
      : 'You have access to a car; check official campus parking guidance.' : null,
  campus_transport: (a, beforeArrival) => effectiveHasCar(a)
    ? 'Check your travel options for getting to campus.'
    : a.transport === 'car'
      ? a.rentalHelp === 'yes'
        ? 'You plan to drive but have not arranged a car. Compare rental options and keep a backup route to campus.'
        : 'You plan to drive but have not arranged a car; keep a backup route to campus while you make arrangements.'
    : beforeArrival ? 'You do not expect to have access to a car; plan a way to reach campus.'
      : 'You do not have access to a car; plan a way to reach campus.',
};

/**
 * Caller supplies today's Dallas calendar date. This makes tests repeatable and
 * avoids UTC midnight changing a student's date. Time groups are guidance,
 * never official deadlines. Input progress is never mutated or pruned.
 */
export function generatePlan(
  answers: PlanAnswers,
  templates: readonly TaskTemplate[],
  progress: Progress,
  todayDallas: string,
) {
  validateAnswers(answers);
  const arrival = arrivalTimeline(answers.arrivalDate, todayDallas);
  const { daysSinceArrival } = arrival;
  const categoryOrder = orderedCategories(answers.priorities);
  const identifiers = new Set<string>();
  const tasks: PlanTask[] = [];
  for (const template of templates) {
    if (!template.id || identifiers.has(template.id)) throw new Error('Task IDs must be unique.');
    identifiers.add(template.id);
    if (!Object.hasOwn(rules, template.rule) || !horizons.includes(template.horizon)
      || !CATEGORIES.includes(template.category)
      || !['high', 'standard'].includes(template.priority)) {
      throw new Error('Unsupported task definition.');
    }
    if (Object.hasOwn(UTILITY_TASK_ALIASES, template.id)) continue;
    const utility = template.id === 'arrange-electricity' ? 'electricity' : template.id === 'arrange-home-internet' ? 'internet' : null;
    const explanation = utility ? utilityReason(utility, answers) : rules[template.rule](answers, daysSinceArrival < 0);
    if (explanation === null) continue;
    let horizon = template.horizon;
    let priority = template.priority;
    if (template.rule === 'campus_transport' && !effectiveHasCar(answers)) {
      horizon = 'first_48_hours';
      priority = 'high';
    }
    if (template.rule === 'electricity_setup') {
      horizon = 'first_48_hours';
      priority = 'high';
    }
    const reasons = [explanation];
    if (answers.priorities.includes(template.category)) {
      priority = 'high';
      reasons.push('You selected this topic as a setup priority.');
    }
    const timing = daysSinceArrival > endDay[horizon] ? 'earlier'
      : daysSinceArrival < startDay[horizon] ? 'upcoming' : 'current';
    if (timing === 'earlier') reasons.push('This earlier step is still available in your plan.');
    if (daysSinceArrival >= 0 && daysSinceArrival <= 1 && horizon === 'first_48_hours') {
      reasons.push('You recently arrived; this is a useful first step.');
    }
    const saved = taskProgress(progress, template.id);
    const stage: PlanStage = preparationTasks.has(template.id) ? 'before_arrival' : horizon;
    const urgencyReason = essentialTasks.has(template.id) && daysSinceArrival >= -7
      ? daysSinceArrival < 0 ? 'Prepare this essential before your upcoming arrival.' : 'An arrival essential is still waiting; review it when you can.'
      : null;
    tasks.push({ ...template, horizon, priority, reasons, timing, stage, urgencyReason,
      state: taskState(saved), notApplicableAt: saved.notApplicableAt ?? null,
      completedAt: saved.completedAt ?? null });
  }
  tasks.sort((a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category)
    || taskRank(a.id) - taskRank(b.id)
    || horizons.indexOf(a.horizon) - horizons.indexOf(b.horizon)
    || Number(b.priority === 'high') - Number(a.priority === 'high')
    || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const nextTasks = tasks.filter(task => task.state === 'pending').sort((a, b) =>
    Number(Boolean(b.urgencyReason)) - Number(Boolean(a.urgencyReason))
    || Number(answers.priorities.includes(b.category)) - Number(answers.priorities.includes(a.category))
    || taskRank(a.id) - taskRank(b.id)
    || DEFAULT_CATEGORY_ORDER.indexOf(a.category) - DEFAULT_CATEGORY_ORDER.indexOf(b.category)
    || a.id.localeCompare(b.id)).slice(0, 3);
  return {
    ruleVersion: 3,
    daysSinceArrival,
    arrival,
    categoryOrder,
    tasks,
    nextTasks,
    nextTask: nextTasks[0] ?? null,
    stages: PLAN_STAGES.map(stage => ({ ...stage, timing: stageTiming(stage.id, daysSinceArrival),
      tasks: tasks.filter(task => task.stage === stage.id),
      pending: tasks.filter(task => task.stage === stage.id && task.state === 'pending').length })),
    progress: summarizeTasks(tasks),
  };
}
