import {createHash} from 'node:crypto';
import {AppError} from './contracts.mjs';
import {validAccountConfiguration} from './accounts.mjs';
export const inviteConfiguration=()=>({url:process.env.SUPABASE_URL||'',key:process.env.SUPABASE_PUBLISHABLE_KEY||'',gateway:process.env.INVITE_GATEWAY_SECRET||''});
export const validInviteConfiguration=c=>validAccountConfiguration(c)&&typeof c.gateway==='string'&&c.gateway.length>=32&&c.gateway.length<=256;
export const inviteHash=raw=>createHash('sha256').update(raw.trim().toUpperCase()).digest('hex');
const format=/^YZ-(?:[A-HJ-NP-Z2-9]{5}-){3}[A-HJ-NP-Z2-9]{5}$/;
export function createInvites({url='',key='',gateway='',fetcher=fetch,now=Date.now}={}){
 const configured=validInviteConfiguration({url,key,gateway});const attempts=new Map();
 function bad(req){let s=attempts.get(req.ip);if(!s){s={start:now(),count:0};attempts.set(req.ip,s);}s.count++;throw new AppError(401,'INVITE_INVALID','邀请码无效、已过期或已停用，请联系邀请人。');}
 function limit(req){const time=now();for(const [k,v] of attempts)if(time-v.start>=900000)attempts.delete(k);if(attempts.size>=2000&&!attempts.has(req.ip)||attempts.get(req.ip)?.count>=10)throw new AppError(429,'INVITE_LOCKED','邀请码尝试过多，请15分钟后再试。');}
 async function check(req,consume){
  if(!configured)throw new AppError(503,'INVITE_NOT_CONFIGURED','邀请码服务尚未配置，请联系管理员。');
  limit(req);const raw=(req.get('X-Access-Code')||'').trim().toUpperCase();if(raw.length>128||!format.test(raw))return bad(req);
  let data;try{const r=await fetcher(url.replace(/\/$/,'')+'/rest/v1/rpc/coach_invite_check',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({p_code_hash:inviteHash(raw),p_gateway:gateway,p_consume:consume}),signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error();data=await r.json();}catch{throw new AppError(503,'INVITE_UNAVAILABLE','邀请码核验暂时不可用，请稍后重试；本次没有调用AI。');}
  if(['invalid','expired','disabled'].includes(data?.status))return bad(req);
  if(data?.status==='exhausted')throw new AppError(429,'INVITE_EXHAUSTED','这个邀请码的调用额度已用完，请联系邀请人。');
  if(data?.status==='daily_limit')throw new AppError(429,'DAILY_LIMIT','今天的试用额度已用完，请明天再来。');
  if(data?.status!=='ok'||typeof data.id!=='string'||data.id.length>80||!Number.isInteger(data.remaining)||data.remaining<0||!Number.isFinite(Date.parse(data.expires_at)))throw new AppError(503,'INVITE_UNAVAILABLE','邀请码服务响应异常，请稍后重试；本次没有调用AI。');
  req.invite={id:data.id,remaining:data.remaining,expires_at:data.expires_at};
 }
 async function authenticate(req,_res,next){await check(req,false);next();}
 async function consume(req,res,next){await check(req,true);res.set('X-Invite-Remaining',String(req.invite.remaining));res.set('X-Invite-Expires',req.invite.expires_at);next();}
 return {authenticate,consume,configured};
}
