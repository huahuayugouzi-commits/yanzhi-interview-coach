import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../server/app.mjs';
import {messages} from '../server/prompts.mjs';
import {validateGuidanceInput,validateOutput} from '../server/contracts.mjs';
const first={job_title:'AI产品经理',job_description:'需求分析、产品设计与质量验证',resume:'',question:'请做一个自我介绍。',answer:'我独立设计检索助手，完成引用入口和内部审核验证。',guiding_question:null,supplement:'',capability_focus:'JD核心：需求分析、产品设计、验证；本题：产品落地',expression_advice:['前置检索助手的个人贡献与内部验证']};
const output={framework:['检索助手个人贡献','引用入口与内部审核验证'],keywords:['引用入口','内部审核'],reminder:'按已有事实组织，不需要背稿。',supporting_quotes:[{source:'answer',quote:'完成引用入口和内部审核验证'}]};
test('skip reuses null-question contract; unanswered follow-up still requires supplement',()=>{
 assert(validateGuidanceInput(first));assert(!validateGuidanceInput({...first,guiding_question:'你做了什么验证？'}));assert.deepEqual(validateOutput('guidance',output,first),output);
 assert.throws(()=>validateOutput('guidance',{...output,supporting_quotes:[{source:'supplement',quote:'假设已开展真实用户测试'}]},first),{code:'INVALID_EVIDENCE'});
});
test('skip payload reaches existing guidance API without pretending supplement was provided',async t=>{
 let calls=0;const s=createApp({config:{},accessCode:'',runModel:async(kind,input)=>{calls++;assert.equal(kind,'guidance');assert.deepEqual(input,first);return validateOutput(kind,output,input);}}).listen(0,'127.0.0.1');await new Promise(r=>s.once('listening',r));t.after(()=>new Promise(r=>{s.close(r);s.closeAllConnections();}));
 const r=await fetch('http://127.0.0.1:'+s.address().port+'/api/guidance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(first)});assert.equal(r.status,200);assert.deepEqual(await r.json(),output);assert.equal(calls,1);
});
test('necessary vs optional follow-up and open recall rules are present (not real model quality)',()=>{
 const d=messages('diagnose',first,{})[0].content;for(const text of ['完善当前题目回答所必需','延伸问题','只有前者','不预设用户必须采用某工具','必要证据确实不足时仍问一个','自我介绍优先岗位匹配'])assert(d.includes(text),text);
 const g=messages('guidance',first,{})[0].content;for(const text of ['可能选择跳过追问','未补充不等于原证据缺口已解决','不得要求先回答追问','不限定用户必须使用某工具'])assert(g.includes(text),text);
 const c=messages('compare',first,{})[0].content;assert(c.includes('不虚构追问已经得到回答'));
});
