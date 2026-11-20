import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {messages} from '../server/prompts.mjs';
import {diagnosisSchema,validateDiagnosisInput,validateOutput} from '../server/contracts.mjs';

const golden=JSON.parse(await fs.readFile(new URL('./golden.json',import.meta.url),'utf8'));
for(const c of golden.filter(c=>c.stage_expectations))test(`${c.id}: ${c.expected_class} (offline fixture/contract, not model quality)`,()=>{
 const input={job_title:'AI 产品经理',job_description:'负责产品方案、需求与阶段性验证。',resume:'',question:c.question,answer:c.answer};
 assert(validateDiagnosisInput(input));
 for(const fact of c.stage_expectations){assert(input.answer.includes(fact.quote));assert(['Completed','In Progress','Planned','Unknown'].includes(fact.state));}
 // Human-authored expectations only: do not present these as sampled model results.
 const reference={status:c.expected_status,heard:c.answer,capability_focus:'当前题目对应的阶段性证据',evidence_assessment:{level:c.expected_status==='clear'?'sufficient':'partial',reason:c.review_focus},main_issue:c.reference_issue,issue_impact:c.reference_issue?'尚未展开的信息影响当前题目的判断。':null,evidence_quote:c.reference_quote,guiding_question:c.reference_followup,retry_hints:[]};
 assert.doesNotThrow(()=>validateOutput('diagnose',reference,input));
 assert.deepEqual(JSON.parse(messages('diagnose',input,diagnosisSchema)[1].content),input);
 assert.equal(c.manual_review_status,'PENDING_REAL_MODEL_AND_HUMAN_REVIEW');
 assert.equal(c.review_dimensions.length,5);
});

test('all existing generation stages receive temporal boundaries without changing payloads',()=>{
 const c=golden.find(c=>c.id==='TC11');
 const input={job_title:'产品经理',job_description:'产品验证',resume:'',question:c.question,answer:c.answer,guiding_question:'内部测试的具体结果是什么？',supplement:'计划下月邀请用户，目前尚无反馈。',second_answer:'内部测试已完成，种子用户尚未开始。'};
 for(const kind of ['diagnose','guidance','compare']){
  const output=messages(kind,input,{});
  assert.deepEqual(JSON.parse(output[1].content),input);
  assert.match(output[0].content,/Completed（已完成）/);
  assert.match(output[0].content,/In Progress（进行中）/);
  assert.match(output[0].content,/Planned（计划中）/);
  assert.match(output[0].content,/Unknown（状态不明）/);
  assert.match(output[0].content,/不要给整个项目只贴一个阶段标签/);
  assert.match(output[0].content,/尚未开展的工作本身不是表达缺陷/);
  assert.match(output[0].content,/技术可行性、产品可用性、用户价值验证须分开/);
  assert.match(output[0].content,/已提到但未展开|已提及但未展开/);
 }
});
