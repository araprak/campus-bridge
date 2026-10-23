import type { Answers } from '../lib/model';

const dependencies: (keyof Answers)[][] = [
  ['transport','hasCar','transitMode','rentalHelp','carArrival'],
  ['housingLocation','housingType','housingCommunity','housingZip','leaseStartDate','electricity','internet'],
];
const equal = (a: unknown,b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Rebase only the edited values. Dependent changes require an explicit review. */
export function preferencePatch(base: Answers, current: Answers, draft: Partial<Answers>) {
  const keys = (Object.keys(draft) as (keyof Answers)[]).filter(key=>!equal(base[key],draft[key]));
  const guarded = new Set<keyof Answers>(keys);
  for(const group of dependencies) if(group.some(key=>keys.includes(key))) group.forEach(key=>guarded.add(key));
  const conflicts = [...guarded].filter(key=>!equal(base[key],current[key]) && !(keys.includes(key)&&equal(draft[key],current[key])));
  const patch = Object.fromEntries(keys.map(key=>[key,draft[key]])) as Partial<Answers>;
  return {patch,conflicts};
}
