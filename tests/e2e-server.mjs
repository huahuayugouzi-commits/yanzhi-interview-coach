import {createApp} from '../server/app.mjs';
const protectedMode=process.argv.includes('--protected');
const accountMode=process.argv.includes('--accounts');
const sessions=new Map();let sequence=0;
const fetcher=async(url,o={})=>{
 if(url.endsWith('/token?grant_type=password')){const {email,password}=JSON.parse(o.body);if(!['one@example.test','two@example.test'].includes(email)||password!=='test-password')return Response.json({msg:'invalid'},{status:400});const token='test-token-'+(++sequence);const user={id:email.startsWith('one')?'user-a':'user-b',email};sessions.set(token,user);return Response.json({access_token:token,refresh_token:'not-used',expires_in:3600,user});}
 const token=o.headers.Authorization?.replace('Bearer ','');if(url.endsWith('/logout?scope=local')){sessions.delete(token);return new Response(null,{status:204});}return Response.json(sessions.get(token)||{msg:'expired'},{status:sessions.has(token)?200:401});
};
// Multiple desktop/mobile cases share one local test IP. Production retains the default 10 attempts.
createApp({config:{},accessCode:protectedMode?'trial-test-code':'',trustProxy:false,authMode:accountMode?'supabase':'code',...(accountMode?{authConfig:{url:'https://auth.example.test',key:'mock-publishable',secure:false,fetcher,loginAttemptLimit:100}}:{})}).listen(accountMode?3005:protectedMode?3004:3003,'127.0.0.1');
