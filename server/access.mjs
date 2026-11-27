import {createHash,timingSafeEqual} from 'node:crypto';
import {AppError} from './contracts.mjs';
const hash=s=>createHash('sha256').update(s).digest();
export function createAccess({code='',hourly=20,daily=100,now=Date.now}={}){
 const ips=new Map();let globalDay='',used=0;
 function slot(ip){const time=now();for(const [key,v]of ips)if(time-v.start>3600000)ips.delete(key);if(!ips.has(ip)){if(ips.size>=2000)throw new AppError(429,'BUSY','当前请求较多，请稍后重试。');ips.set(ip,{start:time,attempts:0,calls:0});}return ips.get(ip);}
 function allowed(req){const value=req.get('X-Access-Code')||'';return !code||(value.length<=128&&timingSafeEqual(hash(value),hash(code)));}
 function authenticate(req,_res,next){if(allowed(req))return next();const s=slot(req.ip);s.attempts++;if(s.attempts>5)throw new AppError(429,'ACCESS_LOCKED','访问口令尝试过多，请一小时后再试。');throw new AppError(401,'ACCESS_REQUIRED','请输入正确的试用口令。');}
 function budget(req,_res,next){const slots=[slot(req.ip),...(req.account?[slot('account:'+req.account.id)]:[]),...(req.invite?[slot('invite:'+req.invite.id)]:[])];const day=new Date(now()).toISOString().slice(0,10);if(globalDay!==day){globalDay=day;used=0;}if(slots.some(s=>s.calls>=hourly))throw new AppError(429,'HOURLY_LIMIT','本小时训练次数已用完，请稍后再试。');if(used>=daily)throw new AppError(429,'DAILY_LIMIT','今天的试用额度已用完，请明天再来。');for(const s of slots)s.calls++;used++;next();}
 return {authenticate,budget,required:!!code};
}
