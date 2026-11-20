import {AppError} from './contracts.mjs';

export function accountConfiguration(){return {url:process.env.SUPABASE_URL||'',key:process.env.SUPABASE_PUBLISHABLE_KEY||'',secure:process.env.NODE_ENV==='production'};}
export function validAccountConfiguration({url='',key=''}={}){
 try{const u=new URL(url);if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash||!['','/'].includes(u.pathname)||!key||key.startsWith('sb_secret_'))return false;
  // An anon/publishable key is enough. Never accept an elevated service-role key.
  if(key.split('.').length===3&&JSON.parse(Buffer.from(key.split('.')[1],'base64url').toString()).role==='service_role')return false;
  return true;
 }catch{return false;}
}
export function createAccounts({url='',key='',secure=false,fetcher=fetch,now=Date.now,loginAttemptLimit=10}={}){
 const configured=validAccountConfiguration({url,key});const name=secure?'__Host-coach_session':'coach_session';const attempts=new Map();
 function ready(){if(!configured)throw new AppError(503,'AUTH_NOT_CONFIGURED','账号登录尚未配置完成，请联系管理员。');}
 function read(req){const pairs=(req.get('cookie')||'').split(';').map(x=>x.trim().split('='));const found=pairs.filter(x=>x[0]===name);if(found.length!==1)return '';try{const value=decodeURIComponent(found[0].slice(1).join('='));return value.length<=4096&&!/[\s\r\n]/.test(value)?value:'';}catch{return '';}}
 function write(res,token,maxAge){res.append('Set-Cookie',`${name}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure?'; Secure':''}`);}
 function clear(res){write(res,'',0);}
 function limited(req){const time=now();for(const [ip,v]of attempts)if(time-v.start>=900000)attempts.delete(ip);let s=attempts.get(req.ip);if(!s){if(attempts.size>=2000)throw new AppError(429,'AUTH_LIMIT','当前登录请求较多，请稍后再试。');s={start:time,count:0};attempts.set(req.ip,s);}if(++s.count>loginAttemptLimit)throw new AppError(429,'AUTH_LIMIT','登录尝试较多，请 15 分钟后再试。');}
 async function request(path,options={}){ready();try{const r=await fetcher(url.replace(/\/$/,'')+'/auth/v1'+path,{...options,headers:{apikey:key,'Content-Type':'application/json',...options.headers},signal:AbortSignal.timeout(10000)});if(r.status===429)throw new AppError(429,'AUTH_LIMIT','登录服务繁忙，请稍后再试。');if(r.status>=500)throw Error();let data=null;if(r.status!==204)try{data=await r.json();}catch{throw Error();}return {r,data};}catch(e){if(e instanceof AppError)throw e;throw new AppError(503,'AUTH_UNAVAILABLE','暂时无法连接账号服务，请稍后重试。');}}
 const safeUser=data=>data&&typeof data.id==='string'&&typeof data.email==='string'?{id:data.id,email:data.email}:null;
 async function login(req,res){ready();limited(req);const b=req.body;if(!b||Object.keys(b).some(k=>!['email','password'].includes(k))||typeof b.email!=='string'||b.email.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(b.email.trim())||typeof b.password!=='string'||!b.password||b.password.length>128)throw new AppError(400,'INVALID_CREDENTIALS','请填写有效邮箱和密码（密码最多 128 字符）。');
  const {r,data}=await request('/token?grant_type=password',{method:'POST',body:JSON.stringify({email:b.email.trim().toLowerCase(),password:b.password})});
  if(!r.ok)throw new AppError(401,'AUTH_INVALID','邮箱或密码不正确，或账号尚未开通。');
  const user=safeUser(data?.user);if(!user||typeof data.access_token!=='string'||data.access_token.length>4096||!Number.isFinite(data.expires_in)||data.expires_in<=0)throw new AppError(503,'AUTH_UNAVAILABLE','登录服务响应异常，请稍后重试。');
  write(res,data.access_token,Math.min(Math.floor(data.expires_in),3600));res.json({user});
 }
 async function authenticate(req,res,next){ready();const token=read(req);if(!token)throw new AppError(401,'ACCOUNT_REQUIRED','请先登录账号。');const {r,data}=await request('/user',{headers:{Authorization:'Bearer '+token}});if(!r.ok){if([400,401,403,404].includes(r.status)){clear(res);throw new AppError(401,'ACCOUNT_REQUIRED','登录已过期，请重新登录。');}throw new AppError(503,'AUTH_UNAVAILABLE','暂时无法验证登录状态，请稍后重试。');}const user=safeUser(data);if(!user)throw new AppError(503,'AUTH_UNAVAILABLE','登录服务响应异常，请稍后重试。');req.account=user;next();}
 async function logout(req,res){ready();const token=read(req);let remoteRevoked=!token;try{if(token){const {r}=await request('/logout?scope=local',{method:'POST',headers:{Authorization:'Bearer '+token}});remoteRevoked=r.ok;}}catch{/* Always remove the local session, even during a provider outage. */}clear(res);res.json({ok:true,remote_revoked:remoteRevoked});}
 return {configured,authenticate,login,logout};
}
