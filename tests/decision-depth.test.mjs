import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {messages} from '../server/prompts.mjs';
import {diagnosisSchema,validateDiagnosisInput,validateOutput} from '../server/contracts.mjs';

const cases=JSON.parse(await fs.readFile(new URL('./decision-depth.json',import.meta.url),'utf8'));
for(const c of cases)test(`${c.id}: ${c.name} — input, authored contract and prompt policy only`,()=>{
 const input={job_title:'AI 产品经理',job_description:'负责用户需求分析、MVP规划、产品方案与验证。',resume:'',question:c.question,answer:c.answer};
 assert.equal(validateDiagnosisInput(input),true);
 const result={status:c.status,heard:c.answer,capability_focus:'本题对应的产品能力证据',evidence_assessment:{level:c.status==='clear'?'sufficient':'partial',reason:c.reason},main_issue:c.issue??null,issue_impact:c.issue?'该信息影响本题对应能力的判断。':null,evidence_quote:c.quote??null,guiding_question:c.followup??null,retry_hints:c.status==='clear'?[]:['框架：原话→待补信息','关键词：当前缺口','提示：只补当前追问']};
 // Explicitly hand-authored expectations, not sampled or scored AI outputs.
 assert.doesNotThrow(()=>validateOutput('diagnose',result,input));
 const m=messages('diagnose',input,diagnosisSchema);
 assert.deepEqual(JSON.parse(m[1].content),input);
 assert.match(m[0].content,/已提到但未展开/);
 assert.match(m[0].content,/完整项目介绍先看整体/);
 assert.match(m[0].content,/只有题目或原追问明确涉及技术实现/);
 assert.match(m[0].content,/不能把整段降格为职责清单/);
});
