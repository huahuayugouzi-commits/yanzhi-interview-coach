import {AppError,diagnosisSchema,comparisonSchema,validateOutput} from './contracts.mjs';
import {messages} from './prompts.mjs';
export const configuration=()=>({llmKey:process.env.LLM_API_KEY,llmBase:process.env.LLM_BASE_URL||'https://api.deepseek.com',llmModel:process.env.LLM_MODEL||'deepseek-chat',asrKey:process.env.ASR_API_KEY,asrBase:process.env.ASR_BASE_URL||'https://api.openai.com/v1',asrModel:process.env.ASR_MODEL||'whisper-1'});
function endpoint(base,path){const u=new URL(base);if(!['https:','http:'].includes(u.protocol))throw new AppError(503,'CONFIG_ERROR','服务地址配置无效。');return base.replace(/\/+$/,'')+'/'+path;}
export async function model(kind,input,{config=configuration(),fetcher=fetch}={}){
 if(!config.llmKey)throw new AppError(503,'LLM_NOT_CONFIGURED','AI 服务尚未配置。请在服务端 .env 填写 LLM_API_KEY 后重启；你的回答仍保留在页面。');
 const history=messages(kind,input,kind==='diagnose'?diagnosisSchema:comparisonSchema);
 for(let attempt=0;attempt<2;attempt++)try{
  const response=await fetcher(endpoint(config.llmBase,'chat/completions'),{method:'POST',headers:{Authorization:`Bearer ${config.llmKey}`,'Content-Type':'application/json'},body:JSON.stringify({model:config.llmModel,temperature:0.2,max_tokens:1800,response_format:{type:'json_object'},messages:history}),signal:AbortSignal.timeout(25000)});
  if(!response.ok)throw new AppError(502,'MODEL_UNAVAILABLE',response.status===429?'模型服务繁忙或额度受限，请稍后重试。':'模型服务请求失败，请检查服务端配置后重试。');
  let value;try{value=JSON.parse((await response.json()).choices[0].message.content);}catch{throw new AppError(502,'INVALID_MODEL_OUTPUT','模型没有返回有效 JSON，请重试。');}
  return validateOutput(kind,value,input);
 }catch(e){if(attempt===0&&['INVALID_MODEL_OUTPUT','INVALID_EVIDENCE','MULTIPLE_QUESTIONS','MULTIPLE_ISSUES'].includes(e.code)){history.push({role:'system',content:'前一响应未通过服务端校验：'+e.code+'。重新分析原输入，严格输出所给 JSON Schema；引用必须连续原文或 null。main_issue 只保留一个缺口，追问只索取对应的一种信息，不得将背景、行动、结果连在一起问，避免任何复合问句。不要输出对校验错误的解释。'});continue;}if(e instanceof AppError)throw e;throw new AppError(502,'MODEL_CONNECTION','无法连接模型服务或请求超时，请稍后重试。');}
}
export async function transcribe(file,{config=configuration(),fetcher=fetch}={}){
 if(!config.asrKey)throw new AppError(503,'ASR_NOT_CONFIGURED','语音转录尚未配置。可以听取录音后手动输入回答，继续完整训练。');
 const form=new FormData();form.append('file',new Blob([file.buffer],{type:file.mimetype}),file.originalname);form.append('model',config.asrModel);form.append('language','zh');
 try{const r=await fetcher(endpoint(config.asrBase,'audio/transcriptions'),{method:'POST',headers:{Authorization:`Bearer ${config.asrKey}`},body:form,signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error();const value=await r.json();if(typeof value.text!=='string'||!value.text.trim()||value.text.length>16000)throw Error();return {text:value.text};}catch{throw new AppError(502,'ASR_FAILED','转录失败，请重试或手动输入回答。');}
}
