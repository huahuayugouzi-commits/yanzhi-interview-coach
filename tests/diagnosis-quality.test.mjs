import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {messages,trainingScene} from '../server/prompts.mjs';
import {diagnosisSchema,validateDiagnosisInput,validateOutput} from '../server/contracts.mjs';
import {model} from '../server/coach.mjs';

test('existing Golden and targeted quality inputs retain API compatibility (not semantic evaluation)',async()=>{
 for(const path of ['golden','natural','diagnosis-quality']){
  for(const c of JSON.parse(await fs.readFile(new URL(`./${path}.json`,import.meta.url),'utf8'))){
   const input={job_title:'AI 产品经理',job_description:c.jd||'负责产品设计与效果验证。',resume:'',question:c.question,answer:c.answer};
   assert.equal(validateDiagnosisInput(input),true,c.id);
   assert.deepEqual(JSON.parse(messages('diagnose',input,diagnosisSchema)[1].content),input);
  }
 }
});

test('framework, up to three keywords and a short reminder fit unchanged hint contract',async()=>{
 const input={job_title:'AI 产品经理',job_description:'负责用户需求与产品设计。',resume:'',question:'请介绍一个你负责的项目。',answer:'我负责Growth Copilot的工作流设计。'};
 // Hand-authored contract sample; this is not an AI response or quality verdict.
 const fixture={status:'needs_retry',heard:'你负责 Growth Copilot 工作流设计。',capability_focus:'将用户需求转化为产品设计',evidence_assessment:{level:'partial',reason:'职责已说明，设计如何回应用户问题尚未展开。'},main_issue:'工作流设计与用户痛点的联系尚未说明。',issue_impact:'目前无法判断设计是否服务于用户需求。',evidence_quote:'我负责Growth Copilot的工作流设计。',guiding_question:'你做过的一个设计动作回应了用户的什么问题？',retry_hints:['框架：用户问题→对应设计','关键词：创作者、工作流、需求','提示：选一个真实设计动作补充']};
 assert.deepEqual(validateOutput('diagnose',fixture,input),fixture);
 await model('diagnose',input,{config:{llmKey:'mock-only',llmBase:'https://example.test',llmModel:'mock'},fetcher:async(_u,o)=>{
  const body=JSON.parse(o.body);
  assert.deepEqual(JSON.parse(body.messages[1].content),input);
  assert.match(body.messages[0].content,/retry_hints=\[\]/);
  return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(fixture)}}]}));
 }});
 assert.doesNotThrow(()=>validateOutput('diagnose',{...fixture,status:'clear',evidence_assessment:{level:'sufficient',reason:'本题证据充分。'},main_issue:null,issue_impact:null,guiding_question:null,retry_hints:[]},input));
});

test('scenario and comparison instructions keep factual uncertainty and original-gap boundaries explicit',()=>{
 const professional=trainingScene('请回答一个与目标岗位相关的专业问题。');
 assert.match(professional,/合理争议/);
 assert.match(professional,/不要求个人项目/);
 const system=messages('compare',{question:'请介绍一个你负责的项目。'},{} )[0].content;
 assert.match(system,/不预设 Growth Copilot 必须问证据溯源/);
 assert.match(system,/不预设.*更简单/);
 assert.match(system,/不输出这些字段/);
 assert.match(system,/不换标准挑新问题/);
});
