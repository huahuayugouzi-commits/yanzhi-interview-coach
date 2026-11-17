import fs from 'node:fs/promises';
import {configuration,model} from '../server/coach.mjs';
const config=configuration();
const common={job_title:'AI 产品经理',job_description:'负责需求分析、产品设计、AI 工作流、质量评估和跨团队协作。',resume:'',question:'请介绍一个你负责的项目。'};
const cases=[
{id:'work-list',expected:'needs_retry',answer:'我负责 Growth Copilot 项目，面向小红书知识型创作者，解决选题难、内容吸引力不足和持续创作成本高。我负责需求分析、MVP规划、PRD、Prompt、结构化输出与证据溯源，基于开源项目二次开发，用Codex推进实现，设计Bad Case回归测试。针对选题同质化和幻觉分别给出方案，V0.1完成端到端验证和自动化回归测试，下一步种子用户测试。'},
{id:'specific-internal',expected:'clear',answer:'我负责知识库接入。测试账号读不到受限文档，我逐项核对请求字段，发现缺少权限字段。我补齐字段，与研发确认鉴权逻辑，随后用有权限和无权限两个测试账号复测，前者正常读取，后者仍被拒绝，内部验收通过。尚未上线给真实用户。'},
{id:'empty',expected:'insufficient',answer:'嗯，那个，嗯。'},
{id:'unsupported-result',expected:'needs_retry',answer:'我做了AI写作助手，主要负责Prompt和PRD，效果很好，用户很满意。'},
{id:'qualitative-result',expected:'clear',answer:'我负责客服知识库的引用展示。客服反馈答案找不到出处，我把来源链接和原文片段放在每条结论下，并针对过期文档增加提示。在内部试用中，客服能点击原文核对，指出的两条过期引用也被替换。还没有上线数据。'}];
const report={run_at:new Date().toISOString(),note:'真实模型小样本；语义审核为 Codex 自审，不代表用户验证。',cases:[],comparisons:[]};
for(const c of cases){try{const output=await model('diagnose',{...common,answer:c.answer},{config});report.cases.push({...c,output});console.log(c.id,output.status,output.guiding_question);}catch(e){report.cases.push({...c,error:e.code});console.log(c.id,e.code);}}
for(const [id,second_answer] of [['resolved','我发现权限字段遗漏，亲自补齐字段，与研发确认后使用有权限和无权限两个测试账号复测，读取和拦截都符合预期。'],['repeated','我主要就是协调研发，积极推动知识库接入。']]){try{const output=await model('compare',{...common,answer:'我负责和研发协调知识库接入。',guiding_question:'你亲自解决过什么接入问题？',second_answer},{config});report.comparisons.push({id,second_answer,output});console.log(id,output.capability_evidence.assessment);}catch(e){report.comparisons.push({id,error:e.code});}}
await fs.writeFile('docs/evaluation/evidence-upgrade.json',JSON.stringify(report,null,2));
