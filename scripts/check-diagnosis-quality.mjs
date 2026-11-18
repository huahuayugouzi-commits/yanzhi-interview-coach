// Offline only: assemble comparable inputs and prompt snapshots; never call a model.
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {messages} from '../server/prompts.mjs';
import {messages as beforeMessages} from '../docs/evaluation/diagnosis-quality-before.mjs';
import {diagnosisSchema,validateDiagnosisInput} from '../server/contracts.mjs';
const read=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const golden=await read('tests/golden.json'),natural=await read('tests/natural.json'),targeted=await read('tests/diagnosis-quality.json');
const hash=x=>createHash('sha256').update(x).digest('hex');
const cases=[...golden,...natural,...targeted].map(c=>{
 const input={job_title:'AI 产品经理',job_description:c.jd||'负责需求分析、产品设计、跨团队协作和效果验证。',resume:'',question:c.question,answer:c.answer};
 if(!validateDiagnosisInput(input))throw Error('Invalid fixture: '+c.id);
 const before=beforeMessages('diagnose',input,diagnosisSchema),after=messages('diagnose',input,diagnosisSchema);
 if(before[1].content!==after[1].content)throw Error('Input changed: '+c.id);
 return {id:c.id,input,expected_status:c.expected_status??null,review_focus:c.review||c.review_focus||c.expected_class,
 provenance:c.provenance||'本地回归案例',before_prompt_sha256:hash(before[0].content),after_prompt_sha256:hash(after[0].content),
 before_output:c.before_excerpt?{source:'用户提供的历史片段；整理输入并非原始逐字稿，不构成配对基准',partial:true,output:c.before_excerpt}:null,
 after_output:null,execution:'NOT_RUN_NO_PAID_API_AUTHORIZATION',
 human_review:{status:'PENDING',factual_consistency:null,priority_selection:null,followup_specificity:null,naturalness:null,clear_when_sufficient:null,no_full_essay:null,notes:''}};
});
await fs.writeFile('docs/evaluation/diagnosis-quality-comparison.json',JSON.stringify({generated_at:new Date().toISOString(),mode:'OFFLINE_ONLY',real_model_calls:0,status:'AWAITING_MODEL_RUN_AND_HUMAN_REVIEW',note:'仅校验输入、提示词差异并准备人工复核。after_output=null 是未执行，不是通过；不计算准确率或提升。框架兼容性由手写契约样本测试，非真实生成质量。',cases},null,2)+'\n');
console.log(`Offline report: ${cases.length} inputs valid, before/after inputs identical; model calls=0; all semantic reviews pending.`);
