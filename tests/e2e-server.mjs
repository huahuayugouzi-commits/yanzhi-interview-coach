import {createApp} from '../server/app.mjs';
const protectedMode=process.argv.includes('--protected');
const inviteMode=process.argv.includes('--invites');
const inviteQuota=new Map();
const inviteFetcher=async(_url,o)=>{const b=JSON.parse(o.body);if(b.p_gateway!=='test-gateway-secret-'.repeat(3))return Response.json({status:'forbidden'});const {inviteHash}=await import('../server/invites.mjs');const ids=new Map([[inviteHash('YZ-ABCDE-FGHJK-LMNPQ-RSTUV'),'T01'],[inviteHash('YZ-VUTSR-QPNML-KJHGF-EDCBA'),'T02'],[inviteHash('YZ-AAAAA-BBBBB-CCCCC-DDDDD'),'T03'],[inviteHash('YZ-DDDDD-CCCCC-BBBBB-AAAAA'),'T04']]);const id=ids.get(b.p_code_hash);if(!id)return Response.json({status:'invalid'});const used=inviteQuota.get(id)||0;if(used>=2)return Response.json({status:'exhausted'});if(b.p_consume)inviteQuota.set(id,used+1);return Response.json({status:'ok',id,remaining:2-(inviteQuota.get(id)||0),expires_at:'2027-01-01T00:00:00Z'});};
const accountMode=process.argv.includes('--accounts');
const sessions=new Map();let sequence=0;
const fetcher=async(url,o={})=>{
 if(url.endsWith('/token?grant_type=password')){const {email,password}=JSON.parse(o.body);if(!['one@example.test','two@example.test'].includes(email)||password!=='test-password')return Response.json({msg:'invalid'},{status:400});const token='test-token-'+(++sequence);const user={id:email.startsWith('one')?'user-a':'user-b',email};sessions.set(token,user);return Response.json({access_token:token,refresh_token:'not-used',expires_in:3600,user});}
 const token=o.headers.Authorization?.replace('Bearer ','');if(url.endsWith('/logout?scope=local')){sessions.delete(token);return new Response(null,{status:204});}return Response.json(sessions.get(token)||{msg:'expired'},{status:sessions.has(token)?200:401});
};
// Multiple desktop/mobile cases share one local test IP. Production retains the default 10 attempts.
createApp({config:{},accessCode:protectedMode?'trial-test-code':'',trustProxy:false,authMode:inviteMode?'invite':accountMode?'supabase':'code',...(inviteMode?{inviteConfig:{url:'https://invite.example.test',key:'mock-publishable',gateway:'test-gateway-secret-'.repeat(3),fetcher:inviteFetcher}}:{}),...(accountMode?{authConfig:{url:'https://auth.example.test',key:'mock-publishable',secure:false,fetcher,loginAttemptLimit:100}}:{})}).listen(inviteMode?3006:accountMode?3005:protectedMode?3004:3003,'127.0.0.1');
