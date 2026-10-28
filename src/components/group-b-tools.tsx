'use client';
import type { StudentState } from '@/lib/model';
import { GroupBConnectedBudget } from './group-b-connected-budget';
import { GroupBStudentReminders } from './group-b-student-reminders';
import { GroupBTrust } from './group-b-trust';
import styles from './group-b-tools.module.css';
function GroupBContent({state,accountId}:{state:StudentState;accountId:string}){
 return <div className={styles.tools}><header className={styles.intro}><p className={styles.kicker}>Group B</p><h1>Your budget, reminders and trusted guidance</h1><p>Build your estimate from the plan, keep the next deadlines together and check official sources. You choose what to save to your account.</p><nav aria-label="Group B tools"><a href="#group-b-budget">Budgets</a><a href="#group-b-reminders">Reminders</a><a href="#group-b-trust">Terms and sources</a></nav></header><div id="group-b-budget"><GroupBConnectedBudget state={state} accountId={accountId}/></div><div id="group-b-reminders"><GroupBStudentReminders state={state} accountId={accountId}/></div><div id="group-b-trust"><GroupBTrust/></div></div>;
}
export function GroupBTools(props:{state:StudentState;accountId:string;supportEmail?:string}){return <GroupBContent key={props.accountId} {...props}/>;}
