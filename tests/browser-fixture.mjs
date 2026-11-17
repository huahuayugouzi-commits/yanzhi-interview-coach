// Explicit test-only server. Production server/index.mjs never imports this file.
import express from 'express';
import fs from 'node:fs/promises';
import {createApp} from '../server/app.mjs';
const app=express();
app.get('/',async(_req,res)=>res.type('html').send((await fs.readFile('dist/index.html','utf8')).replace('<body>','<body><div>浏览器交互测试专用 · 所有诊断/转录为 MOCK · 非真实 AI 验收</div>')));
app.use(createApp({config:{llmKey:'test-only',asrKey:'test-only'},runModel:async(kind,input)=>kind==='diagnose'?input.answer.includes('嗯')?{status:'insufficient',heard:'目前没有足够有效的工作信息。',main_issue:'还没有说出一件具体工作。',evidence_quote:null,guiding_question:'能重新介绍一件具体的工作吗？',retry_hints:['具体工作']}:{status:'needs_retry',heard:'你协调了知识库接入。',main_issue:'还不清楚你亲自解决了什么接入问题。',evidence_quote:'协调知识库接入',guiding_question:'你亲自解决过什么接入问题？',retry_hints:['个人行动','具体结果']}:{status:'improved',clearer_information:['补充了梳理字段和确认问题的个人行动。'],capability_evidence:{assessment:'more_complete',explanation:'两次回答一起说明了具体贡献与验证结果。',first_quote:'协调知识库接入',second_quote:'我梳理了字段'},remaining_improvement:null},runASR:async()=>({text:'仅测试转录接口交互。'})}));
app.listen(3002,'127.0.0.1',()=>console.log('MOCK UI TEST ONLY http://127.0.0.1:3002'));
