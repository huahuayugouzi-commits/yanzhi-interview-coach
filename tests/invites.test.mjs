import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createApp} from '../server/app.mjs';
import {inviteHash,validInviteConfiguration} from '../server/invites.mjs';
const codeA='YZ-ABCDE-FGHJK-LMNPQ-RSTUV',codeB='YZ-VUTSR-QPNML-KJHGF-EDCBA';
const input={job_title:'',job_description:'需求分析',resume:'',question:'请做一个自我介绍。',answer:'我设计了需求梳理入口。'};
function database(limit=2){const records=new Map([[inviteHash(codeA),{id:'T01',remaining:limit,enabled:true,expired:false}],[inviteHash(codeB),{id:'T02',remaining:limit,enabled:true,expired:false}]]);const calls=[];let unavailable=false;let malformed=false;const fetcher=async(url,o)=>{const b=JSON.parse(o.body);calls.push({url,b,headers:o.headers});if(unavailable)throw Error('test outage');if(malformed)return Response.json({status:'ok',remaining:NaN});if(b.p_gateway!=='x'.repeat(64))return Response.json({status:'forbidden'});const r=records.get(b.p_code_hash);if(!r)return Response.json({status:'invalid'});if(!r.enabled)return Response.json({status:'disabled'});if(r.expired)return Response.json({status:'expired'});if(r.remaining<=0)return Response.json({status:'exhausted'});if(b.p_consume)r.remaining--;return Response.json({status:'ok',id:r.id,remaining:r.remaining,expires_at:'2027-01-01T00:00:00Z'});};return {records,calls,fetcher,fail:()=>{unavailable=true;},malform:()=>{malformed=true;}};}
async function start(t,db,extra={}){let count=0;const s=createApp({config:{},authMode:'invite',accessCode:'legacy-secret-code',inviteConfig:{url:'https://example.supabase.co',key:'mock-publishable',gateway:'x'.repeat(64),fetcher:db.fetcher},hourlyLimit:100,dailyLimit:100,runModel:async()=>{count++;return {mock:true};},runASR:async()=>{count++;return {text:'合成转录'};},...extra}).listen(0,'127.0.0.1');await new Promise(r=>s.once('listening',r));const close=()=>new Promise(r=>{s.close(r);s.closeAllConnections();});t.after(close);return {base:'http://127.0.0.1:'+s.address().port,count:()=>count,close};}
const post=(base,route,code=codeA,body=input)=>fetch(base+'/api/'+route,{method:'POST',headers:{'Content-Type':'application/json','X-Access-Code':code},body:JSON.stringify(body)});
test('invite mode requires configured persistent backend and cannot fall back to shared code',async t=>{
 const db=database();const s=await start(t,db);for(const code of ['', 'wrong', 'legacy-secret-code'])assert.equal((await post(s.base,'diagnose',code)).status,401);assert.equal(s.count(),0);assert.equal(db.calls.length,0);
 const h=await(await fetch(s.base+'/api/health')).json();assert.equal(h.auth_mode,'invite');assert.equal(h.access_required,true);assert(!JSON.stringify(h).includes('supabase.co'));assert(!JSON.stringify(h).includes('gateway'));
 const broken=await start(t,db,{inviteConfig:{}});assert.equal((await post(broken.base,'diagnose')).status,503);assert.equal(broken.count(),0);assert(!validInviteConfiguration({url:'http://example.com',key:'k',gateway:'x'.repeat(64)}));assert(!validInviteConfiguration({url:'https://example.com',key:'sb_secret_do_not_use',gateway:'x'.repeat(64)}));
});
test('independent quotas, authentication is free, valid requests reserve before model including failures',async t=>{
 const db=database();const s=await start(t,db);const login=await post(s.base,'access',codeA,{});assert.equal(login.status,200);assert.equal((await login.json()).invite.remaining,2);assert.equal(db.records.get(inviteHash(codeA)).remaining,2);
 const r=await post(s.base,'diagnose',codeA);assert.equal(r.status,200);assert.equal(r.headers.get('X-Invite-Remaining'),'1');assert.equal((await post(s.base,'diagnose',codeA)).status,200);assert.equal((await post(s.base,'diagnose',codeA)).status,429);assert.equal((await post(s.base,'diagnose',codeB)).status,200);assert.equal(s.count(),3);
 for(const c of db.calls){assert(!JSON.stringify(c.b).includes(codeA));assert.equal(c.b.p_gateway,'x'.repeat(64));assert(c.url.endsWith('/rest/v1/rpc/coach_invite_check'));}
});
test('expiry, revocation and store outages reject before a model call; invalid input does not debit',async t=>{
 const db=database();const s=await start(t,db);assert.equal((await post(s.base,'diagnose',codeA,{})).status,400);assert.equal(db.records.get(inviteHash(codeA)).remaining,2);
 db.records.get(inviteHash(codeA)).expired=true;assert.equal((await post(s.base,'access')).status,401);db.records.get(inviteHash(codeA)).expired=false;db.records.get(inviteHash(codeA)).enabled=false;assert.equal((await post(s.base,'diagnose')).status,401);db.fail();assert.equal((await post(s.base,'diagnose',codeB)).status,503);assert.equal(s.count(),0);
});
test('quota remains used across application recreation; mock concurrent final credits cannot overspend',async t=>{
 const db=database(2);const first=await start(t,db);assert.equal((await post(first.base,'diagnose')).status,200);const second=await start(t,db);const statuses=await Promise.all([post(second.base,'diagnose'),post(second.base,'diagnose'),post(second.base,'diagnose')].map(p=>p.then(r=>r.status)));assert.equal(statuses.filter(x=>x===200).length,1);assert.equal(db.records.get(inviteHash(codeA)).remaining,0);assert.equal(first.count()+second.count(),2);
});
test('provider failures consume a reserved request but never allow extra calls after quota',async t=>{
 const db=database(1);let calls=0;const s=await start(t,db,{runModel:async()=>{calls++;throw Error('mock upstream failure');}});const r=await post(s.base,'diagnose');assert.equal(r.status,500);assert.equal(r.headers.get('X-Invite-Remaining'),'0');assert.equal((await post(s.base,'diagnose')).status,429);assert.equal(calls,1);
});
test('ASR shares invitation quota; malformed audio does not debit',async t=>{
 const db=database(1);const s=await start(t,db);assert.equal((await post(s.base,'transcribe')).status,400);assert.equal(db.records.get(inviteHash(codeA)).remaining,1);const form=new FormData();form.append('audio',new Blob(['synthetic'],{type:'audio/webm'}),'mock.webm');const r=await fetch(s.base+'/api/transcribe',{method:'POST',headers:{'X-Access-Code':codeA},body:form});assert.equal(r.status,200);assert.equal(r.headers.get('X-Invite-Remaining'),'0');assert.equal((await post(s.base,'diagnose')).status,429);assert.equal(s.count(),1);
});
test('bad attempts are rate limited; malformed RPC cannot open access',async t=>{
 const db=database();const s=await start(t,db);for(let i=0;i<10;i++)assert.equal((await post(s.base,'access','bad')).status,401);assert.equal((await post(s.base,'access','bad')).status,429);assert.equal(db.calls.length,0);const db2=database();db2.malform();const broken=await start(t,db2);assert.equal((await post(broken.base,'diagnose')).status,503);assert.equal(broken.count(),0);
});
test('SQL permission/lock contract and generator keep secrets outside tracked source (static, not database execution)',async()=>{
 const sql=await fs.readFile(new URL('../supabase/invitations.sql',import.meta.url),'utf8');for(const rule of ['security definer set search_path=\'\'','enable row level security','revoke all on schema','revoke all on function','extensions.digest(p_gateway','for update','used=used+1','daily_used=daily_used+1'])assert(sql.includes(rule),rule);assert(sql.indexOf('select * into cfg')<sql.indexOf('select * into c from'));assert(!sql.includes('grant select'));const generator=await fs.readFile(new URL('../scripts/generate-invites.mjs',import.meta.url),'utf8');assert(generator.includes('randomBytes(20)'));assert(generator.includes("'work','invitations'"));assert.equal(inviteHash(codeA.toLowerCase()),inviteHash(codeA));assert.notEqual(inviteHash(codeA),inviteHash(codeB));
});

test('persistent daily denial and revocation between authentication and reservation stop model',async t=>{
 for(const status of ['daily_limit','disabled']){let n=0;const db=database();const original=db.fetcher;db.fetcher=async(u,o)=>{const b=JSON.parse(o.body);if(b.p_consume){n++;return Response.json({status});}return original(u,o);};const s=await start(t,db);const r=await post(s.base,'diagnose');assert.equal(r.status,status==='daily_limit'?429:401);assert.equal(s.count(),0);assert.equal(n,1);}
});
