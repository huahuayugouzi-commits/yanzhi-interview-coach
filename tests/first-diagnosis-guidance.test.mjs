import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createApp} from '../server/app.mjs';
import {model} from '../server/coach.mjs';
import {messages} from '../server/prompts.mjs';
import {diagnosisSchema,validateDiagnosis,validateDiagnosisInput,validateOutput,guidanceInputSchema,comparisonInputSchema} from '../server/contracts.mjs';
const cases=JSON.parse(await fs.readFile(new URL('./first-diagnosis-guidance.json',import.meta.url),'utf8'));
for(const c of cases)test(`${c.id}: ${c.name} — synthetic contract/API/Mock, not model quality`,async t=>{
 assert.equal(c.source,'SYNTHETIC');assert.equal(c.real_model_review,'PENDING');assert(validateDiagnosisInput(c.input));assert.deepEqual(validateOutput('diagnose',c.candidate,c.input),c.candidate);
 let modelRequests=0;const generated=await model('diagnose',c.input,{config:{llmKey:'mock',llmBase:'https://example.test',llmModel:'mock'},fetcher:async(_u,o)=>{modelRequests++;const body=JSON.parse(o.body);assert.deepEqual(JSON.parse(body.messages[1].content),c.input);assert.equal(body.response_format.type,'json_object');return Response.json({choices:[{message:{content:JSON.stringify(c.candidate)}}]});}});assert.equal(modelRequests,1);assert.deepEqual(generated,c.candidate);
 let requests=0;const s=createApp({config:{},accessCode:'',authMode:'code',runModel:async(kind,input)=>{requests++;assert.equal(kind,'diagnose');assert.deepEqual(input,c.input);return validateOutput(kind,c.candidate,input);}}).listen(0,'127.0.0.1');await new Promise(r=>s.once('listening',r));t.after(()=>new Promise(r=>{s.close(r);s.closeAllConnections();}));const r=await fetch('http://127.0.0.1:'+s.address().port+'/api/diagnose',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(c.input)});assert.equal(r.status,200);assert.deepEqual(await r.json(),c.candidate);assert.equal(requests,1);
});
test('legacy responses remain valid, new fields bounded and no-question routes cannot invent evidence tasks',()=>{
 const sample=cases.find(c=>c.id==='FD02').candidate;
 const {evidence_gap,thinking_hints,expression_advice,...legacy}=sample;assert(validateDiagnosis(legacy));
 for(const thinking_hints of [['只有一条'],['a','b','c','d','e'],['重复','重复'],['是什么？','其他'],['   ','依据'],['x'.repeat(81),'依据']])assert(!validateDiagnosis({...sample,thinking_hints}));
 assert(!validateDiagnosis({...sample,evidence_gap:'x'.repeat(201)}));
 const structure=cases[0].candidate;assert(validateDiagnosis(structure));assert(!validateDiagnosis({...structure,evidence_gap:'强制增加案例'}));assert(!validateDiagnosis({...structure,thinking_hints:['额外任务','额外结果']}));
 assert(!validateDiagnosis({...sample,unknown_framework:[]}));
 assert(!Object.hasOwn(guidanceInputSchema.properties,'thinking_hints'));assert(!Object.hasOwn(guidanceInputSchema.properties,'evidence_gap'));assert(!Object.hasOwn(comparisonInputSchema.properties,'expression_advice'));
});
test('external diagnosis schema stays equivalent to runtime schema',async()=>{const disk=JSON.parse(await fs.readFile(new URL('../schemas/diagnosis.schema.json',import.meta.url),'utf8'));delete disk.$schema;assert.deepEqual(disk,diagnosisSchema);});
test('prompt distinguishes the three frameworks and preserves one-focus truth and scene rules',()=>{
 const prompt=messages('diagnose',cases[0].input,diagnosisSchema)[0].content;
 for(const rule of ['表达优化框架 expression_advice','thinking_hints 是补充思路与追问回答思路的唯一共享列表','Guidance 重说框架','不把它们写成多个独立问题或要求用户逐项作答','不另生成','不得把用户未确认的内容写成已发生事实','首次诊断只给反馈与必要时的一个追问'])assert(prompt.includes(rule),rule);
 assert(prompt.includes('整体诊断尽量控制在600字内'));
 assert(messages('compare',cases[0].input,{} )[0].content.includes('evidence_gap、thinking_hints 等字段生成要求不适用于本轮'));
});
