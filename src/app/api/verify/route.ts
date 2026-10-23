import { createHmac, randomInt } from 'node:crypto';
import { accountsEnabled, adminClient, assertOrigin, identity, jsonBody, reply } from '@/lib/server';
export const runtime='nodejs';
export async function POST(request:Request){
  try{
    assertOrigin(request);
    if(!accountsEnabled())return reply({error:'Account access is not available yet.'},503);
    const {user,verified,loginVerified}=await identity();if(!user||!user.email_confirmed_at)return reply({error:'Confirm your login email and log in before verifying your UTD email.'},401);
    if(!loginVerified)return reply({error:'Your session expired. Please log in again.',redirect:'/login'},403);
    if(verified)return reply({redirect:'/dashboard#plan-campus'});
    const body=await jsonBody(request);const email=typeof body.email==='string'?body.email.trim().toLowerCase():'';
    if(email.length>254||!/^[-a-z0-9.!#$%&'*+/=?^_`{|}~]+@utdallas\.edu$/.test(email))return reply({error:'Enter a valid @utdallas.edu email address.'},400);
    const secret=process.env.VERIFICATION_SECRET;
    if(!secret||secret.length<32)return reply({error:'University email verification is being prepared. Please try again later.'},503);
    const digest=(code:string)=>createHmac('sha256',secret).update(JSON.stringify([user.id,email,code])).digest('hex');
    const admin=adminClient();
    if(body.action==='redeem'){
      if(typeof body.code!=='string'||!/^\d{6}$/.test(body.code))return reply({error:'Enter the six-digit code from your email.'},400);
      const {data,error}=await admin.rpc('redeem_utd_challenge',{p_user:user.id,p_email:email,p_digest:digest(body.code)});
      if(error)return reply({error:'Verification could not be completed. Please try again.'},503);
      return data?reply({redirect:'/dashboard#plan-campus'}):reply({error:'That code could not be verified. It may be incorrect, expired, or already used. Request a new code if needed.'},400);
    }
    if(body.action!=='send')return reply({error:'Unknown verification action.'},400);
    if(!process.env.RESEND_API_KEY||!process.env.VERIFICATION_FROM)return reply({error:'Verification email is not available yet. Please try again later.'},503);
    const code=String(randomInt(0,1_000_000)).padStart(6,'0');
    // Vercel overwrites this forwarding header; do not trust arbitrary client IP headers elsewhere.
    const network=process.env.VERCEL?request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()||'unknown-vercel':'local';
    const ipDigest=createHmac('sha256',secret).update(network).digest('hex');
    const {data:challenge,error}=await admin.rpc('create_utd_challenge',{p_user:user.id,p_email:email,p_digest:digest(code),p_ip_digest:ipDigest});
    if(error)return reply({error:error.message.includes('rate_limited')?'Please wait before requesting another code. You can send a new one after 60 seconds; hourly limits also apply.':'A code could not be requested. Please try again shortly.'},error.message.includes('rate_limited')?429:503);
    const payload={from:process.env.VERIFICATION_FROM,to:[email],subject:'Your CampusBridge verification code',text:`Your CampusBridge code is ${code}. It expires in 10 minutes. Enter it while signed in to the account that requested it. This confirms access to your UTD email; it does not change your login email. If you did not request this code, ignore this message.`};
    let accepted=false;
    for(let attempt=0;attempt<2;attempt++){
      try{
        const sent=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`utd-verification/${challenge}`},body:JSON.stringify(payload),signal:AbortSignal.timeout(8000)});
        if(sent.ok){accepted=true;break;}
        if(sent.status<500&&sent.status!==409)break;
      }catch{/* A timeout is ambiguous; retry only the identical body/idempotency key. */}
    }
    if(!accepted)return reply({error:'Email delivery could not be confirmed. If a code arrives, you can still enter it. Otherwise wait 60 seconds and request another.'},503);
    return reply({message:'Your code was sent to the email service. Check your UTD inbox and spam folder. It expires in 10 minutes.'});
  }catch{return reply({error:'Verification could not be completed. Please try again.'},400);}
}
