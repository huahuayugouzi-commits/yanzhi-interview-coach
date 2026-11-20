import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {messages} from '../server/prompts.mjs';
import {guidanceSchema,validateGuidanceInput,validateOutput} from '../server/contracts.mjs';
import {model} from '../server/coach.mjs';

const cases=JSON.parse(await fs.readFile(new URL('./guidance-quality.json',import.meta.url),'utf8'));
for(const c of cases)test(`${c.id}: ${c.type} — authored candidate contract and mock transport only`,async()=>{
 assert(validateGuidanceInput(c.input));
 assert.deepEqual(validateOutput('guidance',c.candidate,c.input),c.candidate);
 assert(c.candidate.framework.length<=4);
 assert(c.candidate.keywords.length<=3);
 assert.equal(c.real_model_review,'PENDING');
 let calls=0;
 const result=await model('guidance',c.input,{config:{llmKey:'mock-only',llmBase:'https://example.test',llmModel:'mock'},fetcher:async(_u,o)=>{
  calls++;const body=JSON.parse(o.body);
  assert.deepEqual(JSON.parse(body.messages[1].content),c.input);
  const prompt=body.messages[0].content;
  for(const term of ['局部补强','整体重组','单题深入回答','不自动以补充覆盖原答','不重复','保留原结构'])assert(prompt.includes(term));
  return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(c.candidate)}}]}));
 }});
 assert.equal(calls,1);assert.deepEqual(result,c.candidate);
});

test('specific guidance instructions stay out of diagnosis and comparison prompts',()=>{
 const marker='程序校验不自动等于已成功拦截';
 assert(messages('guidance',cases[0].input,guidanceSchema)[0].content.includes(marker));
 assert(!messages('diagnose',cases[0].input,{})[0].content.includes(marker));
 assert(!messages('compare',cases[0].input,{})[0].content.includes(marker));
});
