import { redirect } from 'next/navigation';
import { accountsEnabled, identity } from '@/lib/server';
import { Workspace } from './workspace';
import { requestSiteGroup } from '@/lib/site-group';
export async function ProtectedWorkspace({screen,taskId}:{screen:string;taskId?:string}){
  if(!accountsEnabled())redirect('/login');
  const {user,loginVerified}=await identity();
  if(!user)redirect('/login');if(!loginVerified)redirect('/login');
  const group=await requestSiteGroup();
  return <Workspace key={user.id} mode="account" accountId={user.id} screen={screen} taskId={taskId} group={group} supportEmail={process.env.SUPPORT_EMAIL}/>;
}
