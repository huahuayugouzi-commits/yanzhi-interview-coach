import fs from 'node:fs/promises';
import {configuration,model} from '../server/coach.mjs';
const config=configuration();
await fs.mkdir('docs/evaluation',{recursive:true});
if(!config.llmKey){const report={run_at:new Date().toISOString(),status:'SKIPPED',reason:'LLM_API_KEY not configured',real_model_calls:0,schema_acceptance:'NOT VERIFIED',factuality:'NOT VERIFIED',classification_accuracy:'NOT VERIFIED',natural_conversation:'NOT VERIFIED'};await fs.writeFile('docs/evaluation/latest.json',JSON.stringify(report,null,2));console.log('SKIPPED: 请在 .env 中配置 LLM_API_KEY；没有调用模型，没有宣称 AI 验收通过。');process.exit(0);}
const golden=JSON.parse(await fs.readFile('tests/golden.json','utf8'));
const natural=JSON.parse(await fs.readFile('tests/natural.json','utf8'));
const report={run_at:new Date().toISOString(),model:config.llmModel,status:'RUNNING',note:'真实模型调用；引文和 Schema 自动校验。分类、事实忠实度、单一缺口和自然感必须人工审核，禁止把状态符合当作分类准确。',cases:[],comparison:null};
for(const c of [...golden,...natural]){
 const input={job_title:'AI 产品经理',job_description:'AI 产品经理，负责需求分析、产品设计、跨团队协作、产品上线及效果验证。',resume:'',question:c.question,answer:c.answer};
 const row={...c,input,manual_review:{actual_class:null,no_fabrication:null,one_main_issue:null,one_natural_question:null,specific_and_non_template:null,notes:''}};
 try{row.output=await model('diagnose',input,{config});row.schema_and_quotes_valid=true;row.status_matches=c.expected_status?row.output.status===c.expected_status:null;console.log(c.id,'response validated');}catch(e){row.schema_and_quotes_valid=false;row.error=e.message;console.log(c.id,'FAILED',e.code||'ERROR');}
 report.cases.push(row);await fs.writeFile('docs/evaluation/latest.json',JSON.stringify(report,null,2));
}
try{report.comparison=await model('compare',{job_title:'AI 产品经理',job_description:'负责跨团队协作、产品上线及效果验证。',resume:'',question:'介绍一个你负责的项目。',answer:'我们做了知识库接入，我负责和研发协调。',guiding_question:'你亲自解决过什么接入问题？',second_answer:'我逐项整理了业务字段，发现权限字段遗漏，和研发确认后补齐，并用测试账号验证通过。'},{config});}catch(e){report.comparison={error:e.message};}
report.status='MANUAL_REVIEW_REQUIRED';report.schema_valid_count=report.cases.filter(c=>c.schema_and_quotes_valid).length;report.expected_status_match_count=report.cases.filter(c=>c.status_matches).length;
await fs.writeFile('docs/evaluation/latest.json',JSON.stringify(report,null,2));console.log('真实调用结束。请人工审核 docs/evaluation/latest.json 中事实、分类、单一追问及自然感；当前尚不宣称完整验收通过。');
