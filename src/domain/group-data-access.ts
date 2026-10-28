import { siteGroupForHost } from './site-groups.ts';
export type GroupDataKind='arrival'|'budget'|'reminders';
export function groupDataTable(host:string|null,kind:string,development=false){
  const group=siteGroupForHost(host,development);
  if(group==='a'&&kind==='arrival')return 'group_a_saved_tools';
  if(group==='b'&&(kind==='budget'||kind==='reminders'))return 'group_b_saved_tools';
  return null;
}
export function expectedGroupRevision(value:unknown):value is number{return Number.isSafeInteger(value)&&typeof value==='number'&&value>=0&&value<2_147_483_647;}
