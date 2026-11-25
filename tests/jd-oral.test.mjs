import {test} from 'node:test';
import assert from 'node:assert/strict';
import {messages} from '../server/prompts.mjs';
import {model} from '../server/coach.mjs';
import {validateGuidanceInput,validateComparisonInput} from '../server/contracts.mjs';
const input={job_title:'产品经理',job_description:'需求分析、产品设计、效果验证',resume:'负责用户访谈',question:'请做一个自我介绍。',answer:'我设计了检索入口并完成内部验证。',guiding_question:null};
const focus='JD核心：需求分析、产品设计、效果验证；本题重点：产品设计及已有验证证据';
test('optional capability snapshot keeps old inputs valid and bounded',()=>{
 for(const [validate,extra] of [[validateGuidanceInput,{supplement:''}],[validateComparisonInput,{second_answer:'我设计检索入口，内部验证可以核对引用。'}]]){
  assert(validate({...input,...extra}));assert(validate({...input,...extra,capability_focus:focus}));
  for(const invalid of ['',null,'x'.repeat(201),['能力']])assert(!validate({...input,...extra,capability_focus:invalid}));
 }
});
test('JD/oral/Compare prompt regression rules (not real model evaluation)',()=>{
 for(const kind of ['diagnose','guidance','compare']){const p=messages(kind,{...input,capability_focus:focus},{})[0].content;for(const rule of ['最多三项','简历','正常口语','语速、停顿、语调','不生成完整稿件'])assert(p.includes(rule),kind+rule);}
 const d=messages('diagnose',input,{})[0].content;for(const rule of ['不要求每道题覆盖全部','本题能力焦点','口头回答'])assert(d.includes(rule));
 const c=messages('compare',input,{})[0].content;for(const rule of ['岗位匹配度','能力证据与说服力','表达逻辑与重点','口语自然度','更长、更书面化','更接近 AI 框架','不重新选择'])assert(c.includes(rule),rule);
});
test('Guidance and Compare transport preserve the same snapshot with mock outputs',async()=>{
 for(const kind of ['guidance','compare']){const payload={...input,capability_focus:focus,...(kind==='guidance'?{supplement:''}:{second_answer:'我设计检索入口。'})};
 const output=kind==='guidance'?{framework:['检索入口与内部验证'],keywords:['引用核对'],reminder:'记住要点自然表达。',supporting_quotes:[{source:'answer',quote:'检索入口'}]}:{status:'unchanged',clearer_information:[],capability_evidence:{assessment:'unchanged',explanation:'表达缩短但未新增证据，不把长度作为进步依据。',first_quote:'检索入口',second_quote:'检索入口'},remaining_improvement:null};
 const result=await model(kind,payload,{config:{llmKey:'mock',llmBase:'https://example.test',llmModel:'mock'},fetcher:async(_u,o)=>{const body=JSON.parse(o.body);assert.equal(JSON.parse(body.messages[1].content).capability_focus,focus);return Response.json({choices:[{message:{content:JSON.stringify(output)}}]});}});assert.deepEqual(result,output);}
});

const regressions=[
 {id:'JD-SPARSE',kind:'diagnose',jd:'协助团队日常工作',answer:'我负责整理每周需求。',rule:'信息不足可少于三项',review:'不凑出三项能力、不强制覆盖全部。'},
 {id:'RESUME-ONLY',kind:'diagnose',jd:'用户研究与产品验证',answer:'我对用户研究比较熟悉。',resume:'完成8次用户访谈并整理需求。',rule:'简历写过不代表面试官这次听到了',review:'不得把简历访谈数量写进已表达信息。'},
 {id:'ORAL-NORMAL',kind:'guidance',jd:'产品设计',answer:'我先看大家卡在哪里，再改了入口。内部同事能找到引用了。',rule:'不将正常口语',review:'保留自然说法，不强迫替换成术语。'},
 {id:'LONGER-NOT-BETTER',kind:'compare',jd:'产品设计',answer:'我改了引用入口，内部审核可核对来源。',second:'本人通过多维赋能持续推动高质量的产品全链路闭环建设。',rule:'更长、更书面化',review:'泛化扩写失去事实，不能因措辞正式判进步。'},
 {id:'SHORTER-CLEARER',kind:'compare',jd:'产品设计',answer:'我做入口，我还负责入口，入口是我改的，内部审核能核对引用。',second:'我改了引用入口，内部审核能核对来源。',rule:'证据保持而重点更清楚',review:'可认可聚焦改善，但不可虚构新增能力证据。'},
 {id:'ASR-TEXT-ONLY',kind:'compare',jd:'产品验证',answer:'嗯我完成了测试。',second:'我完成了内部权限验证。',rule:'不得推断语速、停顿、语调或自信程度',review:'仅判断文本，不评价声音或心理。'}
];
for(const c of regressions)test(`${c.id}: synthetic input/prompt guard only; semantic review pending`,()=>{
 const payload={...input,job_description:c.jd,answer:c.answer,resume:c.resume??'',...(c.kind==='compare'?{second_answer:c.second,capability_focus:focus}:c.kind==='guidance'?{supplement:'',capability_focus:focus}:{})};
 const m=messages(c.kind,payload,{});assert.deepEqual(JSON.parse(m[1].content),payload);assert(m[0].content.includes(c.rule));assert(c.review);
});
