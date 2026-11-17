import fs from 'node:fs/promises';
import {configuration,model} from '../server/coach.mjs';
const config=configuration(),cases=JSON.parse(await fs.readFile('tests/behavior.json','utf8'));
const base={job_title:'AI 产品经理',job_description:'负责需求分析、方案选择、跨团队协作与质量验证。',resume:''};
const report={run_at:new Date().toISOString(),note:'真实模型跨题型小样本；状态匹配不是语义准确率，须另行自审。',cases:[],comparisons:[]};
for(const c of cases){try{const output=await model('diagnose',{...base,question:c.question,answer:c.answer},{config});report.cases.push({...c,output});console.log(c.id,output.status,output.guiding_question);}catch(e){report.cases.push({...c,error:e.code});console.log(c.id,e.code);}}
for(const [id,second_answer] of [['decision-unresolved','后来研发接入后，回归测试通过，内部验收通过。'],['decision-resolved','我比较微调和检索，文档每周更新，而我们只有两周开发时间，所以先选能直接更新文档的检索方案，接受检索召回需要单独评估的代价。']]){try{const output=await model('compare',{...base,question:cases[0].question,answer:cases[0].answer,guiding_question:'当时你选择检索方案的依据是什么？',second_answer},{config});report.comparisons.push({id,output});console.log(id,output.capability_evidence.assessment);}catch(e){report.comparisons.push({id,error:e.code});}}
await fs.writeFile('docs/evaluation/behavior-upgrade.json',JSON.stringify(report,null,2)+'\n');
