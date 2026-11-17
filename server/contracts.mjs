import Ajv from 'ajv';
const text=(maxLength=1000)=>({type:'string',minLength:1,maxLength,pattern:'\\S'});
const nullable=(max=1000)=>({anyOf:[text(max),{type:'null'}]});
const object=(properties)=>({type:'object',additionalProperties:false,required:Object.keys(properties),properties});
export const diagnosisSchema={...object({status:{enum:['needs_retry','clear','insufficient']},heard:text(),capability_focus:text(200),evidence_assessment:object({level:{enum:['sufficient','partial','insufficient']},reason:text(800)}),issue_impact:nullable(500),main_issue:nullable(),evidence_quote:nullable(2000),guiding_question:nullable(300),retry_hints:{type:'array',maxItems:3,uniqueItems:true,items:text(30)}}),allOf:[{if:{properties:{status:{const:'clear'}}},then:{properties:{evidence_assessment:{properties:{level:{const:'sufficient'}}},issue_impact:{type:'null'},main_issue:{type:'null'},guiding_question:{type:'null'},retry_hints:{maxItems:0}}}},{if:{properties:{status:{enum:['needs_retry','insufficient']}}},then:{properties:{main_issue:text(),guiding_question:text(300)}}}]};
export const comparisonSchema=object({status:{enum:['improved','unchanged','insufficient']},clearer_information:{type:'array',maxItems:3,items:text(500)},capability_evidence:object({assessment:{enum:['more_complete','partial','unchanged','insufficient']},explanation:text(800),first_quote:nullable(2000),second_quote:nullable(2000)}),remaining_improvement:nullable(800)});
const fields={job_title:{type:'string',maxLength:200},job_description:text(16000),resume:{type:'string',maxLength:20000},question:text(500),answer:text(16000)};
export const diagnosisInputSchema=object(fields);
export const comparisonInputSchema=object({...fields,second_answer:text(16000),guiding_question:nullable(300)});
const ajv=new Ajv({allErrors:true,strict:false});
export const validateDiagnosis=ajv.compile(diagnosisSchema);
export const validateComparison=ajv.compile(comparisonSchema);
export const validateDiagnosisInput=ajv.compile(diagnosisInputSchema);
export const validateComparisonInput=ajv.compile(comparisonInputSchema);
export class AppError extends Error {constructor(status,code,message){super(message);this.status=status;this.code=code;}}
export function validateOutput(kind,value,input){
 const valid=kind==='diagnose'?validateDiagnosis:validateComparison;
 if(!valid(value))throw new AppError(502,'INVALID_MODEL_OUTPUT','模型反馈格式不符合约定，请重试。');
 if(kind==='diagnose'&&value.status==='needs_retry'&&(!value.evidence_quote||!value.issue_impact||value.evidence_assessment.level==='sufficient'))throw new AppError(502,'INVALID_MODEL_OUTPUT','诊断缺少原文依据或缺口解释，请重试。');
 const quotes=kind==='diagnose'?[[value.evidence_quote,input.answer]]:[[value.capability_evidence.first_quote,input.answer],[value.capability_evidence.second_quote,input.second_answer]];
 if(quotes.some(([q,a])=>q!==null&&!a.includes(q)))throw new AppError(502,'INVALID_EVIDENCE','模型引用未出现在原回答中，请重试。');
 if(kind==='diagnose'&&value.guiding_question&&((value.guiding_question.match(/[?？]/g)||[]).length>1||(value.guiding_question.match(/什么|哪(?:一|个|些|部分)|怎么|怎样|如何|是否|多少/g)||[]).length>1))throw new AppError(502,'MULTIPLE_QUESTIONS','模型生成了多个追问，请重试。');
 if(kind==='diagnose'&&value.main_issue&&(value.main_issue.match(/什么|如何|怎样|怎么/g)||[]).length>1)throw new AppError(502,'MULTIPLE_ISSUES','模型同时列出了多个信息缺口，请重试。');
 return value;
}
