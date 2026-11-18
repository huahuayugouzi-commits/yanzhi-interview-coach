import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../server/app.mjs';
import {model} from '../server/coach.mjs';
import {messages} from '../server/prompts.mjs';
import {validateGuidanceInput,validateOutput,guidanceSchema} from '../server/contracts.mjs';
const input={job_title:'产品经理',job_description:'需求分析与效果验证',resume:'',question:'请介绍一个你负责的项目。',answer:'我协调知识库接入。',guiding_question:'你亲自解决过什么问题？',supplement:'我补齐了权限字段。'};
const output={framework:['接入目标','补齐权限字段','已知验证结果（没有则说明）'],keywords:['知识库','权限字段'],reminder:'结合原回答与补充，用自己的话介绍项目。',supporting_quotes:[{source:'answer',quote:'协调知识库接入'},{source:'supplement',quote:'补齐了权限字段'}]};
async function server(t,options={}){const s=createApp(options).listen(0,'127.0.0.1');await new Promise(r=>s.once('listening',r));t.after(()=>new Promise(r=>{s.close(r);s.closeAllConnections();}));return 'http://127.0.0.1:'+s.address().port;}
const post=(base,body=input,code='')=>fetch(base+'/api/guidance',{method:'POST',headers:{'Content-Type':'application/json','X-Access-Code':code},body:JSON.stringify(body)});
test('guidance input requires supplement for a follow-up; clear practice may use first answer',()=>{
 assert(validateGuidanceInput(input));
 for(const supplement of ['', '  ', 'x'.repeat(16001)])assert(!validateGuidanceInput({...input,supplement}));
 assert(validateGuidanceInput({...input,guiding_question:null,supplement:''}));
 assert(!validateGuidanceInput({...input,second_answer:'must not be included'}));
});
test('guidance quotes are source-specific; supplement must be used; at most three keywords',()=>{
 assert.deepEqual(validateOutput('guidance',output,input),output);
 assert.throws(()=>validateOutput('guidance',{...output,keywords:['a','b','c','d']},input),{code:'INVALID_MODEL_OUTPUT'});
 assert.throws(()=>validateOutput('guidance',{...output,supporting_quotes:[{source:'supplement',quote:'协调知识库接入'}]},input),{code:'INVALID_EVIDENCE'});
 assert.throws(()=>validateOutput('guidance',{...output,supporting_quotes:[{source:'answer',quote:'协调知识库接入'}]},input),{code:'INVALID_EVIDENCE'});
});
test('new guidance API is authenticated, budgeted and passes exact supplemental context',async t=>{
 let calls=0;const base=await server(t,{accessCode:'trial-test-code',hourlyLimit:1,runModel:async(kind,data)=>{calls++;assert.equal(kind,'guidance');assert.deepEqual(data,input);return output;}});
 assert.equal((await post(base)).status,401);assert.equal(calls,0);
 assert.deepEqual(await(await post(base,input,'trial-test-code')).json(),output);
 assert.equal((await post(base,input,'trial-test-code')).status,429);assert.equal(calls,1);
});
test('guidance rejects missing supplement before model; no key is honest 503',async t=>{
 const base=await server(t,{config:{},accessCode:''});
 assert.equal((await post(base,{...input,supplement:''})).status,400);
 assert.equal((await post(base)).status,503);
});
test('mock model guidance uses dedicated schema, first answer and supplement without essay',async()=>{
 const result=await model('guidance',input,{config:{llmKey:'mock',llmBase:'https://example.test',llmModel:'mock'},fetcher:async(_u,o)=>{
  const body=JSON.parse(o.body);assert.deepEqual(JSON.parse(body.messages[1].content),input);
  assert.match(body.messages[0].content,/不替用户写完整答案/);assert.match(body.messages[0].content,/framework/);
  return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(output)}}]}));
 }});assert.deepEqual(result,output);
 const first=messages('diagnose',input,{} )[0].content;assert.match(first,/首次诊断只给反馈与必要时的一个追问/);
 assert(!messages('guidance',input,guidanceSchema)[0].content.includes('本轮是二次对比'));
});

test('guidance format repair stays in guidance schema instead of requesting diagnosis fields',async()=>{
 let calls=0;
 const result=await model('guidance',input,{config:{llmKey:'mock',llmBase:'https://example.test',llmModel:'mock'},fetcher:async(_u,o)=>{
  calls++;
  if(calls===2){const correction=JSON.parse(o.body).messages.at(-1).content;assert.match(correction,/不要生成诊断字段/);assert(!correction.includes('main_issue'));}
  return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(calls===1?{...output,keywords:['a','b','c','d']}:output)}}]}));
 }});
 assert.equal(calls,2);assert.deepEqual(result,output);
});
