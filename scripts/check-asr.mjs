import fs from 'node:fs/promises';
import {transcribe} from '../server/coach.mjs';
const report={at:new Date().toISOString(),source:'Windows synthesized Chinese speech, no user voice',reference:'我负责梳理需求，协调研发修复问题，并在上线前完成测试。'};
try{const buffer=await fs.readFile('work/asr-check.wav');const r=await transcribe({buffer,mimetype:'audio/wav',originalname:'synthetic-test.wav'});report.text=r.text;report.passed=['需求','研发','测试'].every(x=>r.text.includes(x));report.status=report.passed?'PASSED_SYNTHETIC_AUDIO':'REVIEW_REQUIRED';}catch(e){report.status='FAILED';report.code=e.code;report.error=e.message;}
await fs.writeFile('docs/evaluation/asr.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
